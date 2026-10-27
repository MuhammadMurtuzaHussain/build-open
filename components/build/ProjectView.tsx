"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HeckrAvatar } from "@/components/HeckrAvatar";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowClockwise, ArrowLeft, ChatCircleText, ListChecks, Trash } from "@phosphor-icons/react";
import { deleteProject, getProject, saveProject } from "@/lib/mentor/db";
import type { MentorMsg, PlanPhase, PlanStep, Project } from "@/lib/mentor/types";
import { readTimeParam } from "@/lib/useAgenda";
import { BuildShell } from "./BuildShell";
import { MentorChat, type Focus } from "./MentorChat";
import { PlanView } from "./PlanView";

const LOADING_LINES = [
  "Reading your idea",
  "Cutting it down to what you can demo by 15:30",
  "Picking the right tools for your laptop",
  "Writing prompts for your agent",
  "Lining up the deploy",
];

function PlanLoading() {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setI((n) => Math.min(n + 1, LOADING_LINES.length - 1)), 4500);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center py-16 text-center" role="status" aria-live="polite">
      <motion.div
        aria-hidden="true"
        className="rounded-full"
        animate={reduce ? undefined : { rotate: [0, -6, 6, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <HeckrAvatar size={112} className="ring-4" />
      </motion.div>
      <h1 className="mt-8 text-3xl sm:text-4xl">Heckr is sketching your plan</h1>
      <div className="mt-3 h-7">
        <AnimatePresence mode="wait">
          <motion.p
            key={i}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
            className="text-muted"
          >
            {LOADING_LINES[i]}…
          </motion.p>
        </AnimatePresence>
      </div>
      <div className="mt-10 w-full space-y-3" aria-hidden="true">
        {[0, 1, 2].map((n) => <div key={n} className="h-20 animate-pulse rounded-2xl bg-ink-2" style={{ animationDelay: `${n * 0.15}s` }} />)}
      </div>
      <p className="mt-6 text-sm text-muted">This takes about half a minute. Open your laptop and a terminal while you wait.</p>
    </div>
  );
}

function ProgressRing({ pct }: { pct: number }) {
  const r = 16;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid h-11 w-11 place-items-center" role="img" aria-label={`${pct}% of steps done`}>
      <svg viewBox="0 0 40 40" className="absolute inset-0 -rotate-90">
        <circle cx="20" cy="20" r={r} fill="none" stroke="var(--color-line)" strokeWidth="4" />
        <circle cx="20" cy="20" r={r} fill="none" stroke="var(--color-pink)" strokeWidth="4" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} className="transition-[stroke-dashoffset] duration-500" />
      </svg>
      <span className="font-mono text-[11px] font-bold tabular-nums">{pct}</span>
    </div>
  );
}

