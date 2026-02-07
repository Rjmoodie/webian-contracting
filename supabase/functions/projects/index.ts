/**
 * Projects Edge Function
 * Handles: CRUD, status updates, cancellation, attachments, activity log
 */
import { createApp } from "../_shared/cors.ts";
import { getAuthUser } from "../_shared/auth.ts";
import { supabase } from "../_shared/supabase.ts";
import { logActivity } from "../_shared/activity.ts";
import {
  sendEmail,
  emailWrap,
  emailBtn,
  projectReplyTo,
  platformUrl,
  notifyProjectParticipants,
  getTeamNotificationRecipients,
  esc,
} from "../_shared/email.ts";

const STATUS_TRANSITIONS: Record<string, string[]> = {
  rfq_submitted: ["under_review", "cancelled"],
  under_review: ["quoted", "cancelled"],
  quoted: ["quote_accepted", "quote_rejected", "cancelled"],
  quote_accepted: ["in_progress", "cancelled"],
  quote_rejected: ["under_review", "cancelled"],
  in_progress: ["data_processing", "reporting", "delivered", "completed", "cancelled"],
  data_processing: ["reporting", "delivered", "completed", "cancelled"],
  reporting: ["delivered", "completed", "cancelled"],
  delivered: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

const app = createApp();

app.get("/projects/health", (c) => c.json({ status: "ok", fn: "projects" }));

// ── Create project (RFQ) — Client only ────────────────────
app.post("/projects", async (c) => {
  try {
    const { profile, error } = await getAuthUser(c);
    if (error || !profile) return c.json({ error: "Unauthorized", reason: error ?? "Not authenticated" }, 401);
    if (profile.role !== "client") return c.json({ error: "Only clients can submit RFQs" }, 403);

    const body = await c.req.json();
    const {
      projectName, projectDescription, projectLocation, projectAddress,
      projectAddressLat, projectAddressLng, projectAddressPlaceId,
      serviceTypeId, investigationType, surveyAreaSqm,
      clearanceAccess, mobilizationNeeded, accommodationNeeded,
      serviceHeadCount, notes,
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
      status: "rfq_submitted",
    };

    const { data: project, error: insertError } = await supabase
      .from("projects").insert(projectRow).select("*").single();
    if (insertError) return c.json({ error: insertError.message }, 500);

    await logActivity({
      projectId: project.id, userId: profile.id,
      userName: profile.name, userRole: profile.role,
      action: "rfq_submitted", details: { projectName, surveyAreaSqm },
    });

    // System comms message
    await supabase.from("project_messages").insert({
      project_id: project.id, sender_name: "System",
      sender_role: "system", source: "system",
      body: `New request submitted by ${profile.name} for "${projectName}".`,
    });

    // Email team (NOTIFICATION_TO_EMAIL with NOTIFICATION_CC_EMAILS, or fallback to admins from DB)
    const team = getTeamNotificationRecipients();
    const adminRecipients = team.to.length > 0 ? team.to : (await supabase.from("profiles").select("email").in("role", ["admin", "manager"])).data?.map((a: any) => a.email).filter(Boolean) ?? [];
    if (adminRecipients.length > 0) {
      sendEmail({
        to: adminRecipients,
        cc: team.cc.length > 0 ? team.cc : undefined,
        subject: `New RFQ: ${esc(projectName)}`,
        html: emailWrap(`
          <h2 style="margin:0 0 16px;color:#333;font-size:22px">New Request Submitted</h2>
          <p style="color:#555;font-size:15px;line-height:1.6"><strong>${esc(profile.name)}</strong> submitted a request for <strong>${esc(projectName)}</strong> in <strong>${esc(body.projectLocation ?? "")}</strong>.</p>
          ${emailBtn("Review Request", `${platformUrl()}?requestId=${project.id}`)}
        `),
        replyTo: projectReplyTo(project.id),
        eventId: `rfq-admin-${project.id}`,
      }).catch((e) => console.error("[EMAIL] rfq admin notify failed", { projectId: project.id, err: e }));
    }
    sendEmail({
      to: profile.email,
      subject: `Request Received: ${esc(projectName)}`,
      html: emailWrap(`
        <h2 style="margin:0 0 16px;color:#333;font-size:22px">Request Received!</h2>
        <p style="color:#555;font-size:15px;line-height:1.6">Hi ${esc(profile.name)}, thank you for your request for <strong>${esc(projectName)}</strong>. We'll provide a quote shortly.</p>
        ${emailBtn("View Request", `${platformUrl()}?requestId=${project.id}`)}
      `),
      replyTo: projectReplyTo(project.id),
      eventId: `rfq-client-${project.id}`,
    }).catch((e) => console.error("[EMAIL] rfq client confirm failed", { projectId: project.id, err: e }));

    return c.json({ project });
  } catch (error) {
    console.error("Create project error:", error);
    return c.json({ error: "Failed to create project" }, 500);
  }
});

// ── List projects (role-based) ────────────────────────────
app.get("/projects", async (c) => {
  try {
    const { profile, error } = await getAuthUser(c);
    if (error || !profile) return c.json({ error: "Unauthorized", reason: error ?? "Not authenticated" }, 401);

    let query = supabase
      .from("projects")
      .select("*, service_types(name), client_ratings(name)")
      .order("created_at", { ascending: false });

    if (profile.role === "client") query = query.eq("client_id", profile.id);

    const { data, error: fetchError } = await query;
    if (fetchError) return c.json({ error: fetchError.message }, 500);

    const requests = (data || []).map((p: any) => ({
      ...p, id: p.id,
      eventName: p.project_name, projectDescription: p.project_description,
      eventDate: p.created_at, parish: p.project_location,
      venue: p.project_address || p.project_location,
      projectAddressLat: p.project_address_lat, projectAddressLng: p.project_address_lng,
      clientName: p.client_name, clientEmail: p.client_email,
      clientAddress: p.client_address,
      clientAddressLat: p.client_address_lat, clientAddressLng: p.client_address_lng,
      serviceType: p.service_types?.name, clientRating: p.client_ratings?.name,
    }));

    return c.json({ requests });
  } catch (error) {
    console.error("List projects error:", error);
    return c.json({ error: "Failed to fetch projects" }, 500);
  }
});

// ── Get single project ────────────────────────────────────
app.get("/projects/:id", async (c) => {
  try {
    const { profile, error } = await getAuthUser(c);
    if (error || !profile) return c.json({ error: "Unauthorized", reason: error ?? "Not authenticated" }, 401);

    const projectId = c.req.param("id");
    const { data: project, error: fetchError } = await supabase
      .from("projects")
      .select("*, service_types(name, base_rate, discount_rate), client_ratings(name, rate_jmd)")
      .eq("id", projectId).single();
    if (fetchError || !project) return c.json({ error: "Project not found" }, 404);
    if (profile.role === "client" && project.client_id !== profile.id) return c.json({ error: "Forbidden" }, 403);

    const [{ data: lineItems }, { data: activityLog }, { data: attachments }, { data: projectMedia }] = await Promise.all([
      supabase.from("quote_line_items").select("*").eq("project_id", projectId).order("sort_order"),
      supabase.from("activity_log").select("*").eq("project_id", projectId).order("created_at", { ascending: false }),
      supabase.from("request_attachments").select("id, file_path, file_name, file_size, content_type, created_at").eq("project_id", projectId).order("created_at", { ascending: true }),
      supabase.from("project_media").select("id, file_path, file_name, file_size, content_type, sort_order, created_at").eq("project_id", projectId).order("sort_order").order("created_at", { ascending: true }),
    ]);

    let msgQuery = supabase.from("project_messages").select("*").eq("project_id", projectId).order("created_at", { ascending: true });
    if (profile.role === "client") msgQuery = msgQuery.eq("is_internal", false);
    const { data: messages } = await msgQuery;

    const request = {
      ...project,
      eventName: project.project_name, projectDescription: project.project_description,
      eventDate: project.created_at, parish: project.project_location,
      venue: project.project_address || project.project_location,
      projectAddressLat: project.project_address_lat, projectAddressLng: project.project_address_lng,
      clientName: project.client_name, clientEmail: project.client_email,
      clientAddress: project.client_address,
      clientAddressLat: project.client_address_lat, clientAddressLng: project.client_address_lng,
      attachments: attachments || [],
      project_media: projectMedia || [],
      featured: !!project.featured,
      featured_at: project.featured_at ?? null,
    };

    return c.json({ request, lineItems: lineItems || [], activityLog: activityLog || [], messages: messages || [] });
  } catch (error) {
    console.error("Get project error:", error);
    return c.json({ error: "Failed to fetch project" }, 500);
  }
});

// ── Update status (Admin/Manager) ─────────────────────────
app.put("/projects/:id/status", async (c) => {
  try {
    const { profile, error } = await getAuthUser(c);
    if (error || !profile) return c.json({ error: "Unauthorized", reason: error ?? "Not authenticated" }, 401);
    if (profile.role !== "admin" && profile.role !== "manager") return c.json({ error: "Forbidden" }, 403);

    const projectId = c.req.param("id");
    const { status, note } = await c.req.json();
    const validStatuses = ["rfq_submitted","under_review","quoted","quote_accepted","quote_rejected","in_progress","data_processing","reporting","delivered","completed","cancelled"];
    if (!validStatuses.includes(status)) return c.json({ error: "Invalid status" }, 400);

    const { data: current } = await supabase.from("projects").select("status, project_name").eq("id", projectId).single();
    if (!current) return c.json({ error: "Project not found" }, 404);
    const allowed = STATUS_TRANSITIONS[current.status];
    if (allowed && !allowed.includes(status)) return c.json({ error: `Invalid transition from ${current.status} to ${status}` }, 400);

    const updates: any = { status };
    if (status === "quoted") updates.quoted_at = new Date().toISOString();
    if (status === "quote_accepted") updates.accepted_at = new Date().toISOString();
    if (status === "completed") updates.completed_at = new Date().toISOString();

    const { data: project, error: updateError } = await supabase.from("projects").update(updates).eq("id", projectId).select("*").single();
    if (updateError) return c.json({ error: updateError.message }, 500);

    await logActivity({ projectId, userId: profile.id, userName: profile.name, userRole: profile.role, action: "status_changed", oldValue: current?.status, newValue: status, details: note ? { note } : null });

    const statusLabel = status.replace(/_/g, " ").toUpperCase();
    await supabase.from("project_messages").insert({ project_id: projectId, sender_id: profile.id, sender_name: profile.name, sender_role: profile.role, body: `Status changed to **${statusLabel}**${note ? `: ${note}` : ""}`, source: "system" });
    const projName = current?.project_name ?? "Project";
    notifyProjectParticipants({ projectId, excludeUserId: profile.id, subject: `${esc(projName)} — Status: ${statusLabel}`, html: emailWrap(`<h2 style="margin:0 0 16px;color:#333;font-size:22px">Status Update</h2><p style="color:#555;font-size:15px;line-height:1.6"><strong>${esc(profile.name)}</strong> changed status to <strong>${esc(statusLabel)}</strong>.</p>${note ? `<div style="background:#f8f8f8;border-left:4px solid #E2582A;padding:16px;margin:16px 0;border-radius:8px"><p style="margin:0;color:#333;font-size:14px">${esc(note)}</p></div>` : ""}${emailBtn("View Request", `${platformUrl()}?requestId=${projectId}`)}`) }).catch((e) => console.error("[EMAIL] status notify failed", { projectId, err: e }));

    return c.json({ request: project });
  } catch (error) {
    console.error("Update status error:", error);
    return c.json({ error: "Failed to update status" }, 500);
  }
});

// ── Add note ──────────────────────────────────────────────
app.post("/projects/:id/notes", async (c) => {
  try {
    const { profile, error } = await getAuthUser(c);
    if (error || !profile) return c.json({ error: "Unauthorized", reason: error ?? "Not authenticated" }, 401);
    const projectId = c.req.param("id");
    const { note } = await c.req.json();
    if (!note) return c.json({ error: "Note is required" }, 400);

    const { data: project } = await supabase.from("projects").select("client_id").eq("id", projectId).single();
    if (!project) return c.json({ error: "Project not found" }, 404);
    if (profile.role === "client" && project.client_id !== profile.id) return c.json({ error: "Forbidden" }, 403);

    await logActivity({ projectId, userId: profile.id, userName: profile.name, userRole: profile.role, action: "note_added", details: { note } });
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: "Failed to add note" }, 500);
  }
});

