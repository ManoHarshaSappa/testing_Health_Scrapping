# CareIQ — AI-Powered Healthcare Data Platform

**Live:** [care-iq-j1q9.vercel.app](https://care-iq-j1q9.vercel.app)

---

## What is this?

CareIQ is an end-to-end healthcare data engineering project built to solve a real problem in clinical workflows — the gap between a patient walking into a clinic and actually receiving treatment.

Today, a patient books an appointment, arrives and fills out a paper form, answers the same questions again when the doctor walks in, and then the doctor spends another 15–20 minutes after the visit manually entering all clinical details into the hospital system in HL7 format. On most first visits, the patient leaves without any treatment — only a follow-up appointment.

CareIQ replaces that entire intake process with an AI voice agent and an automated data pipeline, so the doctor walks in already knowing everything about the patient and the first visit can be a treatment visit.

---

## The Problem It Solves

### Manual patient intake is slow and error-prone
Nurses and front desk staff spend significant time collecting the same information every visit — symptoms, medications, allergies, prior history — by hand on paper forms that then need to be digitized.

### Doctors waste time entering HL7 data after every visit
After each consultation, doctors return to their desk and manually type all clinical observations into the hospital system. This takes 10–20 minutes per patient and pulls them away from actual care.

### Clinical data is siloed with no analytics layer
Patient records exist in disconnected systems with no unified way to query diagnoses, visit trends, or patient demographics — so clinical insights stay buried instead of driving better decisions.

---

## How It Works

### The Data Pipeline

Raw healthcare records are scraped from a public HL7 data source and flow through a fully automated cloud pipeline:

```
GitHub Pages (HL7 source data)
    → AWS Lambda (Python scraper)
    → Amazon S3 (raw storage)
    → AWS Glue (ETL transformation)
    → Snowflake (data warehouse)
    → dbt (star schema modeling)
    → Next.js + Vercel (frontend + API)
```

The dbt models transform raw staging data into a clean star schema:
- `dim_patient` — patient demographics
- `dim_provider` — provider details
- `dim_date` — date dimension
- `fact_visits` — visit records with diagnosis codes

### The AI Voice Agent

An AI voice agent named **Aria** conducts the patient intake conversation before the doctor arrives. Aria:

- Greets the patient by name and asks what brings them in
- Collects symptom details: location, severity (1–10), duration, triggers
- Asks about relevant history: diabetes, dialysis, medications, allergies
- Adapts to the patient — only asks about dialysis if the patient has kidney disease, only asks diabetes follow-ups if the patient is diabetic
- Never repeats a question the patient already answered
- Generates a structured clinical summary when the conversation is complete

Powered by **Google Gemini** for conversation and **OpenAI TTS** for voice output. Speech recognition uses the browser's native Web Speech API.

### The Dashboard

A Next.js frontend gives clinic staff a full view of patient data pulled live from Snowflake:

- **Home** — analytics: visit volume over time, visit type breakdown (outpatient/inpatient/emergency), top diagnoses by count
- **Patients** — all 200 patient records, searchable by name or ID, with a daily queue and Waiting/In Progress/Done status tracking
- **Consultation** — start an AI voice or text intake for any queued patient, view a live report as the conversation builds, save the completed visit back to Snowflake

---

## What the Voice Agent Covers

The dataset contains 200 patients with chronic condition records — chronic kidney disease (dialysis), type 2 diabetes, hypertension, GERD, hypothyroidism, anemia, heart failure, and related diagnoses.

Aria is calibrated to these conditions. It asks about dialysis only if the patient has kidney disease. It asks about numbness and wound healing only if the patient is diabetic. For any symptom the patient mentions, Aria follows that thread and does not jump to unrelated questions.

This scope is based on the current dataset and expands as more condition types are added.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Data source | GitHub Pages (public HL7 records) |
| Ingestion | AWS Lambda (Python) |
| Raw storage | Amazon S3 |
| ETL | AWS Glue |
| Data warehouse | Snowflake |
| Data modeling | dbt |
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| AI conversation | Google Gemini |
| Text-to-speech | OpenAI TTS |
| Deployment | Vercel |

---

## Project Structure

```
healthcare-dashboard/
├── app/
│   ├── page.tsx              # Home — analytics dashboard
│   ├── about/page.tsx        # About — project story and voice agent scope
│   ├── patients/page.tsx     # Patients — queue + all patient records
│   ├── patient/[id]/page.tsx # Individual patient + consultation
│   └── api/
│       ├── patients/         # Fetch all patients from Snowflake
│       ├── patient/[id]/     # Fetch single patient + visit history
│       ├── stats/            # Analytics data
│       ├── chat/             # Gemini AI conversation
│       ├── speak/            # OpenAI text-to-speech
│       ├── summary/          # Clinical summary generation
│       └── visits/           # Save new visit to Snowflake
├── components/
│   ├── ConsultationPanel.tsx # Voice + text intake UI
│   ├── Navbar.tsx            # Navigation
│   ├── MedicalBackground.tsx # Decorative SVG background
│   └── SummaryCard.tsx       # Clinical summary display
└── lib/
    └── snowflake.ts          # Snowflake connection with auto-reconnect
```

---

## Built By

**Mano Harsha Sappa** — Data engineer focused on end-to-end data systems, cloud infrastructure, and AI-powered applications.

- GitHub: [github.com/ManoHarshaSappa](https://github.com/ManoHarshaSappa)
- LinkedIn: [linkedin.com/in/manoharshasappa](https://www.linkedin.com/in/manoharshasappa/)
- Portfolio: [manoharshasappa.github.io/portfolio_ManoHarshaSappa](https://manoharshasappa.github.io/portfolio_ManoHarshaSappa/)
- Email: sappamanoharsha@gmail.com
