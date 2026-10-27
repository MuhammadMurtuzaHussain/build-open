"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HeckrAvatar } from "@/components/HeckrAvatar";
import {
  ArrowUp,
  ImageSquare,
  Microphone,
  SpeakerHigh,
  SpeakerSlash,
  Stop,
  Trash,
  X,
} from "@phosphor-icons/react";
import { RichText } from "@/components/chat/RichText";
import { newId } from "@/lib/mentor/db";
import { imageToDataUrl, useDictation, useReadAloud } from "@/lib/mentor/media";
import { PHASE_LABELS, type MentorMsg, type PlanStep, type Project } from "@/lib/mentor/types";
import { readTimeParam } from "@/lib/useAgenda";

const MAX_CHARS = 2000;
const ERROR_MARKER = "[[heckr-error]]";

export type Focus = { phaseId: keyof typeof PHASE_LABELS; step: PlanStep } | null;

function chipsFor(focus: Focus, hasPlan: boolean): string[] {
  if (focus) {
    return [
      "I'm stuck on this step",
      "Explain this like I'm new",
      focus.step.kind === "prompt" ? "My agent did something weird" : "What exactly do I type?",
      "Check my screenshot",
    ];
  }
  return hasPlan
    ? ["What should I do next?", "How do I start my coding agent?", "Help me read an error", "Is my plan too big?"]
    : ["What should I do next?"];
}

