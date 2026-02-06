-- ============================================
-- Make Roderick Moodie an Admin
-- ============================================

UPDATE kv_store_d8ea749c
SET value = jsonb_set(
  value,
  '{role}',
  '"admin"'
)
WHERE key = 'user:7823766f-ebac-4c64-84c8-6715ebfa7a26';

-- Verify the update
SELECT 
  key,
  value->>'id' as user_id,
  value->>'email' as email,
  value->>'name' as name,
  value->>'role' as role,
  value->>'createdAt' as created_at
FROM kv_store_d8ea749c
WHERE key = 'user:7823766f-ebac-4c64-84c8-6715ebfa7a26';

-- ============================================
-- Create Marvin Moodie as Primary Admin
-- ============================================
-- NOTE: You need to get Marvin's user ID from Supabase Auth first!
-- Steps:
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Search for "marvinmoodiem@yahoo.com"
-- 3. Copy the User ID (UUID format)
-- 4. Replace 'MARVIN_USER_ID_HERE' below with that ID
-- 5. Run the INSERT query

-- First, check if Marvin already exists in KV store
SELECT 
  key,
  value->>'id' as user_id,
  value->>'email' as email,
  value->>'name' as name,
  value->>'role' as role
FROM kv_store_d8ea749c
WHERE value->>'email' = 'marvinmoodiem@yahoo.com';

-- If Marvin exists, update to admin:
-- UPDATE kv_store_d8ea749c
-- SET value = jsonb_set(
--   value,
--   '{role}',
--   '"admin"'
-- )
-- WHERE value->>'email' = 'marvinmoodiem@yahoo.com';

-- If Marvin doesn't exist, insert (replace MARVIN_USER_ID_HERE with actual ID):
-- INSERT INTO kv_store_d8ea749c (key, value)
-- VALUES (
--   'user:MARVIN_USER_ID_HERE',
--   jsonb_build_object(
--     'id', 'MARVIN_USER_ID_HERE',
--     'email', 'marvinmoodiem@yahoo.com',
--     'name', 'Marvin Moodie',
--     'role', 'admin',
--     'company', null,
--     'createdAt', NOW()::text
--   )
-- );

-- ============================================
-- Verify All Admins
-- ============================================

SELECT 
  key,
  value->>'id' as user_id,
  value->>'email' as email,
  value->>'name' as name,
  value->>'role' as role,
  value->>'createdAt' as created_at
FROM kv_store_d8ea749c
WHERE key LIKE 'user:%'
  AND (value->>'role' = 'admin' OR value->>'role' = 'manager')
ORDER BY value->>'createdAt' DESC;
