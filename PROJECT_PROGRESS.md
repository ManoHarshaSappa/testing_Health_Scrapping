# Healthcare ETL Pipeline - Project Progress

## Architecture
```
[GitHub Pages Website] → Lambda (Extract) → S3 raw/
                                                  ↓
                                           AWS Glue (Transform)
                                                  ↓
                                          S3 staging/ (Parquet)
                                                  ↓
                                           Snowflake (Warehouse)
                                                  ↓
                                            dbt (Star Schema)
```

---

## COMPLETED ✅

### 1. Source Website
- URL: https://manoharshasappa.github.io/HealthCare_DataWebsite/
- Contains 200 patients in a table (tr.record-row)
- Each patient has a detail page with HL7 data

### 2. Lambda Function — Extract Layer
- Function name: `harsha-etl-extract`
- Region: `us-east-2`
- Runtime: Python 3.12
- Timeout: 1 min 30 sec / Memory: 256 MB
- ARN: arn:aws:lambda:us-east-2:392424877772:function:harsha-etl-extract
- IAM Role: `harsha-etl-role`
- Saves: `raw/hl7/{patient_id}.hl7` and `raw/patients_{timestamp}.json`

### 3. S3 Bucket — Raw Layer
- Bucket: `harsha-etl-project-12345`
- `raw/hl7/` — 200 individual .hl7 files
- `raw/patients_2026-04-21_03-34-56.json` — 50.2 KB metadata

### 4. AWS Glue — Transform Layer
- Job name: `harsha-etl-staging`
- Script: `glue_staging_job.py`
- Reads raw JSON + HL7 files from S3
- Cleans patient data, parses HL7 visit records
- Outputs Parquet to `s3://harsha-etl-project-12345/staging/`
- Key fix: HL7 PV1 visit_id is at index 13 (not 12)
- Uses boto3 to read HL7 files directly (not sc.wholeTextFiles)

### 5. S3 Staging Layer
- `staging/patients/` — 1 Parquet file (patient metadata)
- `staging/visits/` — 4 Parquet files (parsed HL7 visit records)

### 6. Snowflake — Data Warehouse
- Database: `HEALTHCARE_DB`
- Schema: `STAGING`
- Warehouse: `HEALTHCARE_WH` (X-Small)
- External stages: `STG_S3_PATIENTS`, `STG_S3_VISITS`
- **STG_PATIENTS** — 199 rows loaded
- **STG_VISITS** — 520 rows loaded (200 patients × avg 2-3 visits)

### 7. dbt Cloud — Star Schema
- Tool: dbt Cloud (free Developer plan)
- Project: `testing_Health_Scrapping` connected to Snowflake + GitHub
- Branch: `feature/star-schema` → merged to `main` via PR #1
- Models built and run successfully (Pass 6, Error 0):
  - `dim_patient` — 199 rows (patient_id, name, username, patient_url, visit_count)
  - `dim_provider` — distinct providers (provider_name, facility)
  - `dim_date` — distinct visit dates (date_day, year, month, day, month_name, day_name)
  - `fact_visits` — 520 rows (visit_id, patient_id, visit_date, provider_name, facility, patient_class, diagnosis_code, diagnosis_name, gender, dob)
- All models read from `HEALTHCARE_DB.STAGING` and write to `DBT_DEV` schema

---

## PIPELINE COMPLETE ✅

---

## AWS Resources Summary
| Resource | Name |
|---|---|
| Lambda | harsha-etl-extract |
| S3 Bucket | harsha-etl-project-12345 |
| IAM Role | harsha-etl-role |
| Glue Job | harsha-etl-staging |
| Region | us-east-2 |
| Snowflake DB | HEALTHCARE_DB |
