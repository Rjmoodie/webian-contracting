import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { ArrowLeft, FileText, Shield, AlertCircle } from 'lucide-react';

interface TermsPoliciesPageProps {
  onNavigate: (page: string) => void;
  onLogout?: () => void;
  user?: any;
}

export default function TermsPoliciesPage({ onNavigate, onLogout, user }: TermsPoliciesPageProps) {
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
            <FileText className="w-12 h-12 text-[#B0DD16]" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Terms & Policies
          </h1>
          <p className="text-xl text-[#e8dfd1] leading-relaxed">
            Last Updated: January 25, 2026
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Introduction */}
          <Card className="mb-8 border-0 shadow-lg bg-blue-50 border-l-4 border-blue-500">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-gray-700 leading-relaxed">
                    These Terms and Policies govern your use of EventCoverageJamaica.com and our services. By using our platform, you agree to these terms. Please read them carefully.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Terms of Service */}
          <Card className="mb-8 border-0 shadow-lg">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold text-[#755f52] mb-6 flex items-center gap-3">
                <FileText className="w-8 h-8 text-[#B0DD16]" />
                Terms of Service
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-[#755f52] mb-3">1. Service Overview</h3>
                  <p className="text-gray-700 leading-relaxed mb-2">
                    EventCoverageJamaica (ECJ) operates a managed marketplace platform connecting clients with vetted event coverage professionals across Jamaica. All services are ECJ-branded and backed by our quality guarantee.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    <strong>Key Points:</strong>
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li>Talent remains private; clients interact only with ECJ</li>
                    <li>All services are managed and guaranteed by ECJ</li>
                    <li>We handle talent assignment, quality control, and delivery</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-[#755f52] mb-3">2. User Accounts</h3>
                  <p className="text-gray-700 leading-relaxed mb-2">
                    <strong>Clients:</strong> Must provide accurate information and are responsible for maintaining account security.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    <strong>Talent:</strong> Must undergo our vetting process and maintain professional standards. Misrepresentation of skills or credentials may result in removal from the platform.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-[#755f52] mb-3">3. Booking & Payments</h3>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li>Clients submit coverage requests through our platform</li>
                    <li>ECJ reviews requests and assigns appropriate talent</li>
                    <li>Payment terms and pricing are provided upon request approval</li>
                    <li>Cancellation policies vary based on timing and circumstances</li>
                    <li>Refunds are handled on a case-by-case basis with ECJ guarantee</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-[#755f52] mb-3">4. Quality Guarantee</h3>
                  <p className="text-gray-700 leading-relaxed">
                    ECJ guarantees the quality of all services. If deliverables do not meet agreed-upon standards, we will:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700 mt-2">
                    <li>Arrange for re-shoots or corrections at no additional cost (when possible)</li>
                    <li>Provide partial or full refunds for unmet expectations</li>
                    <li>Take full responsibility for talent performance issues</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-[#755f52] mb-3">5. Intellectual Property</h3>
                  <p className="text-gray-700 leading-relaxed mb-2">
                    <strong>Client Rights:</strong> Clients receive full usage rights to all delivered content for personal or business use as agreed in the service contract.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    <strong>Talent Rights:</strong> Talent may showcase work in portfolios unless otherwise agreed. ECJ may use samples for marketing with permission.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-[#755f52] mb-3">6. Liability & Disputes</h3>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li>ECJ takes responsibility for service delivery and quality</li>
                    <li>Disputes should be reported through our platform for resolution</li>
                    <li>We maintain complete activity logs for accountability</li>
                    <li>Force majeure events (natural disasters, etc.) may affect service delivery</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-[#755f52] mb-3">7. Prohibited Activities</h3>
                  <p className="text-gray-700 leading-relaxed mb-2">Users may not:</p>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li>Circumvent the platform to engage talent directly</li>
                    <li>Misuse or share account credentials</li>
                    <li>Submit false information or fraudulent requests</li>
                    <li>Use the platform for any illegal activities</li>
                    <li>Harass or abuse other users or talent</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Policy */}
          <Card className="mb-8 border-0 shadow-lg">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold text-[#755f52] mb-6 flex items-center gap-3">
                <Shield className="w-8 h-8 text-[#B0DD16]" />
                Privacy Policy
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-[#755f52] mb-3">Information We Collect</h3>
                  <p className="text-gray-700 leading-relaxed mb-2">
                    <strong>From Clients:</strong>
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700 mb-3">
                    <li>Name, email, and company information</li>
                    <li>Event details (date, location, requirements)</li>
                    <li>Communication and activity logs</li>
                  </ul>
                  <p className="text-gray-700 leading-relaxed mb-2">
                    <strong>From Talent:</strong>
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li>Professional information and portfolios</li>
                    <li>Skills, equipment, and coverage areas</li>
                    <li>Performance data and client feedback</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-[#755f52] mb-3">How We Use Information</h3>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li>To match clients with appropriate talent</li>
                    <li>To manage bookings and communicate updates</li>
                    <li>To maintain quality standards and resolve disputes</li>
                    <li>To improve our services and platform</li>
                    <li>To send service updates and notifications</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-[#755f52] mb-3">Data Protection</h3>
                  <p className="text-gray-700 leading-relaxed">
                    We implement industry-standard security measures to protect your data. Talent information is kept private from clients. All activity logs are encrypted and stored securely.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-[#755f52] mb-3">Third-Party Services</h3>
                  <p className="text-gray-700 leading-relaxed">
                    We use Supabase for authentication and data storage. Payment processing (when implemented) will use secure third-party processors. We do not sell your personal information.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-[#755f52] mb-3">Your Rights</h3>
                  <p className="text-gray-700 leading-relaxed mb-2">You have the right to:</p>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li>Access your personal data</li>
                    <li>Request corrections to inaccurate information</li>
                    <li>Request deletion of your account and data</li>
                    <li>Opt out of marketing communications</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Talent-Specific Policies */}
          <Card className="mb-8 border-0 shadow-lg">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold text-[#755f52] mb-6">Talent-Specific Policies</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-[#755f52] mb-3">Professional Standards</h3>
                  <p className="text-gray-700 leading-relaxed mb-2">All ECJ talent must:</p>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li>Maintain professional behavior at all times</li>
                    <li>Arrive on time with proper equipment</li>
                    <li>Deliver work within agreed turnaround times</li>
                    <li>Communicate promptly with ECJ management</li>
                    <li>Maintain confidentiality of client information</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-[#755f52] mb-3">Performance Monitoring</h3>
                  <p className="text-gray-700 leading-relaxed">
                    ECJ monitors talent performance through client feedback, quality reviews, and on-time delivery metrics. Consistently poor performance may result in tier demotion or removal from the platform.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-[#755f52] mb-3">Platform Exclusivity</h3>
                  <p className="text-gray-700 leading-relaxed">
                    While talent may work outside ECJ, events booked through our platform must be fulfilled as ECJ-branded services. Direct solicitation of ECJ clients is prohibited.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact & Updates */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-[#f5f1eb] to-[#ebe4d8]">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-[#755f52] mb-4">Questions or Concerns?</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have questions about these Terms & Policies, please contact us through the platform or email support@eventcoveragejamaica.com
              </p>
              <p className="text-sm text-gray-600">
                <strong>Policy Updates:</strong> We may update these terms periodically. Significant changes will be communicated to all users via email. Continued use of the platform after updates constitutes acceptance of new terms.
              </p>
            </CardContent>
          </Card>

          {/* Back Button */}
          <div className="text-center mt-8">
            <Button 
              size="lg"
              variant="outline"
              onClick={() => onNavigate('home')}
              className="border-2 border-[#755f52] text-[#755f52] hover:bg-[#755f52] hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
