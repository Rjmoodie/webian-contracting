# Check Current Admins in Database

## 🎯 How Admin Roles Work

The system has **4 roles**:
- `admin` - Full access (can change user roles)
- `manager` - Elevated access (can manage talent, requests)
- `client` - Can create requests
- `talent` - Can apply for jobs

**Admin roles are stored in the KV store** (`kv_store_d8ea749c` table) with the key format: `user:USER_ID`

## 📊 SQL Queries to Check Admins

### 1. Check All Admins and Managers in KV Store

Run this in **Supabase Dashboard → SQL Editor**:

```sql
SELECT 
  key,
  value->>'id' as user_id,
  value->>'email' as email,
  value->>'name' as name,
  value->>'role' as role,
  value->>'company' as company,
  value->>'createdAt' as created_at
FROM kv_store_d8ea749c
WHERE key LIKE 'user:%'
  AND (value->>'role' = 'admin' OR value->>'role' = 'manager')
ORDER BY value->>'createdAt' DESC;
```

### 2. Check All Users (Any Role)

```sql
SELECT 
  key,
  value->>'id' as user_id,
  value->>'email' as email,
  value->>'name' as name,
  value->>'role' as role,
  value->>'company' as company,
  value->>'createdAt' as created_at
FROM kv_store_d8ea749c
WHERE key LIKE 'user:%'
ORDER BY value->>'role', value->>'createdAt' DESC;
```

### 3. Count Users by Role

```sql
SELECT 
  value->>'role' as role,
  COUNT(*) as count
FROM kv_store_d8ea749c
WHERE key LIKE 'user:%'
GROUP BY value->>'role'
ORDER BY count DESC;
```

### 4. Check Supabase Auth Users (for comparison)

**Note**: You can't directly query Supabase Auth users via SQL, but you can check them in:
- **Supabase Dashboard → Authentication → Users**

This shows all users in Supabase Auth, but they may not have profiles in the KV store.

## 🔍 Expected Results

### If KV Store is Empty (Current State)

You'll see:
```
Success. No rows returned
```

This means:
- ❌ No user profiles exist yet
- ❌ No admins exist
- ❌ No users can log in successfully (401 errors)

### If Users Exist

You'll see rows like:
```
key: user:abc123...
user_id: abc123...
email: admin@example.com
name: Admin User
role: admin
company: null
created_at: 2026-01-25T...
```

## ✅ How to Create an Admin

### Option 1: Sign Up as Admin (Recommended)

1. Go to your app's signup page
2. Fill out the form:
   - Email: `admin@example.com`
   - Password: `securepassword123`
   - Name: `Admin User`
   - **Role: Select "Admin"** (if available in dropdown)
   - Company: (optional)
3. Click "Sign Up"
4. Verify in KV store using query #1 above

### Option 2: Sign Up as Any Role, Then Promote

1. Sign up as any role (e.g., "Client")
2. Log in as an existing admin
3. Go to **Admin Dashboard → User Management**
4. Find the user and change their role to "Admin"

**Note**: This requires at least one admin to already exist.

### Option 3: Manual Database Insert (Advanced)

If you need to create an admin manually:

1. **First, create the user in Supabase Auth**:
   - Go to **Authentication → Users → Add User**
   - Enter email and password
   - Note the User ID

2. **Then insert into KV store**:
```sql
INSERT INTO kv_store_d8ea749c (key, value)
VALUES (
  'user:USER_ID_HERE',
  jsonb_build_object(
    'id', 'USER_ID_HERE',
    'email', 'admin@example.com',
    'name', 'Admin User',
    'role', 'admin',
    'company', null,
    'createdAt', NOW()::text
  )
);
```

Replace `USER_ID_HERE` with the actual user ID from Supabase Auth.

## 🎯 Quick Check

Run this simple query to see if ANY users exist:

```sql
SELECT COUNT(*) as total_users
FROM kv_store_d8ea749c
WHERE key LIKE 'user:%';
```

- **0** = No users (current state)
- **> 0** = Users exist, check their roles

## 📝 Next Steps

1. **Run the queries above** to check current state
2. **If no admins exist**: Sign up a test admin user
3. **Verify the admin appears** in the KV store
4. **Test login** with the admin account
5. **Check if 401 errors stop** after login

---

**Run Query #1 now** and let me know what you see!
