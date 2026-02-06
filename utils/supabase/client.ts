/**
 * Shared Supabase Client
 * 
 * Singleton pattern to ensure only one Supabase client instance exists
 * across the entire application, preventing "Multiple GoTrueClient instances" warnings.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info.tsx';

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      `https://${projectId}.supabase.co`,
      publicAnonKey
    );
  }
  return supabaseInstance;
};

/**
 * Get a fresh access token from the current session.
 *
 * `getSession()` returns the locally-cached session which may contain an
 * expired access token.  We decode the JWT `exp` claim and, if the token
 * expires within the next 60 seconds, call `refreshSession()` to obtain a
 * new one.  This avoids the 401 "thundering-herd" that happens when
 * multiple components all try to use a stale token at the same time.
 */
export const getFreshToken = async (): Promise<string | null> => {
  try {
    const supabase = getSupabase();
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.warn('[getFreshToken] Error getting session:', error);
      return null;
    }

    if (!session) return null;

    // Check whether the access token is expired or about to expire (60 s buffer)
    const isExpiringSoon = (() => {
      try {
        const payload = JSON.parse(atob(session.access_token.split('.')[1]));
        const expiresAt = payload.exp * 1000; // ms
        return Date.now() > expiresAt - 60_000;
      } catch {
        // If we can't decode, treat as expired to be safe
        return true;
      }
    })();

    if (!isExpiringSoon) {
      return session.access_token;
    }

    // Token is expired or expiring soon — force a refresh
    console.log('[getFreshToken] Token expiring soon, refreshing session…');
    const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();

    if (refreshError) {
      console.warn('[getFreshToken] refreshSession failed:', refreshError);
      return null;
    }

    return refreshed.session?.access_token ?? null;
  } catch (error) {
    console.error('[getFreshToken] Error:', error);
    return null;
  }
};
