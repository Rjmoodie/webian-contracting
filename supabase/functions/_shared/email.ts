/**
 * Shared email helpers — Resend API, templates, project notifications.
 */
import { supabase } from "./supabase.ts";

// ── Config (read from env) ────────────────────────────────
const RESEND_KEY = () => Deno.env.get("RESEND_API_KEY") ?? "";
const PLATFORM   = () => Deno.env.get("PLATFORM_URL") ?? "https://webiancontracting.com";
const FROM_NAME  = () => Deno.env.get("EMAIL_FROM_NAME") ?? "Webian Contracting";
const FROM_ADDR  = () => Deno.env.get("EMAIL_FROM_DOMAIN") ?? "notifications@webiancontracting.com";
const INBOUND    = () => Deno.env.get("INBOUND_EMAIL_DOMAIN") ?? "reply.webiancontracting.com";
// Main team inbox (TO) and CC list for all notification emails (comma-separated for CC)
const NOTIFICATION_TO_EMAIL = () => Deno.env.get("NOTIFICATION_TO_EMAIL") ?? "";
const NOTIFICATION_CC_EMAILS = () => (Deno.env.get("NOTIFICATION_CC_EMAILS") ?? "").split(",").map((e) => e.trim()).filter(Boolean);

const RESEND_TIMEOUT_MS = 12_000;
const RETRY_DELAYS_MS = [0, 500, 1500];
const RETRY_STATUSES = [429, 500, 502, 503, 504];

/** Escape user-controlled content for safe HTML interpolation. */
export function esc(s: string): string {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function fetchWithTimeout(input: string, init: RequestInit, ms = RESEND_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(t));
}

/** Strip very basic HTML for plain-text alternative. */
function htmlToText(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>|<\/div>|<\/tr>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function sendWithRetry(
  payload: Record<string, unknown>,
  key: string,
  idempotencyKey: string
): Promise<{ ok: boolean; status?: number; data?: { id?: string }; text?: string }> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    "Idempotency-Key": idempotencyKey,
  };
  for (let i = 0; i < RETRY_DELAYS_MS.length; i++) {
    if (RETRY_DELAYS_MS[i]) await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[i]));
    try {
      const res = await fetchWithTimeout("https://api.resend.com/emails", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      if (res.ok) return { ok: true, data: await res.json() };
      const text = await res.text().catch(() => "");
      if (!RETRY_STATUSES.includes(res.status) || i === RETRY_DELAYS_MS.length - 1) {
        return { ok: false, status: res.status, text };
      }
    } catch (e) {
      if (i === RETRY_DELAYS_MS.length - 1) return { ok: false, text: String(e) };
    }
  }
  return { ok: false };
}

// ── Low-level send ────────────────────────────────────────
export async function sendEmail(params: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  cc?: string | string[];
  replyTo?: string;
  headers?: Record<string, string>;
  eventId?: string;
}): Promise<{ success: boolean; messageId?: string }> {
  const key = RESEND_KEY();
  if (!key) {
    console.warn("[EMAIL] RESEND_API_KEY not set — skipping");
    return { success: false };
  }
  const idempotencyKey = params.headers?.["X-Event-Id"] ?? params.eventId ?? crypto.randomUUID();
  try {
    const payload: Record<string, unknown> = {
      from: `${FROM_NAME()} <${FROM_ADDR()}>`,
      to: Array.isArray(params.to) ? params.to : [params.to],
      subject: params.subject,
      html: params.html,
      text: params.text ?? htmlToText(params.html),
      reply_to: params.replyTo,
      headers: params.headers,
    };
    if (params.cc && (Array.isArray(params.cc) ? params.cc.length : 1)) {
      payload.cc = Array.isArray(params.cc) ? params.cc : [params.cc];
    }
    const result = await sendWithRetry(payload, key, idempotencyKey);
    if (!result.ok) {
      console.error("[EMAIL] send failed", { status: result.status, text: result.text });
      return { success: false };
    }
    console.log("[EMAIL] sent", { to: params.to, subject: params.subject });
    return { success: true, messageId: result.data?.id };
  } catch (e: unknown) {
    console.error("[EMAIL] error", { err: e });
    return { success: false };
  }
}

