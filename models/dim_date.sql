with source as (
    select * from HEALTHCARE_DB.STAGING.STG_VISITS
)

select distinct
    visit_date                                    as date_day,
    year(to_date(visit_date))                     as year,
    month(to_date(visit_date))                    as month,
    day(to_date(visit_date))                      as day,
    monthname(to_date(visit_date))                as month_name,
    dayname(to_date(visit_date))                  as day_name
from source
where visit_date is not null
