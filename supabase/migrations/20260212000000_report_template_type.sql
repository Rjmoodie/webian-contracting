-- Add report template type: cavity (void detection) vs utility_anomaly (utility location & anomaly)
alter table public.reports
  add column if not exists template_type text
  check (template_type is null or template_type in ('cavity','utility_anomaly'));

comment on column public.reports.template_type is 'Report template used: cavity (void/cavity detection) or utility_anomaly (utility location & anomaly scan).';
