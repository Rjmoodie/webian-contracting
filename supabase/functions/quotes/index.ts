/**
 * Quotes Edge Function
 * Handles: generate quote, accept, reject
 */
import { createApp } from "../_shared/cors.ts";
import { getAuthUser } from "../_shared/auth.ts";
import { supabase } from "../_shared/supabase.ts";
import { logActivity } from "../_shared/activity.ts";
import { emailWrap, emailBtn, platformUrl, notifyProjectParticipants, esc } from "../_shared/email.ts";

const app = createApp();

app.get("/quotes/health", (c) => c.json({ status: "ok", fn: "quotes" }));

// ── Helpers ───────────────────────────────────────────────
const n = (v: unknown, def = 0): number => {
  const x = Number(v);
  return Number.isFinite(x) ? x : def;
};
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const cleanStr = (s: unknown): string => (typeof s === "string" ? s.trim() : "");

// ── Generate / update quote (Admin) ───────────────────────
app.post("/quotes/:id", async (c) => {
  try {
    const { profile, error } = await getAuthUser(c);
    if (error || !profile) return c.json({ error: "Unauthorized" }, 401);
    if (profile.role !== "admin" && profile.role !== "manager") return c.json({ error: "Forbidden" }, 403);

    const projectId = c.req.param("id");
    const body = await c.req.json();
    const {
      clientRatingId, serviceFactor, depthFactor, areaDiscountedSqm,
      riskProfile, riskMultiplier,
      clearanceAccessCost, mobilizationCost, accommodationCost,
      serviceHeadCount, dataCollectionDays, evaluationDays, estimatedWeeks,
      lineItems, discountAmount, prepaymentPct, notes,
    } = body;

    const { data: project } = await supabase.from("projects").select("*").eq("id", projectId).single();
    if (!project) return c.json({ error: "Project not found" }, 404);

    if (project.status === "quoted" && project.quoted_at) {
      return c.json({ error: "Quote already generated" }, 409);
    }

    const computedLineItems = (Array.isArray(lineItems) ? lineItems : [])
      .map((li: { description?: unknown; quantity?: unknown; unitPrice?: unknown; uom?: unknown; category?: unknown; sortOrder?: unknown }, idx: number) => {
        const qty = Math.max(0, n(li.quantity, 0));
        const unit = Math.max(0, n(li.unitPrice, 0));
        const desc = cleanStr(li.description);
        if (!desc) return null;
        return {
          project_id: projectId,
          description: desc,
          quantity: qty,
          unit_price: unit,
          uom: cleanStr(li.uom) || "SQ M.",
          total_price: qty * unit,
          category: cleanStr(li.category) || "professional_service",
          sort_order: n(li.sortOrder, idx),
        };
      })
      .filter(Boolean) as { project_id: string; description: string; quantity: number; unit_price: number; uom: string; total_price: number; category: string; sort_order: number }[];

    const initiation = Math.max(0, n(clearanceAccessCost)) + Math.max(0, n(mobilizationCost)) + Math.max(0, n(accommodationCost));
    const lineSubtotal = computedLineItems.reduce((s: number, li: { total_price: number }) => s + n(li.total_price), 0);
    const subtotal = lineSubtotal + initiation;
    const disc = Math.max(0, n(discountAmount));
    const safeDisc = Math.min(disc, subtotal);
    const totalJmd = subtotal - safeDisc;

    if (totalJmd <= 0) return c.json({ error: "Total must be greater than 0" }, 400);

    const usdRate = 128.5;
    const totalUsd = totalJmd / usdRate;
    const pPct = clamp(n(prepaymentPct, 40), 0, 100);
    const prepayAmt = totalJmd * (pPct / 100);
    const balAmt = totalJmd - prepayAmt;

    const previousStatus = project.status;

    const { error: projErr } = await supabase.from("projects").update({
      client_rating_id: clientRatingId || null,
      service_factor: n(serviceFactor) || null, depth_factor: depthFactor || null,
      area_discounted_sqm: areaDiscountedSqm != null ? n(areaDiscountedSqm) : null,
      risk_profile: riskProfile || null, risk_multiplier: riskMultiplier != null ? n(riskMultiplier) : null,
      clearance_access_cost: Math.max(0, n(clearanceAccessCost)),
      mobilization_cost: Math.max(0, n(mobilizationCost)),
      accommodation_cost: Math.max(0, n(accommodationCost)),
      service_head_count: Math.max(1, n(serviceHeadCount, 1)),
      subtotal, discount_amount: safeDisc, total_cost_jmd: totalJmd,
      total_cost_usd: parseFloat(totalUsd.toFixed(2)),
      prepayment_pct: pPct, prepayment_amount: prepayAmt,
      balance_pct: 100 - pPct, balance_amount: balAmt,
      data_collection_days: dataCollectionDays != null ? n(dataCollectionDays) : null,
      evaluation_days: evaluationDays != null ? n(evaluationDays) : null,
      estimated_weeks: estimatedWeeks != null ? n(estimatedWeeks) : null,
      admin_notes: cleanStr(notes) || null, status: "quoted", quoted_at: new Date().toISOString(),
    }).eq("id", projectId);
    if (projErr) return c.json({ error: projErr.message }, 500);

    const { error: delErr } = await supabase.from("quote_line_items").delete().eq("project_id", projectId);
    if (delErr) return c.json({ error: delErr.message }, 500);

    if (computedLineItems.length > 0) {
      const { error: liErr } = await supabase.from("quote_line_items").insert(computedLineItems);
      if (liErr) {
        await supabase.from("projects").update({ status: previousStatus, quoted_at: null }).eq("id", projectId);
        return c.json({ error: "Failed to save line items" }, 500);
      }
    }

    await logActivity({ projectId, userId: profile.id, userName: profile.name, userRole: profile.role, action: "quote_generated", details: { totalJmd, totalUsd: parseFloat(totalUsd.toFixed(2)), lineItemCount: computedLineItems.length } });

    // Comms + email
    await supabase.from("project_messages").insert({ project_id: projectId, sender_id: profile.id, sender_name: profile.name, sender_role: profile.role, body: `Quote generated: $${totalJmd.toLocaleString()} JMD. Please review and accept or decline.`, source: "system" });
    const projName = project.project_name ?? "Project";
    notifyProjectParticipants({ projectId, excludeUserId: profile.id, subject: `${esc(projName)} — Quote Ready: $${totalJmd.toLocaleString()} JMD`, html: emailWrap(`
<p style="margin:0 0 20px;color:#555;font-size:16px;line-height:1.5">Good news — we've prepared a quote for your project.</p>
<div style="margin:0 0 20px;padding:10px 14px;background:#f0f7ff;border-radius:8px;border-left:4px solid #E2582A;">
  <p style="margin:0;color:#333;font-size:14px;font-weight:600">${esc(projName)}</p>
</div>
<div style="background:linear-gradient(180deg,#fafafa 0%,#f5f5f5 100%);padding:28px 24px;margin:24px 0;border-radius:12px;border:1px solid #eee;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,.06)">
  <p style="margin:0 0 6px;color:#E2582A;font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:1.2px">Quote amount</p>
  <p style="margin:0;color:#333;font-size:42px;font-weight:700;letter-spacing:-0.02em;line-height:1.1">$${totalJmd.toLocaleString()}</p>
  <p style="margin:6px 0 0;color:#666;font-size:15px;font-weight:500">JMD</p>
</div>
<p style="margin:0 0 24px;color:#555;font-size:15px;line-height:1.6">Review the full breakdown, line items, and terms — then accept or decline when you're ready. You can also reply to this email with any questions.</p>
${emailBtn("Review Quote", `${platformUrl()}?requestId=${projectId}`)}
<p style="margin:20px 0 0;color:#999;font-size:13px">One click to view the quote in your project dashboard.</p>
`) }).catch((e) => console.error("[EMAIL] quote sent notify failed", { projectId, err: e }));

    const { data: updated } = await supabase.from("projects").select("*, service_types(name), client_ratings(name)").eq("id", projectId).single();
    const { data: items } = await supabase.from("quote_line_items").select("*").eq("project_id", projectId).order("sort_order");
    return c.json({ project: updated, lineItems: items });
  } catch (error) {
    console.error("Quote generation error:", error);
    return c.json({ error: "Failed to generate quote" }, 500);
  }
});

