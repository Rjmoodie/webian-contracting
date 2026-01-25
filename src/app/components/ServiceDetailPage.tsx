import { useState, useEffect } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { CheckCircle2, Star, TrendingUp, Users, ArrowLeft, Shield, Clock, MapPin } from 'lucide-react';

interface ServiceDetailPageProps {
  serviceId: string;
  serverUrl: string;
  onNavigate: (page: string) => void;
  user: any;
}

export default function ServiceDetailPage({ serviceId, serverUrl, onNavigate, user }: ServiceDetailPageProps) {
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchService();
  }, [serviceId]);

  const fetchService = async () => {
    try {
      const response = await fetch(`${serverUrl}/services/${serviceId}`);
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
      <div className="min-h-screen bg-[#f5f1eb] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7fa589]"></div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-[#f5f1eb] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Service Not Found</h2>
          <Button onClick={() => onNavigate('services')}>Browse Services</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f1eb] scroll-smooth">
      {/* Header */}
      <nav className="bg-[#755f52] border-b border-[#5a4a3f] sticky top-0 z-50 shadow-lg">{/* Updated to match other pages */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('home')}>
              <h1 className="text-lg font-bold text-white tracking-tight">
                EventCoverageJamaica
              </h1>
              <p className="text-[10px] text-[#c9a882]">Professional Event Services</p>
            </div>
            <div className="flex items-center gap-3">
              {user ? (
                <Button 
                  variant="ghost"
                  className="text-white hover:text-[#c9a882] hover:bg-[#8b7263]"
                  onClick={() => {
                    if (user.role === 'client') onNavigate('client-dashboard');
                    else if (user.role === 'talent') onNavigate('talent-dashboard');
                    else onNavigate('admin-dashboard');
                  }}
                >
                  Dashboard
                </Button>
              ) : (
                <>
                  <Button 
                    variant="ghost" 
                    className="text-white hover:text-[#c9a882] hover:bg-[#8b7263]"
                    onClick={() => onNavigate('login')}
                  >
                    Login
                  </Button>
                  <Button 
                    className="bg-[#B0DD16] hover:bg-[#9ac514] text-white font-semibold"
                    onClick={() => onNavigate('signup')}
                  >
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button variant="ghost" className="mb-6" onClick={() => onNavigate('services')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Services
        </Button>

        {/* Service Header */}
        <div className="bg-white rounded-lg p-8 mb-6 shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div>
              <Badge className="bg-[#7fa589] text-white mb-3">ECJ-Vetted • Guaranteed</Badge>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{service.serviceName}</h1>
              {service.subType && (
                <p className="text-lg text-gray-600 capitalize">{service.subType}</p>
              )}
            </div>
          </div>

          <p className="text-lg text-gray-700 mb-6">{service.description}</p>

          {/* Trust Metrics */}
          <div className="grid grid-cols-4 gap-6 py-6 border-y">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-[#7fa589] mb-2">
                <Star className="w-6 h-6 fill-current" />
                <span className="text-3xl font-bold">{service.averageRating || 0}</span>
              </div>
              <p className="text-sm text-gray-600">Service Rating</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-[#7fa589] mb-2">
                <Users className="w-6 h-6" />
                <span className="text-3xl font-bold">{service.totalEventsDelivered || 0}</span>
              </div>
              <p className="text-sm text-gray-600">Events Delivered</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-[#7fa589] mb-2">
                <TrendingUp className="w-6 h-6" />
                <span className="text-3xl font-bold">{service.onTimeDeliveryRate || 100}%</span>
              </div>
              <p className="text-sm text-gray-600">On-Time Delivery</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-[#7fa589] mb-2">
                <Users className="w-6 h-6" />
                <span className="text-3xl font-bold">{service.repeatClientRate || 0}%</span>
              </div>
              <p className="text-sm text-gray-600">Repeat Clients</p>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-6 flex gap-4">
            <Button 
              size="lg" 
              className="bg-[#7fa589] hover:bg-[#6d8f75]"
              onClick={() => onNavigate(user ? 'client-dashboard' : 'signup')}
            >
              Request This Service
            </Button>
            <Button size="lg" variant="outline">
              Speak to a Coordinator
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Good For */}
            {service.goodFor && service.goodFor.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Perfect For</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {service.goodFor.map((tag: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-sm py-2 px-4">
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
                    {service.deliverables.map((item: string, i: number) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-[#7fa589] mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{item}</span>
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
                <p className="text-sm text-gray-600 mb-4">
                  Curated samples from ECJ-certified events
                </p>
                {service.sampleMedia && service.sampleMedia.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {service.sampleMedia.map((media: string, i: number) => (
                      <div key={i} className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-gray-500">Sample {i + 1}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500">Sample work coming soon</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Coverage */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#7fa589]" />
                  Coverage Area
                </CardTitle>
              </CardHeader>
              <CardContent>
                {service.coverageParishes && service.coverageParishes.length === 14 ? (
                  <div>
                    <p className="font-semibold text-[#7fa589] mb-2">Islandwide Coverage</p>
                    <p className="text-sm text-gray-600">Available in all 14 parishes</p>
                  </div>
                ) : (
                  <div>
                    <p className="font-semibold mb-3">Available in {service.coverageParishes?.length || 0} parishes:</p>
                    <div className="flex flex-wrap gap-2">
                      {service.coverageParishes?.map((parish: string, i: number) => (
                        <span key={i} className="text-xs bg-[#e8f5ed] text-[#7fa589] px-2 py-1 rounded">
                          {parish}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ECJ Guarantee */}
            <Card className="border-[#7fa589] border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#7fa589]" />
                  ECJ Guarantee
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#7fa589] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">Vetted Professionals</p>
                    <p className="text-xs text-gray-600">All crew members certified by ECJ</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#7fa589] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">Professional Equipment</p>
                    <p className="text-xs text-gray-600">Broadcast-grade gear guaranteed</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#7fa589] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">Backup Coverage</p>
                    <p className="text-xs text-gray-600">Redundancy protocols in place</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Clock className="w-5 h-5 text-[#7fa589] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">On-Time Delivery</p>
                    <p className="text-xs text-gray-600">Guaranteed turnaround times</p>
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
                <Button variant="outline" className="w-full">
                  Chat with Coordinator
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