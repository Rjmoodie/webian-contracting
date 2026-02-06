/**
 * EventCoverageJamaica Client Configuration
 * 
 * This is the configuration for the EventCoverageJamaica client.
 * To create a new client, copy this file and modify the values.
 */

import type { ClientConfig } from '../types';
import { defaultTheme, createThemeFromBranding } from '../theme';
import { defaultContent } from '../content';
import { defaultAppConfig } from '../app';

export const eventCoverageJamaica: ClientConfig = {
  clientId: 'eventcoveragejamaica',
  clientName: 'EventCoverageJamaica',
  
  branding: {
    companyName: 'EventCoverageJamaica',
    companyShortName: 'ECJ',
    tagline: 'Professional Event Services',
    description: 'A managed marketplace for professional event coverage across Jamaica',
    
    logoUrl: undefined, // Will use icon fallback
    logoIcon: 'Camera',
    faviconUrl: undefined,
    heroImageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1920&q=80',
    
    primaryColor: '#755f52',
    secondaryColor: '#BDFF1C',
    accentColor: '#c9a882',
    backgroundColor: '#f5f1eb',
    
    contactEmail: 'info@eventcoveragejamaica.com',
    contactPhone: undefined,
    website: 'https://eventcoveragejamaica.com',
    socialMedia: {
      instagram: undefined,
      facebook: undefined,
      twitter: undefined,
      linkedin: undefined,
      youtube: undefined,
    },
    
    heroTitle: 'Professional Event Coverage.\nQuality Service.',
    heroSubtitle: 'ECJ-vetted professionals deliver high-quality photography, videography, and audio services across Jamaica with reliable delivery.',
    ctaText: 'Request Coverage',
    
    features: [
      'Vetted Professionals',
      'Pro Equipment',
      'Backup Systems',
      'On-Time Delivery'
    ],
    
    coverageAreas: [
      'Kingston', 'St. Andrew', 'St. Thomas', 'Portland', 'St. Mary', 'St. Ann',
      'Trelawny', 'St. James', 'Hanover', 'Westmoreland', 'St. Elizabeth',
      'Manchester', 'Clarendon', 'St. Catherine'
    ],
  },
  
  theme: createThemeFromBranding({
    primaryColor: '#755f52',
    secondaryColor: '#BDFF1C',
    accentColor: '#c9a882',
    backgroundColor: '#f5f1eb',
  }),
  
  content: {
    ...defaultContent,
    coverageAreaLabel: 'Parishes',
    coverageAreaDescription: 'Professional event coverage available in all 14 parishes of Jamaica',
  },
  
  app: {
    ...defaultAppConfig,
    appName: 'EventCoverageJamaica',
    region: {
      country: 'Jamaica',
      currency: 'JMD',
      dateFormat: 'MM/DD/YYYY',
      timezone: 'America/Jamaica',
    },
  },
};