export function MentorChat({
  project,
  focus,
  onClearFocus,
  onMessages,
}: {
  project: Project;
  focus: Focus;
  onClearFocus: () => void;
  onMessages: (msgs: MentorMsg[]) => void;
}) {
  const [messages, setMessages] = useState<MentorMsg[]>(project.messages);
  const [input, setInput] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [imgError, setImgError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const baseRef = useRef("");
  const speech = useReadAloud();
  const dictation = useDictation((t) => setInput(((baseRef.current ? baseRef.current + " " : "") + t).slice(0, MAX_CHARS)));

  // Persist whenever a turn settles (not on every streamed chunk).
  const persist = useCallback((msgs: MentorMsg[]) => onMessages(msgs), [onMessages]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, busy]);

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    if (focus) inputRef.current?.focus();
  }, [focus]);

  const attach = async (file: File | undefined | null) => {
    if (!file) return;
    setImgError(null);
    try {
      setImage(await imageToDataUrl(file));
    } catch {
      setImgError("That file isn't an image Heckr can read. Try a PNG or JPEG screenshot.");
    }
  };

  const send = async (raw: string) => {
    const text = raw.trim();
    if ((!text && !image) || busy || text.length > MAX_CHARS) return;
    if (dictation.listening) dictation.stop();

    const userMsg: MentorMsg = { id: newId(), role: "user", content: text, ...(image ? { image } : {}) };
    const history = [...messages, userMsg];
    const pending: MentorMsg = { id: newId(), role: "assistant", content: "" };
    setMessages([...history, pending]);
    setInput("");
    setImage(null);
    setBusy(true);

    const plan = project.plan;
    const allSteps = plan?.phases.flatMap((p) => p.steps) ?? [];
    const doneCount = allSteps.filter((s) => project.done[s.id]).length;
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    let final: MentorMsg = pending;
    const update = (m: MentorMsg) => {
      final = m;
      setMessages([...history, m]);
    };

    try {
      const res = await fetch("/api/mentor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: ctrl.signal,
        body: JSON.stringify({
          profile: project.profile,
          time: readTimeParam(),
          context: {
            planTitle: plan?.title,
            pitch: plan?.pitch,
            mvp: plan?.mvp,
            agentId: plan?.agentId,
            progress: `${doneCount} of ${allSteps.length} steps ticked off`,
            focus: focus
              ? { phase: PHASE_LABELS[focus.phaseId], title: focus.step.title, detail: focus.step.detail, content: focus.step.content }
              : null,
          },
          messages: history.filter((m) => !m.error).map((m) => ({ role: m.role, content: m.content, image: m.image })),
        }),
      });

      if (!res.ok || !res.body) {
        let msg = "Heckr couldn't answer just now. Try again, or ask an organiser in the room.";
        try {
          const data = (await res.json()) as { error?: string };
          if (data.error) msg = data.error;
        } catch {
          /* keep default */
        }
        update({ ...pending, content: msg, error: true });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        update({ ...pending, content: acc });
      }
      if (acc.includes(ERROR_MARKER)) update({ ...pending, content: acc, error: true });
      else if (!acc.trim()) update({ ...pending, content: "Heckr went quiet. Try asking again.", error: true });
    } catch (e) {
      if ((e as Error).name === "AbortError") {
        if (!final.content.trim()) setMessages(history);
        return;
      }
      update({ ...pending, content: "Couldn't reach Heckr. Check your connection and try again.", error: true });
    } finally {
      if (abortRef.current === ctrl) abortRef.current = null;
      setBusy(false);
      persist(final.content.trim() ? [...history, final] : history);
    }
  };

  const clear = () => {
    abortRef.current?.abort();
    setMessages([]);
    persist([]);
  };

  const lastEmpty = busy && messages.at(-1)?.role === "assistant" && !messages.at(-1)?.content;

  return (
    <section aria-label="Mentor chat" className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
        <div className="flex items-center gap-2.5">
          <HeckrAvatar size={40} />
          <div className="leading-tight">
            <p className="font-bold">Heckr</p>
            <p className="text-xs text-muted">Your mentor for the day</p>
          </div>
        </div>
        {messages.length > 0 && !busy && (
          <button type="button" onClick={clear} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs text-muted hover:bg-ink-3 hover:text-paper">
            <Trash size={14} /> Clear chat
          </button>
        )}
      </div>

      <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="rounded-2xl border border-dashed border-line p-5 text-[15px] text-muted">
            <p className="text-paper">
              I&apos;m here all day. Ask me anything about your build, paste an error, or snap a screenshot of what&apos;s on your screen.
            </p>
            <p className="mt-2">I won&apos;t write your code, but I&apos;ll tell you exactly what to ask your agent.</p>
          </div>
        )}
        <ul className="space-y-4" aria-live="polite" aria-relevant="additions text">
          {messages.map((m, i) => {
            if (i === messages.length - 1 && lastEmpty) return null;
            const isUser = m.role === "user";
            const [body, err] = m.content.split(ERROR_MARKER);
            return (
              <li key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[92%] ${isUser ? "" : "w-full"}`}>
                  <div
                    className={`rounded-2xl px-4 py-3 text-[15px] leading-relaxed ${
                      isUser
                        ? "rounded-br-sm bg-pink text-ink"
                        : m.error
                          ? "rounded-bl-sm border border-pink/60 bg-ink-3"
                          : "rounded-bl-sm border border-line bg-ink-2"
                    }`}
                  >
                    {m.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.image} alt="Your screenshot" className="mb-2 max-h-56 rounded-lg border border-ink/20 object-contain" />
                    )}
                    {isUser ? (
                      <p className="whitespace-pre-wrap break-words">{m.content}</p>
                    ) : (
                      <>
                        {body.trim() && <RichText text={body.trimEnd()} />}
                        {err && <p className={`text-pink ${body.trim() ? "mt-2" : ""}`}>{err.trim()}</p>}
                      </>
                    )}
                  </div>
                  {!isUser && !m.error && m.content && speech.supported && !(busy && i === messages.length - 1) && (
                    <button
                      type="button"
                      onClick={() => speech.toggle(m.id, body)}
                      className="mt-1 inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2 text-xs text-muted hover:text-paper"
                    >
                      {speech.speakingId === m.id ? <SpeakerSlash size={14} /> : <SpeakerHigh size={14} />}
                      {speech.speakingId === m.id ? "Stop reading" : "Read aloud"}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
          {lastEmpty && (
            <li className="flex justify-start" aria-label="Heckr is thinking">
              <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm border border-line bg-ink-2 px-4 py-3 text-sm text-muted">
                {[0, 1, 2].map((d) => (
                  <span key={d} className="live-dot h-1.5 w-1.5 rounded-full bg-pink" style={{ animationDelay: `${d * 0.2}s` }} />
                ))}
                <span className="ml-1">Thinking it through</span>
              </div>
            </li>
          )}
        </ul>
      </div>

      <div className="border-t border-line bg-ink-2/60 p-3">
        {focus && (
          <div className="mb-2 flex items-center justify-between gap-2 rounded-xl border border-pink/40 bg-pink/10 px-3 py-2 text-sm">
            <span className="min-w-0 truncate">
              <span className="text-muted">Asking about: </span>
              <span className="font-bold">{focus.step.title}</span>
            </span>
            <button type="button" onClick={onClearFocus} aria-label="Stop asking about this step" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg hover:bg-ink-3">
              <X size={14} weight="bold" />
            </button>
          </div>
        )}

        {!busy && (
          <div className="-mx-3 mb-2 flex gap-2 overflow-x-auto px-3 pb-1">
            {chipsFor(focus, !!project.plan).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => (c === "Check my screenshot" ? fileRef.current?.click() : send(c))}
                className="min-h-9 shrink-0 rounded-full border border-line px-3.5 text-sm text-paper hover:border-pink hover:text-pink"
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {image && (
          <div className="mb-2 flex items-center gap-3 rounded-xl border border-line bg-ink p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="Screenshot to send" className="h-14 w-20 rounded-md object-cover" />
            <span className="flex-1 text-sm text-muted">Screenshot attached. Add a note or just send.</span>
            <button type="button" onClick={() => setImage(null)} aria-label="Remove screenshot" className="grid h-9 w-9 place-items-center rounded-lg hover:bg-ink-3">
              <X size={16} weight="bold" />
            </button>
          </div>
        )}
        {(imgError || dictation.error) && <p role="alert" className="mb-2 text-sm text-pink">{imgError ?? dictation.error}</p>}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-end gap-2"
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => {
              attach(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            aria-label="Attach a screenshot"
            className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-line text-paper hover:border-pink hover:text-pink"
          >
            <ImageSquare size={22} />
          </button>
          <label htmlFor="mentor-input" className="sr-only">Message Heckr</label>
          <textarea
            id="mentor-input"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, MAX_CHARS))}
            onPaste={(e) => {
              const file = [...e.clipboardData.files].find((f) => f.type.startsWith("image/"));
              if (file) {
                e.preventDefault();
                attach(file);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={1}
            placeholder={dictation.listening ? "Listening…" : "Ask Heckr anything…"}
            className="max-h-36 min-h-12 flex-1 resize-none rounded-xl border border-line bg-ink px-3 py-3 text-base text-paper placeholder:text-muted/70 focus:border-pink"
          />
          {dictation.supported && (
            <button
              type="button"
              onClick={() => {
                if (dictation.listening) dictation.stop();
                else {
                  baseRef.current = input.trim();
                  dictation.start();
                }
              }}
              aria-pressed={dictation.listening}
              aria-label={dictation.listening ? "Stop dictating" : "Dictate a message"}
              className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl border transition-colors ${
                dictation.listening ? "border-pink bg-pink text-ink" : "border-line text-paper hover:border-pink hover:text-pink"
              }`}
            >
              {dictation.listening ? <Stop size={20} weight="fill" /> : <Microphone size={20} />}
            </button>
          )}
          {busy ? (
            <button
              type="button"
              onClick={() => abortRef.current?.abort()}
              aria-label="Stop Heckr"
              className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-paper text-ink"
            >
              <Stop size={18} weight="fill" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim() && !image}
              aria-label="Send"
              className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-pink text-ink hover:bg-pink-soft disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowUp size={20} weight="bold" />
            </button>
          )}
        </form>
        <p className={`mt-1 text-right font-mono text-[11px] ${MAX_CHARS - input.length <= 150 ? "text-pink" : "text-muted"}`}>
          {input.length}/{MAX_CHARS}
        </p>
      </div>
    </section>
  );
}
