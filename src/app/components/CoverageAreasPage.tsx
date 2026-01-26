import { useState } from 'react';
import { MapPin, Building2, Users, Clock, CheckCircle2, ArrowLeft, Camera } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import JamaicaMap from '@/app/components/JamaicaMap';
import JamaicaLeafletMap from '@/app/components/JamaicaLeafletMap';
import jamaicaMap from 'figma:asset/7f8950c56c52dca925d40dbb81dc5bffa4ea6cb0.png';

interface CoverageAreasPageProps {
  onNavigate: (page: string) => void;
  onLogout?: () => void;
  user?: any;
}

const parishes = [
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

  const parishData: Record<string, any> = parishes.reduce((acc, parish) => {
    acc[parish.name] = parish;
    return acc;
  }, {} as Record<string, any>);

  const selectedData = selectedParish ? parishData[selectedParish] : null;

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
            <MapPin className="w-12 h-12 text-[#B0DD16]" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Island-Wide Coverage
          </h1>
          <p className="text-xl text-[#e8dfd1] leading-relaxed max-w-3xl mx-auto">
            Professional event coverage across all 14 parishes of Jamaica. From Kingston to Portland, Negril to Morant Bay—we've got you covered.
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-4 bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-[#B0DD16] mb-2">14</div>
              <div className="text-gray-600">Parishes Covered</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#755f52] mb-2">100%</div>
              <div className="text-gray-600">Jamaica Coverage</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#B0DD16] mb-2">500+</div>
              <div className="text-gray-600">Events Covered</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#755f52] mb-2">24/7</div>
              <div className="text-gray-600">Support Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-[#755f52] mb-4">
              Coverage Across All 14 Parishes
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-2">
              Click on any parish to learn more about our coverage in that area
            </p>
          </div>

          {/* Interactive Map of Parishes */}
          <Card className="border-0 shadow-2xl mb-8 overflow-hidden">
            <CardContent className="p-8 bg-gradient-to-br from-[#f5f1eb] to-white">
              <p className="text-center text-sm text-gray-500 mb-6 font-medium">
                Professional event coverage available in all 14 parishes of Jamaica
              </p>
              
              {/* Interactive Jamaica Map */}
              <div className="mb-8">
                <JamaicaLeafletMap 
                  selectedParish={selectedParish}
                  onParishClick={(parish) => setSelectedParish(parish === selectedParish ? null : parish)}
                />
              </div>
              
              {/* Parish Buttons arranged geographically */}
              <div className="space-y-3">
                {/* Row 1: North Coast East */}
                <div className="flex flex-wrap justify-center gap-2">
                  {['Kingston', 'St. Andrew', 'St. Thomas', 'Portland', 'St. Mary', 'St. Ann', 'Trelawny'].map((parish) => (
                    <button
                      key={parish}
                      onClick={() => setSelectedParish(parish === selectedParish ? null : parish)}
                      className={`min-h-[44px] px-4 sm:px-6 py-2.5 sm:py-3 rounded-full font-bold text-xs sm:text-sm transition-all duration-300 ${
                        selectedParish === parish
                          ? 'bg-[#B0DD16] text-white shadow-lg scale-105'
                          : 'bg-white text-[#755f52] border-2 border-[#755f52] hover:bg-[#755f52] hover:text-white hover:scale-105'
                      }`}
                    >
                      {parish}
                    </button>
                  ))}
                </div>

                {/* Row 2: West Coast & Interior */}
                <div className="flex flex-wrap justify-center gap-2">
                  {['St. James', 'Hanover', 'Westmoreland', 'St. Elizabeth', 'Manchester', 'Clarendon', 'St. Catherine'].map((parish) => (
                    <button
                      key={parish}
                      onClick={() => setSelectedParish(parish === selectedParish ? null : parish)}
                      className={`min-h-[44px] px-4 sm:px-6 py-2.5 sm:py-3 rounded-full font-bold text-xs sm:text-sm transition-all duration-300 ${
                        selectedParish === parish
                          ? 'bg-[#B0DD16] text-white shadow-lg scale-105'
                          : 'bg-white text-[#755f52] border-2 border-[#755f52] hover:bg-[#755f52] hover:text-white hover:scale-105'
                      }`}
                    >
                      {parish}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Parish Details */}
              {selectedData && (
                <div className="mt-8 p-6 bg-white rounded-2xl border-2 border-[#B0DD16] shadow-xl animate-in fade-in duration-300">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#B0DD16] to-[#9ac514] rounded-xl flex items-center justify-center">
                      <MapPin className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-[#755f52]">{selectedData.name}</h3>
                      <p className="text-sm text-gray-500">Click again to close</p>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-4 text-base leading-relaxed">
                    {selectedData.description}
                  </p>
                  <div className="space-y-2">
                    <h4 className="font-bold text-[#755f52] text-sm mb-3">Coverage Specialties:</h4>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {selectedData.highlights.map((highlight: string, index: number) => (
                        <div key={index} className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-[#B0DD16] mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700 font-medium">{highlight}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {!selectedData && (
                <div className="mt-8 text-center py-12 bg-white bg-opacity-50 rounded-xl border-2 border-dashed border-[#755f52]">
                  <MapPin className="w-16 h-16 text-[#755f52] opacity-30 mx-auto mb-3" />
                  <p className="text-[#755f52] font-medium">Select a parish above to view coverage details</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Info */}
          <Card className="mt-8 border-0 shadow-lg">
            <CardContent className="p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#B0DD16] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-[#755f52] mb-4">
                    Need Coverage Outside Your Parish?
                  </h3>
                  <p className="text-gray-700 mb-4">
                    No problem! Our vetted talent network spans the entire island. Whether your event is in a major city or a rural community, we can arrange professional coverage with ECJ's quality guarantee.
                  </p>
                  <div className="bg-[#f5f1eb] p-4 rounded-lg border-l-4 border-[#B0DD16]">
                    <p className="text-sm text-gray-700">
                      <span className="font-bold text-[#755f52]">Travel & Coverage:</span> We handle all logistics for events requiring talent to travel. Our managed service model means you don't need to worry about transportation, accommodation, or coordination—we take care of it all.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <Card className="mt-8 border-0 shadow-lg bg-gradient-to-r from-[#755f52] to-[#8b7263]">
            <CardContent className="p-8 text-center">
              <h2 className="text-3xl font-bold text-white mb-4">
                Ready to Book Coverage in Your Parish?
              </h2>
              <p className="text-lg text-[#e8dfd1] mb-6">
                Request professional event coverage anywhere in Jamaica
              </p>
              <Button 
                size="lg"
                className="bg-[#B0DD16] hover:bg-[#9ac514] text-white font-bold"
                onClick={() => onNavigate(user ? 'client-dashboard' : 'signup')}
              >
                Request Coverage Now
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}