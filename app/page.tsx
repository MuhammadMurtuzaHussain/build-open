import { EVENT, LINKS, OWNABLE, THEMES, TRACKS } from "@/lib/event";
import { HappeningNow } from "@/components/HappeningNow";
import { Schedule } from "@/components/Schedule";
import { LinkButton } from "@/components/LinkButton";
import { LogoStrip } from "@/components/Logo";
import { Heckr } from "@/components/Heckr";
import Link from "next/link";

function SectionHeading({ id, kicker, children }: { id: string; kicker: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <p className="font-mono text-xs uppercase tracking-widest text-pink">{kicker}</p>
      <h2 id={id} className="mt-1 text-2xl sm:text-3xl">
        {children}
      </h2>
    </div>
  );
}

const ext = { target: "_blank", rel: "noopener noreferrer" } as const;

export default function Home() {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-lg focus:bg-pink focus:px-4 focus:py-3 focus:font-bold focus:text-ink"
      >
        Skip to main content
      </a>

      <header className="mx-auto max-w-2xl px-4 pt-10 pb-6 sm:pt-14">
        <p className="font-mono text-xs uppercase tracking-widest text-muted">Hacktoberfest Hack Day Galway</p>
        <h1 className="mt-2 text-6xl leading-[0.9] sm:text-7xl">
          Build <span className="text-pink">/</span>
          <br />
          Open<span className="text-pink">.</span>
        </h1>
        <p className="mt-4 text-lg text-muted">
          {EVENT.dateLabel} · The Cube, Áras na Mac Léinn
          <br />
          Cybersecurity Society x MLH, University of Galway
        </p>
      </header>

      <main id="main" tabIndex={-1} className="mx-auto max-w-2xl space-y-14 px-4 pb-32 focus:outline-none">
        <HappeningNow />

        <section aria-labelledby="buildmode-h">
          <Link
            href="/build"
            className="group relative block overflow-hidden rounded-3xl border border-pink bg-pink p-6 text-ink sm:p-8"
          >
            <h2 id="buildmode-h" className="max-w-[16ch] text-4xl leading-[1.02] sm:text-5xl">
              Build with Heckr
            </h2>
            <p className="mt-3 max-w-[42ch] text-lg text-ink/80">
              Your AI mentor for the day. Describe your idea, get a step-by-step plan, and send screenshots when you&apos;re stuck.
            </p>
            <span className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-ink px-5 font-bold text-paper transition-transform group-hover:translate-x-0.5">
              Start building <span aria-hidden="true">→</span>
            </span>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -right-6 -bottom-10 font-mono text-[10rem] leading-none font-bold text-ink/10 select-none sm:text-[13rem]"
            >
              H
            </span>
          </Link>
        </section>

        <section aria-labelledby="schedule-h">
          <SectionHeading id="schedule-h" kicker="The day">
            Schedule
          </SectionHeading>
          <Schedule />
        </section>

        <section aria-labelledby="tracks-h">
          <SectionHeading id="tracks-h" kicker="Prize categories">
            Tracks
          </SectionHeading>
          <div className="space-y-3">
            {TRACKS.map((t) => (
              <a
                key={t.name}
                href={t.link}
                {...ext}
                className="group block rounded-2xl border border-line bg-ink-2/70 p-5 hover:border-pink"
              >
                <h3 className="flex items-start justify-between gap-3 text-xl">
                  {t.name}
                  <span aria-hidden="true" className="font-mono text-pink transition-transform group-hover:translate-x-0.5">↗</span>
                </h3>
                <p className="mt-1.5 text-muted">{t.summary}</p>
                <p className="mt-3 font-mono text-xs uppercase tracking-widest text-paper">
                  <span className="text-pink">Prize</span> · {t.prize}
                </p>
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            ))}
          </div>
        </section>

        <section aria-labelledby="themes-h">
          <SectionHeading id="themes-h" kicker="Need a starting point?">
            Themes
          </SectionHeading>
          <p className="-mt-2 mb-4 text-muted">
            Optional prompts, one for each DEV Hacktoberfest 2026 challenge. Pick one, mix two, or ignore them all.
          </p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {THEMES.map((t) => (
              <li key={t.n} className={t.n === 5 ? "sm:col-span-2" : ""}>
                <a
                  href={t.link}
                  {...ext}
                  className="group flex h-full flex-col rounded-2xl border border-line bg-ink-2/70 p-5 hover:border-pink"
                >
                  <span className="font-mono text-sm text-pink">{String(t.n).padStart(2, "0")}</span>
                  <h3 className="mt-1 text-xl">{t.name}</h3>
                  <p className="mt-1.5 flex-1 text-[15px] text-muted">{t.description}</p>
                  <span className="mt-3 font-mono text-xs uppercase tracking-widest text-paper group-hover:text-pink">
                    DEV challenge ↗
                  </span>
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="links-h">
          <SectionHeading id="links-h" kicker="Everything in one place">
            Links
          </SectionHeading>
          <div className="space-y-3">
            <LinkButton href={LINKS.checkin.href} label={LINKS.checkin.label} note={`Check-in code ${EVENT.checkinCode}`} />
            <LinkButton href={LINKS.submit.href} label={LINKS.submit.label} note="Due 15:30" />
            <LinkButton href={LINKS.dev.href} label={LINKS.dev.label} note={LINKS.dev.note} />
            <LinkButton href={LINKS.promos.href} label={LINKS.promos.label} />
            <LinkButton href={LINKS.gemma.href} label={LINKS.gemma.label} />
            <LinkButton href={LINKS.ourDiscord.href} label={LINKS.ourDiscord.label} note="Cybersecurity Society" />
            <LinkButton href={LINKS.mlhDiscord.href} label={LINKS.mlhDiscord.label} />
            <LinkButton href={LINKS.feedback.href} label={LINKS.feedback.label} />
          </div>
          <div className="mt-4 rounded-2xl border border-line bg-ink-2/70 p-5">
            <h3 className="text-lg">Code of conduct</h3>
            <p className="mt-1.5 text-muted">
              Everyone here follows the{" "}
              <a href={LINKS.coc.href} {...ext} className="text-pink underline underline-offset-2">
                MLH code of conduct<span className="sr-only"> (opens in a new tab)</span>
              </a>
              . If something isn&apos;t right, tell an organiser in the room or email{" "}
              <a href={LINKS.incidents.href} className="text-pink underline underline-offset-2">
                {LINKS.incidents.label}
              </a>
              .
            </p>
          </div>
        </section>

        <section aria-labelledby="ownable-h">
          <a
            href={OWNABLE.href}
            {...ext}
            className="group block rounded-2xl border border-pink/50 bg-gradient-to-br from-pink/15 to-transparent p-6 hover:border-pink"
          >
            <p className="font-mono text-xs uppercase tracking-widest text-pink">Built by one of your organisers</p>
            <h2 id="ownable-h" className="mt-2 flex items-start justify-between gap-3 text-3xl">
              {OWNABLE.name}
              <span aria-hidden="true" className="font-mono text-2xl text-pink transition-transform group-hover:translate-x-0.5">↗</span>
            </h2>
            <p className="mt-1 font-bold text-paper">{OWNABLE.tagline}</p>
            <p className="mt-2 text-muted">{OWNABLE.blurb}</p>
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </section>

        <section aria-labelledby="partners-h">
          <SectionHeading id="partners-h" kicker="Made possible by">
            Partners
          </SectionHeading>
          <LogoStrip />
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto max-w-2xl space-y-2 px-4 pt-8 pb-28 text-sm text-muted">
          <p className="text-paper">{EVENT.fullName}</p>
          <p>
            {EVENT.dateLabel} · {EVENT.venue}
          </p>
          <p>
            <a href={LINKS.eventPage.href} {...ext} className="text-pink underline underline-offset-2">
              {LINKS.eventPage.label} on MLH<span className="sr-only"> (opens in a new tab)</span>
            </a>
          </p>
        </div>
      </footer>

      <Heckr />
    </>
  );
}
