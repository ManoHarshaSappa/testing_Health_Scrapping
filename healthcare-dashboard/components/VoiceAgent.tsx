"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import SummaryCard from "./SummaryCard";

interface Message { role: "user" | "assistant"; content: string; }
interface VoiceAgentProps { patientName: string; patientHistory: string; patientId: string; dob?: string; gender?: string; }

type Status = "idle" | "processing" | "speaking" | "listening";
type Tab    = "conversation" | "summary";

const SILENT = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";

const QUICK_PHRASES = [
  "Yes", "No", "Not sure",
  "No medications", "No allergies",
  "2–3 days ago", "Pain is 7 out of 10",
  "It's getting worse",
];

export default function VoiceAgent({ patientName, patientHistory, patientId, dob = "", gender = "" }: VoiceAgentProps) {
  const [started, setStarted]     = useState(false);
  const [status, setStatus]       = useState<Status>("idle");
  const [messages, setMessages]   = useState<Message[]>([]);
  const [liveText, setLiveText]   = useState("");
  const [done, setDone]           = useState(false);
  const [tab, setTab]             = useState<Tab>("conversation");
  const [summary, setSummary]     = useState("");
  const [supported, setSupported] = useState(true);
  const [saveForm, setSaveForm]   = useState({ diagnosisName: "", diagnosisCode: "", providerName: "", patientClass: "Outpatient" });
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);

  const router          = useRouter();
  const messagesRef     = useRef<Message[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef  = useRef<any>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chatEndRef      = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) setSupported(false);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, liveText]);

  async function speakText(text: string): Promise<void> {
    setStatus("speaking");
    return new Promise((resolve) => {
      const wordCount = text.trim().split(/\s+/).length;
      const fallback  = setTimeout(resolve, Math.max(6000, wordCount * 550));

      fetch("/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })
        .then(r => r.blob())
        .then(blob => {
          const url   = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audio.onended = () => { clearTimeout(fallback); URL.revokeObjectURL(url); resolve(); };
          audio.onerror = () => { clearTimeout(fallback); URL.revokeObjectURL(url); resolve(); };
          audio.play().catch(() => { clearTimeout(fallback); resolve(); });
        })
        .catch(() => { clearTimeout(fallback); resolve(); });
    });
  }

  async function callAI(msgs: Message[]) {
    setStatus("processing");
    try {
      const res  = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: msgs, patientName, patientHistory }),
      });
      const data = await res.json();
      const reply = data.response as string;

      const updated = [...msgs, { role: "assistant" as const, content: reply }];
      setMessages(updated);
      messagesRef.current = updated;

      const isDone = reply.toLowerCase().includes("doctor will be with you shortly") ||
                     reply.toLowerCase().includes("i have everything i need");

      await speakText(reply);

      if (isDone) {
        setDone(true);
        buildSummary(updated);
      } else {
        startListening();
      }
    } catch {
      startListening();
    }
  }

  function sendTranscript(transcript: string) {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (!transcript.trim()) { startListening(); return; }
    const userMsg: Message = { role: "user", content: transcript.trim() };
    const updated = [...messagesRef.current, userMsg];
    setMessages(updated);
    messagesRef.current = updated;
    setLiveText("");
    callAI(updated);
  }

  function handleMicTap() {
    if (status !== "listening") return;
    recognitionRef.current?.stop();
  }

  function startListening() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    setStatus("listening");
    setLiveText("");
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition: any = new SR();
    recognitionRef.current      = recognition;
    recognition.continuous      = true;
    recognition.interimResults  = true;
    recognition.lang            = "en-US";

    let finalTranscript = "";

    function resetSilenceTimer() {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => recognition.stop(), 5000);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalTranscript += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      setLiveText(finalTranscript || interim);
      resetSilenceTimer();
    };

    recognition.onstart = () => resetSilenceTimer();

    recognition.onend = () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      sendTranscript(finalTranscript);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (e: any) => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (e.error === "no-speech" || e.error === "audio-capture") startListening();
    };

    try { recognition.start(); } catch { /* already running */ }
  }

  async function handleStart() {
    try { await new Audio(SILENT).play(); } catch { /* ignore */ }
    setStarted(true);
    callAI([]);
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

  function handleEnd() {
    recognitionRef.current?.stop();
    setDone(true);
    buildSummary(messagesRef.current);
  }

  // Not started
  if (!started) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
        {!supported && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 text-amber-700 text-sm max-w-xs">
            Voice requires Chrome. Use Text mode if you&apos;re on another browser.
          </div>
        )}
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center shadow-sm">
            <svg className="w-9 h-9 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1 1.93c-3.94-.49-7-3.85-7-7.93H2c0 4.97 3.58 9.09 8.25 9.87V22h3.5v-4.13C18.42 17.09 22 12.97 22 8h-2c0 4.08-3.06 7.44-7 7.93V16h-2v-.07z"/>
            </svg>
          </div>
          <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-blue-100 border border-blue-300 animate-ping" />
        </div>
        <div>
          <p className="text-slate-900 font-semibold text-base mb-1">Aria will speak with {patientName}</p>
          <p className="text-slate-400 text-sm max-w-xs leading-relaxed">
            Speak naturally. Aria asks questions and listens automatically.
          </p>
        </div>
        <button onClick={handleStart} disabled={!supported}
          className="bg-blue-700 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded-xl transition shadow-md text-sm">
          Begin Voice Intake
        </button>
      </div>
    );
  }

  const statusLabel = done ? "Consultation complete" : {
    idle:       "",
    processing: "Aria is thinking...",
    speaking:   "Aria is speaking",
    listening:  "Listening...",
  }[status];

  const statusDot = {
    idle:       "",
    processing: "bg-amber-500 animate-pulse",
    speaking:   "bg-blue-500",
    listening:  "bg-emerald-500 animate-pulse",
  }[status];

  return (
    <div className="flex flex-col h-full gap-3">

      {/* Status bar */}
      <div className="shrink-0 flex items-center justify-between bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-100">
        <div className="flex items-center gap-2.5">
          {status === "speaking" && !done ? (
            <div className="flex items-end gap-0.5 h-3.5">
              {[5,9,6,10,7].map((h,i) => (
                <span key={i} className="w-0.5 bg-blue-500 rounded-full animate-bounce"
                  style={{height:`${h}px`, animationDelay:`${i*80}ms`}} />
              ))}
            </div>
          ) : status === "processing" ? (
            <div className="flex items-end gap-0.5 h-3.5">
              {[5,9,6,8].map((h,i) => (
                <span key={i} className="w-0.5 bg-amber-400 rounded-full animate-bounce"
                  style={{height:`${h}px`, animationDelay:`${i*80}ms`}} />
              ))}
            </div>
          ) : (
            <span className={`w-2 h-2 rounded-full ${done ? "bg-slate-300" : statusDot}`} />
          )}
          <span className={`text-xs font-semibold uppercase tracking-wider ${
            done ? "text-slate-400" :
            status === "speaking"   ? "text-blue-600" :
            status === "processing" ? "text-amber-600" :
            status === "listening"  ? "text-emerald-600" : "text-slate-400"
          }`}>
            {statusLabel || "Ready"}
          </span>
        </div>
        {!done && (
          <button onClick={handleEnd}
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
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1 1.93c-3.94-.49-7-3.85-7-7.93H2c0 4.97 3.58 9.09 8.25 9.87V22h3.5v-4.13C18.42 17.09 22 12.97 22 8h-2c0 4.08-3.06 7.44-7 7.93V16h-2v-.07z"/>
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

      {/* Conversation */}
      {tab === "conversation" && (
        <>
          <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-1">

            {status === "processing" && messages.length === 0 && (
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
                <div className={`max-w-[78%] flex flex-col gap-1 ${m.role === "user" ? "items-end" : "items-start"}`}>
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

            {status === "processing" && messages.length > 0 && (
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

          {/* Mic area */}
          {!done ? (
            <div className="shrink-0 flex flex-col items-center gap-3 pt-1 pb-2">
              {liveText && (
                <div className="w-full bg-white border border-slate-200 shadow-sm rounded-xl px-4 py-2.5 text-center">
                  <p className="text-slate-700 text-sm italic">&ldquo;{liveText}&rdquo;</p>
                </div>
              )}

              <div className="relative flex items-center justify-center">
                {status === "listening" && (
                  <>
                    <span className="absolute w-24 h-24 rounded-full bg-emerald-100 animate-ping opacity-60" />
                    <span className="absolute w-20 h-20 rounded-full bg-emerald-50" />
                  </>
                )}
                <button
                  onClick={handleMicTap}
                  disabled={status !== "listening"}
                  className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                    status === "listening"
                      ? "bg-emerald-600 shadow-lg shadow-emerald-200 scale-110 hover:bg-emerald-500 active:scale-100 cursor-pointer"
                      : "bg-slate-200 border border-slate-300 opacity-50 cursor-not-allowed"
                  }`}>
                  <svg className={`w-7 h-7 ${status === "listening" ? "text-white" : "text-slate-400"}`} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1 1.93c-3.94-.49-7-3.85-7-7.93H2c0 4.97 3.58 9.09 8.25 9.87V22h3.5v-4.13C18.42 17.09 22 12.97 22 8h-2c0 4.08-3.06 7.44-7 7.93V16h-2v-.07z"/>
                  </svg>
                </button>
              </div>

              <p className="text-slate-400 text-xs">
                {status === "listening"  ? "Speak now · tap mic to send early" :
                 status === "speaking"   ? "Aria is speaking..." :
                 status === "processing" ? "Processing your response..." : ""}
              </p>

              {/* Quick phrase chips — visible when listening */}
              {status === "listening" && (
                <div className="w-full flex flex-wrap justify-center gap-1.5 pt-1">
                  {QUICK_PHRASES.map(phrase => (
                    <button key={phrase}
                      onClick={() => sendTranscript(phrase)}
                      className="text-xs bg-slate-50 border border-slate-200 text-slate-500 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 px-2.5 py-1 rounded-full transition">
                      {phrase}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="shrink-0 flex items-center justify-center gap-2 py-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-emerald-600 text-xs">Consultation complete · see Summary tab</span>
            </div>
          )}
        </>
      )}

      {/* Summary */}
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
