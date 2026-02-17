"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { StatusPhase } from "@/hooks/useChat";
import { IconMic, IconStop } from "@/components/icons";

/* ─── Types ─── */

interface VoiceModeProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (text: string) => void;
  status: StatusPhase;
  statusMessage: string;
  isStreaming: boolean;
}

type OrbState = "idle" | "listening" | "processing" | "thinking" | "responding" | "error";

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

/* ─── Status → label mapping for the orb ─── */

const STATUS_LABELS: Partial<Record<StatusPhase, string>> = {
  understanding: "Understanding your question...",
  analyzing_income: "Analysing income sources...",
  checking_allowances: "Checking allowance status...",
  calculating: "Running tax calculations...",
  computing_tax: "Computing tax position...",
  building_dashboard: "Building dashboard...",
  searching_notes: "Searching meeting notes...",
  generating_response: "Generating response...",
};

/* ─── Component ─── */

export function VoiceMode({ isOpen, onClose, onSend, status, statusMessage, isStreaming }: VoiceModeProps) {
  const [orbState, setOrbState] = useState<OrbState>("idle");
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [supported, setSupported] = useState(true);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const shouldRestartRef = useRef(false);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Derive orb state from chat status
  useEffect(() => {
    if (!isOpen) return;

    if (status === "idle" && !isStreaming) {
      // AI finished responding — go back to listening
      if (orbState === "thinking" || orbState === "responding") {
        setOrbState("listening");
        shouldRestartRef.current = true;
      }
    } else if (status === "generating_response") {
      setOrbState("responding");
    } else if (status !== "idle" && status !== "complete") {
      setOrbState("thinking");
    }
  }, [status, isStreaming, isOpen, orbState]);

  // Start/stop recognition based on orbState
  useEffect(() => {
    if (!isOpen) return;

    if (orbState === "listening" && shouldRestartRef.current) {
      shouldRestartRef.current = false;
      startRecognition();
    }
  }, [orbState, isOpen]);

  // Feature detection
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
    }
  }, []);

  // Start recognition when voice mode opens
  useEffect(() => {
    if (isOpen && supported) {
      setOrbState("listening");
      setTranscript("");
      setInterimTranscript("");
      setErrorMessage("");
      startRecognition();
    }
    return () => {
      stopRecognition();
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    };
  }, [isOpen, supported]);

  // Escape key to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const startRecognition = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    // Clean up any existing instance
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch { /* ignore */ }
    }

    const recognition: SpeechRecognitionInstance = new SR();
    recognition.continuous = false;
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

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (interim) {
        setInterimTranscript(interim);
        setOrbState("processing");
      }

      if (final) {
        setTranscript(final);
        setInterimTranscript("");
        setOrbState("thinking");
        onSend(final.trim());
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "no-speech") {
        // No speech detected — restart silently
        shouldRestartRef.current = true;
        setOrbState("listening");
        return;
      }

      if (event.error === "aborted") return;

      setOrbState("error");
      setErrorMessage(
        event.error === "not-allowed"
          ? "Microphone access denied"
          : "Couldn\u2019t hear that. Try again."
      );

      // Auto-recover after 2s
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      errorTimerRef.current = setTimeout(() => {
        if (recognitionRef.current) {
          setOrbState("listening");
          shouldRestartRef.current = true;
        }
      }, 2000);
    };

    recognition.onend = () => {
      // Auto-restart if we're still in voice mode and not streaming
      if (shouldRestartRef.current && !isStreaming) {
        try { recognition.start(); } catch { /* ignore */ }
      }
    };

    recognitionRef.current = recognition;
    try { recognition.start(); } catch { /* ignore */ }
  }, [onSend, isStreaming]);

  const stopRecognition = useCallback(() => {
    shouldRestartRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }
  }, []);

  const handleClose = useCallback(() => {
    stopRecognition();
    onClose();
  }, [stopRecognition, onClose]);

  // Determine display text
  const displayText =
    orbState === "error"
      ? errorMessage
      : orbState === "processing"
        ? interimTranscript
        : orbState === "thinking" || orbState === "responding"
          ? statusMessage || STATUS_LABELS[status] || "Thinking..."
          : orbState === "listening"
            ? "Listening..."
            : "";

  // Orb CSS class
  const orbAnimClass =
    orbState === "error"
      ? "orb-error"
      : orbState === "thinking"
        ? "orb-thinking"
        : orbState === "listening" || orbState === "processing"
          ? "orb-listening"
          : "orb-idle";

  // Orb gradient based on state
  const orbGradient =
    orbState === "error"
      ? "from-red-500 to-red-600"
      : orbState === "thinking"
        ? "from-brand-500 via-violet-500 to-blue-500"
        : "from-brand-400 to-violet-500";

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/50 backdrop-blur-md"
        >
          {/* Unsupported browser fallback */}
          {!supported ? (
            <div className="text-center px-8">
              <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
                <IconMic className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-white/80 text-sm font-medium mb-2">Voice not supported</p>
              <p className="text-white/40 text-xs font-light max-w-xs">
                Your browser doesn&apos;t support speech recognition. Try Chrome, Safari, or Edge.
              </p>
              <button
                onClick={handleClose}
                className="mt-6 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 text-xs transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              {/* Transcript / last spoken text */}
              <AnimatePresence mode="wait">
                {transcript && (orbState === "thinking" || orbState === "responding") && (
                  <motion.div
                    key="transcript"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                    className="mb-8 max-w-md text-center"
                  >
                    <p className="text-white/50 text-xs font-light">&ldquo;{transcript}&rdquo;</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* The Orb */}
              <div className="relative">
                {/* Pulse rings (visible when listening) */}
                {(orbState === "listening" || orbState === "processing") && (
                  <>
                    <div className="absolute inset-0 rounded-full bg-brand-400/20 orb-ring" />
                    <div className="absolute inset-0 rounded-full bg-violet-400/10 orb-ring-delayed" />
                  </>
                )}

                {/* Glow (visible when thinking) */}
                {orbState === "thinking" && (
                  <div className="absolute -inset-8 rounded-full orb-glow-shift" />
                )}

                {/* Main orb sphere */}
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className={`relative w-28 h-28 rounded-full bg-gradient-to-br ${orbGradient} ${orbAnimClass} shadow-2xl`}
                  style={{
                    boxShadow:
                      orbState === "error"
                        ? "0 0 60px 20px rgba(239, 68, 68, 0.3)"
                        : orbState === "thinking"
                          ? undefined
                          : "0 0 60px 20px rgba(92, 124, 250, 0.25), 0 0 120px 40px rgba(139, 92, 246, 0.1)",
                  }}
                >
                  {/* Inner shine */}
                  <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/20 to-transparent" />

                  {/* Center icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    {orbState === "listening" || orbState === "idle" ? (
                      <IconMic className="w-8 h-8 text-white/80" />
                    ) : orbState === "error" ? (
                      <IconStop className="w-7 h-7 text-white/80" />
                    ) : (
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            animate={{ scaleY: [0.4, 1, 0.4] }}
                            transition={{
                              duration: 0.6,
                              repeat: Infinity,
                              delay: i * 0.15,
                              ease: "easeInOut",
                            }}
                            className="w-1 h-5 rounded-full bg-white/70 origin-center"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Status text */}
              <AnimatePresence mode="wait">
                {displayText && (
                  <motion.p
                    key={displayText}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className={`mt-6 text-sm font-light ${
                      orbState === "error"
                        ? "text-red-400"
                        : orbState === "processing"
                          ? "text-white/40"
                          : "text-white/60"
                    }`}
                  >
                    {displayText}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Close button */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                onClick={handleClose}
                className="mt-10 px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white/50 hover:text-white/70 text-xs font-light transition-all duration-200 border border-white/5 hover:border-white/10 backdrop-blur-sm"
              >
                Press Esc or tap to close
              </motion.button>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
