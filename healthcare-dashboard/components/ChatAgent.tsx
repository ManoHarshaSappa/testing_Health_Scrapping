"use client";

import { useState, useRef, useEffect } from "react";

interface Message { role: "user" | "assistant"; content: string; }
interface ChatAgentProps { patientName: string; patientHistory: string; }

interface SymptomDetail { name: string; severity: string; triggers: string; relievers: string; }
interface UMLSConcept  { term: string; fullName: string; cui: string; confidence: "High" | "Medium" | "Low"; }
interface SummaryData {
  chiefComplaint: string;
  urgency: "Low" | "Medium" | "High" | "Emergency";
  urgencyReason: string;
  confidence: "Low" | "Medium" | "High";
  confidenceReason: string;
  symptoms: SymptomDetail[] | string[];
  duration: string;
  associatedSymptoms: string[];
  deniedSymptoms: string[];
  medications: string[];
  relevantHistory: string[];
  dialysisDetails: string;
  dialysisSymptoms: string[];
  redFlags: string[];
  clinicalImpression: string;
  nextSteps: string[];
  doctorPriority: string[];
  patientNote: string;
  umlsConcepts: UMLSConcept[];
}

const urgencyStyle: Record<string, string> = {
  Low:       "bg-emerald-900/40 text-emerald-300 border-emerald-700/60",
  Medium:    "bg-amber-900/40 text-amber-300 border-amber-700/60",
  High:      "bg-red-900/40 text-red-300 border-red-700/60",
  Emergency: "bg-red-900/60 text-red-200 border-red-600",
};
const urgencyDot: Record<string, string> = {
  Low: "bg-emerald-400", Medium: "bg-amber-400", High: "bg-red-400", Emergency: "bg-red-300",
};
const confidenceStyle: Record<string, string> = {
  High:   "bg-emerald-900/30 text-emerald-300 border-emerald-700/50",
  Medium: "bg-amber-900/30 text-amber-300 border-amber-700/50",
  Low:    "bg-red-900/30 text-red-300 border-red-700/50",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#0d1735] rounded-xl p-4 border border-[#1a2f5a]">
      <p className="text-xs text-blue-500/70 uppercase tracking-widest font-semibold mb-2.5">{title}</p>
      {children}
    </div>
  );
}

function Pills({ items }: { items: string[] }) {
  const empty = !items.length || (items.length === 1 && (items[0].toLowerCase().includes("none") || items[0].toLowerCase().includes("not identified")));
  if (empty) return <p className="text-blue-500/40 text-xs">{items[0] ?? "None reported"}</p>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((s, i) => <span key={i} className="text-xs bg-blue-900/50 text-blue-200 border border-blue-700/50 px-2.5 py-1 rounded-full">{s}</span>)}
    </div>
  );
}

function Lines({ items }: { items: string[] }) {
  const empty = !items.length || (items.length === 1 && items[0].toLowerCase().includes("none"));
  if (empty) return <p className="text-blue-500/40 text-xs">{items[0] ?? "None reported"}</p>;
  return <>{items.map((h, i) => <p key={i} className="text-blue-200 text-xs leading-relaxed">{h}</p>)}</>;
}

function toArr(val: unknown): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val as string[];
  if (typeof val === "string") return val ? [val] : [];
  return [];
}

