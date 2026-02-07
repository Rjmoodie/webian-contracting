-- ============================================================
-- Reports System – per-project engineering reports
-- ============================================================

-- 1. REPORTS (one per project)
create table if not exists public.reports (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references public.projects(id) on delete cascade,
  report_number   text,                               -- e.g. RPT-WCI3125
  title           text not null,
  status          text not null default 'draft'
                    check (status in ('draft','in_review','approved','issued','amended')),
  created_by      uuid references public.profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  approved_by     uuid references public.profiles(id),
  approved_at     timestamptz,
  issued_at       timestamptz,
  issued_to_email text,
  notes           text,                               -- internal notes
  unique (project_id)                                  -- one report per project
);

create index if not exists idx_reports_project_id on public.reports(project_id);

-- 2. REPORT SECTIONS (ordered content blocks)
create table if not exists public.report_sections (
  id              uuid primary key default gen_random_uuid(),
  report_id       uuid not null references public.reports(id) on delete cascade,
  section_key     text not null,                      -- machine key: cover, executive_summary, introduction, etc.
  title           text not null,
  content         text not null default '',            -- rich text / markdown
  sort_order      integer not null default 0,
  is_visible      boolean not null default true,       -- toggle section on/off
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_report_sections_report_id on public.report_sections(report_id);

-- 3. REPORT MEDIA (images/files attached to sections)
create table if not exists public.report_media (
  id              uuid primary key default gen_random_uuid(),
  report_id       uuid not null references public.reports(id) on delete cascade,
  section_id      uuid references public.report_sections(id) on delete set null,
  file_path       text not null,
  file_name       text not null,
  file_size       bigint,
  content_type    text,
  caption         text,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now()
);

create index if not exists idx_report_media_report_id on public.report_media(report_id);
create index if not exists idx_report_media_section_id on public.report_media(section_id);

-- ============================================================
-- RLS
-- ============================================================
alter table public.reports enable row level security;
alter table public.report_sections enable row level security;
alter table public.report_media enable row level security;

-- Reports: admins/managers see all; clients see only issued reports for their projects
drop policy if exists "reports_select" on public.reports;
create policy "reports_select"
  on public.reports for select
  using (
    exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role in ('admin','manager'))
    or (
      status = 'issued'
      and exists (
        select 1 from public.projects p
        join public.profiles pr on pr.id = auth.uid()
        where p.id = reports.project_id and p.client_id = pr.id and pr.role = 'client'
      )
    )
  );

drop policy if exists "reports_insert" on public.reports;
create policy "reports_insert"
  on public.reports for insert
  with check (
    exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role in ('admin','manager'))
  );

drop policy if exists "reports_update" on public.reports;
create policy "reports_update"
  on public.reports for update
  using (
    exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role in ('admin','manager'))
  );

drop policy if exists "reports_delete" on public.reports;
create policy "reports_delete"
  on public.reports for delete
  using (
    exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role in ('admin','manager'))
  );

-- Report sections: same as reports
drop policy if exists "report_sections_select" on public.report_sections;
create policy "report_sections_select"
  on public.report_sections for select
  using (
    exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role in ('admin','manager'))
    or exists (
      select 1 from public.reports r
      join public.projects p on p.id = r.project_id
      where r.id = report_sections.report_id and r.status = 'issued' and p.client_id = auth.uid()
    )
  );

drop policy if exists "report_sections_insert" on public.report_sections;
create policy "report_sections_insert"
  on public.report_sections for insert
  with check (
    exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role in ('admin','manager'))
  );

drop policy if exists "report_sections_update" on public.report_sections;
create policy "report_sections_update"
  on public.report_sections for update
  using (
    exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role in ('admin','manager'))
  );

drop policy if exists "report_sections_delete" on public.report_sections;
create policy "report_sections_delete"
  on public.report_sections for delete
  using (
    exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role in ('admin','manager'))
  );

-- Report media: same pattern
drop policy if exists "report_media_select" on public.report_media;
create policy "report_media_select"
  on public.report_media for select
  using (
    exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role in ('admin','manager'))
    or exists (
      select 1 from public.reports r
      join public.projects p on p.id = r.project_id
      where r.id = report_media.report_id and r.status = 'issued' and p.client_id = auth.uid()
    )
  );

drop policy if exists "report_media_insert" on public.report_media;
create policy "report_media_insert"
  on public.report_media for insert
  with check (
    exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role in ('admin','manager'))
  );

drop policy if exists "report_media_update" on public.report_media;
create policy "report_media_update"
  on public.report_media for update
  using (
    exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role in ('admin','manager'))
  );

drop policy if exists "report_media_delete" on public.report_media;
create policy "report_media_delete"
  on public.report_media for delete
  using (
    exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role in ('admin','manager'))
  );

-- Storage bucket for report media
insert into storage.buckets (id, name, public)
values ('report-media', 'report-media', true)
on conflict (id) do nothing;

-- Realtime for reports (so status changes push to clients)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'reports'
  ) then
    alter publication supabase_realtime add table public.reports;
  end if;
end$$;
