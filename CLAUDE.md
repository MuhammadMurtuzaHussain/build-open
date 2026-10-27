# Build Open: event site + Heckr chat

One-page, mobile-first event site for **Build Open, Hacktoberfest Hack Day Galway x Cybersecurity Society, University of Galway** (Thursday 29 October 2026, The Cube, Áras na Mac Léinn). Students open it on phones from a QR code. Includes **Heckr**, a chat assistant on Claude Haiku.

Stack: Next.js 15 (App Router), TypeScript, Tailwind v4, `@anthropic-ai/sdk`. No database. Deploy target: Vercel.

## Hard rules
- **Never invent event facts.** All facts, schedule, tracks, themes and links live in `lib/event.ts`. The page and Heckr's prompt both read from it. Edit facts there only.
- The API key stays server-side in `ANTHROPIC_API_KEY`. Never use a `NEXT_PUBLIC_` prefix or send it to the browser.
- British English in all copy.
- Dark only. Colours: ink `#14060e` (with subtle grid), pink `#f0357f`, paper `#f6eef1`. Space Grotesk Bold for headings, JetBrains Mono for labels and countdowns (self-hosted via @fontsource).
- Accessible: good contrast, keyboard friendly, visible focus, respects reduced motion.

## Done
- `lib/event.ts`: EVENT, SCHEDULE, TRACKS, THEMES (5, paraphrased from the DEV Hacktoberfest 2026 challenge pages, each with its challenge link), LINKS, OWNABLE (organiser's project, https://ownable.muhammadmurtuza.com, "Build it. Ship it. Own it."), LOGOS.
- `lib/agenda.ts`: Europe/Dublin clock via Intl, `computeAgenda()` gives day (before/live/after), current/next milestone, seconds to 15:30, day progress (11:00–17:00) and phase. Phases: checkin <12:00, build <15:00, submit <15:30, judging <16:45, feedback after.
- `lib/useAgenda.ts`: client hook ticking each second. Hidden `?time=HH:MM` starts a simulated clock on the event day that keeps running.
- `lib/prompt.ts`: Heckr system prompt with all facts, links, current Dublin time, scope (ideas, 3.5h scoping, debugging, Gemma/open models, submission and DEV write-up), "ask an organiser in the room" fallback, no invented prizes/rules/links, injection resistance.
- `app/api/chat/route.ts`: POST `{ messages, time? }`, streams plain text. Per-IP sliding-window rate limit (20 per 10 min, in-memory, env-configurable), 1000-char message cap, history trim, friendly errors. A mid-stream failure appends a line starting with the marker `[[heckr-error]]` for the client to render as an error.
- `components/LinkButton.tsx`: large tappable link buttons.
- `components/HappeningNow.tsx`: status, current/next, hero countdown (to 15:30 on the day), progress bar with milestone ticks, phase-based call to action (check in + copyable code, building tips, big "Submit now" from 15:00, DEV write-up during judging, feedback after 16:45).
- `app/layout.tsx`, `app/globals.css`, config files, `.env.example`, `.gitignore`.
- `components/Heckr.tsx`: floating "Ask Heckr" bubble opening a dialog panel (Esc closes, focus to input on open and back to the bubble on close), greeting, four quick-reply chips, streaming from `/api/chat` with the `?time` param, linkified URLs, fenced code blocks, JSON and `[[heckr-error]]` errors shown kindly (and not sent back to the model), "New chat" reset, 1000-character counter.
- `components/Logo.tsx`: `Logo` and `LogoStrip`, with a text fallback for missing files (also checked after hydration, since the server-rendered image can fail before `onError` attaches).
- `components/Schedule.tsx`: schedule with the current item highlighted and past items struck through.
- `app/page.tsx`: wordmark, HappeningNow, Schedule, Tracks, Themes, Links with code of conduct, Ownable card, Partners strip, footer, skip link, Heckr.
- `public/logos/README.md`, `README.md` (setup, `?time=` testing, Vercel deploy, per-instance rate limit note).
- Verified: typecheck and build pass; `?time=` at 10:30, 12:30, 15:10, 15:35, 16:50 and the real date (before the event) show the right phase and schedule highlight; `/api/chat` returns 503 without a key, 400 for oversize/empty/bad JSON, the error marker with a bad key, and 429 after 20 requests.

## To do
- Add the real logo files to `public/logos/` (light versions for the dark background).
- Deploy to Vercel, set `ANTHROPIC_API_KEY`, and test Heckr end to end with a real key.
- Point the QR code at the production URL.

## Commands
- `npm install`
- `npm run dev` then open http://localhost:3000 (try `/?time=15:10`)
- `npm run build`, `npm run typecheck`
