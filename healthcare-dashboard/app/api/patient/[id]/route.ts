import { NextResponse } from "next/server";
import { runQuery } from "@/lib/snowflake";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const [patients, visits] = await Promise.all([
      runQuery<{ PATIENT_ID: string; NAME: string; USERNAME: string; VISIT_COUNT: number }>(`
        SELECT PATIENT_ID, NAME, USERNAME, VISIT_COUNT
        FROM HEALTHCARE_DB.DBT_DEV.DIM_PATIENT
        WHERE PATIENT_ID = '${id}'
        LIMIT 1
      `),
      runQuery<{
        VISIT_ID: string;
        VISIT_DATE: string;
        PROVIDER_NAME: string;
        FACILITY: string;
        PATIENT_CLASS: string;
        DIAGNOSIS_CODE: string;
        DIAGNOSIS_NAME: string;
        GENDER: string;
        DOB: string;
      }>(`
        SELECT VISIT_ID, VISIT_DATE, PROVIDER_NAME, FACILITY, PATIENT_CLASS,
               DIAGNOSIS_CODE, DIAGNOSIS_NAME, GENDER, DOB
        FROM HEALTHCARE_DB.DBT_DEV.FACT_VISITS
        WHERE PATIENT_ID = '${id}'
        ORDER BY VISIT_DATE DESC
      `),
    ]);

    if (!patients.length) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    return NextResponse.json({ patient: patients[0], visits });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
