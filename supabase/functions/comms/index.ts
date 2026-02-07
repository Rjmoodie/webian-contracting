/**
 * Comms Edge Function
 * Handles: project messages, inbound email webhook
 */
import { createApp } from "../_shared/cors.ts";
import { getAuthUser } from "../_shared/auth.ts";
import { supabase } from "../_shared/supabase.ts";
import { logActivity } from "../_shared/activity.ts";
import { emailWrap, emailBtn, platformUrl, notifyProjectParticipants, esc } from "../_shared/email.ts";
import { verifyResendWebhook } from "../_shared/webhook.ts";

const app = createApp();

app.get("/comms/health", (c) => c.json({ status: "ok", fn: "comms" }));

// ── List messages ─────────────────────────────────────────
app.get("/comms/:id/messages", async (c) => {
  try {
    const { profile, error } = await getAuthUser(c);
    if (error || !profile) return c.json({ error: "Unauthorized" }, 401);
    const projectId = c.req.param("id");

    const { data: project } = await supabase.from("projects").select("client_id").eq("id", projectId).single();
    if (!project) return c.json({ error: "Project not found" }, 404);
    if (profile.role === "client" && project.client_id !== profile.id) return c.json({ error: "Forbidden" }, 403);

    let query = supabase.from("project_messages").select("*").eq("project_id", projectId).order("created_at", { ascending: true });
    if (profile.role === "client") query = query.eq("is_internal", false);

    const { data, error: fetchError } = await query;
    if (fetchError) return c.json({ error: fetchError.message }, 500);
    return c.json({ messages: data || [] });
  } catch (error) {
    return c.json({ error: "Failed to fetch messages" }, 500);
  }
});

// ── Send message ──────────────────────────────────────────
app.post("/comms/:id/messages", async (c) => {
  try {
    const { profile, error } = await getAuthUser(c);
    if (error || !profile) return c.json({ error: "Unauthorized" }, 401);
    const projectId = c.req.param("id");
    const { body: msgBody, isInternal } = await c.req.json();
    if (!msgBody?.trim()) return c.json({ error: "Message body is required" }, 400);

    const { data: project } = await supabase.from("projects").select("client_id, project_name").eq("id", projectId).single();
    if (!project) return c.json({ error: "Project not found" }, 404);
    if (profile.role === "client" && project.client_id !== profile.id) return c.json({ error: "Forbidden" }, 403);

    const internal = profile.role === "client" ? false : !!isInternal;
    const { data: message, error: insertError } = await supabase.from("project_messages").insert({
      project_id: projectId, sender_id: profile.id, sender_name: profile.name,
      sender_role: profile.role, body: msgBody.trim(), is_internal: internal, source: "panel",
    }).select("*").single();
    if (insertError) return c.json({ error: insertError.message }, 500);

    await logActivity({ projectId, userId: profile.id, userName: profile.name, userRole: profile.role, action: "message_sent", details: { body: msgBody.trim(), isInternal: internal } });

    if (!internal) {
      const safeBody = esc(msgBody.trim());
      notifyProjectParticipants({ projectId, excludeUserId: profile.id, subject: `${esc(project.project_name ?? "Project")} — New message from ${esc(profile.name)}`, html: emailWrap(`<h2 style="margin:0 0 16px;color:#333;font-size:22px">New Message</h2><p style="color:#555;font-size:15px;line-height:1.6"><strong>${esc(profile.name)}</strong> (${esc(profile.role)}) wrote:</p><div style="background:#f8f8f8;border-left:4px solid #E2582A;padding:16px;margin:16px 0;border-radius:8px"><p style="margin:0;color:#333;font-size:14px;line-height:1.6;white-space:pre-wrap">${safeBody}</p></div><p style="color:#999;font-size:13px">Reply to this email or use the platform.</p>${emailBtn("View Conversation", `${platformUrl()}?requestId=${projectId}`)}`) }).catch((e) => console.error("[EMAIL] comms notify failed", { projectId, err: e }));
    }

    return c.json({ message });
  } catch (error) {
    return c.json({ error: "Failed to send message" }, 500);
  }
});

// ── Inbound email webhook (Resend) ────────────────────────
// Resend email.received does NOT include body; we must fetch it via Receiving API.
const INBOUND_BODY_MAX = 20_000;
const RESEND_API_KEY = () => Deno.env.get("RESEND_API_KEY") ?? "";

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

