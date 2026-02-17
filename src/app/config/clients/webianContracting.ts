/**
 * Webian Contracting & Geophysics Ltd – Client Configuration
 * Populated from https://webiancontracting.com/
 *
 * Brand colors from logo: white #FFFFFF, black #000000, red #E2582A, gray #7A7A7A
 */

import type { ClientConfig } from '../types';
import { defaultTheme } from '../theme';
import { defaultContent } from '../content';
import { defaultAppConfig } from '../app';

const WHITE = '#FFFFFF';
const BLACK = '#000000';
const RED = '#E2582A';
const GRAY = '#7A7A7A';

export const webianContracting: ClientConfig = {
  clientId: 'webiancontracting',
  clientName: 'Webian Contracting & Geophysics Ltd',

  branding: {
    companyName: 'Webian Contracting & Geophysics Ltd',
    companyShortName: 'WG',
    tagline: 'Geophysics and Geotechnical solutions',
    description:
      'To use applied geophysics to provide developers, engineers, contractors, consultants and decision makers with valuable insight below the surface of their project. This gives them the ability to make more informed decisions, reduce unforeseen risks, and save time and money on each project.',

    logoUrl: '/webian-logo.png',
    logoIcon: 'Building2',
    faviconUrl: undefined,
    heroImageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1920&q=80',

    primaryColor: RED,
    secondaryColor: BLACK,
    accentColor: RED,
    backgroundColor: WHITE,

    contactEmail: 'gpr@webiancontracting.com',
    contactPhone: '876-784-2220 / 876-849-4612',
    contactAddress: 'Lot 26, Albion Estate Yallahs, St. Thomas Jamaica',
    website: 'https://webiancontracting.com',
    socialMedia: {
      instagram: 'https://www.instagram.com/wci_geophysics/',
      facebook: 'https://www.facebook.com/wci_geophysics',
      twitter: undefined,
      linkedin: undefined,
      youtube: undefined,
    },

    heroTitle: 'View our projects',
    heroSubtitle:
      'Geophysics and Geotechnical solutions. Infrastructure Assessment. Concrete Assessment and Evaluation. Environmental and Contamination Studies.',
    ctaText: 'Request quote',

    features: [
      'Geophysics and Geotechnical Solutions',
      'Infrastructure Assessment',
      'Concrete Assessment and Evaluation',
      'Environmental and Contamination Studies',
    ],

    coverageAreas: [
      'Utility location',
      'Archeology Studies',
      'Infrastructure Maintenance',
      'As-Built Verification',
      'Underground Storage Tank',
      'Road and Pavement Evaluation',
      'Sinkhole Location',
    ],
  },

  theme: {
    ...defaultTheme,
    colors: {
      ...defaultTheme.colors,
      primary: RED,
      secondary: BLACK,
      accent: RED,
      background: WHITE,
      text: BLACK,
      textMuted: GRAY,
      border: 'rgba(0, 0, 0, 0.12)',
    },
  },

  content: {
    ...defaultContent,
    pages: {
      home: 'Home',
      services: 'Services',
      portfolio: 'Projects',
      about: 'About us',
      contact: 'Contact WCI',
    },
    navigation: {
      home: 'Home',
      services: 'Services',
      portfolio: 'Projects',
      coverageAreas: 'Solutions',
      about: 'About us',
      contact: 'Contact WCI',
    },
    serviceCategories: {
      photography: 'Geophysics & Geotechnical',
      videography: 'Infrastructure Assessment',
      audio: 'Concrete Assessment',
    },
    coverageAreaLabel: 'Service Areas',
    coverageAreaDescription:
      'Jamaica. Utility location, archeology studies, infrastructure maintenance, as-built verification, and more.',
    phrases: {
      requestCoverage: 'Get a quote',
      browseServices: 'Our Solutions',
      getStarted: 'Get Started',
      learnMore: 'Request quote',
      viewDetails: 'View Details',
      allProjects: 'All Projects',
    },
    signup: {
      heading: 'Create your account',
      subheading: 'Get quotes for geophysical and geotechnical projects, or join our team.',
      adminHeading: 'Admin Signup',
      adminSubheading: 'Create an admin account for Webian Contracting.',
      roleLabel: 'I am a...',
      roles: {
        client: {
          label: 'Request a quote',
          description: 'Developer, engineer, or project owner',
        },
        talent: {
          label: 'Join our team',
          description: 'Geophysical / technical services',
        },
        admin: {
          label: 'Admin Access',
          description: 'Manage platform',
        },
      },
      companyLabel: 'Company or organization',
      companyPlaceholder: 'e.g. Developer, Consultant, Contractor',
      submitButton: 'Create account',
      creatingLabel: 'Creating account...',
      termsPrefix: 'By creating an account, you agree to our',
      termsLinkText: 'Terms & Policies',
    },
    aboutPage: {
      storyIntro:
        'WCI Geophysics was founded by Damian Moodie (Bachelor in Construction Engineering from the University of Technology and Masters in Civil Engineering from Ryerson University, Toronto, Canada) on November 12, 2011, with aim to provide Jamaica’s engineers, consultants, developers and other industries with cutting edge, intuitive, fast and reliable results in applied geophysics. Our results provide insight to minimize unforeseen risk, minimize cost while maximizing the reliable and competence of designs, as well as prioritize and optimize decision making for each project at the design level, construction or rehabilitation stage.\n\n' +
        'WCI Geophysics strengths strives on the combination of comprehensive professional experience and knowledge in civil and construction engineering, coupled with in-depth knowledge in applied geophysics using Ground Penetrating Radar principles and applications. Through these strengths we recognize the challenges faced by our target group and can attest that our results will provide revered insight and solution to the challenges of each project.\n\n' +
        'From its commencement, WCI Geophysics contributed to the development of high profile projects in Jamaica and the wider Caribbean, whereby we provided unparalleled insight to consulting geophysics and geotechnical firms during their soil investigation and other entities in the construction industry. Some of our projects include the JPS wind turbines project in Munroe, Junction, St. Elizabeth (http://www.windfarmbop.com/tag/ground-penetrating-radar/), Grande Bahia Principe Phase 2 and 3 developments Runaway St. Ann, Silversands Housing Development Innswood, St. Catherine just to name a few.',
      missionIntro:
        'Since then, we have continued to innovate and adapt to the needs of Jamaica and the Caribbean’s new and aging infrastructure by providing concise, accurate and effective non-destructive testing (NDT) results.',
      differentiators: [
        {
          title: 'WCI Brand Commitment',
          body: 'Every service is WCI-branded and backed by our commitment to quality. We use applied geophysics to deliver reliable, actionable data for your project.',
        },
        {
          title: 'Rigorous Standards',
          body: 'Our methods and reporting meet professional standards. From utility location to concrete assessment, we deliver results you can trust.',
        },
        {
          title: 'Jamaica & Caribbean',
          body: 'We serve high-profile projects across Jamaica and the wider Caribbean—soil investigation support for geophysics and geotechnical firms, utility location, infrastructure, and more.',
        },
        {
          title: 'End-to-End Service',
          body: 'We handle survey design, data collection, processing, and reporting. You get clear deliverables and support from quote to delivery.',
        },
      ],
      values: [
        { title: 'Professional', body: 'Comprehensive experience in civil and construction engineering, and applied geophysics using Ground Penetrating Radar.' },
        { title: 'Credible', body: 'Trusted by consulting geophysics and geotechnical firms and the construction industry across Jamaica and the Caribbean.' },
        { title: 'Reliable', body: 'Concise, accurate and effective non-destructive testing results that minimize risk and support decision-making.' },
      ],
      ctaHeading: 'Ready to work with WCI?',
      ctaSubtext: 'Get a detailed quote for your next geophysics and geotechnical project.',
      ctaButtonPrimary: 'Get a quote',
      ctaButtonSecondary: 'Our Solutions',
    },
  },

  app: {
    ...defaultAppConfig,
    appName: 'Webian Contracting & Geophysics Ltd',
    region: {
      country: 'Jamaica',
      currency: 'JMD',
      dateFormat: 'MM/DD/YYYY',
      timezone: 'America/Jamaica',
    },
  },
};
