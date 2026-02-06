# Test User Setup Guide

## 🎯 The Issue

Your `kv_store_d8ea749c` table is empty, which means no user profiles exist yet. The backend requires user profiles to be stored in this table for authentication to work.

## ✅ Solution: Create a Test User

### Option 1: Sign Up Through the App (Recommended)

1. **Go to the signup page** in your app
2. **Fill out the form**:
   - Email: `test@example.com` (or any email)
   - Password: `test123456` (at least 6 characters)
   - Name: `Test User`
   - Role: Select `Client` (or any role)
   - Company: (optional)
3. **Click "Sign Up"**
4. **Check the KV store table** - you should now see a row with key like `user:USER_ID`

### Option 2: Check Edge Function Logs

After signing up, check if it worked:

1. Go to: https://supabase.com/dashboard/project/adhcefafjzccdwvjsefs/functions
2. Click **`make-server-d8ea749c`**
3. Click **Logs** tab
4. Look for messages like:
   - `[SIGNUP] Successfully created auth user: userId=...`
   - `[SIGNUP] Successfully saved user profile to KV store`

### Option 3: Verify in Database

After signup, check the table again:

```sql
SELECT * FROM kv_store_d8ea749c WHERE key LIKE 'user:%';
```

You should see at least one row with a user profile.

## 🔍 Troubleshooting Signup

### If Signup Fails

**Check Edge Function Logs** for errors:
- Missing secrets? (Should be set already)
- Database connection issue?
- KV store table permissions?

**Common Errors:**

1. **"Signup failed"** - Check Edge Function logs
2. **"Missing required fields"** - Ensure all fields are filled
3. **"User already exists"** - Email is already in Supabase Auth

### If User Exists in Auth But Not in KV Store

If you manually created users in Supabase Auth, they won't have profiles in the KV store. You have two options:

**Option A: Delete and Re-signup**
1. Delete the user from Supabase Auth (Authentication → Users)
2. Sign up again through the app

**Option B: Create Profile Manually** (Advanced)
You'd need to manually insert into the KV store, but it's easier to just re-signup.

## ✅ Success Checklist

After signing up, verify:

- [ ] User appears in **Supabase Auth** → **Users**
- [ ] User profile exists in **Database** → `kv_store_d8ea749c` table (key: `user:USER_ID`)
- [ ] Can log in successfully
- [ ] No 401 errors after login
- [ ] Dashboard loads correctly

## 🧪 Quick Test

1. **Sign up** a test client user
2. **Log in** with that user
3. **Check browser console** - should see no 401 errors
4. **Check KV store** - should see the user profile

Once you have at least one user profile in the KV store, the 401 errors should stop (assuming secrets are set correctly).

---

**Next Step**: Try signing up a test user through the app and let me know if it works!
