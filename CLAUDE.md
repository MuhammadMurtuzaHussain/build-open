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

## To do
1. `components/Heckr.tsx` (client): floating bubble bottom right that opens a panel (dialog semantics, Esc closes, focus to input on open and back to the bubble on close). Greeting: "Hey, I'm Heckr 👋 I help you build your stuff." Quick-reply chips: "Give me an idea", "How do I submit?", "What's happening now?", "Help me debug". Streams from `/api/chat`, sends the `?time` param when present, linkifies URLs, renders fenced code, shows 429/400/503 JSON errors and the `[[heckr-error]]` marker kindly, has a "New chat" reset, and a character counter at 1000.
2. `components/Logo.tsx`: image from `/public/logos/` with text fallback if the file is missing. Strip shows MLH, Cybersecurity Society, Liberty IT (captioned "Exclusive industry sponsor").
3. `components/Schedule.tsx` (client): schedule list highlighting the current item.
4. `app/page.tsx`: "Build / Open." wordmark, HappeningNow first, then Schedule, Tracks, Themes (cards), Links (all from `LINKS`, code of conduct with incidents@mlh.io), an Ownable card, logo strip, footer with venue and event page link. Skip link to main content.
5. `public/logos/README.md` naming the expected files.
6. `README.md`: setup, `.env.example`, local run, `?time=` testing, one-click Vercel deploy (set `ANTHROPIC_API_KEY` in project settings), note that the rate limit is per serverless instance.
7. Verify: `npm run build` and `npm run typecheck` pass; test `?time=` at 10:30, 12:30, 15:10, 15:35, 16:50 and on a non-event day; test `/api/chat` validation without a key (expect 503) and with an oversize message.

## Commands
- `npm install`
- `npm run dev` then open http://localhost:3000 (try `/?time=15:10`)
- `npm run build`, `npm run typecheck`
