import { useState, useEffect } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Camera, Video, Music, Filter, Grid, List, Image as ImageIcon, Play } from 'lucide-react';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import Navigation from './Navigation';

interface PortfolioPageProps {
  serverUrl: string;
  onNavigate: (page: string) => void;
  user: any;
  publicAnonKey?: string;
  onLogout: () => void;
}

interface PortfolioItem {
  id: string;
  title: string;
  description?: string;
  category: 'photography' | 'videography' | 'audio';
  mediaUrl: string;
  thumbnailUrl?: string;
  eventType?: string;
  parish?: string;
  date?: string;
  talentName?: string;
  featured?: boolean;
}

export default function PortfolioPage({ serverUrl, onNavigate, user, publicAnonKey, onLogout }: PortfolioPageProps) {
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    try {
      const response = await fetch(`${serverUrl}/portfolio`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setPortfolioItems(data.items || []);
      } else if (response.status === 404) {
        // Endpoint doesn't exist yet - treat as empty portfolio (silent)
        setPortfolioItems([]);
      } else {
        // Other errors - log but don't break the UI
        console.warn('[PortfolioPage] Failed to fetch portfolio:', response.status);
        setPortfolioItems([]);
      }
    } catch (error) {
      // Network errors or other issues - show empty state
      // Only log if it's not a 404 (which is expected until backend is implemented)
      if (error instanceof Error && !error.message.includes('404')) {
        console.warn('[PortfolioPage] Error fetching portfolio:', error);
      }
      setPortfolioItems([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = selectedCategory === 'all' 
    ? portfolioItems 
    : portfolioItems.filter(item => item.category === selectedCategory);

  const getCategoryIcon = (category: string) => {
    switch(category) {
      case 'photography':
        return <Camera className="w-4 h-4 sm:w-5 sm:h-5" />;
      case 'videography':
        return <Video className="w-4 h-4 sm:w-5 sm:h-5" />;
      case 'audio':
        return <Music className="w-4 h-4 sm:w-5 sm:h-5" />;
      default:
        return null;
    }
  };

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
      <div className="h-24" />

      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-[#755f52] to-[#8b7263] text-white py-12 sm:py-16 md:py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-[#BDFF1C] rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#BDFF1C] rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="bg-[#BDFF1C] text-white mb-4 text-xs sm:text-sm px-3 sm:px-4 py-1.5 font-semibold">
            Our Work
          </Badge>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-4 leading-tight">
            Portfolio Showcase
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-[#e8dfd1] mb-6 leading-relaxed max-w-3xl mx-auto">
            Explore our curated collection of professional event coverage from across Jamaica
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Filters and View Toggle */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 sm:gap-4">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl text-xs sm:text-sm md:text-base font-semibold transition-all duration-300 ${
                selectedCategory === 'all'
                  ? 'gradient-premium-green text-white shadow-premium scale-105'
                  : 'bg-white text-[#755f52] hover:bg-[#f5f1eb] border-2 border-[#755f5233]'
              }`}
            >
              All Work
            </button>
            <button
              onClick={() => setSelectedCategory('photography')}
              className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl text-xs sm:text-sm md:text-base font-semibold transition-all duration-300 flex items-center gap-2 ${
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
              className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl text-xs sm:text-sm md:text-base font-semibold transition-all duration-300 flex items-center gap-2 ${
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
              className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl text-xs sm:text-sm md:text-base font-semibold transition-all duration-300 flex items-center gap-2 ${
                selectedCategory === 'audio'
                  ? 'gradient-premium-green text-white shadow-premium scale-105'
                  : 'bg-white text-[#755f52] hover:bg-[#f5f1eb] border-2 border-[#755f5233]'
              }`}
            >
              <Music className="w-4 h-4 sm:w-5 sm:h-5" />
              Audio
            </button>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2 bg-white rounded-xl p-1 border-2 border-[#755f5233]">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'grid' 
                  ? 'bg-[#BDFF1C] text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              aria-label="Grid view"
            >
              <Grid className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'list' 
                  ? 'bg-[#BDFF1C] text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              aria-label="List view"
            >
              <List className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Portfolio Grid/List */}
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#755f52] border-t-transparent mx-auto mb-4"></div>
              <p className="text-[#755f52] font-medium">Loading portfolio...</p>
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-2xl shadow-sm">
            <div className="w-20 h-20 bg-[#755f5210] rounded-full flex items-center justify-center mx-auto mb-6">
              <ImageIcon className="w-10 h-10 text-[#755f52]" />
            </div>
            <h3 className="text-2xl font-bold text-[#755f52] mb-3">No Portfolio Items Yet</h3>
            <p className="text-gray-600 mb-2">
              {selectedCategory === 'all' 
                ? 'Portfolio items will appear here once submitted and approved.' 
                : `No ${selectedCategory} items in the portfolio yet.`}
            </p>
            <p className="text-sm text-gray-500">Check back soon for our latest work.</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredItems.map((item) => (
              <Card 
                key={item.id} 
                className="group overflow-hidden rounded-2xl border-0 card-premium hover-lift bg-white cursor-pointer"
                onClick={() => {
                  // Could open a modal or detail page here
                  window.open(item.mediaUrl, '_blank');
                }}
              >
                <div className="relative h-64 overflow-hidden bg-[#755f52]">
                  {item.thumbnailUrl ? (
                    <ImageWithFallback
                      src={item.thumbnailUrl}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#755f52] to-[#8b7263]">
                      {getCategoryIcon(item.category)}
                    </div>
                  )}
                  
                  {/* Category Badge */}
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-white text-[#755f52] font-semibold flex items-center gap-1.5 px-3 py-1.5">
                      {getCategoryIcon(item.category)}
                      <span className="capitalize text-xs">{item.category}</span>
                    </Badge>
                  </div>

                  {/* Play Icon for Videos */}
                  {item.category === 'videography' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 bg-white bg-opacity-20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-opacity-30 transition-all">
                        <Play className="w-8 h-8 text-white fill-current" />
                      </div>
                    </div>
                  )}

                  {/* Featured Badge */}
                  {item.featured && (
                    <div className="absolute top-4 right-4">
                      <Badge className="gradient-premium-green text-white font-semibold px-3 py-1.5 shadow-premium">
                        Featured
                      </Badge>
                    </div>
                  )}
                </div>

                <CardContent className="p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-bold text-[#755f52] mb-2 group-hover:text-[#8b7263] transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                    {item.eventType && (
                      <span className="bg-gray-100 px-2 py-1 rounded">{item.eventType}</span>
                    )}
                    {item.parish && (
                      <span className="bg-gray-100 px-2 py-1 rounded">{item.parish}</span>
                    )}
                    {item.date && (
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        {new Date(item.date).getFullYear()}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item) => (
              <Card 
                key={item.id} 
                className="group overflow-hidden rounded-xl border-0 card-premium hover-lift bg-white cursor-pointer"
                onClick={() => {
                  window.open(item.mediaUrl, '_blank');
                }}
              >
                <div className="flex flex-col sm:flex-row">
                  <div className="relative w-full sm:w-64 h-48 sm:h-auto overflow-hidden bg-[#755f52]">
                    {item.thumbnailUrl ? (
                      <ImageWithFallback
                        src={item.thumbnailUrl}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#755f52] to-[#8b7263]">
                        {getCategoryIcon(item.category)}
                      </div>
                    )}
                    {item.category === 'videography' && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 bg-white bg-opacity-20 backdrop-blur-sm rounded-full flex items-center justify-center">
                          <Play className="w-6 h-6 text-white fill-current" />
                        </div>
                      </div>
                    )}
                  </div>
                  <CardContent className="flex-1 p-4 sm:p-6">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-[#755f52] text-white font-semibold flex items-center gap-1.5 px-3 py-1">
                            {getCategoryIcon(item.category)}
                            <span className="capitalize text-xs">{item.category}</span>
                          </Badge>
                          {item.featured && (
                            <Badge className="gradient-premium-green text-white font-semibold px-3 py-1">
                              Featured
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-xl sm:text-2xl font-bold text-[#755f52] mb-2 group-hover:text-[#8b7263] transition-colors">
                          {item.title}
                        </h3>
                        {item.description && (
                          <p className="text-sm sm:text-base text-gray-600 mb-3">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs sm:text-sm text-gray-500">
                      {item.eventType && (
                        <span className="bg-gray-100 px-2 py-1 rounded">{item.eventType}</span>
                      )}
                      {item.parish && (
                        <span className="bg-gray-100 px-2 py-1 rounded">{item.parish}</span>
                      )}
                      {item.date && (
                        <span className="bg-gray-100 px-2 py-1 rounded">
                          {new Date(item.date).toLocaleDateString()}
                        </span>
                      )}
                      {item.talentName && (
                        <span className="bg-gray-100 px-2 py-1 rounded">By {item.talentName}</span>
                      )}
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
