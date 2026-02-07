import React, { useState, useEffect } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { CheckCircle2, Star, TrendingUp, Users, ArrowLeft, Shield, Clock, MapPin } from 'lucide-react';
import Navigation from './Navigation';
import { getContent, getBranding } from '@/app/config';
import { api } from '/utils/supabase/api';

interface ServiceDetailPageProps {
  serviceId: string;
  onNavigate: (page: string) => void;
  user: any;
}

export default function ServiceDetailPage({ serviceId, onNavigate, user }: ServiceDetailPageProps) {
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const content = getContent();
  const branding = getBranding();
  const pagesServices = content?.pages?.services ?? 'Services';
  const phrasesRequestCoverage = content?.phrases?.requestCoverage ?? 'Get a quote';
  const goGetStarted = () => onNavigate(user ? 'client-dashboard' : 'signup');
  /** Send anon to signup (then wizard); send logged-in client to dashboard and open create-request wizard */
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

  useEffect(() => {
    fetchService();
  }, [serviceId]);

  const fetchService = async () => {
    try {
      const response = await fetch(`${api('lookups')}/services/${serviceId}`);
      if (response.ok) {
        const data = await response.json();
        setService(data.service);
      }
    } catch (error) {
      console.error('Error fetching service:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="typography-section-title mb-4">Service Not Found</h2>
          <Button onClick={() => onNavigate('services')}>{content?.phrases?.browseServices ?? 'Browse Services'}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background scroll-smooth">
      {/* Navigation */}
      <Navigation
        user={user}
        onNavigate={onNavigate}
        variant="public"
        showNavLinks={false}
      />
      {/* Spacer for fixed header */}
      <div className="h-24" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Back Button */}
        <Button variant="ghost" className="mb-6" onClick={() => onNavigate('services')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to {pagesServices}
        </Button>

        {/* Service Header */}
        <div className="bg-white rounded-lg p-4 sm:p-6 md:p-8 mb-6 shadow-sm border border-border">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 sm:mb-6 gap-4">
            <div className="flex-1">
              <Badge className="bg-primary text-white mb-3 text-xs sm:text-sm">{branding.companyShortName} • Quality Service</Badge>
              <h1 className="typography-page-title mb-2">{service.serviceName}</h1>
              {service.subType && (
                <p className="text-base sm:text-lg text-gray-600 capitalize">{service.subType}</p>
              )}
            </div>
          </div>

          <p className="text-sm sm:text-base md:text-lg text-gray-700 mb-4 sm:mb-6">{service.description}</p>

          {/* Trust Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 md:gap-6 py-4 sm:py-6 border-y border-border">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 sm:gap-2 text-primary mb-1 sm:mb-2">
                <Star className="w-4 h-4 sm:w-5 sm:h-6 fill-current" />
                <span className="text-xl sm:text-2xl md:text-3xl font-bold text-secondary">{service.averageRating || 0}</span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">Service Rating</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 sm:gap-2 text-primary mb-1 sm:mb-2">
                <Users className="w-4 h-4 sm:w-5 sm:h-6" />
                <span className="text-xl sm:text-2xl md:text-3xl font-bold text-secondary">{service.totalEventsDelivered || 0}</span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">Projects Delivered</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 sm:gap-2 text-primary mb-1 sm:mb-2">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-6" />
                <span className="text-xl sm:text-2xl md:text-3xl font-bold text-secondary">{service.onTimeDeliveryRate || 100}%</span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">On-Time Delivery</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 sm:gap-2 text-primary mb-1 sm:mb-2">
                <Users className="w-4 h-4 sm:w-5 sm:h-6" />
                <span className="text-xl sm:text-2xl md:text-3xl font-bold text-secondary">{service.repeatClientRate || 0}%</span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">Repeat Clients</p>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Button 
              size="lg" 
              className="bg-primary hover:opacity-90 w-full sm:w-auto min-h-[48px] whitespace-nowrap"
              onClick={goToQuoteFlow}
            >
              <span className="hidden sm:inline">{phrasesRequestCoverage}</span>
              <span className="sm:hidden">Request</span>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="w-full sm:w-auto min-h-[48px] whitespace-nowrap"
              onClick={() => window.open(`mailto:${branding.contactEmail ?? 'gpr@webiancontracting.com'}`, '_blank')}
            >
              <span className="hidden sm:inline">Speak to a Coordinator</span>
              <span className="sm:hidden">Contact</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Good For */}
            {service.goodFor && service.goodFor.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Perfect For</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {service.goodFor.map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="text-sm py-2 px-4">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* What's Included */}
            {service.deliverables && service.deliverables.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>What's Included</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {service.deliverables.map((item: string) => (
                      <li key={item} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Sample Work */}
            <Card>
              <CardHeader>
                <CardTitle>Sample Work</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Curated samples from {branding.companyShortName} projects
                </p>
                {service.sampleMedia && service.sampleMedia.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {service.sampleMedia.map((media: string, i: number) => (
                      <div key={media || `sample-${i}`} className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-xs sm:text-sm text-gray-500">Sample {i + 1}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-xs sm:text-sm text-gray-500">Sample work coming soon</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Coverage */}
            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Coverage Area
                </CardTitle>
              </CardHeader>
              <CardContent>
                {service.coverageParishes && service.coverageParishes.length === 14 ? (
                  <div>
                    <p className="font-semibold text-primary mb-2">Jamaica</p>
                    <p className="text-sm text-muted-foreground">Wide service coverage</p>
                  </div>
                ) : (
                  <div>
                    <p className="font-semibold mb-3">Available in {service.coverageParishes?.length || 0} area(s):</p>
                    <div className="flex flex-wrap gap-2">
                      {service.coverageParishes?.map((parish: string) => (
                        <span key={parish} className="text-xs bg-muted text-secondary px-2 py-1 rounded">
                          {parish}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* WCI Guarantee */}
            <Card className="border-2 border-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  {branding.companyShortName} Guarantee
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">Rigorous Standards</p>
                    <p className="text-xs text-muted-foreground">Methods and reporting meet professional standards</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">Professional Tools</p>
                    <p className="text-xs text-muted-foreground">Applied geophysics and quality equipment</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">End-to-End Service</p>
                    <p className="text-xs text-muted-foreground">From survey design to reporting</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Clock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">On-Time Delivery</p>
                    <p className="text-xs text-muted-foreground">Reliable turnaround times</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card>
              <CardHeader>
                <CardTitle>Questions?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full min-h-[44px] sm:min-h-0 sm:h-10 whitespace-nowrap"
                >
                  <span className="hidden sm:inline">Chat with Coordinator</span>
                  <span className="sm:hidden">Chat</span>
                </Button>
                <p className="text-xs text-gray-600 text-center">
                  Available Mon-Sat, 9am-6pm
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}