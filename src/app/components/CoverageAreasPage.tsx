import React, { useState, useMemo } from 'react';
import { MapPin, CheckCircle2, ArrowLeft, Building2 } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import Navigation from './Navigation';
import { getBranding, getContent } from '@/app/config';

const PARISH_ROW_1 = ['Kingston', 'St. Andrew', 'St. Thomas', 'Portland', 'St. Mary', 'St. Ann', 'Trelawny'] as const;
const PARISH_ROW_2 = ['St. James', 'Hanover', 'Westmoreland', 'St. Elizabeth', 'Manchester', 'Clarendon', 'St. Catherine'] as const;

interface CoverageAreasPageProps {
  onNavigate: (page: string) => void;
  onLogout?: () => void;
  user?: any;
}

const PARISHES = [
  {
    name: 'Kingston',
    description: 'Capital city coverage for corporate events, conferences, festivals, and cultural celebrations',
    highlights: ['Corporate Events', 'Concerts', 'Government Functions', 'Cultural Events'],
  },
  {
    name: 'St. Andrew',
    description: 'Comprehensive coverage across Liguanea, Manor Park, and surrounding areas',
    highlights: ['Weddings', 'Corporate Events', 'Private Functions', 'Sports Events'],
  },
  {
    name: 'St. Thomas',
    description: 'Morant Bay and eastern Jamaica event coverage',
    highlights: ['Community Events', 'Weddings', 'Cultural Celebrations', 'Sports Events'],
  },
  {
    name: 'Portland',
    description: 'Port Antonio and Blue Mountains eco-tourism event coverage',
    highlights: ['Eco-Tourism Events', 'Destination Weddings', 'Cultural Festivals', 'Adventure Events'],
  },
  {
    name: 'St. Mary',
    description: 'Port Maria and surrounding coastal communities',
    highlights: ['Community Events', 'Beach Weddings', 'Agricultural Shows', 'Cultural Events'],
  },
  {
    name: 'St. Ann',
    description: 'Ocho Rios resort area and surrounding communities',
    highlights: ['Resort Weddings', 'Tourism Events', 'Festivals', 'Corporate Events'],
  },
  {
    name: 'Trelawny',
    description: 'Falmouth and north coast coverage for heritage and resort events',
    highlights: ['Heritage Events', 'Resort Functions', 'Cultural Festivals', 'Weddings'],
  },
  {
    name: 'St. James',
    description: 'Montego Bay - Jamaica\'s second city with premium event coverage',
    highlights: ['Resort Weddings', 'International Conferences', 'Music Events', 'Corporate Retreats'],
  },
  {
    name: 'Hanover',
    description: 'Lucea and north coast resort event coverage',
    highlights: ['Resort Events', 'Weddings', 'Beach Parties', 'Cultural Celebrations'],
  },
  {
    name: 'Westmoreland',
    description: 'Negril and Savanna-la-Mar resort and event coverage',
    highlights: ['Resort Weddings', 'Music Festivals', 'Beach Events', 'Tourism Events'],
  },
  {
    name: 'St. Elizabeth',
    description: 'Black River and south coast coverage for weddings and events',
    highlights: ['Destination Weddings', 'Community Events', 'Agricultural Fairs', 'Tourism Events'],
  },
  {
    name: 'Manchester',
    description: 'Mandeville and surrounding highlands event coverage',
    highlights: ['Weddings', 'Corporate Events', 'Agricultural Shows', 'Cultural Events'],
  },
  {
    name: 'Clarendon',
    description: 'Coverage across May Pen and surrounding communities',
    highlights: ['Agricultural Events', 'Community Celebrations', 'Weddings', 'Sports'],
  },
  {
    name: 'St. Catherine',
    description: 'Spanish Town and surrounding areas with focus on community and cultural events',
    highlights: ['Community Events', 'Festivals', 'Weddings', 'Corporate Functions'],
  },
];

