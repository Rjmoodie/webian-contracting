# Quick Fix: Supabase 401 Errors

## 🚨 Immediate Action Required

The 401 errors you're seeing are likely because **environment variables are not set** in your Supabase Edge Function.

## ⚡ 5-Minute Fix

### Step 1: Get Your Service Role Key

1. Go to: https://supabase.com/dashboard/project/adhcefafjzccdwvjsefs/settings/api
2. Scroll to **Project API keys**
3. Find the **`service_role`** key (starts with `eyJ...`)
4. **Copy it** (you'll need it in Step 2)

⚠️ **Warning**: This key has admin access. Never expose it in frontend code!

### Step 2: Set Edge Function Secrets

1. Go to: https://supabase.com/dashboard/project/adhcefafjzccdwvjsefs/functions
2. Click on **`make-server-d8ea749c`** function
3. Go to **Settings** tab
4. Scroll to **Secrets** section
5. Click **Add Secret** and add these two:

**Secret 1:**
- **Name**: `SUPABASE_URL`
- **Value**: `https://adhcefafjzccdwvjsefs.supabase.co`

**Secret 2:**
- **Name**: `SUPABASE_SERVICE_ROLE_KEY`
- **Value**: `[paste the service_role key from Step 1]`

6. Click **Save** for each secret

### Step 3: Verify KV Store Table Exists

1. Go to: https://supabase.com/dashboard/project/adhcefafjzccdwvjsefs/editor
2. Check if table `kv_store_d8ea749c` exists
3. If it doesn't exist, run this SQL in **SQL Editor**:

```sql
CREATE TABLE IF NOT EXISTS kv_store_d8ea749c (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kv_store_prefix ON kv_store_d8ea749c (key text_pattern_ops);

ALTER TABLE kv_store_d8ea749c ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can access all" ON kv_store_d8ea749c
  FOR ALL
  USING (auth.role() = 'service_role');
```

### Step 4: Test

1. **Sign up a new user** through the frontend
2. **Try logging in**
3. Check **Edge Function logs** in Supabase Dashboard if errors persist

## 🔍 How to Check Edge Function Logs

1. Go to: https://supabase.com/dashboard/project/adhcefafjzccdwvjsefs/functions
2. Click **`make-server-d8ea749c`**
3. Click **Logs** tab
4. Look for error messages

## ✅ Success Indicators

After setting secrets, you should see:
- ✅ Login works without 401 errors
- ✅ `/auth/me` returns user profile
- ✅ `/requests` returns requests (for clients)
- ✅ No "User profile not found" errors

## 🐛 Still Getting 401?

### Check 1: Secrets Are Set
- Go to Edge Function → Settings → Secrets
- Verify both secrets are listed

### Check 2: User Profile Exists
- Go to Database → Table Editor → `kv_store_d8ea749c`
- Look for key like `user:USER_ID`
- If missing, user needs to sign up through the app (not manually)

### Check 3: Edge Function is Deployed
- Go to Edge Functions list
- Verify `make-server-d8ea749c` shows as "Active"

### Check 4: Service Role Key is Correct
- Go to Project Settings → API
- Copy the `service_role` key again
- Verify it matches what you set in secrets

## 📝 Common Issues

**"Invalid login credentials"**
- ✅ Normal error if email/password is wrong
- ✅ Check credentials are correct

**401 on `/auth/me`**
- ❌ Missing `SUPABASE_SERVICE_ROLE_KEY` secret
- ❌ User profile doesn't exist in KV store
- ✅ Fix: Set secrets + ensure user signed up through app

**401 on `/requests`**
- ❌ Same as above
- ❌ User doesn't have proper role
- ✅ Fix: Set secrets + verify user profile exists

---

**Most Common Issue**: Missing `SUPABASE_SERVICE_ROLE_KEY` secret in Edge Functions.

Set it and the 401 errors should disappear! 🎉
