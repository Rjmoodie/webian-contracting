-- Set role to 'admin' for a user by email
-- Run this in Supabase Dashboard → SQL Editor → New query, then Run.

-- Update the profile for rodzrj@gmail.com to admin
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'rodzrj@gmail.com';

-- Show how many rows were updated (should be 1)
SELECT COUNT(*) AS updated_count
FROM public.profiles
WHERE email = 'rodzrj@gmail.com' AND role = 'admin';
