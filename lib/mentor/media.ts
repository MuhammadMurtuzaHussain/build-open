"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Downscale a screenshot on the device so uploads stay small and cheap. */
export async function imageToDataUrl(file: File, maxSide = 1400, quality = 0.85): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("not-image");
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("decode"));
      el.src = url;
    });
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas");
    ctx.fillStyle = "#ffffff"; // flatten transparent PNGs
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Minimal typing for the Web Speech API, which TypeScript's DOM lib doesn't ship.
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
};

function getRecognition(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as (new () => SpeechRecognitionLike) | null;
}

/**
 * Speech to text using the browser's built-in recogniser (free, no API calls).
 * onText receives the full transcript so far for this session.
 */
export function useDictation(onText: (text: string) => void) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const cb = useRef(onText);
  cb.current = onText;

  useEffect(() => setSupported(!!getRecognition()), []);
  useEffect(() => () => recRef.current?.abort(), []);

  const stop = useCallback(() => recRef.current?.stop(), []);

  const start = useCallback(() => {
    const Rec = getRecognition();
    if (!Rec) return;
    setError(null);
    const rec = new Rec();
    rec.lang = "en-IE";
    rec.interimResults = true;
    rec.continuous = true;
    let finalText = "";
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interim += r[0].transcript;
      }
      cb.current((finalText + interim).trim());
    };
    rec.onerror = (e) => {
      setError(e.error === "not-allowed" ? "Microphone access was blocked." : "Couldn't hear that. Try again.");
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }, []);

  return { supported, listening, error, start, stop };
}

/** Text to speech with the browser's voices. Strips code blocks so it reads naturally. */
export function useReadAloud() {
  const [supported, setSupported] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  const toggle = useCallback(
    (id: string, text: string) => {
      const synth = window.speechSynthesis;
      synth.cancel();
      if (speakingId === id) {
        setSpeakingId(null);
        return;
      }
      const spoken = text
        .replace(/```[\s\S]*?(```|$)/g, " (code block on screen) ")
        .replace(/[*`#>]/g, "")
        .replace(/https?:\/\/\S+/g, "the link on screen");
      const u = new SpeechSynthesisUtterance(spoken);
      const voice = synth.getVoices().find((v) => /en-(IE|GB)/i.test(v.lang));
      if (voice) u.voice = voice;
      u.rate = 1.03;
      u.onend = () => setSpeakingId((cur) => (cur === id ? null : cur));
      u.onerror = () => setSpeakingId(null);
      setSpeakingId(id);
      synth.speak(u);
    },
    [speakingId],
  );

  return { supported, speakingId, toggle };
}
