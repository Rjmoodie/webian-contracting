import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/app/components/ui/button';
import { Layers, Route, Ruler, CheckCircle2, TrendingUp, Award, Play } from 'lucide-react';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import Navigation from './Navigation';
import SEOHead, { buildServicePageJsonLd } from '@/app/components/SEOHead';
import { getContent, getBranding } from '@/app/config';
import { api } from '/utils/supabase/api';

const CATEGORY_IMAGE: Record<string, string> = {
  photography: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&q=80',
  videography: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1200&q=80',
  audio: 'https://images.unsplash.com/photo-1581094276641-a503c3255a0d?w=1200&q=80',
};
const DEFAULT_CATEGORY_IMAGE = CATEGORY_IMAGE.photography;

// Service-specific images (from public/Media/) — matched by service name or description (API returns name: "Cavity"|"Utility"|"Utility/Anomaly", description: full label)
const SERVICE_IMAGES: { match: (name: string, description?: string) => boolean; src: string }[] = [
  { match: (n, d) => /anomaly/i.test(n) || /anomaly|utility\s*location\s*and\s*anomaly/i.test(d ?? ''), src: '/Media/' + encodeURIComponent('Utility Location and anomaly sscan.jpg') },
  { match: (n, d) => /^Utility$/i.test(n.trim()) || (/mapping/i.test(d ?? '') && !/anomaly/i.test(d ?? '')), src: '/Media/' + encodeURIComponent('Utility Location and mapping.jpg') },
  { match: (n, d) => /cavity/i.test(n) || /cavity|void\s*detection/i.test(d ?? ''), src: '/Media/' + encodeURIComponent('Cavity Void Detection.jpg') },
];
const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  photography: Layers,
  videography: Route,
  audio: Ruler,
};
const CATEGORY_KEYS = ['photography', 'videography', 'audio'] as const;

interface ServicesPageProps {
  onNavigate: (page: string) => void;
  user: any;
  publicAnonKey?: string;
  onLogout: () => void;
}

