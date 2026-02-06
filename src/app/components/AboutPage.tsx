import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { ArrowLeft, Shield, Award, MapPin, Camera, Users, CheckCircle2, Target, Heart } from 'lucide-react';
import Navigation from './Navigation';

interface AboutPageProps {
  onNavigate: (page: string) => void;
  onLogout?: () => void;
  user?: any;
}

export default function AboutPage({ onNavigate, onLogout, user }: AboutPageProps) {
  return (
    <div className="min-h-screen bg-[#f5f1eb]">
      {/* Header */}
      <Navigation
        user={user}
        onNavigate={onNavigate}
        onLogout={onLogout}
        variant="public"
        showNavLinks={false}
      />
      {/* Spacer for fixed header */}
      <div className="h-24" />

      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden bg-gradient-to-r from-[#755f52] to-[#8b7263]">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-96 h-96 bg-[#c9a882] rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#c9a882] rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto text-center px-4">
          <Button 
            variant="ghost" 
            className="text-white hover:text-[#c9a882] mb-4 sm:mb-6"
            onClick={() => onNavigate('home')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6">
            About EventCoverageJamaica
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-[#e8dfd1] leading-relaxed">
            A managed marketplace for professional event coverage across Jamaica
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 sm:py-12 md:py-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Our Story */}
          <Card className="mb-6 sm:mb-8 border-0 shadow-premium card-premium">
            <CardContent className="p-4 sm:p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#BDFF1C] rounded-xl flex items-center justify-center">
                  <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#755f52]">Our Story</h2>
              </div>
              <div className="space-y-3 sm:space-y-4 text-sm sm:text-base text-gray-700 leading-relaxed">
                <p className="text-base sm:text-lg">
                  EventCoverageJamaica was founded on a simple but powerful mission: to make professional event coverage accessible and reliable across parishes in Jamaica.
                </p>
                <p>
                  We recognized that finding trustworthy, vetted event coverage professionals was a challenge for event organizers, businesses, and families alike. Too often, clients had to rely on word-of-mouth recommendations, scroll through countless portfolios, or take risks with unknown providers.
                </p>
                <p>
                  That's why we created a <span className="font-bold text-[#755f52]">managed marketplace model</span> where ECJ takes full responsibility for quality, reliability, and client satisfaction. We don't just connect you with talent—we guarantee your coverage.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Our Mission */}
          <Card className="mb-6 sm:mb-8 border-0 shadow-premium card-premium">
            <CardContent className="p-4 sm:p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#755f52] rounded-xl flex items-center justify-center">
                  <Target className="w-5 h-5 sm:w-6 sm:h-6 text-[#c9a882]" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#755f52]">Our Mission</h2>
              </div>
              <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
                To provide ECJ-branded event coverage services across parishes in Jamaica, backed by our vetting process, quality assurance, and commitment to quality service.
              </p>
            </CardContent>
          </Card>

          {/* What Makes Us Different */}
          <Card className="mb-6 sm:mb-8 border-0 shadow-premium card-premium">
            <CardContent className="p-4 sm:p-6 md:p-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#755f52] mb-4 sm:mb-6">What Makes Us Different</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-[#BDFF1C] rounded-xl flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-[#755f52] mb-2">ECJ Brand Commitment</h3>
                    <p className="text-gray-600">
                      We don't just connect you with talent. Every service is ECJ-branded and backed by our commitment to quality. We work to address any concerns that may arise.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-[#755f52] rounded-xl flex items-center justify-center flex-shrink-0">
                    <Award className="w-6 h-6 text-[#c9a882]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-[#755f52] mb-2">Thorough Vetting</h3>
                    <p className="text-gray-600">
                      Every talent undergoes our vetting process. Qualified professionals join our network of Certified, Premium, and Elite tiers.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-[#BDFF1C] rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-[#755f52] mb-2">Island-Wide Coverage</h3>
                    <p className="text-gray-600">
                      From Kingston to Negril, Montego Bay to Port Antonio—we have vetted talent ready to cover your event in all 14 parishes.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-[#755f52] rounded-xl flex items-center justify-center flex-shrink-0">
                    <Camera className="w-6 h-6 text-[#c9a882]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-[#755f52] mb-2">Managed Services</h3>
                    <p className="text-gray-600">
                      We handle talent assignment, quality control, and delivery. You just focus on your event—we handle everything else.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Our Values */}
          <Card className="mb-8 border-0 shadow-premium card-premium">
            <CardContent className="p-4 sm:p-6 md:p-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#755f52] mb-4 sm:mb-6">Our Core Values</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-[#BDFF1C] mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-[#755f52] mb-1">Quality First</h4>
                    <p className="text-gray-600">We prioritize quality in our services, deliveries, and interactions, reflecting our commitment to professional standards.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-[#BDFF1C] mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-[#755f52] mb-1">Trust & Transparency</h4>
                    <p className="text-gray-600">We build trust through transparency. Clients can track their request status and view complete activity logs.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-[#BDFF1C] mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-[#755f52] mb-1">Accountability</h4>
                    <p className="text-gray-600">The ECJ brand represents a promise. We take full responsibility for every event we cover.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-[#BDFF1C] mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-[#755f52] mb-1">Community</h4>
                    <p className="text-gray-600">We support Jamaican creative professionals while serving our community with world-class event coverage.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <Card className="border-0 shadow-premium-lg bg-gradient-to-r from-[#BDFF1C] to-[#a5e00f]">
            <CardContent className="p-4 sm:p-6 md:p-8 text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">
                Ready to Experience the ECJ Difference?
              </h2>
              <p className="text-base sm:text-lg text-white opacity-90 mb-4 sm:mb-6">
                Join hundreds of satisfied clients who trust us for their most important events
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <Button 
                  size="lg"
                  className="bg-white text-[#755f52] hover:bg-gray-100 font-bold w-full sm:w-auto min-h-[48px] sm:min-h-0 sm:h-10 whitespace-nowrap"
                  onClick={() => onNavigate(user ? 'client-dashboard' : 'signup')}
                >
                  Request Coverage
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white hover:text-[#755f52] font-bold w-full sm:w-auto min-h-[48px] sm:min-h-0 sm:h-10 whitespace-nowrap"
                  onClick={() => onNavigate('services')}
                >
                  View Our Services
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
