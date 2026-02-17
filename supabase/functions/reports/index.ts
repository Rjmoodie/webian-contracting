/**
 * Reports Edge Function
 * Handles: create/prepopulate, get, update sections, upload media, issue to client, list
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
  esc,
} from "../_shared/email.ts";

const app = createApp();

app.get("/reports/health", (c) => c.json({ status: "ok", fn: "reports" }));

// ── Report section templates (Cavity vs Utility Anomaly) ───
export type ReportTemplateType = "cavity" | "utility_anomaly";

interface SectionTemplate {
  section_key: string;
  title: string;
  content: string;
}

function projectVars(project: Record<string, unknown>) {
  const client = (project.client_name as string) || "Client";
  const location = (project.project_location as string) || "N/A";
  const address = (project.project_address as string) || location;
  const description = (project.project_description as string) || "";
  const serviceType = (project.service_type_name as string) || "Geophysics & Geotechnical Survey";
  const surveyArea = project.survey_area_sqm ? `${project.survey_area_sqm} sq m` : "N/A";
  const projectCode = (project.project_code as string) || "";
  const createdDate = project.created_at
    ? new Date(project.created_at as string).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  return { client, location, address, description, serviceType, surveyArea, projectCode, createdDate };
}

/** Cavity / void detection report template */
function getCavitySections(project: Record<string, unknown>): SectionTemplate[] {
  const { client, address, location, description, serviceType, surveyArea, projectCode, createdDate } = projectVars(project);
  return [
    {
      section_key: "executive_summary",
      title: "Executive Summary",
      content: `This report presents the findings of the cavity/void detection investigation conducted for ${client} at ${address}.\n\nThe survey was undertaken to identify subsurface voids, cavities, or areas of potential ground instability that may affect the proposed development.\n\n${description ? `Project scope: ${description}` : ""}`.trim(),
    },
    {
      section_key: "introduction",
      title: "1. Introduction",
      content: `Webian Contracting Geophysics & Geotechnical Solutions was commissioned by ${client} to conduct a cavity and void detection survey at ${address}.\n\nThe objective was to assess subsurface conditions for the presence of voids, cavities, or zones of low density that could pose a risk to structures or construction.\n\nProject Code: ${projectCode}\nDate Commissioned: ${createdDate}\nSurvey Area: ${surveyArea}`,
    },
    {
      section_key: "site_description",
      title: "2. Site Description",
      content: `The project site is located at ${address}, ${location}.\n\n[Describe site conditions, topography, surface cover (paved, grass, etc.), accessibility, and any known historical or geological factors relevant to cavity/void formation.]`,
    },
    {
      section_key: "methodology",
      title: "3. Methodology",
      content: `The cavity/void detection survey was carried out using the following approach:\n\n• Equipment: [e.g. Ground Penetrating Radar (GPR), other geophysical equipment]\n• Survey grid: [Grid spacing and coverage]\n• Depth range: [Investigation depth]\n• Data processing: [Filtering, interpretation workflow]\n• Quality assurance: [Calibration, repeatability]\n\nAll work was conducted in accordance with accepted practice for subsurface void detection.`,
    },
    {
      section_key: "findings",
      title: "4. Findings & Results",
      content: `[Present the survey results.\n\nVoid/Cavity Anomalies:\n• Location, depth, approximate extent, and confidence level for each anomaly\n• Summary table or plan of anomaly locations\n\nSubsurface Layers:\n• Interpreted layering where relevant\n• Areas of concern vs. competent ground]`,
    },
    {
      section_key: "analysis",
      title: "5. Analysis & Discussion",
      content: `[Interpret the findings in the context of the project.\n\n• Significance of detected anomalies for the proposed works\n• Risk assessment (e.g. low/medium/high) for void-related hazards\n• Comparison with expected conditions or design assumptions]`,
    },
    {
      section_key: "conclusions",
      title: "6. Conclusions",
      content: `Based on the cavity/void detection survey at ${address}:\n\n1. [Conclusion regarding presence/absence of significant voids]\n2. [Conclusion on ground conditions]\n3. [Conclusion on suitability for development or need for mitigation]`,
    },
    {
      section_key: "recommendations",
      title: "7. Recommendations",
      content: `Based on the findings, the following recommendations are made:\n\n1. [e.g. Further investigation, avoidance, or remediation where anomalies were identified]\n2. [Design or construction measures if applicable]\n3. [Monitoring or validation if required]\n\nThese recommendations should be considered in the overall project design and construction planning.`,
    },
    {
      section_key: "limitations",
      title: "8. Limitations",
      content: `This report has been prepared for the exclusive use of ${client} and is subject to the following limitations:\n\n• Results reflect conditions at the time of the survey; subsurface conditions may change.\n• Interpretation is based on geophysical data; direct verification (e.g. trial pits) may be required for critical areas.\n• The report should be read in its entirety; use of sections in isolation may lead to misinterpretation.`,
    },
    {
      section_key: "appendices",
      title: "Appendices",
      content: `[Attach survey plans, radargrams or equivalent, data summaries, and reference information.]`,
    },
  ];
}

