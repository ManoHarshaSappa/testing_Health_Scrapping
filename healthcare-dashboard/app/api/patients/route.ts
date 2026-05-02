import { NextResponse } from "next/server";
import { runQuery } from "@/lib/snowflake";

export async function GET() {
  try {
    const patients = await runQuery<{
      PATIENT_ID: string;
      NAME: string;
      USERNAME: string;
      VISIT_COUNT: number;
    }>(`
      SELECT PATIENT_ID, NAME, USERNAME, VISIT_COUNT
      FROM HEALTHCARE_DB.DBT_DEV.DIM_PATIENT
      ORDER BY NAME ASC
    `);
    return NextResponse.json({ patients });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const esc       = (s: string) => String(s ?? "").replace(/'/g, "''");
    const patientId = `P${Date.now().toString().slice(-7)}`;
    const username  = name.trim().toLowerCase().replace(/\s+/g, ".") + "." + patientId.slice(-4);

    await runQuery(`
      INSERT INTO HEALTHCARE_DB.STAGING.STG_PATIENTS
        (PATIENT_ID, NAME, USERNAME, PATIENT_URL, HL7_FILE, VISIT_COUNT)
      VALUES (
        '${patientId}',
        '${esc(name.trim())}',
        '${esc(username)}',
        '',
        '',
        0
      )
    `);

    return NextResponse.json({ patientId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
