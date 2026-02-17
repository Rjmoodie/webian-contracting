/**
 * Lookups Edge Function
 * Handles: service types, client ratings, combined lookups (public)
 */
import { createApp } from "../_shared/cors.ts";
import { supabase } from "../_shared/supabase.ts";

const app = createApp();

app.get("/lookups/health", (c) => c.json({ status: "ok", fn: "lookups" }));

// ── Service types ─────────────────────────────────────────
app.get("/lookups/services", async (c) => {
  try {
    const { data, error } = await supabase.from("service_types").select("*");
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ services: data });
  } catch (error) {
    return c.json({ error: "Failed to fetch service types" }, 500);
  }
});

// ── Single service type ───────────────────────────────────
app.get("/lookups/services/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const { data } = await supabase.from("service_types").select("*").eq("id", id).single();
    if (!data) return c.json({ error: "Not found" }, 404);
    return c.json({ service: data });
  } catch (error) {
    return c.json({ error: "Failed to fetch service" }, 500);
  }
});

// ── Client ratings ────────────────────────────────────────
app.get("/lookups/client-ratings", async (c) => {
  try {
    const { data, error } = await supabase.from("client_ratings").select("*");
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ ratings: data });
  } catch (error) {
    return c.json({ error: "Failed to fetch client ratings" }, 500);
  }
});

