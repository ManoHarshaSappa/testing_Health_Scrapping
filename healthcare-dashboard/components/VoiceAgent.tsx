"use client";

import { useState, useRef, useEffect } from "react";

interface Message { role: "user" | "assistant"; content: string; }
interface VoiceAgentProps { patientName: string; patientHistory: string; }

interface SummaryData {
  chiefComplaint: string;
  urgency: "Low" | "Medium" | "High" | "Emergency";
  urgencyReason: string;
  symptoms: string[];
  duration: string;
  medications: string[];
  relevantHistory: string[];
  doctorPriority: string[];
  patientNote: string;
}

// ── Browser speech recognition types ────────────────────────────────────────
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}
interface SR extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
}
declare global {
  interface Window {
    SpeechRecognition: new () => SR;
    webkitSpeechRecognition: new () => SR;
  }
}

// ── Urgency styles ────────────────────────────────────────────────────────────
const urgencyStyle: Record<string, string> = {
  Low:       "bg-emerald-900/40 text-emerald-300 border-emerald-700/60",
  Medium:    "bg-amber-900/40 text-amber-300 border-amber-700/60",
  High:      "bg-red-900/40 text-red-300 border-red-700/60",
  Emergency: "bg-red-900/60 text-red-200 border-red-600",
};
const urgencyDot: Record<string, string> = {
  Low: "bg-emerald-400", Medium: "bg-amber-400", High: "bg-red-400", Emergency: "bg-red-300",
};