/** Utility location & anomaly scan report template */
function getUtilityAnomalySections(project: Record<string, unknown>): SectionTemplate[] {
  const { client, address, location, description, serviceType, surveyArea, projectCode, createdDate } = projectVars(project);
  return [
    {
      section_key: "executive_summary",
      title: "Executive Summary",
      content: `This report presents the findings of the utility location and anomaly scan conducted for ${client} at ${address}.\n\nThe survey was undertaken to identify and map buried utilities and subsurface anomalies to inform safe excavation and construction planning.\n\n${description ? `Project scope: ${description}` : ""}`.trim(),
    },
    {
      section_key: "introduction",
      title: "1. Introduction",
      content: `Webian Contracting was commissioned by ${client} to conduct a utility location and anomaly detection survey at ${address}.\n\nThe objective was to locate buried services (e.g. pipes, cables, ducts) and identify other subsurface anomalies that could conflict with excavation or construction.\n\nProject Code: ${projectCode}\nDate Commissioned: ${createdDate}\nSurvey Area: ${surveyArea}`,
    },
    {
      section_key: "site_description",
      title: "2. Site Description",
      content: `The project site is located at ${address}, ${location}.\n\n[Describe site layout, existing above-ground utility features (manholes, cabinets, poles), access, and any available record or as-built information.]`,
    },
    {
      section_key: "methodology",
      title: "3. Methodology",
      content: `The utility location and anomaly survey was carried out as follows:\n\n• Techniques: [e.g. GPR, EM locators, cable/pipe locators, as applicable]\n• Coverage: [Survey area and grid/line spacing]\n• Depths: [Depth range of investigation]\n• Record search: [Use of utility records or plans]\n• Marking: [How utilities/anomalies were marked on site]\n\nWork was conducted in line with accepted practice for utility detection and mapping.`,
    },
    {
      section_key: "utilities_mapped",
      title: "4. Utilities & Features Mapped",
      content: `[Summarise buried utilities and features identified.\n\n• Type (e.g. water, sewer, gas, electrical, telecom, drainage)\n• Approximate alignment, depth, and confidence\n• Plan or table of utility locations\n• Any unknown or unconfirmed services]`,
    },
    {
      section_key: "anomalies",
      title: "5. Subsurface Anomalies",
      content: `[Describe non-utility anomalies (e.g. backfill, obstructions, voids) that may affect construction.\n\n• Location and approximate extent\n• Likely cause where interpretable\n• Relevance to excavation or foundation works]`,
    },
    {
      section_key: "conflict_clearance",
      title: "6. Conflict & Clearance Assessment",
      content: `[Assess conflicts between proposed works and located utilities/anomalies.\n\n• Areas of potential conflict\n• Recommended clearance or avoidance\n• Need for further verification (e.g. potholing) or redesign]`,
    },
    {
      section_key: "conclusions",
      title: "7. Conclusions",
      content: `Based on the utility location and anomaly scan at ${address}:\n\n1. [Summary of utilities and anomalies identified]\n2. [Conclusion on suitability for planned excavation/construction]\n3. [Key constraints or risks]`,
    },
    {
      section_key: "recommendations",
      title: "8. Recommendations",
      content: `Based on the findings, the following recommendations are made:\n\n1. [e.g. Potholing or exposure at critical crossings before excavation]\n2. [Liaison with utility owners or statutory bodies where relevant]\n3. [Safe digging practices and exclusion zones]\n\nThese should be incorporated into the construction and excavation plan.`,
    },
    {
      section_key: "limitations",
      title: "9. Limitations",
      content: `This report has been prepared for the exclusive use of ${client} and is subject to the following limitations:\n\n• Detection is subject to site conditions, depth, and material type; not all utilities may have been detected.\n• Depths and positions are indicative; verify on site before excavation.\n• The report should be read in its entirety.`,
    },
    {
      section_key: "appendices",
      title: "Appendices",
      content: `[Attach survey plans, utility layout drawings, data logs, and any record plans used.]`,
    },
  ];
}

