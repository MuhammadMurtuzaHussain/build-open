// In-memory sliding window per IP and bucket. Resets when a serverless instance
// recycles, which is fine for a one-day event. Use Upstash Redis if you need it global.

const hits = new Map<string, number[]>();

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return { ok: false, retryAfter: Math.ceil((windowMs - (now - recent[0])) / 1000) };
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
  }
  return { ok: true, retryAfter: 0 };
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] || req.headers.get("x-real-ip") || "unknown").trim();
}

export const jsonError = (status: number, error: string, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify({ error }), {
    status,
    headers: { "Content-Type": "application/json", ...extra },
  });

export function tooFast(retryAfter: number): Response {
  const mins = Math.max(1, Math.ceil(retryAfter / 60));
  return jsonError(429, `You're going fast. Give it about ${mins} min and try again, or grab an organiser.`, {
    "Retry-After": String(retryAfter),
  });
}

/** Shared model settings. Haiku 5.5 at medium effort keeps answers sharp and cheap. */
export const MODEL = process.env.HECKR_MODEL || "claude-haiku-5-5";
export const EFFORT = "medium" as const;
