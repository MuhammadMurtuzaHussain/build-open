"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  AppleLogo,
  ArrowLeft,
  ArrowRight,
  Bicycle,
  ChatCircleDots,
  Check,
  CursorClick,
  Cpu,
  Gift,
  GithubLogo,
  GoogleChromeLogo,
  GoogleLogo,
  Laptop,
  Lightning,
  LinuxLogo,
  Microphone,
  Plant,
  Prohibit,
  RocketLaunch,
  Sparkle,
  Stop,
  WindowsLogo,
  type Icon,
} from "@phosphor-icons/react";
import { THEMES } from "@/lib/event";
import { AGENTS, AI_MODELS, EXPERIENCE, OS, type AgentId, type AiModelId, type ExperienceId, type OsId } from "@/lib/mentor/catalogue";
import { useDictation } from "@/lib/mentor/media";
import type { Profile } from "@/lib/mentor/types";

const EXP_ICONS: Record<ExperienceId, Icon> = { new: Plant, some: Bicycle, comfortable: Lightning, shipper: RocketLaunch };
const AGENT_ICONS: Record<AgentId, Icon> = {
  claude: Sparkle,
  chatgpt: ChatCircleDots,
  copilot: GithubLogo,
  cursor: CursorClick,
  gemini: GoogleLogo,
  none: Gift,
};
const MODEL_ICONS: Record<AiModelId, Icon> = {
  "gemma-studio": GoogleLogo,
  "gemma-local": Laptop,
  "claude-api": Sparkle,
  "openai-api": Cpu,
  none: Prohibit,
};
const OS_ICONS: Record<OsId, Icon> = { mac: AppleLogo, windows: WindowsLogo, linux: LinuxLogo, chromebook: GoogleChromeLogo };

const STEPS = ["idea", "experience", "agents", "model", "os"] as const;
const TITLES: Record<(typeof STEPS)[number], { q: string; sub: string }> = {
  idea: { q: "What do you want to build?", sub: "A sentence or two is plenty. Messy is fine, Heckr will help shape it." },
  experience: { q: "How much have you coded?", sub: "No wrong answers. It changes how much Heckr explains." },
  agents: { q: "Which coding agents do you have?", sub: "Pick all that apply. Heckr never writes your code, your agent does, and Heckr shows you how to steer it." },
  model: { q: "Want AI inside your app?", sub: "This is the model your app talks to, separate from your coding agent." },
  os: { q: "What laptop are you on?", sub: "So every terminal command works first time." },
};