function getSectionsForTemplate(
  templateType: ReportTemplateType,
  project: Record<string, unknown>
): SectionTemplate[] {
  if (templateType === "utility_anomaly") return getUtilityAnomalySections(project);
  return getCavitySections(project);
}

// ── Create report (prepopulated) ──────────────────────────
app.post("/reports", async (c) => {
  try {
    const { profile, error } = await getAuthUser(c);
    if (error || !profile) return c.json({ error: "Unauthorized" }, 401);
    if (!["admin", "manager"].includes(profile.role)) return c.json({ error: "Forbidden" }, 403);

    const body = await c.req.json();
    const { projectId, templateType: requestedTemplate } = body;
    if (!projectId) return c.json({ error: "projectId is required" }, 400);

    // Check if report already exists
    const { data: existing } = await supabase.from("reports").select("id").eq("project_id", projectId).single();
    if (existing) return c.json({ error: "Report already exists for this project", reportId: existing.id }, 409);

    // Fetch project with service type
    const { data: project, error: projErr } = await supabase
      .from("projects")
      .select("*, service_types(name)")
      .eq("id", projectId)
      .single();
    if (projErr || !project) return c.json({ error: "Project not found" }, 404);

    const serviceTypeName = ((project.service_types as { name?: string })?.name || "").toLowerCase();
    // Resolve template: explicit request, or infer from service type name, else default cavity
    let templateType: ReportTemplateType = "cavity";
    if (requestedTemplate === "cavity" || requestedTemplate === "utility_anomaly") {
      templateType = requestedTemplate;
    } else if (
      /utility|anomaly|location|mapping|scan/.test(serviceTypeName) &&
      !/cavity|void/.test(serviceTypeName)
    ) {
      templateType = "utility_anomaly";
    } else if (/cavity|void/.test(serviceTypeName)) {
      templateType = "cavity";
    }

    const reportNumber = project.project_code ? `RPT-${project.project_code}` : `RPT-${projectId.slice(0, 8).toUpperCase()}`;
    const title = `${(project.service_types as { name?: string })?.name || "Geophysics & Geotechnical"} Report — ${project.project_name}`;

    // Create report (store template_type for reference)
    const { data: report, error: insertErr } = await supabase
      .from("reports")
      .insert({
        project_id: projectId,
        report_number: reportNumber,
        title,
        status: "draft",
        created_by: profile.id,
        template_type: templateType,
      })
      .select("*")
      .single();
    if (insertErr) return c.json({ error: insertErr.message }, 500);

    // Create prepopulated sections from the selected template
    const projectWithService = {
      ...project,
      service_type_name: (project.service_types as { name?: string })?.name || "",
    };
    const templates = getSectionsForTemplate(templateType, projectWithService);
    const sections = templates.map((t, i) => ({
      report_id: report.id,
      section_key: t.section_key,
      title: t.title,
      content: t.content,
      sort_order: i * 10,
      is_visible: true,
    }));

    const { error: secErr } = await supabase.from("report_sections").insert(sections);
    if (secErr) console.error("[REPORTS] section insert error:", secErr);

    await logActivity({
      projectId,
      userId: profile.id,
      userName: profile.name,
      userRole: profile.role,
      action: "report_created",
      details: { reportId: report.id, reportNumber },
    });

    // Fetch full report with sections
    const { data: fullSections } = await supabase
      .from("report_sections")
      .select("*")
      .eq("report_id", report.id)
      .order("sort_order");

    return c.json({ report, sections: fullSections || [] });
  } catch (error) {
    console.error("Create report error:", error);
    return c.json({ error: "Failed to create report" }, 500);
  }
});

