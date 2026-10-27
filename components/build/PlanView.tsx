"use client";

import { motion, useReducedMotion } from "motion/react";
import {
  ArrowSquareOut,
  ChatCircleText,
  CheckCircle,
  Circle,
  DownloadSimple,
  HandPointing,
  Lightbulb,
  ListChecks,
  MagicWand,
  PresentationChart,
  Stack,
  Terminal,
  Trophy,
} from "@phosphor-icons/react";
import { CopyButton } from "@/components/chat/CopyButton";
import { LINKS } from "@/lib/event";
import { agentById, modelById } from "@/lib/mentor/catalogue";
import { planToMarkdown } from "@/lib/mentor/markdown";
import { PHASE_LABELS, type PlanPhase, type PlanStep, type Project } from "@/lib/mentor/types";

const KIND = {
  do: { label: "Do", icon: HandPointing },
  command: { label: "Terminal", icon: Terminal },
  prompt: { label: "Prompt your agent", icon: MagicWand },
  check: { label: "Check", icon: ListChecks },
} as const;

export function currentPhaseId(p: Project): PlanPhase["id"] | null {
  return p.plan?.phases.find((ph) => ph.steps.some((s) => !p.done[s.id]))?.id ?? null;
}

function StepCard({
  step,
  done,
  agentLabel,
  onToggle,
  onAsk,
}: {
  step: PlanStep;
  done: boolean;
  agentLabel: string;
  onToggle: () => void;
  onAsk: () => void;
}) {
  const reduce = useReducedMotion();
  const K = KIND[step.kind];
  return (
    <li className={`rounded-2xl border p-4 transition-colors sm:p-5 ${done ? "border-line/60 bg-ink-2/40" : "border-line bg-ink-2/80"}`}>
      <div className="flex gap-3">
        <button
          type="button"
          role="checkbox"
          aria-checked={done}
          aria-label={`Mark "${step.title}" as ${done ? "not done" : "done"}`}
          onClick={onToggle}
          className="-m-1 grid h-11 w-11 shrink-0 place-items-center rounded-full text-pink"
        >
          <motion.span key={String(done)} initial={reduce ? false : { scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 400, damping: 18 }}>
            {done ? <CheckCircle size={30} weight="fill" /> : <Circle size={30} className="text-line" />}
          </motion.span>
        </button>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-muted">
            <K.icon size={14} weight="bold" className="text-pink" /> {K.label}
          </p>
          <h4 className={`mt-1 text-lg leading-snug ${done ? "text-muted line-through decoration-line" : ""}`}>{step.title}</h4>
          {!done && (
            <>
              <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{step.detail}</p>
              {step.content && (
                <div className={`mt-3 overflow-hidden rounded-xl border ${step.kind === "prompt" ? "border-pink/40 bg-pink/5" : "border-line bg-ink"}`}>
                  <div className="flex items-center justify-between gap-2 border-b border-line/70 py-1 pr-1 pl-3">
                    <span className="font-mono text-[11px] uppercase tracking-widest text-muted">
                      {step.kind === "prompt" ? `Paste into ${agentLabel}` : step.kind === "command" ? "Type in your terminal" : "Text"}
                    </span>
                    <CopyButton text={step.content} />
                  </div>
                  <pre className="max-h-72 overflow-auto p-3 font-mono text-[13px] leading-relaxed whitespace-pre-wrap break-words text-paper">
                    <code>{step.content}</code>
                  </pre>
                </div>
              )}
              {step.expected && (
                <p className="mt-3 text-sm text-muted">
                  <span className="font-bold text-paper">You should see: </span>
                  {step.expected}
                </p>
              )}
              <button
                type="button"
                onClick={onAsk}
                className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl border border-line px-3.5 text-sm font-bold text-paper hover:border-pink hover:text-pink"
              >
                <ChatCircleText size={16} weight="bold" /> Ask Heckr about this
              </button>
            </>
          )}
        </div>
      </div>
    </li>
  );
}