// ── Combined lookups ──────────────────────────────────────
app.get("/lookups", async (c) => {
  try {
    const [serviceTypes, clientRatings] = await Promise.all([
      supabase.from("service_types").select("*"),
      supabase.from("client_ratings").select("*"),
    ]);
    return c.json({
      serviceTypes: serviceTypes.data || [],
      clientRatings: clientRatings.data || [],
      riskProfiles: [
        { value: "low", label: "Low", multiplier: 4 },
        { value: "medium", label: "Medium", multiplier: 5 },
        { value: "high", label: "High", multiplier: 7 },
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

// ── Portfolio (public): featured projects with media ───────
const SIGNED_URL_EXPIRY = 3600; // 1 hour

// Map project service type to portfolio category (matches frontend serviceCategories: photography, videography, audio)
function serviceTypeToCategory(serviceTypeName: string | null | undefined): "photography" | "videography" | "audio" {
  if (!serviceTypeName) return "photography";
  const n = serviceTypeName.toLowerCase();
  if (n.includes("utility") && n.includes("anomaly")) return "audio";   // e.g. Utility/Anomaly -> Concrete Assessment
  if (n.includes("utility")) return "videography";                       // Utility -> Infrastructure Assessment
  if (n.includes("cavity")) return "photography";                        // Cavity -> Geophysics & Geotechnical
  return "photography";
}

app.get("/lookups/portfolio", async (c) => {
  try {
    // 1) Featured projects
    const { data: projects, error: projErr } = await supabase
      .from("projects")
      .select("id, project_name, project_description, project_location, created_at, featured_at, service_type_id, service_types(name)")
      .eq("featured", true)
      .order("featured_at", { ascending: false });
    if (projErr) return c.json({ error: projErr.message }, 500);

    const projectIds = (projects || []).map((p: { id: string }) => p.id);
    let mediaByProject: Record<string, { id: string; file_path: string; content_type?: string }[]> = {};
    if (projectIds.length > 0) {
      const { data: mediaRows, error: mediaErr } = await supabase
        .from("project_media")
        .select("id, project_id, file_path, file_name, content_type, sort_order")
        .in("project_id", projectIds)
        .order("sort_order")
        .order("created_at", { ascending: true });
      if (!mediaErr && mediaRows) {
        mediaByProject = mediaRows.reduce((acc: Record<string, typeof mediaRows>, row: { project_id: string }) => {
          if (!acc[row.project_id]) acc[row.project_id] = [];
          acc[row.project_id].push(row);
          return acc;
        }, {});
      }
    }

    const projectItems = await Promise.all(
      (projects || []).map(async (p: {
        id: string;
        project_name: string;
        project_description?: string;
        project_location?: string;
        created_at: string;
        featured_at?: string;
        service_type_id?: string | null;
        service_types?: { name?: string } | null;
      }) => {
        const mediaRows = mediaByProject[p.id] || [];
        let category: "photography" | "videography" | "audio" = serviceTypeToCategory(
          (p.service_types as { name?: string } | null)?.name
        );

        const media = await Promise.all(
          mediaRows.map(async (m: { id: string; file_path: string; content_type?: string; file_name?: string }) => {
            const { data: sign } = await supabase.storage
              .from("project-media")
              .createSignedUrl(m.file_path, SIGNED_URL_EXPIRY);
            const url = sign?.signedUrl || "";
            const contentType = (m.content_type || "").toLowerCase();
            return {
              id: m.id,
              url,
              contentType,
              fileName: m.file_name || undefined,
            };
          })
        );

        const firstCt = (media[0]?.contentType || "").toLowerCase();
        if (firstCt.startsWith("video/")) category = "videography";
        else if (firstCt.startsWith("audio/") || firstCt.includes("audio")) category = "audio";

        const coverUrl = media[0]?.url || "";

        return {
          id: p.id,
          title: p.project_name,
          description: p.project_description || undefined,
          category,
          coverUrl,
          parish: p.project_location,
          date: p.created_at,
          featured: true,
          media,
          mediaUrl: coverUrl,
          thumbnailUrl: coverUrl,
        };
      })
    );

    // 2) Past work / portfolio items (no project)
    const { data: pastItems, error: pastErr } = await supabase
      .from("portfolio_items")
      .select("id, title, description, category, location, created_at")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (pastErr) {
      console.warn("[lookups/portfolio] portfolio_items not available:", pastErr.message);
    }

    let pastWorkItems: { id: string; title: string; description?: string; category: "photography" | "videography" | "audio"; mediaUrl: string; thumbnailUrl: string; parish?: string; date: string; featured: boolean }[] = [];
    if (pastItems?.length) {
      const pastIds = pastItems.map((i: { id: string }) => i.id);
      const { data: pastMedia } = await supabase
        .from("portfolio_item_media")
        .select("id, portfolio_item_id, file_path, file_name, content_type")
        .in("portfolio_item_id", pastIds)
        .order("sort_order")
        .order("created_at", { ascending: true });
      const mediaByPast = (pastMedia || []).reduce(
        (acc: Record<string, { id: string; file_path: string; file_name?: string; content_type?: string }[]>,
          row: { portfolio_item_id: string; id: string; file_path: string; file_name?: string; content_type?: string }) => {
          if (!acc[row.portfolio_item_id]) acc[row.portfolio_item_id] = [];
          acc[row.portfolio_item_id].push(row);
          return acc;
        },
        {}
      );

      pastWorkItems = await Promise.all(
        pastItems.map(async (i: { id: string; title: string; description?: string; category: string; location?: string; created_at: string }) => {
          const mediaRows = mediaByPast[i.id] || [];
          const media = await Promise.all(
            mediaRows.map(async (m: { id: string; file_path: string; file_name?: string; content_type?: string }) => {
              const { data: sign } = await supabase.storage
                .from("portfolio-item-media")
                .createSignedUrl(m.file_path, SIGNED_URL_EXPIRY);
              const url = sign?.signedUrl || "";
              const contentType = (m.content_type || "").toLowerCase();
              return { id: m.id, url, contentType, fileName: m.file_name || undefined };
            })
          );
          const coverUrl = media[0]?.url || "";
          const cat = (i.category === "videography" || i.category === "audio") ? i.category : "photography";
          return {
            id: i.id,
            title: i.title,
            description: i.description || undefined,
            category: cat as "photography" | "videography" | "audio",
            coverUrl,
            mediaUrl: coverUrl,
            thumbnailUrl: coverUrl,
            parish: i.location || undefined,
            date: i.created_at,
            featured: true,
            media,
          };
        })
      );
    }

    const items = [...pastWorkItems, ...projectItems].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    return c.json({ items });
  } catch (error) {
    console.error("Portfolio error:", error);
    return c.json({ error: "Failed to load portfolio" }, 500);
  }
});

app.all("/lookups/*", (c) => c.json({ error: "Route not found", path: c.req.path }, 404));

Deno.serve(app.fetch);
