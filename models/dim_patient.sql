with source as (
    select * from HEALTHCARE_DB.STAGING.STG_PATIENTS
)

select
    patient_id,
    name,
    username,
    patient_url,
    hl7_file,
    visit_count
from source
where patient_id != 'UNKNOWN'
