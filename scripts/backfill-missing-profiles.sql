-- Backfill missing profiles for users who exist in auth.users but not in public.profiles
-- Run this in Supabase Dashboard → SQL Editor → New query, then Run.
--
-- Use this if you see 401 "Unauthorized" on Client or Admin dashboard — usually because
-- the user was created before the trigger existed or via a path that didn't create a profile.

WITH missing AS (
  SELECT
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)) AS name,
    COALESCE(u.raw_user_meta_data->>'role', 'client') AS role,
    u.raw_user_meta_data->>'company' AS company
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  WHERE p.id IS NULL
)
INSERT INTO public.profiles (id, email, name, role, company)
SELECT id, email, name, role, company FROM missing
ON CONFLICT (id) DO NOTHING;

-- Show how many profiles were missing (run once before/after to confirm)
-- SELECT COUNT(*) AS still_missing FROM auth.users u LEFT JOIN public.profiles p ON p.id = u.id WHERE p.id IS NULL;
