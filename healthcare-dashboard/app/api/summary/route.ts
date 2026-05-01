import { NextResponse } from "next/server";

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

export async function POST(req: Request) {
  try {
    const { conversation, patientName, patientHistory } = await req.json();

    const transcript = conversation
      .filter((m: { role: string; content: string }) => m.content !== "[Patient is silent]")
      .map((m: { role: string; content: string }) =>
        `${m.role === "user" ? "Patient" : "Aria"}: ${m.content}`
      )
      .join("\n");

    const prompt = `You are a clinical documentation AI generating a professional medical intake note enriched with UMLS standardized vocabulary.

Patient: ${patientName}
Previous Medical History:
${patientHistory}

Today's Intake Conversation:
${transcript}

---
DOCUMENTATION RULES:
- Do NOT hallucinate or infer anything not said in the conversation
- If a field has no information, use "None reported"
- If patient explicitly denied something, write "Patient denies"
- Include BOTH present AND explicitly denied symptoms in associatedSymptoms
- Be medically precise but concise

CONFIDENCE SCORING:
- "High" = clear, detailed, consistent answers with complete history
- "Medium" = some details missing or vague answers
- "Low" = minimal info, contradictory, or very short conversation

CLINICAL IMPRESSION:
- Categorize likely cause: mechanical / dialysis-related / inflammatory / neuropathic / cardiac / needs further evaluation
- Mention absence of alarm features if applicable
- Add 1–2 line reasoning based on symptom pattern, history, and risk factors

UMLS STRICT GROUNDING RULES:
- ONLY extract concepts explicitly mentioned or clearly stated in the conversation above
- DO NOT introduce conditions not present in this specific conversation
- DO NOT add general medical knowledge, common comorbidities, or unrelated diseases
- For each concept you consider: ask "Did the patient or Aria mention this directly?" → If NO → remove it
- Priority order: 1) Diagnosis 2) Main symptoms 3) Key clinical findings
- Maximum 5–7 concepts total — quality over quantity
- Only include CUIs you are confident about from your training — do NOT guess or fabricate
- Use standardized UMLS medical naming

VALIDATION STEP (do this before outputting):
For every concept in umlsConcepts, verify:
  ✓ Is it directly mentioned in the conversation?
  ✓ Is the CUI a real, known UMLS concept?
  If either fails → remove the concept entirely

---
Return ONLY a valid JSON object. No markdown, no code fences, no explanation. Exact structure:

{
  "chiefComplaint": "One clear sentence",
  "urgency": "Low" or "Medium" or "High" or "Emergency",
  "urgencyReason": "One phrase",
  "confidence": "Low" or "Medium" or "High",
  "confidenceReason": "One phrase e.g. complete history obtained",
  "symptoms": [
    { "name": "symptom name", "severity": "scale if mentioned", "triggers": "what worsens or None reported", "relievers": "what helps or None reported" }
  ],
  "duration": "How long symptoms present",
  "associatedSymptoms": ["present symptoms"] or ["None reported"],
  "deniedSymptoms": ["symptoms patient explicitly said no to"] or ["None reported"],
  "medications": ["name and dose if mentioned"] or ["None reported"],
  "relevantHistory": ["past condition relevant to today"] or ["None reported"],
  "dialysisDetails": "Schedule/type if mentioned, else None reported",
  "dialysisSymptoms": ["post-session symptoms"] or ["None reported"],
  "redFlags": ["red flag symptoms"] or ["None identified"],
  "clinicalImpression": "1–2 sentence insight: likely cause with reasoning and absence of alarm features if applicable",
  "nextSteps": ["Specific next step 1 e.g. Order lumbar X-ray", "Next step 2"],
  "doctorPriority": ["action item 1", "action item 2", "action item 3"],
  "patientNote": "One sentence on demeanor or anything extra doctor should know",
  "umlsConcepts": [
    { "term": "Short clinical term", "fullName": "Full UMLS concept name", "cui": "CXXXXXXX", "confidence": "High" or "Medium" }
  ]
}`;

    const res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          thinkingConfig: { thinkingBudget: 0 },
          temperature: 0.2,
          maxOutputTokens: 3000,
        },
      }),
    });

    const data = await res.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!raw) throw new Error(data?.error?.message || "No response from Gemini");

    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try { JSON.parse(match[0]); return NextResponse.json({ summary: match[0], type: "json" }); }
      catch { /* fall through */ }
    }
    return NextResponse.json({ summary: raw, type: "text" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
