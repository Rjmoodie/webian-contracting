import { useState, useEffect } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Camera, Video, Music, CheckCircle2, Star, TrendingUp, Users, MapPin, Award, Play, Menu, X } from 'lucide-react';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';

interface ServicesPageProps {
  serverUrl: string;
  onNavigate: (page: string) => void;
  user: any;
  publicAnonKey?: string;
  onLogout: () => void;
}

export default function ServicesPage({ serverUrl, onNavigate, user, publicAnonKey, onLogout }: ServicesPageProps) {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch(`${serverUrl}/services`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        console.log('[ServicesPage] Fetched published services:', data.services?.length || 0);
        setServices(data.services || []);
      } else {
        console.error('[ServicesPage] Failed to fetch services:', response.status);
      }
    } catch (error) {
      console.error('[ServicesPage] Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = selectedCategory === 'all' 
    ? services 
    : services.filter(s => s.category === selectedCategory);

  const getCategoryImage = (category: string) => {
    switch(category) {
      case 'photography':
        return 'https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=1200&q=80';
      case 'videography':
        return 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1200&q=80';
      case 'audio':
        return 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1200&q=80';
      default:
        return 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&q=80';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch(category) {
      case 'photography':
        return <Camera className="w-5 h-5" />;
      case 'videography':
        return <Video className="w-5 h-5" />;
      case 'audio':
        return <Music className="w-5 h-5" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f1eb] via-[#ebe4d8] to-[#e8dfd1] scroll-smooth">
      {/* Sticky Navigation */}
      <nav className="glass-dark sticky top-0 z-50 shadow-premium-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2 sm:gap-3 cursor-pointer" onClick={() => onNavigate('home')}>
              <div className="w-8 h-8 sm:w-9 sm:h-9 gradient-premium-gold rounded-xl flex items-center justify-center shadow-premium hover:scale-105 transition-transform">
                <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  <span className="hidden sm:inline">EventCoverageJamaica</span>
                  <span className="sm:hidden">ECJ</span>
                </h1>
                <p className="text-[9px] sm:text-[10px] text-[#c9a882] hidden sm:block">Professional Event Services</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden text-white p-2 hover:bg-[#8b7263] rounded-lg transition"
                aria-label="Toggle menu"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              
              {/* Desktop Auth Buttons */}
              <div className="hidden md:flex items-center gap-3">
                {user ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:text-[#c9a882] hover:bg-[#8b7263]"
                      onClick={() => {
                        if (user.role === 'client') onNavigate('client-dashboard');
                        else if (user.role === 'talent') onNavigate('talent-dashboard');
                        else if (user.role === 'admin' || user.role === 'manager') onNavigate('admin-dashboard');
                      }}
                    >
                      Dashboard
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-[#c9a882] text-[#c9a882] hover:bg-[#c9a882] hover:text-[#755f52]"
                      onClick={onLogout}
                    >
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-white hover:text-[#c9a882] hover:bg-[#8b7263]"
                      onClick={() => onNavigate('login')}
                    >
                      Login
                    </Button>
                    <Button 
                      size="sm"
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
          
          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden border-t border-[#5a4a3f] py-4">
              <div className="flex flex-col gap-3">
                <div className="border-t border-[#5a4a3f] pt-3 mt-2">
                  {user ? (
                    <>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-white hover:text-[#c9a882] hover:bg-[#8b7263] mb-2"
                        onClick={() => {
                          if (user.role === 'client') onNavigate('client-dashboard');
                          else if (user.role === 'talent') onNavigate('talent-dashboard');
                          else if (user.role === 'admin' || user.role === 'manager') onNavigate('admin-dashboard');
                          setIsMenuOpen(false);
                        }}
                      >
                        Dashboard
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full border-[#c9a882] text-[#c9a882] hover:bg-[#c9a882] hover:text-[#755f52]"
                        onClick={() => {
                          onLogout();
                          setIsMenuOpen(false);
                        }}
                      >
                        Logout
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-white hover:text-[#c9a882] hover:bg-[#8b7263] mb-2"
                        onClick={() => {
                          onNavigate('login');
                          setIsMenuOpen(false);
                        }}
                      >
                        Login
                      </Button>
                      <Button 
                        className="w-full bg-[#B0DD16] hover:bg-[#9ac514] text-white font-semibold"
                        onClick={() => {
                          onNavigate('signup');
                          setIsMenuOpen(false);
                        }}
                      >
                        Get Started
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-[#755f52] to-[#8b7263] text-white py-16 overflow-hidden">{/* Reduced from py-20 */}
        {/* Decorative Background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-[#B0DD16] rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#B0DD16] rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="bg-[#B0DD16] text-white mb-4 text-xs sm:text-sm px-3 sm:px-4 py-1.5 font-semibold">
              Jamaica's Premier Event Coverage Platform
            </Badge>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-4 leading-tight">
              Professional Event Coverage,<br />
              <span className="text-[#B0DD16]">Delivered with Excellence</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-[#e8dfd1] mb-6 leading-relaxed max-w-3xl mx-auto">
              ECJ-vetted professionals. Islandwide coverage. Guaranteed quality.
            </p>
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-6">
              <div className="flex items-center gap-2 bg-white bg-opacity-10 backdrop-blur-sm px-4 py-2 rounded-lg">
                <Award className="w-5 h-5 text-[#B0DD16]" />
                <span className="text-sm font-medium">100% Verified</span>
              </div>
              <div className="flex items-center gap-2 bg-white bg-opacity-10 backdrop-blur-sm px-4 py-2 rounded-lg">
                <MapPin className="w-5 h-5 text-[#B0DD16]" />
                <span className="text-sm font-medium">All 14 Parishes</span>
              </div>
              <div className="flex items-center gap-2 bg-white bg-opacity-10 backdrop-blur-sm px-4 py-2 rounded-lg">
                <Star className="w-5 h-5 text-[#B0DD16] fill-current" />
                <span className="text-sm font-medium">5-Star Service</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-8 sm:mb-12">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 rounded-xl text-xs sm:text-sm md:text-base font-semibold transition-all duration-300 ${
              selectedCategory === 'all'
                ? 'gradient-premium-green text-white shadow-premium scale-105'
                : 'bg-white text-[#755f52] hover:bg-[#f5f1eb] border-2 border-[#755f5233]'
            }`}
          >
            All Services
          </button>
          <button
            onClick={() => setSelectedCategory('photography')}
            className={`px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 rounded-xl text-xs sm:text-sm md:text-base font-semibold transition-all duration-300 flex items-center gap-2 ${
              selectedCategory === 'photography'
                ? 'gradient-premium-green text-white shadow-premium scale-105'
                : 'bg-white text-[#755f52] hover:bg-[#f5f1eb] border-2 border-[#755f5233]'
            }`}
          >
            <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Photography</span>
            <span className="sm:hidden">Photo</span>
          </button>
          <button
            onClick={() => setSelectedCategory('videography')}
            className={`px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 rounded-xl text-xs sm:text-sm md:text-base font-semibold transition-all duration-300 flex items-center gap-2 ${
              selectedCategory === 'videography'
                ? 'gradient-premium-green text-white shadow-premium scale-105'
                : 'bg-white text-[#755f52] hover:bg-[#f5f1eb] border-2 border-[#755f5233]'
            }`}
          >
            <Video className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Videography</span>
            <span className="sm:hidden">Video</span>
          </button>
          <button
            onClick={() => setSelectedCategory('audio')}
            className={`px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 rounded-xl text-xs sm:text-sm md:text-base font-semibold transition-all duration-300 flex items-center gap-2 ${
              selectedCategory === 'audio'
                ? 'gradient-premium-green text-white shadow-premium scale-105'
                : 'bg-white text-[#755f52] hover:bg-[#f5f1eb] border-2 border-[#755f5233]'
            }`}
          >
            <Music className="w-4 h-4 sm:w-5 sm:h-5" />
            Audio
          </button>
        </div>

        {/* Services Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#755f52] border-t-transparent mx-auto mb-4"></div>
              <p className="text-[#755f52] font-medium">Loading services...</p>
            </div>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-2xl shadow-sm">
            <div className="w-20 h-20 bg-[#755f5210] rounded-full flex items-center justify-center mx-auto mb-6">
              {getCategoryIcon(selectedCategory === 'all' ? 'photography' : selectedCategory)}
            </div>
            <h3 className="text-2xl font-bold text-[#755f52] mb-3">No Services Available</h3>
            <p className="text-gray-600 mb-2">We're currently curating our {selectedCategory === 'all' ? '' : selectedCategory} services.</p>
            <p className="text-sm text-gray-500">Check back soon for premium event coverage options.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {filteredServices.map((service) => (
              <Card 
                key={service.id} 
                className="group overflow-hidden rounded-2xl border-0 card-premium hover-lift bg-white"
              >
                {/* Media Hero Image */}
                <div className="relative h-64 overflow-hidden bg-[#755f52]">
                  <ImageWithFallback
                    src={getCategoryImage(service.category)}
                    alt={service.serviceName}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#755f52] via-transparent to-transparent opacity-60"></div>
                  
                  {/* Category Badge */}
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-white text-[#755f52] font-semibold flex items-center gap-1.5 px-3 py-1.5">
                      {getCategoryIcon(service.category)}
                      <span className="capitalize">{service.category}</span>
                    </Badge>
                  </div>

                  {/* ECJ Verified Badge */}
                  <div className="absolute top-4 right-4">
                    <Badge className="gradient-premium-green text-white font-semibold px-3 py-1.5 shadow-premium">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      ECJ-Vetted
                    </Badge>
                  </div>

                  {/* Play Icon Overlay for Videography */}
                  {service.category === 'videography' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 bg-white bg-opacity-20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-opacity-30 transition-all">
                        <Play className="w-8 h-8 text-white fill-current" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                  {/* Title & Subtitle */}
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-[#755f52] mb-1 group-hover:text-[#8b7263] transition-colors">
                      {service.serviceName}
                    </h3>
                    {service.subType && (
                      <p className="text-xs sm:text-sm text-[#c9a882] font-medium capitalize">{service.subType}</p>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed line-clamp-3">
                    {service.description || 'Professional event coverage service delivered by ECJ-vetted talent with guaranteed quality and on-time delivery.'}
                  </p>

                  {/* Trust Metrics */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-3 py-3 sm:py-4 border-y border-[#755f5220]">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-[#c9a882] mb-1">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="font-bold text-lg text-[#755f52]">{service.averageRating || '5.0'}</span>
                      </div>
                      <p className="text-xs text-gray-600 font-medium">Rating</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-[#c9a882] mb-1">
                        <Users className="w-4 h-4" />
                        <span className="font-bold text-lg text-[#755f52]">{service.totalEventsDelivered || '0'}</span>
                      </div>
                      <p className="text-xs text-gray-600 font-medium">Events</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-[#c9a882] mb-1">
                        <TrendingUp className="w-4 h-4" />
                        <span className="font-bold text-lg text-[#755f52]">{service.onTimeDeliveryRate || '100'}%</span>
                      </div>
                      <p className="text-xs text-gray-600 font-medium">On-Time</p>
                    </div>
                  </div>

                  {/* What's Included */}
                  {service.deliverables && service.deliverables.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-[#755f52] mb-2 uppercase tracking-wide">What's Included:</p>
                      <ul className="space-y-2">
                        {service.deliverables.slice(0, 3).map((item: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <CheckCircle2 className="w-4 h-4 text-[#c9a882] mt-0.5 flex-shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Good For Tags */}
                  {service.goodFor && service.goodFor.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-[#755f52] mb-2 uppercase tracking-wide">Perfect For:</p>
                      <div className="flex flex-wrap gap-2">
                        {service.goodFor.slice(0, 4).map((tag: string, i: number) => (
                          <span 
                            key={i} 
                            className="text-xs bg-gradient-to-r from-[#755f5210] to-[#c9a88220] text-[#755f52] px-3 py-1.5 rounded-full font-medium border border-[#755f5220]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Coverage Area */}
                  {service.coverageParishes && service.coverageParishes.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-[#c9a882]" />
                      <span className="text-gray-700 font-medium">
                        {service.coverageParishes.length === 14 
                          ? 'Available Islandwide'
                          : `${service.coverageParishes.length} Parish${service.coverageParishes.length > 1 ? 'es' : ''}`
                        }
                      </span>
                    </div>
                  )}

                  {/* CTA Button */}
                  <Button 
                    className="button-glow w-full gradient-premium text-white font-semibold py-6 rounded-xl shadow-premium hover:shadow-premium-lg transition-all duration-300 text-base hover:scale-105"
                    onClick={() => onNavigate(user ? 'client-dashboard' : 'signup')}
                  >
                    Request This Service
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Trust & Guarantee Section */}
        <div className="mt-16 gradient-premium rounded-3xl p-10 shadow-premium-xl overflow-hidden relative">{/* Reduced from mt-24 and p-12 */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative z-10">
            <div className="text-center mb-10">{/* Reduced from mb-12 */}
              <Badge className="bg-[#c9a882] text-[#755f52] mb-3 px-4 py-1.5 font-semibold">{/* Reduced from mb-4 */}
                The ECJ Difference
              </Badge>
              <h2 className="text-3xl font-bold text-white mb-2">Our Service Guarantee</h2>{/* Reduced from text-4xl and mb-3 */}
              <p className="text-[#e8dfd1] text-base max-w-2xl mx-auto">{/* Reduced from text-lg */}
                Every service is backed by our commitment to excellence and delivered by vetted professionals
              </p>
            </div>
            
            <div className="grid md:grid-cols-4 gap-6">{/* Reduced from gap-8 */}
              <div className="text-center group">
                <div className="w-16 h-16 bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-opacity-20 transition-all">{/* Reduced sizes and mb */}
                  <Award className="w-8 h-8 text-[#c9a882]" />{/* Reduced from w-10 h-10 */}
                </div>
                <h4 className="font-bold text-white text-base mb-2">Vetted Professionals</h4>{/* Reduced from text-lg */}
                <p className="text-[#e8dfd1] text-sm leading-relaxed">
                  All crew members verified, certified, and background-checked
                </p>
              </div>
              
              <div className="text-center group">
                <div className="w-16 h-16 bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-opacity-20 transition-all">
                  <Camera className="w-8 h-8 text-[#c9a882]" />
                </div>
                <h4 className="font-bold text-white text-base mb-2">Pro Equipment</h4>
                <p className="text-[#e8dfd1] text-sm leading-relaxed">
                  Broadcast-grade cameras, lenses, and audio gear
                </p>
              </div>
              
              <div className="text-center group">
                <div className="w-16 h-16 bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-opacity-20 transition-all">
                  <CheckCircle2 className="w-8 h-8 text-[#c9a882]" />
                </div>
                <h4 className="font-bold text-white text-base mb-2">Backup Systems</h4>
                <p className="text-[#e8dfd1] text-sm leading-relaxed">
                  Redundant coverage and equipment for peace of mind
                </p>
              </div>
              
              <div className="text-center group">
                <div className="w-16 h-16 bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-opacity-20 transition-all">
                  <TrendingUp className="w-8 h-8 text-[#c9a882]" />
                </div>
                <h4 className="font-bold text-white text-base mb-2">On-Time Delivery</h4>
                <p className="text-[#e8dfd1] text-sm leading-relaxed">
                  Guaranteed turnaround times with quality assurance
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        {!user && (
          <div className="mt-12 text-center bg-white rounded-3xl p-10 shadow-premium card-premium">{/* Reduced from mt-16 and p-12 */}
            <h3 className="text-2xl font-bold text-[#755f52] mb-3">Ready to Get Started?</h3>{/* Reduced from text-3xl and mb-4 */}
            <p className="text-gray-600 mb-6 text-base max-w-2xl mx-auto">{/* Reduced from mb-8 and text-lg */}
              Join EventCoverageJamaica today and experience professional event coverage backed by our quality guarantee.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button 
                className="button-glow gradient-premium text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-premium hover:shadow-premium-lg hover:scale-105 transition-all"
                onClick={() => onNavigate('signup')}
              >
                Create Free Account
              </Button>
              <Button 
                variant="outline"
                className="border-2 border-[#755f52] text-[#755f52] hover:bg-[#755f5210] px-8 py-6 text-lg font-semibold rounded-xl"
                onClick={() => onNavigate('services')}
              >
                Browse Services
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}