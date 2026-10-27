import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt } from "@/lib/prompt";
import { parseOverride } from "@/lib/agenda";
import { clientIp, EFFORT, jsonError, MODEL, rateLimit, tooFast } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIMIT = Number(process.env.HECKR_RATE_LIMIT) || 20;
const WINDOW_MS = (Number(process.env.HECKR_RATE_WINDOW_MINUTES) || 10) * 60_000;
const MAX_MESSAGE_CHARS = 1000;
const MAX_HISTORY = 12; // last N turns sent to the model
const MAX_TOTAL_CHARS = 12_000;

const json = jsonError;

type Msg = { role: "user" | "assistant"; content: string };

function validate(body: unknown): { messages: Msg[]; time: string | null } | string {
  if (!body || typeof body !== "object") return "Bad request.";
  const { messages, time } = body as { messages?: unknown; time?: unknown };
  if (!Array.isArray(messages) || messages.length === 0) return "No message sent.";

  const clean: Msg[] = [];
  for (const m of messages.slice(-MAX_HISTORY)) {
    if (!m || typeof m !== "object") return "Bad message.";
    const { role, content } = m as { role?: unknown; content?: unknown };
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") return "Bad message.";
    const text = content.trim().slice(0, role === "assistant" ? 4000 : MAX_MESSAGE_CHARS + 1);
    if (!text) continue;
    clean.push({ role, content: text });
  }
  // Model requires the conversation to start with a user turn and alternate.
  while (clean.length && clean[0].role !== "user") clean.shift();
  const merged: Msg[] = [];
  for (const m of clean) {
    const last = merged.at(-1);
    if (last && last.role === m.role) last.content += "\n\n" + m.content;
    else merged.push({ ...m });
  }
  const lastMsg = merged.at(-1);
  if (!lastMsg || lastMsg.role !== "user") return "No message sent.";
  if (lastMsg.content.length > MAX_MESSAGE_CHARS)
    return `That message is a bit long. Keep it under ${MAX_MESSAGE_CHARS} characters, or paste just the error and the few lines around it.`;
  if (merged.reduce((n, m) => n + m.content.length, 0) > MAX_TOTAL_CHARS)
    return "This chat has got long. Tap 'New chat' to start fresh.";

  return { messages: merged, time: typeof time === "string" ? time : null };
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return json(503, "Heckr isn't switched on yet. Ask an organiser in the room.");
  }

  const rl = rateLimit(`chat:${clientIp(req)}`, LIMIT, WINDOW_MS);
  if (!rl.ok) return tooFast(rl.retryAfter);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json(400, "Bad request.");
  }
  const v = validate(body);
  if (typeof v === "string") return json(400, v);

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const res = await client.messages.create({
          model: MODEL,
          // Haiku 5.5 thinks by default and thinking counts toward max_tokens,
          // so leave headroom; the prompt keeps visible replies short.
          max_tokens: 4000,
          output_config: { effort: EFFORT },
          system: buildSystemPrompt(parseOverride(v.time)),
          messages: v.messages,
          stream: true,
        });
        for await (const ev of res) {
          if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(ev.delta.text));
          }
        }
      } catch (err) {
        console.error("Heckr API error:", err instanceof Error ? err.message : err);
        controller.enqueue(
          encoder.encode("\n\n[[heckr-error]]Heckr hit a snag reaching the model. Try again in a moment, or ask an organiser in the room."),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
