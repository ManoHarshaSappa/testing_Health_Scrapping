"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Patient { PATIENT_ID: string; NAME: string; USERNAME: string; VISIT_COUNT: number; }
interface VisitingPatient extends Patient { addedAt: string; }
interface Visit {
  VISIT_ID: string; VISIT_DATE: string; PROVIDER_NAME: string; FACILITY: string;
  PATIENT_CLASS: string; DIAGNOSIS_CODE: string; DIAGNOSIS_NAME: string; GENDER: string; DOB: string;
}
interface PatientCache { patient: Patient; visits: Visit[]; historyText: string; cachedAt: string; }

const AVATAR_BG = ["bg-blue-600", "bg-teal-600", "bg-indigo-600", "bg-slate-600"];

const STATUS = [
  { label: "Waiting",     style: "bg-amber-50 text-amber-700 border border-amber-200" },
  { label: "In Progress", style: "bg-blue-50  text-blue-700  border border-blue-200"  },
  { label: "Done",        style: "bg-teal-50  text-teal-700  border border-teal-200"  },
];

function getCacheAll(): Record<string, PatientCache> {
  try { return JSON.parse(localStorage.getItem("patient_data_cache") || "{}"); } catch { return {}; }
}
function saveCache(id: string, data: PatientCache) {
  const all = getCacheAll(); all[id] = data;
  localStorage.setItem("patient_data_cache", JSON.stringify(all));
}

