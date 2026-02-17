import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2";

// ── Email helpers (inline — keeps single-file deployment) ──────────
const RESEND_API_KEY = () => Deno.env.get('RESEND_API_KEY') ?? '';
const PLATFORM_URL  = () => Deno.env.get('PLATFORM_URL') ?? 'https://webiancontracting.com';
const FROM_NAME     = () => Deno.env.get('EMAIL_FROM_NAME') ?? 'Webian Contracting';
const FROM_DOMAIN   = () => Deno.env.get('EMAIL_FROM_DOMAIN') ?? 'notifications@webiancontracting.com';

async function sendEmail(params: { to: string | string[]; subject: string; html: string; replyTo?: string; headers?: Record<string, string> }) {
  const key = RESEND_API_KEY();
  if (!key) { console.warn('[EMAIL] RESEND_API_KEY not set — skipping'); return { success: false }; }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: `${FROM_NAME()} <${FROM_DOMAIN()}>`,
        to: Array.isArray(params.to) ? params.to : [params.to],
        subject: params.subject,
        html: params.html,
        reply_to: params.replyTo,
        headers: params.headers,
      }),
    });
    if (!res.ok) { console.error('[EMAIL] send failed:', await res.text()); return { success: false }; }
    const data = await res.json();
    console.log(`[EMAIL] sent to ${params.to}: ${params.subject}`);
    return { success: true, messageId: data.id };
  } catch (e: any) { console.error('[EMAIL] error:', e); return { success: false }; }
}

function emailWrap(inner: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,.1)">
<tr><td style="background:linear-gradient(135deg,#E2582A 0%,#c74a22 100%);padding:32px;text-align:center">
<h1 style="margin:0;color:#fff;font-size:24px;font-weight:bold">Webian Contracting</h1>
<p style="margin:8px 0 0;color:rgba(255,255,255,.9);font-size:13px">Geophysics &amp; Geotechnical Solutions</p></td></tr>
<tr><td style="padding:40px 32px">${inner}</td></tr>
<tr><td style="background:#f8f8f8;padding:24px 32px;border-top:1px solid #e5e5e5">
<p style="margin:0;color:#999;font-size:12px">This is an automated notification from Webian Contracting. Reply directly to this email or use the platform.</p>
</td></tr></table></td></tr></table></body></html>`;
}

function emailBtn(text: string, url: string) {
  return `<table cellpadding="0" cellspacing="0" style="margin:24px 0"><tr>