// ── Accept quote ──────────────────────────────────────────
app.post("/quotes/:id/accept", async (c) => {
  try {
    const { profile, error } = await getAuthUser(c);
    if (error || !profile) return c.json({ error: "Unauthorized" }, 401);
    const projectId = c.req.param("id");

    const { data: project } = await supabase.from("projects").select("client_id, status, project_name").eq("id", projectId).single();
    if (!project) return c.json({ error: "Project not found" }, 404);
    if (profile.role === "client" && project.client_id !== profile.id) return c.json({ error: "Forbidden" }, 403);
    if (project.status !== "quoted") return c.json({ error: "Quote can only be accepted when status is 'quoted'" }, 400);

    const { data: updated } = await supabase.from("projects").update({ status: "quote_accepted", accepted_at: new Date().toISOString() }).eq("id", projectId).select("*").single();
    await logActivity({ projectId, userId: profile.id, userName: profile.name, userRole: profile.role, action: "quote_accepted" });

    await supabase.from("project_messages").insert({ project_id: projectId, sender_id: profile.id, sender_name: profile.name, sender_role: profile.role, body: `Quote accepted by ${profile.name}.`, source: "system" });
    const projNameAccept = project.project_name ?? "Project";
    notifyProjectParticipants({ projectId, excludeUserId: profile.id, subject: `${esc(projNameAccept)} — Quote Accepted`, html: emailWrap(`<h2 style="margin:0 0 16px;color:#333;font-size:22px">Quote Accepted</h2><p style="color:#555;font-size:15px;line-height:1.6"><strong>${esc(profile.name)}</strong> accepted the quote. The project will proceed.</p>${emailBtn("View Project", `${platformUrl()}?requestId=${projectId}`)}`) }).catch((e) => console.error("[EMAIL] quote accept notify failed", { projectId, err: e }));

    return c.json({ project: updated });
  } catch (error) {
    return c.json({ error: "Failed to accept quote" }, 500);
  }
});