// ── Cancel project ────────────────────────────────────────
app.post("/projects/:id/cancel", async (c) => {
  try {
    const { profile, error } = await getAuthUser(c);
    if (error || !profile) return c.json({ error: "Unauthorized", reason: error ?? "Not authenticated" }, 401);
    const projectId = c.req.param("id");
    const { reason } = await c.req.json();

    const { data: project } = await supabase.from("projects").select("client_id, status, project_name").eq("id", projectId).single();
    if (!project) return c.json({ error: "Project not found" }, 404);
    const isStaff = profile.role === "admin" || profile.role === "manager";
    if (project.client_id !== profile.id && !isStaff) return c.json({ error: "Forbidden" }, 403);

    const { data: updated, error: updateError } = await supabase.from("projects").update({ status: "cancelled" }).eq("id", projectId).select("*").single();
    if (updateError) return c.json({ error: updateError.message }, 500);

    await logActivity({ projectId, userId: profile.id, userName: profile.name, userRole: profile.role, action: "project_cancelled", oldValue: project.status, newValue: "cancelled", details: { reason: reason || "No reason provided" } });

    await supabase.from("project_messages").insert({ project_id: projectId, sender_id: profile.id, sender_name: profile.name, sender_role: profile.role, body: `Request cancelled. Reason: ${reason || "No reason provided"}`, source: "system" });
    const projName = project.project_name ?? "Project";
    notifyProjectParticipants({ projectId, excludeUserId: profile.id, subject: `${esc(projName)} — Cancelled`, html: emailWrap(`<h2 style="margin:0 0 16px;color:#333;font-size:22px">Request Cancelled</h2><p style="color:#555;font-size:15px;line-height:1.6"><strong>${esc(profile.name)}</strong> cancelled this request.${reason ? ` Reason: ${esc(reason)}` : ""}</p>${emailBtn("View Details", `${platformUrl()}?requestId=${projectId}`)}`) }).catch((e) => console.error("[EMAIL] cancel notify failed", { projectId, err: e }));

    return c.json({ request: updated });
  } catch (error) {
    return c.json({ error: "Failed to cancel project" }, 500);
  }
});

