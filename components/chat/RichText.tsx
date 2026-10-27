import { Fragment, type ReactNode } from "react";
import { CopyButton } from "./CopyButton";

// A deliberately small Markdown subset for model replies: fenced code (with copy),
// headings, bullet and numbered lists, **bold**, `inline code` and bare links.
// Text is never injected as HTML, so model output can't run scripts.

const URL_RE = /(https?:\/\/[^\s<>"'`]+[^\s<>"'`.,;:!?)\]])/g;
const INLINE_RE = /(\*\*[^*]+\*\*|`[^`\n]+`)/g;

function inline(text: string, key: string): ReactNode[] {
  return text.split(INLINE_RE).flatMap((part, i): ReactNode[] => {
    const k = `${key}-${i}`;
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return [<strong key={k} className="font-bold text-paper">{part.slice(2, -2)}</strong>];
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return [<code key={k} className="rounded bg-ink px-1.5 py-0.5 font-mono text-[0.85em] text-pink-soft">{part.slice(1, -1)}</code>];
    }
    return part.split(URL_RE).map((p, j) =>
      j % 2 === 1 ? (
        <a key={`${k}-${j}`} href={p} target="_blank" rel="noopener noreferrer" className="break-all text-pink underline underline-offset-2">
          {p}
        </a>
      ) : (
        <Fragment key={`${k}-${j}`}>{p}</Fragment>
      ),
    );
  });
}

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const isPrompt = lang === "prompt";
  return (
    <div className={`my-2.5 overflow-hidden rounded-xl border ${isPrompt ? "border-pink/40 bg-pink/5" : "border-line bg-ink"}`}>
      <div className="flex items-center justify-between gap-2 border-b border-line/70 py-1 pr-1 pl-3">
        <span className="font-mono text-[11px] uppercase tracking-widest text-muted">
          {isPrompt ? "Paste into your agent" : lang || "code"}
        </span>
        <CopyButton text={code} />
      </div>
      <pre className="overflow-x-auto p-3 font-mono text-[13px] leading-relaxed whitespace-pre-wrap break-words text-paper">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function blocks(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const lines = text.split("\n");
  let list: { ordered: boolean; items: string[] } | null = null;
  let para: string[] = [];

  const flushPara = () => {
    if (para.length) {
      const k = `${keyBase}-p${out.length}`;
      out.push(<p key={k} className="whitespace-pre-wrap break-words">{inline(para.join("\n"), k)}</p>);
      para = [];
    }
  };
  const flushList = () => {
    if (list) {
      const k = `${keyBase}-l${out.length}`;
      const items = list.items.map((it, i) => <li key={i} className="pl-1">{inline(it, `${k}-${i}`)}</li>);
      out.push(
        list.ordered ? (
          <ol key={k} className="list-decimal space-y-1 pl-5 marker:font-mono marker:text-pink">{items}</ol>
        ) : (
          <ul key={k} className="list-disc space-y-1 pl-5 marker:text-pink">{items}</ul>
        ),
      );
      list = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const h = /^#{1,4}\s+(.*)$/.exec(line);
    const ul = /^\s*[-*•]\s+(.*)$/.exec(line);
    const ol = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    if (h) {
      flushPara();
      flushList();
      const k = `${keyBase}-h${out.length}`;
      out.push(<p key={k} className="pt-1 font-bold text-paper">{inline(h[1], k)}</p>);
    } else if (ul || ol) {
      flushPara();
      const ordered = !!ol;
      if (list && list.ordered !== ordered) flushList();
      if (!list) list = { ordered, items: [] };
      list.items.push((ul ?? ol)![1]);
    } else if (!line.trim()) {
      flushPara();
      flushList();
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara();
  flushList();
  return out;
}

/** Renders model text. An unclosed fence (mid-stream) still renders as code. */
export function RichText({ text }: { text: string }) {
  const chunks = text.split("```");
  return (
    <div className="space-y-2">
      {chunks.map((chunk, i) => {
        if (i % 2 === 0) return chunk.trim() ? <Fragment key={i}>{blocks(chunk.trim(), `c${i}`)}</Fragment> : null;
        const nl = chunk.indexOf("\n");
        const lang = nl > -1 ? chunk.slice(0, nl).trim().toLowerCase() : "";
        const code = (nl > -1 ? chunk.slice(nl + 1) : chunk).replace(/\n$/, "");
        return <CodeBlock key={i} lang={lang} code={code} />;
      })}
    </div>
  );
}
