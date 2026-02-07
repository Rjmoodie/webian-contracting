import React, { useState, useEffect, useRef, type ChangeEvent } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  CheckCircle2, 
  XCircle,
  AlertCircle,
  Building2,
  Layers,
  Route,
  Ruler,
  Paperclip,
  Download,
  FileText,
  ImagePlus,
  Star,
  Trash2,
  Share2,
  Video,
  File,
  MessageSquare,
  ClipboardList,
  LayoutDashboard
} from 'lucide-react';
import { Switch } from '@/app/components/ui/switch';
import { toast } from 'sonner';
import ActivityLog from '@/app/components/ActivityLog';
import ProjectCommsPanel from '@/app/components/ProjectCommsPanel';
import QuoteBuilder from '@/app/components/QuoteBuilder';
import QuoteDocument from '@/app/components/QuoteDocument';
import ReportBuilder from '@/app/components/ReportBuilder';
import { getSupabase } from '/utils/supabase/client';
import { api } from '/utils/supabase/api';

// ── Helpers ─────────────────────────────────────────────────
const formatBytes = (bytes?: number): string => {
  if (bytes == null && bytes !== 0) return '';
  let b = bytes ?? 0, u = 0;
  const units = ['B', 'KB', 'MB', 'GB'];
  while (b >= 1024 && u < units.length - 1) { b /= 1024; u++; }
  return `${b.toFixed(u === 0 ? 0 : 1)} ${units[u]}`;
};

const getFileTypeLabel = (contentType?: string): string => {
  if (!contentType) return 'File';
  const ct = contentType.toLowerCase();
  if (ct.includes('pdf')) return 'PDF';
  if (ct.includes('image')) return 'Image';
  if (ct.includes('video')) return 'Video';
  if (ct.includes('word') || ct.includes('document')) return 'Doc';
  if (ct.includes('sheet') || ct.includes('excel')) return 'Sheet';
  return 'File';
};

interface RequestDetailsPageProps {
  requestId: string;
  user: any;
  accessToken: string;
  onBack: () => void;
}

