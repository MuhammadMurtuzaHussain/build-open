"use client";

import { useState } from "react";
import { Check, Copy } from "@phosphor-icons/react";

export function CopyButton({ text, label = "Copy", className = "" }: { text: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          /* clipboard blocked; the text is visible to select by hand */
        }
      }}
      className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 font-mono text-xs text-muted hover:bg-ink-3 hover:text-paper ${className}`}
    >
      {copied ? <Check size={14} weight="bold" className="text-pink" /> : <Copy size={14} />}
      <span aria-live="polite">{copied ? "Copied" : label}</span>
    </button>
  );
}
