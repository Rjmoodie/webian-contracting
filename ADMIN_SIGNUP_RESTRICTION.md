# Restrict Admin Signup to Allowed Emails

Only the emails you list can complete **Admin signup** (`/admin-signup`). All other users who try to sign up as admin on that page will get: *"Admin signup is restricted. Contact support."*

## Where to set it

1. Open your **Supabase** project.
2. In the left sidebar go to **Edge Functions**.
3. Open the function **`make-server-d8ea749c`**.
4. Go to **Settings** (or the **Secrets** / env vars section for that function).
5. Add a **secret** (environment variable):
   - **Name:** `ALLOWED_ADMIN_EMAILS`
   - **Value:** comma-separated list of allowed emails, no spaces (e.g. `rodzrj@gmail.com,admin@yourcompany.com`).

## Examples

| Value | Effect |
|-------|--------|
| `rodzrj@gmail.com` | Only this email can complete admin signup. |
| `rodzrj@gmail.com,admin@webiancontracting.com` | Both can complete admin signup. |
| *(not set)* | Any email can use the Admin signup page. |

## After changing it

Redeploy the edge function so the new value is picked up (e.g. **Redeploy** in the function’s page, or `supabase functions deploy make-server-d8ea749c`).

## Notes

- Emails are compared case-insensitively.
- Existing users are unchanged; this only affects **new** signups via the Admin signup page.
- To make an existing account an admin, edit the **`profiles`** table in Supabase (Table Editor): set **`role`** to `admin` for that user.
