-- ============================================
-- FIX MARVIN'S PROFILE - Replace Placeholder ID
-- ============================================

-- Step 1: Get Marvin's actual User ID from Supabase Auth
-- Go to: Supabase Dashboard → Authentication → Users
-- Search for: marvinmoodiem@yahoo.com
-- Copy the User ID (UUID format like: abc123-def456-...)
-- Replace 'MARVIN_ACTUAL_USER_ID' below with that ID

-- Step 2: Delete the placeholder profile
DELETE FROM kv_store_d8ea749c
WHERE key = 'user:MARVIN_USER_ID';

-- Step 3: Create Marvin's profile with correct User ID
-- ⚠️ REPLACE 'MARVIN_ACTUAL_USER_ID' WITH THE REAL USER ID FROM SUPABASE AUTH!
INSERT INTO kv_store_d8ea749c (key, value)
VALUES (
  'user:MARVIN_ACTUAL_USER_ID',
  jsonb_build_object(
    'id', 'MARVIN_ACTUAL_USER_ID',
    'email', 'marvinmoodiem@yahoo.com',
    'name', 'Marvin Moodie',
    'role', 'admin',
    'company', null,
    'createdAt', NOW()::text
  )
);

-- Step 4: Verify it worked
SELECT 
  key,
  value->>'id' as user_id,
  value->>'email' as email,
  value->>'name' as name,
  value->>'role' as role
FROM kv_store_d8ea749c
WHERE value->>'email' = 'marvinmoodiem@yahoo.com';