// ── Activity log ──────────────────────────────────────────
app.get("/projects/:id/activity", async (c) => {
  try {
    const { profile, error } = await getAuthUser(c);
    if (error || !profile) return c.json({ error: "Unauthorized", reason: error ?? "Not authenticated" }, 401);
    const { data } = await supabase.from("activity_log").select("*").eq("project_id", c.req.param("id")).order("created_at", { ascending: false });
    return c.json({ activityLog: data || [] });
  } catch (error) {
    return c.json({ error: "Failed to fetch activity" }, 500);
  }
});

// ── Update project (e.g. featured) — Admin only ─────────────
app.patch("/projects/:id", async (c) => {
  try {
    const { profile, error } = await getAuthUser(c);
    if (error || !profile) return c.json({ error: "Unauthorized", reason: error ?? "Not authenticated" }, 401);
    if (profile.role !== "admin" && profile.role !== "manager") return c.json({ error: "Forbidden" }, 403);

    const projectId = c.req.param("id");
    const body = await c.req.json().catch(() => ({}));
    const { featured } = body;

    const { data: project } = await supabase.from("projects").select("id, featured, featured_at").eq("id", projectId).single();
    if (!project) return c.json({ error: "Project not found" }, 404);

    const updates: Record<string, unknown> = {};
    if (typeof featured === "boolean") {
      updates.featured = featured;
      updates.featured_at = featured ? (project.featured_at ?? new Date().toISOString()) : null;
    }
    if (Object.keys(updates).length === 0) return c.json({ request: project });

    const { data: updated, error: updateError } = await supabase.from("projects").update(updates).eq("id", projectId).select("*").single();
    if (updateError) return c.json({ error: updateError.message }, 500);
    return c.json({ request: updated });
  } catch (error) {
    console.error("Patch project error:", error);
    return c.json({ error: "Failed to update project" }, 500);
  }
});

