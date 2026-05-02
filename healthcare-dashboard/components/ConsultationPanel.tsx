"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import SummaryCard from "./SummaryCard";

interface Message { role: "user" | "assistant"; content: string; }
interface Props {
  patientName: string;
  patientHistory: string;
  patientId: string;
  dob?: string;
  gender?: string;
}
type Tab = "interview" | "summary";

const SILENT = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";

const QUICK_RESPONSES = [
  "Yes", "No", "Not sure",
  "No medications", "No allergies",
  "About 2–3 days ago", "Pain is 7/10",
  "Getting worse", "Comes and goes",
];

function extractReport(msgs: Message[]) {
  const patientMsgs = msgs.filter(m => m.role === "user");
  const allText     = patientMsgs.map(m => m.content).join(" ").toLowerCase();
  const chiefComplaint = patientMsgs[0]?.content;
  const symptomWords = [
    "pain","ache","fever","cough","headache","nausea","vomiting","fatigue",
    "weakness","swelling","dizziness","shortness of breath","burning","discharge",
    "bleeding","rash","chest","back pain","stomach","sore throat","runny nose",
  ];
  const symptoms  = [...new Set(symptomWords.filter(w => allText.includes(w)))].slice(0, 6);
  const durMatch  = allText.match(/(\d+\s+(?:day|week|month|hour)s?|yesterday|this morning|few days|since last \w+|couple of days)/);
  const duration  = durMatch?.[0];
  const painMatch = allText.match(/(\d+)\s*(?:out of\s*10|\/\s*10)/);
  const pain      = painMatch ? `${painMatch[1]}/10` : undefined;
  const medMatch  = allText.match(/(?:taking|on|prescribed)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)/);
  const medication = medMatch?.[1];
  return { chiefComplaint, symptoms, duration, pain, medication };
}

