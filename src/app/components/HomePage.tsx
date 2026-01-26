import { Camera, Shield, Clock, Award, CheckCircle, MapPin, Users, TrendingUp, Star, ChevronRight, Video, Music, ArrowRight, CheckCircle2 } from 'lucide-react';
import Navigation from './Navigation';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Card, CardHeader, CardContent } from '@/app/components/ui/card';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import JamaicaLeafletMap from '@/app/components/JamaicaLeafletMap';
import { useState } from 'react';

interface HomePageProps {
  onNavigate: (page: string) => void;
  user: any;
  onLogout: () => void;
}

export default function HomePage({ onNavigate, user, onLogout }: HomePageProps) {
  const parishes = [
    'Kingston', 'St. Andrew', 'St. Thomas', 'Portland', 'St. Mary', 'St. Ann',
    'Trelawny', 'St. James', 'Hanover', 'Westmoreland', 'St. Elizabeth',
    'Manchester', 'Clarendon', 'St. Catherine'
  ];

  const [selectedParish, setSelectedParish] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f1eb] via-[#ebe4d8] to-[#e8dfd1] scroll-smooth">
      {/* Navigation */}
      <Navigation
        user={user}
        onNavigate={onNavigate}
        onLogout={onLogout}
        variant="public"
        showNavLinks={true}
      />
      {/* Spacer for fixed header */}
      <div className="h-16" />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1511578314322-379afb476865?w=1920&q=80"
            alt="Event Coverage"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#755f52] via-[#755f52cc] to-[#755f5299]"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
          <div className="max-w-3xl">
            <Badge className="bg-[#B0DD16] text-white mb-4 text-sm px-4 py-1.5 font-semibold">{/* Reduced from mb-6 */}
              Jamaica's Premier Event Coverage Platform
            </Badge>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-4 leading-tight">
              Professional Event Coverage.
              <span className="block text-[#c9a882]">Guaranteed Excellence.</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-[#e8dfd1] mb-6 leading-relaxed">
              ECJ-vetted professionals deliver broadcast-grade photography, videography, and audio services islandwide with guaranteed on-time delivery.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 mb-6">
              <Button 
                size="lg" 
                className="button-glow text-base sm:text-lg px-6 sm:px-8 md:px-10 py-5 sm:py-6 md:py-7 gradient-premium-green text-white font-bold rounded-xl shadow-premium-xl hover:shadow-premium-xl hover:scale-105 transition-all w-full sm:w-auto"
                onClick={() => onNavigate(user ? 'client-dashboard' : 'signup')}
              >
                Request Coverage
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="text-base sm:text-lg px-6 sm:px-8 md:px-10 py-5 sm:py-6 md:py-7 glass text-white border-2 border-white/30 hover:bg-white hover:text-[#755f52] font-semibold rounded-xl w-full sm:w-auto hover:border-white transition-all"
                onClick={() => onNavigate('services')}
              >
                Browse Services
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-8 sm:mt-12">
              <div className="flex items-center gap-2 text-white">
                <Star className="w-4 h-4 sm:w-5 sm:h-5 text-[#B0DD16] fill-current" />
                <span className="text-sm sm:text-base font-semibold">5.0 Average Rating</span>
              </div>
              <div className="flex items-center gap-2 text-white">
                <Award className="w-4 h-4 sm:w-5 sm:h-5 text-[#B0DD16]" />
                <span className="text-sm sm:text-base font-semibold">100% Vetted</span>
              </div>
              <div className="flex items-center gap-2 text-white">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-[#B0DD16]" />
                <span className="text-sm sm:text-base font-semibold">All 14 Parishes</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="py-8 sm:py-12 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <div className="text-center group">
              <div className="w-14 h-14 gradient-premium text-white rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform shadow-premium hover:shadow-premium-lg">{/* Reduced size and mb */}
                <Shield className="w-7 h-7 text-[#B0DD16]" />{/* Reduced from w-8 h-8 */}
              </div>
              <h3 className="font-bold text-[#755f52] text-base mb-1">{/* Reduced from text-lg */}
                Vetted Crews
              </h3>
              <p className="text-xs text-gray-600">Verified & certified</p>{/* Reduced from text-sm */}
            </div>
            <div className="text-center group">
              <div className="w-14 h-14 gradient-premium text-white rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform shadow-premium hover:shadow-premium-lg">
                <CheckCircle2 className="w-7 h-7 text-[#B0DD16]" />
              </div>
              <h3 className="font-bold text-[#755f52] text-base mb-1">
                Protected
              </h3>
              <p className="text-xs text-gray-600">Secure agreements</p>
            </div>
            <div className="text-center group">
              <div className="w-14 h-14 gradient-premium text-white rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform shadow-premium hover:shadow-premium-lg">
                <MapPin className="w-7 h-7 text-[#B0DD16]" />
              </div>
              <h3 className="font-bold text-[#755f52] text-base mb-1">
                Islandwide
              </h3>
              <p className="text-xs text-gray-600">All 14 parishes</p>
            </div>
            <div className="text-center group">
              <div className="w-14 h-14 gradient-premium text-white rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform shadow-premium hover:shadow-premium-lg">
                <Clock className="w-7 h-7 text-[#B0DD16]" />
              </div>
              <h3 className="font-bold text-[#755f52] text-base mb-1">
                On-Time
              </h3>
              <p className="text-xs text-gray-600">Guaranteed delivery</p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Service Guarantee */}
      <section className="py-12 sm:py-16 px-4 bg-[#755f52]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <Badge className="bg-[#B0DD16] text-white mb-3 px-3 sm:px-4 py-1.5 font-semibold text-xs sm:text-sm">
              The ECJ Difference
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 px-4">Our Service Guarantee</h2>
            <p className="text-base sm:text-lg text-[#e8dfd1] max-w-3xl mx-auto px-4">
              Every service is backed by our commitment to excellence and delivered by vetted professionals
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 px-4">
            {/* Vetted Professionals */}
            <div className="card-premium bg-white rounded-2xl overflow-hidden hover-lift">
              <div className="relative h-48 overflow-hidden">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1618397806877-f0187730803f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBwaG90b2dyYXBoZXIlMjBjZXJ0aWZpZWR8ZW58MXx8fHwxNzY5MzY1MjM4fDA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Vetted Professionals"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#755f52] via-transparent to-transparent opacity-60"></div>
                <div className="absolute top-4 left-4">
                  <div className="w-12 h-12 gradient-premium-green rounded-xl flex items-center justify-center shadow-premium">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-bold text-xl text-[#755f52] mb-2 tracking-tight">
                  Vetted Professionals
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  All crew members verified, certified, and background-checked
                </p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Every ECJ professional undergoes rigorous screening including portfolio review, reference checks, and in-person interviews. We verify certifications, test technical skills, and ensure they meet our standards for professionalism across Jamaica's diverse event landscape.
                </p>
              </div>
            </div>

            {/* Pro Equipment */}
            <div className="card-premium bg-white rounded-2xl overflow-hidden hover-lift">
              <div className="relative h-48 overflow-hidden">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1758851088217-df00ca346e24?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxicm9hZGNhc3QlMjBjYW1lcmElMjBlcXVpcG1lbnR8ZW58MXx8fHwxNzY5MzY1MjM4fDA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Pro Equipment"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#755f52] via-transparent to-transparent opacity-60"></div>
                <div className="absolute top-4 left-4">
                  <div className="w-12 h-12 gradient-premium-green rounded-xl flex items-center justify-center shadow-premium">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-bold text-xl text-[#755f52] mb-2 tracking-tight">
                  Pro Equipment
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Broadcast-grade cameras, lenses, and audio gear
                </p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  ECJ mandates professional-grade equipment standards for all services. From 4K cameras to wireless audio systems, we ensure our teams arrive with reliable, broadcast-quality gear that performs flawlessly in Jamaica's tropical climate and diverse venues.
                </p>
              </div>
            </div>

            {/* Backup Systems */}
            <div className="card-premium bg-white rounded-2xl overflow-hidden hover-lift">
              <div className="relative h-48 overflow-hidden">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1689236673934-66f8e9d9279b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYWNrdXAlMjBjb21wdXRlciUyMHN5c3RlbXN8ZW58MXx8fHwxNzY5MzY1MjQzfDA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Backup Systems"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#755f52] via-transparent to-transparent opacity-60"></div>
                <div className="absolute top-4 left-4">
                  <div className="w-12 h-12 gradient-premium-green rounded-xl flex items-center justify-center shadow-premium">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-bold text-xl text-[#755f52] mb-2 tracking-tight">
                  Backup Systems
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Redundant coverage and equipment for peace of mind
                </p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Every ECJ assignment includes backup equipment and redundant storage protocols. We capture your event on multiple devices simultaneously and implement immediate cloud backup, ensuring your memories are protected even in challenging field conditions across the island.
                </p>
              </div>
            </div>

            {/* On-Time Delivery */}
            <div className="card-premium bg-white rounded-2xl overflow-hidden hover-lift">
              <div className="relative h-48 overflow-hidden">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1579120632007-f493373daed0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZWxpdmVyeSUyMHRydWNrJTIwc2NoZWR1bGV8ZW58MXx8fHwxNzY5MzY1MjM5fDA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="On-Time Delivery"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#755f52] via-transparent to-transparent opacity-60"></div>
                <div className="absolute top-4 left-4">
                  <div className="w-12 h-12 gradient-premium-green rounded-xl flex items-center justify-center shadow-premium">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-bold text-xl text-[#755f52] mb-2 tracking-tight">
                  On-Time Delivery
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Guaranteed turnaround times with quality assurance
                </p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  ECJ commits to specific delivery timelines for every service. Our project management system tracks progress, ensures quality control reviews, and guarantees your files arrive on schedule—whether you're in Kingston or the furthest rural parish. Late delivery? We make it right.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-12 sm:py-16 px-4" id="services">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <Badge className="bg-[#755f52] text-white mb-3 px-3 sm:px-4 py-1.5 text-xs sm:text-sm">
              Professional Services
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#755f52] mb-3 px-4">ECJ Coverage Services</h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
              Broadcast-grade coverage delivered by vetted professionals
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 px-4">
            {/* Photography */}
            <div className="group relative overflow-hidden rounded-2xl card-premium hover-lift cursor-pointer bg-white">
              <div className="relative h-64 overflow-hidden">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=800&q=80"
                  alt="Photography"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#755f52] via-transparent to-transparent opacity-60"></div>
                <div className="absolute bottom-4 left-4">
                  <div className="flex items-center gap-2 text-white">
                    <Camera className="w-6 h-6" />
                    <h3 className="text-2xl font-bold">Photography</h3>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <p className="text-gray-700 mb-4 leading-relaxed">
                  Professional event photography from corporate functions to cultural festivals.
                </p>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-[#c9a882]" />
                    Full event coverage
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-[#c9a882]" />
                    Highlight packages
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-[#c9a882]" />
                    High-resolution delivery
                  </li>
                </ul>
                <Button 
                  className="button-glow w-full gradient-premium-green text-white rounded-xl shadow-premium hover:shadow-premium-lg hover:scale-105 transition-all"
                  onClick={() => onNavigate('services')}
                >
                  View Photography Services
                </Button>
              </div>
            </div>

            {/* Videography */}
            <div className="group relative overflow-hidden rounded-2xl card-premium hover-lift cursor-pointer bg-white">
              <div className="relative h-64 overflow-hidden">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&q=80"
                  alt="Videography"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#755f52] via-transparent to-transparent opacity-60"></div>
                <div className="absolute bottom-4 left-4">
                  <div className="flex items-center gap-2 text-white">
                    <Video className="w-6 h-6" />
                    <h3 className="text-2xl font-bold">Videography</h3>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <p className="text-gray-700 mb-4 leading-relaxed">
                  Cinematic video production with professional editing and post-production.
                </p>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-[#c9a882]" />
                    4K recording
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-[#c9a882]" />
                    Highlight reels
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-[#c9a882]" />
                    Drone footage available
                  </li>
                </ul>
                <Button 
                  className="button-glow w-full gradient-premium-green text-white rounded-xl shadow-premium hover:shadow-premium-lg hover:scale-105 transition-all"
                  onClick={() => onNavigate('services')}
                >
                  View Video Services
                </Button>
              </div>
            </div>

            {/* Audio */}
            <div className="group relative overflow-hidden rounded-2xl card-premium hover-lift cursor-pointer bg-white">
              <div className="relative h-64 overflow-hidden">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&q=80"
                  alt="Audio"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#755f52] via-transparent to-transparent opacity-60"></div>
                <div className="absolute bottom-4 left-4">
                  <div className="flex items-center gap-2 text-white">
                    <Music className="w-6 h-6" />
                    <h3 className="text-2xl font-bold">Audio</h3>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <p className="text-gray-700 mb-4 leading-relaxed">
                  Professional audio recording and technical support for all event types.
                </p>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-[#c9a882]" />
                    Live recording
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-[#c9a882]" />
                    Professional mixing
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-[#c9a882]" />
                    Technical setup
                  </li>
                </ul>
                <Button 
                  className="button-glow w-full gradient-premium-green text-white rounded-xl shadow-premium hover:shadow-premium-lg hover:scale-105 transition-all"
                  onClick={() => onNavigate('services')}
                >
                  View Audio Services
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Coverage Map */}
      <section className="py-12 sm:py-16 px-4 bg-gradient-to-br from-[#f5f1eb] via-[#ebe4d8] to-[#e8dfd1]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6 sm:mb-10">
            <Badge className="bg-[#755f52] text-white mb-3 px-3 sm:px-4 py-1.5 text-xs sm:text-sm">
              Islandwide Service
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#755f52] mb-3 px-4">Complete Parish Coverage</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-2 px-4">
              Professional event coverage available in all 14 parishes of Jamaica
            </p>
            <p className="text-xs sm:text-sm text-gray-500 px-4">
              Click on any parish to explore our coverage
            </p>
          </div>
          
          {/* Interactive Leaflet Map */}
          <JamaicaLeafletMap 
            selectedParish={selectedParish}
            onParishClick={(parish) => setSelectedParish(parish === selectedParish ? null : parish)}
          />

          {/* Parish Info Display */}
          {selectedParish && (
            <div className="mt-6 sm:mt-8 bg-white rounded-2xl p-4 sm:p-6 shadow-xl border-2 border-[#755f52]/20 mx-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 gradient-premium-green rounded-xl flex items-center justify-center shadow-premium">
                    <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-[#755f52]">{selectedParish}</h3>
                    <p className="text-xs sm:text-sm text-gray-600">Full coverage available</p>
                  </div>
                </div>
                <Button
                  onClick={() => setSelectedParish(null)}
                  variant="outline"
                  size="sm"
                  className="text-[#755f52] border-[#755f52] w-full sm:w-auto"
                >
                  Close
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-gradient-to-br from-[#755f52]/10 to-[#755f52]/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Camera className="w-5 h-5 text-[#755f52]" />
                    <h4 className="font-semibold text-[#755f52]">Photography</h4>
                  </div>
                  <p className="text-sm text-gray-600">Professional photographers available</p>
                </div>
                <div className="bg-gradient-to-br from-[#755f52]/10 to-[#755f52]/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-[#755f52]" />
                    <h4 className="font-semibold text-[#755f52]">Videography</h4>
                  </div>
                  <p className="text-sm text-gray-600">4K video production teams</p>
                </div>
                <div className="bg-gradient-to-br from-[#755f52]/10 to-[#755f52]/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-[#755f52]" />
                    <h4 className="font-semibold text-[#755f52]">Audio</h4>
                  </div>
                  <p className="text-sm text-gray-600">Professional sound recording</p>
                </div>
              </div>
              <div className="mt-4">
                <Button 
                  className="button-glow w-full gradient-premium-green text-white font-semibold shadow-premium hover:shadow-premium-lg hover:scale-105 transition-all"
                  onClick={() => onNavigate('services')}
                >
                  Book Services in {selectedParish}
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-12 sm:py-16 md:py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#755f52] to-[#8b7263]"></div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 sm:w-96 sm:h-96 bg-[#c9a882] rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-64 h-64 sm:w-96 sm:h-96 bg-[#c9a882] rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 px-4">
            Ready for Professional Event Coverage?
          </h2>
          <p className="text-base sm:text-lg text-[#e8dfd1] mb-6 sm:mb-8 leading-relaxed px-4">
            Join hundreds of satisfied clients who trust EventCoverageJamaica for their most important events
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
            <Button 
              size="lg" 
              className="button-glow text-base sm:text-lg px-6 sm:px-8 md:px-10 py-5 sm:py-6 md:py-7 gradient-premium-green text-white font-bold rounded-xl shadow-premium-xl hover:shadow-premium-xl hover:scale-105 transition-all w-full sm:w-auto"
              onClick={() => onNavigate(user ? 'client-dashboard' : 'signup')}
            >
              Request Coverage Now
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-base sm:text-lg px-6 sm:px-8 md:px-10 py-5 sm:py-6 md:py-7 glass text-white border-2 border-white/30 hover:bg-white hover:text-[#755f52] font-semibold rounded-xl w-full sm:w-auto hover:border-white transition-all"
              onClick={() => onNavigate('services')}
            >
              View All Services
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#3d332c] text-gray-400 py-8 sm:py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">{/* Reduced from mb-4 */}
                <div className="w-8 h-8 bg-[#c9a882] rounded-lg flex items-center justify-center">
                  <Camera className="w-5 h-5 text-[#755f52]" />
                </div>
                <h3 className="text-white text-lg font-bold">ECJ</h3>
              </div>
              <p className="text-sm leading-relaxed">
                Professional event coverage across all 14 parishes of Jamaica with guaranteed excellence.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-3">Services</h4>{/* Reduced from mb-4 */}
              <ul className="space-y-2 text-sm">
                <li className="hover:text-white cursor-pointer transition" onClick={() => onNavigate('services')}>Photography</li>
                <li className="hover:text-white cursor-pointer transition" onClick={() => onNavigate('services')}>Videography</li>
                <li className="hover:text-white cursor-pointer transition" onClick={() => onNavigate('services')}>Audio Services</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-3">Company</h4>{/* Reduced from mb-4 */}
              <ul className="space-y-2 text-sm">
                <li className="hover:text-white cursor-pointer transition" onClick={() => onNavigate('about')}>About ECJ</li>
                <li className="hover:text-white cursor-pointer transition" onClick={() => onNavigate('coverage-areas')}>Coverage Areas</li>
                <li className="hover:text-white cursor-pointer transition" onClick={() => onNavigate('terms-policies')}>Terms & Policies</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-3">For Professionals</h4>{/* Reduced from mb-4 */}
              <ul className="space-y-2 text-sm">
                <li className="hover:text-white cursor-pointer transition" onClick={() => onNavigate('signup')}>Apply as Talent</li>
                <li className="hover:text-white cursor-pointer transition" onClick={() => onNavigate('vetting-process')}>Vetting Process</li>
                <li className="hover:text-white cursor-pointer transition" onClick={() => onNavigate('terms-policies')}>Policies</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 pt-6 text-center text-sm">{/* Reduced from pt-8 */}
            <p>© 2026 EventCoverageJamaica.com. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}