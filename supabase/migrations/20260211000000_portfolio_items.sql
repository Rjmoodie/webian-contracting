-- Past work / portfolio items (no project required): title, description, category, images.
-- Lets admins add showcase items that appear on the public Portfolio page.

-- 1. Table: portfolio_items
create table if not exists public.portfolio_items (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  category    text not null default 'photography' check (category in ('photography','videography','audio')),
  location    text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid references public.profiles(id) on delete set null
);

create index if not exists idx_portfolio_items_sort on public.portfolio_items(sort_order, created_at desc);

alter table public.portfolio_items enable row level security;

-- RLS: anyone can read (for public portfolio)
create policy "portfolio_items_select"
  on public.portfolio_items for select
  using (true);

-- RLS: only admin/manager can insert/update/delete
create policy "portfolio_items_insert"
  on public.portfolio_items for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin','manager')
    )
  );

create policy "portfolio_items_update"
  on public.portfolio_items for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin','manager')
    )
  );

create policy "portfolio_items_delete"
  on public.portfolio_items for delete
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin','manager')
    )
  );

-- 2. Table: portfolio_item_media
create table if not exists public.portfolio_item_media (
  id               uuid primary key default gen_random_uuid(),
  portfolio_item_id uuid not null references public.portfolio_items(id) on delete cascade,
  file_path        text not null,
  file_name        text not null,
  file_size        bigint,
  content_type     text,
  sort_order       int not null default 0,
  created_at       timestamptz not null default now()
);

create index if not exists idx_portfolio_item_media_item_id on public.portfolio_item_media(portfolio_item_id);

alter table public.portfolio_item_media enable row level security;

create policy "portfolio_item_media_select"
  on public.portfolio_item_media for select
  using (true);

create policy "portfolio_item_media_insert"
  on public.portfolio_item_media for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin','manager')
    )
  );

create policy "portfolio_item_media_delete"
  on public.portfolio_item_media for delete
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin','manager')
    )
  );

-- 3. Storage bucket: portfolio-item-media (path: item_id/uuid_filename)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio-item-media',
  'portfolio-item-media',
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

-- Storage: admin/manager can insert, select, delete (paths: portfolio_item_id/...)
create policy "portfolio_item_media_upload"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'portfolio-item-media'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin','manager')
    )
  );

create policy "portfolio_item_media_read"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'portfolio-item-media'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin','manager')
    )
  );

create policy "portfolio_item_media_delete_storage"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'portfolio-item-media'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin','manager')
    )
  );

-- Trigger: updated_at
create or replace function public.set_portfolio_items_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_portfolio_items_updated_at on public.portfolio_items;
create trigger set_portfolio_items_updated_at
  before update on public.portfolio_items
  for each row execute function public.set_portfolio_items_updated_at();
