/**
 * Shared activity-log helper.
 */
import { supabase } from "./supabase.ts";

export async function logActivity(data: {
  projectId: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  oldValue?: string;
  newValue?: string;
  details?: any;
}) {
  await supabase.from("activity_log").insert({
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
