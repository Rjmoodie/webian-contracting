/**
 * Supabase project config.
 * Default: Webian project sdxhppnsfgvoqcyxcfai.
 * Override with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env if needed.
 * Dashboard: https://supabase.com/dashboard/project/sdxhppnsfgvoqcyxcfai
 */

const envUrl = typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL;
const envKey = typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY;

const WEBIAN_PROJECT_ID = 'sdxhppnsfgvoqcyxcfai';
const WEBIAN_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkeGhwcG5zZmd2b3FjeXhjZmFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MjU3NzgsImV4cCI6MjA4NjAwMTc3OH0.26oczhA4VQzECwJPIE9UH0ELMfO7Vdl1P5OfAAHNw5g';

function getProjectId(): string {
  if (envUrl) {
    try {
      const host = new URL(envUrl).hostname;
      return host.replace(/\.supabase\.co$/, '') || WEBIAN_PROJECT_ID;
    } catch {
      return WEBIAN_PROJECT_ID;
    }
  }
  return WEBIAN_PROJECT_ID;
}

function getPublicAnonKey(): string {
  if (envKey && typeof envKey === 'string') return envKey;
  return WEBIAN_ANON_KEY;
}

export const projectId = getProjectId();
export const publicAnonKey = getPublicAnonKey();
