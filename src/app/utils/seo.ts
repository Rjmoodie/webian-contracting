/**
 * SEO utilities: per-route document title, meta description, keywords,
 * Open Graph, Twitter Card, and canonical URL.
 *
 * Optimized for Google ranking in Jamaica and the Caribbean.
 */

import { getBranding, getAppConfig } from '@/app/config';

export interface PageMeta {
  title: string;
  description: string;
  canonical?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
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

  return {
    home: {
      title: `${siteName} | GPR Surveys, Utility Location & Geophysics & Geotechnical Solutions Jamaica`,
      description:
        'Webian Contracting & Geophysics Ltd (WCI Geophysics) provides Ground Penetrating Radar surveys, utility location, geophysics and geotechnical solutions, infrastructure assessment, and concrete evaluation across Jamaica and the Caribbean.',
      keywords:
        'GPR Jamaica, Ground Penetrating Radar Jamaica, geophysics and geotechnical solutions Jamaica, utility location Jamaica, geophysics Jamaica, WCI Geophysics, infrastructure assessment, concrete assessment, non-destructive testing Jamaica',
      canonical: baseUrl + '/',
      ogTitle: `${siteName} | GPR & Geophysics & Geotechnical Solutions Jamaica`,
      ogDescription:
        "Jamaica's trusted geophysics firm – GPR surveys, utility location, infrastructure assessment, and subsurface investigations. Get a quote today.",
      ogType: 'website',
    },
    services: {
      title: `GPR Services & Geophysics & Geotechnical Solutions | ${siteName}`,
      description:
        'Explore our geophysical and geotechnical services: Ground Penetrating Radar surveys, utility location and mapping, cavity and void detection, infrastructure assessment, concrete evaluation, and environmental studies. Serving Jamaica and the Caribbean.',
      keywords:
        'GPR services Jamaica, geophysics and geotechnical services Jamaica, utility mapping Jamaica, cavity detection, void detection, sinkhole detection Jamaica, concrete scanning Jamaica, infrastructure inspection, environmental site assessment Jamaica, road pavement evaluation',
      canonical: baseUrl + '/#services',
      ogTitle: `GPR & Geophysics & Geotechnical Services | ${siteName}`,
      ogDescription:
        'Professional GPR surveys, utility location, void detection, infrastructure assessment, and concrete evaluation in Jamaica. Request a quote from WCI Geophysics.',
    },
    portfolio: {
      title: `Projects & Case Studies | ${siteName}`,
      description:
        'View completed geophysical and geotechnical projects by Webian Contracting across Jamaica and the Caribbean. GPR surveys, utility location, infrastructure assessment, and subsurface investigation case studies.',
      keywords:
        'GPR projects Jamaica, geophysics and geotechnical projects Caribbean, WCI Geophysics portfolio, subsurface investigation Jamaica, utility location projects, infrastructure assessment case studies',
      canonical: baseUrl + '/#portfolio',
      ogTitle: `Our Projects | ${siteName}`,
      ogDescription:
        'Browse completed geophysical and geotechnical projects delivered across Jamaica and the wider Caribbean by WCI Geophysics.',
    },
    about: {
      title: `About WCI Geophysics – Founded 2011 | ${siteName}`,
      description:
        'WCI Geophysics was founded by Damian Moodie in 2011 to provide Jamaica and the Caribbean with cutting-edge applied geophysics. Learn about our mission, story, and commitment to geophysics and geotechnical excellence using Ground Penetrating Radar.',
      keywords:
        'about WCI Geophysics, Damian Moodie geophysics, geophysics company Jamaica, GPR experts Jamaica, Webian Contracting history, geotechnical firm Jamaica, Ground Penetrating Radar experts Caribbean',
      canonical: baseUrl + '/#about',
      ogTitle: `About Us | ${siteName}`,
      ogDescription:
        'Founded in 2011, WCI Geophysics provides geophysics and geotechnical engineers and developers across Jamaica with cutting-edge GPR and applied geophysics solutions.',
    },
    'coverage-areas': {
      title: `Service Areas – All 14 Parishes of Jamaica | ${siteName}`,
      description:
        'Webian Contracting serves all 14 parishes of Jamaica with GPR surveys, utility location, geophysics and geotechnical solutions, and infrastructure assessment. From Kingston to Montego Bay, St. Thomas to Westmoreland – full island coverage.',
      keywords:
        'geophysics Kingston Jamaica, GPR St. Andrew, utility location Montego Bay, geophysics and geotechnical services St. Catherine, infrastructure assessment Portland Jamaica, GPR surveys island-wide Jamaica, subsurface investigation all parishes Jamaica',
      canonical: baseUrl + '/#coverage-areas',
      ogTitle: `Service Areas – Jamaica Island-Wide | ${siteName}`,
      ogDescription:
        'GPR and geophysics and geotechnical services across all 14 parishes of Jamaica. From Kingston to Montego Bay – full island coverage by WCI Geophysics.',
    },
    'vetting-process': {
      title: `Our Quality & Vetting Standards | ${siteName}`,
      description:
        'Learn about WCI Geophysics rigorous vetting process, quality standards, and professional methodology for geophysics and geotechnical services in Jamaica. ISO-aligned standards and professional reporting.',
      keywords:
        'geophysics quality standards Jamaica, GPR methodology, professional geophysics and geotechnical reporting Jamaica, WCI quality assurance, non-destructive testing standards',
      canonical: baseUrl + '/#vetting-process',
      ogTitle: `Quality Standards | ${siteName}`,
      ogDescription:
        'Rigorous quality standards and professional methodology for all geophysical and geotechnical services delivered by WCI Geophysics.',
    },
    'terms-policies': {
      title: `Terms of Service & Privacy Policy | ${siteName}`,
      description:
        'Read the terms of service, privacy policy, and data protection policies for Webian Contracting & Geophysics Ltd. Transparent and fair business practices for all geophysics and geotechnical engagements.',
      keywords:
        'WCI Geophysics terms, Webian Contracting privacy policy, geophysics Jamaica terms of service',
      canonical: baseUrl + '/#terms-policies',
      ogTitle: `Terms & Policies | ${siteName}`,
      ogDescription: `Terms of service and privacy policy for ${siteName}.`,
    },
    login: {
      title: `Client Portal – Sign In | ${siteName}`,
      description: `Sign in to your ${siteName} client portal to manage projects, view reports, and track quotes.`,
      keywords: 'WCI Geophysics login, Webian Contracting client portal',
      canonical: baseUrl + '/#login',
    },
    signup: {
      title: `Create Account – Get a Quote | ${siteName}`,
      description: `Create a free account with ${siteName} to request quotes for GPR surveys, geophysics and geotechnical solutions, and infrastructure assessments in Jamaica.`,
      keywords: 'WCI Geophysics signup, request GPR quote Jamaica, geophysics and geotechnical quote Jamaica',
      canonical: baseUrl + '/#signup',
    },
    'admin-signup': {
      title: `Admin Portal | ${siteName}`,
      description: `Admin portal for ${siteName}.`,
      canonical: baseUrl + '/#admin-signup',
    },
  };
}

