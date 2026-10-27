"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Browser, Plus, ShieldCheck, Sparkle, Warning } from "@phosphor-icons/react";
import { listProjects, newId, isPersistent, saveProject } from "@/lib/mentor/db";
import type { Profile, Project } from "@/lib/mentor/types";
import { BuildShell } from "./BuildShell";
import { Intake } from "./Intake";

function progressOf(p: Project) {
  const steps = p.plan?.phases.flatMap((ph) => ph.steps) ?? [];
  return steps.length ? Math.round((steps.filter((s) => p.done[s.id]).length / steps.length) * 100) : 0;
}

export function BuildHome() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [persistent, setPersistent] = useState(true);
  const [mode, setMode] = useState<"home" | "intake">("home");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    listProjects()
      .then((ps) => {
        setProjects(ps);
        if (ps.length === 0) setMode("intake");
      })
      .catch(() => setProjects([]));
    isPersistent().then(setPersistent);
  }, []);

  const start = async (profile: Profile) => {
    setBusy(true);
    const now = Date.now();
    const project: Project = { id: newId(), createdAt: now, updatedAt: now, profile, plan: null, done: {}, messages: [] };
    await saveProject(project);
    const q = typeof window !== "undefined" ? window.location.search : "";
    router.push(`/build/${project.id}${q}`);
  };

  return (
    <BuildShell
      right={
        mode === "intake" && projects && projects.length > 0 ? (
          <button type="button" onClick={() => setMode("home")} className="min-h-10 rounded-lg px-3 text-sm text-muted hover:text-paper">
            My builds
          </button>
        ) : null
      }
    >
      <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 pt-8 pb-16 sm:pt-12">
        {!persistent && (
          <p role="status" className="mx-auto mb-6 flex max-w-2xl items-start gap-2 rounded-xl border border-pink/50 bg-pink/10 p-3 text-sm">
            <Warning size={18} className="mt-0.5 shrink-0 text-pink" />
            This browser can&apos;t save your plan (private window?). It will disappear if you refresh. Copy your PLAN.md as you go.
          </p>
        )}

        {mode === "intake" ? (
          <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[1fr_minmax(0,42rem)] lg:gap-16">
            <aside className="hidden lg:block">
              <div className="sticky top-28">
                <p className="font-mono text-xs uppercase tracking-widest text-pink">Build with Heckr</p>
                <h1 className="mt-3 text-5xl leading-[1.02]">Your mentor for the day.</h1>
                <p className="mt-4 max-w-[38ch] text-lg text-muted">
                  Five quick questions, then a plan from first terminal command to live link. Heckr won&apos;t write your code. It shows you how to drive your own agent.
                </p>
                <ul className="mt-8 space-y-3 text-sm text-muted">
                  <li className="flex items-center gap-2"><Sparkle size={16} className="text-pink" /> Powered by Claude Haiku</li>
                  <li className="flex items-center gap-2"><ShieldCheck size={16} className="text-pink" /> No sign-up. Your plan stays in this browser</li>
                  <li className="flex items-center gap-2"><Browser size={16} className="text-pink" /> Works on your phone next to your laptop</li>
                </ul>
              </div>
            </aside>
            <div>
              <div className="mb-8 lg:hidden">
                <h1 className="text-4xl leading-tight">Build with Heckr</h1>
                <p className="mt-2 text-muted">Your AI mentor for the day. Heckr won&apos;t write your code. It shows you how to drive your own agent.</p>
              </div>
              <Intake onSubmit={start} busy={busy} />
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl">
            <h1 className="text-4xl leading-tight sm:text-5xl">Your builds</h1>
            <p className="mt-2 text-muted">Saved in this browser only. Nobody else can see them.</p>

            <button
              type="button"
              onClick={() => setMode("intake")}
              className="mt-8 flex w-full items-center justify-between gap-4 rounded-2xl border border-dashed border-pink/60 p-5 text-left hover:bg-pink/5"
            >
              <span className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-pink text-ink"><Plus size={22} weight="bold" /></span>
                <span>
                  <span className="block text-lg font-bold">Start a new build</span>
                  <span className="text-sm text-muted">Five questions, then your plan</span>
                </span>
              </span>
              <ArrowRight size={20} className="text-pink" />
            </button>

            {projects === null ? (
              <div className="mt-4 space-y-3" aria-hidden="true">
                {[0, 1].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-ink-2" />)}
              </div>
            ) : (
              <ul className="mt-4 space-y-3">
                {projects.map((p, i) => {
                  const pct = progressOf(p);
                  return (
                    <motion.li
                      key={p.id}
                      initial={reduce ? false : { opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.3 }}
                    >
                      <Link href={`/build/${p.id}`} className="group block rounded-2xl border border-line bg-ink-2/80 p-5 hover:border-pink">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="truncate text-xl font-bold">{p.plan?.title ?? "Plan not made yet"}</p>
                            <p className="mt-1 line-clamp-2 text-sm text-muted">{p.plan?.pitch ?? p.profile.idea}</p>
                          </div>
                          <span className="font-mono text-2xl font-bold text-pink tabular-nums">{pct}%</span>
                        </div>
                        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-ink-3">
                          <div className="h-full rounded-full bg-pink" style={{ width: `${pct}%` }} />
                        </div>
                      </Link>
                    </motion.li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </main>
    </BuildShell>
  );
}