export function PlanView({
  project,
  onToggle,
  onAsk,
}: {
  project: Project;
  onToggle: (stepId: string) => void;
  onAsk: (phaseId: PlanPhase["id"], step: PlanStep) => void;
}) {
  const plan = project.plan!;
  const agent = agentById(plan.agentId);
  const model = modelById(project.profile.aiModel);
  const current = currentPhaseId(project);
  const allDone = current === null;
  const md = planToMarkdown(project);

  const download = () => {
    const url = URL.createObjectURL(new Blob([md], { type: "text/markdown" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "PLAN.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-10">
      <section aria-labelledby="plan-title" className="relative overflow-hidden rounded-3xl border border-pink/40 bg-gradient-to-br from-pink/20 via-ink-2 to-ink-2 p-6 sm:p-8">
        <h1 id="plan-title" className="text-4xl leading-[1.05] sm:text-5xl">{plan.title}</h1>
        <p className="mt-3 max-w-[55ch] text-lg text-paper/90">{plan.pitch}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {agent && (
            <a href={agent.link || undefined} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-full bg-ink/70 px-4 text-sm hover:bg-ink">
              <MagicWand size={16} className="text-pink" /> Build with <strong>{agent.label}</strong>
              {agent.link && <ArrowSquareOut size={14} className="text-muted" />}
            </a>
          )}
          {model && model.id !== "none" && (
            <a href={model.link} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-full bg-ink/70 px-4 text-sm hover:bg-ink">
              <Lightbulb size={16} className="text-pink" /> AI: <strong>{model.label}</strong>
              <ArrowSquareOut size={14} className="text-muted" />
            </a>
          )}
          {model?.gemma && <span className="inline-flex min-h-10 items-center rounded-full bg-paper px-4 text-sm font-bold text-ink">Eligible for Best Gemma Project</span>}
        </div>
        <div className="mt-6 flex flex-wrap gap-2 border-t border-paper/10 pt-5">
          <CopyButton text={md} label="Copy PLAN.md for your agent" className="border border-line bg-ink/60 text-paper" />
          <button type="button" onClick={download} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-line bg-ink/60 px-2.5 font-mono text-xs text-paper hover:bg-ink-3">
            <DownloadSimple size={14} /> Download
          </button>
        </div>
        <p className="mt-2 text-sm text-muted">Save it in your project folder so your agent always knows the plan.</p>
      </section>

      <section aria-labelledby="mvp-h" className="grid gap-6 md:grid-cols-[3fr_2fr]">
        <div>
          <h2 id="mvp-h" className="text-2xl">Build only this first</h2>
          <ol className="mt-4 space-y-2.5">
            {plan.mvp.map((m, i) => (
              <li key={i} className="flex gap-3 rounded-2xl bg-ink-2/80 p-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-pink font-mono text-sm font-bold text-ink">{i + 1}</span>
                <span className="pt-1">{m}</span>
              </li>
            ))}
          </ol>
        </div>
        {plan.stretch.length > 0 && (
          <div>
            <h3 className="text-lg text-muted">If there&apos;s time</h3>
            <ul className="mt-4 space-y-2 border-l-2 border-dashed border-line pl-4 text-muted">
              {plan.stretch.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        )}
      </section>

      <nav aria-label="Phases" className="sticky top-16 z-10 -mx-4 border-b border-line bg-ink/90 px-4 py-3 backdrop-blur lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
        <ol className="flex gap-2 overflow-x-auto">
          {plan.phases.map((ph) => {
            const n = ph.steps.filter((s) => project.done[s.id]).length;
            const complete = n === ph.steps.length;
            const here = ph.id === current;
            return (
              <li key={ph.id} className="shrink-0">
                <a
                  href={`#phase-${ph.id}`}
                  aria-current={here ? "step" : undefined}
                  className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-3.5 text-sm font-bold transition-colors ${
                    here ? "border-pink bg-pink text-ink" : complete ? "border-line text-muted" : "border-line text-paper hover:border-pink"
                  }`}
                >
                  {complete && <CheckCircle size={16} weight="fill" className={here ? "" : "text-pink"} />}
                  {PHASE_LABELS[ph.id]}
                  <span className={`font-mono text-xs font-normal ${here ? "text-ink/70" : "text-muted"}`}>
                    {n}/{ph.steps.length}
                  </span>
                </a>
              </li>
            );
          })}
        </ol>
      </nav>

      {plan.phases.map((ph) => (
        <section key={ph.id} id={`phase-${ph.id}`} aria-labelledby={`phase-${ph.id}-h`} className="scroll-mt-36 lg:scroll-mt-20">
          <div className="mb-4">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 id={`phase-${ph.id}-h`} className="text-3xl">{PHASE_LABELS[ph.id]}</h2>
              <span className="font-mono text-sm text-pink">{ph.timebox}</span>
              {ph.id === current && <span className="rounded-full bg-pink/15 px-2.5 py-0.5 text-xs font-bold text-pink">You&apos;re here</span>}
            </div>
            <p className="mt-1 max-w-[60ch] text-muted">{ph.goal}</p>
          </div>
          <ol className="space-y-3">
            {ph.steps.map((s) => (
              <StepCard
                key={s.id}
                step={s}
                done={!!project.done[s.id]}
                agentLabel={agent?.label ?? "your agent"}
                onToggle={() => onToggle(s.id)}
                onAsk={() => onAsk(ph.id, s)}
              />
            ))}
          </ol>
        </section>
      ))}

      <section aria-labelledby="stack-h" className="grid gap-6 md:grid-cols-2">
        <div>
          <h2 id="stack-h" className="flex items-center gap-2 text-2xl"><Stack size={24} className="text-pink" /> Your stack</h2>
          <dl className="mt-4 space-y-3">
            {plan.stack.map((s) => (
              <div key={s.name} className="rounded-2xl bg-ink-2/80 p-4">
                <dt className="font-bold">{s.name} <span className="font-normal text-muted">· {s.role}</span></dt>
                <dd className="mt-1 text-sm text-muted">{s.why}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div>
          <h2 className="flex items-center gap-2 text-2xl"><PresentationChart size={24} className="text-pink" /> Your two-minute demo</h2>
          <ol className="mt-4 space-y-3">
            {plan.demo.map((d, i) => (
              <li key={i} className="flex gap-3">
                <span className="font-mono text-pink">{String(i + 1).padStart(2, "0")}</span>
                <span>{d}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        aria-labelledby="ship-h"
        className={`rounded-3xl border p-6 sm:p-8 ${allDone ? "border-pink bg-pink text-ink" : "border-line bg-ink-2/70"}`}
      >
        <Trophy size={36} weight="duotone" className={allDone ? "" : "text-pink"} />
        <h2 id="ship-h" className="mt-2 text-3xl">{allDone ? "You built it. Ship it!" : "When it works, ship it"}</h2>
        <p className={`mt-2 max-w-[55ch] ${allDone ? "text-ink/80" : "text-muted"}`}>
          Submit before 15:30, then write it up on DEV for promo credits and sponsor prizes.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a href={LINKS.submit.href} target="_blank" rel="noopener noreferrer" className={`inline-flex min-h-12 items-center gap-2 rounded-xl px-5 font-bold ${allDone ? "bg-ink text-paper" : "bg-pink text-ink hover:bg-pink-soft"}`}>
            Submit your project <ArrowSquareOut size={16} weight="bold" />
          </a>
          <a href={LINKS.dev.href} target="_blank" rel="noopener noreferrer" className={`inline-flex min-h-12 items-center gap-2 rounded-xl border px-5 font-bold ${allDone ? "border-ink/40" : "border-line hover:border-pink"}`}>
            Write it up on DEV <ArrowSquareOut size={16} weight="bold" />
          </a>
        </div>
      </section>
    </div>
  );
}
