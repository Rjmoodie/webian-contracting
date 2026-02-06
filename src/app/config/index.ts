/**
 * Configuration System
 * 
 * This is the main configuration entry point. It loads client-specific
 * configuration based on environment variables or defaults.
 * 
 * To switch clients, set VITE_CLIENT_ID environment variable or update
 * the default client ID below.
 */

import { BrandingConfig } from './branding';
import { ThemeConfig } from './theme';
import { ContentConfig } from './content';
import { AppConfig } from './app';

// Import client configurations
import { eventCoverageJamaica } from './clients/eventCoverageJamaica';
import type { ClientConfig } from './types';

/**
 * Available client configurations
 * Add new clients here as you create them
 */
const clientConfigs: Record<string, ClientConfig> = {
  'eventcoveragejamaica': eventCoverageJamaica,
  // Add more clients here:
  // 'client2': client2Config,
  // 'client3': client3Config,
};

/**
 * Get the current client ID from environment or default
 */
const getClientId = (): string => {
  // Check environment variable first
  if (import.meta.env.VITE_CLIENT_ID) {
    return import.meta.env.VITE_CLIENT_ID.toLowerCase();
  }
  
  // Default client (can be changed here for quick switching)
  return 'eventcoveragejamaica';
};

/**
 * Get the current client configuration
 */
export const getClientConfig = (): ClientConfig => {
  const clientId = getClientId();
  const config = clientConfigs[clientId];
  
  if (!config) {
    console.warn(`Client config "${clientId}" not found. Using default.`);
    return clientConfigs['eventcoveragejamaica'];
  }
  
  return config;
};

/**
 * Convenience exports for common configs
 */
export const getBranding = (): BrandingConfig => getClientConfig().branding;
export const getTheme = (): ThemeConfig => getClientConfig().theme;
export const getContent = (): ContentConfig => getClientConfig().content;
export const getAppConfig = (): AppConfig => getClientConfig().app;

/**
 * Export types for use in components
 */
export type { BrandingConfig, ThemeConfig, ContentConfig, AppConfig, ClientConfig };
