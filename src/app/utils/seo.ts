/**
 * SEO utilities: per-route document title and meta description.
 * Uses active client config for site name and descriptions.
 */

import { getBranding, getAppConfig } from '@/app/config';

export interface PageMeta {
  title: string;
  description: string;
  canonical?: string;
}

function getSiteName(): string {
  return getAppConfig().appName;
}

function getBaseUrl(): string {
  const website = getBranding().website;
  if (website) {
    try {
      const u = new URL(website);
      return u.origin;
    } catch {
      return typeof window !== 'undefined' ? window.location.origin : '';
    }
  }
  return typeof window !== 'undefined' ? window.location.origin : '';
}

function getDefaultDescription(): string {
  return getBranding().description;
}

function buildPageMeta(): Record<string, PageMeta> {
  const siteName = getSiteName();
  const baseUrl = getBaseUrl();
  const defaultDesc = getDefaultDescription();

  return {
    home: {
      title: `${siteName} | Professional Services`,
      description: defaultDesc,
      canonical: baseUrl + '/',
    },
    services: {
      title: `Services | ${siteName}`,
      description: defaultDesc,
      canonical: baseUrl + '/#services',
    },
    portfolio: {
      title: `Portfolio | ${siteName}`,
      description: defaultDesc,
      canonical: baseUrl + '/#portfolio',
    },
    about: {
      title: `About | ${siteName}`,
      description: defaultDesc,
      canonical: baseUrl + '/#about',
    },
    'coverage-areas': {
      title: `Coverage Areas | ${siteName}`,
      description: defaultDesc,
      canonical: baseUrl + '/#coverage-areas',
    },
    'vetting-process': {
      title: `Vetting Process | ${siteName}`,
      description: defaultDesc,
      canonical: baseUrl + '/#vetting-process',
    },
    'terms-policies': {
      title: `Terms & Policies | ${siteName}`,
      description: defaultDesc,
      canonical: baseUrl + '/#terms-policies',
    },
    login: {
      title: `Sign In | ${siteName}`,
      description: `Sign in to your ${siteName} account.`,
      canonical: baseUrl + '/#login',
    },
    signup: {
      title: `Create Account | ${siteName}`,
      description: `Join ${siteName} as a client or professional.`,
      canonical: baseUrl + '/#signup',
    },
    'admin-signup': {
      title: `Admin Signup | ${siteName}`,
      description: `Create an admin account for ${siteName}.`,
      canonical: baseUrl + '/#admin-signup',
    },
  };
}

function getMetaForPage(page: string): PageMeta {
  const pageMeta = buildPageMeta();
  return pageMeta[page] ?? pageMeta.home;
}

/**
 * Update document title and meta description for the current page.
 * Call from App when currentPage or route changes.
 */
export function updateDocumentMeta(page: string): void {
  const meta = getMetaForPage(page);
  document.title = meta.title;

  let descEl = document.querySelector('meta[name="description"]');
  if (!descEl) {
    descEl = document.createElement('meta');
    descEl.setAttribute('name', 'description');
    document.head.appendChild(descEl);
  }
  descEl.setAttribute('content', meta.description);

  let canonicalEl = document.querySelector('link[rel="canonical"]');
  if (meta.canonical) {
    if (!canonicalEl) {
      canonicalEl = document.createElement('link');
      canonicalEl.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.setAttribute('href', meta.canonical);
  } else if (canonicalEl) {
    canonicalEl.remove();
  }
}

export { getMetaForPage };
export const BASE_URL = () => getBaseUrl();
export const SITE_NAME = () => getSiteName();
export const DEFAULT_DESCRIPTION = () => getDefaultDescription();
