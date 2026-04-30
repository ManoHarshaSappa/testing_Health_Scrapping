import { NextResponse } from "next/server";
import { runQuery } from "@/lib/snowflake";

export async function GET() {
  try {
    const [byClass, byDiagnosis, byMonth, totals] = await Promise.all([
      runQuery<{ PATIENT_CLASS: string; COUNT: number }>(`
        SELECT PATIENT_CLASS, COUNT(*) as COUNT
        FROM HEALTHCARE_DB.DBT_DEV.FACT_VISITS
        GROUP BY PATIENT_CLASS ORDER BY COUNT DESC
      `),
      runQuery<{ DIAGNOSIS_NAME: string; COUNT: number }>(`
        SELECT DIAGNOSIS_NAME, COUNT(*) as COUNT
        FROM HEALTHCARE_DB.DBT_DEV.FACT_VISITS
        WHERE DIAGNOSIS_NAME IS NOT NULL
        GROUP BY DIAGNOSIS_NAME ORDER BY COUNT DESC LIMIT 10
      `),
      runQuery<{ MONTH: string; COUNT: number }>(`
        SELECT TO_CHAR(TO_DATE(VISIT_DATE), 'YYYY-MM') as MONTH, COUNT(*) as COUNT
        FROM HEALTHCARE_DB.DBT_DEV.FACT_VISITS
        WHERE VISIT_DATE IS NOT NULL
        GROUP BY MONTH ORDER BY MONTH
      `),
      runQuery<{ TOTAL_VISITS: number; TOTAL_PATIENTS: number }>(`
        SELECT COUNT(*) as TOTAL_VISITS,
               COUNT(DISTINCT PATIENT_ID) as TOTAL_PATIENTS
        FROM HEALTHCARE_DB.DBT_DEV.FACT_VISITS
      `),
    ]);

    return NextResponse.json({ byClass, byDiagnosis, byMonth, totals: totals[0] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
