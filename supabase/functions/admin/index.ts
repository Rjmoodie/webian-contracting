/**
 * Admin Edge Function
 * Handles: user management, talent management, stats, service CRUD
 */
import { createApp } from "../_shared/cors.ts";
import { getAuthUser } from "../_shared/auth.ts";
import { supabase } from "../_shared/supabase.ts";

const app = createApp();

// Helper: require admin/manager role
async function requireAdmin(c: any) {
  const { profile, error } = await getAuthUser(c);
  if (error || !profile) return { profile: null, res: c.json({ error: "Unauthorized" }, 401) };
  if (profile.role !== "admin" && profile.role !== "manager") return { profile: null, res: c.json({ error: "Forbidden" }, 403) };
  return { profile, res: null };
}

app.get("/admin/health", (c) => c.json({ status: "ok", fn: "admin" }));

// ── Users ─────────────────────────────────────────────────
app.get("/admin/users", async (c) => {
  const { profile, res } = await requireAdmin(c);
  if (res) return res;
  try {
    const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ users: data || [] });
  } catch (error) {
    return c.json({ error: "Failed to fetch users" }, 500);
  }
});

app.put("/admin/users/:id/role", async (c) => {
  const { profile, res } = await requireAdmin(c);
  if (res) return res;
  try {
    const userId = c.req.param("id");
    const { role } = await c.req.json();
    if (!["client", "talent", "admin", "manager"].includes(role)) return c.json({ error: "Invalid role" }, 400);
    const { data, error } = await supabase.from("profiles").update({ role }).eq("id", userId).select("*").single();
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ user: data });
  } catch (error) {
    return c.json({ error: "Failed to update role" }, 500);
  }
});

// ── Talents ───────────────────────────────────────────────
app.get("/admin/talents", async (c) => {
  const { profile, res } = await requireAdmin(c);
  if (res) return res;
  return c.json({ talents: [] });
});

app.get("/admin/talent/pending", async (c) => {
  const { profile, res } = await requireAdmin(c);
  if (res) return res;
  return c.json({ talents: [] });
});

app.put("/admin/talent/:id/review", async (c) => {
  const { profile, res } = await requireAdmin(c);
  if (res) return res;
  return c.json({ success: true });
});

// ── Stats ─────────────────────────────────────────────────
app.get("/admin/stats", async (c) => {
  const { profile, res } = await requireAdmin(c);
  if (res) return res;
  try {
    const [projectsRes, usersRes] = await Promise.all([
      supabase.from("projects").select("status, total_cost_jmd, payment_status"),
      supabase.from("profiles").select("role"),
    ]);

    const projects = projectsRes.data || [];
    const users = usersRes.data || [];

    return c.json({
      stats: {
        totalProjects: projects.length,
        rfqPending: projects.filter((p: any) => p.status === "rfq_submitted").length,
        quoted: projects.filter((p: any) => p.status === "quoted").length,
        inProgress: projects.filter((p: any) => ["in_progress", "data_processing", "reporting"].includes(p.status)).length,
        completed: projects.filter((p: any) => p.status === "completed").length,
        totalRevenueJmd: projects.filter((p: any) => p.payment_status === "paid").reduce((sum: number, p: any) => sum + (p.total_cost_jmd || 0), 0),
        totalClients: users.filter((u: any) => u.role === "client").length,
        totalTalents: users.filter((u: any) => u.role === "talent").length,
      },
    });
  } catch (error) {
    return c.json({ error: "Failed to fetch stats" }, 500);
  }
});

// ── Service types CRUD ────────────────────────────────────
app.get("/admin/services", async (c) => {
  const { profile, res } = await requireAdmin(c);
  if (res) return res;
  try {
    const { data } = await supabase.from("service_types").select("*");
    return c.json({ services: data || [] });
  } catch (error) {
    return c.json({ error: "Failed to fetch services" }, 500);
  }
});

app.post("/admin/services", async (c) => {
  const { profile, res } = await requireAdmin(c);
  if (res) return res;
  try {
    const { name, description, baseRate, discountRate } = await c.req.json();
    const { data, error } = await supabase.from("service_types").insert({
      name, description: description || null, base_rate: baseRate || 200, discount_rate: discountRate || 150,
    }).select("*").single();
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ service: data });
  } catch (error) {
    return c.json({ error: "Failed to create service type" }, 500);
  }
});

// ── Service lifecycle ─────────────────────────────────────
app.post("/admin/services/:id/approve", async (c) => {
  const { res } = await requireAdmin(c);
  if (res) return res;
  try {
    const id = c.req.param("id");
    const { data, error } = await supabase.from("service_types").update({ status: "approved" }).eq("id", id).select("*").single();
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ service: data });
  } catch (error) {
    return c.json({ error: "Failed to approve service" }, 500);
  }
});

app.put("/admin/services/:id", async (c) => {
  const { res } = await requireAdmin(c);
  if (res) return res;
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const { data, error } = await supabase.from("service_types").update(body).eq("id", id).select("*").single();
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ service: data });
  } catch (error) {
    return c.json({ error: "Failed to update service" }, 500);
  }
});

app.post("/admin/services/:id/submit-for-approval", async (c) => {
  const { res } = await requireAdmin(c);
  if (res) return res;
  try {
    const id = c.req.param("id");
    const { data, error } = await supabase.from("service_types").update({ status: "pending_approval" }).eq("id", id).select("*").single();
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ service: data });
  } catch (error) {
    return c.json({ error: "Failed to submit for approval" }, 500);
  }
});

