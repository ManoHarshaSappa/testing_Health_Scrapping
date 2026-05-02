"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import SummaryCard from "./SummaryCard";

interface Message { role: "user" | "assistant"; content: string; }
interface ChatAgentProps { patientName: string; patientHistory: string; patientId: string; dob?: string; gender?: string; }

type Tab = "conversation" | "summary";

const QUICK_RESPONSES = [
  "Yes", "No", "Not sure",
  "No medications", "No known allergies",
  "About 2–3 days ago", "Pain is 7 out of 10",
  "It's getting worse", "Comes and goes",
];

export default function ChatAgent({ patientName, patientHistory, patientId, dob = "", gender = "" }: ChatAgentProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState("");
  const [thinking, setThinking] = useState(false);
  const [done, setDone]         = useState(false);
  const [tab, setTab]           = useState<Tab>("conversation");
  const [summary, setSummary]   = useState("");
  const [started, setStarted]   = useState(false);
  const [saveForm, setSaveForm] = useState({ diagnosisName: "", diagnosisCode: "", providerName: "", patientClass: "Outpatient" });
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);

  const router      = useRouter();
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
    const raw  = data.summary || "";
    setSummary(raw);
    try {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        setSaveForm(f => ({ ...f, diagnosisName: parsed.chiefComplaint || "" }));
      }
    } catch { /* ignore */ }
  }

  async function handleSaveVisit() {
    setSaving(true);
    try {
      await fetch("/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, dob, gender, ...saveForm }),
      });
      try {
        const cache = JSON.parse(localStorage.getItem("patient_data_cache") || "{}");
        delete cache[patientId];
        localStorage.setItem("patient_data_cache", JSON.stringify(cache));
      } catch { /* ignore */ }
      try { localStorage.removeItem(`new_patient_${patientId}`); } catch { /* ignore */ }
      setSaved(true);
    } catch { /* ignore */ }
    setSaving(false);
  }

  function handleStart() { setStarted(true); callAI([]); }

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

  function handleEndConsultation() { setDone(true); buildSummary(messagesRef.current); }

  if (!started) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center shadow-sm">
            <svg className="w-9 h-9 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-blue-100 border border-blue-300 animate-ping" />
        </div>
        <div>
          <p className="text-slate-900 font-semibold text-base mb-1">Aria is ready for {patientName}</p>
          <p className="text-slate-400 text-sm max-w-xs leading-relaxed">
            Aria will ask about symptoms, duration, and medications. Type your answers naturally.
          </p>
        </div>
        <button onClick={handleStart}
          className="bg-blue-700 hover:bg-blue-600 text-white font-semibold px-8 py-3 rounded-xl transition shadow-md text-sm">
          Begin Intake
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Status bar */}
      <div className="shrink-0 flex items-center justify-between bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-100">
        <div className="flex items-center gap-2.5">
          {thinking ? (
            <div className="flex items-end gap-0.5 h-3.5">
              {[5,9,6,8].map((h,i) => (
                <span key={i} className="w-0.5 bg-amber-400 rounded-full animate-bounce"
                  style={{height:`${h}px`, animationDelay:`${i*80}ms`}} />
              ))}
            </div>
          ) : (
            <span className={`w-2 h-2 rounded-full ${done ? "bg-slate-300" : "bg-emerald-400 animate-pulse"}`} />
          )}
          <span className={`text-xs font-semibold uppercase tracking-wider ${done ? "text-slate-400" : thinking ? "text-amber-600" : "text-slate-500"}`}>
            {done ? "Consultation Complete" : thinking ? "Aria is typing..." : "Listening"}
          </span>
        </div>
        {!done && (
          <button onClick={handleEndConsultation}
            className="flex items-center gap-1.5 text-xs border border-red-200 text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition font-medium">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            End &amp; Summarise
          </button>
        )}
      </div>

      {/* Tabs — segmented pill */}
      <div className="shrink-0 flex items-center gap-1 bg-slate-100 rounded-xl p-1">
        <button onClick={() => setTab("conversation")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
            tab === "conversation"
              ? "bg-[#1B2B4B] text-white shadow-sm"
              : "text-slate-400 hover:text-slate-600"
          }`}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Interview
        </button>
        <button onClick={() => setTab("summary")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
            tab === "summary"
              ? "bg-[#1B2B4B] text-white shadow-sm"
              : "text-slate-400 hover:text-slate-600"
          }`}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Summary
          {summary && (
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
          )}
        </button>
      </div>

      {tab === "conversation" && (
        <>
          <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-1">
            {thinking && messages.length === 0 && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-blue-700 text-xs font-bold">A</span>
                </div>
                <div className="bg-white border border-slate-200 shadow-sm rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5 items-center">
                  {[0,1,2].map(i => <span key={i} className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: `${i*150}ms` }} />)}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex items-start gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                  m.role === "user" ? "bg-blue-700 text-white" : "bg-blue-100 border border-blue-200 text-blue-700"
                }`}>
                  {m.role === "user" ? patientName.charAt(0).toUpperCase() : "A"}
                </div>
                <div className={`max-w-[78%] ${m.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
                  <span className={`text-[10px] font-medium px-1 ${m.role === "user" ? "text-slate-400 text-right" : "text-slate-400"}`}>
                    {m.role === "user" ? patientName : "Aria · Healthcare Assistant"}
                  </span>
                  <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-blue-700 text-white rounded-tr-sm shadow-sm"
                      : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm"
                  }`}>
                    {m.content}
                  </div>
                </div>
              </div>
            ))}

            {thinking && messages.length > 0 && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-blue-700 text-xs font-bold">A</span>
                </div>
                <div className="bg-white border border-slate-200 shadow-sm rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5 items-center">
                  {[0,1,2].map(i => <span key={i} className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: `${i*150}ms` }} />)}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {!done ? (
            <>
              {/* Quick response chips */}
              <div className="shrink-0 flex flex-wrap gap-1.5 pb-1">
                {QUICK_RESPONSES.map(chip => (
                  <button key={chip} onClick={() => { setInput(chip); setTimeout(() => inputRef.current?.focus(), 50); }}
                    className="text-xs bg-slate-50 border border-slate-200 text-slate-500 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 px-2.5 py-1 rounded-full transition">
                    {chip}
                  </button>
                ))}
              </div>
            <div className="shrink-0 flex gap-2 items-center bg-white border border-slate-200 shadow-sm rounded-xl px-4 py-2 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={thinking ? "Aria is typing..." : "Type your reply..."}
                disabled={thinking}
                className="flex-1 bg-transparent text-slate-900 text-sm outline-none placeholder:text-slate-300 disabled:opacity-50"
              />
              <button onClick={handleSend} disabled={!input.trim() || thinking}
                className="w-8 h-8 rounded-lg bg-blue-700 hover:bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            </>
          ) : (
            <div className="shrink-0 flex items-center justify-center gap-2 py-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-emerald-600 text-xs">Consultation complete · see Summary tab</span>
            </div>
          )}
        </>
      )}

      {tab === "summary" && (
        <div className="flex-1 overflow-y-auto">
          {!summary ? (
            <div className="flex items-center justify-center gap-2 py-16 text-slate-400 text-sm">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
              Generating clinical summary...
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full">Consultation Complete</span>
                <button onClick={() => { try { navigator.clipboard.writeText(summary); } catch { /* ignore */ } }}
                  className="text-xs text-slate-400 hover:text-slate-700 border border-slate-200 bg-white px-3 py-1 rounded-lg transition shadow-sm">
                  Copy
                </button>
              </div>
              <SummaryCard raw={summary} />

              {/* Save visit to Snowflake */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-sm">
                <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">
                  {saved ? "✓ Visit Saved to Snowflake" : "Save Visit to Warehouse"}
                </p>
                {!saved ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Diagnosis</label>
                        <input
                          value={saveForm.diagnosisName}
                          onChange={e => setSaveForm(f => ({ ...f, diagnosisName: e.target.value }))}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                          placeholder="Chief complaint / diagnosis"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">ICD-10 Code</label>
                        <input
                          value={saveForm.diagnosisCode}
                          onChange={e => setSaveForm(f => ({ ...f, diagnosisCode: e.target.value }))}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                          placeholder="e.g. M54.5"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Provider Name</label>
                        <input
                          value={saveForm.providerName}
                          onChange={e => setSaveForm(f => ({ ...f, providerName: e.target.value }))}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                          placeholder="Dr. Name"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Visit Type</label>
                        <select
                          value={saveForm.patientClass}
                          onChange={e => setSaveForm(f => ({ ...f, patientClass: e.target.value }))}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-xs outline-none focus:border-blue-400">
                          <option>Outpatient</option>
                          <option>Inpatient</option>
                          <option>Emergency</option>
                        </select>
                      </div>
                    </div>
                    <button
                      onClick={handleSaveVisit}
                      disabled={saving || !saveForm.diagnosisName.trim()}
                      className="w-full flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold py-2.5 rounded-lg transition">
                      {saving ? "Saving..." : "Save to Snowflake"}
                    </button>
                  </>
                ) : (
                  <p className="text-emerald-600 text-xs">Visit record saved successfully.</p>
                )}
              </div>

              <button
                onClick={() => router.push("/today")}
                className="w-full flex items-center justify-center gap-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm py-3.5 rounded-xl transition shadow-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Complete — Return to Today&apos;s Visits
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
