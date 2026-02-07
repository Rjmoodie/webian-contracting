# Deploy RFQ updates to Supabase & Google Maps API key

## 1. Deploy to Supabase

**You must be logged in first.** In your terminal (from the project root):

```bash
npx supabase login
```

This opens a browser to sign in. Alternatively, set an access token:

1. Go to https://supabase.com/dashboard/account/tokens
2. Generate a token and set: `export SUPABASE_ACCESS_TOKEN=your_token`
3. Then run the commands below.

**If the project isn’t linked yet:**

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
```

(`YOUR_PROJECT_REF` is in Supabase Dashboard → Project Settings → General.)

---

### Run all deployments (recommended)

From the project root:

```bash
npm run supabase:deploy:all
```

This runs **db push** then **functions deploy** in one go.

---

### Or run step by step

**A. Database migration** (new columns for RFQ description + addresses)

```bash
npm run supabase:db:push
# or: npx supabase db push
```

If you prefer to run SQL manually: **Supabase Dashboard → SQL Editor**, paste and run the contents of  
`supabase/migrations/20260208000000_add_rfq_description_and_places.sql`.

**B. Edge function** (updated RFQ handler)

```bash
npm run supabase:deploy
# or: npx supabase functions deploy make-server-d8ea749c --no-verify-jwt
```

Add `--project-ref YOUR_PROJECT_REF` if you need to target a specific project.

---

## 2. Where to find the Google Maps API key

1. **Open Google Cloud Console**  
   https://console.cloud.google.com/

2. **Create or select a project**  
   Top bar: click the project name → **New Project** (e.g. "Webian RFQ") or select an existing one.

3. **Enable the required APIs**  
   - Go to **APIs & Services → Library**  
     https://console.cloud.google.com/apis/library  
   - Search and enable:
     - **Maps JavaScript API**
     - **Places API** (for address autocomplete)

4. **Create an API key**  
   - Go to **APIs & Services → Credentials**  
     https://console.cloud.google.com/apis/credentials  
   - Click **+ Create Credentials** → **API key**  
   - Copy the key. (Optional: restrict it by API and by HTTP referrer for your domain later.)

5. **Use the key in your app**  
   In the project root, create or edit `.env`:

   ```
   VITE_GOOGLE_MAPS_API_KEY=your_pasted_key_here
   ```

   Restart the dev server after changing `.env`. For production, add the same variable in your hosting env (e.g. Hostinger, Vercel).

---

## Summary

| Step | Command / action |
|------|-------------------|
| DB migration | `npx supabase db push` (or run the new migration SQL in Dashboard) |
| Edge function | `npx supabase functions deploy make-server-d8ea749c --no-verify-jwt` |
| Google key | **Google Cloud Console → APIs & Services → Credentials → Create Credentials → API key**; enable **Maps JavaScript API** and **Places API** |
