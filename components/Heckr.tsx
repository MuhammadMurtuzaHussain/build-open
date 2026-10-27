"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { HeckrAvatar } from "@/components/HeckrAvatar";
import Link from "next/link";
import { RichText } from "@/components/chat/RichText";
import { readTimeParam } from "@/lib/useAgenda";

const MAX_CHARS = 1000;
const ERROR_MARKER = "[[heckr-error]]";
const GREETING = "Hey, I'm Heckr 👋 I help you build your stuff.";
const CHIPS = ["Give me an idea", "How do I submit?", "What's happening now?", "Help me debug"];

type Msg = { role: "user" | "assistant"; content: string; error?: boolean };

function Bubble({ msg }: { msg: Msg }) {
  const isUser = msg.role === "user";
  const [body, err] = msg.content.split(ERROR_MARKER);
  return (
    <li className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[15px] leading-snug ${
          isUser
            ? "rounded-br-sm bg-pink text-ink"
            : msg.error
              ? "rounded-bl-sm border border-pink/60 bg-ink-3 text-paper"
              : "rounded-bl-sm border border-line bg-ink-2 text-paper"
        }`}
      >
        {isUser ? <span className="whitespace-pre-wrap break-words">{msg.content}</span> : body.trim() && <RichText text={body.trimEnd()} />}
        {err && <p className={`text-pink ${body.trim() ? "mt-2" : ""}`}>{err.trim()}</p>}
      </div>
    </li>
  );
}

export function Heckr() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bubbleRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const wasOpen = useRef(false);
  const titleId = useId();

  // Focus the input on open, and return focus to the bubble on close.
  useEffect(() => {
    if (open) inputRef.current?.focus();
    else if (wasOpen.current) bubbleRef.current?.focus();
    wasOpen.current = open;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, busy]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || busy || text.length > MAX_CHARS) return;

      const history: Msg[] = [...messages, { role: "user", content: text }];
      setMessages([...history, { role: "assistant", content: "" }]);
      setInput("");
      setBusy(true);

      const ctrl = new AbortController();
      abortRef.current = ctrl;
      const setLast = (fn: (m: Msg) => Msg) =>
        setMessages((prev) => (prev.length ? [...prev.slice(0, -1), fn(prev[prev.length - 1])] : prev));

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            // Error replies are display-only; don't feed them back to the model.
            messages: history
              .filter((m) => !m.error)
              .map((m) => ({ role: m.role, content: m.content.split(ERROR_MARKER)[0] })),
            time: readTimeParam(),
          }),
          signal: ctrl.signal,
        });

        if (!res.ok || !res.body) {
          let msg = "Heckr couldn't answer just now. Try again, or ask an organiser in the room.";
          try {
            const data = (await res.json()) as { error?: string };
            if (data.error) msg = data.error;
          } catch {
            /* not JSON; keep the default */
          }
          setLast(() => ({ role: "assistant", content: msg, error: true }));
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          setLast((m) => ({ ...m, content: m.content + chunk }));
        }
        setLast((m) =>
          m.content.includes(ERROR_MARKER) ? { ...m, error: true } : m.content.trim() ? m : { ...m, content: "Heckr went quiet. Try asking again.", error: true },
        );
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setLast(() => ({
          role: "assistant",
          content: "Couldn't reach Heckr. Check your connection and try again, or ask an organiser in the room.",
          error: true,
        }));
      } finally {
        if (abortRef.current === ctrl) abortRef.current = null;
        setBusy(false);
      }
    },
    [busy, messages],
  );

  const reset = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setMessages([]);
    setInput("");
    setBusy(false);
    inputRef.current?.focus();
  };

  const remaining = MAX_CHARS - input.length;
  const lastIsEmptyAssistant = busy && messages.at(-1)?.role === "assistant" && !messages.at(-1)?.content;

  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-labelledby={titleId}
          className="fixed inset-x-3 bottom-3 z-50 flex h-[min(80dvh,640px)] flex-col overflow-hidden rounded-2xl border border-line bg-ink shadow-[0_20px_60px_rgba(0,0,0,0.6),0_0_0_1px_rgba(240,53,127,0.15)] sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-[400px]"
        >
          <header className="flex items-center justify-between gap-2 border-b border-line bg-ink-2 px-4 py-3">
            <h2 id={titleId} className="flex items-center gap-2 text-lg">
              <HeckrAvatar size={32} />
              Heckr
            </h2>
            <div className="flex items-center gap-1">
              <Link
                href="/build"
                className="flex min-h-10 items-center rounded-lg px-3 font-mono text-xs uppercase tracking-widest text-pink hover:bg-ink-3"
              >
                Build mode
              </Link>
              <button
                type="button"
                onClick={reset}
                className="min-h-10 rounded-lg px-3 font-mono text-xs uppercase tracking-widest text-muted hover:bg-ink-3 hover:text-paper"
              >
                New chat
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close Heckr"
                className="grid h-10 w-10 place-items-center rounded-lg text-xl text-muted hover:bg-ink-3 hover:text-paper"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
          </header>

          <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-4">
            <ul className="space-y-3" aria-live="polite" aria-relevant="additions text">
              <Bubble msg={{ role: "assistant", content: GREETING }} />
              {messages.map((m, i) =>
                i === messages.length - 1 && lastIsEmptyAssistant ? null : <Bubble key={i} msg={m} />,
              )}
              {lastIsEmptyAssistant && (
                <li className="flex justify-start" aria-label="Heckr is typing">
                  <div className="flex gap-1 rounded-2xl rounded-bl-sm border border-line bg-ink-2 px-4 py-3">
                    {[0, 1, 2].map((d) => (
                      <span key={d} className="live-dot h-1.5 w-1.5 rounded-full bg-pink" style={{ animationDelay: `${d * 0.2}s` }} />
                    ))}
                  </div>
                </li>
              )}
            </ul>
            {messages.length === 0 && (
              <Link
                href="/build"
                className="mt-4 block rounded-2xl border border-pink/50 bg-pink/10 p-4 hover:bg-pink/15"
              >
                <span className="block font-bold text-paper">Want me as your mentor all day?</span>
                <span className="mt-0.5 block text-sm text-muted">Build mode: describe your idea, get a step-by-step plan, send me screenshots when you&apos;re stuck.</span>
              </Link>
            )}
            {messages.length === 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {CHIPS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => send(c)}
                    className="min-h-10 rounded-full border border-pink/60 px-3.5 text-sm text-paper hover:bg-pink hover:text-ink"
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="border-t border-line bg-ink-2 p-3"
          >
            <div className="flex items-end gap-2">
              <label htmlFor={`${titleId}-input`} className="sr-only">
                Message Heckr
              </label>
              <textarea
                id={`${titleId}-input`}
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value.slice(0, MAX_CHARS))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                rows={1}
                maxLength={MAX_CHARS}
                placeholder="Ask Heckr anything…"
                aria-describedby={`${titleId}-count`}
                className="max-h-32 min-h-12 flex-1 resize-none rounded-xl border border-line bg-ink px-3 py-3 text-base text-paper placeholder:text-muted/70 focus:border-pink"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                className="min-h-12 rounded-xl bg-pink px-4 font-bold text-ink hover:bg-pink-soft disabled:cursor-not-allowed disabled:opacity-40"
              >
                Send
              </button>
            </div>
            <p
              id={`${titleId}-count`}
              className={`mt-1.5 text-right font-mono text-[11px] ${remaining <= 100 ? "text-pink" : "text-muted"}`}
            >
              {input.length}/{MAX_CHARS}
            </p>
          </form>
        </div>
      )}

      <button
        ref={bubbleRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={`fixed right-4 bottom-4 z-40 flex min-h-14 items-center gap-2.5 rounded-full bg-pink pr-5 pl-2 font-bold text-ink shadow-[0_10px_30px_rgba(240,53,127,0.35)] hover:bg-pink-soft sm:right-5 sm:bottom-5 ${
          open ? "hidden" : ""
        }`}
      >
        <HeckrAvatar size={36} className="ring-ink" />
        Ask Heckr
      </button>
    </>
  );
}
