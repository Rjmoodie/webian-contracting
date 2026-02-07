/**
 * API URL resolver — maps service names to Supabase Edge Function URLs.
 *
 * Each domain (auth, projects, quotes, comms, admin, lookups) is a
 * separate Edge Function, keeping the codebase modular and deployable
 * independently.
 */
import { projectId } from './info';

const BASE = `https://${projectId}.supabase.co/functions/v1`;

/**
 * Edge function names — matches the directory names in supabase/functions/.
 */
export type ApiService = 'auth' | 'projects' | 'quotes' | 'comms' | 'admin' | 'lookups' | 'reports';

/**
 * Get the base URL for a specific edge function.
 *
 * @example
 *   api('auth')     → "https://<id>.supabase.co/functions/v1/auth"
 *   api('projects') → "https://<id>.supabase.co/functions/v1/projects"
 */
export function api(service: ApiService): string {
  return `${BASE}/${service}`;
}

/**
 * Legacy compat: returns the old monolith URL.
 * Use for any routes not yet migrated (should be none after the split).
 */
export const legacyServerUrl = `${BASE}/make-server-d8ea749c`;