// ── Summary card ─────────────────────────────────────────────────────────────
function SummaryCard({ raw }: { raw: string }) {
  let data: SummaryData | null = null;
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) data = JSON.parse(match[0]);
  } catch { /* fall through */ }

  if (!data) {
    return <pre className="text-blue-200 text-sm whitespace-pre-wrap font-sans leading-relaxed bg-[#0d1735] rounded-xl p-5 border border-[#1a2f5a]">{raw}</pre>;
  }

  const uStyle = urgencyStyle[data.urgency] ?? urgencyStyle.Medium;
  const uDot   = urgencyDot[data.urgency]   ?? urgencyDot.Medium;

  return (
    <div className="space-y-3">
      <div className="bg-[#0d1735] rounded-xl p-4 border border-[#1a2f5a]">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-blue-500/70 uppercase tracking-widest font-semibold">Chief Complaint</p>
          <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-semibold ${uStyle}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${uDot}`} />
            {data.urgency}
          </span>
        </div>
        <p className="text-white text-base font-semibold leading-snug">{data.chiefComplaint}</p>
        {data.urgencyReason && <p className="text-blue-400/60 text-xs mt-1.5 italic">{data.urgencyReason}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#0d1735] rounded-xl p-4 border border-[#1a2f5a]">
          <p className="text-xs text-blue-500/70 uppercase tracking-widest font-semibold mb-2.5">Symptoms</p>
          <div className="flex flex-wrap gap-1.5">
            {data.symptoms.length ? data.symptoms.map((s, i) => (
              <span key={i} className="text-xs bg-blue-900/50 text-blue-200 border border-blue-700/50 px-2.5 py-1 rounded-full">{s}</span>
            )) : <span className="text-blue-500/40 text-xs">None reported</span>}
          </div>
        </div>
        <div className="bg-[#0d1735] rounded-xl p-4 border border-[#1a2f5a]">
          <p className="text-xs text-blue-500/70 uppercase tracking-widest font-semibold mb-2.5">Duration</p>
          <p className="text-blue-100 text-sm font-medium">{data.duration || "Not specified"}</p>
        </div>
      </div>

      {(data.medications.length > 0 || data.relevantHistory.length > 0) && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#0d1735] rounded-xl p-4 border border-[#1a2f5a]">
            <p className="text-xs text-blue-500/70 uppercase tracking-widest font-semibold mb-2.5">Medications</p>
            {data.medications.length
              ? data.medications.map((m, i) => <p key={i} className="text-blue-200 text-xs leading-relaxed">{m}</p>)
              : <p className="text-blue-500/40 text-xs">None mentioned</p>}
          </div>
          <div className="bg-[#0d1735] rounded-xl p-4 border border-[#1a2f5a]">
            <p className="text-xs text-blue-500/70 uppercase tracking-widest font-semibold mb-2.5">Relevant History</p>
            {data.relevantHistory.length
              ? data.relevantHistory.map((h, i) => <p key={i} className="text-blue-200 text-xs leading-relaxed">{h}</p>)
              : <p className="text-blue-500/40 text-xs">No relevant history</p>}
          </div>
        </div>
      )}

      {data.doctorPriority.length > 0 && (
        <div className="bg-[#0d1735] rounded-xl p-4 border border-[#1a2f5a]">
          <p className="text-xs text-blue-500/70 uppercase tracking-widest font-semibold mb-3">Doctor&apos;s Priority Checklist</p>
          <div className="space-y-2">
            {data.doctorPriority.map((item, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="w-4 h-4 rounded border border-blue-700/50 shrink-0 mt-0.5" />
                <p className="text-blue-100 text-sm">{item}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.patientNote && <p className="text-blue-500/50 text-xs italic text-center px-2">{data.patientNote}</p>}
    </div>
  );
}

type AgentState = "idle" | "loading" | "speaking" | "listening" | "done";
type Tab = "conversation" | "summary";

// ── Main component ─────────────────────────────────────────────────────────
export default function VoiceAgent({ patientName, patientHistory }: VoiceAgentProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [liveText, setLiveText] = useState("");
  const [state, setState]       = useState<AgentState>("idle");
  const [tab, setTab]           = useState<Tab>("conversation");
  const [summary, setSummary]   = useState("");
  const [micError, setMicError] = useState(false);

  const messagesRef  = useRef<Message[]>([]);
  const stateRef     = useRef<AgentState>("idle");
  const chatEndRef   = useRef<HTMLDivElement>(null);
  const audioRef     = useRef<HTMLAudioElement | null>(null);
  const recRef       = useRef<SR | null>(null);
  const doneRef      = useRef(false);
  const liveTextRef  = useRef("");

  const setAgentState = (s: AgentState) => { setState(s); stateRef.current = s; };

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, liveText]);

  useEffect(() => () => {
    doneRef.current = true;
    recRef.current?.abort();
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }
  }, []);

  // ── Unlock <audio> autoplay using a throwaway element (must be in click handler) ──
  function unlockAudio() {
    // Use a separate throwaway element — don't touch audioRef so it stays clean
    const tmp = new Audio();
    tmp.play().catch(() => {});
    tmp.pause();
    // Pre-create the real audio element now so it's ready
    audioRef.current = new Audio();
  }

  // ── Aria speaks via OpenAI TTS ───────────────────────────────────────────
  async function speakText(text: string): Promise<void> {
    setAgentState("speaking");
    return new Promise(async (resolve) => {
      // Hard timeout fallback — if onended never fires, unblock after estimated time
      const wordCount = text.trim().split(/\s+/).length;
      const timeoutMs = Math.max(8000, wordCount * 650);
      const fallback  = setTimeout(() => { resolve(); }, timeoutMs);
      const done = () => { clearTimeout(fallback); resolve(); };

      try {
        const res = await fetch("/api/speak", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        if (!res.ok) { done(); return; }

        const blob  = await res.blob();
        const url   = URL.createObjectURL(blob);
        const audio = audioRef.current ?? new Audio();
        audioRef.current = audio;
        audio.src     = url;
        audio.onended = () => { URL.revokeObjectURL(url); done(); };
        audio.onerror = () => { URL.revokeObjectURL(url); done(); };
        const playPromise = audio.play();
        if (playPromise) playPromise.catch(() => done());
      } catch {
        done();
      }
    });
  }

  // ── User speaks via Chrome SpeechRecognition ─────────────────────────────
  function startListening() {
    if (doneRef.current || stateRef.current === "done") return;

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      alert("Voice input requires Chrome. Please open in Chrome.");
      return;
    }

    setAgentState("listening");
    liveTextRef.current = "";
    setLiveText("");

    const rec = new SpeechRec();
    rec.continuous     = false;
    rec.interimResults = true;
    rec.lang           = "en-US";
    recRef.current     = rec;

    rec.onstart = () => setAgentState("listening");

    rec.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = Array.from(e.results)
        .map((r: SpeechRecognitionResult) => r[0].transcript)
        .join("");
      liveTextRef.current = transcript;   // ← fix: keep ref in sync with state
      setLiveText(transcript);
    };

    rec.onend = () => {
      const text = liveTextRef.current.trim();
      setLiveText("");
      liveTextRef.current = "";
      if (!text || doneRef.current) return;
      const userMsg: Message = { role: "user", content: text };
      const updated = [...messagesRef.current, userMsg];
      setMessages(prev => [...prev, userMsg]);
      messagesRef.current = updated;
      callAI(updated);
    };

    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error === "not-allowed") { setMicError(true); return; }
      // no-speech or network — just restart quietly
      if (!doneRef.current && stateRef.current !== "done") {
        setTimeout(() => startListening(), 300);
      }
    };

    rec.start();
  }

  // ── Gemini for Aria's reply ──────────────────────────────────────────────
  async function callAI(msgs: Message[]) {
    setAgentState("loading");
    try {
      const res  = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: msgs, patientName, patientHistory }),
      });
      const data = await res.json();
      if (!data.response) throw new Error(data.error || "No response");
      const reply = data.response as string;

      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
      messagesRef.current = [...msgs, { role: "assistant", content: reply }];

      await speakText(reply);

      if (reply.toLowerCase().includes("doctor will be with you shortly")) {
        setAgentState("done");
        doneRef.current = true;
        buildSummary(messagesRef.current);
      } else {
        startListening();
      }
    } catch {
      if (!doneRef.current) startListening();
    }
  }

  async function buildSummary(msgs: Message[]) {
    setTab("summary");
    const res  = await fetch("/api/summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversation: msgs, patientName, patientHistory }),
    });
    const data = await res.json();
    setSummary(data.summary || "");
  }

  function endConsultation() {
    doneRef.current = true;
    recRef.current?.abort();
    if (audioRef.current) audioRef.current.pause();
    setAgentState("done");
    buildSummary(messagesRef.current);
  }

  async function handleTapToStart() {
    unlockAudio();          // must happen inside click handler for browser autoplay
    setAgentState("loading");
    await callAI([]);
  }

  // ─── RENDER ──────────────────────────────────────────────────────────────

  if (state === "idle") {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-blue-600/10 border border-blue-500/30 flex items-center justify-center">
            <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-blue-500/30 border border-blue-400/40 animate-ping" />
        </div>
        <div>
          <p className="text-white font-semibold text-base mb-1">Ready to talk with {patientName}</p>
          <p className="text-blue-400/60 text-sm max-w-xs">Aria will greet the patient and collect their symptoms by voice</p>
        </div>
        <button onClick={handleTapToStart}
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3 rounded-xl transition shadow-xl shadow-blue-900/50 text-sm">
          Tap to Begin
        </button>
        <p className="text-blue-500/40 text-xs">Aria speaks via OpenAI · Your voice via Chrome mic · Must use Chrome</p>
      </div>
    );
  }

  if (micError) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-4">
        <div className="w-14 h-14 rounded-full bg-red-900/30 border border-red-700/40 flex items-center justify-center">
          <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <p className="text-red-300 font-semibold">Microphone Access Denied</p>
        <p className="text-blue-400/60 text-sm max-w-sm">
          Click the lock icon in Chrome address bar → Site Settings → Microphone → Allow → refresh the page.
        </p>
      </div>
    );
  }

  const stateLabel =
    state === "loading"   ? "Thinking..." :
    state === "speaking"  ? "Aria is speaking..." :
    state === "listening" ? "Listening — speak now" :
    "Consultation complete";

  const dotColor =
    state === "loading"   ? "bg-amber-400 animate-pulse" :
    state === "speaking"  ? "bg-cyan-400 animate-pulse" :
    state === "listening" ? "bg-green-400 animate-pulse" :
    "bg-gray-500";

  return (
    <div className="flex flex-col h-full gap-4">

      {/* Status bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
          <span className="text-sm text-blue-200/80 font-medium">{stateLabel}</span>
        </div>
        {state !== "done" && (
          <button onClick={endConsultation}
            className="text-xs border border-red-800/60 text-red-400 hover:bg-red-950/50 px-3 py-1.5 rounded-lg transition">
            End Consultation
          </button>
        )}
      </div>

      {/* Listening animation */}
      {state === "listening" && (
        <div className="flex items-center justify-center gap-1 py-1">
          {[0,1,2,3,4,5,6].map(i => (
            <span key={i} className="w-1 bg-green-400 rounded-full animate-pulse"
              style={{ height: `${10 + Math.sin(i) * 8}px`, animationDelay: `${i * 80}ms` }} />
          ))}
          <span className="ml-3 text-green-400 text-xs">Just speak — no button needed</span>
        </div>
      )}

      {/* Speaking animation */}
      {state === "speaking" && (
        <div className="flex items-center justify-center gap-1 py-1">
          {[0,1,2,3,4,5,6].map(i => (
            <span key={i} className="w-1 bg-cyan-400 rounded-full animate-pulse"
              style={{ height: `${10 + Math.sin(i) * 8}px`, animationDelay: `${i * 80}ms` }} />
          ))}
          <span className="ml-3 text-cyan-400 text-xs">Aria is speaking</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-[#1a2f5a]">
        {(["conversation", "summary"] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition ${
              tab === t ? "border-blue-500 text-white" : "border-transparent text-blue-500/40 hover:text-blue-300"
            }`}>
            {t}
            {t === "summary" && summary && <span className="ml-1.5 w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block align-middle" />}
          </button>
        ))}
      </div>

      {/* Conversation */}
      {tab === "conversation" && (
        <div className="flex-1 overflow-y-auto flex flex-col gap-3 min-h-64 max-h-[420px]">
          {state === "loading" && messages.length === 0 && (
            <div className="flex justify-start">
              <div className="bg-[#0d1b3e] border border-[#1a2f5a] rounded-2xl px-5 py-3 flex gap-1.5 items-center">
                {[0,1,2].map(i => <span key={i} className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />)}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-sm px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-blue-700 text-white shadow-lg shadow-blue-900/30"
                  : "bg-[#0d1b3e] border border-[#1a2f5a] text-white"
              }`}>
                <p className="text-xs mb-1 opacity-50 font-medium">{m.role === "user" ? patientName : "Aria · Healthcare Assistant"}</p>
                <p>{m.content}</p>
              </div>
            </div>
          ))}
          {liveText && (
            <div className="flex justify-end">
              <div className="max-w-sm px-4 py-3 rounded-2xl text-sm bg-blue-900/40 border border-blue-700/50 text-blue-100">
                <p className="text-xs mb-1 opacity-50 font-medium">{patientName} (speaking...)</p>
                <p>{liveText}</p>
              </div>
            </div>
          )}
          {state === "loading" && messages.length > 0 && (
            <div className="flex justify-start">
              <div className="bg-[#0d1b3e] border border-[#1a2f5a] rounded-2xl px-5 py-3 flex gap-1.5 items-center">
                {[0,1,2].map(i => <span key={i} className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />)}
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      )}

      {/* Summary tab */}
      {tab === "summary" && (
        <div className="flex-1 overflow-y-auto">
          {!summary ? (
            <div className="flex items-center justify-center gap-2 py-16 text-blue-400/60 text-sm">
              <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" />
              Generating clinical summary...
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs bg-emerald-900/30 text-emerald-400 border border-emerald-700/50 px-3 py-1 rounded-full">Consultation Complete</span>
                <button
                  onClick={() => { try { navigator.clipboard.writeText(summary); } catch { /* ignore */ } }}
                  className="text-xs text-blue-400/60 hover:text-white border border-[#1a2f5a] px-3 py-1 rounded-lg transition">
                  Copy
                </button>
              </div>
              <SummaryCard raw={summary} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
