"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ConsultationPanel from "@/components/ConsultationPanel";

interface Patient { PATIENT_ID: string; NAME: string; USERNAME: string; VISIT_COUNT: number; }
interface Visit {
  VISIT_ID: string; VISIT_DATE: string; PROVIDER_NAME: string; FACILITY: string;
  PATIENT_CLASS: string; DIAGNOSIS_CODE: string; DIAGNOSIS_NAME: string; GENDER: string; DOB: string;
}

const classDot: Record<string, string> = {
  Outpatient: "bg-blue-400",
  Inpatient:  "bg-violet-400",
  Emergency:  "bg-red-400",
};
const classPill: Record<string, string> = {
  Outpatient: "bg-blue-50 text-blue-700 border border-blue-200",
  Inpatient:  "bg-violet-50 text-violet-700 border border-violet-200",
  Emergency:  "bg-red-50 text-red-700 border border-red-200",
};

function buildHistoryText(visits: Visit[]) {
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
  const [newPatientInfo, setNewPatientInfo] = useState<{ dob: string; gender: string } | null>(null);

  useEffect(() => {
    try {
      const info = localStorage.getItem(`new_patient_${id}`);
      if (info) setNewPatientInfo(JSON.parse(info));
    } catch { /* ignore */ }

    try {
      const cache = JSON.parse(localStorage.getItem("patient_data_cache") || "{}");
      if (cache[id]) {
        const c = cache[id];
        setPatient(c.patient);
        setVisits(c.visits);
        setHistory(c.historyText || buildHistoryText(c.visits));
        setLoading(false);
        return;
      }
    } catch { /* fall through */ }

    fetch(`/api/patient/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.patient && d.visits) {
          const ht = buildHistoryText(d.visits);
          setPatient(d.patient);
          setVisits(d.visits);
          setHistory(ht);
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-400 text-sm">Loading patient data…</p>
      </div>
    </div>
  );

  if (!patient) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <p className="text-slate-400">Patient not found.</p>
    </div>
  );

  const dob     = visits[0]?.DOB ?? newPatientInfo?.dob ?? "—";
  const gender  = visits[0]?.GENDER === "M" ? "Male" : visits[0]?.GENDER === "F" ? "Female" : newPatientInfo?.gender === "M" ? "Male" : newPatientInfo?.gender === "F" ? "Female" : "—";
  const lastVisit = visits[0];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* Breadcrumb bar */}
      <div className="bg-white border-b border-slate-200 px-6 h-11 flex items-center gap-2 text-sm shrink-0">
        <button onClick={() => router.back()}
          className="text-slate-400 hover:text-slate-700 flex items-center gap-1.5 transition">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Patients
        </button>
        <span className="text-slate-300">/</span>
        <span className="text-slate-700 font-medium">{patient.NAME}</span>
        <span className="ml-auto text-slate-400 text-xs font-mono">{patient.PATIENT_ID}</span>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left sidebar — patient info */}
        <aside className="w-64 shrink-0 bg-white border-r border-slate-200 overflow-y-auto flex flex-col">

          {/* Patient identity */}
          <div className="px-5 py-5 border-b border-slate-100">
            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white text-lg font-bold mb-3">
              {patient.NAME.charAt(0)}
            </div>
            <h2 className="font-semibold text-slate-900 text-base leading-tight">{patient.NAME}</h2>
            <p className="text-slate-400 text-xs font-mono mt-0.5">{patient.PATIENT_ID}</p>
          </div>

          {/* Stats */}
          <div className="px-5 py-4 border-b border-slate-100 space-y-3">
            {[
              { label: "Date of Birth", value: dob },
              { label: "Gender",        value: gender },
              { label: "Total Visits",  value: String(patient.VISIT_COUNT) },
              { label: "Status",        value: "Active" },
            ].map(r => (
              <div key={r.label} className="flex items-center justify-between">
                <span className="text-slate-400 text-xs">{r.label}</span>
                <span className="text-slate-800 text-xs font-medium">{r.value}</span>
              </div>
            ))}
          </div>

          {/* Last visit */}
          {lastVisit && (
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-2">Last Visit</p>
              <p className="text-slate-800 text-sm font-medium leading-snug">{lastVisit.DIAGNOSIS_NAME}</p>
              <p className="text-slate-400 text-xs mt-0.5">{lastVisit.VISIT_DATE} · {lastVisit.DIAGNOSIS_CODE}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${classPill[lastVisit.PATIENT_CLASS] ?? "bg-blue-50 text-blue-700 border border-blue-200"}`}>
                  {lastVisit.PATIENT_CLASS}
                </span>
                <span className="text-slate-400 text-[10px]">Dr. {lastVisit.PROVIDER_NAME}</span>
              </div>
            </div>
          )}

          {/* Visit history */}
          <div className="px-5 py-4 flex-1">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-3">Visit History</p>
            {visits.length === 0 ? (
              <p className="text-slate-400 text-sm">No prior visits.</p>
            ) : (
              <div className="relative">
                <div className="absolute left-1.5 top-0 bottom-0 w-px bg-slate-100" />
                <div className="space-y-4">
                  {visits.map(v => (
                    <div key={v.VISIT_ID} className="pl-6 relative">
                      <div className="absolute left-0 top-1 w-3 h-3 rounded-full border-2 border-slate-200 bg-white flex items-center justify-center">
                        <span className={`w-1 h-1 rounded-full ${classDot[v.PATIENT_CLASS] ?? "bg-blue-400"}`} />
                      </div>
                      <p className="text-slate-400 text-[10px]">{v.VISIT_DATE}</p>
                      <p className="text-slate-700 text-xs font-medium leading-snug">{v.DIAGNOSIS_NAME}</p>
                      <p className="text-slate-400 text-[10px]">{v.DIAGNOSIS_CODE} · {v.PATIENT_CLASS}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main — consultation */}
        <div className="flex-1 flex flex-col overflow-hidden p-5">
          <ConsultationPanel
            patientName={patient.NAME}
            patientHistory={historyText || "No prior history on record."}
            patientId={patient.PATIENT_ID}
            dob={visits[0]?.DOB ?? newPatientInfo?.dob ?? ""}
            gender={visits[0]?.GENDER ?? newPatientInfo?.gender ?? ""}
          />
        </div>
      </div>
    </div>
  );
}
