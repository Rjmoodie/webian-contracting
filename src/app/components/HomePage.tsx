import React, { useRef, useEffect, useCallback } from 'react';
import { Layers, Route, Ruler, Shield, Clock, MapPin, ArrowRight, CheckCircle2, Instagram, Facebook } from 'lucide-react';
import Navigation from './Navigation';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import BrandLogo from '@/app/components/ECJLogo';
import SEOHead, { buildFAQJsonLd } from '@/app/components/SEOHead';
import { getBranding, getContent } from '@/app/config';
import concreteAssessmentImg from '../../assets/concrete-assessment.png';

const TRUST_ICONS = [Shield, CheckCircle2, MapPin, Clock] as const;

const FALLBACK_PARISHES = [
  'Kingston', 'St. Andrew', 'St. Thomas', 'Portland', 'St. Mary', 'St. Ann',
  'Trelawny', 'St. James', 'Hanover', 'Westmoreland', 'St. Elizabeth',
  'Manchester', 'Clarendon', 'St. Catherine',
] as const;

const DEFAULT_FEATURES = [
  'Vetted Professionals',
  'Professional Standards',
  'Reliable Delivery',
  'On-Time Delivery',
];

const SERVICE_CARDS = [
  { key: 'photography' as const, icon: Layers, img: '/Media/Geophysics.jpg' },
  { key: 'videography' as const, icon: Route, img: '/Media/Infrastruture-maintenance.jpg' },
  { key: 'audio' as const, icon: Ruler, img: concreteAssessmentImg },
];

/**
 * HeroVideo — forces autoplay on all browsers including Safari & mobile.
 *
 * Safari requires muted + playsInline + a programmatic .play() call.
 * We also set the `muted` property directly on the DOM element because
 * React's `muted` JSX attribute doesn't always propagate correctly in
 * Safari, causing autoplay to be blocked.
 */
function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  const tryPlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    // Ensure muted at the DOM level (Safari quirk)
    v.muted = true;
    v.play().catch(() => {
      // Autoplay blocked — retry once after a short delay (common on slow connections)
      setTimeout(() => {
        v.muted = true;
        v.play().catch(() => { /* still blocked — poster stays visible */ });
      }, 500);
    });
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    // If the video is already loaded (cached), play immediately
    if (v.readyState >= 3) {
      tryPlay();
    } else {
      v.addEventListener('canplay', tryPlay, { once: true });
    }

    return () => {
      v.removeEventListener('canplay', tryPlay);
    };
  }, [tryPlay]);

  return (
    <div className="absolute inset-0 z-0">
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        // @ts-expect-error — webkit-playsinline needed for older iOS Safari
        webkit-playsinline=""
        preload="auto"
        className="w-full h-full object-cover"
        aria-label="Webian Contracting – Ground Penetrating Radar surveys and geotechnical solutions in Jamaica"
      >
        <source src="/webian-ad.mp4" type="video/mp4" />
      </video>
    </div>
  );
}

function safeHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

interface HomePageProps {
  onNavigate: (page: string) => void;
  user: any;
  onLogout: () => void;
}

