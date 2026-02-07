# Wire Up the Email System

The app uses **Resend** to send emails. Code is already in place; you only need to add secrets and (optionally) verify your domain.

---

## 1. Get a Resend API key

1. Go to **[resend.com](https://resend.com)** and sign up (free tier: 100 emails/day).
2. In the dashboard go to **API Keys** → **Create API Key**.
3. Copy the key (it starts with `re_`).

---

## 2. Add secrets to Supabase

Secrets are set **per project** and apply to all Edge Functions that use them.

1. Open **Supabase Dashboard** → your project.
2. Go to **Project Settings** (gear) → **Edge Functions**.
3. In **Secrets**, add:

| Secret | Value | Required |
|--------|--------|----------|
| `RESEND_API_KEY` | `re_xxxx...` (your key) | **Yes** – without it, no emails are sent (you’ll see a log: "RESEND_API_KEY not set — skipping"). |
| `PLATFORM_URL` | Your app URL, e.g. `https://webiancontracting.com` | **No** – default is `https://webiancontracting.com`. Used for "View Request" / "Review Quote" links in emails. |
| `NOTIFICATION_TO_EMAIL` | Main team inbox, e.g. `gpr@webiancontracting.com` | **No** – when set, all notification emails are sent TO this address (and still to the client when relevant). |
| `NOTIFICATION_CC_EMAILS` | Comma-separated CC list, e.g. `webiancontracting@gmail.com,marvinmoodiewebiancontracting@gmail.com` | **No** – when set, these addresses are CC’d on all participant/team notifications. |
| `EMAIL_FROM_NAME` | e.g. `Webian Contracting` | **No** – default is "Webian Contracting". |
| `EMAIL_FROM_DOMAIN` | e.g. `notifications@webiancontracting.com` | **No** – default is `notifications@webiancontracting.com`. For custom domains you must verify the domain in Resend (see below). |
| `INBOUND_EMAIL_DOMAIN` | Receiving domain for reply-to addresses, e.g. `reply.webiancontracting.com` | **No** – default is `reply.webiancontracting.com`. Must be set up for **receiving** in Resend (see §6) so client replies flow into the app. |
| `RESEND_WEBHOOK_SECRET` | Webhook signing secret from Resend (Receiving → Webhook → Signing secret) | **No** – when set, inbound-email webhook requests are verified (HMAC). If unset, verification is skipped so existing setups keep working. |

**Minimum to go live:** set **`RESEND_API_KEY`**. Set **`PLATFORM_URL`** if your app is on a different URL. Set **`NOTIFICATION_TO_EMAIL`** and **`NOTIFICATION_CC_EMAILS`** so all updates go to your team inbox with CC.

---

## 3. (Optional) Use your own domain

To send from e.g. `notifications@webiancontracting.com`:

1. In **Resend Dashboard** → **Domains** → **Add Domain**.
2. Add the DNS records Resend shows (SPF, DKIM, etc.) at your DNS provider.
3. After the domain is verified, set the secret **`EMAIL_FROM_DOMAIN`** to that address (e.g. `notifications@webiancontracting.com`).

Until the domain is verified, you can use Resend’s **sandbox domain** (e.g. `onboarding@resend.dev`) for testing: set **`EMAIL_FROM_DOMAIN`** to that address.

---

## 4. Which functions send email?

These Edge Functions use the shared email helper and therefore need the secrets available (they all use the same project secrets):

- **auth** – (signup flows if any send email)
- **projects** – new RFQ → email to admins + confirmation to client; status change/cancel → notify participants
- **quotes** – quote sent / accepted / rejected → notify participants
- **comms** – new message → notify participants; inbound webhook for email replies

If you deploy the **modular** functions (`projects`, `quotes`, `comms`, `auth`), they all read from the same Supabase **Edge Function secrets**, so one set of secrets is enough.

If you use the single **make-server-d8ea749c** function instead, set the same secrets for that project; that one function handles all the above flows.

---

## 5. Verify it works

1. Deploy the functions that send email (e.g. `projects`, `quotes`, `comms`, or `make-server-d8ea749c`).
2. Trigger an action that sends email, e.g.:
   - **Send quote to client** (quotes) → client and admins should get “Quote Ready”.
   - **Client submits RFQ** (projects) → admins + client confirmation.
   - **Change status** (projects) → “Status Update” to participants.
3. In **Resend Dashboard** → **Emails**, check that the emails appear and are delivered (or see any bounces/failures).

If nothing is sent, check Edge Function logs for: `[EMAIL] RESEND_API_KEY not set — skipping`. That means the secret is missing or the function wasn’t redeployed after adding it.

---

## 6. Custom domain for receiving (reply flow)

The code supports a **reply-to** address like `project+<id>@reply.webiancontracting.com` so replies can be tied to a project. That requires:

1. **`INBOUND_EMAIL_DOMAIN`** secret set to e.g. `reply.webiancontracting.com`.
2. In Resend, **Inbound** set up for that domain and a webhook pointing to your **comms** (or server) endpoint:  
   `POST .../comms/webhooks/inbound-email` (or the equivalent route on make-server).
3. **`RESEND_WEBHOOK_SECRET`** (recommended): In Resend → Inbound → your webhook → copy the **Signing secret**. Add it as a Supabase secret. The comms function will verify each webhook request with HMAC; invalid or replayed requests are rejected with 401. If you don't set it, the endpoint still accepts payloads (so existing setups work), but anyone could POST fake replies.

If you skip inbound, outbound emails still work; only “reply by email and have it show in the project” won’t work until inbound is configured.

---

## Summary

| Step | Action |
|------|--------|
| 1 | Get **RESEND_API_KEY** from resend.com. |
| 2 | In Supabase → Project Settings → Edge Functions → Secrets, add **RESEND_API_KEY** (and optionally **PLATFORM_URL**, **EMAIL_FROM_DOMAIN**, **EMAIL_FROM_NAME**). |
| 3 | Redeploy the Edge Functions that send email (so they see the new secrets). |
| 4 | Trigger a “quote sent” or “new request” and confirm in Resend that the email was sent. |

After that, the email system is wired and all quote, request, status, and message notifications will send through Resend.
