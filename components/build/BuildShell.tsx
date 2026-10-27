import Link from "next/link";
import type { ReactNode } from "react";

export function BuildShell({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <header className="sticky top-0 z-30 border-b border-line bg-ink/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xl font-bold leading-none tracking-tight" aria-label="Build Open home">
              Build<span className="text-pink">/</span>Open<span className="text-pink">.</span>
            </Link>
            <span aria-hidden="true" className="h-5 w-px bg-line" />
            <Link href="/build" className="font-mono text-xs uppercase tracking-widest text-pink hover:text-pink-soft">
              Build mode
            </Link>
          </div>
          {right}
        </div>
      </header>
      {children}
    </div>
  );
}
