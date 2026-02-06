-- ============================================
-- DIAGNOSE 401 AUTHENTICATION ERRORS
-- ============================================

-- Step 1: Check if Roderick's profile exists
SELECT 
  key,
  value->>'id' as user_id,
  value->>'email' as email,
  value->>'name' as name,
  value->>'role' as role,
  value->>'createdAt' as created_at
FROM kv_store_d8ea749c
WHERE key = 'user:7823766f-ebac-4c64-84c8-6715ebfa7a26'
   OR value->>'email' = 'roderickmoodie@yahoo.com';

-- Step 2: List ALL user profiles (to see what exists)
SELECT 
  key,
  value->>'id' as user_id,
  value->>'email' as email,
  value->>'name' as name,
  value->>'role' as role
FROM kv_store_d8ea749c
WHERE key LIKE 'user:%'
ORDER BY value->>'createdAt' DESC;

-- Step 3: Check if the user ID in the key matches the user ID in the value
-- (They should match - if not, that's the problem!)
SELECT 
  key,
  REPLACE(key, 'user:', '') as key_user_id,
  value->>'id' as value_user_id,
  CASE 
    WHEN REPLACE(key, 'user:', '') = value->>'id' THEN '✅ Match'
    ELSE '❌ MISMATCH - This is the problem!'
  END as id_match,
  value->>'email' as email,
  value->>'role' as role
FROM kv_store_d8ea749c
WHERE key LIKE 'user:%';

-- Step 4: If Roderick's role is still 'client', update it to 'admin'
-- (Uncomment and run if needed)
-- UPDATE kv_store_d8ea749c
-- SET value = jsonb_set(
--   value,
--   '{role}',
--   '"admin"'
-- )
-- WHERE key = 'user:7823766f-ebac-4c64-84c8-6715ebfa7a26';

-- Step 5: Verify the update worked
-- SELECT 
--   value->>'email' as email,
--   value->>'role' as role
-- FROM kv_store_d8ea749c
-- WHERE key = 'user:7823766f-ebac-4c64-84c8-6715ebfa7a26';
