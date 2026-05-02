"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface VisitingPatient {
  PATIENT_ID: string;
  NAME: string;
  VISIT_COUNT: number;
  addedAt: string;
}

const STATUS_STYLES = [
  "bg-amber-50 text-amber-700 border border-amber-300 font-semibold",
  "bg-blue-600 text-white border border-blue-600 font-semibold shadow-sm",
  "bg-emerald-600 text-white border border-emerald-600 font-semibold shadow-sm",
];
const STATUS_LABELS = ["Waiting", "In Progress", "Completed"];
const AVATAR_COLORS = [
  "bg-blue-600","bg-cyan-600","bg-violet-600","bg-sky-600",
  "bg-teal-600","bg-indigo-600","bg-blue-500","bg-cyan-500",
];

export default function TodayPage() {
  const [patients, setPatients]   = useState<VisitingPatient[]>([]);
  const [statuses, setStatuses]   = useState<Record<string, number>>({});
  const [readyIds, setReadyIds]   = useState<Set<string>>(new Set());
  const router = useRouter();

  useEffect(() => {
    const stored         = JSON.parse(localStorage.getItem("visiting_patients") || "[]") as VisitingPatient[];
    const storedStatuses = JSON.parse(localStorage.getItem("visit_statuses") || "{}") as Record<string, number>;
    setPatients(stored);
    setStatuses(storedStatuses);
    checkReady(stored.map(p => p.PATIENT_ID));
    const cache = JSON.parse(localStorage.getItem("patient_data_cache") || "{}");
    stored.forEach(p => { if (!cache[p.PATIENT_ID]) prefetchPatient(p.PATIENT_ID); });
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      const stored = JSON.parse(localStorage.getItem("visiting_patients") || "[]") as VisitingPatient[];
      checkReady(stored.map(p => p.PATIENT_ID));
      const cache = JSON.parse(localStorage.getItem("patient_data_cache") || "{}");
      stored.forEach(p => { if (!cache[p.PATIENT_ID]) prefetchPatient(p.PATIENT_ID); });
    }, 2000);
    return () => clearInterval(t);
  }, []);

  function checkReady(ids: string[]) {
    try {
      const cache = JSON.parse(localStorage.getItem("patient_data_cache") || "{}");
      setReadyIds(new Set(ids.filter(id => !!cache[id])));
    } catch { /* ignore */ }
  }

  async function prefetchPatient(id: string) {
    try {
      const res  = await fetch(`/api/patient/${id}`);
      const data = await res.json();
      if (data.patient && data.visits) {
        const historyText = data.visits.map((v: {VISIT_DATE:string;DIAGNOSIS_CODE:string;DIAGNOSIS_NAME:string;PATIENT_CLASS:string;PROVIDER_NAME:string}) =>
          `${v.VISIT_DATE}: [${v.DIAGNOSIS_CODE}] ${v.DIAGNOSIS_NAME} — ${v.PATIENT_CLASS} with Dr. ${v.PROVIDER_NAME}`
        ).join("\n");
        const all = JSON.parse(localStorage.getItem("patient_data_cache") || "{}");
        all[id] = { patient: data.patient, visits: data.visits, historyText, cachedAt: new Date().toISOString() };
        localStorage.setItem("patient_data_cache", JSON.stringify(all));
        setReadyIds(prev => new Set([...prev, id]));
      }
    } catch { /* silent */ }
  }

  function remove(patientId: string) {
    const updated = patients.filter(p => p.PATIENT_ID !== patientId);
    setPatients(updated);
    localStorage.setItem("visiting_patients", JSON.stringify(updated));
  }

  function clearAll() {
    setPatients([]);
    localStorage.removeItem("visiting_patients");
    localStorage.removeItem("visit_statuses");
  }

  function cycleStatus(patientId: string) {
    const next    = ((statuses[patientId] ?? 0) + 1) % 3;
    const updated = { ...statuses, [patientId]: next };
    setStatuses(updated);
    localStorage.setItem("visit_statuses", JSON.stringify(updated));
  }

  const today   = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const waiting = patients.filter(p => (statuses[p.PATIENT_ID] ?? 0) === 0).length;
  const allReady = patients.length > 0 && patients.every(p => readyIds.has(p.PATIENT_ID));

  return (
    <main className="px-8 py-10 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Today&apos;s Visit Queue</h1>
            <p className="text-slate-400 text-sm mt-1">{today}</p>
          </div>
          <div className="flex items-center gap-3">
            {patients.length > 0 && allReady && (
              <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-emerald-700 text-xs font-medium">All data ready</span>
              </div>
            )}
            {patients.length > 0 && !allReady && (
              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-amber-700 text-xs font-medium">Loading patient data...</span>
              </div>
            )}
            {patients.length > 0 && (
              <button onClick={clearAll}
                className="text-sm text-red-500 hover:text-red-600 transition border border-red-200 hover:border-red-300 bg-white px-3 py-1.5 rounded-lg shadow-sm">
                Clear Queue
              </button>
            )}
          </div>
        </div>

        {/* Stats bar */}
        {patients.length > 0 && (
          <div className="flex items-center gap-3 mb-8 bg-slate-100 rounded-2xl p-1.5">
            {[
              { label: "Waiting",     color: "text-amber-600",   dot: "bg-amber-400" },
              { label: "In Progress", color: "text-blue-600",    dot: "bg-blue-500"  },
              { label: "Completed",   color: "text-emerald-600", dot: "bg-emerald-500" },
            ].map((item, i) => {
              const count = patients.filter(p => (statuses[p.PATIENT_ID] ?? 0) === i).length;
              return (
                <div key={item.label} className="flex-1 bg-white rounded-xl p-4 text-center shadow-sm border border-slate-100">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <span className={`w-2 h-2 rounded-full ${item.dot}`} />
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${item.color}`}>{item.label}</p>
                  </div>
                  <p className="text-3xl font-bold text-slate-900">{count}</p>
                </div>
              );
            })}
          </div>
        )}

        {patients.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-slate-300 rounded-2xl bg-white">
            <p className="text-slate-600 text-base mb-2">No patients in queue</p>
            <p className="text-slate-400 text-sm mb-7">Go to Patients and press + to add patients for today</p>
            <button onClick={() => router.push("/patients")}
              className="bg-blue-700 hover:bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition shadow-sm">
              Go to Patients
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {patients.map((p, i) => {
              const time      = new Date(p.addedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
              const statusIdx = statuses[p.PATIENT_ID] ?? 0;
              const isReady   = readyIds.has(p.PATIENT_ID);

              return (
                <div key={p.PATIENT_ID}
                  className={`bg-white rounded-xl border shadow-sm transition-all ${
                    isReady ? "border-emerald-200 hover:border-emerald-300" : "border-slate-200 hover:border-blue-200"
                  }`}>
                  <div className="flex items-center gap-5 p-5">
                    {/* Queue number */}
                    <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-sm font-bold text-slate-400 shrink-0 font-mono">
                      {String(i + 1).padStart(2, "0")}
                    </div>

                    {/* Avatar */}
                    <div className={`w-11 h-11 rounded-full ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-base font-bold text-white shrink-0 shadow-sm`}>
                      {p.NAME.charAt(0)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900">{p.NAME}</p>
                      <p className="text-slate-400 text-xs mt-0.5 font-mono">
                        {p.PATIENT_ID} &nbsp;·&nbsp; Added {time} &nbsp;·&nbsp; {p.VISIT_COUNT} prior visit{p.VISIT_COUNT !== 1 ? "s" : ""}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        {isReady ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                            <span className="text-emerald-600 text-[11px] font-medium">Patient history loaded — ready for consultation</span>
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                            <span className="text-amber-600 text-[11px]">Loading patient history from Snowflake...</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Status badge */}
                    <button onClick={() => cycleStatus(p.PATIENT_ID)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-full transition ${STATUS_STYLES[statusIdx]}`}
                      title="Click to change status">
                      {STATUS_LABELS[statusIdx]}
                    </button>

                    {/* Start Consultation */}
                    <button
                      onClick={() => { cycleStatus(p.PATIENT_ID); router.push(`/patient/${p.PATIENT_ID}`); }}
                      disabled={!isReady}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition shrink-0 shadow-sm ${
                        isReady
                          ? "bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                          : "bg-slate-100 text-slate-400 border border-slate-200 cursor-wait"
                      }`}>
                      {isReady ? "Start Consultation" : "Preparing..."}
                    </button>

                    <button onClick={() => remove(p.PATIENT_ID)}
                      className="text-slate-300 hover:text-red-400 transition text-xl leading-none shrink-0">
                      ×
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {waiting > 0 && (
          <p className="text-slate-400 text-xs text-center mt-6">
            {waiting} patient{waiting !== 1 ? "s" : ""} still waiting
          </p>
        )}
      </div>
    </main>
  );
}
