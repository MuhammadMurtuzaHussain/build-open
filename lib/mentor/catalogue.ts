// Options shown in the Build mode intake. Links are fixed here so neither the
// page nor the model ever invents a URL. Keep descriptions free of prices and
// usage limits: those change often and we can't vouch for them on the day.

export const EXPERIENCE = [
  { id: "new", label: "Never coded", hint: "Totally fine. Your agent writes, you steer." },
  { id: "some", label: "A bit", hint: "Tutorials, a class, a small project." },
  { id: "comfortable", label: "Comfortable", hint: "I can read code and fix small bugs." },
  { id: "shipper", label: "I ship things", hint: "I've built and deployed apps before." },
] as const;

export const AGENTS = [
  {
    id: "claude",
    label: "Claude",
    sub: "Claude Code, with a Claude plan",
    link: "https://claude.com/product/claude-code",
  },
  {
    id: "chatgpt",
    label: "ChatGPT",
    sub: "Codex, with a ChatGPT plan",
    link: "https://openai.com/codex",
  },
  {
    id: "copilot",
    label: "GitHub Copilot",
    sub: "In VS Code. Students can get it through GitHub Education",
    link: "https://github.com/features/copilot",
  },
  {
    id: "cursor",
    label: "Cursor",
    sub: "An editor with an agent built in",
    link: "https://cursor.com",
  },
  {
    id: "gemini",
    label: "Gemini CLI",
    sub: "Free with a Google account",
    link: "https://github.com/google-gemini/gemini-cli",
  },
  {
    id: "none",
    label: "None yet",
    sub: "Keep it free. Heckr picks a free option for you",
    link: "",
  },
] as const;

export const AI_MODELS = [
  {
    id: "gemma-studio",
    label: "Gemma via Google AI Studio",
    sub: "Free API key, no setup on your laptop. Counts for the Gemma track",
    link: "https://aistudio.google.com",
    gemma: true,
  },
  {
    id: "gemma-local",
    label: "Gemma on my laptop",
    sub: "Runs offline with Ollama. Needs a decent laptop",
    link: "https://ollama.com/library/gemma3",
    gemma: true,
  },
  {
    id: "claude-api",
    label: "Claude API",
    sub: "If you already have an Anthropic API key",
    link: "https://console.anthropic.com",
    gemma: false,
  },
  {
    id: "openai-api",
    label: "OpenAI API",
    sub: "If you already have an OpenAI API key",
    link: "https://platform.openai.com",
    gemma: false,
  },
  {
    id: "none",
    label: "No AI inside my app",
    sub: "Totally valid. Not every project needs a model",
    link: "",
    gemma: false,
  },
] as const;

export const OS = [
  { id: "mac", label: "macOS" },
  { id: "windows", label: "Windows" },
  { id: "linux", label: "Linux" },
  { id: "chromebook", label: "Chromebook" },
] as const;

export type ExperienceId = (typeof EXPERIENCE)[number]["id"];
export type AgentId = (typeof AGENTS)[number]["id"];
export type AiModelId = (typeof AI_MODELS)[number]["id"];
export type OsId = (typeof OS)[number]["id"];

export const agentById = (id: string) => AGENTS.find((a) => a.id === id);
export const modelById = (id: string) => AI_MODELS.find((m) => m.id === id);