export default function RequestDetailsPage({ 
  requestId, 
  user, 
  accessToken, 
  onBack 
}: RequestDetailsPageProps) {
  const [request, setRequest] = useState<any>(null);
  const [activityLog, setActivityLog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState('');
  const [cancellationReason, setCancellationReason] = useState('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [attachmentUrls, setAttachmentUrls] = useState<Record<string, string>>({});
  const [projectMediaUrls, setProjectMediaUrls] = useState<Record<string, string>>({});
  const [mediaUploading, setMediaUploading] = useState(false);
  const [uploadCount, setUploadCount] = useState({ done: 0, total: 0 });
  const MAX_MEDIA_MB = 25;
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [lineItems, setLineItems] = useState<any[]>([]);

  const isAdmin = user.role === 'admin' || user.role === 'manager';
  const isClient = user.role === 'client';
  const canEditMedia = isAdmin || isClient;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Could not copy');
    }
  };

  useEffect(() => {
    fetchRequestDetails();
  }, [requestId]);

  useEffect(() => {
    if (!request?.attachments?.length) {
      setAttachmentUrls({});
      return;
    }
    const supabase = getSupabase();
    const expireSec = 3600;
    (async () => {
      const entries = await Promise.all(
        request.attachments.map(async (a: { id: string; file_path: string }) => {
          const { data } = await supabase.storage.from('request-attachments').createSignedUrl(a.file_path, expireSec);
          return [a.id, data?.signedUrl] as const;
        })
      );
      const next: Record<string, string> = {};
      for (const [id, url] of entries) if (url) next[id] = url;
      setAttachmentUrls(next);
    })();
  }, [request?.id, request?.attachments]);

  useEffect(() => {
    if (!request?.project_media?.length) {
      setProjectMediaUrls({});
      return;
    }
    const supabase = getSupabase();
    const expireSec = 3600;
    (async () => {
      const entries = await Promise.all(
        request.project_media.map(async (m: { id: string; file_path: string }) => {
          const { data } = await supabase.storage.from('project-media').createSignedUrl(m.file_path, expireSec);
          return [m.id, data?.signedUrl] as const;
        })
      );
      const next: Record<string, string> = {};
      for (const [id, url] of entries) if (url) next[id] = url;
      setProjectMediaUrls(next);
    })();
  }, [request?.id, request?.project_media]);

  const fetchRequestDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${api('projects')}/${requestId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRequest(data.request);
        setActivityLog(data.activityLog || []);
        setMessages(data.messages || []);
        setLineItems(data.lineItems || []);
        setNewStatus(data.request.status);
      } else {
        toast.error('Failed to load request details');
      }
    } catch (error) {
      console.error('Error fetching request details:', error);
      toast.error('Failed to load request details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (newStatus === request.status) return;
    setStatusUpdating(true);
    try {
      const response = await fetch(`${api('projects')}/${requestId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success('Status updated successfully');
        fetchRequestDetails();
      } else {
        toast.error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleCancelRequest = async () => {
    try {
      const response = await fetch(`${api('projects')}/${requestId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ reason: cancellationReason }),
      });

      if (response.ok) {
        toast.success('Request cancelled');
        setShowCancelDialog(false);
        fetchRequestDetails();
      } else {
        toast.error('Failed to cancel request');
      }
    } catch (error) {
      console.error('Error cancelling request:', error);
      toast.error('Failed to cancel request');
    }
  };

  const handleFeaturedToggle = async (checked: boolean) => {
    try {
      const response = await fetch(`${api('projects')}/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ featured: checked }),
      });
      if (response.ok) {
        toast.success(checked ? 'Project featured on public portfolio' : 'Project removed from public portfolio');
        fetchRequestDetails();
      } else {
        const data = await response.json().catch(() => ({}));
        toast.error(data?.error || 'Failed to update featured');
      }
    } catch (error) {
      console.error('Featured toggle error:', error);
      toast.error('Failed to update featured');
    }
  };

  const mediaInputRef = useRef<HTMLInputElement>(null);
  const handleMediaUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length || !requestId) return;
    const maxBytes = MAX_MEDIA_MB * 1024 * 1024;
    setMediaUploading(true);
    setUploadCount({ done: 0, total: files.length });
    const supabase = getSupabase();
    const uploaded: { file_path: string; file_name: string; file_size: number; content_type: string }[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        setUploadCount({ done: i, total: files.length });
        const file = files[i];
        if (file.size > maxBytes) {
          toast.error(`${file.name} exceeds ${MAX_MEDIA_MB}MB limit`);
          continue;
        }
        const filePath = `${requestId}/${crypto.randomUUID()}_${file.name}`;
        const { error } = await supabase.storage
          .from('project-media')
          .upload(filePath, file, { contentType: file.type || 'application/octet-stream', upsert: false });
        if (error) {
          toast.error(`Could not upload ${file.name}`);
          continue;
        }
        uploaded.push({
          file_path: filePath,
          file_name: file.name,
          file_size: file.size,
          content_type: file.type || 'application/octet-stream',
        });
      }
      setUploadCount({ done: files.length, total: files.length });
      if (uploaded.length > 0) {
        const response = await fetch(`${api('projects')}/${requestId}/media`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ media: uploaded }),
        });
        if (response.ok) {
          toast.success('Media added');
          fetchRequestDetails();
        } else {
          toast.error('Failed to register media');
        }
      }
    } finally {
      setMediaUploading(false);
      setUploadCount({ done: 0, total: 0 });
      e.target.value = '';
      if (mediaInputRef.current) mediaInputRef.current.value = '';
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    if (!confirm('Remove this media file?')) return;
    try {
      const response = await fetch(`${api('projects')}/${requestId}/media/${mediaId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (response.ok) {
        toast.success('Media removed');
        fetchRequestDetails();
      } else {
        toast.error('Failed to remove media');
      }
    } catch (error) {
      toast.error('Failed to remove media');
    }
  };

  const downloadIcs = () => {
    const req = request as any;
    const dt = new Date(req.eventDate || req.created_at || Date.now());
    const y = dt.getUTCFullYear();
    const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
    const d = String(dt.getUTCDate()).padStart(2, '0');
    const title = (req.eventName ?? req.project_name ?? 'Project').replace(/\n/g, ' ').replace(/,/g, '\\,');
    const location = (req.venue ?? req.parish ?? '').replace(/\n/g, ' ').replace(/,/g, '\\,');
    const description = (req.projectDescription ?? '').replace(/\n/g, '\\n').replace(/,/g, '\\,');
    const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Project//EN
CALSCALE:GREGORIAN
BEGIN:VEVENT
UID:${req.id}@project
DTSTAMP:${y}${m}${d}T000000Z
DTSTART;VALUE=DATE:${y}${m}${d}
SUMMARY:${title}
LOCATION:${location}
DESCRIPTION:${description}
END:VEVENT
END:VCALENDAR`;
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(req.eventName ?? req.project_name ?? 'project').replace(/[^a-z0-9-_]/gi, '-')}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      rfq_submitted: 'bg-yellow-100 text-yellow-800',
      under_review: 'bg-blue-100 text-blue-800',
      quoted: 'bg-purple-100 text-purple-800',
      quote_accepted: 'bg-green-100 text-green-800',
      quote_rejected: 'bg-red-100 text-red-800',
      in_progress: 'bg-indigo-100 text-indigo-800',
      data_processing: 'bg-indigo-100 text-indigo-800',
      reporting: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-emerald-100 text-emerald-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'photography':
        return <Layers className="w-4 h-4" />;
      case 'videography':
        return <Route className="w-4 h-4" />;
      case 'audio':
        return <Ruler className="w-4 h-4" />;
      default:
        return <Layers className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="h-10 w-72 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-40 bg-muted rounded-xl animate-pulse" />
              <div className="h-64 bg-muted rounded-xl animate-pulse" />
              <div className="h-48 bg-muted rounded-xl animate-pulse" />
            </div>
            <div className="space-y-4">
              <div className="h-56 bg-muted rounded-xl animate-pulse" />
              <div className="h-32 bg-muted rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-4 sm:p-6 md:p-8 text-center">
            <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-red-500 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-semibold mb-2">Request Not Found</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">The request you're looking for doesn't exist or you don't have access to it.</p>
            <Button onClick={onBack}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const mapsUrlProject = request.projectAddressLat != null && request.projectAddressLng != null
    ? `https://www.google.com/maps/search/?api=1&query=${request.projectAddressLat},${request.projectAddressLng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(request.venue ?? request.parish ?? '')}`;
  const mapsUrlClient = request.clientAddressLat != null && request.clientAddressLng != null
    ? `https://www.google.com/maps/search/?api=1&query=${request.clientAddressLat},${request.clientAddressLng}`
    : request.clientAddress ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(request.clientAddress)}` : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="typography-page-title">{request.eventName || request.project_name}</h1>
                <p className="text-xs sm:text-sm text-gray-600">Request ID: {request.id}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname || '/'}?requestId=${requestId}` : '')}
                className="cursor-pointer"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Badge className={`text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 ${getStatusColor(request.status)}`}>
                {request.status.replace(/_/g, ' ').toUpperCase()}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Left Column - Tabbed Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview" className="w-full">
              {/* ── Tab navigation ─────────────────────────── */}
              <div className="mb-4 -mx-4 sm:mx-0">
                <div className="relative">
                  <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#f5f1eb] to-transparent z-10 sm:hidden" />
                  <TabsList className="!grid-cols-none !flex !flex-nowrap !overflow-x-auto !overflow-y-hidden !whitespace-nowrap !gap-1 sm:!gap-1.5 !p-1.5 bg-white border border-gray-200 shadow-sm rounded-xl sm:rounded-2xl mx-4 sm:mx-0 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {[
                      { value: 'overview', label: 'Overview', icon: LayoutDashboard },
                      ...(isAdmin && ['rfq_submitted', 'under_review', 'quote_rejected'].includes(request.status)
                        ? [{ value: 'quote', label: 'Quote', icon: FileText }]
                        : ['quoted', 'quote_accepted', 'quote_rejected'].includes(request.status) && lineItems.length > 0
                        ? [{ value: 'quote', label: 'Quote', icon: FileText }]
                        : []),
                      { value: 'report', label: 'Report', icon: ClipboardList },
                      { value: 'media', label: 'Media', icon: ImagePlus },
                      { value: 'comms', label: 'Comms', icon: MessageSquare },
                      { value: 'activity', label: 'Activity', icon: Calendar },
                    ].map((t) => {
                      const Icon = t.icon;
                      return (
                        <TabsTrigger
                          key={t.value}
                          value={t.value}
                          className="!flex-none !shrink-0 !w-auto inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg !whitespace-nowrap data-[state=active]:!bg-secondary data-[state=active]:!text-white data-[state=active]:!shadow-md data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:bg-gray-100 transition-all"
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          {t.label}
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                </div>
              </div>

              {/* ── Overview Tab ──────────────────────────── */}
              <TabsContent value="overview" className="space-y-4 sm:space-y-6">
                {/* Project Description */}
                {request.projectDescription && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                        <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                        Project Description
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{request.projectDescription}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Project Location & Addresses */}
                {(request.venue || request.clientAddress) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                        <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                        Addresses
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 space-y-4">
                      {request.venue && (
                        <div>
                          <Label className="text-gray-600 text-xs uppercase tracking-wide">Project Site Address</Label>
                          <p className="font-semibold text-gray-900 mt-0.5">{request.venue}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Button asChild size="sm" variant="outline" className="cursor-pointer">
                              <a href={mapsUrlProject} target="_blank" rel="noopener noreferrer">
                                <MapPin className="w-4 h-4 mr-2" /> Open in Google Maps
                              </a>
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => copyToClipboard(request.venue)} className="cursor-pointer">
                              Copy address
                            </Button>
                            {request.projectAddressLat != null && request.projectAddressLng != null && (
                              <Button size="sm" variant="outline" onClick={() => copyToClipboard(`${request.projectAddressLat}, ${request.projectAddressLng}`)} className="cursor-pointer">
                                Copy GPS
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                      {request.clientAddress && (
                        <div className={request.venue ? 'pt-3 border-t border-gray-100' : ''}>
                          <Label className="text-gray-600 text-xs uppercase tracking-wide">Client / Billing Address</Label>
                          <p className="font-semibold text-gray-900 mt-0.5">{request.clientAddress}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {mapsUrlClient && (
                              <Button asChild size="sm" variant="outline" className="cursor-pointer">
                                <a href={mapsUrlClient} target="_blank" rel="noopener noreferrer">
                                  <MapPin className="w-4 h-4 mr-2" /> Open in Google Maps
                                </a>
                              </Button>
                            )}
                            <Button size="sm" variant="outline" onClick={() => copyToClipboard(request.clientAddress)} className="cursor-pointer">
                              Copy address
                            </Button>
                            {request.clientAddressLat != null && request.clientAddressLng != null && (
                              <Button size="sm" variant="outline" onClick={() => copyToClipboard(`${request.clientAddressLat}, ${request.clientAddressLng}`)} className="cursor-pointer">
                                Copy GPS
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Event Information */}
                <Card>
                  <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                        <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                        Project Information
                      </CardTitle>
                      <Button size="sm" variant="outline" onClick={downloadIcs} className="cursor-pointer">
                        <Calendar className="w-4 h-4 mr-2" /> Add to Google Calendar
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <Label className="text-gray-600">Submitted</Label>
                        <p className="font-semibold text-gray-900">
                          {(request.created_at || request.createdAt)
                            ? new Date(request.created_at || request.createdAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                            : '—'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Project Date</Label>
                        <p className="font-semibold text-gray-900">
                          {request.eventDate
                            ? new Date(request.eventDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                            : '—'}
                        </p>
                      </div>
                      {request.eventTime && (
                        <div>
                          <Label className="text-gray-600">Time</Label>
                          <p className="font-semibold text-gray-900">{request.eventTime}</p>
                        </div>
                      )}
                      <div>
                        <Label className="text-gray-600">Location</Label>
                        <p className="font-semibold text-gray-900">{request.parish || '—'}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Site Address</Label>
                        <p className="font-semibold text-gray-900">{request.venue || '—'}</p>
                      </div>
                      {request.venueType && (
                        <div>
                          <Label className="text-gray-600">Venue Type</Label>
                          <p className="font-semibold text-gray-900 capitalize">{request.venueType}</p>
                        </div>
                      )}
                      {request.turnaround && (
                        <div>
                          <Label className="text-gray-600">Turnaround</Label>
                          <p className="font-semibold text-gray-900 capitalize">
                            {request.turnaround === 'standard' && 'Standard (7-14 days)'}
                            {request.turnaround === 'rush' && 'Rush (3-5 days)'}
                            {request.turnaround === 'express' && 'Express (24-48 hours)'}
                          </p>
                        </div>
                      )}
                    </div>
                    {request.budget && (
                      <div>
                        <Label className="text-gray-600">Budget Range</Label>
                        <p className="font-semibold text-gray-900">{request.budget}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Selected Services */}
                {request.serviceDetails?.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                        <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5" />
                        Selected Services ({request.serviceDetails.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6">
                      <div className="space-y-3">
                        {request.serviceDetails.map((service: any) => (
                          <div key={service.id} className="border-2 border-gray-200 rounded-lg p-3 sm:p-4">
                            <div className="flex items-start gap-2 sm:gap-3">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                                {getCategoryIcon(service.category)}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-bold text-secondary">{service.serviceName}</h4>
                                  <Badge className="bg-secondary text-secondary-foreground text-xs capitalize">
                                    {service.category}
                                  </Badge>
                                </div>
                                {service.deliverables?.length > 0 && (
                                  <ul className="space-y-1">
                                    {service.deliverables.slice(0, 3).map((item: string) => (
                                      <li key={item} className="text-sm text-gray-600 flex items-start gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                        {item}
                                      </li>
                                    ))}
                                    {service.deliverables.length > 3 && (
                                      <li className="text-sm text-gray-500">+{service.deliverables.length - 3} more</li>
                                    )}
                                  </ul>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* ── Quote Tab ─────────────────────────────── */}
              <TabsContent value="quote" className="space-y-4 sm:space-y-6">
                {isAdmin && ['rfq_submitted', 'under_review', 'quote_rejected'].includes(request.status) && (
                  <QuoteBuilder
                    request={{ ...request, lineItems }}
                    accessToken={accessToken}
                    onQuoteSent={fetchRequestDetails}
                  />
                )}
                {['quoted', 'quote_accepted', 'quote_rejected'].includes(request.status) && lineItems.length > 0 && (
                  <QuoteDocument
                    request={request}
                    lineItems={lineItems}
                    user={user}
                    accessToken={accessToken}
                    onAction={fetchRequestDetails}
                  />
                )}
              </TabsContent>

              {/* ── Report Tab ────────────────────────────── */}
              <TabsContent value="report" className="space-y-4 sm:space-y-6">
                <ReportBuilder
                  request={request}
                  user={user}
                  accessToken={accessToken}
                  onRefresh={fetchRequestDetails}
                  projectMediaUrls={projectMediaUrls}
                />
              </TabsContent>

              {/* ── Media & Files Tab ─────────────────────── */}
              <TabsContent value="media" className="space-y-4 sm:space-y-6">
                {/* Attachments */}
                {request.attachments?.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                        <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
                        Attachments
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6">
                      <ul className="space-y-2">
                        {request.attachments.map((a: { id: string; file_name: string; file_size?: number; content_type?: string }) => (
                          <li key={a.id} className="flex items-center justify-between gap-3 py-2 border-b border-gray-100 last:border-0">
                            <div className="min-w-0 flex-1 flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900 truncate">{a.file_name}</span>
                              <Badge variant="secondary" className="text-xs shrink-0">{getFileTypeLabel(a.content_type)}</Badge>
                            </div>
                            <span className="text-xs text-gray-500 shrink-0">{formatBytes(a.file_size)}</span>
                            {attachmentUrls[a.id] ? (
                              <div className="flex items-center gap-2 shrink-0">
                                <a href={attachmentUrls[a.id]} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">View</a>
                                <a href={attachmentUrls[a.id]} download className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"><Download className="w-4 h-4" /> Download</a>
                                <Button size="sm" variant="ghost" onClick={() => copyToClipboard(attachmentUrls[a.id])} className="cursor-pointer h-8 px-2">Copy link</Button>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 shrink-0">Loading…</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Project media */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                      <ImagePlus className="w-4 h-4 sm:w-5 sm:h-5" />
                      Project Media
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1">Photos or files for this project. Featured projects show this media on the public Portfolio.</p>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    {request.project_media?.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
                        {request.project_media.map((m: { id: string; file_name: string; file_size?: number; content_type?: string }) => {
                          const isImageFile = (m.content_type || '').toLowerCase().startsWith('image/');
                          const url = projectMediaUrls[m.id];
                          return (
                            <div key={m.id} className="relative group rounded-lg border border-gray-200 overflow-hidden bg-gray-50 aspect-square">
                              {url ? (
                                isImageFile ? (
                                  <a href={url} target="_blank" rel="noopener noreferrer" className="block w-full h-full cursor-pointer">
                                    <img src={url} alt={m.file_name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                  </a>
                                ) : (
                                  <a href={url} target="_blank" rel="noopener noreferrer" className="flex w-full h-full items-center justify-center cursor-pointer">
                                    {(m.content_type || '').toLowerCase().startsWith('video/') ? <Video className="w-12 h-12 text-gray-400" /> : <File className="w-12 h-12 text-gray-400" />}
                                  </a>
                                )
                              ) : (
                                <div className="flex w-full h-full items-center justify-center"><div className="animate-pulse w-12 h-12 rounded bg-gray-200" /></div>
                              )}
                              <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/70 to-transparent flex items-center justify-between gap-1">
                                <span className="text-xs text-white truncate flex-1">{m.file_name}</span>
                                {canEditMedia && (
                                  <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 text-white hover:text-red-300 hover:bg-white/20 cursor-pointer shrink-0" onClick={() => handleDeleteMedia(m.id)} aria-label={`Remove ${m.file_name}`}>
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 mb-4">No media yet. Add images or files to showcase this project.</p>
                    )}
                    {canEditMedia && (
                      <>
                        <input ref={mediaInputRef} type="file" accept="image/*,video/*,.pdf" multiple className="hidden" onChange={handleMediaUpload} aria-label="Upload project media" />
                        <Button type="button" variant="outline" onClick={() => mediaInputRef.current?.click()} disabled={mediaUploading} className="cursor-pointer">
                          {mediaUploading ? (<>Uploading{uploadCount.total > 0 ? ` (${uploadCount.done}/${uploadCount.total})…` : '…'}</>) : (<><ImagePlus className="w-4 h-4 mr-2" />Add media</>)}
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── Communications Tab ────────────────────── */}
              <TabsContent value="comms" className="space-y-4 sm:space-y-6">
                <ProjectCommsPanel
                  projectId={requestId}
                  user={user}
                  accessToken={accessToken}
                  initialMessages={messages}
                />
              </TabsContent>

              {/* ── Activity Tab ──────────────────────────── */}
              <TabsContent value="activity" className="space-y-4 sm:space-y-6">
                <ActivityLog activities={activityLog} userRole={user.role} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Actions (sticky on desktop) */}
          <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            {/* Client Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  Client Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-2">
                  <div>
                    <Label className="text-gray-600">Name</Label>
                    <p className="font-semibold">{request.clientName || request.client_name || '—'}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Email</Label>
                    <p className="font-semibold">{request.clientEmail || request.client_email || '—'}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Submitted</Label>
                    <p className="font-semibold">
                      {(request.created_at || request.createdAt)
                        ? new Date(request.created_at || request.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : '—'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Feature on public portfolio (Admin only) */}
            {isAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Star className="w-4 h-4 sm:w-5 sm:h-5" />
                    Public portfolio
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="featured-toggle" className="text-sm font-medium cursor-pointer">
                      Feature on public site
                    </Label>
                    <Switch
                      id="featured-toggle"
                      checked={!!request.featured}
                      onCheckedChange={handleFeaturedToggle}
                      aria-label="Feature project on public portfolio"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    {request.featured
                      ? 'This project is shown on the public Portfolio page. Turn off to remove it.'
                      : 'Turn on to show this project on the public Portfolio page.'}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Status Management (Admin only) */}
            {isAdmin && request.status !== 'cancelled' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Manage Status</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-4">
                  <div>
                    <Label>Change Status</Label>
                    <Select value={newStatus} onValueChange={setNewStatus} disabled={statusUpdating}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rfq_submitted">RFQ Submitted</SelectItem>
                        <SelectItem value="under_review">Under Review</SelectItem>
                        <SelectItem value="quoted">Quoted</SelectItem>
                        <SelectItem value="quote_accepted">Quote Accepted</SelectItem>
                        <SelectItem value="quote_rejected">Quote Rejected</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="data_processing">Data Processing</SelectItem>
                        <SelectItem value="reporting">Reporting</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {newStatus !== request.status && (
                    <Button
                      onClick={handleStatusChange}
                      disabled={statusUpdating}
                      className="w-full bg-primary text-primary-foreground hover:opacity-90 cursor-pointer"
                    >
                      {statusUpdating ? 'Updating…' : 'Update Status'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Cancel Request */}
            {(isClient || isAdmin) && request.status !== 'cancelled' && request.status !== 'completed' && (
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl text-red-600">Cancel Request</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-4">
                  {!showCancelDialog ? (
                    <Button
                      onClick={() => setShowCancelDialog(true)}
                      variant="outline"
                      className="w-full border-red-300 text-red-600 hover:bg-red-50 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Cancel Request
                    </Button>
                  ) : (
                    <>
                      <div>
                        <Label>Cancellation Reason (min 10 characters)</Label>
                        <Textarea
                          placeholder="Please provide a reason for cancellation (at least 10 characters)..."
                          value={cancellationReason}
                          onChange={(e) => setCancellationReason(e.target.value)}
                          rows={3}
                          className="mt-1"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setShowCancelDialog(false)}
                          variant="outline"
                          className="flex-1 cursor-pointer"
                        >
                          Back
                        </Button>
                        <Button
                          onClick={handleCancelRequest}
                          disabled={!cancellationReason || cancellationReason.trim().length < 10}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Confirm Cancellation
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
