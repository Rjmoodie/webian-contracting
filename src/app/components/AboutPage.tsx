import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { ArrowLeft, Shield, Award, MapPin, Camera, Users, CheckCircle2, Target, Heart } from 'lucide-react';

interface AboutPageProps {
  onNavigate: (page: string) => void;
  onLogout?: () => void;
  user?: any;
}

export default function AboutPage({ onNavigate, onLogout, user }: AboutPageProps) {
  return (
    <div className="min-h-screen bg-[#f5f1eb]">
      {/* Header */}
      <nav className="bg-white border-b border-[#755f5233]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-6">
              <h1 
                className="text-2xl font-bold text-[#B0DD16] cursor-pointer" 
                onClick={() => onNavigate('home')}
              >
                EventCoverageJamaica
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <span className="text-sm text-gray-700">Hi, {user.name}</span>
                  <Button variant="outline" size="sm" onClick={onLogout}>
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" onClick={() => onNavigate('login')}>
                    Login
                  </Button>
                  <Button size="sm" className="bg-[#B0DD16] hover:bg-[#9ac514]" onClick={() => onNavigate('signup')}>
                    Sign Up
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden bg-gradient-to-r from-[#755f52] to-[#8b7263]">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-96 h-96 bg-[#c9a882] rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#c9a882] rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <Button 
            variant="ghost" 
            className="text-white hover:text-[#c9a882] mb-6"
            onClick={() => onNavigate('home')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            About EventCoverageJamaica
          </h1>
          <p className="text-xl text-[#e8dfd1] leading-relaxed">
            Jamaica's premier managed marketplace for professional event coverage
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Our Story */}
          <Card className="mb-8 border-0 shadow-lg">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-[#B0DD16] rounded-xl flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-[#755f52]">Our Story</h2>
              </div>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p className="text-lg">
                  EventCoverageJamaica was founded on a simple but powerful mission: to make professional event coverage accessible, reliable, and guaranteed across every parish in Jamaica.
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
          <Card className="mb-8 border-0 shadow-lg">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-[#755f52] rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-[#c9a882]" />
                </div>
                <h2 className="text-3xl font-bold text-[#755f52]">Our Mission</h2>
              </div>
              <p className="text-lg text-gray-700 leading-relaxed">
                To provide guaranteed, ECJ-branded event coverage services across all 14 parishes of Jamaica, backed by our rigorous vetting process, quality assurance, and unwavering commitment to excellence.
              </p>
            </CardContent>
          </Card>

          {/* What Makes Us Different */}
          <Card className="mb-8 border-0 shadow-lg">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold text-[#755f52] mb-6">What Makes Us Different</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-[#B0DD16] rounded-xl flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-[#755f52] mb-2">ECJ Brand Guarantee</h3>
                    <p className="text-gray-600">
                      We don't just connect you with talent. Every service is ECJ-branded and backed by our quality guarantee. If something goes wrong, we make it right.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-[#755f52] rounded-xl flex items-center justify-center flex-shrink-0">
                    <Award className="w-6 h-6 text-[#c9a882]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-[#755f52] mb-2">Rigorous Vetting</h3>
                    <p className="text-gray-600">
                      Every talent undergoes our comprehensive vetting process. Only the best make it into our network of Certified, Premium, and Elite professionals.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-[#B0DD16] rounded-xl flex items-center justify-center flex-shrink-0">
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
          <Card className="mb-8 border-0 shadow-lg">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold text-[#755f52] mb-6">Our Core Values</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-[#B0DD16] mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-[#755f52] mb-1">Quality First</h4>
                    <p className="text-gray-600">We never compromise on quality. Every service, every delivery, every interaction reflects our commitment to excellence.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-[#B0DD16] mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-[#755f52] mb-1">Trust & Transparency</h4>
                    <p className="text-gray-600">We build trust through transparency. Clients can track their request status and view complete activity logs.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-[#B0DD16] mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-[#755f52] mb-1">Accountability</h4>
                    <p className="text-gray-600">The ECJ brand represents a promise. We take full responsibility for every event we cover.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-[#B0DD16] mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-[#755f52] mb-1">Community</h4>
                    <p className="text-gray-600">We support Jamaican creative professionals while serving our community with world-class event coverage.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-[#B0DD16] to-[#9ac514]">
            <CardContent className="p-8 text-center">
              <h2 className="text-3xl font-bold text-white mb-4">
                Ready to Experience the ECJ Difference?
              </h2>
              <p className="text-lg text-white opacity-90 mb-6">
                Join hundreds of satisfied clients who trust us for their most important events
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg"
                  className="bg-white text-[#755f52] hover:bg-gray-100 font-bold"
                  onClick={() => onNavigate(user ? 'client-dashboard' : 'signup')}
                >
                  Request Coverage
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white hover:text-[#755f52] font-bold"
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