export default function PatientsPage() {
  const [patients, setPatients]       = useState<Patient[]>([]);
  const [queue, setQueue]             = useState<VisitingPatient[]>([]);
  const [statuses, setStatuses]       = useState<Record<string, number>>({});
  const [search, setSearch]           = useState("");
  const [loading, setLoading]         = useState(true);
  const [preparing, setPreparing]     = useState<Set<string>>(new Set());
  const [readyIds, setReadyIds]       = useState<Set<string>>(new Set());
  const router = useRouter();

  // Load everything on mount
  useEffect(() => {
    fetch("/api/patients").then(r => r.json()).then(d => { setPatients(d.patients); setLoading(false); });
    const stored  = JSON.parse(localStorage.getItem("visiting_patients") || "[]") as VisitingPatient[];
    const statMap = JSON.parse(localStorage.getItem("visit_statuses") || "{}") as Record<string, number>;
    setQueue(stored);
    setStatuses(statMap);
    setReadyIds(new Set(Object.keys(getCacheAll())));
    // Prefetch any queued patients not yet cached
    const cache = getCacheAll();
    stored.forEach(p => { if (!cache[p.PATIENT_ID]) prefetchPatient(p.PATIENT_ID); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function prefetchPatient(id: string) {
    setPreparing(prev => new Set([...prev, id]));
    try {
      const res  = await fetch(`/api/patient/${id}`);
      const data = await res.json();
      if (data.patient && data.visits) {
        const historyText = (data.visits as Visit[]).map((v: Visit) =>
          `${v.VISIT_DATE}: [${v.DIAGNOSIS_CODE}] ${v.DIAGNOSIS_NAME} — ${v.PATIENT_CLASS} with Dr. ${v.PROVIDER_NAME}`
        ).join("\n");
        saveCache(id, { patient: data.patient, visits: data.visits, historyText, cachedAt: new Date().toISOString() });
        setReadyIds(prev => new Set([...prev, id]));
      }
    } catch { /* silent */ }
    setPreparing(prev => { const s = new Set(prev); s.delete(id); return s; });
  }

  function addToQueue(e: React.MouseEvent, patient: Patient) {
    e.stopPropagation();
    if (queue.find(p => p.PATIENT_ID === patient.PATIENT_ID)) return;
    const entry: VisitingPatient = { ...patient, addedAt: new Date().toISOString() };
    const updated = [...queue, entry];
    setQueue(updated);
    localStorage.setItem("visiting_patients", JSON.stringify(updated));
    if (!readyIds.has(patient.PATIENT_ID) && !preparing.has(patient.PATIENT_ID)) {
      prefetchPatient(patient.PATIENT_ID);
    }
  }

  function removeFromQueue(patientId: string) {
    const updated = queue.filter(p => p.PATIENT_ID !== patientId);
    setQueue(updated);
    localStorage.setItem("visiting_patients", JSON.stringify(updated));
  }

  function clearQueue() {
    setQueue([]);
    setStatuses({});
    localStorage.removeItem("visiting_patients");
    localStorage.removeItem("visit_statuses");
  }

  function cycleStatus(patientId: string) {
    const next    = ((statuses[patientId] ?? 0) + 1) % 3;
    const updated = { ...statuses, [patientId]: next };
    setStatuses(updated);
    localStorage.setItem("visit_statuses", JSON.stringify(updated));
  }

  function startConsultation(patient: VisitingPatient) {
    // Mark In Progress
    const statusIdx = statuses[patient.PATIENT_ID] ?? 0;
    if (statusIdx === 0) cycleStatus(patient.PATIENT_ID);
    router.push(`/patient/${patient.PATIENT_ID}`);
  }

  const today    = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const inQueue  = new Set(queue.map(p => p.PATIENT_ID));
  const filtered = patients.filter(p =>
    p.NAME.toLowerCase().includes(search.toLowerCase()) ||
    p.PATIENT_ID.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-400 text-sm">Loading…</p>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-50">

      {/* ── Page header ── */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center gap-4">
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-slate-900">Patients</h1>
            <p className="text-slate-400 text-sm mt-0.5">{today}</p>
          </div>

          <div className="relative w-72">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Search patients…" value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition placeholder:text-slate-400" />
          </div>

          <button onClick={() => router.push("/patients/new")}
            className="flex items-center gap-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Patient
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-6 space-y-8">

        {/* ── TODAY'S QUEUE ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-700">Today&apos;s Queue</h2>
              {queue.length > 0 && (
                <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{queue.length}</span>
              )}
            </div>
            {queue.length > 0 && (
              <button onClick={clearQueue}
                className="text-xs text-slate-400 hover:text-red-500 transition">
                Clear all
              </button>
            )}
          </div>

          {queue.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-200 rounded-xl py-10 text-center">
              <p className="text-slate-400 text-sm mb-1">No patients queued for today</p>
              <p className="text-slate-300 text-xs">Press <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">+</span> on any patient below to add them</p>
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {queue.map((p, i) => {
                const statusIdx = statuses[p.PATIENT_ID] ?? 0;
                const isReady   = readyIds.has(p.PATIENT_ID);
                const isPrep    = preparing.has(p.PATIENT_ID);

                return (
                  <div key={p.PATIENT_ID}
                    className="bg-white border border-slate-200 rounded-xl p-4 w-52 shrink-0 flex flex-col gap-3 hover:border-slate-300 hover:shadow-sm transition">

                    {/* Top row: avatar + name + remove */}
                    <div className="flex items-start gap-2.5">
                      <div className={`w-9 h-9 rounded-full ${AVATAR_BG[i % AVATAR_BG.length]} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                        {p.NAME.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 text-sm truncate">{p.NAME}</p>
                        <p className="text-slate-400 text-[10px] font-mono">{p.PATIENT_ID}</p>
                      </div>
                      <button onClick={() => removeFromQueue(p.PATIENT_ID)}
                        className="text-slate-300 hover:text-red-400 transition text-lg leading-none shrink-0 mt-0.5">×</button>
                    </div>

                    {/* Status badge — clickable */}
                    <button onClick={() => cycleStatus(p.PATIENT_ID)}
                      className={`text-[10px] font-semibold px-2.5 py-1 rounded-full w-fit transition ${STATUS[statusIdx].style}`}>
                      {STATUS[statusIdx].label}
                    </button>

                    {/* Data status + action */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        {isPrep ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            <span className="text-amber-600 text-[10px]">Loading data…</span>
                          </>
                        ) : isReady ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                            <span className="text-teal-600 text-[10px] font-medium">Ready</span>
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                            <span className="text-slate-400 text-[10px]">Queued</span>
                          </>
                        )}
                      </div>

                      <button
                        onClick={() => startConsultation(p)}
                        disabled={!isReady}
                        className={`w-full py-2 rounded-lg text-xs font-semibold transition ${
                          isReady
                            ? "bg-blue-600 hover:bg-blue-700 text-white"
                            : "bg-slate-100 text-slate-400 cursor-not-allowed"
                        }`}>
                        {isReady ? "Start Conversation →" : "Preparing…"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── ALL PATIENTS ── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-sm font-semibold text-slate-700">All Patients</h2>
            <span className="text-slate-400 text-xs">{filtered.length} records</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filtered.map((p, i) => {
              const isAdded = inQueue.has(p.PATIENT_ID);
              const isPrep  = preparing.has(p.PATIENT_ID);
              const isReady = readyIds.has(p.PATIENT_ID);

              return (
                <div key={p.PATIENT_ID}
                  onClick={() => router.push(`/patient/${p.PATIENT_ID}`)}
                  className="bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md cursor-pointer transition-all duration-150 group relative">

                  {isAdded && <div className="h-0.5 bg-blue-500 rounded-t-xl" />}

                  <div className="p-4">
                    {/* Add / status button */}
                    <button
                      onClick={e => addToQueue(e, p)}
                      className={`absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center text-sm font-semibold transition-all ${
                        isPrep
                          ? "bg-slate-100 text-slate-300 cursor-wait"
                          : isReady && isAdded
                            ? "bg-teal-50 text-teal-600 border border-teal-200"
                            : isAdded
                              ? "bg-blue-50 text-blue-600 border border-blue-200"
                              : "text-slate-300 hover:bg-blue-600 hover:text-white border border-transparent hover:border-blue-600"
                      }`}>
                      {isPrep
                        ? <span className="w-3 h-3 border border-slate-300 border-t-transparent rounded-full animate-spin" />
                        : isReady && isAdded ? "✓" : "+"}
                    </button>

                    <div className={`w-10 h-10 rounded-full ${AVATAR_BG[i % AVATAR_BG.length]} flex items-center justify-center text-white text-sm font-bold mb-3`}>
                      {p.NAME.charAt(0)}
                    </div>

                    <p className="font-semibold text-slate-900 text-sm leading-snug pr-8 truncate">{p.NAME}</p>
                    <p className="text-slate-400 text-[11px] font-mono mt-0.5">{p.PATIENT_ID}</p>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-slate-400 text-xs">{p.VISIT_COUNT} visit{p.VISIT_COUNT !== 1 ? "s" : ""}</span>
                      {isAdded && !isPrep && (
                        <span className={`text-[10px] font-medium ${isReady ? "text-teal-600" : "text-blue-500"}`}>
                          {isReady ? "Ready" : "In queue"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <p className="text-slate-500 mb-1">No patients found</p>
              <p className="text-slate-400 text-sm">Try a different name or ID</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
