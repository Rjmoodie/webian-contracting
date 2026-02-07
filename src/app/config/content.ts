/**
 * Content Configuration
 * 
 * All text content, labels, and copy that can be customized per client.
 * This makes it easy to localize or customize messaging.
 */

import type { ContentConfig } from './types';

/**
 * Default content configuration
 */
export const defaultContent: ContentConfig = {
  pages: {
    home: 'Home',
    services: 'Services',
    portfolio: 'Portfolio',
    about: 'About',
    contact: 'Contact',
  },
  
  navigation: {
    home: 'Home',
    services: 'Services',
    portfolio: 'Portfolio',
    coverageAreas: 'Coverage',
    about: 'About',
    contact: 'Contact',
  },
  
  serviceCategories: {
    photography: 'Photography',
    videography: 'Videography',
    audio: 'Audio',
  },
  
  coverageAreaLabel: 'Parishes',
  coverageAreaDescription: 'Professional event coverage available in all 14 parishes',
  
  legal: {
    termsTitle: 'Terms & Policies',
    privacyTitle: 'Privacy Policy',
    termsLastUpdated: 'January 25, 2026',
    privacyLastUpdated: 'January 25, 2026',
  },
  
  phrases: {
    requestCoverage: 'Request Coverage',
    browseServices: 'Browse Services',
    getStarted: 'Get Started',
    learnMore: 'Learn More',
    viewDetails: 'View Details',
    allProjects: 'All Work',
  },

  signup: {
    heading: 'Create Account',
    subheading: 'Join our platform and get started today',
    adminHeading: 'Admin Signup',
    adminSubheading: 'Create an admin account',
    roleLabel: 'I want to...',
    roles: {
      client: { label: 'Book Event Coverage', description: 'Find & hire talent' },
      talent: { label: 'Offer My Services', description: 'Photography & video' },
      admin: { label: 'Admin Access', description: 'Manage platform' },
    },
    companyLabel: 'Company',
    companyPlaceholder: 'Your Company Name',
    submitButton: 'Create Account',
    creatingLabel: 'Creating account...',
    termsPrefix: 'By creating an account, you agree to our',
    termsLinkText: 'Terms & Policies',
  },
};

export type { ContentConfig };
