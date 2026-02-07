-- ============================================================
-- Project Messages: unified comms panel per project
-- Every message appears in the panel AND triggers an email.
-- Email replies are captured via inbound webhook and inserted here.
-- ============================================================

create table if not exists public.project_messages (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects(id) on delete cascade,
  sender_id    uuid references public.profiles(id),  -- null = system message
  sender_name  text not null,
  sender_role  text not null default 'system',        -- client, admin, manager, system
  body         text not null,
  is_internal  boolean not null default false,        -- internal notes (admin-only, not emailed to client)
  source       text not null default 'panel'          -- panel | email | system
                 check (source in ('panel','email','system')),
  email_message_id text,                              -- Resend message ID (for threading)
  created_at   timestamptz not null default now()
);

create index if not exists idx_project_messages_project_id on public.project_messages(project_id);

alter table public.project_messages enable row level security;

-- Clients see non-internal messages for their projects; admins see all
drop policy if exists "project_messages_select" on public.project_messages;
create policy "project_messages_select"
  on public.project_messages for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_messages.project_id
        and (
          -- admin/manager sees everything
          exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role in ('admin','manager'))
          or
          -- client sees only non-internal messages on their project
          (p.client_id = auth.uid() and project_messages.is_internal = false)
        )
    )
  );

drop policy if exists "project_messages_insert" on public.project_messages;
create policy "project_messages_insert"
  on public.project_messages for insert
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_messages.project_id
        and (
          p.client_id = auth.uid()
          or exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role in ('admin','manager'))
        )
    )
  );

-- Enable Supabase Realtime on this table (idempotent)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'project_messages'
  ) then
    alter publication supabase_realtime add table public.project_messages;
  end if;
end $$;
