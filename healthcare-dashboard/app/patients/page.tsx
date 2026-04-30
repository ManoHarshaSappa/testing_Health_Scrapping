"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Patient { PATIENT_ID: string; NAME: string; USERNAME: string; VISIT_COUNT: number; }

const AVATAR_COLORS = [
  "bg-blue-600","bg-cyan-600","bg-violet-600","bg-sky-600",
  "bg-teal-600","bg-indigo-600","bg-blue-500","bg-cyan-500",
];

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const router = useRouter();

  useEffect(() => {
    fetch("/api/patients").then(r => r.json()).then(d => { setPatients(d.patients); setLoading(false); });
    const stored = JSON.parse(localStorage.getItem("visiting_patients") || "[]") as Patient[];
    setAdded(new Set(stored.map(p => p.PATIENT_ID)));
  }, []);

  function addToToday(e: React.MouseEvent, patient: Patient) {
    e.stopPropagation();
    const stored = JSON.parse(localStorage.getItem("visiting_patients") || "[]") as Patient[];
    if (!stored.find(p => p.PATIENT_ID === patient.PATIENT_ID)) {
      localStorage.setItem("visiting_patients", JSON.stringify([...stored, { ...patient, addedAt: new Date().toISOString() }]));
    }
    setAdded(prev => new Set([...prev, patient.PATIENT_ID]));
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
            <p className="text-blue-400/50 text-sm mt-0.5">{patients.length} patients · click to view · press + to queue for today</p>
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
          {filtered.map((p, i) => (
            <div key={p.PATIENT_ID} onClick={() => router.push(`/patient/${p.PATIENT_ID}`)}
              className="bg-[#0d1735] rounded-2xl p-4 cursor-pointer border border-[#1a2f5a] hover:border-blue-600/50 hover:bg-[#122040] transition-all group relative">
              {/* Add button */}
              <button onClick={e => addToToday(e, p)}
                className={`absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
                  added.has(p.PATIENT_ID)
                    ? "bg-emerald-900/40 text-emerald-400 border border-emerald-700/50"
                    : "bg-[#05091a] text-blue-500/60 border border-[#1a2f5a] hover:bg-blue-600 hover:text-white hover:border-blue-600"
                }`}>
                {added.has(p.PATIENT_ID) ? "✓" : "+"}
              </button>
              {/* Avatar */}
              <div className={`w-11 h-11 rounded-full ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-white text-base font-bold mb-3 shadow-lg`}>
                {p.NAME.charAt(0)}
              </div>
              <p className="font-semibold text-white text-sm leading-tight pr-8">{p.NAME}</p>
              <p className="text-blue-500/50 text-xs mt-0.5 font-mono">{p.PATIENT_ID}</p>
              <p className="text-blue-400 text-xs mt-2 font-medium">{p.VISIT_COUNT} visit{p.VISIT_COUNT !== 1 ? "s" : ""}</p>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-blue-400/40 text-center mt-20">No patients found.</p>
        )}
      </div>
    </main>
  );
}
