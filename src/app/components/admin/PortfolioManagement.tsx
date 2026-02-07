import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Badge } from '@/app/components/ui/badge';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Layers, Route, Ruler, Plus, X, Trash2, Image as ImageIcon, Star, Search, AlertCircle, Play, Video, Music } from 'lucide-react';
import { toast } from 'sonner';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import { getFreshToken } from '/utils/supabase/client';
import { api } from '/utils/supabase/api';

interface PortfolioManagementProps {
  accessToken: string;
}

interface PortfolioItem {
  id?: string;
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

export default function PortfolioManagement({ accessToken }: PortfolioManagementProps) {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [currentToken, setCurrentToken] = useState<string>(accessToken);
  const [formData, setFormData] = useState<PortfolioItem>({
    title: '',
    description: '',
    category: 'photography',
    mediaUrl: '',
    thumbnailUrl: '',
    eventType: '',
    parish: '',
    date: '',
    talentName: '',
    featured: false,
  });

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}) => {
    const token = await getFreshToken() || currentToken || accessToken;
    if (!token) {
      console.warn('[PortfolioManagement] No access token available');
      return null;
    }
    if (token !== currentToken) setCurrentToken(token);

    const response = await fetch(url, {
      ...options,
      headers: { ...options.headers, 'Authorization': `Bearer ${token}` },
    });

    if (response.status === 401) {
      console.warn('[PortfolioManagement] Backend returned 401');
      return null;
    }
    return response;
  };

  const fetchPortfolio = async () => {
    try {
      const response = await makeAuthenticatedRequest(`${api('admin')}/portfolio`);

      if (!response) {
        setLoading(false);
        return;
      }
      if (response.ok) {
        const data = await response.json();
        const fetchedItems = data.items || [];
        // Sort: featured first, then by date (newest first)
        const sorted = fetchedItems.sort((a: PortfolioItem, b: PortfolioItem) => {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return (b.date || '').localeCompare(a.date || '');
        });
        setItems(sorted);
      }
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      toast.error('Failed to load portfolio items');
    } finally {
      setLoading(false);
    }
  };

  const validateMediaUrl = (url: string, category: string): boolean => {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();
    const photoExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const videoExts = ['.mp4', '.mov', '.webm', '.avi'];
    const audioExts = ['.mp3', '.wav', '.m4a', '.ogg'];
    
    if (category === 'photography') {
      return photoExts.some(ext => lowerUrl.includes(ext)) || lowerUrl.includes('imgur') || lowerUrl.includes('cloudinary');
    }
    if (category === 'videography') {
      return videoExts.some(ext => lowerUrl.includes(ext)) || lowerUrl.includes('youtube') || lowerUrl.includes('vimeo');
    }
    if (category === 'audio') {
      return audioExts.some(ext => lowerUrl.includes(ext)) || lowerUrl.includes('soundcloud');
    }
    return true; // Allow if we can't determine
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (saving) return;
    
    if (!formData.title || !formData.mediaUrl || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate media URL
    if (!validateMediaUrl(formData.mediaUrl, formData.category)) {
      toast.error(`Invalid ${formData.category} URL. Please use a valid file extension or hosting service.`);
      return;
    }

    setSaving(true);

    try {
      const url = editingItem?.id 
        ? `${api('admin')}/portfolio/${editingItem.id}`
        : `${api('admin')}/portfolio`;
      
      const method = editingItem?.id ? 'PUT' : 'POST';
      
      // Prepare payload (exclude id from POST)
      const payload = { ...formData };
      if (method === 'POST') {
        delete payload.id;
      }
      
      const response = await makeAuthenticatedRequest(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response) {
        toast.error('Authentication failed. Please try again.');
        setSaving(false);
        fetchPortfolio(); // Revert optimistic update
        return;
      }

      if (response.ok) {
        const savedItem = await response.json().catch(() => formData); // Fallback to formData if API doesn't return item
        
        // Optimistic UI update
        if (method === 'POST') {
          // Add new item (prepend if featured, append otherwise)
          const newItem = savedItem.item || { ...formData, id: Date.now().toString() };
          setItems(prev => newItem.featured 
            ? [newItem, ...prev] 
            : [...prev, newItem]
          );
        } else {
          // Update existing item
          setItems(prev => prev.map(item => 
            item.id === editingItem?.id ? (savedItem.item || { ...formData, id: editingItem.id }) : item
          ));
        }

        toast.success(editingItem ? 'Portfolio item updated' : 'Portfolio item added');
        setShowForm(false);
        setEditingItem(null);
        resetForm();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.message || 'Failed to save portfolio item');
        // Revert optimistic update on error
        fetchPortfolio();
      }
    } catch (error) {
      console.error('Error saving portfolio item:', error);
      toast.error('Failed to save portfolio item');
      // Revert optimistic update on error
      fetchPortfolio();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this portfolio item?')) return;

    // Optimistic UI update
    const itemToDelete = items.find(item => item.id === id);
    setItems(prev => prev.filter(item => item.id !== id));

    try {
      const response = await makeAuthenticatedRequest(`${api('admin')}/portfolio/${id}`, {
        method: 'DELETE',
      });

      if (!response) {
        // Revert on auth error
        if (itemToDelete) {
          setItems(prev => [...prev, itemToDelete].sort((a, b) => {
            if (a.featured && !b.featured) return -1;
            if (!a.featured && b.featured) return 1;
            return (b.date || '').localeCompare(a.date || '');
          }));
        }
        toast.error('Authentication failed. Please try again.');
        return;
      }

      if (response.ok) {
        toast.success('Portfolio item deleted');
      } else {
        // Revert on error
        if (itemToDelete) {
          setItems(prev => [...prev, itemToDelete].sort((a, b) => {
            if (a.featured && !b.featured) return -1;
            if (!a.featured && b.featured) return 1;
            return (b.date || '').localeCompare(a.date || '');
          }));
        }
        toast.error('Failed to delete portfolio item');
      }
    } catch (error) {
      console.error('Error deleting portfolio item:', error);
      // Revert on error
      if (itemToDelete) {
        setItems(prev => [...prev, itemToDelete].sort((a, b) => {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return (b.date || '').localeCompare(a.date || '');
        }));
      }
      toast.error('Failed to delete portfolio item');
    }
  };

  const handleEdit = (item: PortfolioItem) => {
    setEditingItem(item);
    // Normalize form data to prevent data shape issues
    setFormData({
      title: item.title ?? '',
      description: item.description ?? '',
      category: item.category ?? 'photography',
      mediaUrl: item.mediaUrl ?? '',
      thumbnailUrl: item.thumbnailUrl ?? '',
      eventType: item.eventType ?? '',
      parish: item.parish ?? '',
      date: item.date ?? '',
      talentName: item.talentName ?? '',
      featured: !!item.featured,
      id: item.id,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'photography',
      mediaUrl: '',
      thumbnailUrl: '',
      eventType: '',
      parish: '',
      date: '',
      talentName: '',
      featured: false,
    });
  };

  const getCategoryIcon = (category: string, size: 'sm' | 'lg' = 'sm') => {
    const iconSize = size === 'lg' ? 'w-10 h-10' : 'w-4 h-4';
    switch(category) {
      case 'photography':
        return <Layers className={iconSize} />;
      case 'videography':
        return <Route className={iconSize} />;
      case 'audio':
        return <Ruler className={iconSize} />;
      default:
        return null;
    }
  };

  // Sort: featured first, then by date (newest first)
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return (b.date || '').localeCompare(a.date || '');
    });
  }, [items]);

  // Filter and search
  const filteredItems = useMemo(() => {
    let filtered = sortedItems;
    
    // Category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(item => item.category === filterCategory);
    }
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.eventType?.toLowerCase().includes(query) ||
        item.parish?.toLowerCase().includes(query) ||
        item.talentName?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [sortedItems, filterCategory, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="typography-section-title">Portfolio Management</h2>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Manage portfolio items that appear on the public portfolio page
          </p>
        </div>
        <Button
          onClick={() => {
            setShowForm(true);
            setEditingItem(null);
            resetForm();
          }}
          className="bg-primary hover:opacity-90 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Portfolio Item
        </Button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <Card className="card-premium border-2 border-secondary">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>{editingItem ? 'Edit Portfolio Item' : 'Add New Portfolio Item'}</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowForm(false);
                  setEditingItem(null);
                  resetForm();
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Corporate Event Photography"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the work..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: 'photography' | 'videography' | 'audio') => 
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="photography">
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4" />
                          Photography
                        </div>
                      </SelectItem>
                      <SelectItem value="videography">
                        <div className="flex items-center gap-2">
                          <Route className="w-4 h-4" />
                          Videography
                        </div>
                      </SelectItem>
                      <SelectItem value="audio">
                        <div className="flex items-center gap-2">
                          <Ruler className="w-4 h-4" />
                          Audio
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="eventType">Event Type</Label>
                  <Input
                    id="eventType"
                    value={formData.eventType}
                    onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                    placeholder="e.g., Wedding, Corporate, Festival"
                  />
                </div>

                <div>
                  <Label htmlFor="mediaUrl">Media URL *</Label>
                  <Input
                    id="mediaUrl"
                    value={formData.mediaUrl}
                    onChange={(e) => setFormData({ ...formData, mediaUrl: e.target.value })}
                    placeholder="https://..."
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Direct link to image, video, or audio file
                  </p>
                  {/* Media Preview */}
                  {formData.mediaUrl && (
                    <div className="mt-2">
                      {formData.category === 'photography' && validateMediaUrl(formData.mediaUrl, 'photography') ? (
                        <div className="relative w-full h-32 rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                          <ImageWithFallback
                            src={formData.mediaUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : formData.category === 'videography' && validateMediaUrl(formData.mediaUrl, 'videography') ? (
                        <div className="relative w-full h-32 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center">
                          {formData.thumbnailUrl ? (
                            <ImageWithFallback
                              src={formData.thumbnailUrl}
                              alt="Video preview"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex flex-col items-center gap-2">
                              <Play className="w-8 h-8 text-gray-400" />
                              <span className="text-xs text-gray-500">Video URL</span>
                            </div>
                          )}
                        </div>
                      ) : formData.category === 'audio' && validateMediaUrl(formData.mediaUrl, 'audio') ? (
                        <div className="w-full h-32 rounded-lg border border-gray-200 bg-gray-100 flex items-center justify-center">
                          <div className="flex flex-col items-center gap-2">
                            <Music className="w-8 h-8 text-gray-400" />
                            <span className="text-xs text-gray-500">Audio file</span>
                          </div>
                        </div>
                      ) : formData.mediaUrl && !validateMediaUrl(formData.mediaUrl, formData.category) ? (
                        <div className="flex items-center gap-2 text-xs text-red-600 mt-1">
                          <AlertCircle className="w-4 h-4" />
                          <span>Invalid URL format for {formData.category}</span>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
                  <Input
                    id="thumbnailUrl"
                    value={formData.thumbnailUrl}
                    onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                    placeholder="https://..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Optional: Custom thumbnail image
                  </p>
                </div>

                <div>
                  <Label htmlFor="parish">Parish</Label>
                  <Input
                    id="parish"
                    value={formData.parish}
                    onChange={(e) => setFormData({ ...formData, parish: e.target.value })}
                    placeholder="e.g., Kingston, St. Andrew"
                  />
                </div>

                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="talentName">Talent Name</Label>
                  <Input
                    id="talentName"
                    value={formData.talentName}
                    onChange={(e) => setFormData({ ...formData, talentName: e.target.value })}
                    placeholder="Name of the professional"
                  />
                </div>

                <div className="sm:col-span-2 flex items-center gap-2">
                  <Checkbox
                    id="featured"
                    checked={formData.featured}
                    onCheckedChange={(checked) => setFormData({ ...formData, featured: Boolean(checked) })}
                  />
                  <Label htmlFor="featured" className="cursor-pointer">
                    Featured (show prominently on portfolio page)
                  </Label>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button 
                  type="submit" 
                  disabled={saving}
                  className="bg-primary hover:opacity-90 text-white disabled:opacity-50 flex-1 min-h-[44px] sm:min-h-0 sm:h-10 whitespace-nowrap"
                >
                  {saving ? 'Saving...' : editingItem ? 'Update Item' : 'Add Item'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingItem(null);
                    resetForm();
                  }}
                  className="flex-1 sm:flex-none min-h-[44px] sm:min-h-0 sm:h-10 whitespace-nowrap"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filters and Search */}
      {(items.length > 0 || searchQuery || filterCategory !== 'all') && (
        <Card className="card-premium">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search by title, description, event type..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              {/* Category Filter */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setFilterCategory('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filterCategory === 'all'
                      ? 'bg-primary text-white'
                      : 'bg-white text-secondary hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterCategory('photography')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    filterCategory === 'photography'
                      ? 'bg-primary text-white'
                      : 'bg-white text-secondary hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  Photo
                </button>
                <button
                  onClick={() => setFilterCategory('videography')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    filterCategory === 'videography'
                      ? 'bg-primary text-white'
                      : 'bg-white text-secondary hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <Route className="w-4 h-4" />
                  Video
                </button>
                <button
                  onClick={() => setFilterCategory('audio')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    filterCategory === 'audio'
                      ? 'bg-primary text-white'
                      : 'bg-white text-secondary hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <Ruler className="w-4 h-4" />
                  Audio
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Portfolio Items List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary"></div>
        </div>
      ) : items.length === 0 ? (
        <Card className="card-premium">
          <CardContent className="py-12 text-center">
            <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No portfolio items yet. Add your first item to get started.</p>
            <Button
              onClick={() => {
                setShowForm(true);
                setEditingItem(null);
                resetForm();
              }}
              className="bg-primary hover:opacity-90 text-white min-h-[44px] sm:min-h-0 sm:h-10 whitespace-nowrap"
            >
              <Plus className="w-4 h-4 sm:mr-2 shrink-0" />
              <span className="hidden sm:inline">Add Your First Portfolio Item</span>
              <span className="sm:hidden">Add Item</span>
            </Button>
          </CardContent>
        </Card>
      ) : filteredItems.length === 0 ? (
        <Card className="card-premium">
          <CardContent className="py-12 text-center">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No items match your search criteria.</p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setFilterCategory('all');
              }}
              className="mt-4 w-full sm:w-auto min-h-[44px] sm:min-h-0 sm:h-10 whitespace-nowrap"
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <Card key={item.id} className="card-premium hover-lift">
              <div className="relative h-48 overflow-hidden bg-secondary rounded-t-lg">
                {item.thumbnailUrl ? (
                  <ImageWithFallback
                    src={item.thumbnailUrl}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary to-secondary/90">
                    {item.category === 'photography' && <Layers className="w-10 h-10 text-white/90" />}
                    {item.category === 'videography' && <Route className="w-10 h-10 text-white/90" />}
                    {item.category === 'audio' && <Ruler className="w-10 h-10 text-white/90" />}
                  </div>
                )}
                <div className="absolute top-2 left-2">
                  <Badge className="bg-white text-secondary">
                    {getCategoryIcon(item.category)}
                    <span className="ml-1 capitalize text-xs">{item.category}</span>
                  </Badge>
                </div>
                {item.featured && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-primary text-white">
                      <Star className="w-3 h-3 mr-1" />
                      Featured
                    </Badge>
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="typography-card-title-lg mb-2 line-clamp-2">{item.title}</h3>
                {item.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                )}
                <div className="flex flex-wrap gap-2 mb-4">
                  {item.eventType && (
                    <Badge variant="outline" className="text-xs">{item.eventType}</Badge>
                  )}
                  {item.parish && (
                    <Badge variant="outline" className="text-xs">{item.parish}</Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(item)}
                    className="flex-1 min-h-[40px] sm:min-h-0 sm:h-8 whitespace-nowrap"
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => item.id && handleDelete(item.id)}
                    aria-label="Delete portfolio item"
                    className="min-h-[40px] min-w-[40px] sm:min-h-0 sm:min-w-0 sm:h-8 sm:w-auto"
                  >
                    <Trash2 className="w-4 h-4 shrink-0" />
                    <span className="hidden sm:inline ml-2">Delete</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