export default function HomePage({ onNavigate, user, onLogout }: HomePageProps) {
  const branding = getBranding();
  const content = getContent();
  const features = branding.features?.length ? branding.features : DEFAULT_FEATURES;
  const parishes = branding.coverageAreas?.length ? branding.coverageAreas : (FALLBACK_PARISHES as unknown as string[]);
  const goGetStarted = () => onNavigate(user ? 'client-dashboard' : 'signup');
  const footerYear = new Date().getFullYear();
  const footerHost = branding.website ? safeHostname(branding.website) : branding.companyName;

  const navServices = content?.navigation?.services ?? 'Services';
  const navAbout = content?.navigation?.about ?? 'About';
  const navContact = content?.navigation?.contact ?? 'Contact';
  const phrasesBrowse = content?.phrases?.browseServices ?? 'Browse Services';
  const phrasesLearn = content?.phrases?.learnMore ?? 'Learn more';
  const phrasesGetStarted = content?.phrases?.getStarted ?? 'Get Started';
  const coverageLabel = content?.coverageAreaLabel ?? 'Service Areas';
  const coverageDesc = content?.coverageAreaDescription ?? '';
  const legalTermsTitle = content?.legal?.termsTitle ?? 'Terms & Policies';
  const serviceCategories = content?.serviceCategories ?? { photography: 'Photography', videography: 'Videography', audio: 'Audio' };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-muted/80 scroll-smooth">
      <SEOHead jsonLd={buildFAQJsonLd()} />
      <Navigation
        user={user}
        onNavigate={onNavigate}
        onLogout={onLogout}
        variant="public"
        showNavLinks={true}
      />
      <div className="h-24" />

      {/* Hero — main ad video so visitors immediately see what we do */}
      <section className="relative overflow-hidden bg-secondary" aria-label="GPR and Geotechnical Solutions in Jamaica">
        <HeroVideo />
        <div className="absolute inset-0 z-[1] bg-gradient-to-t from-black/90 via-black/30 to-transparent" aria-hidden="true" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 min-h-[50vh] flex flex-col justify-end">
          <div className="max-w-2xl">
            <h1 className="typography-page-title-hero mb-3">
              GPR Surveys &amp; Geotechnical Solutions in Jamaica
            </h1>
            <p className="typography-body-sm text-white/80 mb-8 max-w-lg">
              {branding.tagline} — Ground Penetrating Radar (GPR) services, utility location, infrastructure assessment, and subsurface investigation across Jamaica and the Caribbean.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg px-6 py-6 shadow-lg"
                onClick={goGetStarted}
              >
                {branding.ctaText}
                <ArrowRight className="w-4 h-4 ml-2 shrink-0" />
              </Button>
              <Button
                size="lg"
                className="bg-white text-secondary hover:bg-white/90 font-semibold rounded-lg px-6 py-6 shadow-lg border-0"
                onClick={() => onNavigate('services')}
              >
                {phrasesBrowse}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Signals / Features */}
      <section className="py-8 sm:py-12 px-4 bg-card" aria-label="Why choose WCI Geophysics">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {features.slice(0, 4).map((feature, i) => {
              const Icon = TRUST_ICONS[i] ?? Shield;
              return (
                <div key={feature ?? i} className="text-center group">
                  <div className="w-14 h-14 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform shadow-md">
                    <Icon className="w-7 h-7" aria-hidden="true" />
                  </div>
                  <h2 className="typography-card-title mb-1">{feature}</h2>
                  <p className="typography-caption">{phrasesLearn}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Mission, Best services, Our Solution — three columns */}
      <section className="py-12 sm:py-16 px-4 bg-secondary text-white" aria-labelledby="mission-heading">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
            {/* Our Mission */}
            <article className="flex flex-col">
              <h2 id="mission-heading" className="typography-section-title text-white mb-4">Our Mission — Applied Geophysics for Jamaica</h2>
              <div className="relative overflow-hidden rounded-xl mb-4 aspect-[4/3] bg-black/20">
                <ImageWithFallback
                  src="/mission-1.png"
                  alt="Ground Penetrating Radar data visualization showing subsurface soil layers and anomalies in Jamaica"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <p className="text-white/90 text-sm sm:text-base leading-relaxed">
                {branding.description}
              </p>
            </article>

            {/* Best services in Geophysics */}
            <article className="flex flex-col">
              <h2 className="typography-section-title text-white mb-4">GPR Services &amp; Geophysics Expertise</h2>
              <div className="relative overflow-hidden rounded-xl mb-4 aspect-[4/3] bg-black/20">
                <ImageWithFallback
                  src="/mission-2.png"
                  alt="WCI Geophysics technician operating Ground Penetrating Radar equipment during a field survey in Jamaica"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <ul className="space-y-2 text-white/90 text-sm sm:text-base list-disc list-inside">
                <li>Utility location and mapping</li>
                <li>Archeology studies</li>
                <li>Infrastructure maintenance assessment</li>
                <li>As-built verification</li>
                <li>Underground storage tank detection</li>
                <li>Road and pavement evaluation</li>
                <li>Sinkhole and void detection</li>
              </ul>
            </article>

            {/* Our Solution */}
            <article className="flex flex-col">
              <h2 className="typography-section-title text-white mb-4">Non-Destructive Testing Solutions</h2>
              <div className="relative overflow-hidden rounded-xl mb-4 aspect-[4/3] bg-black/20">
                <ImageWithFallback
                  src="/mission-3.png"
                  alt="GPR subsurface scan results used for geotechnical engineering analysis in the Caribbean"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <ul className="space-y-2 text-white/90 text-sm sm:text-base list-disc list-inside">
                <li>Geotechnical and geological solutions</li>
                <li>Infrastructure assessment</li>
                <li>Concrete assessment and evaluation</li>
                <li>Environmental and contamination studies</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      {/* Geotechnical and Geological Solutions */}
      <section className="py-12 sm:py-16 px-4 bg-card" aria-labelledby="geotechnical-heading">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="relative overflow-hidden rounded-2xl shadow-lg aspect-[4/3] bg-muted">
              <ImageWithFallback
                src="/Media/Geophysics.jpg"
                alt="WCI Geophysics team conducting GPR geotechnical soil investigation at a construction site in Jamaica"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div>
              <h2 id="geotechnical-heading" className="typography-section-title-large mb-6">
                Geotechnical &amp; Geological Solutions — GPR Soil Investigation Jamaica
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Geotechnical Engineers are tasked to determine the failure mode of the soil for a particular project. This can be a very challenging, costly and time consuming task for highly variable and complex soil deposits (e.g. peaty soils, voids in limestone and erodible soils).
                </p>
                <p>
                  WCI Geophysics have aided many geotechnical investigations using Ground Penetrating Radar, multiple frequency data acquisition and post data processing, to provide accurate and unparalleled information about the soil strata/profile for various projects throughout Jamaica.
                </p>
                <p>
                  Geophysical data and geotechnical borelog results (SPT) are correlated to enhance and maximize the understanding of the interactive in situ soil profile.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Infrastructure Assessment */}
      <section className="py-12 sm:py-16 px-4 bg-muted/50" aria-labelledby="infrastructure-heading">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="order-2 lg:order-1">
              <h2 id="infrastructure-heading" className="typography-section-title-large mb-6">
                Infrastructure Assessment — Non-Destructive Testing Jamaica
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Our public and private infrastructure have reached or are fast approaching their end of life and are slowly deteriorating beyond service levels. Maintaining and repairing this infrastructure is the only way to prevent life-threatening accidents due to infrastructure failure.
                </p>
                <p>
                  Limited funding should, therefore, be allocated to the most critical projects. Decision makers and asset managers are then required to make meaningful decisions to aid in determining where to use limited funds for maintenance and rehabilitation.
                </p>
              </div>
            </div>
            <div className="order-1 lg:order-2 relative overflow-hidden rounded-2xl shadow-lg aspect-[4/3] bg-muted">
              <ImageWithFallback
                src="/Media/Infrastruture-maintenance.jpg"
                alt="GPR infrastructure assessment and maintenance evaluation of bridges and roads in Jamaica"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Concrete Assessment and Evaluation */}
      <section className="py-12 sm:py-16 px-4 bg-card" aria-labelledby="concrete-heading">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="relative overflow-hidden rounded-2xl shadow-lg aspect-[4/3] bg-muted">
              <ImageWithFallback
                src={concreteAssessmentImg}
                alt="Technician using GPR concrete scanner for assessment on a grid layout"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div>
              <h2 id="concrete-heading" className="typography-section-title-large mb-6">
                Concrete Assessment &amp; Evaluation — GPR Rebar Mapping &amp; Void Detection
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Over the years engineers and developers have gained vast experience and knowledge with respect to concrete as a construction material. In recent years, it has been determined that concrete is not a maintenance-free material and will deteriorate over time, depending on the nature of its environment of course.
                </p>
                <p>
                  WCI combines the latest in concrete technology and material, performance and durability-based thinking with advanced GPR technology, giving us the ability to determine the location of internal voids in concrete, depth of surface cracks, size and location of cracks in concrete, and spacing of rebars. Having knowledge of these anomalies can provide valuable information to determine the residual strength of structures, life cycle or remaining life analysis, deterioration and performance analysis, as well as quality assurance investigation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Environmental and Contamination Studies */}
      <section className="py-12 sm:py-16 px-4 bg-muted/50" aria-labelledby="environmental-heading">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="order-2 lg:order-1">
              <h2 id="environmental-heading" className="typography-section-title-large mb-6">
                Environmental &amp; Contamination Studies — GPR Site Assessment
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Over the years engineers and developers have gained vast experience and knowledge with respect to concrete as a construction material. In recent years, it has been determined that concrete is not a maintenance-free material and will deteriorate over time, depending on the nature of the environment.
                </p>
                <p>
                  WCI combines the latest in concrete technology and material, performance and durability-based thinking with advanced GPR technology, giving us the ability to determine the location of internal voids in concrete, depth of surface cracks, size and location of cracks in concrete, and spacing of rebars. Having knowledge of these anomalies can provide valuable information to determine the residual strength of structures, life cycle or remaining life analysis, deterioration and performance analysis, as well as quality assurance investigation.
                </p>
              </div>
            </div>
            <div className="order-1 lg:order-2 relative overflow-hidden rounded-2xl shadow-lg aspect-[4/3] bg-muted">
              <ImageWithFallback
                src="/environmental-contamination-studies.png"
                alt="WCI Geophysics technician using Ground Penetrating Radar for environmental contamination assessment in Jamaica"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-12 sm:py-16 px-4" id="services">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <Badge className="bg-secondary text-secondary-foreground mb-3 px-3 sm:px-4 py-1.5 text-xs sm:text-sm">
              {phrasesBrowse}
            </Badge>
            <h2 className="typography-section-title-large mb-3 px-4">
              {branding.companyName} – {navServices}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 px-4">
            {SERVICE_CARDS.map(({ key, icon: Icon, img }) => {
              const label = serviceCategories[key] ?? key;
              return (
                <div key={key} className="group relative overflow-hidden rounded-2xl card-premium hover-lift cursor-pointer bg-white">
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    <ImageWithFallback
                      src={img}
                      alt={label}
                      className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-secondary via-transparent to-transparent opacity-60" aria-hidden="true" />
                    <div className="absolute bottom-4 left-4">
                      <div className="flex items-center gap-2 text-white">
                        <Icon className="w-6 h-6" />
                        <h3 className="typography-card-title-lg">{label}</h3>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-gray-700 mb-4 leading-relaxed">{branding.tagline}</p>
                    <Button className="w-full bg-primary text-primary-foreground rounded-xl shadow-md hover:opacity-90 hover:scale-105 transition-all" onClick={() => onNavigate('services')}>
                      {phrasesLearn}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Coverage / Service Areas */}
      <section className="py-12 sm:py-16 px-4 bg-gradient-to-br from-muted via-muted/80 to-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6 sm:mb-10">
            <Badge className="bg-secondary text-secondary-foreground mb-3 px-3 sm:px-4 py-1.5 text-xs sm:text-sm">
              {coverageLabel}
            </Badge>
            <h2 className="typography-section-title-large mb-3 px-4">
              {coverageLabel}
            </h2>
            {coverageDesc && (
              <p className="text-sm sm:text-base text-muted-foreground mb-2 px-4">
                {coverageDesc}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 px-4">
            {parishes.map((area) => (
              <div key={area} className="bg-card rounded-xl p-4 border border-border shadow-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                  <span className="font-medium text-foreground">{area}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-12 sm:py-16 md:py-20 px-4 overflow-hidden" aria-label="Request a GPR survey quote">
        <div className="absolute inset-0 bg-gradient-to-r from-secondary to-secondary/90" aria-hidden="true" />
        <div className="absolute inset-0 opacity-10" aria-hidden="true">
          <div className="absolute top-10 left-10 w-64 h-64 sm:w-96 sm:h-96 bg-primary rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-64 h-64 sm:w-96 sm:h-96 bg-primary rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h2 className="typography-section-title-large text-white mb-4 px-4">
            Get a GPR Survey Quote from {branding.companyName}
          </h2>
          <p className="text-base sm:text-lg text-white/90 mb-6 sm:mb-8 leading-relaxed px-4 max-w-2xl mx-auto">
            {branding.description}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
            <Button size="lg" className="bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:opacity-90 hover:scale-105 transition-all w-full sm:w-auto min-h-[48px] whitespace-nowrap" onClick={goGetStarted}>
              {phrasesGetStarted}
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 sm:ml-2 shrink-0" />
            </Button>
            <Button size="lg" variant="outline" className="glass text-white border-2 border-white/30 hover:bg-white hover:text-secondary font-semibold rounded-xl w-full sm:w-auto min-h-[48px] whitespace-nowrap" onClick={() => onNavigate('services')}>
              {phrasesBrowse}
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white text-gray-700 py-8 sm:py-12 px-4 border-t border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
            <div>
              <div className="mb-3">
                <BrandLogo size="md" className="flex-shrink-0" />
              </div>
              <p className="text-sm leading-relaxed">{branding.description}</p>
              {branding.contactPhone && <p className="text-xs mt-2 text-gray-600">{branding.contactPhone}</p>}
              {branding.contactEmail && <a href={`mailto:${branding.contactEmail}`} className="text-xs mt-1 block text-gray-700 hover:text-primary">{branding.contactEmail}</a>}
              <div className="flex flex-wrap gap-3 mt-3">
                {branding.socialMedia?.instagram && (
                  <a
                    href={branding.socialMedia.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-primary transition-colors"
                    aria-label="Instagram"
                  >
                    <Instagram className="w-4 h-4" />
                    Instagram
                  </a>
                )}
                {branding.socialMedia?.facebook && (
                  <a
                    href={branding.socialMedia.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-primary transition-colors"
                    aria-label="Facebook"
                  >
                    <Facebook className="w-4 h-4" />
                    Facebook
                  </a>
                )}
              </div>
            </div>
            <div>
              <h4 className="typography-label mb-3">{navServices}</h4>
              <ul className="space-y-2 text-sm">
                <li className="hover:text-primary cursor-pointer transition" onClick={() => onNavigate('services')}>{serviceCategories.photography}</li>
                <li className="hover:text-primary cursor-pointer transition" onClick={() => onNavigate('services')}>{serviceCategories.videography}</li>
                <li className="hover:text-primary cursor-pointer transition" onClick={() => onNavigate('services')}>{serviceCategories.audio}</li>
              </ul>
            </div>
            <div>
              <h4 className="typography-label mb-3">Company</h4>
              <ul className="space-y-2 text-sm">
                <li className="hover:text-primary cursor-pointer transition" onClick={() => onNavigate('about')}>{navAbout}</li>
                <li className="hover:text-primary cursor-pointer transition" onClick={() => onNavigate('coverage-areas')}>{coverageLabel}</li>
                <li className="hover:text-primary cursor-pointer transition" onClick={() => onNavigate('terms-policies')}>{legalTermsTitle}</li>
              </ul>
            </div>
            <div>
              <h4 className="typography-label mb-3">{navContact}</h4>
              <ul className="space-y-2 text-sm">
                <li className="hover:text-primary cursor-pointer transition" onClick={goGetStarted}>{phrasesGetStarted}</li>
                <li className="hover:text-primary cursor-pointer transition" onClick={() => onNavigate('vetting-process')}>Vetting Process</li>
                <li className="hover:text-primary cursor-pointer transition" onClick={() => onNavigate('terms-policies')}>Policies</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-6 text-center text-sm text-gray-600">
            <p>© {footerYear} {footerHost}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
