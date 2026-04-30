"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  BarChart, Bar,
} from "recharts";

const COLORS = ["#3b82f6", "#22d3ee", "#f59e0b", "#10b981", "#f43f5e"];

interface Stats {
  byClass: { PATIENT_CLASS: string; COUNT: number }[];
  byDiagnosis: { DIAGNOSIS_NAME: string; COUNT: number }[];
  byMonth: { MONTH: string; COUNT: number }[];
  totals: { TOTAL_VISITS: number; TOTAL_PATIENTS: number };
}

const features = [
  { icon: "🗄️", title: "Data Pipeline", desc: "Raw HL7 files scraped from 200 patients, transformed via AWS Glue, and stored in Snowflake." },
  { icon: "📊", title: "Star Schema", desc: "dbt models build dim_patient, dim_provider, dim_date, and fact_visits for analytics." },
  { icon: "🎤", title: "Voice Agent", desc: "AI-powered intake assistant talks to patients, collects symptoms, and generates a doctor summary." },
  { icon: "☁️", title: "Cloud Native", desc: "Built on AWS Lambda, S3, Glue, Snowflake, and deployed on Vercel." },
];

const pipeline = ["GitHub Pages", "AWS Lambda", "S3 Raw", "AWS Glue", "S3 Staging", "Snowflake", "dbt", "Next.js + Vercel"];

const TOOLTIP_STYLE = {
  backgroundColor: "#0d1735",
  border: "1px solid #1a2f5a",
  borderRadius: "8px",
  color: "#bfdbfe",
};

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/stats").then((r) => r.json()).then(setStats);
  }, []);

  return (
    <main className="bg-[#05091a] text-white min-h-screen">

      {/* Hero */}
      <section className="px-8 py-28 text-center relative overflow-hidden">
        {/* Subtle radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#0d1b3e_0%,_#05091a_70%)] pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-700/40 text-blue-300 text-xs px-4 py-1.5 rounded-full mb-6 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Live on Vercel · Powered by Snowflake
          </div>
          <h1 className="text-5xl font-bold mb-4 tracking-tight text-white">
            CareIQ
          </h1>
          <p className="text-blue-200/60 text-lg max-w-xl mx-auto mb-10">
            End-to-end data engineering pipeline with AI voice consultation — built on AWS, Snowflake, and dbt.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/patients"
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3 rounded-xl transition shadow-xl shadow-blue-900/40">
              View Patients
            </Link>
            <Link href="/today"
              className="border border-[#1a2f5a] hover:border-blue-600/60 text-blue-300 hover:text-white font-semibold px-8 py-3 rounded-xl transition bg-[#080e24]">
              Today&apos;s Visits
            </Link>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <section className="px-8 pb-12 bg-[#05091a]">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Patients", value: stats?.totals.TOTAL_PATIENTS ?? "—", color: "text-blue-400" },
            { label: "Total Visits",   value: stats?.totals.TOTAL_VISITS   ?? "—", color: "text-cyan-400" },
            { label: "Diagnoses Tracked", value: stats ? stats.byDiagnosis.length + "+" : "—", color: "text-emerald-400" },
            { label: "Pipeline Layers", value: "5", color: "text-amber-400" },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-[#0d1735] rounded-2xl p-6 text-center border border-[#1a2f5a]">
              <p className={`text-4xl font-bold ${kpi.color}`}>{kpi.value}</p>
              <p className="text-blue-400/60 text-sm mt-2">{kpi.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Charts */}
      <section className="px-8 py-12 bg-[#080e24] border-y border-[#1a2f5a]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-xl font-bold mb-8 text-white tracking-tight">Analytics Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div className="bg-[#0d1735] rounded-2xl p-6 border border-[#1a2f5a]">
              <h3 className="font-semibold mb-4 text-blue-200 text-sm uppercase tracking-wider">Visits by Type</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={stats?.byClass} dataKey="COUNT" nameKey="PATIENT_CLASS" cx="50%" cy="50%" outerRadius={80}
                    label={({ PATIENT_CLASS, percent }: { PATIENT_CLASS?: string; percent?: number }) =>
                      `${PATIENT_CLASS ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={{ stroke: "#1a2f5a" }}>
                    {stats?.byClass.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-[#0d1735] rounded-2xl p-6 border border-[#1a2f5a]">
              <h3 className="font-semibold mb-4 text-blue-200 text-sm uppercase tracking-wider">Visits by Month</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={stats?.byMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a2f5a" />
                  <XAxis dataKey="MONTH" tick={{ fill: "#4a7ab5", fontSize: 10 }} axisLine={{ stroke: "#1a2f5a" }} tickLine={false} />
                  <YAxis tick={{ fill: "#4a7ab5" }} axisLine={{ stroke: "#1a2f5a" }} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Line type="monotone" dataKey="COUNT" stroke="#3b82f6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-[#0d1735] rounded-2xl p-6 border border-[#1a2f5a]">
            <h3 className="font-semibold mb-4 text-blue-200 text-sm uppercase tracking-wider">Top 10 Diagnoses</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats?.byDiagnosis} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1a2f5a" />
                <XAxis type="number" tick={{ fill: "#4a7ab5" }} axisLine={{ stroke: "#1a2f5a" }} tickLine={false} />
                <YAxis dataKey="DIAGNOSIS_NAME" type="category" tick={{ fill: "#93c5fd", fontSize: 11 }} width={230} axisLine={{ stroke: "#1a2f5a" }} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="COUNT" fill="#22d3ee" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-8 py-16 bg-[#05091a]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-xl font-bold mb-1 text-white tracking-tight">About This Project</h2>
          <p className="text-blue-400/50 mb-10 text-sm">A full end-to-end healthcare data engineering pipeline with AI capabilities.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f) => (
              <div key={f.title} className="bg-[#0d1735] rounded-2xl p-6 border border-[#1a2f5a] hover:border-blue-700/60 transition">
                <span className="text-2xl mb-3 block">{f.icon}</span>
                <h3 className="font-semibold text-white mb-2 text-sm">{f.title}</h3>
                <p className="text-blue-400/60 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pipeline */}
      <section className="px-8 py-14 bg-[#080e24] border-t border-[#1a2f5a] text-center">
        <h2 className="text-xl font-bold mb-8 text-white tracking-tight">Pipeline Architecture</h2>
        <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
          {pipeline.map((step, i, arr) => (
            <span key={step} className="flex items-center gap-2">
              <span className="bg-[#0d1735] border border-[#1a2f5a] text-blue-200 text-xs px-4 py-2 rounded-xl font-medium">{step}</span>
              {i < arr.length - 1 && <span className="text-blue-800">→</span>}
            </span>
          ))}
        </div>
      </section>

    </main>
  );
}