function Tile({
  selected,
  onClick,
  icon: IconCmp,
  label,
  sub,
  badge,
  multi,
}: {
  selected: boolean;
  onClick: () => void;
  icon: Icon;
  label: string;
  sub?: string;
  badge?: string;
  multi?: boolean;
}) {
  return (
    <button
      type="button"
      role={multi ? "checkbox" : "radio"}
      aria-checked={selected}
      aria-label={sub ? `${label}. ${sub}` : label}
      onClick={onClick}
      className={`group relative flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-[border-color,background-color,transform] duration-200 active:scale-[0.98] ${
        selected ? "border-pink bg-pink/10" : "border-line bg-ink-2/70 hover:border-pink/60"
      }`}
    >
      <span
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl transition-colors ${
          selected ? "bg-pink text-ink" : "bg-ink-3 text-paper group-hover:text-pink"
        }`}
      >
        <IconCmp size={22} weight={selected ? "fill" : "duotone"} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col pt-0.5">
        <span className="flex flex-wrap items-center gap-2 font-bold leading-tight">
          {label}
          {badge && <span className="rounded-full bg-paper px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-ink">{badge}</span>}
        </span>
        {sub && <span className="mt-1 text-sm leading-snug text-muted">{sub}</span>}
      </span>
      <span
        aria-hidden="true"
        className={`mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-colors ${
          selected ? "border-pink bg-pink text-ink" : "border-line"
        }`}
      >
        {selected && <Check size={12} weight="bold" />}
      </span>
    </button>
  );
}

export function Intake({ onSubmit, busy }: { onSubmit: (p: Profile) => void; busy: boolean }) {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [idea, setIdea] = useState("");
  const [theme, setTheme] = useState<number | null>(null);
  const [experience, setExperience] = useState<ExperienceId | null>(null);
  const [agents, setAgents] = useState<AgentId[]>([]);
  const [aiModel, setAiModel] = useState<AiModelId | null>(null);
  const [os, setOs] = useState<OsId | null>(null);
  const [ideaBase, setIdeaBase] = useState("");

  const dictation = useDictation((t) => setIdea((ideaBase ? ideaBase + " " : "") + t));

  const key = STEPS[step];
  const valid =
    key === "idea" ? idea.trim().length >= 8 : key === "experience" ? !!experience : key === "agents" ? agents.length > 0 : key === "model" ? !!aiModel : !!os;

  const go = (d: number) => {
    if (dictation.listening) dictation.stop();
    setDir(d);
    setStep((s) => Math.min(STEPS.length - 1, Math.max(0, s + d)));
  };

  const toggleAgent = (id: AgentId) =>
    setAgents((cur) => {
      if (id === "none") return cur.includes("none") ? [] : ["none"];
      const without = cur.filter((a) => a !== "none");
      return without.includes(id) ? without.filter((a) => a !== id) : [...without, id];
    });

  const submit = () => {
    if (!valid || !experience || !aiModel || !os || busy) return;
    onSubmit({ idea: idea.trim(), theme, experience, agents, aiModel, os });
  };

  let body: ReactNode;
  if (key === "idea") {
    body = (
      <div className="space-y-4">
        <div className="relative">
          <label htmlFor="idea" className="sr-only">Your idea</label>
          <textarea
            id="idea"
            value={idea}
            onChange={(e) => setIdea(e.target.value.slice(0, 1200))}
            rows={5}
            autoFocus
            placeholder="e.g. An app that helps my flatmates split the weekly shop and reminds whoever owes money"
            className="w-full resize-none rounded-2xl border border-line bg-ink-2 p-4 pb-14 text-lg leading-snug text-paper placeholder:text-muted/70 focus:border-pink"
          />
          <div className="absolute right-3 bottom-3 left-3 flex items-center justify-between gap-2">
            <span className="font-mono text-[11px] text-muted">{idea.length}/1200</span>
            {dictation.supported && (
              <button
                type="button"
                onClick={() => {
                  if (dictation.listening) dictation.stop();
                  else {
                    setIdeaBase(idea.trim());
                    dictation.start();
                  }
                }}
                aria-pressed={dictation.listening}
                className={`inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-sm font-bold transition-colors ${
                  dictation.listening ? "bg-pink text-ink" : "bg-ink-3 text-paper hover:bg-line"
                }`}
              >
                {dictation.listening ? <Stop size={16} weight="fill" /> : <Microphone size={16} weight="fill" />}
                {dictation.listening ? "Stop" : "Say it"}
              </button>
            )}
          </div>
        </div>
        {dictation.listening && <p className="text-sm text-pink" aria-live="polite">Listening. Talk like you'd explain it to a friend.</p>}
        {dictation.error && <p className="text-sm text-pink" role="alert">{dictation.error}</p>}
        <div>
          <p className="mb-2 text-sm text-muted">Need a nudge? Pick a theme (optional):</p>
          <div className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
            {THEMES.map((t) => (
              <button
                key={t.n}
                type="button"
                aria-pressed={theme === t.n}
                onClick={() => setTheme(theme === t.n ? null : t.n)}
                title={t.description}
                className={`min-h-10 shrink-0 snap-start rounded-full border px-4 text-sm transition-colors ${
                  theme === t.n ? "border-pink bg-pink text-ink" : "border-line text-paper hover:border-pink"
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
          {theme && <p className="mt-2 text-sm text-muted">{THEMES.find((t) => t.n === theme)?.description}</p>}
        </div>
      </div>
    );
  } else if (key === "experience") {
    body = (
      <div role="radiogroup" aria-label="Experience" className="grid gap-3 sm:grid-cols-2">
        {EXPERIENCE.map((e) => (
          <Tile key={e.id} selected={experience === e.id} onClick={() => setExperience(e.id)} icon={EXP_ICONS[e.id]} label={e.label} sub={e.hint} />
        ))}
      </div>
    );
  } else if (key === "agents") {
    body = (
      <div role="group" aria-label="Coding agents" className="grid gap-3 sm:grid-cols-2">
        {AGENTS.map((a) => (
          <Tile key={a.id} multi selected={agents.includes(a.id)} onClick={() => toggleAgent(a.id)} icon={AGENT_ICONS[a.id]} label={a.label} sub={a.sub} />
        ))}
      </div>
    );
  } else if (key === "model") {
    body = (
      <div role="radiogroup" aria-label="AI model" className="grid gap-3">
        {AI_MODELS.map((m) => (
          <Tile
            key={m.id}
            selected={aiModel === m.id}
            onClick={() => setAiModel(m.id)}
            icon={MODEL_ICONS[m.id]}
            label={m.label}
            sub={m.sub}
            badge={m.id === "gemma-studio" ? "Gemma track" : undefined}
          />
        ))}
      </div>
    );
  } else {
    body = (
      <div role="radiogroup" aria-label="Laptop" className="grid grid-cols-2 gap-3">
        {OS.map((o) => (
          <Tile key={o.id} selected={os === o.id} onClick={() => setOs(o.id)} icon={OS_ICONS[o.id]} label={o.label} />
        ))}
      </div>
    );
  }

  const last = step === STEPS.length - 1;

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-6 flex gap-1.5" aria-label={`Question ${step + 1} of ${STEPS.length}`} role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={step + 1}>
        {STEPS.map((s, i) => (
          <span key={s} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i <= step ? "bg-pink" : "bg-line"}`} />
        ))}
      </div>

      <AnimatePresence mode="wait" custom={dir} initial={false}>
        <motion.div
          key={key}
          custom={dir}
          initial={reduce ? false : { opacity: 0, x: 24 * dir }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, x: -24 * dir }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="text-3xl leading-tight sm:text-4xl">{TITLES[key].q}</h2>
          <p className="mt-2 mb-6 max-w-[60ch] text-muted">{TITLES[key].sub}</p>
          {body}
        </motion.div>
      </AnimatePresence>

      <div className="sticky bottom-0 mt-8 -mx-4 flex items-center justify-between gap-3 border-t border-line bg-ink/90 px-4 py-4 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:backdrop-blur-none">
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={step === 0 || busy}
          className="inline-flex min-h-12 items-center gap-2 rounded-xl px-4 font-bold text-muted hover:text-paper disabled:invisible"
        >
          <ArrowLeft size={18} weight="bold" /> Back
        </button>
        <button
          type="button"
          onClick={() => (last ? submit() : go(1))}
          disabled={!valid || busy}
          className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-pink px-6 font-bold text-ink transition-transform hover:bg-pink-soft active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {last ? (busy ? "Starting…" : "Make my plan") : "Next"}
          {last ? <Sparkle size={18} weight="fill" /> : <ArrowRight size={18} weight="bold" />}
        </button>
      </div>
    </div>
  );
}
