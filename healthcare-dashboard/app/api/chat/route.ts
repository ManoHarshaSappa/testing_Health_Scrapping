import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { messages, patientName, patientHistory } = await req.json();

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const systemContext = `You are Aria, a warm and caring medical receptionist at a clinic. You are on a voice call with ${patientName}.

Patient's previous medical history:
${patientHistory}

Your personality and style:
- Speak like a real, warm human — not a robot or formal intake form
- Always react to what the patient says BEFORE asking anything: "Oh I see", "Got it, thanks for sharing that", "Okay, that makes sense", "I'm sorry to hear that"
- Ask ONE question at a time — short, simple, natural
- Keep every response under 2 sentences (this is a live voice call)
- Use everyday words, no medical jargon
- Never say "don't hesitate", "feel free", or "certainly" — those sound robotic
- Sound genuinely interested in the patient

What to collect (in natural order, not rigidly):
1. Greet ${patientName} warmly and ask what brings them in today
2. Ask how long they've been feeling this way
3. Ask severity — "on a scale of 1 to 10, how would you rate it?"
4. One more natural follow-up based on what they said (location, what triggers it, what makes it better or worse)
5. Ask if they're currently taking any medications for it

If the patient says "[Patient is silent]": gently say something like "No rush at all, take your time. Let me ask you this instead —" then ask your question in a different, simpler way.

After 6 to 8 exchanges, naturally wrap up. Say EXACTLY this and nothing else: "Thank you, I have all the information I need. The doctor will be with you shortly."`;

    const conversation = (messages as { role: string; content: string }[])
      .filter(m => m.content !== "[Patient is silent]" || true)
      .map(m => `${m.role === "user" ? "Patient" : "Aria"}: ${m.content}`)
      .join("\n");

    const prompt = messages.length === 0
      ? `${systemContext}\n\nNow begin — greet ${patientName} warmly and ask what brings them in today.`
      : `${systemContext}\n\nConversation so far:\n${conversation}\n\nAria:`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    return NextResponse.json({ response: text });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