app.post("/admin/services/:id/publish", async (c) => {
  const { res } = await requireAdmin(c);
  if (res) return res;
  try {
    const id = c.req.param("id");
    const { data, error } = await supabase.from("service_types").update({ status: "published" }).eq("id", id).select("*").single();
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ service: data });
  } catch (error) {
    return c.json({ error: "Failed to publish service" }, 500);
  }
});

app.post("/admin/services/:id/pause", async (c) => {
  const { res } = await requireAdmin(c);
  if (res) return res;
  try {
    const id = c.req.param("id");
    const { data, error } = await supabase.from("service_types").update({ status: "paused" }).eq("id", id).select("*").single();
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ service: data });
  } catch (error) {
    return c.json({ error: "Failed to pause service" }, 500);
  }
});

// ── Talent approval ───────────────────────────────────────
app.post("/admin/talents/:id/approve", async (c) => {
  const { res } = await requireAdmin(c);
  if (res) return res;
  return c.json({ success: true });
});

app.post("/admin/talents/:id/reject", async (c) => {
  const { res } = await requireAdmin(c);
  if (res) return res;
  return c.json({ success: true });
});

// ── Portfolio (admin) ─────────────────────────────────────
app.get("/admin/portfolio", async (c) => {
  const { profile, res } = await requireAdmin(c);
  if (res) return res;
  return c.json({ items: [] });
});

app.put("/admin/portfolio/:id", async (c) => {
  return c.json({ success: true });
});

// ── Past work / portfolio items (no project) ───────────────
app.get("/admin/portfolio-items", async (c) => {
  const { res } = await requireAdmin(c);
  if (res) return res;
  try {
    const { data, error } = await supabase
      .from("portfolio_items")
      .select("*, portfolio_item_media(id, file_path, file_name, content_type, sort_order)")
      .order("sort_order")
      .order("created_at", { ascending: false });
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ items: data || [] });
  } catch (e) {
    return c.json({ error: "Failed to fetch portfolio items" }, 500);
  }
});

app.post("/admin/portfolio-items", async (c) => {
  const { profile, res } = await requireAdmin(c);
  if (res) return res;
  try {
    const body = await c.req.json();
    const { title, description, category, location } = body;
    if (!title) return c.json({ error: "title is required" }, 400);
    const { data, error } = await supabase
      .from("portfolio_items")
      .insert({
        title,
        description: description || null,
        category: category === "videography" || category === "audio" ? category : "photography",
        location: location || null,
        created_by: profile.id,
      })
      .select("*")
      .single();
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ item: data });
  } catch (e) {
    return c.json({ error: "Failed to create portfolio item" }, 500);
  }
});

app.put("/admin/portfolio-items/:id", async (c) => {
  const { res } = await requireAdmin(c);
  if (res) return res;
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.category !== undefined) updates.category = body.category;
    if (body.location !== undefined) updates.location = body.location;
    if (body.sort_order !== undefined) updates.sort_order = body.sort_order;
    const { data, error } = await supabase.from("portfolio_items").update(updates).eq("id", id).select("*").single();
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ item: data });
  } catch (e) {
    return c.json({ error: "Failed to update portfolio item" }, 500);
  }
});

app.delete("/admin/portfolio-items/:id", async (c) => {
  const { res } = await requireAdmin(c);
  if (res) return res;
  try {
    const id = c.req.param("id");
    const { data: media } = await supabase.from("portfolio_item_media").select("file_path").eq("portfolio_item_id", id);
    if (media?.length) {
      await supabase.storage.from("portfolio-item-media").remove(media.map((m: { file_path: string }) => m.file_path));
    }
    await supabase.from("portfolio_item_media").delete().eq("portfolio_item_id", id);
    const { error } = await supabase.from("portfolio_items").delete().eq("id", id);
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: "Failed to delete portfolio item" }, 500);
  }
});

app.post("/admin/portfolio-items/:id/media", async (c) => {
  const { res } = await requireAdmin(c);
  if (res) return res;
  try {
    const itemId = c.req.param("id");
    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return c.json({ error: "No file provided" }, 400);
    if (file.size > 15 * 1024 * 1024) return c.json({ error: "File too large (max 15MB)" }, 400);
    const ext = file.name.split(".").pop() || "bin";
    const filePath = `${itemId}/${crypto.randomUUID()}.${ext}`;
    const buffer = await file.arrayBuffer();
    const { error: upErr } = await supabase.storage
      .from("portfolio-item-media")
      .upload(filePath, buffer, { contentType: file.type || "application/octet-stream", upsert: false });
    if (upErr) return c.json({ error: upErr.message }, 500);
    const { data: media, error: insErr } = await supabase
      .from("portfolio_item_media")
      .insert({
        portfolio_item_id: itemId,
        file_path: filePath,
        file_name: file.name,
        file_size: file.size,
        content_type: file.type || null,
      })
      .select("*")
      .single();
    if (insErr) return c.json({ error: insErr.message }, 500);
    return c.json({ media });
  } catch (e) {
    return c.json({ error: "Failed to upload media" }, 500);
  }
});

app.delete("/admin/portfolio-items/:itemId/media/:mediaId", async (c) => {
  const { res } = await requireAdmin(c);
  if (res) return res;
  try {
    const mediaId = c.req.param("mediaId");
    const { data: row } = await supabase.from("portfolio_item_media").select("file_path").eq("id", mediaId).single();
    if (row?.file_path) await supabase.storage.from("portfolio-item-media").remove([row.file_path]);
    await supabase.from("portfolio_item_media").delete().eq("id", mediaId);
    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: "Failed to delete media" }, 500);
  }
});

// ── Catch-all ─────────────────────────────────────────────
app.all("/admin/*", (c) => c.json({ error: "Route not found", path: c.req.path }, 404));

Deno.serve(app.fetch);