// ── Templates ─────────────────────────────────────────────
export function emailWrap(inner: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,.1)">
<tr><td style="background:linear-gradient(135deg,#E2582A 0%,#c74a22 100%);padding:32px;text-align:center">
<h1 style="margin:0;color:#fff;font-size:24px;font-weight:bold">Webian Contracting</h1>
<p style="margin:8px 0 0;color:rgba(255,255,255,.9);font-size:13px">Geotechnical &amp; Geological Solutions</p></td></tr>
<tr><td style="padding:40px 32px">${inner}</td></tr>
<tr><td style="background:#f8f8f8;padding:24px 32px;border-top:1px solid #e5e5e5">
<p style="margin:0;color:#999;font-size:12px">This is an automated notification. Reply directly to this email or use the platform.</p>
</td></tr></table></td></tr></table></body></html>`;
}

export function emailBtn(text: string, url: string) {
  return `<table cellpadding="0" cellspacing="0" style="margin:24px 0"><tr>
<td style="background:#E2582A;border-radius:8px;padding:14px 28px">
<a href="${esc(url)}" style="color:#fff;text-decoration:none;font-weight:600;font-size:15px">${esc(text)}</a>
</td></tr></table>`;
}

// ── Helpers ───────────────────────────────────────────────
export function projectReplyTo(projectId: string) {
  return `project+${projectId}@${INBOUND()}`;
}

export function platformUrl() {
  return PLATFORM();
}

/** Team inbox for admin-only emails (e.g. new RFQ). Returns { to, cc } from NOTIFICATION_TO_EMAIL and NOTIFICATION_CC_EMAILS. */
export function getTeamNotificationRecipients(): { to: string[]; cc: string[] } {
  const main = NOTIFICATION_TO_EMAIL();
  if (!main) return { to: [], cc: [] };
  return { to: [main], cc: NOTIFICATION_CC_EMAILS() };
}

/**
 * Send email to all project participants (client + main team inbox),
 * excluding the sender. Uses NOTIFICATION_TO_EMAIL as primary team recipient
 * and NOTIFICATION_CC_EMAILS as CC when set in env.
 */
export async function notifyProjectParticipants(opts: {
  projectId: string;
  excludeUserId?: string;
  subject: string;
  html: string;
}) {
  try {
    const { data: project } = await supabase
      .from("projects")
      .select("client_email, client_name, project_name")
      .eq("id", opts.projectId)
      .single();
    if (!project) return;

    const toList = new Set<string>();
    const mainTo = NOTIFICATION_TO_EMAIL();
    if (mainTo) toList.add(mainTo);
    if (project.client_email) toList.add(project.client_email);
    if (!mainTo) {
      const { data: admins } = await supabase
        .from("profiles")
        .select("id, email")
        .in("role", ["admin", "manager"]);
      (admins || []).forEach((a: { email?: string }) => {
        if (a.email?.trim()) toList.add(a.email.trim());
      });
    }

    if (opts.excludeUserId) {
      const { data: sender } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", opts.excludeUserId)
        .single();
      if (sender?.email) toList.delete(sender.email);
    }

    if (toList.size === 0) return;

    const replyToAddr = projectReplyTo(opts.projectId);
    const replyDomain = replyToAddr.includes("@") ? replyToAddr.split("@")[1] : "";
    console.log("[EMAIL] notify reply_to domain:", replyDomain);

    const ccList = NOTIFICATION_CC_EMAILS();
    await sendEmail({
      to: Array.from(toList),
      cc: ccList.length > 0 ? ccList : undefined,
      subject: opts.subject,
      html: opts.html,
      replyTo: replyToAddr,
      headers: { "X-Project-Id": opts.projectId },
      eventId: `notify-${opts.projectId}-${crypto.randomUUID()}`,
    });
  } catch (e) {
    console.error("[NOTIFY] error", { projectId: opts.projectId, err: e });
  }
}
