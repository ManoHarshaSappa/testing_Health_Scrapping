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

export async function POST(req: Request) {
  try {
    const { patientId, diagnosisName, diagnosisCode, providerName, patientClass, dob, gender } = await req.json();

    const esc = (s: string) => String(s ?? "").replace(/'/g, "''");
    const visitId   = `V${Date.now()}`;
    const visitDate = new Date().toISOString().split("T")[0];
    const dobVal    = dob    ? `'${esc(dob)}'`    : "NULL";
    const genderVal = gender ? `'${esc(gender)}'` : "NULL";

    await runQuery(`
      INSERT INTO HEALTHCARE_DB.STAGING.STG_VISITS
        (VISIT_ID, PATIENT_ID, VISIT_DATE, PROVIDER_NAME, FACILITY,
         PATIENT_CLASS, DIAGNOSIS_CODE, DIAGNOSIS_NAME, GENDER, DOB, STAGED_AT)
      VALUES (
        '${visitId}',
        '${esc(patientId)}',
        '${visitDate}',
        '${esc(providerName)}',
        'CareIQ Clinic',
        '${esc(patientClass)}',
        '${esc(diagnosisCode)}',
        '${esc(diagnosisName)}',
        ${genderVal},
        ${dobVal},
        CURRENT_TIMESTAMP()
      )
    `);

    // Increment visit count in STG_PATIENTS so DIM_PATIENT reflects the new visit
    await runQuery(`
      UPDATE HEALTHCARE_DB.STAGING.STG_PATIENTS
      SET VISIT_COUNT = VISIT_COUNT + 1
      WHERE PATIENT_ID = '${esc(patientId)}'
    `);

    return NextResponse.json({ success: true, visitId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