// ── Reject quote ──────────────────────────────────────────
app.post("/quotes/:id/reject", async (c) => {
  try {
    const { profile, error } = await getAuthUser(c);
    if (error || !profile) return c.json({ error: "Unauthorized" }, 401);
    const projectId = c.req.param("id");
    const { reason } = await c.req.json();

    const { data: project } = await supabase.from("projects").select("client_id, status, project_name").eq("id", projectId).single();
    if (!project) return c.json({ error: "Project not found" }, 404);
    if (profile.role === "client" && project.client_id !== profile.id) return c.json({ error: "Forbidden" }, 403);

    const { data: updated } = await supabase.from("projects").update({ status: "quote_rejected" }).eq("id", projectId).select("*").single();
    await logActivity({ projectId, userId: profile.id, userName: profile.name, userRole: profile.role, action: "quote_rejected", details: { reason } });

    await supabase.from("project_messages").insert({ project_id: projectId, sender_id: profile.id, sender_name: profile.name, sender_role: profile.role, body: `Quote declined by ${profile.name}.${reason ? ` Reason: ${reason}` : ""}`, source: "system" });
    const projNameReject = project.project_name ?? "Project";
    notifyProjectParticipants({ projectId, excludeUserId: profile.id, subject: `${esc(projNameReject)} — Quote Declined`, html: emailWrap(`<h2 style="margin:0 0 16px;color:#333;font-size:22px">Quote Declined</h2><p style="color:#555;font-size:15px;line-height:1.6"><strong>${esc(profile.name)}</strong> declined the quote.${reason ? ` Reason: ${esc(reason)}` : ""}</p>${emailBtn("View Details", `${platformUrl()}?requestId=${projectId}`)}`) }).catch((e) => console.error("[EMAIL] quote reject notify failed", { projectId, err: e }));

    return c.json({ project: updated });
  } catch (error) {
    return c.json({ error: "Failed to reject quote" }, 500);
  }
});

app.all("/quotes/*", (c) => c.json({ error: "Route not found", path: c.req.path }, 404));

Deno.serve(app.fetch);
