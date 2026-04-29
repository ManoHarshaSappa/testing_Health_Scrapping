with source as (
    select * from HEALTHCARE_DB.STAGING.STG_VISITS
)

select distinct
    provider_name,
    facility
from source
where provider_name is not null