type InboundContext = { req: { text: () => Promise<string>; raw: { headers: Headers } }; json: (body: unknown, status?: number) => Response };
async function handleInboundEmail(c: InboundContext) {
  let rawBody: string;
  try {
    rawBody = await c.req.text();
  } catch {
    return { response: c.json({ ok: false, reason: "invalid body" }, 400) };
  }

  const hasSecret = !!Deno.env.get("RESEND_WEBHOOK_SECRET");
  if (hasSecret) {
    const valid = await verifyResendWebhook(rawBody, c.req.raw.headers);
    if (!valid) return { response: c.json({ ok: false, reason: "invalid signature" }, 401) };
  }

  let payload: {
    type?: string;
    data?: { email_id?: string; from?: string; to?: string[]; subject?: string; text?: string; html?: string };
    from?: string | { address?: string };
    to?: string | string[];
    subject?: string;
    text?: string;
    text_plain?: string;
    stripped_text?: string;
  };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return { response: c.json({ ok: false, reason: "invalid json" }, 400) };
  }

  let from: string | undefined;
  let toAddress: string | undefined;
  let subject: string | undefined;
  let rawText = "";

  // Resend email.received: type + data; body is NOT in webhook — fetch via API
  if (payload.type === "email.received" && payload.data?.email_id) {
    const data = payload.data;
    from = typeof data.from === "string" ? data.from : undefined;
    toAddress = Array.isArray(data.to) ? data.to[0] : undefined;
    subject = data.subject;

    const apiKey = RESEND_API_KEY();
    if (!apiKey) {
      console.warn("[comms] RESEND_API_KEY not set — cannot fetch received email body");
      return { response: c.json({ ok: false, reason: "receiving not configured" }, 200) };
    }
    try {
      const res = await fetch(`https://api.resend.com/emails/receiving/${data.email_id}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!res.ok) {
        const errText = await res.text();
        console.error("[comms] Resend Receiving API error", res.status, errText);
        return { response: c.json({ ok: false, reason: `failed to fetch email: ${res.status}` }, 200) };
      }
      const email = await res.json() as { text?: string | null; html?: string | null };
      rawText = (email.text ?? (email.html ? stripHtml(email.html) : "") ?? "").toString();
    } catch (e) {
      console.error("[comms] Resend Receiving API fetch failed", e);
      return { response: c.json({ ok: false, reason: "fetch body failed" }, 200) };
    }
  } else {
    // Legacy or alternate payload: body might be in payload
    from = payload.from as string | undefined;
    const to = payload.to;
    toAddress = Array.isArray(to) ? to[0] : (typeof to === "string" ? to : undefined);
    subject = payload.subject;
    rawText = (payload.text ?? payload.text_plain ?? (payload.data as { stripped_text?: string } | undefined)?.stripped_text ?? "").toString();
  }

  const cleanBody = rawText
    .slice(0, INBOUND_BODY_MAX)
    .replace(/\r\n/g, "\n")
    .split(/\n--\n|\nOn .+ wrote:|\n_{3,}/)[0]
    .trim();
  if (!cleanBody) return { response: c.json({ ok: false, reason: "empty body" }, 200) };

  const match = toAddress?.match?.(/project\+([a-f0-9-]+)@/i);
  if (!match) return { response: c.json({ ok: false, reason: "no project id" }, 200) };
  const projectId = match[1];

  const senderEmail = typeof from === "string" ? from.replace(/.*<(.+)>.*/, "$1").trim() : (from as { address?: string } | undefined)?.address ?? "";
  const { data: senderProfile } = await supabase.from("profiles").select("id, name, role, email").ilike("email", senderEmail).single();

  const senderName = senderProfile?.name || senderEmail || "Unknown";
  const senderRole = senderProfile?.role || "external";

  const { data: message, error: insertError } = await supabase.from("project_messages").insert({
    project_id: projectId,
    sender_id: senderProfile?.id || null,
    sender_name: senderName,
    sender_role: senderRole,
    body: cleanBody,
    is_internal: false,
    source: "email",
  }).select("*").single();
  if (insertError) return { response: c.json({ ok: false, reason: insertError.message }, 200) };

  await logActivity({ projectId, userId: senderProfile?.id || "00000000-0000-0000-0000-000000000000", userName: senderName, userRole: senderRole, action: "message_received_email", details: { subject, from: senderEmail } });
  const safeBody = esc(cleanBody);
  notifyProjectParticipants({ projectId, excludeUserId: senderProfile?.id, subject: esc(subject || "Reply on project"), html: emailWrap(`<h2 style="margin:0 0 16px;color:#333;font-size:22px">New Reply</h2><p style="color:#555;font-size:15px;line-height:1.6"><strong>${esc(senderName)}</strong> replied via email:</p><div style="background:#f8f8f8;border-left:4px solid #E2582A;padding:16px;margin:16px 0;border-radius:8px"><p style="margin:0;color:#333;font-size:14px;line-height:1.6;white-space:pre-wrap">${safeBody}</p></div>${emailBtn("View Conversation", `${platformUrl()}?requestId=${projectId}`)}`) }).catch((e) => console.error("[EMAIL] inbound notify failed", { projectId, err: e }));

  return { response: c.json({ ok: true, messageId: message?.id }) };
}

app.post("/comms/webhooks/inbound-email", async (c) => {
  const { response } = await handleInboundEmail(c);
  return response;
});
// Path without /comms prefix (Supabase may pass path after function name)
app.post("/webhooks/inbound-email", async (c) => {
  const { response } = await handleInboundEmail(c);
  return response;
});

app.all("/comms/*", (c) => c.json({ error: "Route not found", path: c.req.path }, 404));

Deno.serve(app.fetch);
