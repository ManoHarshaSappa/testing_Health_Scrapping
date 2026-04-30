import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { conversation, patientName, patientHistory } = await req.json();

    const transcript = conversation
      .filter((m: { role: string; content: string }) => m.content !== "[Patient is silent]")
      .map((m: { role: string; content: string }) =>
        `${m.role === "user" ? "Patient" : "Assistant"}: ${m.content}`
      )
      .join("\n");

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are a clinical documentation AI. Based on the intake conversation below, generate a structured patient summary for the doctor to read in seconds.

Patient: ${patientName}
Previous Medical History:
${patientHistory}

Today's Intake Transcript:
${transcript}

Return ONLY a valid JSON object with no markdown, no code fences, no explanation. Use this exact structure:

{
  "chiefComplaint": "One clear sentence — what the patient came in for today",
  "urgency": "Low" or "Medium" or "High" or "Emergency",
  "urgencyReason": "One phrase explaining why (e.g. 'severe pain rating, 3 days progressive')",
  "symptoms": ["symptom with severity if mentioned", "symptom 2", ...],
  "duration": "How long symptoms have been present (e.g. '3 days, started suddenly')",
  "medications": ["medication name and any notes, or empty array if none"],
  "relevantHistory": ["relevant past condition from history", ...],
  "doctorPriority": ["specific action for doctor to take", "action 2", "action 3"],
  "patientNote": "One sentence about patient demeanor or anything extra the doctor should know"
}`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();

    // Try to extract and validate JSON
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        JSON.parse(match[0]); // validate
        return NextResponse.json({ summary: match[0], type: "json" });
      } catch {
        // fall through to raw
      }
    }
    return NextResponse.json({ summary: raw, type: "text" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
