"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { StatusPhase } from "@/hooks/useChat";

/* ─── Types ─── */

interface VoiceModeProps {
  onSend: (text: string) => void;
  status: StatusPhase;
  statusMessage: string;
  isStreaming: boolean;
}

type VoiceState = "dormant" | "listening" | "processing" | "thinking" | "error";

/* ─── SpeechRecognition type shim ─── */

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
};

/* ─── Status labels ─── */

const STATUS_LABELS: Partial<Record<StatusPhase, string>> = {
  understanding: "Understanding...",
  analyzing_income: "Analysing income...",
  checking_allowances: "Checking allowances...",
  calculating: "Calculating...",
  computing_tax: "Computing tax...",
  building_dashboard: "Building dashboard...",
  searching_notes: "Searching notes...",
  generating_response: "Responding...",
};

/* ─── Whisper bar spring ─── */

const SLIDE_TRANSITION = {
  type: "spring" as const,
  damping: 28,
  stiffness: 340,
  mass: 0.8,
};

/* ─── Ghost Whisper Voice Bar ─── */

export function VoiceMode({ onSend, status, statusMessage, isStreaming }: VoiceModeProps) {
  const [voiceState, setVoiceState] = useState<VoiceState>("dormant");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [supported, setSupported] = useState(true);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const holdingRef = useRef(false);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sentRef = useRef(false);

  // Feature detection
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) setSupported(false);
  }, []);

  // Return to dormant when AI finishes
  useEffect(() => {
    if (voiceState !== "thinking") return;
    if (status === "idle" && !isStreaming) {
      setVoiceState("dormant");
    }
  }, [status, isStreaming, voiceState]);

  // Auto-clear error
  useEffect(() => {
    if (voiceState === "error") {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      errorTimerRef.current = setTimeout(() => setVoiceState("dormant"), 2000);
    }
    return () => {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    };
  }, [voiceState]);

  const startRecognition = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch { /* ignore */ }
    }

    sentRef.current = false;
    const recognition: SpeechRecognitionInstance = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-GB";

    recognition.onstart = () => {
      setVoiceState("listening");
      setInterimTranscript("");
      setErrorMessage("");
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      setInterimTranscript(interim || final);
      if (interim) setVoiceState("processing");
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "aborted" || event.error === "no-speech") return;
      setVoiceState("error");
      setErrorMessage(
        event.error === "not-allowed"
          ? "Microphone access denied"
          : "Couldn\u2019t hear that"
      );
    };

    recognition.onend = () => {
      if (holdingRef.current) return;

      const text = interimTranscript.trim();
      if (text && !sentRef.current) {
        sentRef.current = true;
        setVoiceState("thinking");
        onSend(text);
        setInterimTranscript("");
      } else if (!sentRef.current) {
        setVoiceState("dormant");
      }
    };

    recognitionRef.current = recognition;
    try { recognition.start(); } catch { /* ignore */ }
  }, [onSend, interimTranscript]);

  const stopRecognition = useCallback(() => {
    if (!recognitionRef.current) return;

    const text = interimTranscript.trim();
    try { recognitionRef.current.stop(); } catch { /* ignore */ }

    if (text && !sentRef.current) {
      sentRef.current = true;
      setVoiceState("thinking");
      onSend(text);
      setInterimTranscript("");
    } else if (!sentRef.current) {
      setVoiceState("dormant");
    }
    recognitionRef.current = null;
  }, [onSend, interimTranscript]);

  // Hold V — push-to-talk
  useEffect(() => {
    if (!supported) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "v" && e.key !== "V") return;
      if (e.repeat) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (isStreaming) return;
      if (voiceState === "thinking") return;

      holdingRef.current = true;
      startRecognition();
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key !== "v" && e.key !== "V") return;
      if (!holdingRef.current) return;

      holdingRef.current = false;
      stopRecognition();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [supported, isStreaming, voiceState, startRecognition, stopRecognition]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch { /* ignore */ }
      }
    };
  }, []);

  if (!supported) return null;

  // ── Completely invisible when dormant ──
  const isVisible = voiceState !== "dormant";

  // Display text
  const displayText =
    voiceState === "error"
      ? errorMessage
      : voiceState === "processing" || voiceState === "listening"
        ? interimTranscript || "Listening..."
        : voiceState === "thinking"
          ? statusMessage || STATUS_LABELS[status] || "Thinking..."
          : "";

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="whisper-bar"
          initial={{ y: 20, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 12, opacity: 0, scale: 0.98 }}
          transition={SLIDE_TRANSITION}
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50"
        >
          <div
            className={`
              flex items-center gap-2.5 px-4 py-2.5
              rounded-full backdrop-blur-2xl border
              shadow-lg shadow-black/10
              min-w-[200px] max-w-[360px]
              ${voiceState === "error"
                ? "bg-red-950/70 border-red-500/25"
                : voiceState === "thinking"
                  ? "bg-slate-950/75 border-brand-500/20"
                  : "bg-slate-950/70 border-white/[0.08]"
              }
            `}
          >
            {/* ── Left indicator ── */}
            <div className="flex-shrink-0 relative flex items-center justify-center w-5 h-5">
              {voiceState === "listening" || voiceState === "processing" ? (
                <>
                  {/* Pulsing ring */}
                  <motion.div
                    animate={{ scale: [1, 1.8, 1.8], opacity: [0.5, 0, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                    className="absolute inset-0 rounded-full bg-brand-400/30"
                  />
                  {/* Core dot */}
                  <motion.div
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
                    className="w-2.5 h-2.5 rounded-full bg-brand-400"
                  />
                </>
              ) : voiceState === "thinking" ? (
                /* Three animated bars */
                <div className="flex gap-[2.5px] items-center h-full">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ scaleY: [0.35, 1, 0.35] }}
                      transition={{
                        duration: 0.5,
                        repeat: Infinity,
                        delay: i * 0.1,
                        ease: "easeInOut",
                      }}
                      className="w-[2.5px] h-3.5 rounded-full bg-brand-400/80 origin-center"
                    />
                  ))}
                </div>
              ) : (
                /* Error dot */
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              )}
            </div>

            {/* ── Text ── */}
            <p
              className={`
                text-[12px] font-light leading-none truncate flex-1
                ${voiceState === "error"
                  ? "text-red-300/90"
                  : voiceState === "processing"
                    ? "text-white/70"
                    : "text-white/50"
                }
              `}
            >
              {displayText}
            </p>

            {/* ── Right hint (listening only) ── */}
            {(voiceState === "listening" || voiceState === "processing") && (
              <span className="flex-shrink-0 text-[10px] font-mono text-white/20 tracking-wide">
                V
              </span>
            )}

            {/* ── Thinking shimmer overlay ── */}
            {voiceState === "thinking" && (
              <motion.div
                className="absolute inset-0 rounded-full overflow-hidden pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-brand-400/[0.06] to-transparent"
                />
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
