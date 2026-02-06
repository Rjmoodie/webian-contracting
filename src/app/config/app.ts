/**
 * Application Configuration
 * 
 * App-level settings, feature flags, and regional configuration
 */

import type { AppConfig } from './types';

/**
 * Default application configuration
 */
export const defaultAppConfig: AppConfig = {
  appName: 'EventCoverageJamaica',
  appVersion: '1.0.0',
  
  features: {
    portfolio: true,
    coverageMap: true,
    talentApplication: true,
    serviceManagement: true,
  },
  
  region: {
    country: 'Jamaica',
    currency: 'JMD',
    dateFormat: 'MM/DD/YYYY',
    timezone: 'America/Jamaica',
  },
  
  api: {
    timeout: 30000, // 30 seconds
  },
};

export type { AppConfig };