// ── Get report for a project ──────────────────────────────
app.get("/reports/project/:projectId", async (c) => {
  try {
    const { profile, error } = await getAuthUser(c);
    if (error || !profile) return c.json({ error: "Unauthorized" }, 401);
    const projectId = c.req.param("projectId");

    const { data: report } = await supabase
      .from("reports")
      .select("*")
      .eq("project_id", projectId)
      .single();

    if (!report) return c.json({ report: null, sections: [], media: [] });

    // Clients can only see issued reports
    if (profile.role === "client" && report.status !== "issued") {
      return c.json({ report: null, sections: [], media: [] });
    }

    const [{ data: sections }, { data: media }] = await Promise.all([
      supabase.from("report_sections").select("*").eq("report_id", report.id).order("sort_order"),
      supabase.from("report_media").select("*").eq("report_id", report.id).order("sort_order"),
    ]);

    return c.json({ report, sections: sections || [], media: media || [] });
  } catch (error) {
    console.error("Get report error:", error);
    return c.json({ error: "Failed to fetch report" }, 500);
  }
});

// ── Get report by ID ──────────────────────────────────────
app.get("/reports/:id", async (c) => {
  try {
    const { profile, error } = await getAuthUser(c);
    if (error || !profile) return c.json({ error: "Unauthorized" }, 401);
    const reportId = c.req.param("id");

    const { data: report } = await supabase.from("reports").select("*").eq("id", reportId).single();
    if (!report) return c.json({ error: "Report not found" }, 404);

    if (profile.role === "client" && report.status !== "issued") {
      return c.json({ error: "Report not available" }, 403);
    }

    const [{ data: sections }, { data: media }] = await Promise.all([
      supabase.from("report_sections").select("*").eq("report_id", reportId).order("sort_order"),
      supabase.from("report_media").select("*").eq("report_id", reportId).order("sort_order"),
    ]);

    return c.json({ report, sections: sections || [], media: media || [] });
  } catch (error) {
    return c.json({ error: "Failed to fetch report" }, 500);
  }
});

// ── Update report metadata ────────────────────────────────
app.put("/reports/:id", async (c) => {
  try {
    const { profile, error } = await getAuthUser(c);
    if (error || !profile) return c.json({ error: "Unauthorized" }, 401);
    if (!["admin", "manager"].includes(profile.role)) return c.json({ error: "Forbidden" }, 403);

    const reportId = c.req.param("id");
    const body = await c.req.json();

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.title !== undefined) updates.title = body.title;
    if (body.report_number !== undefined) updates.report_number = body.report_number;
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.status !== undefined) {
      updates.status = body.status;
      if (body.status === "approved") {
        updates.approved_by = profile.id;
        updates.approved_at = new Date().toISOString();
      }
    }

    const { data: report, error: updateErr } = await supabase
      .from("reports")
      .update(updates)
      .eq("id", reportId)
      .select("*")
      .single();
    if (updateErr) return c.json({ error: updateErr.message }, 500);

    return c.json({ report });
  } catch (error) {
    return c.json({ error: "Failed to update report" }, 500);
  }
});

