"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { StatusPhase } from "@/hooks/useChat";
import { IconMic } from "@/components/icons";

/* ─── Types ─── */

interface VoiceModeProps {
  onSend: (text: string) => void;
  status: StatusPhase;
  statusMessage: string;
  isStreaming: boolean;
}

type OrbState = "dormant" | "listening" | "processing" | "thinking" | "error";

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

/* ─── Floating Voice Widget ─── */

export function VoiceMode({ onSend, status, statusMessage, isStreaming }: VoiceModeProps) {
  const [orbState, setOrbState] = useState<OrbState>("dormant");
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

  // Derive orb state from chat status (only when we're in thinking mode)
  useEffect(() => {
    if (orbState !== "thinking") return;

    if (status === "idle" && !isStreaming) {
      // AI finished — return to dormant
      setOrbState("dormant");
    }
  }, [status, isStreaming, orbState]);

  // Auto-clear error
  useEffect(() => {
    if (orbState === "error") {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      errorTimerRef.current = setTimeout(() => setOrbState("dormant"), 2500);
    }
    return () => {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    };
  }, [orbState]);

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
      setOrbState("listening");
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

      if (interim) setOrbState("processing");
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "aborted" || event.error === "no-speech") return;

      setOrbState("error");
      setErrorMessage(
        event.error === "not-allowed"
          ? "Mic access denied"
          : "Couldn\u2019t hear that"
      );
    };

    recognition.onend = () => {
      // When recognition ends (from .stop()), gather final text and send
      if (holdingRef.current) return; // still holding, don't process yet

      const text = interimTranscript.trim();
      if (text && !sentRef.current) {
        sentRef.current = true;
        setOrbState("thinking");
        onSend(text);
        setInterimTranscript("");
      } else if (!sentRef.current) {
        setOrbState("dormant");
      }
    };

    recognitionRef.current = recognition;
    try { recognition.start(); } catch { /* ignore */ }
  }, [onSend, interimTranscript]);

  const stopRecognition = useCallback(() => {
    if (!recognitionRef.current) return;

    // Grab whatever text we have before stopping
    const text = interimTranscript.trim();
    try { recognitionRef.current.stop(); } catch { /* ignore */ }

    if (text && !sentRef.current) {
      sentRef.current = true;
      setOrbState("thinking");
      onSend(text);
      setInterimTranscript("");
    } else if (!sentRef.current) {
      setOrbState("dormant");
    }
    recognitionRef.current = null;
  }, [onSend, interimTranscript]);

  // Hold V — push-to-talk
  useEffect(() => {
    if (!supported) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "v" && e.key !== "V") return;
      if (e.repeat) return;
      // Don't capture when typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (isStreaming) return; // AI is still responding
      if (orbState === "thinking") return; // still processing previous

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
  }, [supported, isStreaming, orbState, startRecognition, stopRecognition]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch { /* ignore */ }
      }
    };
  }, []);

  if (!supported) return null;

  // Display text
  const displayText =
    orbState === "error"
      ? errorMessage
      : orbState === "processing" || orbState === "listening"
        ? interimTranscript || "Listening..."
        : orbState === "thinking"
          ? statusMessage || STATUS_LABELS[status] || "Thinking..."
          : "";

  // Orb visual config
  const isActive = orbState !== "dormant";
  const orbSize = orbState === "thinking" ? 48 : orbState === "listening" || orbState === "processing" ? 44 : 40;

  return (
    <div className="absolute bottom-6 right-6 z-40 pointer-events-none">
      {/* Single anchor — the orb. Everything else positioned absolutely from here. */}
      <div className="relative pointer-events-auto">
        {/* Status text bubble — absolutely positioned above the orb */}
        <AnimatePresence mode="wait">
          {isActive && displayText && (
            <motion.div
              key={orbState + displayText.slice(0, 20)}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="absolute bottom-full right-0 mb-2.5"
            >
              <div
                className={`px-3 py-1.5 rounded-xl backdrop-blur-xl border max-w-[240px] whitespace-nowrap ${
                  orbState === "error"
                    ? "bg-red-950/60 border-red-500/20 text-red-300"
                    : orbState === "thinking"
                      ? "bg-slate-950/70 border-brand-500/15 text-white/70"
                      : "bg-slate-950/60 border-white/10 text-white/50"
                }`}
              >
                <p className="text-[11px] font-light leading-snug truncate">
                  {displayText}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dormant hint — absolutely positioned below the orb */}
        <AnimatePresence>
          {orbState === "dormant" && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.3, duration: 0.3 }}
              className="absolute top-full right-0 mt-1.5 text-[9px] font-mono font-light text-slate-400/40 dark:text-zinc-600/40 tracking-wider whitespace-nowrap"
            >
              HOLD V TO SPEAK
            </motion.p>
          )}
        </AnimatePresence>
        {/* Pulse rings — listening state */}
        <AnimatePresence>
          {(orbState === "listening" || orbState === "processing") && (
            <>
              <motion.div
                key="ring1"
                initial={{ scale: 1, opacity: 0 }}
                animate={{ scale: 1.8, opacity: [0.3, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.3 }}
                className="absolute inset-0 rounded-full bg-brand-400/15"
              />
              <motion.div
                key="ring2"
                initial={{ scale: 1, opacity: 0 }}
                animate={{ scale: 2.2, opacity: [0.15, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.8 }}
                className="absolute inset-0 rounded-full bg-violet-400/10"
              />
            </>
          )}
        </AnimatePresence>

        {/* Thinking glow */}
        <AnimatePresence>
          {orbState === "thinking" && (
            <motion.div
              key="glow"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute -inset-4 rounded-full orb-glow-shift"
            />
          )}
        </AnimatePresence>

        {/* Main orb body */}
        <motion.div
          animate={{
            width: orbSize,
            height: orbSize,
            scale: orbState === "error" ? [1, 0.92, 1.05, 0.97, 1] : 1,
          }}
          transition={
            orbState === "error"
              ? { duration: 0.4, ease: "easeInOut" }
              : { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
          }
          className={`relative rounded-full cursor-default transition-shadow duration-500 ${
            orbState === "error"
              ? "bg-gradient-to-br from-red-500 to-red-600"
              : orbState === "thinking"
                ? "bg-gradient-to-br from-brand-500 via-violet-500 to-blue-500"
                : orbState === "listening" || orbState === "processing"
                  ? "bg-gradient-to-br from-brand-400 to-violet-500"
                  : "bg-gradient-to-br from-slate-600 to-slate-700 dark:from-zinc-600 dark:to-zinc-700"
          } ${
            orbState === "listening" || orbState === "processing"
              ? "orb-listening"
              : orbState === "thinking"
                ? "orb-thinking"
                : ""
          }`}
          style={{
            boxShadow:
              orbState === "error"
                ? "0 0 30px 8px rgba(239, 68, 68, 0.3)"
                : orbState === "thinking"
                  ? "0 0 40px 12px rgba(92, 124, 250, 0.25), 0 0 80px 24px rgba(139, 92, 246, 0.1)"
                  : orbState === "listening" || orbState === "processing"
                    ? "0 0 30px 10px rgba(92, 124, 250, 0.2), 0 0 60px 20px rgba(139, 92, 246, 0.08)"
                    : "0 4px 16px -2px rgba(0, 0, 0, 0.15)",
          }}
        >
          {/* Inner shine */}
          <div className="absolute inset-[3px] rounded-full bg-gradient-to-br from-white/25 to-transparent" />

          {/* Center content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <AnimatePresence mode="wait">
              {orbState === "dormant" ? (
                <motion.div
                  key="dormant"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex items-center justify-center"
                >
                  <span className="text-[10px] font-mono font-medium text-white/50 tracking-wider">V</span>
                </motion.div>
              ) : orbState === "listening" || orbState === "processing" ? (
                <motion.div
                  key="mic"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <IconMic className="w-5 h-5 text-white/80" />
                </motion.div>
              ) : orbState === "thinking" ? (
                <motion.div
                  key="bars"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex gap-[3px] items-center"
                >
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ scaleY: [0.3, 1, 0.3] }}
                      transition={{
                        duration: 0.55,
                        repeat: Infinity,
                        delay: i * 0.12,
                        ease: "easeInOut",
                      }}
                      className="w-[3px] h-4 rounded-full bg-white/70 origin-center"
                    />
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-3 h-3 rounded-sm bg-white/70"
                />
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
