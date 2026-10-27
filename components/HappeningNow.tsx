"use client";

import { useState } from "react";
import { EVENT, LINKS, SCHEDULE } from "@/lib/event";
import { DAY_END, DAY_START, fmtClock, fmtCountdown, toSec } from "@/lib/agenda";
import { useAgenda } from "@/lib/useAgenda";
import { LinkButton } from "./LinkButton";

function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          /* clipboard blocked; the code is visible anyway */
        }
      }}
      className="flex min-h-14 w-full items-center justify-between rounded-xl border border-dashed border-pink/70 bg-ink-2 px-4 py-3 hover:bg-ink-3"
    >
      <span className="flex flex-col text-left">
        <span className="font-mono text-xs uppercase tracking-widest text-muted">Check-in code</span>
        <span className="font-mono text-2xl font-bold tracking-[0.2em] text-paper">{code}</span>
      </span>
      <span className="font-mono text-sm text-pink" aria-live="polite">
        {copied ? "Copied" : "Tap to copy"}
      </span>
    </button>
  );
}

function ProgressBar({ progress }: { progress: number }) {
  const span = DAY_END - DAY_START;
  return (
    <div className="mt-6">
      <div
        role="progressbar"
        aria-label="Progress through the day, 11:00 to 17:00"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
        className="relative h-3 overflow-hidden rounded-full border border-line bg-ink-2"
      >
        <div className="h-full rounded-full bg-pink transition-[width] duration-1000" style={{ width: `${progress * 100}%` }} />
        {SCHEDULE.slice(1, -1).map((s) => (
          <span
            key={s.key}
            aria-hidden="true"
            className={`absolute top-0 h-full w-px ${s.key === "due" ? "bg-paper" : "bg-ink/60"}`}
            style={{ left: `${((toSec(s.time) - DAY_START) / span) * 100}%` }}
          />
        ))}
      </div>
      <div aria-hidden="true" className="mt-1.5 flex justify-between font-mono text-[11px] text-muted">
        <span>11:00</span>
        <span className="text-paper" style={{ marginLeft: "20%" }}>15:30 due</span>
        <span>17:00</span>
      </div>
    </div>
  );
}

