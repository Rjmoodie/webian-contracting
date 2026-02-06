/**
 * Shared Supabase Client
 * 
 * Singleton pattern to ensure only one Supabase client instance exists
 * across the entire application, preventing "Multiple GoTrueClient instances" warnings.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

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
 * Get a fresh access token from the current session
 * Attempts to refresh the session if it's expired
 */
export const getFreshToken = async (): Promise<string | null> => {
  try {
    const supabase = getSupabase();
    
    // First, try to get the current session
    let { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.warn('[getFreshToken] Error getting session:', error);
      return null;
    }
    
    // If we have a valid session with an access token, return it
    if (session?.access_token) {
      // Check if token is expired (JWT tokens have an 'exp' claim)
      try {
        const payload = JSON.parse(atob(session.access_token.split('.')[1]));
        const now = Math.floor(Date.now() / 1000);
        // If token expires in less than 60 seconds, try to refresh
        if (payload.exp && payload.exp - now < 60) {
          console.log('[getFreshToken] Token expiring soon, refreshing session...');
          const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) {
            console.warn('[getFreshToken] Error refreshing session:', refreshError);
            // Return the existing token even if refresh failed
            return session.access_token;
          }
          if (refreshedSession?.access_token) {
            return refreshedSession.access_token;
          }
        }
      } catch (e) {
        // If we can't parse the token, just return it
        console.warn('[getFreshToken] Could not parse token, returning as-is');
      }
      
      return session.access_token;
    }
    
    // If no session, try to refresh (in case we have a refresh token)
    console.log('[getFreshToken] No session found, attempting to refresh...');
    const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) {
      console.warn('[getFreshToken] Error refreshing session:', refreshError);
      return null;
    }
    
    if (refreshedSession?.access_token) {
      return refreshedSession.access_token;
    }
    
    return null;
  } catch (error) {
    console.error('[getFreshToken] Error:', error);
    return null;
  }
};
