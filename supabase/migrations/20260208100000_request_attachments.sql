-- Request attachments: table + storage bucket for RFQ file uploads
-- Path in bucket: {project_id}/{uuid}_{filename}

-- 1. Table: metadata for each attachment (file lives in Storage)
create table if not exists public.request_attachments (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  file_path  text not null,   -- storage path: project_id/uuid_filename
  file_name  text not null,   -- original filename
  file_size  bigint,          -- bytes
  content_type text,
  created_at timestamptz not null default now()
);

create index if not exists idx_request_attachments_project_id on public.request_attachments(project_id);

alter table public.request_attachments enable row level security;

-- RLS: clients see attachments for their projects; admins/managers see all
drop policy if exists "request_attachments_select_own" on public.request_attachments;
create policy "request_attachments_select_own"
  on public.request_attachments for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = request_attachments.project_id
        and (p.client_id = auth.uid() or exists (
          select 1 from public.profiles pr
          where pr.id = auth.uid() and pr.role in ('admin','manager')
        ))
    )
  );

drop policy if exists "request_attachments_insert_own" on public.request_attachments;
create policy "request_attachments_insert_own"
  on public.request_attachments for insert
  with check (
    exists (
      select 1 from public.projects p
      where p.id = request_attachments.project_id and p.client_id = auth.uid()
    )
  );

-- 2. Storage bucket (id and name = request-attachments)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'request-attachments',
  'request-attachments',
  false,
  10485760,
  array[
    'application/pdf',
    'image/jpeg','image/png','image/gif','image/webp',
    'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain','text/csv'
  ]
)
on conflict (id) do update set
  file_size_limit = 10485760,
  allowed_mime_types = excluded.allowed_mime_types;

-- 3. Storage RLS: allow upload only to own project folder; read for project owner or admin/manager
drop policy if exists "request_attachments_upload_own_project" on storage.objects;
create policy "request_attachments_upload_own_project"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'request-attachments'
    and exists (
      select 1 from public.projects p
      where p.id::text = (storage.foldername(name))[1]
        and p.client_id = auth.uid()
    )
  );

drop policy if exists "request_attachments_read_own_or_admin" on storage.objects;
create policy "request_attachments_read_own_or_admin"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'request-attachments'
    and (
      exists (
        select 1 from public.projects p
        where p.id::text = (storage.foldername(name))[1]
          and p.client_id = auth.uid()
      )
      or exists (
        select 1 from public.profiles pr
        where pr.id = auth.uid() and pr.role in ('admin','manager')
      )
    )
  );
