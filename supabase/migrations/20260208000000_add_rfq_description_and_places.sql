-- Add RFQ detailed description and Google Places fields to projects.
-- Safe to run on existing DBs (IF NOT EXISTS). No-op if columns already exist.

ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS project_description text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS project_address_lat double precision;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS project_address_lng double precision;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS project_address_place_id text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS client_address_lat double precision;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS client_address_lng double precision;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS client_address_place_id text;
