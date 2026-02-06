/**
 * SEO utilities: per-route document title and meta description.
 * Base URL and default values should match your deployment.
 */

const BASE_URL = 'https://eventcoveragejamaica.com';
const SITE_NAME = 'Event Coverage Jamaica';
const DEFAULT_DESCRIPTION =
  'Professional event coverage across Jamaica. ECJ-vetted photography, videography, and audio services. All 14 parishes.';

export interface PageMeta {
  title: string;
  description: string;
  canonical?: string;
}

const pageMeta: Record<string, PageMeta> = {
  home: {
    title: `${SITE_NAME} | Professional Event Services`,
    description: DEFAULT_DESCRIPTION,
    canonical: BASE_URL + '/',
  },
  services: {
    title: `Services | ${SITE_NAME}`,
    description:
      'Photography, videography, and audio services for events in Jamaica. Vetted professionals, pro equipment, on-time delivery.',
    canonical: BASE_URL + '/#services',
  },
  portfolio: {
    title: `Portfolio | ${SITE_NAME}`,
    description: 'See event coverage samples from ECJ professionals across Jamaica.',
    canonical: BASE_URL + '/#portfolio',
  },
  about: {
    title: `About | ${SITE_NAME}`,
    description:
      'Learn how Event Coverage Jamaica connects clients with vetted event professionals across all 14 parishes.',
    canonical: BASE_URL + '/#about',
  },
  'coverage-areas': {
    title: `Coverage Areas | ${SITE_NAME}`,
    description: 'Professional event coverage in all 14 parishes of Jamaica. Kingston to Portland, Negril to Morant Bay.',
    canonical: BASE_URL + '/#coverage-areas',
  },
  'vetting-process': {
    title: `Vetting Process | ${SITE_NAME}`,
    description: 'How we vet event coverage professionals. Quality standards and ECJ brand commitment.',
    canonical: BASE_URL + '/#vetting-process',
  },
  'terms-policies': {
    title: `Terms & Policies | ${SITE_NAME}`,
    description: 'Terms of service and policies for Event Coverage Jamaica.',
    canonical: BASE_URL + '/#terms-policies',
  },
  login: {
    title: `Sign In | ${SITE_NAME}`,
    description: 'Sign in to your Event Coverage Jamaica account.',
    canonical: BASE_URL + '/#login',
  },
  signup: {
    title: `Create Account | ${SITE_NAME}`,
    description: 'Join Event Coverage Jamaica as a client or professional.',
    canonical: BASE_URL + '/#signup',
  },
  'admin-signup': {
    title: `Admin Signup | ${SITE_NAME}`,
    description: 'Create an admin account for Event Coverage Jamaica.',
    canonical: BASE_URL + '/#admin-signup',
  },
};

function getMetaForPage(page: string): PageMeta {
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

export { BASE_URL, SITE_NAME, DEFAULT_DESCRIPTION, getMetaForPage };
