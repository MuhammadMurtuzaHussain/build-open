"use client";

import { useEffect, useState } from "react";
import { AgendaState, computeAgenda, dublinNow, parseOverride } from "./agenda";

/** Reads the hidden ?time=HH:MM test parameter, if present and valid. */
export function readTimeParam(): string | null {
  if (typeof window === "undefined") return null;
  const v = new URLSearchParams(window.location.search).get("time");
  return parseOverride(v) !== null ? v : null;
}

/**
 * Live agenda state, ticking once a second. With ?time=HH:MM the clock starts
 * at that time on the event day and keeps running, so countdowns still move.
 * Returns null until mounted to avoid a server/client mismatch.
 */
export function useAgenda(): (AgendaState & { simulated: boolean }) | null {
  const [state, setState] = useState<(AgendaState & { simulated: boolean }) | null>(null);

  useEffect(() => {
    const override = parseOverride(readTimeParam());
    const startedAt = Date.now();

    const tick = () => {
      if (override !== null) {
        const elapsed = (Date.now() - startedAt) / 1000;
        setState({ ...computeAgenda(dublinNow().date, override + elapsed, true), simulated: true });
      } else {
        const now = dublinNow();
        setState({ ...computeAgenda(now.date, now.secOfDay), simulated: false });
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    const onVis = () => document.visibilityState === "visible" && tick();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return state;
}
