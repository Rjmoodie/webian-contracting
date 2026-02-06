# Fix 401 on auth/me and /requests (apply verify_jwt = false)

## What’s going on

- Browser: **GET /auth/me** and **GET /requests** return **401**.
- Logs: only **OPTIONS** for those paths; **no GET** requests.
- So the **Supabase gateway** is rejecting the request (JWT check) **before** your function runs. Your code never sees the GET.

`supabase/config.toml` in this repo sets `verify_jwt = false` for your function so the gateway stops checking the JWT and forwards the request. Your function still checks the token with `supabase.auth.getUser(accessToken)`.

**That config is only applied when you deploy with the Supabase CLI.**  
Dashboard “Redeploy” / “Deploy” does **not** use your local `config.toml`, so 401 will continue until you deploy from the CLI.

---

## Steps to apply the fix

### 1. Install Supabase CLI (if needed)

```bash
# macOS (Homebrew)
brew install supabase/tap/supabase
```

Or: https://supabase.com/docs/guides/cli

### 2. Log in and link the project

From the **project root** (where `supabase/config.toml` lives):

```bash
cd /Users/user/Desktop/EventCoverageJamaica/Eventcoveragejamaica

# Log in (opens browser)
supabase login

# Link this folder to your project (use the ref from the Dashboard URL: adhcefafjzccdwvjsefs)
supabase link --project-ref adhcefafjzccdwvjsefs
```

### 3. Match folder name to the Dashboard function name

The CLI uses the **folder name** as the function name. Your Dashboard function is **make-server-d8ea749c**, but the code is in **supabase/functions/server/**. To update that same function, the folder must be named **make-server-d8ea749c**:

```bash
# From project root
mv supabase/functions/server supabase/functions/make-server-d8ea749c
```

(If you skip this and deploy `server`, you’ll get a separate function named "server" and your app would need to call that URL instead.)

### 4. Deploy with JWT verification disabled

```bash
supabase functions deploy make-server-d8ea749c --no-verify-jwt
```

**`--no-verify-jwt`** makes the gateway stop returning 401 so GET requests reach your function. Your code still checks the token with `getUser(accessToken)`.

**If you already deployed before:** There’s a known CLI quirk where toggling `verify_jwt` on an existing function sometimes doesn’t stick. If you still get 401 after deploying:

1. In Dashboard: **Edge Functions → make-server-d8ea749c → Delete** (or remove the function).
2. Run `supabase functions deploy make-server-d8ea749c --no-verify-jwt` again.

Then the new deployment will have JWT verification off.

### 5. Confirm

1. Reload the app and log in (or open client dashboard).
2. In **Edge Function → Logs** you should see lines like:
   - `[EDGE] ... GET /make-server-d8ea749c/auth/me`
   - `[AUTH/ME] Validating token...`
3. 401 on GET /auth/me and GET /requests should stop (as long as the token you send is valid).

---

## If you can’t use the CLI

Then the project is not deployed from this repo with the CLI, and Supabase won’t see your `config.toml`. In that case you have two options:

1. **Start using CLI for this project** (recommended): run the steps above so `config.toml` and `--no-verify-jwt` apply.
2. **Check the Dashboard** for any “Function settings” / “Configuration” where you can disable JWT verification for this function (if your Supabase plan exposes that).

Once the gateway no longer verifies the JWT and your function receives the GET requests, the 401 issue for auth/me and requests will be resolved.
