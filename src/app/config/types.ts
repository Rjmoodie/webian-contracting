/**
 * Configuration Type Definitions
 * 
 * All configuration interfaces for the application
 */

export interface BrandingConfig {
  // Company Information
  companyName: string;
  companyShortName: string;
  tagline: string;
  description: string;
  
  // Logo & Media
  logoUrl?: string;
  logoIcon?: string; // Icon component name or emoji
  faviconUrl?: string;
  heroImageUrl?: string;
  
  // Colors
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  
  // Contact & Social
  contactEmail?: string;
  contactPhone?: string;
  contactAddress?: string;
  website?: string;
  socialMedia?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    youtube?: string;
  };
  
  // Content
  heroTitle: string;
  heroSubtitle: string;
  ctaText: string;
  
  // Features/Highlights
  features: string[];
  coverageAreas: string[];
}

export interface ThemeConfig {
  // Color Palette
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    textMuted: string;
    border: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  
  // Typography
  fonts: {
    primary: string;
    secondary?: string;
    heading?: string;
  };
  
  // Spacing & Layout
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  
  // Shadows
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}

export interface ContentConfig {
  // Page Titles
  pages: {
    home: string;
    services: string;
    portfolio: string;
    about: string;
    contact: string;
  };
  
  // Navigation Labels
  navigation: {
    home: string;
    services: string;
    solutions?: string; // e.g. "Solutions" or "Our Solutions"
    portfolio: string;
    coverageAreas?: string;
    about: string;
    contact: string;
  };
  
  // Service Categories
  serviceCategories: {
    photography: string;
    videography: string;
    audio: string;
  };
  
  // Coverage Area Labels
  coverageAreaLabel: string; // e.g., "Parishes", "Counties", "Regions"
  coverageAreaDescription?: string;
  
  // Legal Pages
  legal: {
    termsTitle: string;
    privacyTitle: string;
    termsLastUpdated?: string;
    privacyLastUpdated?: string;
  };
  
  // Common Phrases
  phrases: {
    requestCoverage: string;
    browseServices: string;
    getStarted: string;
    learnMore: string;
    viewDetails: string;
    allProjects?: string; // e.g. "All Projects" for portfolio filter
  };

  // Optional About page overrides
  aboutPage?: {
    storyIntro?: string;
    missionIntro?: string;
    differentiators?: { title: string; body: string }[];
    values?: { title: string; body: string }[];
    ctaHeading?: string;
    ctaSubtext?: string;
    ctaButtonPrimary?: string;
    ctaButtonSecondary?: string;
  };

  // Optional Signup page overrides
  signup?: {
    heading?: string;
    subheading?: string;
    adminHeading?: string;
    adminSubheading?: string;
    roleLabel?: string; // e.g. "I want to..."
    roles?: {
      client?: { label: string; description: string };
      talent?: { label: string; description: string };
      admin?: { label: string; description: string };
    };
    companyLabel?: string;
    companyPlaceholder?: string;
    submitButton?: string;
    creatingLabel?: string;
    termsPrefix?: string;
    termsLinkText?: string;
  };
}

export interface AppConfig {
  // Application Settings
  appName: string;
  appVersion: string;
  
  // Feature Flags
  features: {
    portfolio: boolean;
    coverageMap: boolean;
    talentApplication: boolean;
    serviceManagement: boolean;
  };
  
  // Regional Settings
  region: {
    country: string;
    currency?: string;
    dateFormat: string;
    timezone: string;
  };
  
  // API Configuration
  api: {
    baseUrl?: string;
    timeout: number;
  };
}

/**
 * Complete client configuration
 */
export interface ClientConfig {
  clientId: string;
  clientName: string;
  branding: BrandingConfig;
  theme: ThemeConfig;
  content: ContentConfig;
  app: AppConfig;
}