export default function ConsultationPanel({ patientName, patientHistory, patientId, dob = "", gender = "" }: Props) {
  const [messages, setMessages]       = useState<Message[]>([]);
  const [input, setInput]             = useState("");
  const [thinking, setThinking]       = useState(false);
  const [done, setDone]               = useState(false);
  const [tab, setTab]                 = useState<Tab>("interview");
  const [summary, setSummary]         = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking]   = useState(false);
  const [liveText, setLiveText]       = useState("");
  const [voiceError, setVoiceError]   = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const voiceEnabledRef = useRef(false); // ref so stale closures always see current value
  const [saveForm, setSaveForm]       = useState({ diagnosisName: "", diagnosisCode: "", providerName: "", patientClass: "Outpatient" });
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);

  const router          = useRouter();
  const messagesRef     = useRef<Message[]>([]);
  const inputRef        = useRef<HTMLInputElement>(null);
  const chatEndRef      = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef  = useRef<any>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, liveText, thinking]);

  useEffect(() => { callAI([]); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  async function speakText(text: string): Promise<void> {
    if (!voiceEnabledRef.current) return;
    setIsSpeaking(true);
    return new Promise(resolve => {
      const wordCount = text.trim().split(/\s+/).length;
      const fallback  = setTimeout(() => { setIsSpeaking(false); resolve(); }, Math.max(6000, wordCount * 550));
      fetch("/api/speak", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) })
        .then(r => r.blob())
        .then(blob => {
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audio.onended = () => { clearTimeout(fallback); URL.revokeObjectURL(url); setIsSpeaking(false); resolve(); };
          audio.onerror = () => { clearTimeout(fallback); URL.revokeObjectURL(url); setIsSpeaking(false); resolve(); };
          audio.play().catch(() => { clearTimeout(fallback); setIsSpeaking(false); resolve(); });
        })
        .catch(() => { clearTimeout(fallback); setIsSpeaking(false); resolve(); });
    });
  }

  async function callAI(msgs: Message[]) {
    setThinking(true);
    try {
      const res   = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: msgs, patientName, patientHistory }) });
      const data  = await res.json();
      const reply = (data.response as string) || "";
      const updated = [...msgs, { role: "assistant" as const, content: reply }];
      setMessages(updated);
      messagesRef.current = updated;
      const isDone = reply.toLowerCase().includes("doctor will be with you shortly") || reply.toLowerCase().includes("i have everything i need");
      if (voiceEnabledRef.current) {
        await speakText(reply);
        if (isDone) { setDone(true); buildSummary(updated); } else startListening();
      } else {
        if (isDone) { setDone(true); buildSummary(updated); }
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    } catch {
      const err = [...msgs, { role: "assistant" as const, content: "Connection issue. Please type your response below." }];
      setMessages(err); messagesRef.current = err;
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    setThinking(false);
  }

  function startListening() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    setIsListening(true); setLiveText(""); setVoiceError(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition: any = new SR();
    recognitionRef.current = recognition;
    recognition.continuous = true; recognition.interimResults = true; recognition.lang = "en-US";
    let finalTranscript = "";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalTranscript += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      setLiveText(finalTranscript || interim);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => recognition.stop(), 5000);
    };
    recognition.onstart = () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => recognition.stop(), 5000);
    };
    recognition.onend = () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      setIsListening(false); setLiveText("");
      if (finalTranscript.trim()) { sendMessage(finalTranscript.trim()); }
      else { setVoiceError(true); setTimeout(() => { setVoiceError(false); inputRef.current?.focus(); }, 4000); }
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (e: any) => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      setIsListening(false); setLiveText("");
      if (e.error === "no-speech" || e.error === "audio-capture") {
        setVoiceError(true); setTimeout(() => { setVoiceError(false); inputRef.current?.focus(); }, 4000);
      }
    };
    try { recognition.start(); } catch { /* already running */ }
  }

  function stopListening() { recognitionRef.current?.stop(); setIsListening(false); if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current); }

  async function handleMicToggle() {
    if (isListening) { stopListening(); return; }
    // Check browser support first
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setVoiceError(true);
      setTimeout(() => setVoiceError(false), 5000);
      return;
    }
    if (!voiceEnabledRef.current) {
      try { await new Audio(SILENT).play(); } catch { /* ignore */ }
      voiceEnabledRef.current = true;
      setVoiceEnabled(true);
    }
    startListening();
  }

  function sendMessage(text: string) {
    if (!text.trim() || thinking || done) return;
    setInput(""); setLiveText("");
    const userMsg: Message = { role: "user", content: text.trim() };
    const updated = [...messagesRef.current, userMsg];
    setMessages(updated); messagesRef.current = updated; callAI(updated);
  }

  function handleSend() { if (isListening) stopListening(); sendMessage(input); }

  async function buildSummary(msgs: Message[]) {
    setTab("summary");
    try {
      const res  = await fetch("/api/summary", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversation: msgs, patientName, patientHistory }) });
      const data = await res.json();
      const raw  = data.summary || "";
      setSummary(raw);
      try { const match = raw.match(/\{[\s\S]*\}/); if (match) { const parsed = JSON.parse(match[0]); setSaveForm(f => ({ ...f, diagnosisName: parsed.chiefComplaint || "" })); } } catch { /* ignore */ }
    } catch { /* ignore */ }
  }

  async function handleSaveVisit() {
    setSaving(true);
    try {
      await fetch("/api/visits", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ patientId, dob, gender, ...saveForm }) });
      try { const cache = JSON.parse(localStorage.getItem("patient_data_cache") || "{}"); delete cache[patientId]; localStorage.setItem("patient_data_cache", JSON.stringify(cache)); } catch { /* ignore */ }
      try { localStorage.removeItem(`new_patient_${patientId}`); } catch { /* ignore */ }
      setSaved(true);
    } catch { /* ignore */ }
    setSaving(false);
  }

  const report          = extractReport(messages);
  const patientMsgCount = messages.filter(m => m.role === "user").length;
  const statusLabel     = done ? "Complete" : isSpeaking ? "Aria is speaking…" : isListening ? "Listening…" : thinking ? "Aria is thinking…" : "Ready";

  return (
    <div className="flex h-full gap-4 min-h-0">

      {/* ── LEFT: Chat ── */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col min-h-0 overflow-hidden">

        {/* Tab bar */}
        <div className="shrink-0 flex border-b border-slate-100">
          {(["interview", "summary"] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex items-center gap-1.5 px-5 py-3 text-xs font-semibold border-b-2 -mb-px transition-all capitalize ${
                tab === t ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600"
              }`}>
              {t === "interview" ? (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
              {t}
              {t === "summary" && summary && <span className="w-1.5 h-1.5 bg-teal-500 rounded-full" />}
            </button>
          ))}

          {/* Status — right side of tab bar */}
          <div className="ml-auto flex items-center gap-3 px-4">
            <div className="flex items-center gap-1.5">
              {thinking ? (
                <span className="flex gap-0.5 items-end h-3">
                  {[4,7,5,8].map((h,i) => <span key={i} className="w-0.5 bg-amber-400 rounded-full animate-bounce" style={{height:`${h}px`,animationDelay:`${i*80}ms`}} />)}
                </span>
              ) : isSpeaking ? (
                <span className="flex gap-0.5 items-end h-3">
                  {[4,8,5,9,6].map((h,i) => <span key={i} className="w-0.5 bg-blue-500 rounded-full animate-bounce" style={{height:`${h}px`,animationDelay:`${i*70}ms`}} />)}
                </span>
              ) : (
                <span className={`w-1.5 h-1.5 rounded-full ${done ? "bg-slate-300" : "bg-teal-500 animate-pulse"}`} />
              )}
              <span className={`text-xs font-medium ${thinking ? "text-amber-600" : isSpeaking ? "text-blue-600" : done ? "text-slate-400" : "text-slate-500"}`}>
                {statusLabel}
              </span>
            </div>
            {!done && (
              <button onClick={() => { stopListening(); setDone(true); buildSummary(messagesRef.current); }}
                className="text-xs text-slate-400 hover:text-red-500 border border-slate-200 hover:border-red-200 hover:bg-red-50 px-2.5 py-1 rounded-md transition font-medium">
                End
              </button>
            )}
          </div>
        </div>

        {/* ── INTERVIEW ── */}
        {tab === "interview" && (
          <>
            <div className="flex-1 overflow-y-auto flex flex-col gap-4 px-5 py-4 min-h-0">

              {thinking && messages.length === 0 && (
                <div className="flex gap-3 items-start">
                  <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5">A</div>
                  <div className="bg-slate-100 rounded-xl rounded-tl-sm px-4 py-3 flex gap-1 items-center">
                    {[0,1,2].map(i => <span key={i} className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{animationDelay:`${i*120}ms`}} />)}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} className={`flex gap-3 items-end ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 ${m.role === "user" ? "bg-slate-600" : "bg-blue-600"}`}>
                    {m.role === "user" ? patientName.charAt(0) : "A"}
                  </div>
                  <div className={`max-w-[75%] px-4 py-2.5 rounded-xl text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-blue-600 text-white rounded-br-sm"
                      : "bg-slate-100 text-slate-800 rounded-bl-sm"
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}

              {thinking && messages.length > 0 && (
                <div className="flex gap-3 items-start">
                  <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5">A</div>
                  <div className="bg-slate-100 rounded-xl rounded-tl-sm px-4 py-3 flex gap-1 items-center">
                    {[0,1,2].map(i => <span key={i} className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{animationDelay:`${i*120}ms`}} />)}
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {!done && (
              <div className="shrink-0 border-t border-slate-100 px-4 py-3 space-y-2 bg-slate-50">

                {voiceError && (
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  !((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) ? (
                    <p className="text-red-500 text-xs font-medium px-1 bg-red-50 border border-red-200 rounded-lg py-2 px-3">
                      Voice requires Chrome browser — please open this page in Chrome, or type your response below
                    </p>
                  ) : (
                    <p className="text-amber-600 text-xs font-medium px-1">Didn&apos;t catch that — please type your reply below</p>
                  )
                )}

                {liveText && (
                  <p className="text-slate-500 text-xs italic px-1">&ldquo;{liveText}&rdquo;</p>
                )}

                {/* Quick chips */}
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_RESPONSES.map(chip => (
                    <button key={chip} onClick={() => sendMessage(chip)}
                      className="text-xs text-slate-500 border border-slate-200 bg-white hover:bg-blue-600 hover:text-white hover:border-blue-600 px-3 py-1 rounded-full transition">
                      {chip}
                    </button>
                  ))}
                </div>

                {/* Input */}
                <div className={`flex items-center gap-2 bg-white border rounded-lg px-3 py-2 transition ${
                  isListening ? "border-teal-400 ring-2 ring-teal-100" : "border-slate-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100"
                }`}>
                  <button onClick={handleMicToggle}
                    className={`w-7 h-7 rounded-md flex items-center justify-center transition relative shrink-0 ${
                      isListening ? "bg-teal-500 text-white" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                    }`}>
                    {isListening && <span className="absolute inset-0 rounded-md bg-teal-400 animate-ping opacity-25" />}
                    <svg className="w-3.5 h-3.5 relative z-10" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1 1.93c-3.94-.49-7-3.85-7-7.93H2c0 4.97 3.58 9.09 8.25 9.87V22h3.5v-4.13C18.42 17.09 22 12.97 22 8h-2c0 4.08-3.06 7.44-7 7.93V16h-2v-.07z"/>
                    </svg>
                  </button>

                  <input ref={inputRef} type="text" value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                    placeholder={isListening ? "Listening… or type here" : "Type or speak your response"}
                    disabled={thinking}
                    className="flex-1 bg-transparent text-slate-800 text-sm outline-none placeholder:text-slate-400 disabled:opacity-50"
                  />

                  <button onClick={handleSend}
                    disabled={(!input.trim() && !isListening) || thinking}
                    className="w-7 h-7 rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-30 text-white flex items-center justify-center transition shrink-0">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {done && !summary && (
              <div className="shrink-0 border-t border-slate-100 px-5 py-3 flex items-center gap-2 bg-slate-50">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                <span className="text-slate-500 text-xs">Generating summary…</span>
              </div>
            )}
          </>
        )}

        {/* ── SUMMARY ── */}
        {tab === "summary" && (
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {!summary ? (
              <div className="flex items-center justify-center gap-2 py-16 text-slate-400 text-sm">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                Generating clinical summary…
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs bg-teal-50 text-teal-700 border border-teal-200 px-3 py-1 rounded-full font-medium">Consultation Complete</span>
                  <button onClick={() => { try { navigator.clipboard.writeText(summary); } catch { /* ignore */ } }}
                    className="text-xs text-slate-400 hover:text-slate-700 border border-slate-200 bg-white px-3 py-1 rounded-lg transition">
                    Copy
                  </button>
                </div>
                <SummaryCard raw={summary} />
                <button onClick={() => router.push("/today")}
                  className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm py-3 rounded-xl transition shadow-sm">
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

      {/* ── RIGHT: Live Report ── */}
      <div className="w-52 shrink-0 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">

        {/* Header */}
        <div className="shrink-0 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700">Live Report</span>
          {patientMsgCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />}
        </div>

        {/* Fields */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {[
            { label: "Chief Complaint", value: report.chiefComplaint, wide: true },
            { label: "Duration", value: report.duration },
            { label: "Pain Level", value: report.pain },
            { label: "Medications", value: report.medication },
          ].map(f => (
            <div key={f.label} className="px-4 py-3">
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mb-1">{f.label}</p>
              {f.value ? (
                <p className="text-slate-800 text-xs leading-relaxed capitalize">{f.value}</p>
              ) : (
                <div className="space-y-1">
                  <div className="h-1.5 bg-slate-100 rounded-full animate-pulse w-full" />
                  {f.wide && <div className="h-1.5 bg-slate-100 rounded-full animate-pulse w-2/3" />}
                </div>
              )}
            </div>
          ))}

          {/* Symptoms */}
          <div className="px-4 py-3">
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mb-1.5">Symptoms</p>
            {report.symptoms.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {report.symptoms.map(s => (
                  <span key={s} className="text-[10px] bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full capitalize">{s}</span>
                ))}
              </div>
            ) : (
              <div className="h-1.5 bg-slate-100 rounded-full animate-pulse w-1/2" />
            )}
          </div>

          {patientMsgCount > 0 && (
            <div className="px-4 py-3 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">Exchanges</span>
              <span className="text-[10px] font-bold text-slate-600 bg-slate-100 rounded-full px-2 py-0.5">{patientMsgCount}</span>
            </div>
          )}
        </div>

        {/* Save visit */}
        {done && (
          <div className="shrink-0 border-t border-slate-100 p-4 space-y-2 bg-slate-50">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
              {saved ? "Saved ✓" : "Save Visit"}
            </p>
            {!saved ? (
              <>
                <input value={saveForm.diagnosisName}
                  onChange={e => setSaveForm(f => ({ ...f, diagnosisName: e.target.value }))}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                  placeholder="Diagnosis" />
                <input value={saveForm.diagnosisCode}
                  onChange={e => setSaveForm(f => ({ ...f, diagnosisCode: e.target.value }))}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                  placeholder="ICD-10 code" />
                <input value={saveForm.providerName}
                  onChange={e => setSaveForm(f => ({ ...f, providerName: e.target.value }))}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                  placeholder="Dr. Name" />
                <select value={saveForm.patientClass}
                  onChange={e => setSaveForm(f => ({ ...f, patientClass: e.target.value }))}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-xs outline-none focus:border-blue-400">
                  <option>Outpatient</option><option>Inpatient</option><option>Emergency</option>
                </select>
                <button onClick={handleSaveVisit}
                  disabled={saving || !saveForm.diagnosisName.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-semibold py-2 rounded-lg transition">
                  {saving ? "Saving…" : "Save to Snowflake"}
                </button>
              </>
            ) : (
              <p className="text-teal-600 text-xs font-medium">Saved successfully ✓</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
