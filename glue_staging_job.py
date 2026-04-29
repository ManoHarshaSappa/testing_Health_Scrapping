import sys
import re
import boto3
from datetime import datetime

from awsglue.utils import getResolvedOptions
from awsglue.context import GlueContext
from awsglue.job import Job
from pyspark.context import SparkContext
from pyspark.sql import functions as F
from pyspark.sql.types import IntegerType, StructType, StructField, StringType

args = getResolvedOptions(sys.argv, ["JOB_NAME"])
sc = SparkContext()
glueContext = GlueContext(sc)
spark = glueContext.spark_session
job = Job(glueContext)
job.init(args["JOB_NAME"], args)

BUCKET = "harsha-etl-project-12345"
RAW_PATH = f"s3://{BUCKET}/raw/patients_*.json"
STAGING_PATIENTS_PATH = f"s3://{BUCKET}/staging/patients/"
STAGING_VISITS_PATH = f"s3://{BUCKET}/staging/visits/"


# ── PART 1: Clean patient metadata JSON ──────────────────────────────────────

df = spark.read.option("multiline", "true").json(RAW_PATH)

df_patients = (
    df
    .withColumn(
        "patient_id",
        F.when(
            F.col("patient_id").isNull() | (F.col("patient_id") == ""),
            F.regexp_extract(F.col("patient_url"), r"/(P\d+)\.html$", 1)
        ).otherwise(F.col("patient_id"))
    )
    .withColumn("name", F.trim(F.col("name")))
    .withColumn("username", F.trim(F.col("username")))
    .withColumn(
        "visit_count",
        F.regexp_extract(F.col("visits"), r"(\d+)", 1).cast(IntegerType())
    )
    .drop("visits")
    .withColumn("staged_at", F.lit(datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")))
)

df_patients = df_patients.fillna({
    "patient_id": "UNKNOWN",
    "name": "Unknown",
    "username": "Unknown",
    "visit_count": 0
})

df_patients.write.mode("overwrite").parquet(STAGING_PATIENTS_PATH)
print(f"Patients staging complete. Total: {df_patients.count()}")


# ── PART 2: Parse HL7 files into visits using boto3 ──────────────────────────

def parse_hl7(patient_id, hl7_text):
    visits = []
    blocks = re.split(r'(?=MSH\|)', hl7_text.strip())

    for block in blocks:
        if not block.strip().startswith("MSH"):
            continue

        lines = [l.strip() for l in block.strip().split("\n") if l.strip()]
        segments = {}
        for line in lines:
            parts = line.split("|")
            seg = parts[0]
            if seg not in segments:
                segments[seg] = parts

        if "PV1" not in segments:
            continue

        pid = segments.get("PID", [])
        pv1 = segments.get("PV1", [])
        dg1 = segments.get("DG1", [])

        dob_raw = pid[7] if len(pid) > 7 else None
        gender = pid[8] if len(pid) > 8 else None

        class_map = {"O": "Outpatient", "I": "Inpatient", "E": "Emergency"}
        patient_class = class_map.get(pv1[2] if len(pv1) > 2 else "", "Unknown")

        facility_raw = pv1[3] if len(pv1) > 3 else ""
        facility_parts = facility_raw.split("^")
        facility = (
            facility_parts[3] if len(facility_parts) > 3
            else facility_parts[0] if facility_parts
            else None
        )

        provider_raw = pv1[6] if len(pv1) > 6 else ""
        provider_parts = provider_raw.split("^")
        provider_name = (
            f"{provider_parts[1]} {provider_parts[0]}"
            if len(provider_parts) >= 2
            else provider_raw or None
        )

        visit_id = pv1[13] if len(pv1) > 13 else None

        visit_date_raw = pv1[-1].strip() if len(pv1) > 1 else None
        visit_date = None
        if visit_date_raw and len(visit_date_raw) >= 8:
            try:
                visit_date = datetime.strptime(visit_date_raw[:8], "%Y%m%d").strftime("%Y-%m-%d")
            except ValueError:
                pass

        diag_raw = dg1[3] if len(dg1) > 3 else ""
        diag_parts = diag_raw.split("^")
        diagnosis_code = diag_parts[0] if diag_parts else None
        diagnosis_name = diag_parts[1] if len(diag_parts) > 1 else None

        if visit_id:
            visits.append({
                "patient_id": patient_id,
                "visit_id": visit_id,
                "visit_date": visit_date,
                "provider_name": provider_name,
                "facility": facility,
                "patient_class": patient_class,
                "diagnosis_code": diagnosis_code,
                "diagnosis_name": diagnosis_name,
                "gender": gender,
                "dob": dob_raw,
            })

    return visits


# Read all HL7 files directly from S3 using boto3 (runs on Glue driver)
s3 = boto3.client("s3", region_name="us-east-2")
paginator = s3.get_paginator("list_objects_v2")

all_visits = []
for page in paginator.paginate(Bucket=BUCKET, Prefix="raw/hl7/"):
    for obj in page.get("Contents", []):
        key = obj["Key"]
        if not key.endswith(".hl7"):
            continue
        body = s3.get_object(Bucket=BUCKET, Key=key)["Body"].read().decode("utf-8")
        patient_id = key.split("/")[-1].replace(".hl7", "")
        all_visits.extend(parse_hl7(patient_id, body))

print(f"Total visits parsed from HL7: {len(all_visits)}")

visit_schema = StructType([
    StructField("patient_id", StringType(), True),
    StructField("visit_id", StringType(), True),
    StructField("visit_date", StringType(), True),
    StructField("provider_name", StringType(), True),
    StructField("facility", StringType(), True),
    StructField("patient_class", StringType(), True),
    StructField("diagnosis_code", StringType(), True),
    StructField("diagnosis_name", StringType(), True),
    StructField("gender", StringType(), True),
    StructField("dob", StringType(), True),
])

df_visits = spark.createDataFrame(all_visits, schema=visit_schema)
df_visits = df_visits.withColumn(
    "staged_at", F.lit(datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"))
)

df_visits.write.mode("overwrite").parquet(STAGING_VISITS_PATH)
print(f"Visits staging complete. Total visits: {df_visits.count()}")


job.commit()
