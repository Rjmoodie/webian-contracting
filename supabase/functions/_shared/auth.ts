/**
 * Shared auth helper: extract + validate JWT, return user + profile.
 */
import { supabase } from "./supabase.ts";

export async function getAuthUser(c: any) {
  const authHeader = c.req.header("Authorization") ?? c.req.header("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : (authHeader?.split(" ")[1] ?? "");
  if (!token) return { user: null, profile: null, error: "No auth token" };

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) {
    const msg = error?.message ?? "Invalid or expired token";
    return { user: null, profile: null, error: msg };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return { user, profile: null, error: "Profile not found. Ensure this user has a row in public.profiles (e.g. run set-admin-role.sql for admins)." };
  }

  return { user, profile, error: null };
}