// ── Update a section ──────────────────────────────────────
app.put("/reports/:id/sections/:sectionId", async (c) => {
  try {
    const { profile, error } = await getAuthUser(c);
    if (error || !profile) return c.json({ error: "Unauthorized" }, 401);
    if (!["admin", "manager"].includes(profile.role)) return c.json({ error: "Forbidden" }, 403);

    const sectionId = c.req.param("sectionId");
    const body = await c.req.json();

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.title !== undefined) updates.title = body.title;
    if (body.content !== undefined) updates.content = body.content;
    if (body.sort_order !== undefined) updates.sort_order = body.sort_order;
    if (body.is_visible !== undefined) updates.is_visible = body.is_visible;

    const { data: section, error: updateErr } = await supabase
      .from("report_sections")
      .update(updates)
      .eq("id", sectionId)
      .select("*")
      .single();
    if (updateErr) return c.json({ error: updateErr.message }, 500);

    // Mark report as updated
    const reportId = c.req.param("id");
    await supabase.from("reports").update({ updated_at: new Date().toISOString() }).eq("id", reportId);

    return c.json({ section });
  } catch (error) {
    return c.json({ error: "Failed to update section" }, 500);
  }
});

// ── Add a custom section ──────────────────────────────────
app.post("/reports/:id/sections", async (c) => {
  try {
    const { profile, error } = await getAuthUser(c);
    if (error || !profile) return c.json({ error: "Unauthorized" }, 401);
    if (!["admin", "manager"].includes(profile.role)) return c.json({ error: "Forbidden" }, 403);

    const reportId = c.req.param("id");
    const { title, content, sort_order, section_key } = await c.req.json();

    const { data: section, error: insertErr } = await supabase
      .from("report_sections")
      .insert({
        report_id: reportId,
        section_key: section_key || `custom_${Date.now()}`,
        title: title || "New Section",
        content: content || "",
        sort_order: sort_order ?? 999,
        is_visible: true,
      })
      .select("*")
      .single();
    if (insertErr) return c.json({ error: insertErr.message }, 500);

    await supabase.from("reports").update({ updated_at: new Date().toISOString() }).eq("id", reportId);
    return c.json({ section });
  } catch (error) {
    return c.json({ error: "Failed to add section" }, 500);
  }
});

// ── Delete a section ──────────────────────────────────────
app.delete("/reports/:id/sections/:sectionId", async (c) => {
  try {
    const { profile, error } = await getAuthUser(c);
    if (error || !profile) return c.json({ error: "Unauthorized" }, 401);
    if (!["admin", "manager"].includes(profile.role)) return c.json({ error: "Forbidden" }, 403);

    const sectionId = c.req.param("sectionId");
    const { error: delErr } = await supabase.from("report_sections").delete().eq("id", sectionId);
    if (delErr) return c.json({ error: delErr.message }, 500);

    const reportId = c.req.param("id");
    await supabase.from("reports").update({ updated_at: new Date().toISOString() }).eq("id", reportId);
    return c.json({ ok: true });
  } catch (error) {
    return c.json({ error: "Failed to delete section" }, 500);
  }
});

// ── Reorder sections ──────────────────────────────────────
app.put("/reports/:id/reorder", async (c) => {
  try {
    const { profile, error } = await getAuthUser(c);
    if (error || !profile) return c.json({ error: "Unauthorized" }, 401);
    if (!["admin", "manager"].includes(profile.role)) return c.json({ error: "Forbidden" }, 403);

    const { order } = await c.req.json(); // [{ id, sort_order }]
    if (!Array.isArray(order)) return c.json({ error: "order array required" }, 400);

    for (const item of order) {
      await supabase.from("report_sections").update({ sort_order: item.sort_order }).eq("id", item.id);
    }

    const reportId = c.req.param("id");
    await supabase.from("reports").update({ updated_at: new Date().toISOString() }).eq("id", reportId);
    return c.json({ ok: true });
  } catch (error) {
    return c.json({ error: "Failed to reorder" }, 500);
  }
});

