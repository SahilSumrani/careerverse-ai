"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Volume2, X, Sparkles, Loader2 } from "lucide-react";
import { ResumeData } from "../types/resume";
import { stripEmojis, stripEmojisFromObject } from "../lib/resume-utils";

interface VoiceAssistantProps {
  getResumeState: () => ResumeData;
  onUpdateResume: (updatedData: ResumeData) => void;
  liveSuggestions: string[];
}

export function VoiceAssistant({
  getResumeState,
  onUpdateResume,
  liveSuggestions,
}: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showBubble, setShowBubble] = useState(true);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [aiMessage, setAiMessage] = useState<string>(
    "Hello! I am your AI Resume Assistant. I monitor your sections in real time to suggest high-impact improvements."
  );

  const recognitionRef = useRef<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const availableVoicesRef = useRef<SpeechSynthesisVoice[]>([]);

  // Load speech synthesis voices and listen to voiceschanged event
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const updateVoices = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length > 0) {
        availableVoicesRef.current = v;
      }
    };

    updateVoices();
    window.speechSynthesis.addEventListener("voiceschanged", updateVoices);

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", updateVoices);
      window.speechSynthesis.cancel();
    };
  }, []);

  // Cleanup in-flight requests and speech recognition on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  // Natural text-to-speech speaker
  const speakText = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const cleanText = stripEmojis(text);
    if (!cleanText) return;

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = "en-US";
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      const voices =
        availableVoicesRef.current.length > 0
          ? availableVoicesRef.current
          : window.speechSynthesis.getVoices();

      const preferredVoice =
        voices.find(
          (v) =>
            v.lang.startsWith("en") &&
            (v.name.includes("Natural") ||
              v.name.includes("Google") ||
              v.name.includes("Aria") ||
              v.name.includes("Samantha"))
        ) || voices.find((v) => v.lang.startsWith("en"));

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("Speech synthesis error:", err);
    }
  };

  // Run AI Assistant command
  const runAssistantCommand = async (command: string) => {
    const cleanCmd = stripEmojis(command);
    if (!cleanCmd) return;

    // Abort previous in-flight request if still running
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsProcessing(true);
    setAiMessage(`Working on: "${cleanCmd}"...`);
    setShowBubble(true);

    try {
      const currentValues = getResumeState();
      const res = await fetch("/api/resume/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: cleanCmd,
          resumeState: currentValues,
        }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error("Assistant request failed");
      const responseData = await res.json();
      const { updatedResume, aiResponse } = responseData?.data || {};

      if (updatedResume) {
        const sanitized = stripEmojisFromObject(updatedResume);
        onUpdateResume({
          ...currentValues,
          ...sanitized,
          personalInfo: {
            ...currentValues.personalInfo,
            ...(sanitized.personalInfo || {}),
          },
          skills: {
            ...currentValues.skills,
            ...(sanitized.skills || {}),
          },
        });
      }

      const reply =
        stripEmojis(aiResponse) ||
        "I have updated your resume with your requested changes.";
      setAiMessage(reply);
      if (autoSpeak) {
        speakText(reply);
      }
    } catch (err: any) {
      if (err.name === "AbortError") return;
      console.error("AI assistant error:", err);
      const errMsg = "Could not complete request. Please try again.";
      setAiMessage(errMsg);
      if (autoSpeak) speakText(errMsg);
    } finally {
      setIsProcessing(false);
      abortControllerRef.current = null;
    }
  };

  // English-only speech recognition with noise filtering
  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
      setIsProcessing(false);
      setAiMessage("Voice Assistant paused.");
      return;
    }

    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setAiMessage(
        "Speech Recognition is not supported in this browser. Please use Chrome or Edge."
      );
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setIsProcessing(false);
        setShowBubble(true);
        setAiMessage(
          "Listening... Speak your resume request or tap a suggestion below."
        );
      };

      recognition.onresult = async (event: any) => {
        const result = event.results?.[0]?.[0];
        const rawTranscript = result?.transcript?.trim();
        const confidence =
          typeof result?.confidence === "number" ? result.confidence : 1;

        // Filter out ambient noise, coughs, single-syllable background sounds
        if (!rawTranscript || rawTranscript.length < 3 || confidence < 0.25) {
          setIsListening(false);
          setAiMessage(
            "Could not hear clearly. Please tap the mic to speak again or click a suggestion below."
          );
          return;
        }

        setIsListening(false);
        await runAssistantCommand(rawTranscript);
      };

      recognition.onerror = () => {
        setIsListening(false);
        setIsProcessing(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end print:hidden">
      {showBubble && aiMessage && (
        <div className="mb-3 bg-white border border-blue-200 shadow-2xl rounded-2xl p-4 max-w-sm w-[330px] sm:w-[350px] animate-in fade-in slide-in-from-bottom-4 relative">
          <div className="flex items-center justify-between mb-2 pr-6">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-blue-600 animate-pulse" />
              <h4 className="text-xs font-bold text-slate-800 tracking-wide flex items-center gap-1.5">
                <Sparkles size={13} className="text-blue-600" />
                AI Assistant
              </h4>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setAutoSpeak((prev) => !prev)}
                aria-label={autoSpeak ? "Mute auto voice" : "Enable auto voice"}
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors ${
                  autoSpeak
                    ? "bg-blue-100 text-blue-800"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {autoSpeak ? "Voice ON" : "Muted"}
              </button>
              <button
                type="button"
                onClick={() => speakText(aiMessage)}
                title="Replay Voice"
                aria-label="Replay assistant message"
                className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <Volume2 size={15} />
              </button>
            </div>
          </div>

          <button
            onClick={() => setShowBubble(false)}
            aria-label="Close assistant bubble"
            className="absolute top-3 right-3 text-slate-400 hover:text-slate-700 transition-colors p-0.5 rounded-full hover:bg-slate-100 cursor-pointer"
          >
            <X size={15} />
          </button>

          <p className="text-xs text-slate-700 leading-relaxed mb-2.5">
            {aiMessage}
          </p>

          {/* Real-time Dynamic Suggestions (Click any suggestion to immediately apply) */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {liveSuggestions.length > 0
                  ? "Click To Apply Suggestions"
                  : "Resume Status"}
              </span>
              {liveSuggestions.length > 0 && (
                <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-1.5 py-0.5 rounded">
                  {liveSuggestions.length} available
                </span>
              )}
            </div>

            {liveSuggestions.length > 0 ? (
              <div className="space-y-2 mb-3 max-h-48 overflow-y-auto pr-0.5">
                {liveSuggestions.slice(0, 3).map((sugg, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      if (!isProcessing) {
                        runAssistantCommand(
                          `Please apply this suggestion to my resume: ${sugg}`
                        );
                      }
                    }}
                    className="group p-2 rounded-lg border border-blue-100/90 bg-linear-to-r from-blue-50/50 to-indigo-50/30 hover:border-blue-400 hover:bg-blue-50/80 transition-all cursor-pointer flex items-center justify-between gap-2.5 shadow-2xs"
                  >
                    <div className="flex items-start gap-1.5 min-w-0 flex-1">
                      <Sparkles
                        size={13}
                        className="text-blue-600 shrink-0 mt-0.5"
                      />
                      <span className="text-[11px] text-slate-800 leading-snug font-medium line-clamp-2">
                        {sugg}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        runAssistantCommand(
                          `Please apply this suggestion to my resume: ${sugg}`
                        );
                      }}
                      disabled={isProcessing}
                      className="shrink-0 text-[10px] font-bold bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-md shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200/60 p-2 rounded-lg font-medium mb-2.5 leading-snug">
                All key sections are filled! Ready for final ATS optimization.
              </p>
            )}

            {/* 1-Click Fast Actions */}
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() =>
                  runAssistantCommand(
                    "Please optimize my entire resume for ATS screening with strong action verbs and metric enhancements."
                  )
                }
                disabled={isProcessing}
                className="text-[10px] bg-blue-600 text-white hover:bg-blue-700 font-semibold px-2.5 py-1 rounded-md transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              >
                Optimize Resume
              </button>
              <button
                type="button"
                onClick={() =>
                  runAssistantCommand(
                    "Please polish my professional summary to be concise, metric-driven, and high-impact."
                  )
                }
                disabled={isProcessing}
                className="text-[10px] bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium px-2 py-1 rounded-md transition-colors cursor-pointer disabled:opacity-50"
              >
                Polish Summary
              </button>
              <button
                type="button"
                onClick={() =>
                  runAssistantCommand(
                    "Review all my experience bullets and add strong measurable business metrics and percentages."
                  )
                }
                disabled={isProcessing}
                className="text-[10px] bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium px-2 py-1 rounded-md transition-colors cursor-pointer disabled:opacity-50"
              >
                Add Metrics
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Microphone Trigger Button */}
      <button
        onClick={() => {
          if (!showBubble) setShowBubble(true);
          toggleListening();
        }}
        disabled={isProcessing}
        aria-label={isListening ? "Stop listening" : "Talk to AI Assistant"}
        className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 cursor-pointer relative ${
          isListening
            ? "bg-red-500 hover:bg-red-600 text-white ring-4 ring-red-200 animate-pulse"
            : isProcessing
            ? "bg-indigo-600 text-white"
            : "bg-blue-600 hover:bg-blue-700 text-white"
        }`}
      >
        {isProcessing ? (
          <Loader2 size={24} className="animate-spin" />
        ) : isListening ? (
          <MicOff size={24} />
        ) : (
          <Mic size={24} />
        )}
      </button>
    </div>
  );
}
