-- ============================================================
-- Webian Contracting & Geophysics Ltd – Initial Database Schema
-- Project: sdxhppnsfgvoqcyxcfai
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================

-- 0. Extensions
create extension if not exists "uuid-ossp" schema extensions;

-- ============================================================
-- 1. PROFILES  (mirrors Supabase Auth users)
-- ============================================================
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  name          text not null,
  role          text not null default 'client'
                  check (role in ('client','admin','manager')),
  company       text,
  phone         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.profiles is 'User profiles linked 1-to-1 with auth.users';

-- Auto-create a profile row when a new user signs up via Supabase Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, role, company)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'client'),
    new.raw_user_meta_data->>'company'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 2. SERVICE TYPES  (lookup table: Cavity, Utility, Utility/Anomaly)
-- ============================================================
create table public.service_types (
  id            uuid primary key default gen_random_uuid(),
  name          text not null unique,  -- e.g. 'Cavity', 'Utility', 'Utility/Anomaly'
  description   text,
  base_rate     numeric(12,2) not null default 200,  -- JMD per sq metre (regular)
  discount_rate numeric(12,2) default 150,           -- after 5000 sq m
  created_at    timestamptz not null default now()
);

-- Seed default service types from the Information sheet
insert into public.service_types (name, description, base_rate, discount_rate) values
  ('Cavity',          'Cavity / void detection',           200, 150),
  ('Utility',         'Utility location and mapping',      200, 150),
  ('Utility/Anomaly', 'Utility location and anomaly scan', 200, 150);

-- ============================================================
-- 3. CLIENT RATINGS  (pricing tier)
-- ============================================================
create table public.client_ratings (
  id            uuid primary key default gen_random_uuid(),
  name          text not null unique,  -- 'Premium International', 'Premium Local', 'Regular'
  rate_jmd      numeric(12,2) not null,
  description   text,
  created_at    timestamptz not null default now()
);

insert into public.client_ratings (name, rate_jmd, description) values
  ('Premium International', 5000, 'International / high-value clients'),
  ('Premium Local',          250, 'Local premium clients'),
  ('Regular',                200, 'Standard rate clients');

-- ============================================================
-- 4. PROJECTS  (Request for Quote → Quote → Active Project)
-- ============================================================
create table public.projects (
  id              uuid primary key default gen_random_uuid(),
  project_code    text unique,            -- e.g. WCI3125 (assigned by admin)
  
  -- Client info (who submitted the RFQ)
  client_id       uuid references public.profiles(id),
  client_name     text not null,
  client_contact  text,                   -- contact person
  client_address  text,
  client_address_lat  double precision,   -- Google Places lat
  client_address_lng  double precision,   -- Google Places lng
  client_address_place_id text,           -- Google Place ID
  client_email    text,
  client_phone    text,
  
  -- Project details (from the RFQ form)
  project_name    text not null,
  project_description text,               -- detailed scope / objectives (required from form)
  project_location text,
  project_address text,
  project_address_lat  double precision,  -- Google Places lat
  project_address_lng  double precision,  -- Google Places lng
  project_address_place_id text,          -- Google Place ID
  service_type_id uuid references public.service_types(id),
  investigation_type text,                -- free-text for invoice
  survey_area_sqm numeric(12,2),          -- total area in sq metres
  
  -- Site logistics (from RFQ)
  clearance_access       boolean default false,
  clearance_access_cost  numeric(12,2) default 0,
  mobilization_cost      numeric(12,2) default 0,
  accommodation_cost     numeric(12,2) default 0,
  service_head_count     integer default 1,
  
  -- Pricing factors (set by admin when building quote)
  client_rating_id       uuid references public.client_ratings(id),
  service_factor         numeric(12,2),   -- JMD per sq m (overrides base_rate)
  depth_factor           numeric(12,2),   -- additional per sq m for depth
  area_discounted_sqm    numeric(12,2),   -- discounted area
  risk_profile           text check (risk_profile in ('low','medium','high')),
  risk_multiplier        numeric(5,2),    -- e.g. 4.0, 5.0, 7.0
  
  -- Computed costs (stored for the quote/invoice)
  subtotal               numeric(14,2),
  discount_amount        numeric(14,2) default 0,
  total_cost_jmd         numeric(14,2),
  total_cost_usd         numeric(14,2),
  
  -- Payment terms
  prepayment_pct         numeric(5,2) default 40,   -- 40%
  prepayment_amount      numeric(14,2),
  balance_pct            numeric(5,2) default 60,    -- 60%
  balance_amount         numeric(14,2),
  payment_status         text default 'unpaid'
                           check (payment_status in ('unpaid','partial','paid')),
  
  -- Timeline estimates
  data_collection_days   numeric(5,1),
  evaluation_days        numeric(5,1),
  estimated_weeks        numeric(5,1),
  
  -- Workflow status
  status          text not null default 'rfq_submitted'
                    check (status in (
                      'rfq_submitted',   -- client submitted RFQ
                      'under_review',    -- admin is reviewing
                      'quoted',          -- admin sent quote to client
                      'quote_accepted',  -- client accepted the quote
                      'quote_rejected',  -- client rejected the quote
                      'in_progress',     -- field work underway
                      'data_processing', -- processing phase
                      'reporting',       -- evaluation & reporting
                      'delivered',       -- final report delivered
                      'completed',       -- project closed
                      'cancelled'        -- cancelled
                    )),
  
  -- Notes
  admin_notes     text,
  client_notes    text,
  
  -- Timestamps
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  quoted_at       timestamptz,
  accepted_at     timestamptz,
  completed_at    timestamptz
);

