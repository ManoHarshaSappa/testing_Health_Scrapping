import { NextResponse } from "next/server";
import { runQuery } from "@/lib/snowflake";

export async function GET() {
  try {
    const rows = await runQuery(`
      SELECT visit_id, patient_id, visit_date, provider_name, facility,
             patient_class, diagnosis_code, diagnosis_name, gender, dob
      FROM HEALTHCARE_DB.DBT_DEV.FACT_VISITS
      LIMIT 100
    `);
    return NextResponse.json({ data: rows });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
