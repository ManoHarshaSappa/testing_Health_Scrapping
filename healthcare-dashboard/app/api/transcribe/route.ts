import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const audio = formData.get("audio") as File | null;
    if (!audio) return NextResponse.json({ error: "No audio" }, { status: 400 });

    const body = new FormData();
    body.append("file", audio, "audio.webm");
    body.append("model", "whisper-1");
    body.append("language", "en");

    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body,
    });

    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: data?.error?.message || "Whisper error" }, { status: 500 });
    return NextResponse.json({ text: data.text ?? "" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