export default function CoverageAreasPage({ onNavigate, onLogout, user }: CoverageAreasPageProps) {
  const [selectedParish, setSelectedParish] = useState<string | null>(null);
  const branding = getBranding();
  const content = getContent();
  const parishData = useMemo(
    () => PARISHES.reduce((acc, parish) => {
      acc[parish.name] = parish;
      return acc;
    }, {} as Record<string, (typeof PARISHES)[number]>),
    []
  );
  const selectedData = selectedParish ? parishData[selectedParish] : null;
  const goGetStarted = () => onNavigate(user ? 'client-dashboard' : 'signup');
  const coverageLabel = content?.coverageAreaLabel ?? 'Service Areas';
  const coverageDesc = content?.coverageAreaDescription ?? branding.description ?? '';
  const requestCoverage = content?.phrases?.requestCoverage ?? 'Get a quote';
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

  const toggleParish = (parish: string) => setSelectedParish((p) => (p === parish ? null : parish));

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} onNavigate={onNavigate} onLogout={onLogout} variant="public" showNavLinks={false} />
      <div className="h-24" />

      {/* Hero */}
      <section className="relative py-12 sm:py-16 md:py-20 px-4 overflow-hidden bg-gradient-to-r from-secondary to-secondary/90">
        <div className="absolute inset-0 opacity-10" aria-hidden="true">
          <div className="absolute top-10 left-10 w-64 h-64 sm:w-96 sm:h-96 bg-primary rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-64 h-64 sm:w-96 sm:h-96 bg-primary rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <Button variant="ghost" className="text-white hover:text-primary mb-4 sm:mb-6" onClick={() => onNavigate('home')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <div className="flex items-center justify-center gap-3 mb-4 sm:mb-6">
            <MapPin className="w-8 h-8 sm:w-10 sm:h-12 text-primary" />
          </div>
          <h1 className="typography-page-title-hero mb-4 sm:mb-6">
            GPR &amp; Geotechnical Services — All 14 Parishes of Jamaica
          </h1>
          <p className="typography-body text-white/90 sm:text-lg leading-relaxed max-w-3xl mx-auto">
            Webian Contracting provides Ground Penetrating Radar surveys, utility location, infrastructure assessment, and geotechnical solutions island-wide. From Kingston to Montego Bay, Portland to Westmoreland — full Jamaica coverage.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-4 bg-card border-b border-border">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">{branding.coverageAreas?.length ?? 7}</div>
              <div className="text-muted-foreground">{coverageLabel}</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-secondary mb-2">Jamaica</div>
              <div className="text-muted-foreground">Service regions</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">WCI</div>
              <div className="text-muted-foreground">Solutions</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-secondary mb-2">24/7</div>
              <div className="text-muted-foreground">Enquiries welcome</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-secondary mb-4">
              Service Areas Across Jamaica
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-2">
              Select a parish to see how WCI Geophysics serves your area with GPR surveys, utility location, and geotechnical solutions.
            </p>
          </div>

          <Card className="border-0 shadow-xl mb-8 overflow-hidden">
            <CardContent className="p-8 bg-gradient-to-br from-muted to-background">
              <p className="text-center text-sm text-muted-foreground mb-6 font-medium">
                {branding.tagline}
              </p>

              <div className="mb-8 w-full rounded-2xl overflow-hidden border-2 border-border shadow-xl bg-muted flex items-center justify-center min-h-[200px]">
                <div className="text-center px-4 py-8">
                  <MapPin className="w-12 h-12 text-primary mx-auto mb-3 opacity-70" />
                  <p className="text-secondary font-medium mb-1">Service areas across Jamaica</p>
                  <p className="text-sm text-muted-foreground">Use the buttons below to explore</p>
                </div>
              </div>

              {/* Parish Buttons arranged geographically */}
              <div className="space-y-3">
                <div className="flex flex-wrap justify-center gap-2">
                  {PARISH_ROW_1.map((parish) => (
                    <button
                      key={parish}
                      onClick={() => toggleParish(parish)}
                      className={`min-h-[44px] px-4 sm:px-6 py-2.5 sm:py-3 rounded-full font-bold text-xs sm:text-sm transition-all duration-300 ${
                        selectedParish === parish
                          ? 'bg-primary text-primary-foreground shadow-lg scale-105'
                          : 'bg-card text-secondary border-2 border-secondary hover:bg-secondary hover:text-secondary-foreground hover:scale-105'
                      }`}
                    >
                      {parish}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {PARISH_ROW_2.map((parish) => (
                    <button
                      key={parish}
                      onClick={() => toggleParish(parish)}
                      className={`min-h-[44px] px-4 sm:px-6 py-2.5 sm:py-3 rounded-full font-bold text-xs sm:text-sm transition-all duration-300 ${
                        selectedParish === parish
                          ? 'bg-primary text-primary-foreground shadow-lg scale-105'
                          : 'bg-card text-secondary border-2 border-secondary hover:bg-secondary hover:text-secondary-foreground hover:scale-105'
                      }`}
                    >
                      {parish}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Parish Details */}
              {selectedData && (
                <div className="mt-8 p-6 bg-card rounded-2xl border-2 border-primary shadow-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center">
                      <MapPin className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-secondary">{selectedData.name}</h3>
                      <p className="text-sm text-muted-foreground">Click again to close</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-4 text-base leading-relaxed">
                    {selectedData.description}
                  </p>
                  <div className="space-y-2">
                    <h4 className="font-bold text-secondary text-sm mb-3">Coverage specialties</h4>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {selectedData.highlights.map((highlight: string) => (
                        <div key={highlight} className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-foreground font-medium">{highlight}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {!selectedData && (
                <div className="mt-8 text-center py-12 bg-muted/50 rounded-xl border-2 border-dashed border-border">
                  <MapPin className="w-16 h-16 text-primary opacity-30 mx-auto mb-3" />
                  <p className="text-secondary font-medium">Select an area above to view details</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mt-8 border-0 shadow-lg">
            <CardContent className="p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-secondary mb-4">
                    Projects in Jamaica
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    We deliver geophysical and geotechnical solutions across Jamaica. From utility location and infrastructure assessment to concrete evaluation and environmental studies—we provide the insight you need below the surface.
                  </p>
                  <div className="bg-muted p-4 rounded-lg border-l-4 border-primary">
                    <p className="text-sm text-foreground">
                      <span className="font-bold text-secondary">WCI solutions:</span> Geotechnical and geological solutions, infrastructure assessment, concrete assessment and evaluation, and environmental and contamination studies. Get in touch for a detailed quote.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-8 border-0 shadow-lg bg-gradient-to-r from-secondary to-secondary/90">
            <CardContent className="p-8 text-center">
              <h2 className="text-3xl font-bold text-white mb-4">
                Ready to get a quote?
              </h2>
              <p className="text-lg text-white/90 mb-6">
                {branding.tagline}
              </p>
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold min-h-[48px]"
                onClick={goToQuoteFlow}
              >
                {requestCoverage}
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}