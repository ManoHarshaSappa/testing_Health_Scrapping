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

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
}
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

type AgentState = "loading" | "speaking" | "listening" | "done";
type Tab = "conversation" | "summary";

const urgencyStyle: Record<string, string> = {
  Low:       "bg-emerald-900/40 text-emerald-300 border-emerald-700/60",
  Medium:    "bg-amber-900/40 text-amber-300 border-amber-700/60",
  High:      "bg-red-900/40 text-red-300 border-red-700/60",
  Emergency: "bg-red-900/60 text-red-200 border-red-600",
};

const urgencyDot: Record<string, string> = {
  Low:       "bg-emerald-400",
  Medium:    "bg-amber-400",
  High:      "bg-red-400",
  Emergency: "bg-red-300",
};

function SummaryCard({ raw }: { raw: string }) {
  let data: SummaryData | null = null;
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) data = JSON.parse(match[0]);
  } catch { /* fall through to text render */ }

  if (!data) {
    return <pre className="text-blue-200 text-sm whitespace-pre-wrap font-sans leading-relaxed bg-[#0d1735] rounded-xl p-5 border border-[#1a2f5a]">{raw}</pre>;
  }

  const uStyle = urgencyStyle[data.urgency] ?? urgencyStyle.Medium;
  const uDot = urgencyDot[data.urgency] ?? urgencyDot.Medium;

  return (
    <div className="space-y-3">
      {/* Chief complaint + urgency */}
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

      {/* Symptoms + Duration */}
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

      {/* Medications + History */}
      {(data.medications.length > 0 || data.relevantHistory.length > 0) && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#0d1735] rounded-xl p-4 border border-[#1a2f5a]">
            <p className="text-xs text-blue-500/70 uppercase tracking-widest font-semibold mb-2.5">Medications</p>
            {data.medications.length ? data.medications.map((m, i) => (
              <p key={i} className="text-blue-200 text-xs leading-relaxed">{m}</p>
            )) : <p className="text-blue-500/40 text-xs">None mentioned</p>}
          </div>
          <div className="bg-[#0d1735] rounded-xl p-4 border border-[#1a2f5a]">
            <p className="text-xs text-blue-500/70 uppercase tracking-widest font-semibold mb-2.5">Relevant History</p>
            {data.relevantHistory.length ? data.relevantHistory.map((h, i) => (
              <p key={i} className="text-blue-200 text-xs leading-relaxed">{h}</p>
            )) : <p className="text-blue-500/40 text-xs">No relevant history</p>}
          </div>
        </div>
      )}

      {/* Doctor priority checklist */}
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

      {/* Patient note */}
      {data.patientNote && (
        <p className="text-blue-500/50 text-xs italic text-center px-2">{data.patientNote}</p>
      )}
    </div>
  );
}

