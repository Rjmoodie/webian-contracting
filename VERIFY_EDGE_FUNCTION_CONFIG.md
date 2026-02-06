# Verify Edge Function Configuration

## 🔴 Critical Issue

The 401 errors suggest the Edge Function can't validate access tokens. This is likely because:

1. **Environment variables not set correctly**
2. **Supabase client misconfigured**
3. **Token validation failing**

## ✅ Step 1: Verify Edge Function Secrets

Go to **Supabase Dashboard → Edge Functions → `make-server-d8ea749c` → Settings → Secrets**

Verify these are set:

### Required Secrets:
- `SUPABASE_URL` = `https://adhcefafjzccdwvjsefs.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY` = (Your service role key - long JWT token)
- `SUPABASE_ANON_KEY` = (Your anon key - optional but recommended)

### How to Get Service Role Key:
1. Go to **Supabase Dashboard → Project Settings → API**
2. Under **Project API keys**, find **`service_role`** (secret)
3. Copy the key (it's a long JWT token starting with `eyJ...`)

**⚠️ Important**: The service role key is different from the anon key!

## ✅ Step 2: Check Edge Function Logs

After adding the improved logging, try logging in again and check:

**Supabase Dashboard → Edge Functions → `make-server-d8ea749c` → Logs**

Look for:
- `[AUTH/ME] Validating token...`
- `[AUTH/ME] Error getting user:` (if token validation fails)
- `[AUTH/ME] User validated, ID:` (if token validation succeeds)
- `[AUTH/ME] User profile not found in KV store` (if profile missing)

## ✅ Step 3: Test Token Validation

The Edge Function uses:
```typescript
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);
```

Then validates tokens with:
```typescript
const { data: { user }, error } = await supabase.auth.getUser(accessToken);
```

**If `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` are empty**, token validation will fail.

## 🔧 Quick Fix

### Option 1: Verify Secrets Are Set

1. Go to Edge Function Settings → Secrets
2. Check that `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` exist
3. If missing, add them:
   - `SUPABASE_URL`: `https://adhcefafjzccdwvjsefs.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY`: (Get from Project Settings → API → service_role key)

### Option 2: Redeploy Edge Function

After setting secrets, you may need to redeploy:

1. Go to **Edge Functions → `make-server-d8ea749c`**
2. Click **"Redeploy"** or **"Deploy"**
3. Wait for deployment to complete
4. Try logging in again

## 🎯 Expected Log Output

After fixing, you should see in logs:

```
[AUTH/ME] Validating token...
[AUTH/ME] User validated, ID: 7823766f-ebac-4c64-84c8-6715ebfa7a26
[AUTH/ME] User profile found, role: admin
```

If you see:
```
[AUTH/ME] Error getting user: [error message]
```

That tells us exactly what's wrong.

## 📝 Next Steps

1. **Verify secrets are set** (Step 1)
2. **Check logs after login** (Step 2)
3. **Share the log output** - This will tell us exactly what's failing

---

**Most Likely Issue**: `SUPABASE_SERVICE_ROLE_KEY` is missing or incorrect in Edge Function secrets.