// ── Register project media (admin or project client) ─────────
app.post("/projects/:id/media", async (c) => {
  try {
    const { profile, error } = await getAuthUser(c);
    if (error || !profile) return c.json({ error: "Unauthorized", reason: error ?? "Not authenticated" }, 401);
    const projectId = c.req.param("id");
    const { media: items } = await c.req.json();
    if (!Array.isArray(items) || items.length === 0) return c.json({ error: "media array required" }, 400);

    const { data: project } = await supabase.from("projects").select("id, client_id").eq("id", projectId).single();
    if (!project) return c.json({ error: "Project not found" }, 404);
    const isClient = profile.role === "client" && project.client_id === profile.id;
    const isStaff = profile.role === "admin" || profile.role === "manager";
    if (!isClient && !isStaff) return c.json({ error: "Forbidden" }, 403);

    const rows = items.map((a: any, i: number) => ({
      project_id: projectId,
      file_path: a.file_path,
      file_name: a.file_name,
      file_size: a.file_size ?? null,
      content_type: a.content_type ?? null,
      sort_order: a.sort_order ?? i,
    }));
    const { data: inserted, error: insertError } = await supabase.from("project_media").insert(rows).select("*");
    if (insertError) return c.json({ error: insertError.message }, 500);
    return c.json({ media: inserted });
  } catch (error) {
    return c.json({ error: "Failed to add project media" }, 500);
  }
});