export default function VoiceAgent({ patientName, patientHistory }: VoiceAgentProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [liveText, setLiveText] = useState("");
  const [state, setState] = useState<AgentState>("loading");
  const [tab, setTab] = useState<Tab>("conversation");
  const [summary, setSummary] = useState("");
  const messagesRef = useRef<Message[]>([]);
  const liveTextRef = useRef("");
  const stateRef = useRef<AgentState>("loading");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const setAgentState = (s: AgentState) => { setState(s); stateRef.current = s; };

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, liveText]);
  useEffect(() => { callAI([]); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function callAI(msgs: Message[]) {
    setAgentState("loading");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: msgs, patientName, patientHistory }),
      });
      const data = await res.json();
      if (!data.response) throw new Error(data.error || "No response");
      const reply: string = data.response;

      // Only show non-silent user messages in the conversation
      const visibleMsgs = msgs.filter(m => m.content !== "[Patient is silent]");
      const updated = [...visibleMsgs, { role: "assistant" as const, content: reply }];
      setMessages(updated);
      messagesRef.current = msgs.concat({ role: "assistant" as const, content: reply });

      await speakText(reply);
      if (reply.toLowerCase().includes("doctor will be with you shortly")) {
        setAgentState("done");
        buildSummary(messagesRef.current);
      } else {
        listen(0);
      }
    } catch (err) {
      console.error(err);
      setAgentState("listening");
      listen(0);
    }
  }

  function speakText(text: string): Promise<void> {
    return new Promise((resolve) => {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 0.9;
      utter.pitch = 1;
      utter.lang = "en-US";
      const trySpeak = () => {
        const voices = window.speechSynthesis.getVoices();
        const pick =
          voices.find(v => v.lang.startsWith("en") && (v.name.includes("Samantha") || v.name.includes("Karen") || v.name.includes("Google US English"))) ||
          voices.find(v => v.lang.startsWith("en"));
        if (pick) utter.voice = pick;
        setAgentState("speaking");
        utter.onend = () => resolve();
        utter.onerror = () => resolve();
        window.speechSynthesis.speak(utter);
      };
      if (window.speechSynthesis.getVoices().length) trySpeak();
      else { window.speechSynthesis.onvoiceschanged = trySpeak; }
    });
  }

  // silenceCount: 0 = first attempt, 1 = second attempt (~10s silence) → move forward
  function listen(silenceCount: number) {
    if (stateRef.current === "done") return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Please use Chrome for voice support."); return; }
    const r = new SR();
    r.continuous = false;
    r.interimResults = true;
    r.lang = "en-US";
    r.onstart = () => setAgentState("listening");
    r.onresult = (e: SpeechRecognitionEvent) => {
      const t = Array.from(e.results).map((x: SpeechRecognitionResult) => x[0].transcript).join("");
      setLiveText(t);
      liveTextRef.current = t;
    };
    r.onend = () => {
      const text = liveTextRef.current.trim();
      setLiveText("");
      liveTextRef.current = "";
      if (!text || stateRef.current === "done") return;
      const userMsg: Message = { role: "user", content: text };
      const updated = [...messagesRef.current, userMsg];
      setMessages(prev => [...prev, userMsg]);
      messagesRef.current = updated;
      callAI(updated);
    };
    r.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error === "no-speech") {
        if (silenceCount === 0) {
          // First timeout (~5-8s) — quietly give them more time
          listen(1);
        } else {
          // Second timeout (~10-16s total silence) — nudge AI to move on
          const silentMsg: Message = { role: "user", content: "[Patient is silent]" };
          const updated = [...messagesRef.current, silentMsg];
          messagesRef.current = updated;
          callAI(updated);
        }
        return;
      }
      setAgentState("listening");
      listen(0);
    };
    r.start();
  }

  async function buildSummary(msgs: Message[]) {
    setTab("summary");
    const res = await fetch("/api/summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversation: msgs, patientName, patientHistory }),
    });
    const data = await res.json();
    setSummary(data.summary || "");
  }

  function endConsultation() {
    window.speechSynthesis.cancel();
    setAgentState("done");
    buildSummary(messagesRef.current);
  }

  const stateLabel =
    state === "loading" ? "Thinking..." :
    state === "speaking" ? "Speaking — please wait" :
    state === "listening" ? "Listening — speak now" :
    "Consultation complete";

  const dotColor =
    state === "loading" ? "bg-amber-400 animate-pulse" :
    state === "speaking" ? "bg-cyan-400 animate-pulse" :
    state === "listening" ? "bg-green-400 animate-pulse" :
    "bg-gray-500";

  // Filter silent messages from display
  const displayMessages = messages.filter(m => m.content !== "[Patient is silent]");

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Status + end button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
          <span className="text-sm text-blue-200/80 font-medium">{stateLabel}</span>
        </div>
        {state !== "done" && (
          <button onClick={endConsultation} className="text-xs border border-red-800/60 text-red-400 hover:bg-red-950/50 px-3 py-1.5 rounded-lg transition">
            End Consultation
          </button>
        )}
      </div>

      {/* Wave indicator */}
      {state === "listening" && (
        <div className="flex items-center justify-center gap-1 py-2">
          {[0,1,2,3,4,5,6].map(i => (
            <span key={i} className="w-1 bg-green-500 rounded-full animate-pulse"
              style={{ height: `${12 + Math.sin(i) * 8}px`, animationDelay: `${i * 80}ms` }} />
          ))}
          <span className="ml-3 text-green-400 text-xs">Just speak — no button needed</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-[#1a2f5a]">
        {(["conversation", "summary"] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition ${tab === t ? "border-blue-500 text-white" : "border-transparent text-blue-500/40 hover:text-blue-300"}`}>
            {t}{t === "summary" && summary && <span className="ml-1.5 w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block align-middle" />}
          </button>
        ))}
      </div>

      {/* Conversation */}
      {tab === "conversation" && (
        <div className="flex-1 overflow-y-auto flex flex-col gap-3 min-h-64 max-h-[420px]">
          {state === "loading" && displayMessages.length === 0 && (
            <div className="flex justify-start">
              <div className="bg-[#0d1b3e] border border-[#1a2f5a] rounded-2xl px-5 py-3 flex gap-1.5 items-center">
                {[0,1,2].map(i => <span key={i} className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay:`${i*150}ms`}} />)}
              </div>
            </div>
          )}
          {displayMessages.map((m, i) => (
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
          {state === "loading" && displayMessages.length > 0 && (
            <div className="flex justify-start">
              <div className="bg-[#0d1b3e] border border-[#1a2f5a] rounded-2xl px-5 py-3 flex gap-1.5 items-center">
                {[0,1,2].map(i => <span key={i} className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay:`${i*150}ms`}} />)}
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      )}

      {/* Summary */}
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
                <button onClick={() => {
                  try {
                    const d = JSON.parse(summary);
                    navigator.clipboard.writeText(JSON.stringify(d, null, 2));
                  } catch {
                    navigator.clipboard.writeText(summary);
                  }
                }}
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
