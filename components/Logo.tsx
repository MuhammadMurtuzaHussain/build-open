"use client";

import { useEffect, useRef, useState } from "react";
import { LOGOS } from "@/lib/event";

type Props = { src: string; alt: string; caption?: string };

/** Logo image from /public/logos/, falling back to the name as text if the file is missing. */
export function Logo({ src, alt, caption }: Props) {
  const [failed, setFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // The server-rendered <img> can fail before hydration attaches onError, so check once mounted.
  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth === 0) setFailed(true);
  }, []);
  return (
    <figure className="flex flex-col items-center gap-2 text-center">
      <div className="flex h-16 w-full items-center justify-center rounded-xl border border-line bg-ink-2/80 px-4">
        {failed ? (
          <span className="text-base font-bold leading-tight text-paper">{alt}</span>
        ) : (
          // Plain <img> so a missing file can fall back to text via onError.
          // eslint-disable-next-line @next/next/no-img-element
          <img ref={imgRef} src={src} alt={alt} onError={() => setFailed(true)} className="max-h-10 w-auto max-w-full object-contain" />
        )}
      </div>
      {caption && <figcaption className="font-mono text-[11px] uppercase tracking-widest text-muted">{caption}</figcaption>}
    </figure>
  );
}

export function LogoStrip() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {LOGOS.map((l) => (
        <Logo key={l.src} {...l} />
      ))}
    </div>
  );
}
