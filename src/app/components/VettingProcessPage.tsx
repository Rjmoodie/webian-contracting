import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { ArrowLeft, Shield, CheckCircle2, FileText, Camera, Award, Star, Crown, Users } from 'lucide-react';

interface VettingProcessPageProps {
  onNavigate: (page: string) => void;
  onLogout?: () => void;
  user?: any;
}

export default function VettingProcessPage({ onNavigate, onLogout, user }: VettingProcessPageProps) {
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
          <div className="flex items-center justify-center gap-3 mb-6">
            <Shield className="w-12 h-12 text-[#B0DD16]" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Our Vetting Process
          </h1>
          <p className="text-xl text-[#e8dfd1] leading-relaxed max-w-3xl mx-auto">
            How we ensure only the best professionals represent the ECJ brand
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Introduction */}
          <Card className="mb-12 border-0 shadow-lg">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold text-[#755f52] mb-4">
                Excellence Through Rigorous Vetting
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                At EventCoverageJamaica, we don't just connect clients with talent—we guarantee quality. That's why every professional in our network undergoes a comprehensive vetting process before they can represent the ECJ brand.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Our three-tier system (Certified, Premium, Elite) ensures that clients always know the level of expertise they're getting, and all tiers maintain our high standards of professionalism and quality.
              </p>
            </CardContent>
          </Card>

          {/* The Vetting Steps */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-[#755f52] mb-8 text-center">
              The 5-Step Vetting Process
            </h2>
            
            <div className="space-y-6">
              {/* Step 1 */}
              <Card className="border-2 border-gray-200 hover:border-[#B0DD16] hover:shadow-xl transition-all">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 bg-[#B0DD16] rounded-2xl flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl font-bold text-white">1</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-[#755f52] mb-3">Application Submission</h3>
                      <p className="text-gray-700 mb-3">
                        Professionals apply through our talent portal, submitting:
                      </p>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-[#B0DD16] mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">Portfolio showcasing recent work (photos, videos, or audio samples)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-[#B0DD16] mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">Professional bio and experience details</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-[#B0DD16] mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">Coverage areas (parishes they can serve)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-[#B0DD16] mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">Equipment list and technical capabilities</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Step 2 */}
              <Card className="border-2 border-gray-200 hover:border-[#B0DD16] hover:shadow-xl transition-all">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 bg-[#755f52] rounded-2xl flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl font-bold text-[#c9a882]">2</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-[#755f52] mb-3">Portfolio Review</h3>
                      <p className="text-gray-700 mb-3">
                        Our review team evaluates submitted work against ECJ quality standards:
                      </p>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-[#B0DD16] mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">Technical quality (exposure, focus, composition, audio clarity)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-[#B0DD16] mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">Consistency across multiple projects</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-[#B0DD16] mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">Creativity and storytelling ability</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-[#B0DD16] mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">Versatility across event types</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Step 3 */}
              <Card className="border-2 border-gray-200 hover:border-[#B0DD16] hover:shadow-xl transition-all">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 bg-[#B0DD16] rounded-2xl flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl font-bold text-white">3</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-[#755f52] mb-3">Skills Assessment</h3>
                      <p className="text-gray-700 mb-3">
                        We verify professional capabilities and experience:
                      </p>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-[#B0DD16] mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">Equipment verification (ownership of professional gear)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-[#B0DD16] mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">Reference checks from previous clients</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-[#B0DD16] mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">Years of professional experience</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-[#B0DD16] mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">Specialized training or certifications</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Step 4 */}
              <Card className="border-2 border-gray-200 hover:border-[#B0DD16] hover:shadow-xl transition-all">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 bg-[#755f52] rounded-2xl flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl font-bold text-[#c9a882]">4</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-[#755f52] mb-3">Professionalism Review</h3>
                      <p className="text-gray-700 mb-3">
                        We assess soft skills and business practices:
                      </p>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-[#B0DD16] mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">Communication skills and responsiveness</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-[#B0DD16] mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">Reliability and punctuality history</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-[#B0DD16] mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">Professionalism during client interactions</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-[#B0DD16] mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">Adherence to deadlines and delivery standards</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Step 5 */}
              <Card className="border-2 border-gray-200 hover:border-[#B0DD16] hover:shadow-xl transition-all">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 bg-[#B0DD16] rounded-2xl flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl font-bold text-white">5</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-[#755f52] mb-3">Tier Assignment</h3>
                      <p className="text-gray-700 mb-3">
                        Based on all assessments, we assign a tier that reflects expertise level:
                      </p>
                      <div className="space-y-3 mt-4">
                        <div className="flex items-center gap-3 p-3 bg-green-50 border-l-4 border-green-500 rounded">
                          <CheckCircle2 className="w-6 h-6 text-green-600" />
                          <div>
                            <p className="font-bold text-green-800">✓ Certified</p>
                            <p className="text-sm text-green-700">Professional quality, reliable service</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-purple-50 border-l-4 border-purple-500 rounded">
                          <Star className="w-6 h-6 text-purple-600" />
                          <div>
                            <p className="font-bold text-purple-800">⭐ Premium</p>
                            <p className="text-sm text-purple-700">Exceptional quality, advanced expertise</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-amber-50 border-l-4 border-amber-500 rounded">
                          <Crown className="w-6 h-6 text-amber-600" />
                          <div>
                            <p className="font-bold text-amber-800">👑 Elite</p>
                            <p className="text-sm text-amber-700">Top-tier artistry, award-winning work</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Why This Matters */}
          <Card className="mb-8 border-0 shadow-lg bg-gradient-to-r from-[#f5f1eb] to-[#ebe4d8]">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold text-[#755f52] mb-6 text-center">
                Why This Matters for You
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex gap-4">
                  <Shield className="w-8 h-8 text-[#B0DD16] flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-[#755f52] mb-2">Quality Guarantee</h4>
                    <p className="text-gray-700">Every professional has been thoroughly vetted. The ECJ brand stands behind their work.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Award className="w-8 h-8 text-[#755f52] flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-[#755f52] mb-2">Clear Expectations</h4>
                    <p className="text-gray-700">Our tier system ensures you know exactly the level of expertise you're getting.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Users className="w-8 h-8 text-[#B0DD16] flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-[#755f52] mb-2">Peace of Mind</h4>
                    <p className="text-gray-700">No more gambling on unknown providers. All our talent is verified and reliable.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Camera className="w-8 h-8 text-[#755f52] flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-[#755f52] mb-2">Continuous Standards</h4>
                    <p className="text-gray-700">We monitor performance and maintain standards through client feedback and quality reviews.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA for Talent */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-[#755f52] to-[#8b7263]">
            <CardContent className="p-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-4">
                  Are You a Professional Looking to Join ECJ?
                </h2>
                <p className="text-lg text-[#e8dfd1] mb-6">
                  If you're a photography, videography, or audio professional committed to excellence, we'd love to review your application.
                </p>
                <Button 
                  size="lg"
                  className="bg-[#B0DD16] hover:bg-[#9ac514] text-white font-bold"
                  onClick={() => onNavigate('signup')}
                >
                  Apply as Talent
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
