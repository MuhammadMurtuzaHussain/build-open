import { z } from "zod";
import { AGENTS, AI_MODELS, EXPERIENCE, OS } from "./catalogue";

const ids = <T extends readonly { id: string }[]>(list: T) =>
  list.map((x) => x.id) as unknown as [T[number]["id"], ...T[number]["id"][]];

export const PHASE_IDS = ["setup", "plan", "build", "polish", "ship"] as const;
export const PHASE_LABELS: Record<(typeof PHASE_IDS)[number], string> = {
  setup: "Set up",
  plan: "Plan",
  build: "Build",
  polish: "Polish",
  ship: "Ship",
};

/** What the student told us in the intake. Validated again on the server. */
export const ProfileSchema = z.object({
  idea: z.string().trim().min(8).max(1200),
  theme: z.number().int().min(1).max(5).nullable(),
  experience: z.enum(ids(EXPERIENCE)),
  agents: z.array(z.enum(ids(AGENTS))).min(1).max(6),
  aiModel: z.enum(ids(AI_MODELS)),
  os: z.enum(ids(OS)),
});
export type Profile = z.infer<typeof ProfileSchema>;

export const StepSchema = z.object({
  id: z.string(),
  title: z.string().describe("Short imperative, e.g. 'Create your project folder'"),
  detail: z.string().describe("One to three plain-English sentences: what to do and why it matters."),
  kind: z
    .enum(["do", "command", "prompt", "check"])
    .describe(
      "do = an action in an app or website; command = something to type in the terminal; prompt = text to paste into the coding agent; check = how to confirm it works",
    ),
  content: z
    .string()
    .describe("For command: the exact terminal command(s). For prompt: the full prompt to paste into the agent. Otherwise an empty string."),
  expected: z.string().describe("What the student should see when it worked."),
});

export const PhaseSchema = z.object({
  id: z.enum(PHASE_IDS),
  goal: z.string().describe("One sentence on what this phase achieves."),
  timebox: z.string().describe("Rough clock time window, e.g. '12:00-12:30'."),
  steps: z.array(StepSchema),
});

export const PlanSchema = z.object({
  title: z.string().describe("A short, catchy project name."),
  pitch: z.string().describe("One sentence a judge would remember."),
  mvp: z.array(z.string()).describe("Two to four core features that make the demo work. Nothing more."),
  stretch: z.array(z.string()).describe("One to three nice-to-haves, only if time allows."),
  stack: z.array(z.object({ name: z.string(), role: z.string(), why: z.string() })),
  agentId: z.enum(ids(AGENTS)).describe("Which of the student's coding agents to use. Never 'none'."),
  agentWhy: z.string(),
  aiModelWhy: z.string().describe("Why this AI model fits, or an empty string if the app has no AI."),
  phases: z.array(PhaseSchema),
  demo: z.array(z.string()).describe("Three to five beats for a two-minute demo."),
});
export type Plan = z.infer<typeof PlanSchema>;

// What we ask the model for. Same shape as PlanSchema, but the enum fields are
// plain strings: the SDK sends enums only as description hints, so the server
// maps whatever comes back onto the allowed values instead of failing the parse.
const WireStep = StepSchema.extend({
  kind: z.string().describe("One of: do, command, prompt, check. " + (StepSchema.shape.kind.description ?? "")),
});
const WirePhase = PhaseSchema.extend({
  id: z.string().describe(`One of: ${PHASE_IDS.join(", ")}, in that order.`),
  steps: z.array(WireStep),
});
export const PlanWireSchema = PlanSchema.extend({
  agentId: z.string().describe(`One of the student's agents: ${AGENTS.filter((a) => a.id !== "none").map((a) => a.id).join(", ")}. Never 'none'.`),
  phases: z.array(WirePhase),
});
export type PlanWire = z.infer<typeof PlanWireSchema>;
export type PlanStep = z.infer<typeof StepSchema>;
export type PlanPhase = z.infer<typeof PhaseSchema>;

export type MentorMsg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** JPEG data URL, already resized on the device. */
  image?: string;
  error?: boolean;
};

export type Project = {
  id: string;
  createdAt: number;
  updatedAt: number;
  profile: Profile;
  plan: Plan | null;
  done: Record<string, boolean>;
  messages: MentorMsg[];
};
