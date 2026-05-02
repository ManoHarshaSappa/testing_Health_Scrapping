"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewPatientPage() {
  const router = useRouter();
  const [form, setForm]       = useState({ name: "", dob: "", gender: "M" });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.dob) { setError("Name and date of birth are required."); return; }
    setLoading(true);
    setError("");
    try {
      const res  = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.patientId) throw new Error(data.error || "Failed to create patient");
      try {
        localStorage.setItem(`new_patient_${data.patientId}`, JSON.stringify({ dob: form.dob, gender: form.gender }));
      } catch { /* ignore */ }
      router.push(`/patient/${data.patientId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top bar */}
      <div className="px-8 py-3 flex items-center bg-white border-b border-slate-200 shadow-sm">
        <button onClick={() => router.back()}
          className="text-slate-500 hover:text-slate-900 text-sm flex items-center gap-2 transition">
          ← Back
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">

          {/* Header */}
          <div className="mb-8 text-center">
            <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h1 className="text-slate-900 text-xl font-bold">New Patient Registration</h1>
            <p className="text-slate-400 text-sm mt-1">Enter patient details to create their record</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">

              {/* Full Name */}
              <div>
                <label className="text-xs text-slate-500 font-medium block mb-1.5">Full Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Sarah Johnson"
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition placeholder:text-slate-300"
                  autoFocus
                />
              </div>

              {/* Date of Birth */}
              <div>
                <label className="text-xs text-slate-500 font-medium block mb-1.5">Date of Birth <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  value={form.dob}
                  onChange={e => setForm(f => ({ ...f, dob: e.target.value }))}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="text-xs text-slate-500 font-medium block mb-2">Gender <span className="text-red-500">*</span></label>
                <div className="flex gap-3">
                  {[{ label: "Male", value: "M" }, { label: "Female", value: "F" }].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, gender: opt.value }))}
                      className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition ${
                        form.gender === opt.value
                          ? "bg-blue-50 border-blue-400 text-blue-700"
                          : "bg-white border-slate-200 text-slate-400 hover:border-blue-200 hover:text-blue-600"
                      }`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-xs text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-700 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition shadow-sm text-sm">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating patient...
                </span>
              ) : "Register Patient & Start Consultation"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
