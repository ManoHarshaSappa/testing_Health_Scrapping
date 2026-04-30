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
  "bg-amber-900/30 text-amber-300 border border-amber-700/40",
  "bg-blue-900/30 text-blue-300 border border-blue-700/40",
  "bg-emerald-900/30 text-emerald-300 border border-emerald-700/40",
];
const STATUS_LABELS = ["Waiting", "In Progress", "Completed"];
const AVATAR_COLORS = [
  "bg-blue-600","bg-cyan-600","bg-violet-600","bg-sky-600",
  "bg-teal-600","bg-indigo-600","bg-blue-500","bg-cyan-500",
];

export default function TodayPage() {
  const [patients, setPatients] = useState<VisitingPatient[]>([]);
  const [statuses, setStatuses] = useState<Record<string, number>>({});
  const router = useRouter();

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("visiting_patients") || "[]") as VisitingPatient[];
    const storedStatuses = JSON.parse(localStorage.getItem("visit_statuses") || "{}") as Record<string, number>;
    setPatients(stored);
    setStatuses(storedStatuses);
  }, []);

  function remove(patientId: string) {
    const updated = patients.filter((p) => p.PATIENT_ID !== patientId);
    setPatients(updated);
    localStorage.setItem("visiting_patients", JSON.stringify(updated));
  }

  function clearAll() {
    setPatients([]);
    localStorage.removeItem("visiting_patients");
    localStorage.removeItem("visit_statuses");
  }

  function cycleStatus(patientId: string) {
    const current = statuses[patientId] ?? 0;
    const next = (current + 1) % 3;
    const updated = { ...statuses, [patientId]: next };
    setStatuses(updated);
    localStorage.setItem("visit_statuses", JSON.stringify(updated));
  }

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const waiting = patients.filter((p) => (statuses[p.PATIENT_ID] ?? 0) === 0).length;

  return (
    <main className="px-8 py-10 bg-[#05091a] min-h-screen">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Today&apos;s Visit Queue</h1>
            <p className="text-blue-400/50 text-sm mt-1">{today}</p>
          </div>
          {patients.length > 0 && (
            <button onClick={clearAll}
              className="text-sm text-red-400/70 hover:text-red-300 transition border border-red-900/50 hover:border-red-700/60 px-3 py-1.5 rounded-lg">
              Clear Queue
            </button>
          )}
        </div>

        {/* Stats bar */}
        {patients.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {["Waiting", "In Progress", "Completed"].map((label, i) => {
              const count = patients.filter((p) => (statuses[p.PATIENT_ID] ?? 0) === i).length;
              return (
                <div key={label} className="bg-[#0d1735] rounded-xl p-4 text-center border border-[#1a2f5a]">
                  <p className="text-2xl font-bold text-white">{count}</p>
                  <p className="text-blue-400/50 text-xs mt-1">{label}</p>
                </div>
              );
            })}
          </div>
        )}

        {patients.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-[#1a2f5a] rounded-2xl bg-[#080e24]">
            <p className="text-blue-200/70 text-base mb-2">No patients in queue</p>
            <p className="text-blue-400/40 text-sm mb-7">Go to Patients and press + to add patients for today</p>
            <button onClick={() => router.push("/patients")}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition shadow-lg shadow-blue-900/40">
              Go to Patients
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {patients.map((p, i) => {
              const time = new Date(p.addedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
              const statusIdx = statuses[p.PATIENT_ID] ?? 0;
              return (
                <div key={p.PATIENT_ID}
                  className="bg-[#0d1735] rounded-xl border border-[#1a2f5a] hover:border-blue-700/50 transition-all">
                  <div className="flex items-center gap-5 p-5">
                    {/* Queue number */}
                    <div className="w-9 h-9 rounded-lg bg-[#080e24] border border-[#1a2f5a] flex items-center justify-center text-sm font-bold text-blue-400/60 shrink-0 font-mono">
                      {String(i + 1).padStart(2, "0")}
                    </div>

                    {/* Avatar */}
                    <div className={`w-11 h-11 rounded-full ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-base font-bold text-white shrink-0 shadow-lg`}>
                      {p.NAME.charAt(0)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white">{p.NAME}</p>
                      <p className="text-blue-400/50 text-xs mt-0.5 font-mono">
                        {p.PATIENT_ID} &nbsp;·&nbsp; Added {time} &nbsp;·&nbsp; {p.VISIT_COUNT} prior visit{p.VISIT_COUNT !== 1 ? "s" : ""}
                      </p>
                    </div>

                    {/* Status badge */}
                    <button onClick={() => cycleStatus(p.PATIENT_ID)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-full transition ${STATUS_STYLES[statusIdx]}`}
                      title="Click to change status">
                      {STATUS_LABELS[statusIdx]}
                    </button>

                    {/* Actions */}
                    <button onClick={() => router.push(`/patient/${p.PATIENT_ID}`)}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition shrink-0 shadow-lg shadow-blue-900/30">
                      Start Consultation
                    </button>
                    <button onClick={() => remove(p.PATIENT_ID)}
                      className="text-blue-500/30 hover:text-red-400 transition text-xl leading-none shrink-0">
                      ×
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {waiting > 0 && (
          <p className="text-blue-400/30 text-xs text-center mt-6">
            {waiting} patient{waiting !== 1 ? "s" : ""} still waiting
          </p>
        )}
      </div>
    </main>
  );
}