<td style="background:#E2582A;border-radius:8px;padding:14px 28px">
<a href="${url}" style="color:#fff;text-decoration:none;font-weight:600;font-size:15px">${text}</a>
</td></tr></table>`;
}

// Generates a unique reply-to address for threading, e.g. project+<id>@inbound.domain.com
function projectReplyTo(projectId: string) {
  const domain = Deno.env.get('INBOUND_EMAIL_DOMAIN') ?? 'reply.webiancontracting.com';
  return `project+${projectId}@${domain}`;
}

// Fire-and-forget helper — sends email to project participants
async function notifyProjectParticipants(opts: {
  projectId: string;
  excludeUserId?: string;
  subject: string;
  html: string;
}) {
  try {
    // Fetch project to get client info
    const { data: project } = await supabase
      .from('projects')
      .select('client_email, client_name, project_name')
      .eq('id', opts.projectId)
      .single();
    if (!project) return;

    // Fetch admin/manager emails
    const { data: admins } = await supabase
      .from('profiles')
      .select('id, email')
      .in('role', ['admin', 'manager']);

    const recipients = new Set<string>();
    if (project.client_email) recipients.add(project.client_email);
    (admins || []).forEach((a: any) => recipients.add(a.email));

    // Optionally exclude the sender so they don't email themselves
    if (opts.excludeUserId) {
      const { data: sender } = await supabase.from('profiles').select('email').eq('id', opts.excludeUserId).single();
      if (sender?.email) recipients.delete(sender.email);
    }

    if (recipients.size === 0) return;

    await sendEmail({
      to: Array.from(recipients),
      subject: opts.subject,
      html: opts.html,
      replyTo: projectReplyTo(opts.projectId),
      headers: { 'X-Project-Id': opts.projectId },
    });
  } catch (e) { console.error('[NOTIFY] error:', e); }
}

const app = new Hono();

// Log all incoming requests
app.use('*', async (c, next) => {
  console.log(`[EDGE] ${c.req.method} ${c.req.path}`);
  await next();
});

app.use('*', logger(console.log));

// CORS
app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
}));

// Supabase admin client (service role – full access, bypasses RLS)
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// ────────────────────────────────────────────
// Helper: get authenticated user + profile
// ────────────────────────────────────────────
async function getAuthUser(c: any) {
  const token = c.req.header('Authorization')?.split(' ')[1];
  if (!token) return { user: null, profile: null, error: 'No auth token' };

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return { user: null, profile: null, error: error?.message || 'Unauthorized' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return { user, profile, error: null };
}

// Helper: log activity
async function logActivity(data: {
  projectId: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  oldValue?: string;
  newValue?: string;
  details?: any;
}) {
  await supabase.from('activity_log').insert({
    project_id: data.projectId,
    user_id: data.userId,
    user_name: data.userName,
    user_role: data.userRole,
    action: data.action,
    old_value: data.oldValue || null,
    new_value: data.newValue || null,
    details: data.details || null,
  });
}

// ────────────────────────────────────────────
// HEALTH
// ────────────────────────────────────────────
app.get("/make-server-d8ea749c/health", (c) => c.json({ status: "ok" }));

// ════════════════════════════════════════════
//  AUTH ROUTES
// ════════════════════════════════════════════

// Sign up
app.post("/make-server-d8ea749c/auth/signup", async (c) => {
  try {
    const { email, password, name, role, company, phone, adminSignup } = await c.req.json();
    if (!email || !password || !name || !role) {
      return c.json({ error: "Missing required fields" }, 400);
    }
    // Allow admin/manager only when signing up via the admin-signup page (adminSignup: true)
    const allowedAdminEmails = (Deno.env.get('ALLOWED_ADMIN_EMAILS') ?? '').trim().toLowerCase().split(',').filter(Boolean);
    const isAllowedAdminSignup =
      adminSignup === true &&
      (role === 'admin' || role === 'manager') &&
      (allowedAdminEmails.length === 0 || allowedAdminEmails.includes((email ?? '').trim().toLowerCase()));
    if (!isAllowedAdminSignup && allowedAdminEmails.length > 0 && (role === 'admin' || role === 'manager')) {
      return c.json({ error: "Admin signup is restricted. Contact support." }, 403);
    }
    const safeRole = isAllowedAdminSignup ? role : (role === 'client' ? 'client' : 'client');

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role: safeRole, company },
      email_confirm: true,
    });

    if (authError) {
      return c.json({ error: authError.message }, 400);
    }

    // The trigger `on_auth_user_created` auto-creates the profile row.
    // But we may need to add phone if provided
    if (phone) {
      await supabase.from('profiles').update({ phone }).eq('id', authData.user.id);
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    return c.json({ user: profile });
  } catch (error) {
    console.error("Signup error:", error);
    return c.json({ error: "Signup failed" }, 500);
  }
});

// Get current user profile
app.get("/make-server-d8ea749c/auth/me", async (c) => {
  try {
    const { profile, error } = await getAuthUser(c);
    if (error || !profile) {
      return c.json({ error: error || "Profile not found" }, 401);
    }
    return c.json({ user: profile });
  } catch (error) {
    console.error("Auth/me error:", error);
    return c.json({ error: "Failed to get user" }, 500);
  }
});

// ════════════════════════════════════════════
//  LOOKUP DATA (public)
// ════════════════════════════════════════════

// Get service types
app.get("/make-server-d8ea749c/services", async (c) => {
  try {
    const { data, error } = await supabase.from('service_types').select('*');
    if (error) return c.json({ error: error.message }, 500);
    // Map to match old frontend format (services array)
    return c.json({ services: data });
  } catch (error) {
    return c.json({ error: "Failed to fetch service types" }, 500);
  }
});

// Get client ratings (admin)
app.get("/make-server-d8ea749c/client-ratings", async (c) => {
  try {
    const { data, error } = await supabase.from('client_ratings').select('*');
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ ratings: data });
  } catch (error) {
    return c.json({ error: "Failed to fetch client ratings" }, 500);
  }
});

// Combined lookups (service types + client ratings)
app.get("/make-server-d8ea749c/lookups", async (c) => {
  try {
    const [serviceTypes, clientRatings] = await Promise.all([
      supabase.from('service_types').select('*'),
      supabase.from('client_ratings').select('*'),
    ]);
    return c.json({
      serviceTypes: serviceTypes.data || [],
      clientRatings: clientRatings.data || [],
      riskProfiles: [
        { value: 'low', label: 'Low', multiplier: 4 },
        { value: 'medium', label: 'Medium', multiplier: 5 },
        { value: 'high', label: 'High', multiplier: 7 },
      ],
      serviceRateFactors: {
        gpsGridLayout: 0.06,
        dataCollection: 0.37,
        dataProcessing: 0.23,
        evaluationReporting: 0.34,
      },
    });
  } catch (error) {
    return c.json({ error: "Failed to fetch lookups" }, 500);
  }
});

// ════════════════════════════════════════════
//  PROJECT / RFQ ROUTES
// ════════════════════════════════════════════

// Create new project (RFQ) – Client only
app.post("/make-server-d8ea749c/requests", async (c) => {
  try {
    const { profile, error } = await getAuthUser(c);
    if (error || !profile) return c.json({ error: "Unauthorized" }, 401);
    if (profile.role !== 'client') return c.json({ error: "Only clients can submit RFQs" }, 403);

    const body = await c.req.json();
    const {
      projectName,
      projectDescription,
      projectLocation,
      projectAddress,
      projectAddressLat,
      projectAddressLng,
      projectAddressPlaceId,
      serviceTypeId,
      investigationType,
      surveyAreaSqm,
      clearanceAccess,
      mobilizationNeeded,
      accommodationNeeded,
      serviceHeadCount,
      notes,
    } = body;

    if (!projectName || !projectDescription || !projectLocation || !serviceTypeId) {
      return c.json({ error: "Missing required fields: projectName, projectDescription, projectLocation, serviceTypeId" }, 400);
    }

    const projectRow = {
      client_id: profile.id,
      client_name: profile.company || profile.name,
      client_contact: profile.name,
      client_address: body.clientAddress || null,
      client_address_lat: body.clientAddressLat ?? null,
      client_address_lng: body.clientAddressLng ?? null,
      client_address_place_id: body.clientAddressPlaceId ?? null,
      client_email: profile.email,
      client_phone: profile.phone || null,
      project_name: projectName,
      project_description: projectDescription,
      project_location: projectLocation,
      project_address: projectAddress || null,
      project_address_lat: projectAddressLat ?? null,
      project_address_lng: projectAddressLng ?? null,
      project_address_place_id: projectAddressPlaceId ?? null,
      service_type_id: serviceTypeId,
      investigation_type: investigationType || null,
      survey_area_sqm: surveyAreaSqm || null,
      clearance_access: clearanceAccess || false,
      mobilization_cost: body.mobilizationCost || 0,
      accommodation_cost: body.accommodationCost || 0,
      service_head_count: serviceHeadCount || 1,
      client_notes: notes || null,
      status: 'rfq_submitted',
    };

    const { data: project, error: insertError } = await supabase
      .from('projects')
      .insert(projectRow)
      .select('*')
      .single();

    if (insertError) {
      console.error("Insert project error:", insertError);
      return c.json({ error: insertError.message }, 500);
    }

    // Log activity
    await logActivity({
      projectId: project.id,
      userId: profile.id,
      userName: profile.name,
      userRole: profile.role,
      action: 'rfq_submitted',
      details: { projectName, surveyAreaSqm },
    });

    // System message in comms panel
    await supabase.from('project_messages').insert({
      project_id: project.id,
      sender_name: 'System',
      sender_role: 'system',
      body: `New request submitted by ${profile.name} for "${projectName}".`,
      source: 'system',
    });

    // Email admins about new request
    const { data: adminList } = await supabase.from('profiles').select('email').in('role', ['admin', 'manager']);
    const adminEmails = (adminList || []).map((a: any) => a.email).filter(Boolean);
    if (adminEmails.length > 0) {
      sendEmail({
        to: adminEmails,
        subject: `New RFQ: ${projectName}`,
        html: emailWrap(`
          <h2 style="margin:0 0 16px;color:#333;font-size:22px">New Request Submitted</h2>
          <p style="color:#555;font-size:15px;line-height:1.6">
            <strong>${profile.name}</strong> has submitted a new request for <strong>${projectName}</strong> in <strong>${body.projectLocation}</strong>.
          </p>
          ${emailBtn('Review Request', `${PLATFORM_URL()}?requestId=${project.id}`)}
        `),
        replyTo: projectReplyTo(project.id),
      }).catch(() => {});
    }

    // Confirmation email to client
    sendEmail({
      to: profile.email,
      subject: `Request Received: ${projectName}`,
      html: emailWrap(`
        <h2 style="margin:0 0 16px;color:#333;font-size:22px">Request Received!</h2>
        <p style="color:#555;font-size:15px;line-height:1.6">
          Hi ${profile.name}, thank you for your request for <strong>${projectName}</strong>. Our team will review it and provide a quote shortly.
        </p>
        ${emailBtn('View Request', `${PLATFORM_URL()}?requestId=${project.id}`)}
      `),
      replyTo: projectReplyTo(project.id),
    }).catch(() => {});

    return c.json({ project });
  } catch (error) {
    console.error("Create project error:", error);
    return c.json({ error: "Failed to create project" }, 500);
  }
});

// List projects (role-based)
app.get("/make-server-d8ea749c/requests", async (c) => {
  try {
    const { profile, error } = await getAuthUser(c);
    if (error || !profile) return c.json({ error: "Unauthorized" }, 401);

    let query = supabase
      .from('projects')
      .select('*, service_types(name), client_ratings(name)')
      .order('created_at', { ascending: false });

    if (profile.role === 'client') {
      query = query.eq('client_id', profile.id);
    }
    // admin / manager see all

    const { data, error: fetchError } = await query;
    if (fetchError) return c.json({ error: fetchError.message }, 500);

    // Map to a shape the frontend expects (requests array)
    const requests = (data || []).map((p: any) => ({
      ...p,
      id: p.id,
      // compatibility: map project fields to old "request" field names the dashboard reads
      eventName: p.project_name,
      projectDescription: p.project_description,
      eventDate: p.created_at,
      parish: p.project_location,
      venue: p.project_address || p.project_location,
      projectAddressLat: p.project_address_lat,
      projectAddressLng: p.project_address_lng,
      clientName: p.client_name,
      clientEmail: p.client_email,
      clientAddress: p.client_address,
      clientAddressLat: p.client_address_lat,
      clientAddressLng: p.client_address_lng,
      serviceType: p.service_types?.name,
      clientRating: p.client_ratings?.name,
    }));

    return c.json({ requests });
  } catch (error) {
    console.error("List projects error:", error);
    return c.json({ error: "Failed to fetch projects" }, 500);
  }
});

// Get single project
app.get("/make-server-d8ea749c/requests/:id", async (c) => {
  try {
    const { profile, error } = await getAuthUser(c);
    if (error || !profile) return c.json({ error: "Unauthorized" }, 401);

    const projectId = c.req.param('id');

    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('*, service_types(name, base_rate, discount_rate), client_ratings(name, rate_jmd)')
      .eq('id', projectId)
      .single();

    if (fetchError || !project) return c.json({ error: "Project not found" }, 404);

    // Access check
    if (profile.role === 'client' && project.client_id !== profile.id) {
      return c.json({ error: "Forbidden" }, 403);
    }

    // Get line items
    const { data: lineItems } = await supabase
      .from('quote_line_items')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order');

    // Get activity log
    const { data: activityLog } = await supabase
      .from('activity_log')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    // Get attachments
    const { data: attachments } = await supabase
      .from('request_attachments')
      .select('id, file_path, file_name, file_size, content_type, created_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    // Get messages for comms panel
    let msgQuery = supabase
      .from('project_messages')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });
    if (profile.role === 'client') {
      msgQuery = msgQuery.eq('is_internal', false);
    }
    const { data: messages } = await msgQuery;

    // compatibility mapping
    const request = {
      ...project,
      eventName: project.project_name,
      projectDescription: project.project_description,
      eventDate: project.created_at,
      parish: project.project_location,
      venue: project.project_address || project.project_location,
      projectAddressLat: project.project_address_lat,
      projectAddressLng: project.project_address_lng,
      clientName: project.client_name,
      clientEmail: project.client_email,
      clientAddress: project.client_address,
      clientAddressLat: project.client_address_lat,
      clientAddressLng: project.client_address_lng,
      attachments: attachments || [],
    };

    return c.json({ request, lineItems: lineItems || [], activityLog: activityLog || [], messages: messages || [] });
  } catch (error) {
    console.error("Get project error:", error);
    return c.json({ error: "Failed to fetch project" }, 500);
  }
});

// Register attachments for a request (client uploads to Storage first, then calls this)
app.post("/make-server-d8ea749c/requests/:id/attachments", async (c) => {
  try {
    const { profile, error } = await getAuthUser(c);
    if (error || !profile) return c.json({ error: "Unauthorized" }, 401);

    const projectId = c.req.param('id');
    const body = await c.req.json();
    const { attachments: items } = body as { attachments: { file_path: string; file_name: string; file_size?: number; content_type?: string }[] };

    if (!Array.isArray(items) || items.length === 0) {
      return c.json({ error: "attachments array required" }, 400);
    }

    const { data: project } = await supabase
      .from('projects')
      .select('id, client_id')
      .eq('id', projectId)
      .single();

    if (!project || project.client_id !== profile.id) {
      return c.json({ error: "Forbidden" }, 403);
    }

    const rows = items.map((a: { file_path: string; file_name: string; file_size?: number; content_type?: string }) => ({
      project_id: projectId,
      file_path: a.file_path,
      file_name: a.file_name,
      file_size: a.file_size ?? null,
      content_type: a.content_type ?? null,
    }));

    const { data: inserted, error: insertError } = await supabase
      .from('request_attachments')
      .insert(rows)
      .select('id, file_path, file_name, file_size, content_type, created_at');

    if (insertError) {
      console.error("Insert attachments error:", insertError);
      return c.json({ error: insertError.message }, 500);
    }

    return c.json({ attachments: inserted });
  } catch (error) {
    console.error("Add attachments error:", error);
    return c.json({ error: "Failed to add attachments" }, 500);
  }
});

// Update project status (Admin/Manager)
app.put("/make-server-d8ea749c/requests/:id/status", async (c) => {
  try {
    const { profile, error } = await getAuthUser(c);
    if (error || !profile) return c.json({ error: "Unauthorized" }, 401);
    if (profile.role !== 'admin' && profile.role !== 'manager') {
      return c.json({ error: "Forbidden" }, 403);
    }

    const projectId = c.req.param('id');
    const { status, note } = await c.req.json();

    const validStatuses = [
      'rfq_submitted','under_review','quoted','quote_accepted','quote_rejected',
      'in_progress','data_processing','reporting','delivered','completed','cancelled'
    ];
    if (!validStatuses.includes(status)) {
      return c.json({ error: "Invalid status" }, 400);
    }

    // Get current project to log the old status
    const { data: current } = await supabase
      .from('projects')
      .select('status')
      .eq('id', projectId)
      .single();

    const updates: any = { status };
    if (status === 'quoted') updates.quoted_at = new Date().toISOString();
    if (status === 'quote_accepted') updates.accepted_at = new Date().toISOString();
    if (status === 'completed') updates.completed_at = new Date().toISOString();

    const { data: project, error: updateError } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId)
      .select('*')
      .single();

    if (updateError) return c.json({ error: updateError.message }, 500);

    await logActivity({
      projectId,
      userId: profile.id,
      userName: profile.name,
      userRole: profile.role,
      action: 'status_changed',
      oldValue: current?.status,
      newValue: status,
      details: note ? { note } : null,
    });

    // System message + email for status change
    const statusLabel = status.replace(/_/g, ' ').toUpperCase();
    await supabase.from('project_messages').insert({
      project_id: projectId,
      sender_id: profile.id,
      sender_name: profile.name,
      sender_role: profile.role,
      body: `Status changed to **${statusLabel}**${note ? `: ${note}` : ''}`,
      source: 'system',
    });
    notifyProjectParticipants({
      projectId,
      excludeUserId: profile.id,
      subject: `${project?.project_name ?? 'Project'} — Status: ${statusLabel}`,
      html: emailWrap(`
        <h2 style="margin:0 0 16px;color:#333;font-size:22px">Status Update</h2>
        <p style="color:#555;font-size:15px;line-height:1.6">
          <strong>${profile.name}</strong> changed the status to <strong>${statusLabel}</strong>.
        </p>
        ${note ? `<div style="background:#f8f8f8;border-left:4px solid #E2582A;padding:16px;margin:16px 0;border-radius:8px"><p style="margin:0;color:#333;font-size:14px">${note}</p></div>` : ''}
        ${emailBtn('View Request', `${PLATFORM_URL()}?requestId=${projectId}`)}
      `),
    }).catch(() => {});

    return c.json({ request: project });
  } catch (error) {
    console.error("Update status error:", error);
    return c.json({ error: "Failed to update status" }, 500);
  }
});

// Add note to project
app.post("/make-server-d8ea749c/requests/:id/notes", async (c) => {
  try {
    const { profile, error } = await getAuthUser(c);
    if (error || !profile) return c.json({ error: "Unauthorized" }, 401);

    const projectId = c.req.param('id');
    const { note } = await c.req.json();

    if (!note) return c.json({ error: "Note is required" }, 400);

    // Verify access
    const { data: project } = await supabase
      .from('projects')
      .select('client_id')
      .eq('id', projectId)
      .single();

    if (!project) return c.json({ error: "Project not found" }, 404);
    if (profile.role === 'client' && project.client_id !== profile.id) {
      return c.json({ error: "Forbidden" }, 403);
    }

    await logActivity({
      projectId,
      userId: profile.id,
      userName: profile.name,
      userRole: profile.role,
      action: 'note_added',
      details: { note },
    });

    return c.json({ success: true });
  } catch (error) {
    console.error("Add note error:", error);
    return c.json({ error: "Failed to add note" }, 500);
  }
});

// Cancel project
app.post("/make-server-d8ea749c/requests/:id/cancel", async (c) => {
  try {
    const { profile, error } = await getAuthUser(c);
    if (error || !profile) return c.json({ error: "Unauthorized" }, 401);

    const projectId = c.req.param('id');
    const { reason } = await c.req.json();

    const { data: project } = await supabase
      .from('projects')
      .select('client_id, status')
      .eq('id', projectId)
      .single();

    if (!project) return c.json({ error: "Project not found" }, 404);

    const isOwner = project.client_id === profile.id;
    const isAdmin = profile.role === 'admin';
    if (!isOwner && !isAdmin) return c.json({ error: "Forbidden" }, 403);

    const { data: updated, error: updateError } = await supabase
      .from('projects')
      .update({ status: 'cancelled' })
      .eq('id', projectId)
      .select('*')
      .single();

    if (updateError) return c.json({ error: updateError.message }, 500);

    await logActivity({
      projectId,
      userId: profile.id,
      userName: profile.name,
      userRole: profile.role,
      action: 'project_cancelled',
      oldValue: project.status,
      newValue: 'cancelled',
      details: { reason: reason || 'No reason provided' },
    });

    // Comms + email
    await supabase.from('project_messages').insert({
      project_id: projectId,
      sender_id: profile.id,
      sender_name: profile.name,
      sender_role: profile.role,
      body: `Request cancelled. Reason: ${reason || 'No reason provided'}`,
      source: 'system',
    });
    notifyProjectParticipants({
      projectId,
      excludeUserId: profile.id,
      subject: `${updated?.project_name ?? 'Project'} — Cancelled`,
      html: emailWrap(`
        <h2 style="margin:0 0 16px;color:#333;font-size:22px">Request Cancelled</h2>
        <p style="color:#555;font-size:15px;line-height:1.6">
          <strong>${profile.name}</strong> cancelled this request.${reason ? ` Reason: ${reason}` : ''}
        </p>
        ${emailBtn('View Details', `${PLATFORM_URL()}?requestId=${projectId}`)}
      `),
    }).catch(() => {});

    return c.json({ request: updated });
  } catch (error) {
    console.error("Cancel error:", error);
    return c.json({ error: "Failed to cancel project" }, 500);
  }
});

// Get activity log for a project
app.get("/make-server-d8ea749c/requests/:id/activity", async (c) => {
  try {
    const { profile, error } = await getAuthUser(c);
    if (error || !profile) return c.json({ error: "Unauthorized" }, 401);

    const projectId = c.req.param('id');

    const { data } = await supabase
      .from('activity_log')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    return c.json({ activityLog: data || [] });
  } catch (error) {
    return c.json({ error: "Failed to fetch activity" }, 500);
  }
});

// ════════════════════════════════════════════
//  QUOTE BUILDING (Admin only)
// ════════════════════════════════════════════

// Generate / update quote for a project
app.post("/make-server-d8ea749c/requests/:id/quote", async (c) => {
  try {
    const { profile, error } = await getAuthUser(c);
    if (error || !profile) return c.json({ error: "Unauthorized" }, 401);
    if (profile.role !== 'admin' && profile.role !== 'manager') {
      return c.json({ error: "Forbidden" }, 403);
    }

    const projectId = c.req.param('id');
    const body = await c.req.json();
    const {
      clientRatingId,
      serviceFactor,
      depthFactor,
      areaDiscountedSqm,
      riskProfile,
      riskMultiplier,
      clearanceAccessCost,
      mobilizationCost,
      accommodationCost,
      serviceHeadCount,
      dataCollectionDays,
      evaluationDays,
      estimatedWeeks,
      lineItems,       // Array of { description, quantity, unitPrice, uom, category, sortOrder }
      discountAmount,
      prepaymentPct,
      notes,
    } = body;

    // Fetch current project to get survey area
    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (!project) return c.json({ error: "Project not found" }, 404);

    // Calculate totals from line items
    const computedLineItems = (lineItems || []).map((li: any, idx: number) => ({
      project_id: projectId,
      description: li.description,
      quantity: li.quantity || 0,
      unit_price: li.unitPrice || 0,
      uom: li.uom || 'SQ M.',
      total_price: (li.quantity || 0) * (li.unitPrice || 0),
      category: li.category || 'professional_service',
      sort_order: li.sortOrder ?? idx,
    }));

    const subtotal = computedLineItems.reduce((sum: number, li: any) => sum + li.total_price, 0)
      + (clearanceAccessCost || 0)
      + (mobilizationCost || 0)
      + (accommodationCost || 0);

    const disc = discountAmount || 0;
    const totalJmd = subtotal - disc;
    const usdRate = 128.5; // approximate JMD to USD
    const totalUsd = totalJmd / usdRate;
    const pPct = prepaymentPct || 40;
    const prepayAmt = totalJmd * (pPct / 100);
    const balAmt = totalJmd - prepayAmt;

    // Update project with pricing info
    const { error: projErr } = await supabase
      .from('projects')
      .update({
        client_rating_id: clientRatingId || null,
        service_factor: serviceFactor || null,
        depth_factor: depthFactor || null,
        area_discounted_sqm: areaDiscountedSqm || null,
        risk_profile: riskProfile || null,
        risk_multiplier: riskMultiplier || null,
        clearance_access_cost: clearanceAccessCost || 0,
        mobilization_cost: mobilizationCost || 0,
        accommodation_cost: accommodationCost || 0,
        service_head_count: serviceHeadCount || 1,
        subtotal,
        discount_amount: disc,
        total_cost_jmd: totalJmd,
        total_cost_usd: parseFloat(totalUsd.toFixed(2)),
        prepayment_pct: pPct,
        prepayment_amount: prepayAmt,
        balance_pct: 100 - pPct,
        balance_amount: balAmt,
        data_collection_days: dataCollectionDays || null,
        evaluation_days: evaluationDays || null,
        estimated_weeks: estimatedWeeks || null,
        admin_notes: notes || null,
        status: 'quoted',
        quoted_at: new Date().toISOString(),
      })
      .eq('id', projectId);

    if (projErr) return c.json({ error: projErr.message }, 500);

    // Replace line items: delete old, insert new
    await supabase.from('quote_line_items').delete().eq('project_id', projectId);
    if (computedLineItems.length > 0) {
      const { error: liErr } = await supabase
        .from('quote_line_items')
        .insert(computedLineItems);
      if (liErr) console.error("Line item insert error:", liErr);
    }

    await logActivity({
      projectId,
      userId: profile.id,
      userName: profile.name,
      userRole: profile.role,
      action: 'quote_generated',
      details: { totalJmd, totalUsd: parseFloat(totalUsd.toFixed(2)), lineItemCount: computedLineItems.length },
    });

    // Comms + email for quote sent
    await supabase.from('project_messages').insert({
      project_id: projectId,
      sender_id: profile.id,
      sender_name: profile.name,
      sender_role: profile.role,
      body: `Quote generated: $${totalJmd.toLocaleString()} JMD (≈ $${parseFloat(totalUsd.toFixed(2)).toLocaleString()} USD). Please review and accept or decline.`,
      source: 'system',
    });
    notifyProjectParticipants({
      projectId,
      excludeUserId: profile.id,
      subject: `${project.project_name ?? 'Project'} — Quote Ready: $${totalJmd.toLocaleString()} JMD`,
      html: emailWrap(`
        <h2 style="margin:0 0 16px;color:#333;font-size:22px">Your Quote is Ready</h2>
        <div style="background:#f8f8f8;padding:24px;margin:16px 0;border-radius:12px;text-align:center">
          <p style="margin:0 0 8px;color:#E2582A;font-weight:600;font-size:14px;text-transform:uppercase;letter-spacing:1px">Quote Amount</p>
          <p style="margin:0;color:#E2582A;font-size:36px;font-weight:bold">$${totalJmd.toLocaleString()}</p>
          <p style="margin:4px 0 0;color:#999;font-size:14px">JMD (≈ $${parseFloat(totalUsd.toFixed(2)).toLocaleString()} USD)</p>
        </div>
        <p style="color:#555;font-size:15px;line-height:1.6">Log in to review the full quote, line items, and payment terms. You can accept or decline directly from the platform.</p>
        ${emailBtn('Review Quote', `${PLATFORM_URL()}?requestId=${projectId}`)}
      `),
    }).catch(() => {});

    // Return updated project with line items
    const { data: updated } = await supabase
      .from('projects')
      .select('*, service_types(name), client_ratings(name)')
      .eq('id', projectId)
      .single();

    const { data: items } = await supabase
      .from('quote_line_items')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order');

    return c.json({ project: updated, lineItems: items });
  } catch (error) {
    console.error("Quote generation error:", error);
    return c.json({ error: "Failed to generate quote" }, 500);
  }
});

// Client accepts quote
app.post("/make-server-d8ea749c/requests/:id/quote/accept", async (c) => {
  try {
    const { profile, error } = await getAuthUser(c);
    if (error || !profile) return c.json({ error: "Unauthorized" }, 401);

    const projectId = c.req.param('id');

    const { data: project } = await supabase
      .from('projects')
      .select('client_id, status')
      .eq('id', projectId)
      .single();

    if (!project) return c.json({ error: "Project not found" }, 404);
    if (profile.role === 'client' && project.client_id !== profile.id) {
      return c.json({ error: "Forbidden" }, 403);
    }
    if (project.status !== 'quoted') {
      return c.json({ error: "Quote can only be accepted when status is 'quoted'" }, 400);
    }

    const { data: updated } = await supabase
      .from('projects')
      .update({
        status: 'quote_accepted',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', projectId)
      .select('*')
      .single();

    await logActivity({
      projectId,
      userId: profile.id,
      userName: profile.name,
      userRole: profile.role,
      action: 'quote_accepted',
    });

    await supabase.from('project_messages').insert({
      project_id: projectId,
      sender_id: profile.id,
      sender_name: profile.name,
      sender_role: profile.role,
      body: `Quote accepted by ${profile.name}.`,
      source: 'system',
    });
    notifyProjectParticipants({
      projectId,
      excludeUserId: profile.id,
      subject: `${updated?.project_name ?? 'Project'} — Quote Accepted`,
      html: emailWrap(`
        <h2 style="margin:0 0 16px;color:#333;font-size:22px">Quote Accepted</h2>
        <p style="color:#555;font-size:15px;line-height:1.6"><strong>${profile.name}</strong> has accepted the quote. The project will move forward.</p>
        ${emailBtn('View Project', `${PLATFORM_URL()}?requestId=${projectId}`)}
      `),
    }).catch(() => {});

    return c.json({ project: updated });
  } catch (error) {
    return c.json({ error: "Failed to accept quote" }, 500);
  }
});

// Client rejects quote
app.post("/make-server-d8ea749c/requests/:id/quote/reject", async (c) => {
  try {
    const { profile, error } = await getAuthUser(c);
    if (error || !profile) return c.json({ error: "Unauthorized" }, 401);

    const projectId = c.req.param('id');
    const { reason } = await c.req.json();

    const { data: project } = await supabase
      .from('projects')
      .select('client_id, status')
      .eq('id', projectId)
      .single();

    if (!project) return c.json({ error: "Project not found" }, 404);
    if (profile.role === 'client' && project.client_id !== profile.id) {
      return c.json({ error: "Forbidden" }, 403);
    }

    const { data: updated } = await supabase
      .from('projects')
      .update({ status: 'quote_rejected' })
      .eq('id', projectId)
      .select('*')
      .single();

    await logActivity({
      projectId,
      userId: profile.id,
      userName: profile.name,
      userRole: profile.role,
      action: 'quote_rejected',
      details: { reason },
    });

    await supabase.from('project_messages').insert({
      project_id: projectId,
      sender_id: profile.id,
      sender_name: profile.name,
      sender_role: profile.role,
      body: `Quote declined by ${profile.name}.${reason ? ` Reason: ${reason}` : ''}`,
      source: 'system',
    });
    notifyProjectParticipants({
      projectId,
      excludeUserId: profile.id,
      subject: `${updated?.project_name ?? 'Project'} — Quote Declined`,
      html: emailWrap(`
        <h2 style="margin:0 0 16px;color:#333;font-size:22px">Quote Declined</h2>
        <p style="color:#555;font-size:15px;line-height:1.6"><strong>${profile.name}</strong> has declined the quote.${reason ? ` Reason: ${reason}` : ''}</p>
        ${emailBtn('View Details', `${PLATFORM_URL()}?requestId=${projectId}`)}
      `),
    }).catch(() => {});

    return c.json({ project: updated });
  } catch (error) {
    return c.json({ error: "Failed to reject quote" }, 500);
  }
});

// ════════════════════════════════════════════
//  ADMIN ROUTES
// ════════════════════════════════════════════

// Get all users
app.get("/make-server-d8ea749c/admin/users", async (c) => {
  try {
    const { profile, error } = await getAuthUser(c);
    if (error || !profile) return c.json({ error: "Unauthorized" }, 401);
    if (profile.role !== 'admin' && profile.role !== 'manager') {
      return c.json({ error: "Forbidden" }, 403);
    }

    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) return c.json({ error: fetchError.message }, 500);
    return c.json({ users: data });
  } catch (error) {
    return c.json({ error: "Failed to fetch users" }, 500);
  }
});

// Update user role
app.put("/make-server-d8ea749c/admin/users/:userId/role", async (c) => {
  try {
    const { profile, error } = await getAuthUser(c);
    if (error || !profile) return c.json({ error: "Unauthorized" }, 401);
    if (profile.role !== 'admin') return c.json({ error: "Forbidden" }, 403);

    const userId = c.req.param('userId');
    const { role } = await c.req.json();

    const validRoles = ['client', 'admin', 'manager'];
    if (!validRoles.includes(role)) {
      return c.json({ error: "Invalid role" }, 400);
    }
    if (userId === profile.id) {
      return c.json({ error: "Cannot change your own role" }, 400);
    }

    const { data, error: updateError } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId)
      .select('*')
      .single();

    if (updateError) return c.json({ error: updateError.message }, 500);

    // Also update auth metadata
    await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { role },
    }).catch(err => console.error('Auth metadata update error:', err));

    return c.json({ success: true, user: data });
  } catch (error) {
    return c.json({ error: "Failed to update role" }, 500);
  }
});

// Admin dashboard stats
app.get("/make-server-d8ea749c/admin/stats", async (c) => {
  try {
    const { profile, error } = await getAuthUser(c);
    if (error || !profile) return c.json({ error: "Unauthorized" }, 401);
    if (profile.role !== 'admin' && profile.role !== 'manager') {
      return c.json({ error: "Forbidden" }, 403);
    }

    const [projectsRes, usersRes] = await Promise.all([
      supabase.from('projects').select('status, total_cost_jmd, payment_status'),
      supabase.from('profiles').select('role'),
    ]);

    const projects = projectsRes.data || [];
    const users = usersRes.data || [];

    const stats = {
      totalProjects: projects.length,
      rfqPending: projects.filter((p: any) => p.status === 'rfq_submitted').length,
      quoted: projects.filter((p: any) => p.status === 'quoted').length,
      inProgress: projects.filter((p: any) => ['in_progress','data_processing','reporting'].includes(p.status)).length,
      completed: projects.filter((p: any) => p.status === 'completed').length,
      totalRevenueJmd: projects
        .filter((p: any) => p.payment_status === 'paid')
        .reduce((sum: number, p: any) => sum + (p.total_cost_jmd || 0), 0),
      totalClients: users.filter((u: any) => u.role === 'client').length,
      totalAdmins: users.filter((u: any) => u.role === 'admin' || u.role === 'manager').length,
    };

    return c.json({ stats });
  } catch (error) {
    return c.json({ error: "Failed to fetch stats" }, 500);
  }
});

// ════════════════════════════════════════════
//  ADMIN SERVICE TYPE MANAGEMENT
// ════════════════════════════════════════════

// These satisfy the frontend's /admin/services calls by returning service_types
app.get("/make-server-d8ea749c/admin/services", async (c) => {
  try {
    const { profile, error } = await getAuthUser(c);
    if (error || !profile) return c.json({ error: "Unauthorized" }, 401);
    if (profile.role !== 'admin' && profile.role !== 'manager') {
      return c.json({ error: "Forbidden" }, 403);
    }
    const { data } = await supabase.from('service_types').select('*');
    return c.json({ services: data || [] });
  } catch (error) {
    return c.json({ error: "Failed to fetch services" }, 500);
  }
});

// Create service type (admin)
app.post("/make-server-d8ea749c/services", async (c) => {
  try {
    const { profile, error } = await getAuthUser(c);
    if (error || !profile) return c.json({ error: "Unauthorized" }, 401);
    if (profile.role !== 'admin') return c.json({ error: "Forbidden" }, 403);

    const { name, description, baseRate, discountRate } = await c.req.json();
    const { data, error: insertError } = await supabase
      .from('service_types')
      .insert({
        name,
        description: description || null,
        base_rate: baseRate || 200,
        discount_rate: discountRate || 150,
      })
      .select('*')
      .single();

    if (insertError) return c.json({ error: insertError.message }, 500);
    return c.json({ service: data });
  } catch (error) {
    return c.json({ error: "Failed to create service type" }, 500);
  }
});

// Stub routes that old frontend components may call
// These return empty arrays to prevent 404 errors
app.get("/make-server-d8ea749c/admin/talents", async (c) => {
  return c.json({ talents: [] });
});

app.get("/make-server-d8ea749c/admin/talent/pending", async (c) => {
  return c.json({ talents: [] });
});

app.get("/make-server-d8ea749c/portfolio", async (c) => {
  return c.json({ items: [] });
});

app.get("/make-server-d8ea749c/services/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const { data } = await supabase
      .from('service_types')
      .select('*')
      .eq('id', id)
      .single();
    if (!data) return c.json({ error: "Not found" }, 404);
    return c.json({ service: data });
  } catch (error) {
    return c.json({ error: "Failed to fetch service" }, 500);
  }
});

// ════════════════════════════════════════════
//  PROJECT COMMUNICATIONS
// ════════════════════════════════════════════

// List messages for a project
app.get("/make-server-d8ea749c/requests/:id/messages", async (c) => {
  try {
    const { profile, error } = await getAuthUser(c);
    if (error || !profile) return c.json({ error: "Unauthorized" }, 401);

    const projectId = c.req.param('id');

    // Verify access
    const { data: project } = await supabase
      .from('projects')
      .select('client_id')
      .eq('id', projectId)
      .single();
    if (!project) return c.json({ error: "Project not found" }, 404);
    if (profile.role === 'client' && project.client_id !== profile.id) {
      return c.json({ error: "Forbidden" }, 403);
    }

    let query = supabase
      .from('project_messages')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    // Clients only see non-internal messages
    if (profile.role === 'client') {
      query = query.eq('is_internal', false);
    }

    const { data, error: fetchError } = await query;
    if (fetchError) return c.json({ error: fetchError.message }, 500);

    return c.json({ messages: data || [] });
  } catch (error) {
    console.error("Get messages error:", error);
    return c.json({ error: "Failed to fetch messages" }, 500);
  }
});

// Send a new message
app.post("/make-server-d8ea749c/requests/:id/messages", async (c) => {
  try {
    const { profile, error } = await getAuthUser(c);
    if (error || !profile) return c.json({ error: "Unauthorized" }, 401);

    const projectId = c.req.param('id');
    const { body: msgBody, isInternal } = await c.req.json();

    if (!msgBody || !msgBody.trim()) return c.json({ error: "Message body is required" }, 400);

    // Verify access
    const { data: project } = await supabase
      .from('projects')
      .select('client_id, project_name')
      .eq('id', projectId)
      .single();
    if (!project) return c.json({ error: "Project not found" }, 404);
    if (profile.role === 'client' && project.client_id !== profile.id) {
      return c.json({ error: "Forbidden" }, 403);
    }

    // Clients cannot send internal messages
    const internal = profile.role === 'client' ? false : !!isInternal;

    const { data: message, error: insertError } = await supabase
      .from('project_messages')
      .insert({
        project_id: projectId,
        sender_id: profile.id,
        sender_name: profile.name,
        sender_role: profile.role,
        body: msgBody.trim(),
        is_internal: internal,
        source: 'panel',
      })
      .select('*')
      .single();

    if (insertError) return c.json({ error: insertError.message }, 500);

    // Log as note in activity log for audit trail
    await logActivity({
      projectId,
      userId: profile.id,
      userName: profile.name,
      userRole: profile.role,
      action: 'message_sent',
      details: { body: msgBody.trim(), isInternal: internal },
    });

    // Send email notification (skip for internal notes)
    if (!internal) {
      notifyProjectParticipants({
        projectId,
        excludeUserId: profile.id,
        subject: `${project.project_name ?? 'Project'} — New message from ${profile.name}`,
        html: emailWrap(`
          <h2 style="margin:0 0 16px;color:#333;font-size:22px">New Message</h2>
          <p style="color:#555;font-size:15px;line-height:1.6">
            <strong>${profile.name}</strong> (${profile.role}) wrote:
          </p>
          <div style="background:#f8f8f8;border-left:4px solid #E2582A;padding:16px;margin:16px 0;border-radius:8px">
            <p style="margin:0;color:#333;font-size:14px;line-height:1.6;white-space:pre-wrap">${msgBody.trim()}</p>
          </div>
          <p style="color:#999;font-size:13px">Reply to this email or use the platform to respond.</p>
          ${emailBtn('View Conversation', `${PLATFORM_URL()}?requestId=${projectId}`)}
        `),
      }).catch(() => {});
    }

    return c.json({ message });
  } catch (error) {
    console.error("Send message error:", error);
    return c.json({ error: "Failed to send message" }, 500);
  }
});

// ════════════════════════════════════════════
//  INBOUND EMAIL WEBHOOK (Resend)
//  Captures email replies and inserts them
//  into the project_messages table.
// ════════════════════════════════════════════
app.post("/make-server-d8ea749c/webhooks/inbound-email", async (c) => {
  try {
    const payload = await c.req.json();

    // Resend sends: { from, to, subject, text, html, headers }
    const { from, to, subject, text, html: htmlBody } = payload;

    // Extract project ID from the "to" address: project+<uuid>@inbound.domain.com
    const toAddress = Array.isArray(to) ? to[0] : to;
    const match = toAddress?.match?.(/project\+([a-f0-9-]+)@/i);
    if (!match) {
      console.warn('[INBOUND] Could not extract project ID from:', toAddress);
      return c.json({ ok: false, reason: 'no project id in address' }, 200);
    }
    const projectId = match[1];

    // Look up sender by email
    const senderEmail = typeof from === 'string' ? from.replace(/.*<(.+)>.*/, '$1').trim() : from?.address || '';
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('id, name, role, email')
      .ilike('email', senderEmail)
      .single();

    const senderName = senderProfile?.name || senderEmail;
    const senderRole = senderProfile?.role || 'external';

    // Strip common email reply signatures / quoted text
    const cleanBody = (text || '')
      .replace(/\r\n/g, '\n')
      .split(/\n--\n|\nOn .+ wrote:|\n_{3,}|\n>{2,}/)[0]
      .trim();

    if (!cleanBody) {
      return c.json({ ok: false, reason: 'empty body after cleaning' }, 200);
    }

    const { data: message, error: insertError } = await supabase
      .from('project_messages')
      .insert({
        project_id: projectId,
        sender_id: senderProfile?.id || null,
        sender_name: senderName,
        sender_role: senderRole,
        body: cleanBody,
        source: 'email',
      })
      .select('*')
      .single();

    if (insertError) {
      console.error('[INBOUND] insert error:', insertError);
      return c.json({ ok: false, reason: insertError.message }, 200);
    }

    // Log activity
    await logActivity({
      projectId,
      userId: senderProfile?.id || '00000000-0000-0000-0000-000000000000',
      userName: senderName,
      userRole: senderRole,
      action: 'message_received_email',
      details: { subject, from: senderEmail },
    });

    // Notify others in the thread
    notifyProjectParticipants({
      projectId,
      excludeUserId: senderProfile?.id,
      subject: subject || `Reply on project`,
      html: emailWrap(`
        <h2 style="margin:0 0 16px;color:#333;font-size:22px">New Reply</h2>
        <p style="color:#555;font-size:15px;line-height:1.6">
          <strong>${senderName}</strong> replied via email:
        </p>
        <div style="background:#f8f8f8;border-left:4px solid #E2582A;padding:16px;margin:16px 0;border-radius:8px">
          <p style="margin:0;color:#333;font-size:14px;line-height:1.6;white-space:pre-wrap">${cleanBody}</p>
        </div>
        ${emailBtn('View Conversation', `${PLATFORM_URL()}?requestId=${projectId}`)}
      `),
    }).catch(() => {});

    console.log(`[INBOUND] Message from ${senderEmail} inserted into project ${projectId}`);
    return c.json({ ok: true, messageId: message?.id });
  } catch (error) {
    console.error('[INBOUND] webhook error:', error);
    return c.json({ ok: false, reason: 'server error' }, 200); // 200 so Resend doesn't retry
  }
});

// Catch-all for any other routes to prevent 404 crashes
app.all("/make-server-d8ea749c/*", (c) => {
  return c.json({ error: "Route not found", path: c.req.path }, 404);
});

Deno.serve(app.fetch);
