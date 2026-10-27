import { EVENT, SCHEDULE } from "./event";

export const toSec = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 3600 + m * 60;
};

export const DAY_START = toSec("11:00");
export const DAY_END = toSec("17:00");
export const DUE = toSec("15:30");

export type Phase = "checkin" | "build" | "submit" | "judging" | "feedback";

export type AgendaState = {
  /** before = earlier date than event day, live = event day, after = later date */
  day: "before" | "live" | "after";
  secOfDay: number;
  dublinDate: string; // YYYY-MM-DD
  current: { label: string; time: string } | null;
  next: { label: string; time: string; key: string; inSec: number } | null;
  dueInSec: number | null; // seconds until projects due, if still ahead
  progress: number; // 0..1 across 11:00–17:00
  phase: Phase;
};

const TIME_RE = /^([01]?\d|2[0-3]):([0-5]\d)$/;

/** Parse "HH:MM" safely; returns seconds of day or null. */
export function parseOverride(v: string | null | undefined): number | null {
  if (!v) return null;
  const m = TIME_RE.exec(v.trim());
  return m ? Number(m[1]) * 3600 + Number(m[2]) * 60 : null;
}

/** Current date and seconds-of-day in Europe/Dublin, independent of the visitor's own timezone. */
export function dublinNow(d = new Date()): { date: string; secOfDay: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: EVENT.timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    secOfDay: Number(get("hour")) * 3600 + Number(get("minute")) * 60 + Number(get("second")),
  };
}

const daysBetween = (a: string, b: string) =>
  Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86_400_000);

export function phaseFor(sec: number): Phase {
  if (sec < toSec("12:00")) return "checkin";
  if (sec < toSec("15:00")) return "build";
  if (sec < DUE) return "submit";
  if (sec < toSec("16:45")) return "judging";
  return "feedback";
}

/**
 * Compute agenda state. With an override (?time=HH:MM), the date is treated as
 * the event day and the given seconds-of-day are used.
 */
export function computeAgenda(date: string, secOfDay: number, forceEventDay = false): AgendaState {
  const diff = forceEventDay ? 0 : daysBetween(date, EVENT.dateISO);
  const day: AgendaState["day"] = diff > 0 ? "before" : diff < 0 ? "after" : "live";
  const milestones = SCHEDULE.map((s) => ({ ...s, sec: toSec(s.time) }));

  if (day === "before") {
    const inSec = diff * 86400 + DAY_START - secOfDay;
    return {
      day, secOfDay, dublinDate: date, current: null,
      next: { label: milestones[0].label, time: milestones[0].time, key: milestones[0].key, inSec },
      dueInSec: diff * 86400 + DUE - secOfDay,
      progress: 0, phase: "checkin",
    };
  }
  if (day === "after") {
    return { day, secOfDay, dublinDate: date, current: null, next: null, dueInSec: null, progress: 1, phase: "feedback" };
  }

  const past = milestones.filter((m) => m.sec <= secOfDay);
  const upcoming = milestones.find((m) => m.sec > secOfDay) ?? null;
  const cur = past.at(-1) ?? null;
  const progress = Math.min(1, Math.max(0, (secOfDay - DAY_START) / (DAY_END - DAY_START)));

  return {
    day,
    secOfDay,
    dublinDate: date,
    current: cur ? { label: cur.label, time: cur.time } : null,
    next: upcoming ? { label: upcoming.label, time: upcoming.time, key: upcoming.key, inSec: upcoming.sec - secOfDay } : null,
    dueInSec: secOfDay < DUE ? DUE - secOfDay : null,
    progress,
    phase: phaseFor(secOfDay),
  };
}

export function fmtCountdown(total: number): string {
  const s = Math.max(0, Math.floor(total));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return d > 0 ? `${d}d ${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(h)}:${pad(m)}:${pad(sec)}`;
}

export const fmtClock = (sec: number) => {
  const s = ((Math.floor(sec) % 86400) + 86400) % 86400;
  return `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}`;
};
