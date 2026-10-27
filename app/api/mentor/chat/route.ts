import Anthropic from "@anthropic-ai/sdk";
import { parseOverride } from "@/lib/agenda";
import { agentById } from "@/lib/mentor/catalogue";
import { buildMentorSystem, type FocusStep } from "@/lib/mentor/prompts";
import { ProfileSchema } from "@/lib/mentor/types";
import { clientIp, EFFORT, jsonError, MODEL, rateLimit, tooFast } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const LIMIT = Number(process.env.HECKR_MENTOR_LIMIT) || 40;
const WINDOW_MS = 10 * 60_000;
const MAX_TEXT = 2000;
const MAX_HISTORY = 16;
const MAX_IMAGES = 2; // only the latest screenshots go to the model
const MAX_IMAGE_B64 = 1_600_000; // about 1.2 MB once decoded
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
type ImageType = (typeof IMAGE_TYPES)[number];

const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
const ERROR_MARKER = "[[heckr-error]]";

type InMsg = { role: "user" | "assistant"; content: string; image?: string };

function parseImage(dataUrl: string): { media_type: ImageType; data: string } | null {
  const m = /^data:(image\/[a-z]+);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!m || !IMAGE_TYPES.includes(m[1] as ImageType) || m[2].length > MAX_IMAGE_B64) return null;
  return { media_type: m[1] as ImageType, data: m[2] };
}

function toApiMessages(raw: unknown): Anthropic.MessageParam[] | string {
  if (!Array.isArray(raw) || raw.length === 0) return "No message sent.";
  const clean: InMsg[] = [];
  for (const m of raw.slice(-MAX_HISTORY)) {
    if (!m || typeof m !== "object") return "Bad message.";
    const { role, content, image } = m as Record<string, unknown>;
    if (role !== "user" && role !== "assistant") return "Bad message.";
    const text = str(content, role === "assistant" ? 6000 : MAX_TEXT + 1).split(ERROR_MARKER)[0].trim();
    const img = role === "user" && typeof image === "string" ? image : undefined;
    if (!text && !img) continue;
    clean.push({ role, content: text, image: img });
  }
  while (clean.length && clean[0].role !== "user") clean.shift();
  const last = clean.at(-1);
  if (!last || last.role !== "user") return "No message sent.";
  if (last.content.length > MAX_TEXT) return `Keep messages under ${MAX_TEXT} characters. For errors, paste the error and a few lines around it, or send a screenshot.`;

  // Keep only the newest screenshots; older ones become a short note to save tokens.
  let imagesLeft = MAX_IMAGES;
  const withImages = [...clean].reverse().map((m) => {
    if (!m.image) return m;
    if (imagesLeft > 0) {
      imagesLeft--;
      return m;
    }
    return { ...m, image: undefined, content: `[earlier screenshot]\n${m.content}` };
  }).reverse();

  const out: Anthropic.MessageParam[] = [];
  for (const m of withImages) {
    const blocks: Anthropic.ContentBlockParam[] = [];
    if (m.image) {
      const img = parseImage(m.image);
      if (!img) return "That image couldn't be read. Try a PNG or JPEG screenshot.";
      blocks.push({ type: "image", source: { type: "base64", ...img } });
    }
    blocks.push({ type: "text", text: m.content || "Here's a screenshot. What's going on?" });
    const prev = out.at(-1);
    if (prev && prev.role === m.role && Array.isArray(prev.content)) prev.content.push(...blocks);
    else out.push({ role: m.role, content: blocks });
  }
  return out;
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return jsonError(503, "Heckr isn't switched on yet. Ask an organiser in the room.");
  }
  const rl = rateLimit(`mentor:${clientIp(req)}`, LIMIT, WINDOW_MS);
  if (!rl.ok) return tooFast(rl.retryAfter);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "Bad request.");
  }

  const profile = ProfileSchema.safeParse(body.profile);
  if (!profile.success) return jsonError(400, "This project is missing its setup answers. Start a new build.");
  const messages = toApiMessages(body.messages);
  if (typeof messages === "string") return jsonError(400, messages);

  const ctx = (body.context ?? {}) as Record<string, unknown>;
  const f = ctx.focus as Record<string, unknown> | null | undefined;
  const focus: FocusStep | null =
    f && typeof f === "object"
      ? { phase: str(f.phase, 40), title: str(f.title, 200), detail: str(f.detail, 800), content: str(f.content, 3000) }
      : null;

  const system = buildMentorSystem({
    profile: profile.data,
    planTitle: str(ctx.planTitle, 120) || "Untitled",
    pitch: str(ctx.pitch, 400),
    mvp: Array.isArray(ctx.mvp) ? ctx.mvp.slice(0, 4).map((m) => str(m, 200)) : [],
    agent: agentById(str(ctx.agentId, 20))?.label ?? "their coding agent",
    progress: str(ctx.progress, 200) || "just started",
    focus,
    overrideSec: parseOverride(typeof body.time === "string" ? body.time : null),
  });

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const res = client.messages.stream({
          model: MODEL,
          max_tokens: 8000,
          output_config: { effort: EFFORT },
          system,
          messages,
        });
        for await (const ev of res) {
          if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(ev.delta.text));
          }
        }
        const final = await res.finalMessage();
        if (final.stop_reason === "refusal") {
          controller.enqueue(encoder.encode(`\n\n${ERROR_MARKER}Heckr can't help with that one. Try rephrasing, or ask an organiser.`));
        }
      } catch (err) {
        console.error("Mentor API error:", err instanceof Error ? err.message : err);
        controller.enqueue(
          encoder.encode(`\n\n${ERROR_MARKER}Heckr hit a snag reaching the model. Try again in a moment, or ask an organiser in the room.`),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}
