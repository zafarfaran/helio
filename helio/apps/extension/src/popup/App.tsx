import { useState, useEffect } from "react";

type CaptureState = "idle" | "capturing" | "sending" | "success" | "error";

export default function App() {
  const [state, setState] = useState<CaptureState>("idle");
  const [hasSelection, setHasSelection] = useState(false);
  const [error, setError] = useState("");
  const [helioTabOpen, setHelioTabOpen] = useState(false);

  // Check for Helio tab and selection state on mount
  useEffect(() => {
    // Check if Helio web app is open
    chrome.tabs.query({ url: "http://localhost:3000/*" }, (tabs) => {
      setHelioTabOpen(tabs.length > 0);
    });

    // Check if there's a text selection on the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "CHECK_SELECTION" }, (response) => {
          if (chrome.runtime.lastError) return; // content script not loaded
          setHasSelection(!!response?.hasSelection);
        });
      }
    });
  }, []);

  const capture = async (captureType: "CAPTURE_PAGE" | "CAPTURE_SELECTION") => {
    setState("capturing");
    setError("");

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) throw new Error("No active tab");

      // Ask content script to extract content
      const response = await chrome.tabs.sendMessage(tab.id, { type: captureType });

      if (!response?.success) {
        throw new Error(response?.error || "Capture failed");
      }

      setState("sending");

      // Send to background worker → API
      const apiResponse = await chrome.runtime.sendMessage({
        type: "SEND_TO_API",
        payload: {
          content: response.content,
          url: response.url,
          title: response.title,
          captureType: response.captureType,
        },
      });

      if (!apiResponse?.success) {
        throw new Error(apiResponse?.error || "API request failed");
      }

      setState("success");
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  const openHelio = () => {
    chrome.tabs.create({ url: "http://localhost:3000/chat" });
  };

  return (
    <div className="w-80 bg-white">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">H</span>
            </div>
            <span className="text-sm font-semibold text-slate-800">Helio</span>
          </div>
          {/* Status dot */}
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${helioTabOpen ? "bg-emerald-500" : "bg-slate-300"}`} />
            <span className="text-[10px] text-slate-400">
              {helioTabOpen ? "Connected" : "Not open"}
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-2">
        {state === "idle" && (
          <>
            <button
              onClick={() => capture("CAPTURE_PAGE")}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
              Capture Page
            </button>
            <button
              onClick={() => capture("CAPTURE_SELECTION")}
              disabled={!hasSelection}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                hasSelection
                  ? "bg-violet-50 hover:bg-violet-100 text-violet-700"
                  : "bg-slate-50 text-slate-300 cursor-not-allowed"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
              </svg>
              Capture Selection
            </button>
          </>
        )}

        {(state === "capturing" || state === "sending") && (
          <div className="flex items-center gap-2.5 px-3 py-4 text-sm text-slate-500">
            <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            {state === "capturing" ? "Extracting content..." : "Sending to Helio..."}
          </div>
        )}

        {state === "success" && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-emerald-50 text-emerald-700 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              Sent to Helio
            </div>
            <button
              onClick={openHelio}
              className="w-full px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors"
            >
              Open Helio
            </button>
            <button
              onClick={() => setState("idle")}
              className="w-full text-[11px] text-slate-400 hover:text-slate-500 transition-colors"
            >
              Capture another
            </button>
          </div>
        )}

        {state === "error" && (
          <div className="space-y-2">
            <div className="px-3 py-2.5 rounded-lg bg-red-50 text-red-600 text-sm">
              {error || "Something went wrong"}
            </div>
            <button
              onClick={() => setState("idle")}
              className="w-full px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
