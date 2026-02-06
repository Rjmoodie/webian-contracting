/**
 * Theme Configuration
 * 
 * Centralized theme/color system. This can be extended to support
 * multiple themes or theme switching.
 */

import type { ThemeConfig } from './types';

/**
 * Default theme configuration
 * This is used as a base and can be overridden per client
 */
export const defaultTheme: ThemeConfig = {
  colors: {
    primary: '#755f52',
    secondary: '#BDFF1C',
    accent: '#c9a882',
    background: '#f5f1eb',
    text: '#3d3d3d',
    textMuted: '#6b6b6b',
    border: 'rgba(117, 95, 82, 0.2)',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  
  fonts: {
    primary: 'Inter, system-ui, sans-serif',
    secondary: 'Playfair Display, serif',
    heading: 'Playfair Display, serif',
  },
  
  borderRadius: {
    sm: '0.375rem',   // 6px
    md: '0.5rem',     // 8px
    lg: '0.75rem',    // 12px
    xl: '1rem',       // 16px
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
};

/**
 * Helper to create theme from branding colors
 */
export const createThemeFromBranding = (branding: {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
}): ThemeConfig => {
  return {
    ...defaultTheme,
    colors: {
      ...defaultTheme.colors,
      primary: branding.primaryColor,
      secondary: branding.secondaryColor,
      accent: branding.accentColor,
      background: branding.backgroundColor,
    },
  };
};

export type { ThemeConfig };