// ── Upload media to a section ─────────────────────────────
app.post("/reports/:id/media", async (c) => {
  try {
    const { profile, error } = await getAuthUser(c);
    if (error || !profile) return c.json({ error: "Unauthorized" }, 401);
    if (!["admin", "manager"].includes(profile.role)) return c.json({ error: "Forbidden" }, 403);

    const reportId = c.req.param("id");
    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;
    const sectionId = formData.get("sectionId") as string | null;
    const caption = formData.get("caption") as string | null;

    if (!file) return c.json({ error: "No file provided" }, 400);
    if (file.size > 25 * 1024 * 1024) return c.json({ error: "File too large (max 25MB)" }, 400);

    const ext = file.name.split(".").pop() || "bin";
    const path = `${reportId}/${crypto.randomUUID()}.${ext}`;
    const buffer = await file.arrayBuffer();

    const { error: uploadErr } = await supabase.storage
      .from("report-media")
      .upload(path, buffer, { contentType: file.type, upsert: false });
    if (uploadErr) return c.json({ error: uploadErr.message }, 500);

    const { data: media, error: insertErr } = await supabase
      .from("report_media")
      .insert({
        report_id: reportId,
        section_id: sectionId || null,
        file_path: path,
        file_name: file.name,
        file_size: file.size,
        content_type: file.type,
        caption: caption || null,
      })
      .select("*")
      .single();
    if (insertErr) return c.json({ error: insertErr.message }, 500);

    return c.json({ media });
  } catch (error) {
    console.error("Upload media error:", error);
    return c.json({ error: "Failed to upload media" }, 500);
  }
});

// ── Import media from project gallery ─────────────────────
app.post("/reports/:id/media/from-project", async (c) => {
  try {
    const { profile, error } = await getAuthUser(c);
    if (error || !profile) return c.json({ error: "Unauthorized" }, 401);
    if (!["admin", "manager"].includes(profile.role)) return c.json({ error: "Forbidden" }, 403);

    const reportId = c.req.param("id");
    const { sectionId, filePath, fileName, contentType, caption } = await c.req.json();
    if (!filePath || !fileName) return c.json({ error: "filePath and fileName are required" }, 400);

    // Download the file from project-media bucket
    const { data: fileData, error: dlErr } = await supabase.storage
      .from("project-media")
      .download(filePath);
    if (dlErr || !fileData) return c.json({ error: "Could not read project media file" }, 404);

    // Upload to report-media bucket with a new path
    const ext = fileName.split(".").pop() || "bin";
    const destPath = `${reportId}/${crypto.randomUUID()}.${ext}`;
    const buffer = await fileData.arrayBuffer();

    const { error: uploadErr } = await supabase.storage
      .from("report-media")
      .upload(destPath, buffer, { contentType: contentType || "application/octet-stream", upsert: false });
    if (uploadErr) return c.json({ error: uploadErr.message }, 500);

    // Create report_media record
    const { data: media, error: insertErr } = await supabase
      .from("report_media")
      .insert({
        report_id: reportId,
        section_id: sectionId || null,
        file_path: destPath,
        file_name: fileName,
        file_size: buffer.byteLength,
        content_type: contentType || "application/octet-stream",
        caption: caption || null,
      })
      .select("*")
      .single();
    if (insertErr) return c.json({ error: insertErr.message }, 500);

    return c.json({ media });
  } catch (error) {
    console.error("Import project media error:", error);
    return c.json({ error: "Failed to import project media" }, 500);
  }
});

// ── Delete media ──────────────────────────────────────────
app.delete("/reports/:id/media/:mediaId", async (c) => {
  try {
    const { profile, error } = await getAuthUser(c);
    if (error || !profile) return c.json({ error: "Unauthorized" }, 401);
    if (!["admin", "manager"].includes(profile.role)) return c.json({ error: "Forbidden" }, 403);

    const mediaId = c.req.param("mediaId");
    const { data: media } = await supabase.from("report_media").select("file_path").eq("id", mediaId).single();
    if (media?.file_path) {
      await supabase.storage.from("report-media").remove([media.file_path]);
    }
    await supabase.from("report_media").delete().eq("id", mediaId);
    return c.json({ ok: true });
  } catch (error) {
    return c.json({ error: "Failed to delete media" }, 500);
  }
});

