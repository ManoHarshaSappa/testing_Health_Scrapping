"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ChatAgent from "@/components/ChatAgent";

interface Patient { PATIENT_ID: string; NAME: string; USERNAME: string; VISIT_COUNT: number; }
interface Visit {
  VISIT_ID: string; VISIT_DATE: string; PROVIDER_NAME: string; FACILITY: string;
  PATIENT_CLASS: string; DIAGNOSIS_CODE: string; DIAGNOSIS_NAME: string; GENDER: string; DOB: string;
}

const classBadge: Record<string, string> = {
  Outpatient: "bg-blue-900/40 text-blue-300 border-blue-700/50",
  Inpatient:  "bg-violet-900/40 text-violet-300 border-violet-700/50",
  Emergency:  "bg-red-900/40 text-red-300 border-red-700/50",
};
const AVATAR_COLORS = ["bg-blue-500","bg-cyan-500","bg-violet-500","bg-sky-500","bg-indigo-500","bg-teal-500"];

function buildHistoryText(visits: Visit[]) {
  // Facility name intentionally excluded — Aria must not mention clinic names
  return visits.map(v =>
    `${v.VISIT_DATE}: [${v.DIAGNOSIS_CODE}] ${v.DIAGNOSIS_NAME} — ${v.PATIENT_CLASS} with Dr. ${v.PROVIDER_NAME}`
  ).join("\n");
}

