-- Project media (showcase) and featured flag for public portfolio
-- Media: admin or client can upload; used when project is featured on public site.

-- 1. Add featured to projects
alter table public.projects
  add column if not exists featured boolean not null default false,
  add column if not exists featured_at timestamptz;

comment on column public.projects.featured is 'When true, project appears on public Portfolio page';
comment on column public.projects.featured_at is 'Set when project was first featured';

-- 2. Table: project_media (showcase images/files per project)
create table if not exists public.project_media (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  file_path  text not null,
  file_name  text not null,
  file_size  bigint,
  content_type text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_project_media_project_id on public.project_media(project_id);

alter table public.project_media enable row level security;

-- RLS: project client or admin/manager can select
create policy "project_media_select"
  on public.project_media for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_media.project_id
        and (p.client_id = auth.uid() or exists (
          select 1 from public.profiles pr
          where pr.id = auth.uid() and pr.role in ('admin','manager')
        ))
    )
  );

-- RLS: project client or admin/manager can insert
create policy "project_media_insert"
  on public.project_media for insert
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_media.project_id
        and (p.client_id = auth.uid() or exists (
          select 1 from public.profiles pr
          where pr.id = auth.uid() and pr.role in ('admin','manager')
        ))
    )
  );

-- RLS: project client or admin/manager can delete
create policy "project_media_delete"
  on public.project_media for delete
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_media.project_id
        and (p.client_id = auth.uid() or exists (
          select 1 from public.profiles pr
          where pr.id = auth.uid() and pr.role in ('admin','manager')
        ))
    )
  );

-- 3. Storage bucket: project-media (path: project_id/uuid_filename)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-media',
  'project-media',
  false,
  15728640,
  array[
    'image/jpeg','image/png','image/gif','image/webp',
    'video/mp4','video/webm','application/pdf'
  ]
)
on conflict (id) do update set
  file_size_limit = 15728640,
  allowed_mime_types = excluded.allowed_mime_types;

-- Storage RLS: upload for project client or admin/manager
create policy "project_media_upload"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'project-media'
    and exists (
      select 1 from public.projects p
      where p.id::text = (storage.foldername(name))[1]
        and (p.client_id = auth.uid() or exists (
          select 1 from public.profiles pr
          where pr.id = auth.uid() and pr.role in ('admin','manager')
        ))
    )
  );

-- Storage RLS: read for project client or admin/manager
create policy "project_media_read"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'project-media'
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

-- Storage RLS: delete for project client or admin/manager
create policy "project_media_delete_storage"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'project-media'
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
