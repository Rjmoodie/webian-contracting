# Scripts

## backfill-missing-profiles.sql

Creates **profile** rows for any user in `auth.users` who doesn’t have one yet. Use this if you get **401 Unauthorized** on the Client or Admin dashboard (e.g. “Try logging out and back in, or ensure your user has a profile”).

**How to run**

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. Go to **SQL Editor** → **New query**.
3. Paste the contents of `backfill-missing-profiles.sql`.
4. Click **Run**.

Then log out and log back in (or refresh); the dashboard should load.

---

## set-admin-role.sql

Sets the **role** for a user to `admin` by email (e.g. after signing up as client by mistake).

**How to run**

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. Go to **SQL Editor** (left sidebar).
3. Click **New query**.
4. Paste the contents of `set-admin-role.sql`.
5. (Optional) Change `rodzrj@gmail.com` to another email if needed.
6. Click **Run**.

After it runs, that user can log in and will be sent to the admin portal.

---

## Edge Function secrets (ALLOWED_ADMIN_EMAILS)

If you don’t see “Settings” or “Secrets” on the Edge Function page:

- Try **Project Settings** (gear icon) → **Edge Functions** → select the function → **Secrets** or **Environment variables**.
- Or open the function → look for **Secrets**, **Env vars**, or **Configuration** in the tabs/top bar.

If your project doesn’t expose secrets for that function, you can still use this SQL script to make specific users admins instead of restricting signup by email.
