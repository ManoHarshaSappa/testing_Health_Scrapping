export default function About() {
  const journey = [
    {
      who: "Patient",
      step: "Books an appointment",
      detail:
        "The patient calls the clinic or books online and gets a date and time. Before they even walk in, nothing about their current condition is captured.",
    },
    {
      who: "Front Desk",
      step: "Patient arrives and fills out a paper form",
      detail:
        "On arrival, the patient sits in the waiting area and manually fills out a form listing their symptoms, allergies, current medications, and reason for visit. This takes time and is error-prone.",
    },
    {
      who: "Doctor",
      step: "Doctor reads the form, then talks to the patient",
      detail:
        "The doctor reviews the handwritten form, walks into the room, and asks many of the same questions again. They listen, observe, and take notes throughout the consultation.",
    },
    {
      who: "Doctor",
      step: "Returns to office and manually enters data into HL7",
      detail:
        "After the visit, the doctor goes back to their desk and types all the clinical details into the hospital system in HL7 format. This can take 10 to 20 minutes per patient.",
    },
    {
      who: "Patient",
      step: "Gets a follow-up appointment for treatment",
      detail:
        "The doctor reviews everything and schedules the next appointment for actual treatment. The patient leaves without receiving treatment on the first visit.",
    },
  ];

  return (
    <main className="bg-slate-50 min-h-screen">

      {/* Hero */}
      <section className="bg-[#0f1d35] px-8 pt-16 pb-20 text-center">
        <div className="max-w-3xl mx-auto">
          <p className="text-teal-400 text-xs font-bold uppercase tracking-widest mb-4">About CareIQ</p>
          <h1 className="text-5xl font-black text-white mb-5 leading-tight">
            Why this was built
          </h1>
          <p className="text-white/50 text-lg leading-relaxed">
            CareIQ was built to fix a broken clinical workflow that wastes hours every day
            and delays the care patients actually need.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-8 py-16 space-y-16">

        {/* The real workflow */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">What happens inside a hospital today</h2>
          <p className="text-slate-500 mb-10 text-sm">
            This is the real flow a patient goes through from the moment they book an appointment
            to the moment they receive treatment.
          </p>

          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-200" />
            <div className="space-y-0">
              {journey.map((item, i) => (
                <div key={i} className="relative pl-14 pb-10 last:pb-0">
                  <div className="absolute left-0 w-10 h-10 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center text-slate-500 font-bold text-sm shadow-sm">
                    {i + 1}
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-teal-600 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-full">
                      {item.who}
                    </span>
                    <p className="font-semibold text-slate-800 mt-2 mb-1">{item.step}</p>
                    <p className="text-slate-500 text-sm leading-relaxed">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="border-t border-slate-200" />

        {/* The core insight */}
        <section>
          <div className="bg-[#0f1d35] rounded-2xl p-8 text-white">
            <p className="text-teal-400 text-xs font-bold uppercase tracking-widest mb-4">The core insight</p>
            <h2 className="text-2xl font-bold mb-4 leading-snug">
              On the first visit, the patient should get treatment. Not paperwork.
            </h2>
            <p className="text-white/60 leading-relaxed mb-4">
              Think about it. The patient books an appointment, travels to the clinic, waits, fills out
              a form, answers the same questions again, and then the doctor tells them to come back
              for the actual treatment. The entire first visit is consumed by data collection.
            </p>
            <p className="text-white/60 leading-relaxed">
              If the intake is handled before or during arrival, and the clinical summary is ready
              before the doctor walks in, the first visit becomes a treatment visit. That is the problem
              CareIQ is designed to solve.
            </p>
          </div>
        </section>

        <div className="border-t border-slate-200" />

        {/* What CareIQ does */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">How CareIQ fixes this</h2>
          <p className="text-slate-500 mb-8 text-sm">
            CareIQ replaces the slow parts of the workflow with an AI-powered pipeline
            while keeping the doctor fully in control.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                title: "AI voice intake before the doctor arrives",
                body: "An AI agent talks to the patient, asks about symptoms, reviews prior history, and generates a structured clinical summary. By the time the doctor walks in, they already have everything they need.",
                num: "01",
              },
              {
                title: "Structured data instead of handwritten forms",
                body: "Everything collected by the voice agent is structured and stored. No more transcribing handwritten notes. No more asking the same question twice.",
                num: "02",
              },
              {
                title: "HL7 records processed automatically",
                body: "Clinical data flows through an AWS pipeline into Snowflake. Doctors no longer spend 15 minutes manually entering visit data after each consultation.",
                num: "03",
              },
              {
                title: "Analytics across every visit",
                body: "With all data in Snowflake and modeled with dbt, the clinic can see diagnosis trends, visit patterns, and patient demographics in real time with no manual reporting.",
                num: "04",
              },
            ].map(item => (
              <div key={item.num} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <span className="text-[11px] font-bold text-slate-400 font-mono">{item.num}</span>
                <p className="font-semibold text-slate-800 mt-2 mb-2 text-sm">{item.title}</p>
                <p className="text-slate-500 text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="border-t border-slate-200" />

        {/* How it was built */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">How it was built</h2>
          <p className="text-slate-500 mb-8 text-sm">
            Every part of the stack was chosen to be production-grade, scalable, and cloud-native.
          </p>

          <div className="flex flex-wrap gap-0">
            {[
              { label: "GitHub Pages", desc: "Source data" },
              { label: "AWS Lambda", desc: "Scraper" },
              { label: "S3", desc: "Raw storage" },
              { label: "AWS Glue", desc: "ETL" },
              { label: "Snowflake", desc: "Warehouse" },
              { label: "dbt", desc: "Star schema" },
              { label: "Next.js", desc: "Frontend" },
            ].map((s, i, arr) => (
              <div key={s.label} className="flex items-center">
                <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
                  <p className="text-xs font-bold text-slate-800">{s.label}</p>
                  <p className="text-[10px] text-slate-400">{s.desc}</p>
                </div>
                {i < arr.length - 1 && (
                  <svg className="w-4 h-4 text-slate-300 mx-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </section>

        <div className="border-t border-slate-200" />

        {/* What the voice agent covers */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">What the voice agent covers right now</h2>
          <p className="text-slate-500 mb-6 text-sm leading-relaxed">
            The dataset behind CareIQ contains 200 patients with clinical records focused on
            chronic conditions — primarily kidney disease requiring dialysis, diabetes, hypertension,
            and related diagnoses. The voice agent Aria is built around this data.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
            <div className="bg-teal-50 border border-teal-100 rounded-xl p-5">
              <p className="font-semibold text-teal-800 text-sm mb-3">What Aria will ask about</p>
              <ul className="space-y-2">
                {[
                  "Current symptoms — what brings the patient in today",
                  "Pain or discomfort: location, severity (1–10), how long, what makes it worse",
                  "Dialysis: whether the patient is on it, how often, and symptoms after sessions such as dizziness or fatigue",
                  "Diabetes: blood sugar management, numbness in hands or feet, wound healing issues",
                  "Current medications — all of them, not just pain medication",
                  "Associated symptoms: fever, weakness, nausea, tingling",
                ].map(item => (
                  <li key={item} className="flex items-start gap-2 text-xs text-teal-700">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-5">
              <p className="font-semibold text-amber-800 text-sm mb-3">What Aria will not ask about</p>
              <ul className="space-y-2">
                {[
                  "Topics outside the patient's stated condition — Aria adapts to what the patient says",
                  "Dialysis-specific questions if the patient has no history of it",
                  "Diabetes follow-up questions if the patient is not diabetic",
                  "Mental health, dermatology, orthopedics, or other specialties outside this dataset",
                  "Anything the patient already answered earlier in the conversation",
                ].map(item => (
                  <li key={item} className="flex items-start gap-2 text-xs text-amber-700">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-slate-100 border border-slate-200 rounded-xl p-5">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Example</p>
            <p className="text-slate-600 text-sm leading-relaxed">
              If a patient says they have pain in their hand, Aria will ask about the location, severity,
              and duration of that pain. It will NOT jump to asking about dialysis unless the patient
              has mentioned kidney disease or dialysis in their history. Aria reads the full conversation
              before every reply and only asks what is relevant to that specific patient.
            </p>
          </div>

          <p className="text-slate-400 text-xs mt-5 leading-relaxed">
            This scope is based on the current dataset. As the data grows to include more condition types,
            the voice agent can be updated to handle those conversations accordingly.
          </p>
        </section>

        <div className="border-t border-slate-200" />

        {/* Who it is for */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Who this is for</h2>
          <p className="text-slate-500 mb-6 text-sm">
            CareIQ is a general healthcare platform. The same pipeline works for any condition,
            any department, any patient type.
          </p>
          <ul className="space-y-3">
            {[
              "General practice clinics managing high visit volume",
              "Specialty providers who need structured condition analytics",
              "Healthcare administrators tracking operational metrics",
              "Clinical researchers analyzing diagnosis and visit patterns",
              "Any team ready to move from manual intake to an AI-assisted workflow",
            ].map(item => (
              <li key={item} className="flex items-start gap-3 text-sm text-slate-600">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </section>

      </div>

      {/* Bottom CTA */}
      <section className="bg-[#0f1d35] px-8 py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-3">Want to see it in action?</h2>
          <p className="text-white/40 mb-8 text-sm">
            Open the patients page, add someone to the queue, and start a voice consultation.
          </p>
          <a href="/patients"
            className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white font-bold px-10 py-4 rounded-xl text-base transition shadow-2xl shadow-teal-500/20">
            Open Patients
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </section>

    </main>
  );
}
