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