function CallToAction({ phase, day }: { phase: string; day: string }) {
  if (day === "after" || phase === "feedback") {
    return (
      <div className="space-y-3">
        <p className="text-muted">That's a wrap. Thank you for building with us. Two minutes of feedback helps us run the next one better.</p>
        <LinkButton href={LINKS.feedback.href} label="Give feedback" variant="primary" size="lg" />
        <LinkButton href={LINKS.dev.href} label={LINKS.dev.label} note={LINKS.dev.note} />
      </div>
    );
  }
  if (phase === "checkin") {
    return (
      <div className="space-y-3">
        <p className="text-muted">
          {day === "before" ? "See you on Thursday. " : ""}Check in with MLH before hacking starts at 12:00.
        </p>
        <LinkButton href={LINKS.checkin.href} label="Check in now" variant="primary" size="lg" />
        <CopyCode code={EVENT.checkinCode} />
      </div>
    );
  }
  if (phase === "build") {
    return (
      <div className="space-y-3">
        <ul className="space-y-2 rounded-xl border border-line bg-ink-2/80 p-4 text-[15px]">
          {[
            "Scope to one feature you can demo in two minutes.",
            "Commit and push early. Your repo is your safety net.",
            "Start your DEV write-up while you build, not after.",
            "Stuck for 15 minutes? Ask Heckr or grab an organiser.",
          ].map((t) => (
            <li key={t} className="flex gap-2">
              <span aria-hidden="true" className="font-mono text-pink">›</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
        <LinkButton href={LINKS.gemma.href} label="Gemma demo" note="Get started with Gemma open models" />
        <LinkButton href={LINKS.promos.href} label={LINKS.promos.label} />
      </div>
    );
  }
  if (phase === "submit") {
    return (
      <div className="space-y-3">
        <p className="font-bold text-paper">Projects are due at 15:30. Submit what you have; a working demo beats a perfect plan.</p>
        <LinkButton href={LINKS.submit.href} label="Submit now" note="MLH event page" variant="primary" size="lg" />
        <LinkButton href={LINKS.dev.href} label={LINKS.dev.label} note={LINKS.dev.note} />
      </div>
    );
  }
  // judging
  return (
    <div className="space-y-3">
      <p className="text-muted">Projects are in. While judging runs, write your project up on DEV for promo credits and sponsor prizes.</p>
      <LinkButton href={LINKS.dev.href} label={LINKS.dev.label} note={LINKS.dev.note} variant="primary" size="lg" />
      <LinkButton href={LINKS.submit.href} label="View submissions" note="MLH event page" />
    </div>
  );
}

export function HappeningNow() {
  const a = useAgenda();

  if (!a) {
    return (
      <section aria-labelledby="now-h" className="rounded-2xl border border-line bg-ink-2/70 p-5">
        <h2 id="now-h" className="font-mono text-xs uppercase tracking-widest text-muted">Happening now</h2>
        <div className="mt-4 h-40 animate-pulse rounded-xl bg-ink-3/60" />
      </section>
    );
  }

  const heroIsDue = a.day === "live" && a.dueInSec !== null && a.secOfDay >= DAY_START - 3600;
  const heroSec = heroIsDue ? a.dueInSec! : a.next?.inSec ?? null;
  const heroLabel = heroIsDue ? "Projects due in" : a.next ? `${a.next.label} in` : null;

  const status =
    a.day === "before" ? "Thursday 29 October" : a.day === "after" ? "Event finished" : `Dublin ${fmtClock(a.secOfDay)}`;

  return (
    <section aria-labelledby="now-h" className="rounded-2xl border border-line bg-ink-2/70 p-5 shadow-[0_0_0_1px_rgba(240,53,127,0.08)] backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2">
        <h2 id="now-h" className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-pink">
          {a.day === "live" && <span aria-hidden="true" className="live-dot inline-block h-2 w-2 rounded-full bg-pink" />}
          Happening now
        </h2>
        <span className="font-mono text-xs text-muted">
          {a.simulated && <span className="mr-1 rounded bg-paper px-1 text-ink">TEST</span>}
          {status}
        </span>
      </div>

      <div aria-live="polite" className="mt-4">
        <p className="text-2xl font-bold leading-tight sm:text-3xl">
          {a.day === "before"
            ? "Build Open starts soon"
            : a.day === "after"
              ? "Thanks for building with us"
              : a.current?.label ?? "Doors open at 11:00"}
        </p>
        {a.next && (
          <p className="mt-1 text-muted">
            Next: <span className="text-paper">{a.next.label}</span> at <span className="font-mono">{a.next.time}</span>
          </p>
        )}
      </div>

      {heroSec !== null && heroLabel && (
        <div className="mt-5 rounded-xl border border-pink/40 bg-ink p-4">
          <p className="font-mono text-xs uppercase tracking-widest text-pink">{heroLabel}</p>
          <p
            className="mt-1 font-mono text-5xl font-bold tabular-nums tracking-tight sm:text-6xl"
            aria-label={`${heroLabel} ${fmtCountdown(heroSec)}`}
            role="timer"
          >
            {fmtCountdown(heroSec)}
          </p>
          {heroIsDue && a.next && a.next.key !== "due" && (
            <p className="mt-2 font-mono text-sm text-muted">
              {a.next.label} in {fmtCountdown(a.next.inSec)}
            </p>
          )}
        </div>
      )}

      {a.day === "live" && <ProgressBar progress={a.progress} />}

      <div className="mt-6">
        <CallToAction phase={a.phase} day={a.day} />
      </div>
    </section>
  );
}
