import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { parseOverride } from "@/lib/agenda";
import { buildPlanPrompt } from "@/lib/mentor/prompts";
import { PHASE_IDS, PlanWireSchema, ProfileSchema, type Plan, type PlanWire, type PlanStep, type Profile } from "@/lib/mentor/types";
import { AGENTS } from "@/lib/mentor/catalogue";
import { clientIp, EFFORT, jsonError, MODEL, rateLimit, tooFast } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const LIMIT = Number(process.env.HECKR_PLAN_LIMIT) || 6; // plans per IP per window
const WINDOW_MS = 30 * 60_000;

const KINDS: PlanStep["kind"][] = ["do", "command", "prompt", "check"];
const AGENT_IDS = AGENTS.map((a) => a.id) as string[];
const clean = (v: string) => v.trim().toLowerCase().replace(/[^a-z-]/g, "");

/** Map the model's output onto the stored Plan shape: fixed phase order, valid enums, unique step ids, sane sizes. */
function normalise(wire: PlanWire, profile: Profile): Plan | null {
  const phaseAliases: Record<string, Plan["phases"][number]["id"]> = { setup: "setup", "set-up": "setup", plan: "plan", planning: "plan", build: "build", polish: "polish", ship: "ship", launch: "ship" };
  const byId = new Map<Plan["phases"][number]["id"], PlanWire["phases"][number]>();
  wire.phases.forEach((p, i) => {
    const id = phaseAliases[clean(p.id)] ?? PHASE_IDS[i];
    if (id && !byId.has(id)) byId.set(id, p);
  });
  const phases = PHASE_IDS.flatMap((id) => {
    const p = byId.get(id);
    if (!p) return [];
    const steps = p.steps.slice(0, 8).map((s, i) => {
      const kind = KINDS.find((k) => k === clean(s.kind)) ?? (s.content ? "command" : "do");
      return { ...s, kind, id: `${id}-${i + 1}` };
    });
    return steps.length ? [{ id, goal: p.goal, timebox: p.timebox, steps }] : [];
  });
  if (phases.length < 3) return null;

  const owned: string[] = profile.agents.filter((a) => a !== "none");
  const asked = clean(wire.agentId);
  // Use an agent the student actually has; with "None yet", accept the free pick Heckr made.
  const valid = AGENT_IDS.includes(asked) && asked !== "none";
  const agentId = (owned.length ? (owned.includes(asked) ? asked : owned[0]) : valid ? asked : "gemini") as Plan["agentId"];

  return {
    ...wire,
    agentId,
    mvp: wire.mvp.slice(0, 4),
    stretch: wire.stretch.slice(0, 3),
    stack: wire.stack.slice(0, 6),
    demo: wire.demo.slice(0, 6),
    phases,
  };
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return jsonError(503, "Heckr isn't switched on yet. Ask an organiser in the room.");
  }
  const rl = rateLimit(`plan:${clientIp(req)}`, LIMIT, WINDOW_MS);
  if (!rl.ok) return tooFast(rl.retryAfter);

  let body: { profile?: unknown; time?: unknown };
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "Bad request.");
  }
  const parsed = ProfileSchema.safeParse(body?.profile);
  if (!parsed.success) {
    return jsonError(400, "Some answers are missing. Describe your idea in a sentence or two and pick at least one option on each step.");
  }

  const { system, user } = buildPlanPrompt(parsed.data, parseOverride(typeof body.time === "string" ? body.time : null));
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const res = await client.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      output_config: { effort: EFFORT, format: zodOutputFormat(PlanWireSchema) },
      system,
      messages: [{ role: "user", content: user }],
    });
    if (res.stop_reason === "refusal") {
      return jsonError(422, "Heckr couldn't plan that idea. Try describing it differently, or ask an organiser.");
    }
    const plan = res.parsed_output && res.stop_reason !== "max_tokens" ? normalise(res.parsed_output, parsed.data) : null;
    if (!plan) return jsonError(502, "Heckr's plan came out jumbled. Try again in a moment.");
    return Response.json({ plan }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("Plan API error:", err instanceof Error ? err.message : err);
    if (err instanceof Anthropic.RateLimitError) return jsonError(429, "Lots of people are planning right now. Try again in a minute.");
    return jsonError(502, "Heckr hit a snag making your plan. Try again in a moment, or ask an organiser in the room.");
  }
}
