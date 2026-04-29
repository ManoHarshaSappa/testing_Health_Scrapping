with visits as (
    select * from HEALTHCARE_DB.STAGING.STG_VISITS
)

select
    visit_id,
    patient_id,
    visit_date,
    provider_name,
    facility,
    patient_class,
    diagnosis_code,
    diagnosis_name,
    gender,
    dob,
    staged_at
from visits
where visit_id is not null
