/**
 * Auth Edge Function
 * Handles: signup, get-current-user
 */
import { createApp } from "../_shared/cors.ts";
import { getAuthUser } from "../_shared/auth.ts";
import { supabase } from "../_shared/supabase.ts";

const app = createApp();

// ── Health ────────────────────────────────────────────────
app.get("/auth/health", (c) => c.json({ status: "ok", fn: "auth" }));

// ── Sign up ───────────────────────────────────────────────
app.post("/auth/signup", async (c) => {
  try {
    const { email, password, name, role, company, phone, adminSignup } = await c.req.json();
    if (!email || !password || !name || !role) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    const allowedAdminEmails = (Deno.env.get("ALLOWED_ADMIN_EMAILS") ?? "")
      .trim().toLowerCase().split(",").filter(Boolean);
    const isAllowedAdminSignup =
      adminSignup === true &&
      (role === "admin" || role === "manager") &&
      (allowedAdminEmails.length === 0 ||
        allowedAdminEmails.includes((email ?? "").trim().toLowerCase()));

    if (
      !isAllowedAdminSignup &&
      allowedAdminEmails.length > 0 &&
      (role === "admin" || role === "manager")
    ) {
      return c.json({ error: "Admin signup is restricted. Contact support." }, 403);
    }

    const safeRole = isAllowedAdminSignup ? role : "client";

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role: safeRole, company },
      email_confirm: true,
    });

    if (authError) return c.json({ error: authError.message }, 400);

    if (phone) {
      await supabase.from("profiles").update({ phone }).eq("id", authData.user.id);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .single();

    return c.json({ user: profile });
  } catch (error) {
    console.error("Signup error:", error);
    return c.json({ error: "Signup failed" }, 500);
  }
});

// ── Get current user profile ──────────────────────────────
app.get("/auth/me", async (c) => {
  try {
    const { profile, error } = await getAuthUser(c);
    if (error || !profile) return c.json({ error: error || "Profile not found" }, 401);
    return c.json({ user: profile });
  } catch (error) {
    console.error("Auth/me error:", error);
    return c.json({ error: "Failed to get user" }, 500);
  }
});

// ── Catch-all ─────────────────────────────────────────────
app.all("/auth/*", (c) => c.json({ error: "Route not found", path: c.req.path }, 404));

Deno.serve(app.fetch);