// ── Delete single project media (admin or project client) ───
app.delete("/projects/:id/media/:mediaId", async (c) => {
  try {
    const { profile, error } = await getAuthUser(c);
    if (error || !profile) return c.json({ error: "Unauthorized", reason: error ?? "Not authenticated" }, 401);
    const projectId = c.req.param("id");
    const mediaId = c.req.param("mediaId");

    const { data: project } = await supabase.from("projects").select("id, client_id").eq("id", projectId).single();
    if (!project) return c.json({ error: "Project not found" }, 404);
    const isClient = profile.role === "client" && project.client_id === profile.id;
    const isStaff = profile.role === "admin" || profile.role === "manager";
    if (!isClient && !isStaff) return c.json({ error: "Forbidden" }, 403);

    const { data: row } = await supabase.from("project_media").select("id, file_path").eq("id", mediaId).eq("project_id", projectId).single();
    if (!row) return c.json({ error: "Media not found" }, 404);

    await supabase.storage.from("project-media").remove([row.file_path]);
    const { error: delError } = await supabase.from("project_media").delete().eq("id", mediaId).eq("project_id", projectId);
    if (delError) return c.json({ error: delError.message }, 500);
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: "Failed to delete project media" }, 500);
  }
});

// ── Register attachments ──────────────────────────────────
app.post("/projects/:id/attachments", async (c) => {
  try {
    const { profile, error } = await getAuthUser(c);
    if (error || !profile) return c.json({ error: "Unauthorized", reason: error ?? "Not authenticated" }, 401);
    const projectId = c.req.param("id");
    const { attachments: items } = await c.req.json();
    if (!Array.isArray(items) || items.length === 0) return c.json({ error: "attachments array required" }, 400);

    const { data: project } = await supabase.from("projects").select("id, client_id").eq("id", projectId).single();
    if (!project || project.client_id !== profile.id) return c.json({ error: "Forbidden" }, 403);

    const rows = items.map((a: any) => ({ project_id: projectId, file_path: a.file_path, file_name: a.file_name, file_size: a.file_size ?? null, content_type: a.content_type ?? null }));
    const { data: inserted, error: insertError } = await supabase.from("request_attachments").insert(rows).select("*");
    if (insertError) return c.json({ error: insertError.message }, 500);
    return c.json({ attachments: inserted });
  } catch (error) {
    return c.json({ error: "Failed to add attachments" }, 500);
  }
});

// ── Talent routes (stubs) ─────────────────────────────────
app.get("/projects/talent/:id", async (c) => {
  const { profile, error } = await getAuthUser(c);
  if (error || !profile) return c.json({ error: "Unauthorized", reason: error ?? "Not authenticated" }, 401);
  return c.json({ profile: null, assignments: [] });
});

app.get("/projects/assignments/my", async (c) => {
  const { profile, error } = await getAuthUser(c);
  if (error || !profile) return c.json({ error: "Unauthorized", reason: error ?? "Not authenticated" }, 401);
  return c.json({ assignments: [] });
});

app.post("/projects/talent/apply", async (c) => {
  const { profile, error } = await getAuthUser(c);
  if (error || !profile) return c.json({ error: "Unauthorized", reason: error ?? "Not authenticated" }, 401);
  return c.json({ success: true });
});

app.post("/projects/assignments/:id/respond", async (c) => {
  const { profile, error } = await getAuthUser(c);
  if (error || !profile) return c.json({ error: "Unauthorized", reason: error ?? "Not authenticated" }, 401);
  return c.json({ success: true });
});

app.all("/projects/*", (c) => c.json({ error: "Route not found", path: c.req.path }, 404));

Deno.serve(app.fetch);