-- Auto-generate project_code: WCI + 4-digit sequence
create sequence public.project_code_seq start 3126;  -- next after WCI3125

create or replace function public.generate_project_code()
returns trigger
language plpgsql
as $$
begin
  if new.project_code is null then
    new.project_code := 'WCI' || nextval('public.project_code_seq')::text;
  end if;
  return new;
end;
$$;

create trigger set_project_code
  before insert on public.projects
  for each row execute function public.generate_project_code();

-- ============================================================
-- 5. QUOTE LINE ITEMS  (the service breakdown on the invoice)
-- ============================================================
create table public.quote_line_items (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references public.projects(id) on delete cascade,
  description     text not null,          -- e.g. 'GPS Grid Layout and Referencing'
  quantity        numeric(12,2),          -- sq metres or days
  unit_price      numeric(12,2),          -- JMD per unit
  uom             text,                   -- 'SQ M.', 'Days', 'Lump Sum'
  total_price     numeric(14,2),          -- qty * unit_price
  sort_order      integer default 0,
  category        text default 'professional_service'
                    check (category in ('initiation','professional_service','other')),
  created_at      timestamptz not null default now()
);

-- Default service rate factors (from Information sheet)
-- GPS Grid Layout = 6%, Data Collection = 37%, Data Processing = 23%, Evaluation = 34%
-- These are applied by the admin when generating the quote

-- ============================================================
-- 6. ACTIVITY LOG  (audit trail)
-- ============================================================
create table public.activity_log (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid references public.projects(id) on delete cascade,
  user_id         uuid references public.profiles(id),
  user_name       text,
  user_role       text,
  action          text not null,
  old_value       text,
  new_value       text,
  details         jsonb,
  created_at      timestamptz not null default now()
);

-- ============================================================
-- 7. INDEXES
-- ============================================================
create index idx_projects_client_id  on public.projects(client_id);
create index idx_projects_status     on public.projects(status);
create index idx_projects_code       on public.projects(project_code);
create index idx_quote_items_project on public.quote_line_items(project_id);
create index idx_activity_project    on public.activity_log(project_id);
create index idx_profiles_role       on public.profiles(role);

-- ============================================================
-- 8. ROW LEVEL SECURITY  (RLS)
-- ============================================================

-- Profiles: users can read their own, admins can read all
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin','manager')
    )
  );

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Admins can update any profile"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Projects: clients see own, admins see all
alter table public.projects enable row level security;

create policy "Clients can view own projects"
  on public.projects for select
  using (client_id = auth.uid());

create policy "Admins can view all projects"
  on public.projects for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin','manager')
    )
  );

create policy "Clients can insert projects (RFQ)"
  on public.projects for insert
  with check (client_id = auth.uid());

create policy "Admins can insert projects"
  on public.projects for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin','manager')
    )
  );

create policy "Admins can update any project"
  on public.projects for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin','manager')
    )
  );

create policy "Clients can update own project (limited)"
  on public.projects for update
  using (client_id = auth.uid());

-- Quote line items: follow project access
alter table public.quote_line_items enable row level security;

create policy "Users can view line items for their projects"
  on public.quote_line_items for select
  using (
    exists (
      select 1 from public.projects pr
      where pr.id = project_id
        and (pr.client_id = auth.uid()
          or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','manager')))
    )
  );

create policy "Admins can manage line items"
  on public.quote_line_items for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin','manager')
    )
  );

-- Activity log: follow project access
alter table public.activity_log enable row level security;

create policy "Users can view activity for their projects"
  on public.activity_log for select
  using (
    exists (
      select 1 from public.projects pr
      where pr.id = project_id
        and (pr.client_id = auth.uid()
          or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','manager')))
    )
  );

create policy "Authenticated users can insert activity"
  on public.activity_log for insert
  with check (auth.uid() is not null);

-- Service types & client ratings: readable by all, writable by admins
alter table public.service_types enable row level security;
alter table public.client_ratings enable row level security;

create policy "Anyone can read service types"
  on public.service_types for select
  using (true);

create policy "Admins can manage service types"
  on public.service_types for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "Anyone can read client ratings"
  on public.client_ratings for select
  using (true);

create policy "Admins can manage client ratings"
  on public.client_ratings for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ============================================================
-- 9. UPDATED_AT TRIGGER (auto-set updated_at on UPDATE)
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger set_projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- ============================================================
-- 10. HELPER VIEW: project summary for dashboards
-- ============================================================
create or replace view public.project_summary as
select
  p.id,
  p.project_code,
  p.client_name,
  p.project_name,
  p.project_location,
  st.name as service_type,
  p.survey_area_sqm,
  p.total_cost_jmd,
  p.total_cost_usd,
  p.payment_status,
  p.status,
  p.created_at,
  p.updated_at
from public.projects p
left join public.service_types st on st.id = p.service_type_id;

-- ============================================================
-- Done! Tables: profiles, service_types, client_ratings,
--              projects, quote_line_items, activity_log
-- ============================================================
