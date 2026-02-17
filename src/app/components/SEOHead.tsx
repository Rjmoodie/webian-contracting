/**
 * SEOHead — injects page-specific JSON-LD structured data into the document head.
 *
 * Used in public-facing pages to provide rich search results (breadcrumbs,
 * FAQ, service listings) specifically targeting Jamaica and Caribbean searches.
 */

import { useEffect } from 'react';

interface SEOHeadProps {
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

const SEO_SCRIPT_ID = '__seo_jsonld__';

export default function SEOHead({ jsonLd }: SEOHeadProps) {
  useEffect(() => {
    // Remove any previously injected SEO script
    const existing = document.getElementById(SEO_SCRIPT_ID);
    if (existing) existing.remove();

    if (!jsonLd) return;

    const script = document.createElement('script');
    script.id = SEO_SCRIPT_ID;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, [jsonLd]);

  // This component renders nothing visible
  return null;
}

/* ─── Pre-built JSON-LD helpers ──────────────────────────────────── */

const ORG_REF = { '@id': 'https://webiancontracting.com/#organization' };

export function buildServicePageJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Geophysical & Geotechnical Services by WCI Geophysics',
    description:
      'Professional GPR surveys, utility location, geophysics and geotechnical solutions, infrastructure assessment, and concrete evaluation services in Jamaica.',
    numberOfItems: 6,
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        item: {
          '@type': 'Service',
          name: 'Geophysics & Geotechnical Solutions',
          description:
            'GPR-aided geophysics and geotechnical soil investigation and subsurface profiling for construction projects in Jamaica.',
          provider: ORG_REF,
          areaServed: { '@type': 'Country', name: 'Jamaica' },
        },
      },
      {
        '@type': 'ListItem',
        position: 2,
        item: {
          '@type': 'Service',
          name: 'Infrastructure Assessment',
          description:
            'Non-destructive GPR evaluation of roads, bridges, and public infrastructure to prioritize maintenance across Jamaica.',
          provider: ORG_REF,
          areaServed: { '@type': 'Country', name: 'Jamaica' },
        },
      },
      {
        '@type': 'ListItem',
        position: 3,
        item: {
          '@type': 'Service',
          name: 'Concrete Assessment & Evaluation',
          description:
            'Advanced GPR concrete scanning for void detection, rebar mapping, crack analysis, and quality assurance.',
          provider: ORG_REF,
          areaServed: { '@type': 'Country', name: 'Jamaica' },
        },
      },
      {
        '@type': 'ListItem',
        position: 4,
        item: {
          '@type': 'Service',
          name: 'Utility Location & Mapping',
          description:
            'Non-destructive underground utility locating with Ground Penetrating Radar to prevent damage and reduce project risk.',
          provider: ORG_REF,
          areaServed: { '@type': 'Country', name: 'Jamaica' },
        },
      },
      {
        '@type': 'ListItem',
        position: 5,
        item: {
          '@type': 'Service',
          name: 'Cavity & Void Detection',
          description:
            'GPR-based sinkhole, cavity, and void detection for construction safety and geophysics and geotechnical risk assessment in Jamaica.',
          provider: ORG_REF,
          areaServed: { '@type': 'Country', name: 'Jamaica' },
        },
      },
      {
        '@type': 'ListItem',
        position: 6,
        item: {
          '@type': 'Service',
          name: 'Environmental & Contamination Studies',
          description:
            'GPR-based environmental site assessments and contamination investigations for development projects.',
          provider: ORG_REF,
          areaServed: { '@type': 'Country', name: 'Jamaica' },
        },
      },
    ],
  };
}

export function buildAboutPageJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: 'About WCI Geophysics — Webian Contracting & Geophysics Ltd',
    description:
      'Founded in 2011 by Damian Moodie, WCI Geophysics provides Jamaica and the Caribbean with cutting-edge applied geophysics and GPR solutions.',
    mainEntity: ORG_REF,
    url: 'https://webiancontracting.com/#about',
  };
}

export function buildFAQJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is Ground Penetrating Radar (GPR)?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Ground Penetrating Radar (GPR) is a non-destructive geophysical method that uses radar pulses to image the subsurface. WCI Geophysics uses GPR to locate utilities, detect voids, assess infrastructure, and support geophysics and geotechnical investigations across Jamaica.',
        },
      },
      {
        '@type': 'Question',
        name: 'What areas in Jamaica does WCI Geophysics serve?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'WCI Geophysics serves all 14 parishes of Jamaica island-wide: Kingston, St. Andrew, St. Thomas, Portland, St. Mary, St. Ann, Trelawny, St. James, Hanover, Westmoreland, St. Elizabeth, Manchester, Clarendon, and St. Catherine.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do I request a GPR survey quote in Jamaica?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'You can request a free quote by creating an account on our website at webiancontracting.com, emailing gpr@webiancontracting.com, or calling 876-784-2220 / 876-849-4612.',
        },
      },
      {
        '@type': 'Question',
        name: 'What types of projects does WCI Geophysics handle?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'WCI Geophysics handles geophysics and geotechnical investigations, utility location and mapping, infrastructure assessment, concrete evaluation, void and cavity detection, sinkhole location, environmental contamination studies, road and pavement evaluation, and archaeological surveys.',
        },
      },
      {
        '@type': 'Question',
        name: 'Does WCI Geophysics work outside Jamaica?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, WCI Geophysics has contributed to projects across the wider Caribbean and has experience in Canada. Contact us for international project inquiries.',
        },
      },
    ],
  };
}