export function ProjectView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<Project | null | undefined>(undefined);
  const [planError, setPlanError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [tab, setTab] = useState<"plan" | "mentor">("plan");
  const [focus, setFocus] = useState<Focus>(null);
  const started = useRef(false);

  const update = useCallback((fn: (p: Project) => Project) => {
    setProject((cur) => {
      if (!cur) return cur;
      const next = fn(cur);
      saveProject(next).catch(() => {});
      return next;
    });
  }, []);

  const generate = useCallback(async (p: Project) => {
    setGenerating(true);
    setPlanError(null);
    try {
      const res = await fetch("/api/mentor/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: p.profile, time: readTimeParam() }),
      });
      const data = (await res.json().catch(() => ({}))) as { plan?: Project["plan"]; error?: string };
      if (!res.ok || !data.plan) throw new Error(data.error || "Heckr couldn't make your plan. Try again.");
      update((cur) => ({ ...cur, plan: data.plan! }));
    } catch (e) {
      setPlanError((e as Error).message || "Couldn't reach Heckr. Check your connection and try again.");
    } finally {
      setGenerating(false);
    }
  }, [update]);

  useEffect(() => {
    getProject(id)
      .then((p) => {
        setProject(p ?? null);
        if (p && !p.plan && !started.current) {
          started.current = true;
          generate(p);
        }
      })
      .catch(() => setProject(null));
  }, [id, generate]);

  const onMessages = useCallback((msgs: MentorMsg[]) => update((cur) => ({ ...cur, messages: msgs })), [update]);
  const onToggle = useCallback((stepId: string) => update((cur) => ({ ...cur, done: { ...cur.done, [stepId]: !cur.done[stepId] } })), [update]);
  const onAsk = useCallback((phaseId: PlanPhase["id"], step: PlanStep) => {
    setFocus({ phaseId, step });
    setTab("mentor");
  }, []);

  const remove = async () => {
    if (!project || !window.confirm(`Delete "${project.plan?.title ?? "this build"}"? This can't be undone.`)) return;
    await deleteProject(project.id);
    router.push("/build");
  };

  if (project === undefined) {
    return (
      <BuildShell>
        <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-10" aria-hidden="true">
          <div className="h-48 animate-pulse rounded-3xl bg-ink-2" />
          <div className="h-24 animate-pulse rounded-2xl bg-ink-2" />
        </div>
      </BuildShell>
    );
  }

  if (project === null) {
    return (
      <BuildShell>
        <main id="main" className="mx-auto max-w-xl px-4 py-20 text-center">
          <h1 className="text-3xl">This build isn&apos;t on this device</h1>
          <p className="mt-3 text-muted">Plans are saved in the browser they were made in. Open it there, or start a fresh one.</p>
          <Link href="/build" className="mt-8 inline-flex min-h-12 items-center rounded-xl bg-pink px-6 font-bold text-ink">Go to my builds</Link>
        </main>
      </BuildShell>
    );
  }

  const steps = project.plan?.phases.flatMap((p) => p.steps) ?? [];
  const pct = steps.length ? Math.round((steps.filter((s) => project.done[s.id]).length / steps.length) * 100) : 0;

  const header = (
    <div className="flex items-center gap-1">
      {project.plan && <ProgressRing pct={pct} />}
      <button type="button" onClick={remove} aria-label="Delete this build" className="grid h-10 w-10 place-items-center rounded-lg text-muted hover:bg-ink-3 hover:text-paper">
        <Trash size={18} />
      </button>
    </div>
  );

  if (!project.plan) {
    return (
      <BuildShell right={header}>
        <main id="main" className="px-4">
          {generating || !planError ? (
            <PlanLoading />
          ) : (
            <div className="mx-auto max-w-xl py-20 text-center" role="alert">
              <h1 className="text-3xl">That didn&apos;t work</h1>
              <p className="mt-3 text-muted">{planError}</p>
              <button type="button" onClick={() => generate(project)} className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-xl bg-pink px-6 font-bold text-ink hover:bg-pink-soft">
                <ArrowClockwise size={18} weight="bold" /> Try again
              </button>
              <p className="mt-6"><Link href="/build" className="text-sm text-muted underline underline-offset-2">Back to my builds</Link></p>
            </div>
          )}
        </main>
      </BuildShell>
    );
  }

  return (
    <BuildShell right={header}>
      <div className="mx-auto w-full max-w-7xl flex-1 lg:grid lg:grid-cols-[minmax(0,1fr)_26rem] lg:gap-8 lg:px-4">
        <main id="main" className={`px-4 pt-6 pb-28 lg:block lg:px-0 lg:pb-16 ${tab === "plan" ? "block" : "hidden"}`}>
          <Link href="/build" className="mb-4 inline-flex min-h-10 items-center gap-1.5 text-sm text-muted hover:text-paper">
            <ArrowLeft size={16} /> My builds
          </Link>
          <PlanView project={project} onToggle={onToggle} onAsk={onAsk} />
        </main>
        <aside
          className={`lg:sticky lg:top-16 lg:block lg:h-[calc(100dvh-4rem)] lg:py-6 ${
            tab === "mentor" ? "fixed inset-x-0 top-16 bottom-[4.5rem] z-20 block bg-ink" : "hidden"
          }`}
        >
          <div className="h-full overflow-hidden lg:rounded-3xl lg:border lg:border-line lg:bg-ink-2/40">
            <MentorChat project={project} focus={focus} onClearFocus={() => setFocus(null)} onMessages={onMessages} />
          </div>
        </aside>
      </div>

      <nav aria-label="Switch view" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ink/95 p-2 backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-2 gap-2">
          {(
            [
              ["plan", "Plan", ListChecks],
              ["mentor", "Ask Heckr", ChatCircleText],
            ] as const
          ).map(([key, label, Icon]) => (
            <button
              key={key}
              type="button"
              aria-pressed={tab === key}
              onClick={() => setTab(key)}
              className={`flex min-h-12 items-center justify-center gap-2 rounded-xl font-bold transition-colors ${
                tab === key ? "bg-pink text-ink" : "text-muted hover:text-paper"
              }`}
            >
              <Icon size={20} weight={tab === key ? "fill" : "regular"} /> {label}
            </button>
          ))}
        </div>
      </nav>
    </BuildShell>
  );
}
