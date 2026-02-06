# Marvin's Login Information

## Email
**marvinmoodiem@yahoo.com**

## Password
❌ **I don't have Marvin's password stored**

The password would have been set when:
1. Marvin was created in Supabase Auth (manually)
2. Or when Marvin signed up through the app

## How to Get/Reset Password

### Option 1: Check Supabase Auth

1. Go to **Supabase Dashboard → Authentication → Users**
2. Search for `marvinmoodiem@yahoo.com`
3. If the account exists:
   - You can see when it was created
   - You can reset the password (click on the user → Reset Password)
   - Or set a new password manually

### Option 2: Reset Password via Email

If Marvin has access to `marvinmoodiem@yahoo.com`:
1. Go to your app's login page
2. Click "Forgot Password" (if available)
3. Enter the email
4. Check email for reset link

### Option 3: Set New Password Manually

1. Go to **Supabase Dashboard → Authentication → Users**
2. Find `marvinmoodiem@yahoo.com`
3. Click on the user
4. Click **"Reset Password"** or **"Update User"**
5. Set a new password
6. Share the new password with Marvin

### Option 4: Create Account if It Doesn't Exist

If Marvin's account doesn't exist yet:
1. Go to your app's signup page
2. Sign up with:
   - Email: `marvinmoodiem@yahoo.com`
   - Password: (choose a secure password)
   - Name: `Marvin Moodie`
   - Role: `Admin`
3. Then update the KV store to make him admin (if needed)

## Check if Account Exists

Run this SQL in Supabase Dashboard → SQL Editor:

```sql
-- Check if Marvin exists in KV store
SELECT 
  key,
  value->>'email' as email,
  value->>'name' as name,
  value->>'role' as role
FROM kv_store_d8ea749c
WHERE value->>'email' = 'marvinmoodiem@yahoo.com';
```

Then check **Authentication → Users** to see if the Supabase Auth account exists.

---

**Quick Answer**: Email is `marvinmoodiem@yahoo.com`, but you'll need to check/reset the password in Supabase Dashboard.
