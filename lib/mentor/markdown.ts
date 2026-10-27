import { agentById, modelById } from "./catalogue";
import { PHASE_LABELS, type Project } from "./types";

/**
 * The plan as a Markdown brief the student can drop into their repo (PLAN.md)
 * or paste into their coding agent as context.
 */
export function planToMarkdown(p: Project): string {
  const plan = p.plan;
  if (!plan) return "";
  const agent = agentById(plan.agentId);
  const model = modelById(p.profile.aiModel);
  const lines: string[] = [
    `# ${plan.title}`,
    "",
    plan.pitch,
    "",
    "## The idea",
    p.profile.idea,
    "",
    "## MVP (build only this first)",
    ...plan.mvp.map((m) => `- ${m}`),
    "",
    "## If there's time",
    ...plan.stretch.map((m) => `- ${m}`),
    "",
    "## Stack",
    ...plan.stack.map((s) => `- **${s.name}**: ${s.role}. ${s.why}`),
    "",
    "## Tools",
    `- Coding agent: ${agent?.label ?? plan.agentId}. ${plan.agentWhy}`,
    `- AI in the app: ${model?.label ?? p.profile.aiModel}.${plan.aiModelWhy ? ` ${plan.aiModelWhy}` : ""}`,
    "",
    "## Rules for the coding agent",
    "- Work in small steps and explain what you changed after each one.",
    "- Keep API keys in environment variables, never in the code or the repo.",
    "- Stick to the MVP above until it works end to end.",
    "",
  ];
  for (const phase of plan.phases) {
    lines.push(`## ${PHASE_LABELS[phase.id]} (${phase.timebox})`, phase.goal, "");
    for (const s of phase.steps) {
      lines.push(`- [${p.done[s.id] ? "x" : " "}] **${s.title}**: ${s.detail}`);
      if (s.content) lines.push("", "```", s.content, "```", "");
    }
    lines.push("");
  }
  lines.push("## Demo", ...plan.demo.map((d, i) => `${i + 1}. ${d}`), "");
  return lines.join("\n");
}
