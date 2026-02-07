# Deploy Project Media & Featured Portfolio

These steps apply the **project media** and **featured portfolio** changes (migrations + edge functions).

## 1. Log in to Supabase (once)

```bash
supabase login
```

Or set an access token:

```bash
export SUPABASE_ACCESS_TOKEN=your_token_here
```

(Get a token from: [Supabase Dashboard → Account → Access Tokens](https://supabase.com/dashboard/account/tokens).)

## 2. Link the project (if not already linked)

From the repo root:

```bash
cd /Users/user/Desktop/website_template
supabase link --project-ref YOUR_PROJECT_REF
```

`YOUR_PROJECT_REF` is the ID from your Supabase project URL: `https://YOUR_PROJECT_REF.supabase.co`.

## 3. Run deployments

**Option A – DB + portfolio functions (recommended)**

```bash
npm run supabase:deploy:db-and-portfolio
```

This runs:

1. `supabase db push` – applies migrations (adds `featured` / `featured_at` on `projects`, creates `project_media` table and `project-media` storage bucket).
2. Deploys the **projects** and **lookups** edge functions (with `--no-verify-jwt`).

**Option B – Step by step**

```bash
npm run supabase:db:push
npm run supabase:deploy:portfolio
```

**Option C – Only edge functions** (if migrations were already applied)

```bash
npm run supabase:deploy:portfolio
```

## 4. Verify

- **Dashboard**: Edge Functions → **projects** and **lookups** show a recent “Last deployed” time.
- **Database**: In Table Editor, `projects` has columns `featured` and `featured_at`, and the `project_media` table exists.
- **Storage**: A bucket **project-media** exists.

After this, project media uploads, the “Feature on public site” toggle, and the public Portfolio page will use the new backend.