function SummaryCard({ raw }: { raw: string }) {
  let data: SummaryData | null = null;
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) data = JSON.parse(match[0]);
  } catch { /* fall through */ }

  if (!data) {
    return <pre className="text-blue-200 text-sm whitespace-pre-wrap font-sans leading-relaxed bg-[#0d1735] rounded-xl p-5 border border-[#1a2f5a]">{raw}</pre>;
  }

  const uStyle  = urgencyStyle[data.urgency]    ?? urgencyStyle.Medium;
  const uDot    = urgencyDot[data.urgency]      ?? urgencyDot.Medium;
  const cStyle  = confidenceStyle[data.confidence] ?? confidenceStyle.Medium;

  // symptoms may be rich objects or plain strings
  const rawSymptoms = Array.isArray(data.symptoms) ? data.symptoms : [];
  const symptomsRich = (rawSymptoms as SymptomDetail[]).filter(s => typeof s === "object" && s.name);
  const symptomsFlat = (rawSymptoms as string[]).filter(s => typeof s === "string");

  const redFlags       = toArr(data.redFlags);
  const nextSteps      = toArr(data.nextSteps);
  const doctorPriority = toArr(data.doctorPriority);
  const assocSymptoms  = toArr(data.associatedSymptoms);
  const deniedSymptoms = toArr(data.deniedSymptoms);
  const medications    = toArr(data.medications);
  const relevantHist   = toArr(data.relevantHistory);
  const dialysisSyms   = toArr(data.dialysisSymptoms);
  const umlsConcepts   = Array.isArray(data.umlsConcepts) ? data.umlsConcepts : [];

  const hasDialysis = data.dialysisDetails && !data.dialysisDetails.toLowerCase().includes("none");
  const hasRedFlags = redFlags.length > 0 && !redFlags[0].toLowerCase().includes("none");
  const hasNextSteps = nextSteps.length > 0;

  return (
    <div className="space-y-3">

      {/* Header — Chief Complaint + Urgency + Confidence */}
      <div className="bg-[#0d1735] rounded-xl p-4 border border-[#1a2f5a]">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-blue-500/70 uppercase tracking-widest font-semibold">Chief Complaint</p>
          <div className="flex items-center gap-2">
            {data.confidence && (
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cStyle}`} title={data.confidenceReason}>
                {data.confidence} confidence
              </span>
            )}
            <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-semibold ${uStyle}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${uDot}`} />
              {data.urgency}
            </span>
          </div>
        </div>
        <p className="text-white text-base font-semibold leading-snug">{data.chiefComplaint}</p>
        {data.urgencyReason && <p className="text-blue-400/60 text-xs mt-1.5 italic">{data.urgencyReason}</p>}
        {data.confidenceReason && <p className="text-blue-500/40 text-[10px] mt-1">{data.confidenceReason}</p>}
      </div>

      {/* Red flags banner — only if present */}
      {hasRedFlags && (
        <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-4">
          <p className="text-xs text-red-400 uppercase tracking-widest font-semibold mb-2">⚠ Red Flags</p>
          <div className="flex flex-wrap gap-1.5">
            {redFlags.map((f, i) => (
              <span key={i} className="text-xs bg-red-900/40 text-red-200 border border-red-700/50 px-2.5 py-1 rounded-full">{f}</span>
            ))}
          </div>
        </div>
      )}

      {/* Symptoms — rich or flat */}
      <Section title="Symptoms">
        {symptomsRich.length > 0 ? (
          <div className="space-y-3">
            {symptomsRich.map((s, i) => (
              <div key={i} className="border border-[#1a2f5a] rounded-lg p-3">
                <p className="text-blue-100 text-xs font-semibold mb-1.5">{s.name}</p>
                <div className="grid grid-cols-3 gap-2 text-[10px]">
                  <div><span className="text-blue-500/60 block">Severity</span><span className="text-blue-200">{s.severity || "Not specified"}</span></div>
                  <div><span className="text-blue-500/60 block">Triggers</span><span className="text-blue-200">{s.triggers || "None reported"}</span></div>
                  <div><span className="text-blue-500/60 block">Relievers</span><span className="text-blue-200">{s.relievers || "None reported"}</span></div>
                </div>
              </div>
            ))}
          </div>
        ) : symptomsFlat.length > 0 ? (
          <Pills items={symptomsFlat} />
        ) : (
          <p className="text-blue-500/40 text-xs">None reported</p>
        )}
      </Section>

      {/* Duration + Associated */}
      <div className="grid grid-cols-2 gap-3">
        <Section title="Duration">
          <p className="text-blue-100 text-sm font-medium">{data.duration || "Not specified"}</p>
        </Section>
        <Section title="Associated Symptoms">
          <Pills items={assocSymptoms.length ? assocSymptoms : ["None reported"]} />
        </Section>
      </div>

      {/* Denied symptoms */}
      {(deniedSymptoms.length > 0 && !deniedSymptoms[0].toLowerCase().includes("none")) && (
        <Section title="Denied Symptoms">
          <div className="flex flex-wrap gap-1.5">
            {deniedSymptoms.map((s, i) => (
              <span key={i} className="text-xs bg-[#05091a] text-blue-500/60 border border-[#1a2f5a] px-2.5 py-1 rounded-full line-through">{s}</span>
            ))}
          </div>
        </Section>
      )}

      {/* Medications + History */}
      <div className="grid grid-cols-2 gap-3">
        <Section title="Medications">
          <Lines items={medications.length ? medications : ["None reported"]} />
        </Section>
        <Section title="Relevant History">
          <Lines items={relevantHist.length ? relevantHist : ["None reported"]} />
        </Section>
      </div>

      {/* Dialysis (only if relevant) */}
      {hasDialysis && (
        <div className="grid grid-cols-2 gap-3">
          <Section title="Dialysis Details">
            <p className="text-blue-200 text-xs">{data.dialysisDetails}</p>
          </Section>
          <Section title="Dialysis Symptoms">
            <Lines items={dialysisSyms.length ? dialysisSyms : ["None reported"]} />
          </Section>
        </div>
      )}

      {/* Clinical Impression */}
      {data.clinicalImpression && (
        <div className="bg-[#080e24] border border-blue-800/40 rounded-xl p-4">
          <p className="text-xs text-blue-400/70 uppercase tracking-widest font-semibold mb-2">Clinical Impression (AI)</p>
          <p className="text-blue-200 text-sm leading-relaxed">{data.clinicalImpression}</p>
        </div>
      )}

      {/* Suggested Next Steps */}
      {hasNextSteps && (
        <div className="bg-[#080e24] border border-cyan-800/40 rounded-xl p-4">
          <p className="text-xs text-cyan-400/70 uppercase tracking-widest font-semibold mb-2.5">Suggested Next Steps</p>
          <div className="space-y-2">
            {nextSteps.map((step, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-cyan-900/50 border border-cyan-700/50 flex items-center justify-center text-[10px] text-cyan-300 font-bold shrink-0 mt-0.5">{i + 1}</span>
                <p className="text-cyan-100 text-sm">{step}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Doctor Priority Checklist */}
      {doctorPriority.length > 0 && (
        <Section title="Doctor's Priority Checklist">
          <div className="space-y-2">
            {doctorPriority.map((item, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="w-4 h-4 rounded border border-blue-700/50 shrink-0 mt-0.5" />
                <p className="text-blue-100 text-sm">{item}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* UMLS Concept Mapping */}
      {umlsConcepts.length > 0 && (
        <div className="bg-[#080e24] border border-[#1a2f5a] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <p className="text-xs text-blue-500/70 uppercase tracking-widest font-semibold">Clinical Concepts</p>
            <span className="text-[10px] bg-blue-900/40 text-blue-300 border border-blue-700/50 px-2 py-0.5 rounded-full font-medium">UMLS Mapped</span>
          </div>
          <div className="flex flex-col gap-2">
            {umlsConcepts.map((c, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-[#1a2f5a] last:border-0">
                <div>
                  <span className="text-blue-100 text-xs font-semibold">{c.term}</span>
                  {c.fullName && c.fullName !== c.term && (
                    <span className="text-blue-500/50 text-[10px] ml-2">{c.fullName}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-blue-400/60 text-[10px] font-mono">{c.cui}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                    c.confidence === "High"   ? "bg-emerald-900/40 text-emerald-300" :
                    c.confidence === "Medium" ? "bg-amber-900/40 text-amber-300" :
                                               "bg-red-900/40 text-red-300"
                  }`}>{c.confidence}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Patient note */}
      {data.patientNote && (
        <p className="text-blue-500/50 text-xs italic text-center px-2 pb-1">{data.patientNote}</p>
      )}
    </div>
  );
}

type Tab = "conversation" | "summary";

export default function ChatAgent({ patientName, patientHistory }: ChatAgentProps) {
  const [messages, setMessages]   = useState<Message[]>([]);
  const [input, setInput]         = useState("");
  const [thinking, setThinking]   = useState(false);
  const [done, setDone]           = useState(false);
  const [tab, setTab]             = useState<Tab>("conversation");
  const [summary, setSummary]     = useState("");
  const [started, setStarted]     = useState(false);

  const messagesRef = useRef<Message[]>([]);
  const chatEndRef  = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  async function callAI(msgs: Message[]) {
    setThinking(true);
    try {
      const res  = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: msgs, patientName, patientHistory }),
      });
      const data = await res.json();
      if (!data.response) throw new Error("No response");
      const reply = data.response as string;

      const updated = [...msgs, { role: "assistant" as const, content: reply }];
      setMessages(updated);
      messagesRef.current = updated;

      if (reply.toLowerCase().includes("doctor will be with you shortly") || reply.toLowerCase().includes("i have everything i need")) {
        setDone(true);
        buildSummary(updated);
      }
    } catch {
      const fallback = [...msgs, { role: "assistant" as const, content: "Sorry, something went wrong. Please try again." }];
      setMessages(fallback);
      messagesRef.current = fallback;
    }
    setThinking(false);
    setTimeout(() => inputRef.current?.focus(), 50);
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

  function handleStart() {
    setStarted(true);
    callAI([]);
  }

  function handleSend() {
    const text = input.trim();
    if (!text || thinking || done) return;
    setInput("");

    const userMsg: Message = { role: "user", content: text };
    const updated = [...messagesRef.current, userMsg];
    setMessages(updated);
    messagesRef.current = updated;
    callAI(updated);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  function handleEndConsultation() {
    setDone(true);
    buildSummary(messagesRef.current);
  }

  // ── Not started yet ───────────────────────────────────────────────────────
  if (!started) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-blue-600/10 border border-blue-500/30 flex items-center justify-center">
            <svg className="w-9 h-9 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-blue-500/30 border border-blue-400/40 animate-ping" />
        </div>
        <div>
          <p className="text-white font-semibold text-base mb-1">Aria is ready for {patientName}</p>
          <p className="text-blue-400/60 text-sm max-w-xs leading-relaxed">
            Aria will ask about symptoms, duration, and medications. Type your answers naturally.
          </p>
        </div>
        <button onClick={handleStart}
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3 rounded-xl transition shadow-xl shadow-blue-900/50 text-sm">
          Begin Intake
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-3">

      {/* Status bar */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${done ? "bg-gray-500" : thinking ? "bg-amber-400 animate-pulse" : "bg-emerald-400 animate-pulse"}`} />
          <span className="text-sm text-blue-200/70 font-medium">
            {done ? "Consultation complete" : thinking ? "Aria is typing..." : "Waiting for your reply"}
          </span>
        </div>
        {!done && (
          <button onClick={handleEndConsultation}
            className="text-xs border border-red-800/60 text-red-400 hover:bg-red-950/50 px-3 py-1.5 rounded-lg transition">
            End &amp; Summarise
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#1a2f5a] shrink-0">
        {(["conversation", "summary"] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition ${
              tab === t ? "border-blue-500 text-white" : "border-transparent text-blue-500/40 hover:text-blue-300"
            }`}>
            {t}
            {t === "summary" && summary && (
              <span className="ml-1.5 w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block align-middle" />
            )}
          </button>
        ))}
      </div>

      {/* Conversation tab */}
      {tab === "conversation" && (
        <>
          <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-1">

            {/* Initial thinking dots before first message */}
            {thinking && messages.length === 0 && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-700/40 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-blue-300 text-xs font-bold">A</span>
                </div>
                <div className="bg-[#0d1b3e] border border-[#1a2f5a] rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5 items-center">
                  {[0,1,2].map(i => (
                    <span key={i} className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 150}ms` }} />
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex items-start gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                  m.role === "user"
                    ? "bg-blue-700 text-white"
                    : "bg-blue-600/20 border border-blue-700/40 text-blue-300"
                }`}>
                  {m.role === "user" ? patientName.charAt(0).toUpperCase() : "A"}
                </div>

                {/* Bubble */}
                <div className={`max-w-[78%] ${m.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
                  <span className={`text-[10px] font-medium px-1 ${m.role === "user" ? "text-blue-400/50 text-right" : "text-blue-500/50"}`}>
                    {m.role === "user" ? patientName : "Aria · Healthcare Assistant"}
                  </span>
                  <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-blue-700 text-white rounded-tr-sm shadow-lg shadow-blue-900/30"
                      : "bg-[#0d1b3e] border border-[#1a2f5a] text-blue-50 rounded-tl-sm"
                  }`}>
                    {m.content}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing indicator after user sends */}
            {thinking && messages.length > 0 && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-700/40 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-blue-300 text-xs font-bold">A</span>
                </div>
                <div className="bg-[#0d1b3e] border border-[#1a2f5a] rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5 items-center">
                  {[0,1,2].map(i => (
                    <span key={i} className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 150}ms` }} />
                  ))}
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input area */}
          {!done ? (
            <div className="shrink-0 flex gap-2 items-center bg-[#080e24] border border-[#1a2f5a] rounded-xl px-4 py-2 focus-within:border-blue-700/60 transition">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={thinking ? "Aria is typing..." : "Type your reply..."}
                disabled={thinking}
                className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-blue-500/30 disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || thinking}
                className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="shrink-0 flex items-center justify-center gap-2 py-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-emerald-400/70 text-xs">Consultation complete · see Summary tab</span>
            </div>
          )}
        </>
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
                <span className="text-xs bg-emerald-900/30 text-emerald-400 border border-emerald-700/50 px-3 py-1 rounded-full">
                  Consultation Complete
                </span>
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
