import React from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { ArrowLeft, Shield, Award, MapPin, CheckCircle2, Target, Heart } from 'lucide-react';
import Navigation from './Navigation';
import { getBranding, getContent } from '@/app/config';

const DIFFERENTIATOR_ICONS = [Shield, Award, MapPin, Award] as const;

const DEFAULT_DIFFERENTIATORS = [
  { title: 'Quality Commitment', body: 'Every service is backed by our commitment to quality and professional standards.' },
  { title: 'Rigorous Standards', body: 'We maintain high standards in methods, equipment, and reporting.' },
  { title: 'Wide Coverage', body: 'We serve projects across our service areas with consistent, reliable delivery.' },
  { title: 'End-to-End Service', body: 'From quote to delivery, we handle the full workflow so you can focus on your project.' },
];

const DEFAULT_VALUES = [
  { title: 'Quality First', body: 'We prioritize quality in our services, deliveries, and interactions.' },
  { title: 'Trust & Transparency', body: 'We build trust through transparency and clear communication.' },
  { title: 'Accountability', body: 'We take full responsibility for every project we deliver.' },
  { title: 'Partnership', body: 'We work with our clients to reduce risk and add value.' },
];

interface AboutPageProps {
  onNavigate: (page: string) => void;
  onLogout?: () => void;
  user?: any;
}

export default function AboutPage({ onNavigate, onLogout, user }: AboutPageProps) {
  const branding = getBranding();
  const content = getContent();
  const about = content?.aboutPage;
  const differentiators = about?.differentiators ?? DEFAULT_DIFFERENTIATORS;
  const values = about?.values ?? DEFAULT_VALUES;
  const goGetStarted = () => onNavigate(user ? 'client-dashboard' : 'signup');
  const ctaPrimary = about?.ctaButtonPrimary ?? content?.phrases?.requestCoverage ?? 'Get a quote';
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
  const ctaSecondary = about?.ctaButtonSecondary ?? content?.phrases?.browseServices ?? 'Our Solutions';

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} onNavigate={onNavigate} onLogout={onLogout} variant="public" showNavLinks={false} />
      <div className="h-24" />

      <section className="relative py-20 px-4 overflow-hidden bg-gradient-to-r from-secondary to-secondary/90">
        <div className="absolute inset-0 opacity-10" aria-hidden="true">
          <div className="absolute top-10 left-10 w-96 h-96 bg-primary rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto text-center px-4">
          <Button variant="ghost" className="text-white hover:text-primary mb-4 sm:mb-6" onClick={() => onNavigate('home')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <h1 className="typography-page-title-hero mb-4 sm:mb-6">
            About {branding.companyName}
          </h1>
          <p className="typography-body text-white/90 sm:text-lg leading-relaxed">
            {branding.tagline}
          </p>
        </div>
      </section>

      <section className="py-8 sm:py-12 md:py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <Card className="mb-6 sm:mb-8 border-0 shadow-lg">
            <CardContent className="p-4 sm:p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-xl flex items-center justify-center">
                  <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
                </div>
                <h2 className="typography-section-title">Our Story</h2>
              </div>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed whitespace-pre-line">
                {about?.storyIntro ?? branding.description}
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6 sm:mb-8 border-0 shadow-lg">
            <CardContent className="p-4 sm:p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-secondary rounded-xl flex items-center justify-center">
                  <Target className="w-5 h-5 sm:w-6 sm:h-6 text-secondary-foreground" />
                </div>
                <h2 className="typography-section-title">Our Mission</h2>
              </div>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed whitespace-pre-line">
                {about?.missionIntro ?? branding.description}
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6 sm:mb-8 border-0 shadow-lg">
            <CardContent className="p-4 sm:p-6 md:p-8">
              <h2 className="typography-section-title mb-4 sm:mb-6">What Makes Us Different</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {differentiators.map((item, i) => {
                  const Icon = DIFFERENTIATOR_ICONS[i] ?? Shield;
                  return (
                    <div key={item.title} className="flex gap-4">
                      <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="typography-card-title-lg mb-2">{item.title}</h3>
                        <p className="text-muted-foreground">{item.body}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8 border-0 shadow-lg">
            <CardContent className="p-4 sm:p-6 md:p-8">
              <h2 className="typography-section-title mb-4 sm:mb-6">Our Core Values</h2>
              <div className="space-y-4">
                {values.map((item) => (
                  <div key={item.title} className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="typography-label mb-1">{item.title}</h4>
                      <p className="text-muted-foreground">{item.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-r from-primary to-primary/90">
            <CardContent className="p-4 sm:p-6 md:p-8 text-center">
              <h2 className="typography-section-title text-white mb-3 sm:mb-4">
                {about?.ctaHeading ?? `Ready to work with ${branding.companyShortName}?`}
              </h2>
              <p className="text-base sm:text-lg text-white/90 mb-4 sm:mb-6">
                {about?.ctaSubtext ?? 'Get in touch for a detailed quote or to discuss your project.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-white text-secondary hover:bg-gray-100 font-bold w-full sm:w-auto min-h-[48px] whitespace-nowrap"
                  onClick={goToQuoteFlow}
                >
                  {ctaPrimary}
                </Button>
                <Button
                  size="lg"
                  className="bg-white text-secondary hover:bg-gray-100 font-bold w-full sm:w-auto min-h-[48px] whitespace-nowrap border-0"
                  onClick={() => onNavigate('services')}
                >
                  {ctaSecondary}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