export default function ServicesPage({ onNavigate, user, publicAnonKey, onLogout }: ServicesPageProps) {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch(`${api('lookups')}/services`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        console.log('[ServicesPage] Fetched published services:', data.services?.length || 0);
        setServices(data.services || []);
      } else {
        console.error('[ServicesPage] Failed to fetch services:', response.status);
      }
    } catch (error) {
      console.error('[ServicesPage] Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = useMemo(
    () => (selectedCategory === 'all' ? services : services.filter((s) => s.category === selectedCategory)),
    [services, selectedCategory]
  );
  const content = getContent();
  const branding = getBranding();
  const serviceCategories = content?.serviceCategories ?? { photography: 'Photography', videography: 'Videography', audio: 'Audio' };
  const allServicesLabel = 'All Services';
  const phrasesRequestCoverage = content?.phrases?.requestCoverage ?? 'Get a quote';
  const phrasesGetStarted = content?.phrases?.getStarted ?? 'Get Started';
  const phrasesBrowseServices = content?.phrases?.browseServices ?? 'Browse Services';

  const goToQuoteFlow = () => {
    try {
      sessionStorage.setItem('openCreateWizard', '1');
    } catch (_) {}
    if (user?.role === 'client') {
      onNavigate('client-dashboard');
    } else {
      onNavigate('signup');
    }
  };

  const getCategoryImage = (category: string) => CATEGORY_IMAGE[category] ?? DEFAULT_CATEGORY_IMAGE;
  const getServiceImage = (service: { serviceName?: string; name?: string; description?: string; category?: string }) => {
    const name = (service.serviceName ?? service.name ?? '').trim();
    const description = (service.description ?? '').trim();
    const found = SERVICE_IMAGES.find(({ match }) => match(name, description));
    if (found) return found.src;
    return getCategoryImage(service.category ?? 'photography');
  };
  const getCategoryIcon = (category: string) => {
    const Icon = CATEGORY_ICONS[category];
    return Icon ? <Icon className="w-3.5 h-3.5" /> : null;
  };

  return (
    <div className="min-h-screen bg-gray-50 scroll-smooth">
      <SEOHead jsonLd={buildServicePageJsonLd()} />
      <Navigation user={user} onNavigate={onNavigate} onLogout={onLogout} variant="public" showNavLinks={true} />
      <div className="h-16" />

      {/* Hero */}
      <section className="relative bg-secondary text-white py-16 sm:py-20 overflow-hidden" aria-label="Geophysical and geotechnical services in Jamaica">
        <div className="absolute inset-0 opacity-10" aria-hidden="true">
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-primary rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-[500px] h-[500px] bg-primary rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h1 className="typography-page-title-hero mb-3">
            GPR Services &amp; Geophysics &amp; Geotechnical Solutions
          </h1>
          <p className="text-white/80 typography-body-sm max-w-xl mx-auto">
            Professional Ground Penetrating Radar surveys, utility location, infrastructure assessment, concrete evaluation, and environmental studies across Jamaica and the Caribbean.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">

        {/* Filter bar — same treatment as Portfolio */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-4 py-3 mb-8">
          <div className="flex items-center gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                selectedCategory === 'all' ? 'bg-secondary text-white shadow-sm' : 'text-muted-foreground hover:bg-gray-100'
              }`}
            >
              {allServicesLabel}
            </button>
            {CATEGORY_KEYS.map((key) => {
              const Icon = CATEGORY_ICONS[key];
              return (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    selectedCategory === key ? 'bg-secondary text-white shadow-sm' : 'text-muted-foreground hover:bg-gray-100'
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{serviceCategories[key]}</span>
                  <span className="sm:hidden">{serviceCategories[key].split(/ & | and /)[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {!loading && filteredServices.length > 0 && (
          <p className="typography-caption mb-4">{filteredServices.length} service{filteredServices.length === 1 ? '' : 's'}</p>
        )}

        {/* Loading / Empty / Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-primary border-t-transparent" />
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-24">
            <Layers className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="typography-card-title-lg mb-1">No services yet</h3>
            <p className="typography-body-sm-muted">
              {selectedCategory === 'all' ? 'Services will appear here once published.' : `No ${serviceCategories[selectedCategory as keyof typeof serviceCategories] ?? selectedCategory} services yet.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className="group bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                  <ImageWithFallback
                    src={getServiceImage(service)}
                    alt={service.serviceName ?? service.description ?? service.name ?? ''}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center gap-1 bg-white/90 backdrop-blur-sm text-secondary text-xs font-medium px-2 py-1 rounded-md">
                      {getCategoryIcon(service.category)}
                      {serviceCategories[service.category as keyof typeof serviceCategories] ?? service.category}
                    </span>
                  </div>
                  {service.category === 'videography' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/30 transition-all">
                        <Play className="w-6 h-6 text-white fill-current" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="typography-card-title mb-1 group-hover:text-primary transition-colors">
                    {service.serviceName ?? service.description ?? service.name}
                  </h3>
                  {service.subType && (
                    <p className="text-xs text-primary font-medium mb-2">{service.subType}</p>
                  )}
                  <p className="typography-body-sm-muted line-clamp-2 mb-4">
                    {service.description || `${branding.tagline}. Quality service and reliable delivery.`}
                  </p>

                  {service.deliverables?.length > 0 && (
                    <ul className="space-y-1.5 mb-4">
                      {service.deliverables.slice(0, 3).map((item: string) => (
                        <li key={item} className="flex items-start gap-2 typography-caption text-foreground">
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <Button
                    className="w-full bg-secondary text-white font-medium py-2.5 rounded-lg text-sm hover:opacity-90 transition-opacity cursor-pointer"
                    onClick={goToQuoteFlow}
                  >
                    {phrasesRequestCoverage}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Trust section — simplified */}
        <section className="mt-12 sm:mt-16 bg-secondary rounded-2xl p-8 sm:p-10 overflow-hidden relative">
          <div className="absolute inset-0 opacity-10" aria-hidden="true">
            <div className="absolute top-0 right-0 w-72 h-72 bg-primary rounded-full blur-3xl" />
          </div>
          <div className="relative z-10 text-center mb-8">
            <h2 className="typography-section-title text-white mb-2">Professional GPR Service Guarantee — Jamaica &amp; Caribbean</h2>
            <p className="text-white/80 typography-body-sm max-w-xl mx-auto">
              Every service is backed by our commitment to quality and delivered to rigorous standards.
            </p>
          </div>
          <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {[
              { Icon: Award, title: 'Rigorous standards', text: 'Methods and reporting that meet professional standards' },
              { Icon: Layers, title: 'Professional tools', text: 'Applied geophysics and quality equipment' },
              { Icon: CheckCircle2, title: 'End-to-end service', text: 'From survey design to reporting and support' },
              { Icon: TrendingUp, title: 'On-time delivery', text: 'Reliable turnaround with clear deliverables' },
            ].map(({ Icon, title, text }) => (
              <div key={title} className="text-center">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h4 className="typography-label text-white mb-1">{title}</h4>
                <p className="text-white/80 typography-caption leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        {!user && (
          <div className="mt-8 sm:mt-10 bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 text-center">
            <h3 className="typography-card-title-lg mb-2">{phrasesGetStarted}</h3>
            <p className="typography-body-sm-muted mb-5 max-w-lg mx-auto">
              Join {branding.companyName} and get a detailed quote for your next geophysics and geotechnical project.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                className="bg-primary text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:opacity-90 w-full sm:w-auto cursor-pointer"
                onClick={() => onNavigate('signup')}
              >
                Create free account
              </Button>
              <Button
                variant="outline"
                className="border border-gray-200 text-secondary bg-white hover:bg-gray-50 px-6 py-2.5 rounded-lg font-medium text-sm w-full sm:w-auto cursor-pointer"
                onClick={() => onNavigate('services')}
              >
                {phrasesBrowseServices}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}