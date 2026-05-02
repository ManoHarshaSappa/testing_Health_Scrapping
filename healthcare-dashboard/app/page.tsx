"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AreaChart, Area, PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";

interface Stats {
  byClass:     { PATIENT_CLASS: string; COUNT: number }[];
  byDiagnosis: { DIAGNOSIS_NAME: string; COUNT: number }[];
  byMonth:     { MONTH: string; COUNT: number }[];
  totals:      { TOTAL_VISITS: number; TOTAL_PATIENTS: number };
}

const CLASS_COLORS: Record<string, string> = {
  Outpatient: "#2563eb",
  Inpatient:  "#0d9488",
  Emergency:  "#e11d48",
};

const TOOLTIP_STYLE = {
  backgroundColor: "#0f172a",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "10px",
  color: "#f1f5f9",
  fontSize: "12px",
  boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
};

const pipeline = [
  "GitHub Pages",
  "AWS Lambda",
  "S3 Raw",
  "AWS Glue",
  "Snowflake",
  "dbt",
  "Next.js + Vercel",
];

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/stats").then(r => r.json()).then(d => { if (d && !d.error) setStats(d); });
  }, []);

  const kpis = [
    { label: "Total Patients",    value: stats?.totals?.TOTAL_PATIENTS ?? "—", sub: "Active records" },
    { label: "Total Visits",      value: stats?.totals?.TOTAL_VISITS   ?? "—", sub: "All time"       },
    { label: "Diagnoses Tracked", value: stats?.byDiagnosis?.length ? `${stats.byDiagnosis.length}+` : "—", sub: "Unique ICD codes" },
    { label: "Pipeline Layers",   value: "7",                                   sub: "Cloud services"  },
  ];

  return (
    <main className="bg-slate-50 min-h-screen">

      {/* ── HERO — dark navy ── */}
      <section className="bg-[#0f1d35] px-8 pt-20 pb-24 text-center relative overflow-hidden">
        {/* Subtle radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(13,148,136,0.12),transparent_70%)] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-teal-500/15 border border-teal-500/25 text-teal-300 text-xs px-4 py-2 rounded-full mb-10 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            Live on Vercel · Powered by Snowflake
          </div>

          <h1 className="text-8xl font-black text-white tracking-tight mb-5 leading-none">
            CareIQ
          </h1>
          <p className="text-white/50 text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
            End-to-end healthcare data engineering pipeline with AI-powered voice consultation,
            built on AWS, Snowflake, and dbt.
          </p>

          <Link href="/patients"
            className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white font-bold px-10 py-4 rounded-xl text-base transition shadow-2xl shadow-teal-500/20">
            Open Patients
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ── KPI CARDS ── */}
      <section className="px-8 -mt-8 relative z-10">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpis.map((k, i) => (
            <div key={k.label} className={`bg-white rounded-2xl p-6 border shadow-lg ${
              i === 0 ? "border-blue-100 shadow-blue-100/40" :
              i === 1 ? "border-teal-100 shadow-teal-100/40" :
              "border-slate-100 shadow-slate-100/40"
            }`}>
              <p className={`text-4xl font-black mb-1 ${
                i === 0 ? "text-blue-600" :
                i === 1 ? "text-teal-600" :
                "text-slate-800"
              }`}>{k.value}</p>
              <p className="text-slate-800 font-semibold text-sm">{k.label}</p>
              <p className="text-slate-400 text-xs mt-0.5">{k.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── ANALYTICS ── */}
      <section className="px-8 py-16">
        <div className="max-w-6xl mx-auto">

          <div className="mb-10">
            <h2 className="text-3xl font-bold text-slate-900">Analytics</h2>
            <p className="text-slate-400 mt-1">Real-time data from Snowflake</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">

            {/* Area chart — visits by month */}
            <div className="md:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Visits Over Time</p>
              <p className="text-2xl font-bold text-slate-900 mb-5">{stats?.totals?.TOTAL_VISITS ?? "—"} total</p>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={stats?.byMonth}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#2563eb" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="MONTH" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ stroke: "#2563eb", strokeWidth: 1, strokeDasharray: "4 4" }} />
                  <Area type="monotone" dataKey="COUNT" stroke="#2563eb" strokeWidth={2.5} fill="url(#areaGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Pie — visit types */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Visit Types</p>
              <p className="text-2xl font-bold text-slate-900 mb-4">Breakdown</p>
              <div className="flex-1 flex items-center justify-center">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={stats?.byClass} dataKey="COUNT" nameKey="PATIENT_CLASS"
                      cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3}>
                      {stats?.byClass.map((entry, i) => (
                        <Cell key={i} fill={CLASS_COLORS[entry.PATIENT_CLASS] ?? "#64748b"} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5 mt-2">
                {stats?.byClass.map(c => (
                  <div key={c.PATIENT_CLASS} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: CLASS_COLORS[c.PATIENT_CLASS] ?? "#64748b" }} />
                      <span className="text-slate-600 text-xs">{c.PATIENT_CLASS}</span>
                    </div>
                    <span className="text-slate-900 text-xs font-bold">{c.COUNT}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bar chart — top diagnoses */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Top Diagnoses</p>
            <p className="text-2xl font-bold text-slate-900 mb-6">Most Common Conditions</p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats?.byDiagnosis?.slice(0, 10)} layout="vertical" barSize={10}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="DIAGNOSIS_NAME" type="category" tick={{ fill: "#475569", fontSize: 11 }} width={220} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="COUNT" radius={[0, 6, 6, 0]}>
                  {stats?.byDiagnosis?.slice(0, 10).map((_, i) => (
                    <Cell key={i} fill={`hsl(${210 + i * 8}, 70%, ${48 - i * 2}%)`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="px-8 py-16 bg-[#0f1d35]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-2">Built end-to-end</h2>
          <p className="text-white/40 mb-10">Every layer from raw data to AI voice consultation.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: "Data Pipeline",
                desc: "Raw HL7 files scraped from 200 patients, transformed via AWS Glue, stored in Snowflake.",
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 7h16M4 12h16M4 17h16" />
                  </svg>
                ),
                accent: "bg-blue-500/15 text-blue-400 border-blue-500/20",
              },
              {
                title: "Star Schema",
                desc: "dbt models build dim_patient, dim_provider, dim_date, and fact_visits for analytics.",
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                ),
                accent: "bg-teal-500/15 text-teal-400 border-teal-500/20",
              },
              {
                title: "Voice Agent",
                desc: "AI intake assistant talks to patients, collects symptoms, and generates a clinical summary.",
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                ),
                accent: "bg-violet-500/15 text-violet-400 border-violet-500/20",
              },
              {
                title: "Cloud Native",
                desc: "Built on AWS Lambda, S3, Glue, Snowflake, and deployed on Vercel.",
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
                ),
                accent: "bg-sky-500/15 text-sky-400 border-sky-500/20",
              },
            ].map(f => (
              <div key={f.title} className="bg-white/5 border border-white/8 rounded-2xl p-6 hover:bg-white/8 transition">
                <div className={`w-11 h-11 rounded-xl border flex items-center justify-center mb-4 ${f.accent}`}>
                  {f.icon}
                </div>
                <h3 className="font-bold text-white text-base mb-2">{f.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PIPELINE ── */}
      <section className="px-8 py-16 bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Pipeline Architecture</h2>
          <p className="text-slate-400 mb-10">Data flows end-to-end through 7 layers</p>

          <div className="flex flex-wrap items-center gap-0">
            {pipeline.map((step, i) => (
              <div key={step} className="flex items-center">
                <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition group">
                  <span className="text-[10px] font-bold text-slate-400 font-mono tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-700 whitespace-nowrap">{step}</span>
                </div>
                {i < pipeline.length - 1 && (
                  <svg className="w-4 h-4 text-slate-300 mx-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT / CONTACT ── */}
      <section id="contact" className="bg-[#0f1d35] px-8 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

            {/* Left — About */}
            <div>
              <p className="text-teal-400 text-xs font-bold uppercase tracking-widest mb-4">Built by</p>
              <h2 className="text-4xl font-black text-white mb-4 leading-tight">
                Mano Harsha Sappa
              </h2>
              <p className="text-white/50 text-base leading-relaxed mb-8">
                Data engineer passionate about building end-to-end data systems, cloud infrastructure,
                and AI-powered applications. CareIQ is a full-stack healthcare pipeline
                from raw HL7 data ingestion to a voice AI consultation interface.
              </p>

              <div className="space-y-3">
                {[
                  {
                    label: "GitHub",
                    sub: "github.com/ManoHarshaSappa",
                    href: "https://github.com/ManoHarshaSappa",
                    icon: (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                      </svg>
                    ),
                  },
                  {
                    label: "LinkedIn",
                    sub: "linkedin.com/in/manoharshasappa",
                    href: "https://www.linkedin.com/in/manoharshasappa/",
                    icon: (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                    ),
                  },
                  {
                    label: "Portfolio",
                    sub: "manoharshasappa.github.io",
                    href: "https://manoharshasappa.github.io/portfolio_ManoHarshaSappa/",
                    icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                    ),
                  },
                ].map(link => (
                  <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-4 bg-white/5 hover:bg-white/10 border border-white/8 hover:border-white/20 rounded-xl px-5 py-3.5 transition group">
                    <span className="text-white/50 group-hover:text-teal-400 transition shrink-0">{link.icon}</span>
                    <div>
                      <p className="text-white font-semibold text-sm">{link.label}</p>
                      <p className="text-white/40 text-xs">{link.sub}</p>
                    </div>
                    <svg className="w-4 h-4 text-white/20 group-hover:text-white/50 ml-auto transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                ))}
              </div>
            </div>

            {/* Right — Contact */}
            <div className="lg:pt-10">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                <p className="text-teal-400 text-xs font-bold uppercase tracking-widest mb-3">Let&apos;s build together</p>
                <h3 className="text-2xl font-bold text-white mb-3">Got an idea?</h3>
                <p className="text-white/40 text-sm leading-relaxed mb-8">
                  Open to data engineering roles, freelance projects, and collaborations.
                  Reach out, always happy to talk about data, AI, and healthcare tech.
                </p>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-white/50 text-sm">
                    <svg className="w-4 h-4 text-teal-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    sappamanoharsha@gmail.com
                  </div>
                  <div className="flex items-center gap-3 text-white/50 text-sm">
                    <svg className="w-4 h-4 text-teal-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Available remotely · Open to relocation
                  </div>
                </div>

                <a href="mailto:sappamanoharsha@gmail.com"
                  className="mt-8 flex items-center justify-center gap-2 w-full bg-teal-500 hover:bg-teal-400 text-white font-bold py-3.5 rounded-xl transition shadow-xl shadow-teal-500/20 text-sm">
                  Send a message
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
              </div>

              {/* Tech stack tags */}
              <div className="mt-6">
                <p className="text-white/25 text-xs uppercase tracking-widest mb-3 font-semibold">Stack</p>
                <div className="flex flex-wrap gap-2">
                  {["Python","AWS Lambda","S3","Glue","Snowflake","dbt","Next.js","TypeScript","Gemini AI","Vercel"].map(t => (
                    <span key={t} className="text-[11px] font-medium text-white/50 border border-white/10 bg-white/5 px-3 py-1 rounded-full">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
