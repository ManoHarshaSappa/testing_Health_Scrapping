"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Patient { PATIENT_ID: string; NAME: string; USERNAME: string; VISIT_COUNT: number; }

interface PatientCache {
  patient: Patient;
  visits: Visit[];
  historyText: string;
  cachedAt: string;
}

interface Visit {
  VISIT_ID: string; VISIT_DATE: string; PROVIDER_NAME: string; FACILITY: string;
  PATIENT_CLASS: string; DIAGNOSIS_CODE: string; DIAGNOSIS_NAME: string; GENDER: string; DOB: string;
}

const AVATAR_COLORS = [
  "bg-blue-600","bg-cyan-600","bg-violet-600","bg-sky-600",
  "bg-teal-600","bg-indigo-600","bg-blue-500","bg-cyan-500",
];

function getCacheAll(): Record<string, PatientCache> {
  try { return JSON.parse(localStorage.getItem("patient_data_cache") || "{}"); } catch { return {}; }
}

function saveCache(id: string, data: PatientCache) {
  const all = getCacheAll();
  all[id] = data;
  localStorage.setItem("patient_data_cache", JSON.stringify(all));
}

export default function PatientsPage() {
  const [patients, setPatients]   = useState<Patient[]>([]);
  const [search, setSearch]       = useState("");
  const [loading, setLoading]     = useState(true);
  const [added, setAdded]         = useState<Set<string>>(new Set());
  const [preparing, setPreparing] = useState<Set<string>>(new Set());  // fetching Snowflake
  const [ready, setReady]         = useState<Set<string>>(new Set());  // data cached
  const router = useRouter();

  useEffect(() => {
    fetch("/api/patients").then(r => r.json()).then(d => { setPatients(d.patients); setLoading(false); });
    const stored = JSON.parse(localStorage.getItem("visiting_patients") || "[]") as Patient[];
    setAdded(new Set(stored.map(p => p.PATIENT_ID)));
    // mark already-cached patients as ready
    const cache = getCacheAll();
    setReady(new Set(Object.keys(cache)));
  }, []);

  async function prefetchPatient(id: string) {
    setPreparing(prev => new Set([...prev, id]));
    try {
      const res  = await fetch(`/api/patient/${id}`);
      const data = await res.json();
      if (data.patient && data.visits) {
        const historyText = (data.visits as Visit[]).map((v: Visit) =>
          `${v.VISIT_DATE}: [${v.DIAGNOSIS_CODE}] ${v.DIAGNOSIS_NAME} — ${v.PATIENT_CLASS} at ${v.FACILITY?.replace(/_/g, " ")} with Dr. ${v.PROVIDER_NAME}`
        ).join("\n");
        saveCache(id, { patient: data.patient, visits: data.visits, historyText, cachedAt: new Date().toISOString() });
        setReady(prev => new Set([...prev, id]));
      }
    } catch { /* silent — will fetch on demand instead */ }
    setPreparing(prev => { const s = new Set(prev); s.delete(id); return s; });
  }

  function addToToday(e: React.MouseEvent, patient: Patient) {
    e.stopPropagation();
    const stored = JSON.parse(localStorage.getItem("visiting_patients") || "[]") as Patient[];
    if (!stored.find(p => p.PATIENT_ID === patient.PATIENT_ID)) {
      localStorage.setItem("visiting_patients", JSON.stringify([...stored, { ...patient, addedAt: new Date().toISOString() }]));
    }
    setAdded(prev => new Set([...prev, patient.PATIENT_ID]));

    // pre-fetch full history from Snowflake immediately
    if (!ready.has(patient.PATIENT_ID) && !preparing.has(patient.PATIENT_ID)) {
      prefetchPatient(patient.PATIENT_ID);
    }
  }

  const filtered = patients.filter(p =>
    p.NAME.toLowerCase().includes(search.toLowerCase()) ||
    p.PATIENT_ID.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#05091a]">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-blue-400/60 text-sm">Loading patients from Snowflake...</p>
      </div>
    </div>
  );

  return (
    <main className="px-8 py-8 bg-[#05091a] min-h-screen">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">All Patients</h1>
            <p className="text-blue-400/50 text-sm mt-0.5">
              {patients.length} patients · click to view · press + to queue for today
            </p>
          </div>
          <div className="bg-[#0d1735] border border-[#1a2f5a] rounded-xl px-4 py-2 text-center">
            <p className="text-2xl font-bold text-blue-400">{added.size}</p>
            <p className="text-blue-500/50 text-xs">in queue</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <svg className="w-4 h-4 text-blue-500/50 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="Search by name or patient ID..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#0d1735] text-white rounded-xl pl-11 pr-5 py-3 outline-none border border-[#1a2f5a] focus:border-blue-600/60 focus:ring-2 focus:ring-blue-900/30 transition text-sm placeholder:text-blue-500/30"
          />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filtered.map((p, i) => {
            const isAdded     = added.has(p.PATIENT_ID);
            const isPreparing = preparing.has(p.PATIENT_ID);
            const isReady     = ready.has(p.PATIENT_ID);

            return (
              <div key={p.PATIENT_ID} onClick={() => router.push(`/patient/${p.PATIENT_ID}`)}
                className="bg-[#0d1735] rounded-2xl p-4 cursor-pointer border border-[#1a2f5a] hover:border-blue-600/50 hover:bg-[#122040] transition-all group relative">

                {/* Add / status button */}
                <button onClick={e => addToToday(e, p)}
                  className={`absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
                    isPreparing
                      ? "bg-amber-900/40 text-amber-400 border border-amber-700/50 cursor-wait"
                      : isReady && isAdded
                        ? "bg-emerald-900/40 text-emerald-400 border border-emerald-700/50"
                        : isAdded
                          ? "bg-blue-900/40 text-blue-400 border border-blue-700/50"
                          : "bg-[#05091a] text-blue-500/60 border border-[#1a2f5a] hover:bg-blue-600 hover:text-white hover:border-blue-600"
                  }`}>
                  {isPreparing ? (
                    <span className="w-3 h-3 border border-amber-400 border-t-transparent rounded-full animate-spin" />
                  ) : isReady && isAdded ? "✓" : "+"}
                </button>

                {/* Avatar */}
                <div className={`w-11 h-11 rounded-full ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-white text-base font-bold mb-3 shadow-lg`}>
                  {p.NAME.charAt(0)}
                </div>

                <p className="font-semibold text-white text-sm leading-tight pr-8">{p.NAME}</p>
                <span className="inline-block mt-1.5 bg-[#05091a] border border-[#1a2f5a] text-blue-400 text-[10px] font-mono px-1.5 py-0.5 rounded-md tracking-wide">
                  #{p.PATIENT_ID.slice(-4)}
                </span>
                <p className="text-blue-400/50 text-xs mt-1.5 font-medium">{p.VISIT_COUNT} visit{p.VISIT_COUNT !== 1 ? "s" : ""}</p>

                {/* Data ready badge */}
                {isReady && isAdded && (
                  <div className="mt-2 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-emerald-400/80 text-[10px] font-medium">Data ready</span>
                  </div>
                )}
                {isPreparing && (
                  <div className="mt-2 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-amber-400/80 text-[10px] font-medium">Loading history...</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <p className="text-blue-400/40 text-center mt-20">No patients found.</p>
        )}
      </div>
    </main>
  );
}
