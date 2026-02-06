# Make Roderick and Marvin Admins

## ✅ Step 1: Make Roderick Moodie an Admin

Run this SQL query in **Supabase Dashboard → SQL Editor**:

```sql
UPDATE kv_store_d8ea749c
SET value = jsonb_set(
  value,
  '{role}',
  '"admin"'
)
WHERE key = 'user:7823766f-ebac-4c64-84c8-6715ebfa7a26';
```

**Verify it worked:**
```sql
SELECT 
  value->>'email' as email,
  value->>'name' as name,
  value->>'role' as role
FROM kv_store_d8ea749c
WHERE key = 'user:7823766f-ebac-4c64-84c8-6715ebfa7a26';
```

You should see `role: admin`.

---

## ✅ Step 2: Make Marvin Moodie Primary Admin

### Option A: If Marvin Already Exists in Supabase Auth

1. **Get Marvin's User ID**:
   - Go to **Supabase Dashboard → Authentication → Users**
   - Search for `marvinmoodiem@yahoo.com`
   - Copy the **User ID** (UUID format, like `abc123-def456-...`)

2. **Check if Marvin has a profile in KV store**:
```sql
SELECT 
  key,
  value->>'id' as user_id,
  value->>'email' as email,
  value->>'name' as name,
  value->>'role' as role
FROM kv_store_d8ea749c
WHERE value->>'email' = 'marvinmoodiem@yahoo.com';
```

3. **If Marvin exists in KV store**, update to admin:
```sql
UPDATE kv_store_d8ea749c
SET value = jsonb_set(
  value,
  '{role}',
  '"admin"'
)
WHERE value->>'email' = 'marvinmoodiem@yahoo.com';
```

4. **If Marvin doesn't exist in KV store**, create profile (replace `MARVIN_USER_ID` with the ID from step 1):
```sql
INSERT INTO kv_store_d8ea749c (key, value)
VALUES (
  'user:MARVIN_USER_ID',
  jsonb_build_object(
    'id', 'MARVIN_USER_ID',
    'email', 'marvinmoodiem@yahoo.com',
    'name', 'Marvin Moodie',
    'role', 'admin',
    'company', null,
    'createdAt', NOW()::text
  )
);
```

### Option B: If Marvin Doesn't Exist in Supabase Auth

1. **Create Marvin in Supabase Auth**:
   - Go to **Supabase Dashboard → Authentication → Users → Add User**
   - Email: `marvinmoodiem@yahoo.com`
   - Password: (set a secure password)
   - **Auto Confirm User**: ✅ (check this)
   - Click **Create User**
   - **Copy the User ID** that appears

2. **Create Marvin's profile in KV store** (replace `MARVIN_USER_ID` with the ID from step 1):
```sql
INSERT INTO kv_store_d8ea749c (key, value)
VALUES (
  'user:MARVIN_USER_ID',
  jsonb_build_object(
    'id', 'MARVIN_USER_ID',
    'email', 'marvinmoodiem@yahoo.com',
    'name', 'Marvin Moodie',
    'role', 'admin',
    'company', null,
    'createdAt', NOW()::text
  )
);
```

---

## ✅ Step 3: Verify Both Admins

Run this to see all admins:

```sql
SELECT 
  value->>'email' as email,
  value->>'name' as name,
  value->>'role' as role,
  value->>'createdAt' as created_at
FROM kv_store_d8ea749c
WHERE key LIKE 'user:%'
  AND value->>'role' = 'admin'
ORDER BY value->>'createdAt' DESC;
```

You should see:
- `roderickmoodie@yahoo.com` - Admin
- `marvinmoodiem@yahoo.com` - Admin

---

## 🎯 Next Steps

1. **Update Roderick** (Step 1) ✅
2. **Create/Update Marvin** (Step 2) ✅
3. **Verify both admins** (Step 3) ✅
4. **Test login**:
   - Log in as Roderick → Should access Admin Dashboard
   - Log in as Marvin → Should access Admin Dashboard
5. **401 errors should stop** after login

---

## 📝 Quick Reference

**Roderick's User ID**: `7823766f-ebac-4c64-84c8-6715ebfa7a26`  
**Marvin's Email**: `marvinmoodiem@yahoo.com`

**All SQL queries are in `MAKE_ADMINS.sql`** for easy copy/paste.
