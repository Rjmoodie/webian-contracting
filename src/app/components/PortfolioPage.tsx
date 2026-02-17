import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Layers, Route, Ruler, Grid, List, Image as ImageIcon, Play, MapPin, Calendar, X as XIcon, ChevronLeft, ChevronRight, Images, Video, Music } from 'lucide-react';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import Navigation from './Navigation';
import { getContent } from '@/app/config';
import { api } from '/utils/supabase/api';

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  photography: Layers,
  videography: Route,
  audio: Ruler,
};

interface PortfolioPageProps {
  onNavigate: (page: string) => void;
  user: any;
  publicAnonKey?: string;
  onLogout: () => void;
}

type MediaItem = {
  id: string;
  url: string;
  contentType?: string;
  fileName?: string;
};

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

interface PortfolioProject extends PortfolioItem {
  coverUrl?: string;
  media?: MediaItem[];
}

const CATEGORY_KEYS = ['photography', 'videography', 'audio'] as const;

export default function PortfolioPage({ onNavigate, user, publicAnonKey, onLogout }: PortfolioPageProps) {
  const content = getContent();
  const serviceCategories = content?.serviceCategories ?? {
    photography: 'Photography',
    videography: 'Videography',
    audio: 'Audio',
  };
  const allLabel = content?.phrases?.allProjects ?? 'All Work';

  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeProject, setActiveProject] = useState<PortfolioProject | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const openProject = (p: PortfolioProject) => {
    setActiveProject(p);
    setActiveIndex(0);
  };
  const closeProject = () => setActiveProject(null);

  const mediaList = activeProject?.media?.filter((m) => m.url) ?? [];
  const activeMedia = mediaList[activeIndex];

  const next = () => setActiveIndex((i) => (i + 1) % Math.max(mediaList.length, 1));
  const prev = () => setActiveIndex((i) => (i - 1 + Math.max(mediaList.length, 1)) % Math.max(mediaList.length, 1));

  const isVideo = (ct?: string) => (ct || '').toLowerCase().startsWith('video/');
  const isAudio = (ct?: string) => {
    const t = (ct || '').toLowerCase();
    return t.startsWith('audio/') || t.includes('audio');
  };

  useEffect(() => {
    if (!activeProject) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeProject();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeProject, mediaList.length]);

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    try {
      const response = await fetch(`${api('lookups')}/portfolio`, {
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

  const filteredItems = useMemo(
    () => (selectedCategory === 'all' ? portfolioItems : portfolioItems.filter((item) => item.category === selectedCategory)),
    [portfolioItems, selectedCategory]
  );

  const getCategoryIcon = (category: string) => {
    const Icon = CATEGORY_ICONS[category];
    return Icon ? <Icon className="w-4 h-4 sm:w-5 sm:h-5" /> : null;
  };

  const getCategoryLabel = (category: string) =>
    serviceCategories[category as keyof typeof serviceCategories] ?? category;

  const mediaCount = (item: PortfolioItem) => ((item as PortfolioProject).media?.filter((m) => m.url).length ?? 0);
  const thumb = (item: PortfolioItem) => (item as PortfolioProject).coverUrl || item.thumbnailUrl || '';

  return (
    <div className="min-h-screen bg-gray-50 scroll-smooth">
      <Navigation user={user} onNavigate={onNavigate} onLogout={onLogout} variant="public" showNavLinks={true} />
      <div className="h-16" />

      {/* ── Hero ───────────────────────────────────────── */}
      <section className="relative bg-secondary text-white py-16 sm:py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10" aria-hidden="true">
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-primary rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-[500px] h-[500px] bg-primary rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h1 className="typography-page-title-hero mb-3">GPR Projects &amp; Geophysics &amp; Geotechnical Case Studies — Jamaica</h1>
          <p className="text-white/80 typography-body-sm max-w-xl mx-auto">
            Browse completed Ground Penetrating Radar surveys, utility location projects, infrastructure assessments, and geotechnical investigations delivered across Jamaica and the wider Caribbean by WCI Geophysics.
          </p>
        </div>
      </section>

      {/* ── Content ────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">

        {/* Filters bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-4 py-3 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-secondary text-white shadow-sm'
                  : 'text-muted-foreground hover:bg-gray-100'
              }`}
            >
              {allLabel}
            </button>
            {CATEGORY_KEYS.map((key) => {
              const Icon = CATEGORY_ICONS[key];
              return (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    selectedCategory === key
                      ? 'bg-secondary text-white shadow-sm'
                      : 'text-muted-foreground hover:bg-gray-100'
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{serviceCategories[key]}</span>
                  <span className="sm:hidden">{serviceCategories[key].split(/ & | and /)[0]}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 shrink-0 self-end sm:self-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${viewMode === 'grid' ? 'bg-white shadow-sm text-secondary' : 'text-gray-400 hover:text-gray-600'}`}
              aria-label="Grid view"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${viewMode === 'list' ? 'bg-white shadow-sm text-secondary' : 'text-gray-400 hover:text-gray-600'}`}
              aria-label="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Results count */}
        {!loading && filteredItems.length > 0 && (
          <p className="typography-caption mb-4">{filteredItems.length} project{filteredItems.length === 1 ? '' : 's'}</p>
        )}

        {/* ── Loading / Empty ──────────────────────────── */}
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-primary border-t-transparent" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-24">
            <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="typography-card-title-lg mb-1">No projects yet</h3>
            <p className="typography-body-sm-muted">
              {selectedCategory === 'all'
                ? 'Projects will appear here once added.'
                : `No ${getCategoryLabel(selectedCategory)} projects yet.`}
            </p>
          </div>

        /* ── Grid view ─────────────────────────────────── */
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredItems.map((item) => {
              const mc = mediaCount(item);
              return (
                <div
                  key={item.id}
                  onClick={() => openProject(item as PortfolioProject)}
                  className="group bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
                >
                  {/* Image */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                    {thumb(item) ? (
                      <ImageWithFallback
                        src={thumb(item)}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-100">
                        <ImageIcon className="w-10 h-10 text-gray-300" />
                      </div>
                    )}

                    {/* Gradient overlay at bottom */}
                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent" />

                    {/* Media count badge */}
                    {mc > 1 && (
                      <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
                        <Images className="w-3 h-3" />
                        {mc}
                      </div>
                    )}

                    {/* Play icon */}
                    {item.category === 'videography' && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/30 transition-all">
                          <Play className="w-6 h-6 text-white fill-current" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
<h3 className="typography-card-title line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="typography-body-sm-muted line-clamp-2 mb-3">{item.description}</p>
                  )}
                  <div className="flex items-center gap-3 typography-caption">
                      {item.parish && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {item.parish}
                        </span>
                      )}
                      {item.date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(item.date).getFullYear()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        /* ── List view ─────────────────────────────────── */
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => {
              const mc = mediaCount(item);
              return (
                <div
                  key={item.id}
                  onClick={() => openProject(item as PortfolioProject)}
                  className="group bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row"
                >
                  <div className="relative w-full sm:w-56 h-44 sm:h-auto overflow-hidden bg-gray-100 shrink-0">
                    {thumb(item) ? (
                      <ImageWithFallback
                        src={thumb(item)}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                    {mc > 1 && (
                      <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full">
                        <Images className="w-3 h-3" />
                        {mc}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 p-4 sm:py-5 sm:px-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        {getCategoryIcon(item.category)}
                        {getCategoryLabel(item.category)}
                      </span>
                    </div>
<h3 className="typography-card-title-lg mb-1 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="typography-body-sm-muted line-clamp-2 mb-3">{item.description}</p>
                  )}
                  <div className="flex items-center gap-3 typography-caption">
                      {item.parish && (
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{item.parish}</span>
                      )}
                      {item.date && (
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(item.date).getFullYear()}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Gallery modal ──────────────────────────────── */}
      {activeProject && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 sm:p-6"
          onClick={closeProject}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-5xl bg-white rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
              <div className="min-w-0 flex-1 mr-4">
                <h3 className="typography-card-title-lg truncate">{activeProject.title}</h3>
                <div className="flex items-center gap-3 typography-caption mt-0.5">
                  {activeProject.parish && (
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{activeProject.parish}</span>
                  )}
                  <span>{mediaList.length} photo{mediaList.length === 1 ? '' : 's'}</span>
                </div>
              </div>
              <button
                onClick={closeProject}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Main media */}
            <div className="relative bg-gray-950 flex items-center justify-center">
              <div className="w-full aspect-[16/10] flex items-center justify-center">
                {!activeMedia ? (
                  <div className="text-gray-500 text-sm">No media available.</div>
                ) : isVideo(activeMedia.contentType) ? (
                  <video src={activeMedia.url} controls className="w-full h-full object-contain" />
                ) : isAudio(activeMedia.contentType) ? (
                  <div className="w-full p-10 text-white text-center">
                    <audio src={activeMedia.url} controls className="w-full max-w-md mx-auto" />
                    <p className="mt-3 text-sm text-gray-400">{activeMedia.fileName || 'Audio'}</p>
                  </div>
                ) : (
                  <img src={activeMedia.url} alt={activeProject.title} className="w-full h-full object-contain" />
                )}
              </div>

              {/* Nav arrows */}
              {mediaList.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); prev(); }}
                    className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-sm transition-colors cursor-pointer"
                    aria-label="Previous"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); next(); }}
                    className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-sm transition-colors cursor-pointer"
                    aria-label="Next"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Counter */}
              {mediaList.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full">
                  {activeIndex + 1} / {mediaList.length}
                </div>
              )}
            </div>

            {/* Thumbnail strip */}
            {mediaList.length > 1 && (
              <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                <div className="flex gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {mediaList.map((m, idx) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setActiveIndex(idx)}
                      className={`shrink-0 rounded-lg overflow-hidden ring-2 transition-all cursor-pointer ${
                        idx === activeIndex ? 'ring-primary ring-offset-1' : 'ring-transparent hover:ring-gray-300'
                      }`}
                      aria-label={`View item ${idx + 1}`}
                    >
                      {isVideo(m.contentType) ? (
                        <div className="w-16 h-12 bg-gray-200 flex items-center justify-center text-gray-500">
                          <Video className="w-4 h-4" />
                        </div>
                      ) : isAudio(m.contentType) ? (
                        <div className="w-16 h-12 bg-gray-200 flex items-center justify-center text-gray-500">
                          <Music className="w-4 h-4" />
                        </div>
                      ) : (
                        <img src={m.url} className="w-16 h-12 object-cover" alt="" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Description footer */}
            {activeProject.description && (
              <div className="px-5 py-3 border-t border-gray-100">
                <p className="typography-body-sm-muted leading-relaxed">{activeProject.description}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
