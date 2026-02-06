/**
 * Client Configuration Template
 * 
 * Copy this file to create a new client configuration.
 * 
 * Usage:
 * 1. Copy this file: cp _template.ts clientName.ts
 * 2. Update all values below
 * 3. Import and add to src/app/config/index.ts
 * 4. Set VITE_CLIENT_ID=clientname in .env
 */

import type { ClientConfig } from '../types';
import { defaultTheme, createThemeFromBranding } from '../theme';
import { defaultContent } from '../content';
import { defaultAppConfig } from '../app';

export const clientName: ClientConfig = {
  clientId: 'clientname', // lowercase, no spaces
  clientName: 'Client Name', // Display name
  
  branding: {
    companyName: 'Your Company Name',
    companyShortName: 'YCN',
    tagline: 'Your Tagline Here',
    description: 'Your company description',
    
    logoUrl: undefined, // URL to logo image
    logoIcon: 'Camera', // Icon name or emoji
    faviconUrl: undefined,
    heroImageUrl: 'https://your-image-url.com/image.jpg',
    
    primaryColor: '#your-color',
    secondaryColor: '#your-color',
    accentColor: '#your-color',
    backgroundColor: '#your-color',
    
    contactEmail: 'info@yourcompany.com',
    contactPhone: undefined,
    website: 'https://yourcompany.com',
    socialMedia: {
      instagram: undefined,
      facebook: undefined,
      twitter: undefined,
      linkedin: undefined,
      youtube: undefined,
    },
    
    heroTitle: 'Your Hero Title',
    heroSubtitle: 'Your hero subtitle text',
    ctaText: 'Get Started',
    
    features: [
      'Feature 1',
      'Feature 2',
      'Feature 3',
      'Feature 4'
    ],
    
    coverageAreas: [
      'Area 1',
      'Area 2',
      'Area 3',
    ],
  },
  
  theme: createThemeFromBranding({
    primaryColor: '#your-primary-color',
    secondaryColor: '#your-secondary-color',
    accentColor: '#your-accent-color',
    backgroundColor: '#your-background-color',
  }),
  
  content: {
    ...defaultContent,
    coverageAreaLabel: 'Regions', // e.g., "Parishes", "Counties", "States"
    coverageAreaDescription: 'Your coverage description',
  },
  
  app: {
    ...defaultAppConfig,
    appName: 'Your App Name',
    region: {
      country: 'Your Country',
      currency: 'USD', // Currency code
      dateFormat: 'MM/DD/YYYY', // or 'DD/MM/YYYY'
      timezone: 'America/New_York', // IANA timezone
    },
  },
};