export default function PatientPage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const [patient, setPatient]     = useState<Patient | null>(null);
  const [visits, setVisits]       = useState<Visit[]>([]);
  const [historyText, setHistory] = useState("");
  const [loading, setLoading]     = useState(true);
  const [fromCache, setFromCache] = useState(false);
  const [consulting, setConsulting] = useState(false);

  useEffect(() => {
    // ── 1. Try cache first (instant, no Snowflake wait) ──────────────────
    try {
      const cache = JSON.parse(localStorage.getItem("patient_data_cache") || "{}");
      if (cache[id]) {
        const c = cache[id];
        setPatient(c.patient);
        setVisits(c.visits);
        setHistory(c.historyText || buildHistoryText(c.visits));
        setFromCache(true);
        setLoading(false);
        return;
      }
    } catch { /* fall through to Snowflake */ }

    // ── 2. Not cached — fetch from Snowflake and cache it ────────────────
    fetch(`/api/patient/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.patient && d.visits) {
          const ht = buildHistoryText(d.visits);
          setPatient(d.patient);
          setVisits(d.visits);
          setHistory(ht);
          // save to cache for next time
          try {
            const all = JSON.parse(localStorage.getItem("patient_data_cache") || "{}");
            all[id] = { patient: d.patient, visits: d.visits, historyText: ht, cachedAt: new Date().toISOString() };
            localStorage.setItem("patient_data_cache", JSON.stringify(all));
          } catch { /* ignore */ }
        }
        setLoading(false);
      });
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#05091a]">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-blue-400 text-sm">Loading patient data from Snowflake...</p>
      </div>
    </div>
  );

  if (!patient) return (
    <div className="min-h-screen flex items-center justify-center bg-[#05091a]">
      <p className="text-blue-400">Patient not found.</p>
    </div>
  );

  const colorIdx = patient.PATIENT_ID.charCodeAt(patient.PATIENT_ID.length - 1) % AVATAR_COLORS.length;
  const dob      = visits[0]?.DOB ?? "—";
  const gender   = visits[0]?.GENDER === "M" ? "Male" : visits[0]?.GENDER === "F" ? "Female" : "—";

  return (
    <main className="min-h-screen bg-[#05091a]">
      {/* Top bar */}
      <div className="px-8 py-3 flex items-center justify-between bg-[#080e24] border-b border-[#1a2f5a]">
        <button onClick={() => router.back()}
          className="text-blue-400 hover:text-white text-sm flex items-center gap-2 transition">
          ← Back
        </button>
        <div className="flex items-center gap-3">
          {/* Cache badge */}
          {fromCache && (
            <div className="flex items-center gap-1.5 bg-emerald-900/20 border border-emerald-700/40 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-emerald-300 text-xs">History pre-loaded</span>
            </div>
          )}
          <span className="text-blue-500/60 text-xs font-mono">{patient.PATIENT_ID}</span>
          {!consulting && (
            <button onClick={() => setConsulting(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-lg font-medium transition shadow-lg shadow-blue-900/40">
              Start Consultation
            </button>
          )}
        </div>
      </div>

      <div className="flex h-[calc(100vh-105px)]">
        {/* Left panel — patient info + history */}
        <div className="w-80 shrink-0 border-r border-[#1a2f5a] overflow-y-auto bg-[#080e24] flex flex-col">

          {/* Patient card */}
          <div className="p-6 border-b border-[#1a2f5a]">
            <div className={`w-14 h-14 rounded-full ${AVATAR_COLORS[colorIdx]} flex items-center justify-center text-xl font-bold text-white mb-4 shadow-lg`}>
              {patient.NAME.charAt(0)}
            </div>
            <h1 className="text-lg font-bold text-white leading-tight">{patient.NAME}</h1>
            <p className="text-blue-400/60 text-xs mt-1 font-mono">{patient.PATIENT_ID}</p>
            <div className="mt-4 space-y-2.5">
              {[
                { label: "Date of Birth", value: dob },
                { label: "Gender",        value: gender },
                { label: "Total Visits",  value: String(patient.VISIT_COUNT) },
              ].map(r => (
                <div key={r.label} className="flex justify-between items-center">
                  <span className="text-blue-400/70 text-xs">{r.label}</span>
                  <span className="text-blue-100 font-medium text-xs">{r.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Visit history timeline */}
          <div className="p-6 flex-1">
            <h2 className="text-xs font-semibold text-blue-500/70 uppercase tracking-widest mb-5">Visit History</h2>
            {visits.length === 0 ? (
              <p className="text-blue-400/50 text-sm">No prior visits.</p>
            ) : (
              <div className="relative">
                <div className="absolute left-2 top-0 bottom-0 w-px bg-[#1a2f5a]" />
                <div className="space-y-5">
                  {visits.map(v => (
                    <div key={v.VISIT_ID} className="pl-7 relative">
                      <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-[#1a2f5a] bg-[#080e24] flex items-center justify-center">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          v.PATIENT_CLASS === "Emergency" ? "bg-red-400" :
                          v.PATIENT_CLASS === "Inpatient" ? "bg-violet-400" : "bg-blue-400"
                        }`} />
                      </div>
                      <p className="text-blue-500/60 text-xs mb-0.5">{v.VISIT_DATE}</p>
                      <p className="text-blue-100 text-xs font-medium leading-snug">{v.DIAGNOSIS_NAME}</p>
                      <p className="text-blue-500/50 text-xs mt-0.5">{v.DIAGNOSIS_CODE} · {v.PATIENT_CLASS}</p>
                      <span className={`inline-block mt-1.5 text-xs px-2.5 py-0.5 rounded-full border ${classBadge[v.PATIENT_CLASS] ?? "bg-blue-900/30 text-blue-300 border-blue-700/40"}`}>
                        Dr. {v.PROVIDER_NAME}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right panel — consultation */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#05091a]">
          {consulting ? (
            <div className="flex-1 flex flex-col p-8 overflow-hidden">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-white font-semibold text-base">Today&apos;s Consultation</h2>
                  <p className="text-blue-400/60 text-xs mt-0.5">Aria is speaking with {patient.NAME}</p>
                </div>
                <div className="flex items-center gap-2">
                  {fromCache && (
                    <span className="text-emerald-400/60 text-xs">History pre-loaded ✓</span>
                  )}
                  <div className="flex items-center gap-1.5 bg-[#0d1b3e] border border-[#1a2f5a] rounded-full px-3 py-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                    <span className="text-blue-300 text-xs font-medium">Live</span>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <ChatAgent
                  patientName={patient.NAME}
                  patientHistory={historyText || "No prior history on record."}
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
              <div className="relative mb-8">
                <div className="w-24 h-24 rounded-full border border-[#1a2f5a] bg-[#0d1735] flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full border border-blue-800/50 bg-[#0a1428] flex items-center justify-center">
                    <svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                </div>
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-600/30 border border-blue-500/40 animate-ping" />
              </div>

              {/* Data ready confirmation */}
              {fromCache && (
                <div className="flex items-center gap-2 bg-emerald-900/20 border border-emerald-700/40 rounded-xl px-5 py-3 mb-6">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                  <div className="text-left">
                    <p className="text-emerald-300 text-sm font-semibold">Patient history loaded</p>
                    <p className="text-emerald-400/60 text-xs mt-0.5">{visits.length} visits · Aria is ready to begin</p>
                  </div>
                </div>
              )}

              <p className="text-blue-200 text-base font-semibold mb-1">Ready for Consultation</p>
              <p className="text-blue-400/60 text-sm mb-8 max-w-xs">
                Aria will greet {patient.NAME} and collect their symptoms using their full medical history.
              </p>
              <button onClick={() => setConsulting(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-8 py-3 rounded-xl font-semibold transition shadow-xl shadow-blue-900/50">
                Start Consultation
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