function getMetaForPage(page: string): PageMeta {
  const pageMeta = buildPageMeta();
  return pageMeta[page] ?? pageMeta.home;
}

/**
 * Update document title, meta description, keywords, canonical URL,
 * Open Graph, and Twitter Card meta tags for the current page.
 * Call from App when currentPage or route changes.
 */
export function updateDocumentMeta(page: string): void {
  const meta = getMetaForPage(page);

  // Title
  document.title = meta.title;

  // Meta description
  upsertMeta('name', 'description', meta.description);

  // Meta keywords
  if (meta.keywords) {
    upsertMeta('name', 'keywords', meta.keywords);
  }

  // Canonical
  let canonicalEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
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

  // Open Graph
  upsertMeta('property', 'og:title', meta.ogTitle ?? meta.title);
  upsertMeta('property', 'og:description', meta.ogDescription ?? meta.description);
  upsertMeta('property', 'og:url', meta.canonical ?? getBaseUrl());
  if (meta.ogType) {
    upsertMeta('property', 'og:type', meta.ogType);
  }
  if (meta.ogImage) {
    upsertMeta('property', 'og:image', meta.ogImage);
  }

  // Twitter Card
  upsertMeta('name', 'twitter:title', meta.ogTitle ?? meta.title);
  upsertMeta('name', 'twitter:description', meta.ogDescription ?? meta.description);
}

/**
 * Helper to upsert a <meta> tag by attribute selector.
 */
function upsertMeta(attr: 'name' | 'property', key: string, value: string): void {
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', value);
}

export { getMetaForPage };
export const BASE_URL = () => getBaseUrl();
export const SITE_NAME = () => getSiteName();
export const DEFAULT_DESCRIPTION = () => getDefaultDescription();
