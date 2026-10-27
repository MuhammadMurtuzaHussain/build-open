# Build Open

One-page, mobile-first site for **Build Open, Hacktoberfest Hack Day Galway x Cybersecurity Society, University of Galway**, on Thursday 29 October 2026 in The Cube, Áras na Mac Léinn. Attendees open it on their phones from a QR code.

It shows a live "Happening now" block (countdown to the 15:30 deadline and a call to action that changes through the day), the schedule, tracks, themes and links. It also includes **Heckr**, a chat assistant running on Claude Haiku.

Next.js 15 (App Router), TypeScript, Tailwind v4 and `@anthropic-ai/sdk`. There's no database.

## Setup

```bash
npm install
cp .env.example .env.local
```

Put your Anthropic API key in `.env.local`:

```
ANTHROPIC_API_KEY=sk-ant-...
```

The key is only read on the server, in `app/api/chat/route.ts`. Never give it a `NEXT_PUBLIC_` prefix. Optional settings, with their defaults, are listed in `.env.example`:

- `HECKR_MODEL`: `claude-haiku-4-5`
- `HECKR_RATE_LIMIT`: 20 messages per IP
- `HECKR_RATE_WINDOW_MINUTES`: 10

Without a key, the site still works and Heckr replies with a friendly "isn't switched on yet" message.

## Run locally

```bash
npm run dev
```

Open http://localhost:3000.

## Testing the day with `?time=`

Add `?time=HH:MM` to start a simulated Dublin clock on the event day. It keeps ticking from that time. A **TEST** badge appears, and Heckr is told the simulated time too.

| URL | What you should see |
| --- | --- |
| `/?time=10:30` | Countdown to the 15:30 deadline, check-in call to action and code |
| `/?time=12:30` | Hacking in progress, building tips |
| `/?time=15:10` | Big "Submit now" button |
| `/?time=15:35` | Judging, DEV write-up prompt |
| `/?time=16:50` | Feedback link |
| `/` on any other day | Countdown to doors (before) or "Event finished" (after) |

## Editing event facts

All facts, the schedule, tracks, themes, links and logos live in `lib/event.ts`. The page and Heckr's system prompt (`lib/prompt.ts`) both read from that file, so it's the only place to edit them. Logo files go in `public/logos/`; see the README there.

## Deploy to Vercel

1. Push this repo to GitHub.
2. On [vercel.com/new](https://vercel.com/new), import the repo. The framework is detected as Next.js, so no build settings are needed.
3. In **Project Settings → Environment Variables**, add `ANTHROPIC_API_KEY` for Production (and Preview if you want Heckr on preview links).
4. Deploy, then point the QR code at the production URL.

If you add or change the key after deploying, redeploy so the new value is picked up.

### Note on the rate limit

The limit is an in-memory sliding window, so it applies **per serverless instance**, not globally. Under load, Vercel may run several instances, each with its own counter. That's fine for a one-day event. If you need a global limit, back it with Upstash Redis from the Vercel Marketplace.

## Checks

```bash
npm run typecheck
npm run build
```