// ── Issue report to client ────────────────────────────────
app.post("/reports/:id/issue", async (c) => {
  try {
    const { profile, error } = await getAuthUser(c);
    if (error || !profile) return c.json({ error: "Unauthorized" }, 401);
    if (!["admin", "manager"].includes(profile.role)) return c.json({ error: "Forbidden" }, 403);

    const reportId = c.req.param("id");
    const { data: report } = await supabase.from("reports").select("*, projects(id, project_name, client_email, client_name)").eq("id", reportId).single();
    if (!report) return c.json({ error: "Report not found" }, 404);

    const project = report.projects as { id: string; project_name: string; client_email: string; client_name: string } | null;
    if (!project) return c.json({ error: "Associated project not found" }, 404);

    // Update report status
    const { data: updated, error: updateErr } = await supabase
      .from("reports")
      .update({
        status: "issued",
        issued_at: new Date().toISOString(),
        issued_to_email: project.client_email,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reportId)
      .select("*")
      .single();
    if (updateErr) return c.json({ error: updateErr.message }, 500);

    // Update project status to delivered if applicable
    await supabase
      .from("projects")
      .update({ status: "delivered" })
      .eq("id", project.id)
      .in("status", ["reporting", "in_progress", "data_processing"]);

    await logActivity({
      projectId: project.id,
      userId: profile.id,
      userName: profile.name,
      userRole: profile.role,
      action: "report_issued",
      details: { reportId, reportNumber: report.report_number },
    });

    // Insert system message
    await supabase.from("project_messages").insert({
      project_id: project.id,
      sender_id: profile.id,
      sender_name: profile.name,
      sender_role: profile.role,
      body: `Report "${report.title}" has been issued. You can view it in your project dashboard.`,
      source: "system",
    });

    // Email notification
    const projName = esc(project.project_name || "Project");
    const reportTitle = esc(report.title || "Report");
    notifyProjectParticipants({
      projectId: project.id,
      excludeUserId: profile.id,
      subject: `${projName} — Report Delivered`,
      html: emailWrap(`
<p style="margin:0 0 20px;color:#555;font-size:16px;line-height:1.5">Your project report has been completed and is ready for review.</p>
<div style="margin:0 0 20px;padding:14px 16px;background:#f0f7ff;border-radius:8px;border-left:4px solid #E2582A">
  <p style="margin:0 0 4px;color:#333;font-size:15px;font-weight:600">${reportTitle}</p>
  <p style="margin:0;color:#666;font-size:13px">Report #${esc(report.report_number || "")}</p>
</div>
<p style="margin:0 0 24px;color:#555;font-size:15px;line-height:1.6">Log in to your dashboard to view the full report, including findings, analysis, and recommendations. You can also download the PDF for your records.</p>
${emailBtn("View Report", `${platformUrl()}?requestId=${project.id}`)}
`),
    }).catch((e) => console.error("[EMAIL] report issue notify failed", e));

    return c.json({ report: updated });
  } catch (error) {
    console.error("Issue report error:", error);
    return c.json({ error: "Failed to issue report" }, 500);
  }
});

// ── List all reports (admin) ──────────────────────────────
app.get("/reports", async (c) => {
  try {
    const { profile, error } = await getAuthUser(c);
    if (error || !profile) return c.json({ error: "Unauthorized" }, 401);

    let query = supabase
      .from("reports")
      .select("*, projects(id, project_name, client_name, project_code, status)")
      .order("created_at", { ascending: false });

    if (profile.role === "client") {
      // Clients see only issued reports for their projects
      query = supabase
        .from("reports")
        .select("*, projects!inner(id, project_name, client_name, project_code, status, client_id)")
        .eq("status", "issued")
        .eq("projects.client_id", profile.id)
        .order("issued_at", { ascending: false });
    }

    const { data, error: fetchErr } = await query;
    if (fetchErr) return c.json({ error: fetchErr.message }, 500);

    return c.json({ reports: data || [] });
  } catch (error) {
    return c.json({ error: "Failed to fetch reports" }, 500);
  }
});

app.all("/reports/*", (c) => c.json({ error: "Route not found", path: c.req.path }, 404));

Deno.serve(app.fetch);
