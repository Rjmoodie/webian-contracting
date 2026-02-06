# Supabase Setup Guide

This guide covers the required Supabase configuration for the Event Coverage Platform.

## 🔑 Required Environment Variables

Your Supabase Edge Function needs these environment variables to work properly:

### 1. Go to Supabase Dashboard
1. Navigate to your project: https://supabase.com/dashboard/project/adhcefafjzccdwvjsefs
2. Go to **Project Settings** → **Edge Functions**
3. Scroll to **Secrets** section

### 2. Add Required Secrets

Add these two secrets:

```bash
SUPABASE_URL=https://adhcefafjzccdwvjsefs.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

#### How to Get SUPABASE_URL:
- Your project URL: `https://adhcefafjzccdwvjsefs.supabase.co`

#### How to Get SUPABASE_SERVICE_ROLE_KEY:
1. Go to **Project Settings** → **API**
2. Scroll to **Project API keys**
3. Copy the **`service_role`** key (⚠️ Keep this secret! Never expose it in frontend code)
4. Paste it as `SUPABASE_SERVICE_ROLE_KEY` in Edge Functions secrets

### 3. Verify Secrets Are Set

After adding secrets, they should appear in the Edge Functions secrets list.

## 📊 Database Setup

### 1. KV Store Table

The backend uses a KV store table. Verify it exists:

1. Go to **Database** → **Tables**
2. Look for table: `kv_store_d8ea749c`
3. If it doesn't exist, create it with this SQL:

```sql
CREATE TABLE IF NOT EXISTS kv_store_d8ea749c (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for prefix searches
CREATE INDEX IF NOT EXISTS idx_kv_store_prefix ON kv_store_d8ea749c (key text_pattern_ops);
```

### 2. Row Level Security (RLS)

The KV store table should have RLS enabled but allow service role access:

```sql
-- Enable RLS
ALTER TABLE kv_store_d8ea749c ENABLE ROW LEVEL SECURITY;

-- Allow service role to access everything (for Edge Functions)
CREATE POLICY "Service role can access all" ON kv_store_d8ea749c
  FOR ALL
  USING (auth.role() = 'service_role');
```

## 🚀 Edge Function Deployment

### 1. Deploy the Edge Function

If you haven't deployed the Edge Function yet:

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref adhcefafjzccdwvjsefs

# Deploy the function
supabase functions deploy make-server-d8ea749c
```

### 2. Verify Function is Deployed

1. Go to **Edge Functions** in Supabase Dashboard
2. You should see `make-server-d8ea749c` in the list
3. Click on it to see logs and verify it's running

## ✅ Testing the Setup

### 1. Test Health Endpoint

```bash
curl https://adhcefafjzccdwvjsefs.supabase.co/functions/v1/make-server-d8ea749c/health
```

Should return: `{"status":"ok"}`

### 2. Test Authentication

1. **Sign up a test user** through the frontend
2. **Check Supabase Dashboard**:
   - Go to **Authentication** → **Users**
   - Verify the user was created
   - Check that `user_metadata` has `role`, `name`, etc.

3. **Check KV Store**:
   - Go to **Database** → **Table Editor** → `kv_store_d8ea749c`
   - Look for a key like `user:USER_ID`
   - Verify the user profile exists

### 3. Test Login

1. Try logging in with the test user
2. Check browser console for errors
3. If 401 errors persist, check:
   - Edge Function logs in Supabase Dashboard
   - Verify secrets are set correctly
   - Verify user profile exists in KV store

## 🔍 Troubleshooting

### Issue: "Invalid login credentials"
**Solution**: 
- Verify the user exists in Supabase Auth
- Check email/password are correct
- Ensure user was created through the signup endpoint (not manually)

### Issue: 401 Unauthorized on `/auth/me`
**Possible Causes**:
1. **Missing environment variables**: Check Edge Functions secrets
2. **User profile doesn't exist**: User must be created through signup endpoint
3. **Token expired**: Try logging in again
4. **Service role key incorrect**: Verify the key in Project Settings → API

**Solution**:
- Check Edge Function logs in Supabase Dashboard
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly
- Ensure user profile exists in `kv_store_d8ea749c` table

### Issue: 401 Unauthorized on `/requests`
**Possible Causes**:
1. Token not being passed correctly
2. User profile missing from KV store
3. Service role key not configured

**Solution**:
- Check browser Network tab - verify `Authorization: Bearer TOKEN` header is present
- Verify user profile exists in KV store
- Check Edge Function logs for detailed error messages

### Issue: "User profile not found"
**Solution**:
- User must sign up through the `/auth/signup` endpoint
- The signup endpoint creates both:
  - Supabase Auth user
  - User profile in KV store
- If user was created manually in Supabase, they won't have a profile in KV store

## 📝 Quick Checklist

- [ ] `SUPABASE_URL` secret is set in Edge Functions
- [ ] `SUPABASE_SERVICE_ROLE_KEY` secret is set in Edge Functions
- [ ] `kv_store_d8ea749c` table exists in database
- [ ] RLS policy allows service role access
- [ ] Edge Function `make-server-d8ea749c` is deployed
- [ ] Test user can sign up successfully
- [ ] Test user profile exists in KV store
- [ ] Test user can log in successfully

## 🔐 Security Notes

- **Never expose `SUPABASE_SERVICE_ROLE_KEY`** in frontend code
- Only use it in Edge Functions (backend)
- The service role key bypasses RLS - use with caution
- Always validate user permissions in your Edge Function code

## 📞 Next Steps

1. Set up the environment variables (most important!)
2. Verify the KV store table exists
3. Test signup and login
4. Check Edge Function logs if issues persist

---

**Need Help?** Check the Edge Function logs in Supabase Dashboard for detailed error messages.
