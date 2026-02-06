# Debugging 401 Authentication Errors

## 🔍 The Problem

After login, you're getting 401 errors on:
- `/auth/me` - Getting user profile
- `/requests` - Fetching requests

## 🎯 Root Cause Analysis

The `/auth/me` endpoint does this:
1. ✅ Gets access token from header
2. ✅ Verifies token with `supabase.auth.getUser(accessToken)`
3. ❌ **Looks up user profile**: `kv.get(`user:${user.id}`)`
4. ❌ **If profile not found** → Returns 404 (but you're seeing 401)

The 401 is happening at step 2 or 3, which means:
- Either the token is invalid (step 2)
- Or the user profile doesn't exist in KV store (step 3)

## ✅ Step 1: Verify User Profile Exists

Run this SQL to check if Roderick's profile exists and has the correct role:

```sql
SELECT 
  key,
  value->>'id' as user_id,
  value->>'email' as email,
  value->>'name' as name,
  value->>'role' as role
FROM kv_store_d8ea749c
WHERE key = 'user:7823766f-ebac-4c64-84c8-6715ebfa7a26';
```

**Expected Result:**
- `key`: `user:7823766f-ebac-4c64-84c8-6715ebfa7a26`
- `role`: `admin` (or `client` if update didn't work)

**If role is still `client`**, run the UPDATE query again.

## ✅ Step 2: Verify User ID Matches

The backend uses the user ID from Supabase Auth to look up the profile. Check if the IDs match:

1. **Get User ID from Supabase Auth**:
   - Go to **Supabase Dashboard → Authentication → Users**
   - Find `roderickmoodie@yahoo.com`
   - Copy the **User ID**

2. **Compare with KV store**:
   - The KV store key should be: `user:USER_ID_FROM_AUTH`
   - If they don't match, that's the problem!

## ✅ Step 3: Check Edge Function Logs

After attempting to log in, check Edge Function logs:

1. Go to **Supabase Dashboard → Edge Functions → `make-server-d8ea749c` → Logs**
2. Look for:
   - `Error getting user in auth/me route:` - Token issue
   - `User profile not found` - Profile missing
   - Any other error messages

## ✅ Step 4: Test Token Manually

The token might be invalid. Check if it's being sent correctly:

1. **Open browser console** after login
2. **Check localStorage**:
```javascript
// In browser console
localStorage.getItem('sb-adhcefafjzccdwvjsefs-auth-token')
// Or check what Supabase stores
```

3. **Test the token directly**:
```javascript
// In browser console (after login)
const token = 'YOUR_ACCESS_TOKEN_HERE';
fetch('https://adhcefafjzccdwvjsefs.supabase.co/functions/v1/make-server-d8ea749c/auth/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

## 🔧 Common Issues & Fixes

### Issue 1: User Profile Not Found (404)

**Symptom**: Edge Function logs show "User profile not found"

**Fix**: The user ID in Supabase Auth doesn't match the key in KV store.

**Solution**:
1. Get the actual user ID from Supabase Auth
2. Check if a profile exists with that ID:
```sql
SELECT * FROM kv_store_d8ea749c 
WHERE value->>'email' = 'roderickmoodie@yahoo.com';
```
3. If profile exists but key is wrong, update it:
```sql
-- Delete old key
DELETE FROM kv_store_d8ea749c 
WHERE value->>'email' = 'roderickmoodie@yahoo.com';

-- Insert with correct key (replace USER_ID with actual ID from Auth)
INSERT INTO kv_store_d8ea749c (key, value)
VALUES (
  'user:USER_ID_FROM_AUTH',
  jsonb_build_object(
    'id', 'USER_ID_FROM_AUTH',
    'email', 'roderickmoodie@yahoo.com',
    'name', 'Roderick Moodie',
    'role', 'admin',
    'company', null,
    'createdAt', NOW()::text
  )
);
```

### Issue 2: Invalid Token (401)

**Symptom**: Edge Function logs show "Error getting user in auth/me route"

**Fix**: Token might be expired or invalid.

**Solution**:
1. **Log out and log back in** to get a fresh token
2. **Check if token refresh is working** in the frontend
3. **Verify Supabase secrets** are set correctly in Edge Function

### Issue 3: Backend Supabase Client Not Configured

**Symptom**: All requests fail with 401

**Fix**: Check Edge Function environment variables.

**Solution**:
1. Go to **Supabase Dashboard → Edge Functions → `make-server-d8ea749c` → Settings**
2. Verify these secrets are set:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_ANON_KEY`

## 🎯 Quick Diagnostic Query

Run this to see all user profiles and their IDs:

```sql
SELECT 
  key,
  value->>'id' as kv_user_id,
  value->>'email' as email,
  value->>'name' as name,
  value->>'role' as role
FROM kv_store_d8ea749c
WHERE key LIKE 'user:%'
ORDER BY value->>'createdAt' DESC;
```

Then compare the `kv_user_id` with the actual User ID from Supabase Auth.

---

## 📝 Next Steps

1. **Run Step 1** to verify the profile exists and role is correct
2. **Check Edge Function logs** after attempting login
3. **Compare User IDs** between Supabase Auth and KV store
4. **Report back** what you find!
