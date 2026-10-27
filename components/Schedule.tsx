"use client";

import { SCHEDULE } from "@/lib/event";
import { toSec } from "@/lib/agenda";
import { useAgenda } from "@/lib/useAgenda";

export function Schedule() {
  const a = useAgenda();
  const live = a?.day === "live";
  const after = a?.day === "after";
  // Current item: the latest milestone that has started (live day only).
  const currentKey = live ? SCHEDULE.filter((s) => toSec(s.time) <= a!.secOfDay).at(-1)?.key : undefined;

  return (
    <ol className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-ink-2/70">
      {SCHEDULE.map((s) => {
        const isCurrent = s.key === currentKey;
        const isPast = after || (live && !isCurrent && toSec(s.time) <= a!.secOfDay);
        return (
          <li
            key={s.key}
            aria-current={isCurrent ? "step" : undefined}
            className={`flex items-center gap-4 px-4 py-3.5 ${isCurrent ? "bg-pink/10" : ""}`}
          >
            <span className={`w-14 shrink-0 font-mono text-sm tabular-nums ${isCurrent ? "text-pink" : isPast ? "text-muted/60" : "text-muted"}`}>
              {s.time}
            </span>
            <span className={`flex-1 ${isCurrent ? "font-bold text-paper" : isPast ? "text-muted/70 line-through decoration-line" : "text-paper"} ${s.key === "due" && !isPast ? "font-bold" : ""}`}>
              {s.label}
            </span>
            {isCurrent && (
              <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-pink">
                <span aria-hidden="true" className="live-dot h-1.5 w-1.5 rounded-full bg-pink" />
                Now
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
