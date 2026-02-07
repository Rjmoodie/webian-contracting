import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Plus, Trash2, Image as ImageIcon, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { getFreshToken } from '/utils/supabase/client';
import { api } from '/utils/supabase/api';
import { getContent } from '@/app/config';

interface PastWorkManagementProps {
  accessToken: string;
}

interface PortfolioItem {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  location?: string | null;
  sort_order: number;
  created_at: string;
  portfolio_item_media?: { id: string; file_path: string; file_name: string; content_type?: string }[];
}

const CATEGORY_KEYS = ['photography', 'videography', 'audio'] as const;

export default function PastWorkManagement({ accessToken }: PastWorkManagementProps) {
  const content = getContent();
  const serviceCategories = content?.serviceCategories ?? { photography: 'Photography', videography: 'Videography', audio: 'Audio' };

  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState<string>('photography');
  const [formLocation, setFormLocation] = useState('');
  const [formPhotos, setFormPhotos] = useState<File[]>([]);
  const [uploadingForId, setUploadingForId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formPhotoInputRef = useRef<HTMLInputElement>(null);
  const uploadTargetIdRef = useRef<string | null>(null);
  const [currentToken, setCurrentToken] = useState(accessToken);

  const makeRequest = async (url: string, options: RequestInit = {}) => {
    const token = await getFreshToken() || currentToken || accessToken;
    if (token !== currentToken) setCurrentToken(token);
    const res = await fetch(url, { ...options, headers: { ...(options.headers as object), Authorization: `Bearer ${token}` } });
    if (res.status === 401) return null;
    return res;
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await makeRequest(`${api('admin')}/portfolio-items`);
      if (!res) {
        setItems([]);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      } else {
        setItems([]);
      }
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const resetForm = () => {
    setFormTitle('');
    setFormDescription('');
    setFormCategory('photography');
    setFormLocation('');
    setFormPhotos([]);
    setShowForm(false);
  };

  const handleCreate = async () => {
    if (!formTitle.trim()) {
      toast.error('Title is required');
      return;
    }
    setSaving(true);
    try {
      const res = await makeRequest(`${api('admin')}/portfolio-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle.trim(),
          description: formDescription.trim() || null,
          category: formCategory,
          location: formLocation.trim() || null,
        }),
      });
      if (!res?.ok) {
        const data = await res?.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || 'Failed to create');
      }
      const data = await res.json();
      const newItem = data.item as PortfolioItem;
      const photosToUpload = formPhotos.filter((f) => f.size > 0 && f.size <= 15 * 1024 * 1024);
      for (const file of photosToUpload) {
        const fd = new FormData();
        fd.append('file', file);
        await makeRequest(`${api('admin')}/portfolio-items/${newItem.id}/media`, { method: 'POST', body: fd });
      }
      if (photosToUpload.length > 0) {
        toast.success(`Past project and ${photosToUpload.length} photo(s) added.`);
      } else {
        toast.success('Past project added. Add photos below so it shows on the Portfolio.');
      }
      setFormPhotos([]);
      setItems((prev) => [newItem, ...prev]);
      resetForm();
      fetchItems();
    } catch (e: any) {
      toast.error(e.message || 'Failed to add');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadMedia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const itemId = uploadTargetIdRef.current;
    uploadTargetIdRef.current = null;
    const fileList = e.target.files;
    e.target.value = '';
    if (!itemId || !fileList?.length) return;
    const toUpload = Array.from(fileList).filter((f) => f.size <= 15 * 1024 * 1024);
    if (toUpload.some((f) => f.size > 15 * 1024 * 1024)) toast.error('Some files were skipped (max 15 MB each).');
    if (toUpload.length === 0) return;
    setUploadingForId(itemId);
    try {
      for (const file of toUpload) {
        const fd = new FormData();
        fd.append('file', file);
        const res = await makeRequest(`${api('admin')}/portfolio-items/${itemId}/media`, { method: 'POST', body: fd });
        if (!res?.ok) throw new Error('Upload failed');
      }
      toast.success(toUpload.length === 1 ? 'Image added' : `${toUpload.length} images added`);
      fetchItems();
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploadingForId(null);
    }
  };

  const handleDelete = async (item: PortfolioItem) => {
    if (!confirm(`Remove "${item.title}" from past work? It will no longer appear on the Portfolio.`)) return;
    try {
      const res = await makeRequest(`${api('admin')}/portfolio-items/${item.id}`, { method: 'DELETE' });
      if (!res?.ok) throw new Error('Delete failed');
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      toast.success('Removed');
    } catch {
      toast.error('Failed to remove');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Past work (Portfolio)
          </CardTitle>
          <p className="text-sm text-gray-500">
            Add projects with photos and descriptions so they appear on the public Portfolio page. No client project required.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {!showForm ? (
            <Button onClick={() => setShowForm(true)} className="cursor-pointer">
              <Plus className="w-4 h-4 mr-2" />
              Add past project
            </Button>
          ) : (
            <Card className="border-2 border-dashed border-gray-200 bg-gray-50/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">New past project</CardTitle>
                  <button type="button" onClick={resetForm} className="p-1 rounded hover:bg-gray-200 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Title *</Label>
                  <Input
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. JPS Wind Turbines, St. Elizabeth"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Brief description of the project"
                    rows={3}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={formCategory} onValueChange={setFormCategory}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_KEYS.map((key) => (
                        <SelectItem key={key} value={key}>
                          {serviceCategories[key]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Location (optional)</Label>
                  <Input
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="e.g. St. Catherine"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Photos (optional)</Label>
                  <input
                    ref={formPhotoInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => setFormPhotos(Array.from(e.target.files ?? []))}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => formPhotoInputRef.current?.click()}
                    className="mt-1 cursor-pointer"
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Choose images
                  </Button>
                  {formPhotos.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {formPhotos.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <span className="text-gray-600 truncate flex-1">{f.name}</span>
                          <button
                            type="button"
                            onClick={() => setFormPhotos((prev) => prev.filter((_, j) => j !== i))}
                            className="text-gray-500 hover:text-red-600 cursor-pointer shrink-0"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Add one or more photos. Max 15 MB each. First image is used as the Portfolio thumbnail.</p>
                </div>
                <Button onClick={handleCreate} disabled={saving} className="cursor-pointer">
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                  Add to portfolio
                </Button>
              </CardContent>
            </Card>
          )}

          {loading ? (
            <div className="flex items-center gap-2 text-gray-500 py-8">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading…
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">No past work items yet. Add one above to show on the public Portfolio.</p>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => (
                <li key={item.id} className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 bg-white">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-secondary truncate">{item.title}</p>
                    <p className="text-xs text-gray-500">
                      {serviceCategories[item.category as keyof typeof serviceCategories] ?? item.category}
                      {item.location && ` · ${item.location}`}
                    </p>
                    {item.portfolio_item_media?.length ? (
                      <p className="text-xs text-green-600 mt-0.5">{item.portfolio_item_media.length} image(s)</p>
                    ) : (
                      <p className="text-xs text-amber-600 mt-0.5">No image — add one so it shows on the Portfolio</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleUploadMedia}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!!uploadingForId}
                      onClick={() => { uploadTargetIdRef.current = item.id; fileInputRef.current?.click(); }}
                      className="cursor-pointer"
                    >
                      {uploadingForId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                      <span className="ml-1 hidden sm:inline">Add photos</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(item)}
                      className="text-red-600 border-red-200 hover:bg-red-50 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
