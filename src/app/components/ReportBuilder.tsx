import React, { useState, useEffect, useCallback, useRef, type ChangeEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';
import {
  FileText, Plus, Trash2, ChevronUp, ChevronDown, Eye, EyeOff,
  Download, Send, Save, ImagePlus, GripVertical, Loader2, X,
  CheckCircle2, Edit3, RotateCcw, FolderOpen, Check, Image as ImageIcon,
  Layers, Route,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '/utils/supabase/api';
import { getSupabase } from '/utils/supabase/client';
import { getBranding } from '@/app/config';
import jsPDF from 'jspdf';

// ── Types ──────────────────────────────────────────────────
interface Section {
  id: string;
  report_id: string;
  section_key: string;
  title: string;
  content: string;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

interface Media {
  id: string;
  report_id: string;
  section_id: string | null;
  file_path: string;
  file_name: string;
  file_size: number;
  content_type: string;
  caption: string | null;
  sort_order: number;
  created_at: string;
}

export type ReportTemplateType = 'cavity' | 'utility_anomaly';

interface Report {
  id: string;
  project_id: string;
  report_number: string;
  title: string;
  status: string;
  template_type?: ReportTemplateType | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  issued_at: string | null;
  issued_to_email: string | null;
  notes: string | null;
}

interface ProjectMediaItem {
  id: string;
  file_path: string;
  file_name: string;
  file_size?: number;
  content_type?: string;
}

interface ReportBuilderProps {
  request: any;
  user: { id: string; name: string; role: string };
  accessToken: string;
  onRefresh: () => void;
  projectMediaUrls?: Record<string, string>;
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  in_review: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  issued: 'bg-emerald-100 text-emerald-800',
  amended: 'bg-amber-100 text-amber-700',
};

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  in_review: 'In Review',
  approved: 'Approved',
  issued: 'Issued',
  amended: 'Amended',
};

// ── Component ──────────────────────────────────────────────
export default function ReportBuilder({ request, user, accessToken, onRefresh, projectMediaUrls = {} }: ReportBuilderProps) {
  const [report, setReport] = useState<Report | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [media, setMedia] = useState<Media[]>([]);
  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [issuing, setIssuing] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplateType | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingSectionId, setUploadingSectionId] = useState<string | null>(null);

  // Project media picker state
  const [pickerSectionId, setPickerSectionId] = useState<string | null>(null);
  const [importingMediaId, setImportingMediaId] = useState<string | null>(null);
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());

  const projectMedia: ProjectMediaItem[] = request?.project_media || [];

  const isAdmin = user.role === 'admin' || user.role === 'manager';
  const branding = getBranding();

  const headers = useCallback(
    () => ({ Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }),
    [accessToken],
  );

  // ── Load report ────────────────────────────────────────
  const loadReport = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${api('reports')}/project/${request.id}`, { headers: headers() });
      if (!res.ok) throw new Error('Failed to load report');
      const data = await res.json();
      setReport(data.report);
      setSections(data.sections || []);
      setMedia(data.media || []);
    } catch (e) {
      console.error('[Report] load error:', e);
    } finally {
      setLoading(false);
    }
  }, [request.id, headers]);

  useEffect(() => { loadReport(); }, [loadReport]);

  // ── Resolve media URLs ─────────────────────────────────
  useEffect(() => {
    if (!media.length) { setMediaUrls({}); return; }
    const supabase = getSupabase();
    (async () => {
      const entries = await Promise.all(
        media.map(async (m) => {
          const { data } = await supabase.storage.from('report-media').createSignedUrl(m.file_path, 3600);
          return [m.id, data?.signedUrl] as const;
        }),
      );
      const next: Record<string, string> = {};
      for (const [id, url] of entries) if (url) next[id] = url;
      setMediaUrls(next);
    })();
  }, [media]);

  // ── Create report (with template selection) ──────────────
  const handleCreate = async (templateType: ReportTemplateType) => {
    setCreating(true);
    try {
      const res = await fetch(`${api('reports')}`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ projectId: request.id, templateType }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409 && data.reportId) {
          await loadReport();
          return;
        }
        throw new Error(data.error || 'Failed to create report');
      }
      setReport(data.report);
      setSections(data.sections || []);
      toast.success('Report created with prepopulated sections');
      onRefresh();
    } catch (e: any) {
      toast.error(e.message || 'Failed to create report');
    } finally {
      setCreating(false);
    }
  };

  // ── Save section ───────────────────────────────────────
  const saveSection = async (sectionId: string) => {
    if (!report) return;
    setSaving(sectionId);
    try {
      const res = await fetch(`${api('reports')}/${report.id}/sections/${sectionId}`, {
        method: 'PUT',
        headers: headers(),
        body: JSON.stringify({ title: editTitle, content: editContent }),
      });
      if (!res.ok) throw new Error('Failed to save');
      const data = await res.json();
      setSections((prev) => prev.map((s) => (s.id === sectionId ? data.section : s)));
      setEditingSection(null);
      toast.success('Section saved');
    } catch (e: any) {
      toast.error(e.message || 'Save failed');
    } finally {
      setSaving(null);
    }
  };

  // ── Toggle section visibility ──────────────────────────
  const toggleVisibility = async (section: Section) => {
    if (!report) return;
    try {
      const res = await fetch(`${api('reports')}/${report.id}/sections/${section.id}`, {
        method: 'PUT',
        headers: headers(),
        body: JSON.stringify({ is_visible: !section.is_visible }),
      });
      if (!res.ok) throw new Error('Failed to toggle');
      const data = await res.json();
      setSections((prev) => prev.map((s) => (s.id === section.id ? data.section : s)));
    } catch {
      toast.error('Failed to toggle visibility');
    }
  };

  // ── Move section ───────────────────────────────────────
  const moveSection = async (idx: number, dir: -1 | 1) => {
    if (!report) return;
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= sections.length) return;
    const reordered = [...sections];
    [reordered[idx], reordered[newIdx]] = [reordered[newIdx], reordered[idx]];
    const order = reordered.map((s, i) => ({ id: s.id, sort_order: i * 10 }));
    setSections(reordered);
    try {
      await fetch(`${api('reports')}/${report.id}/reorder`, {
        method: 'PUT',
        headers: headers(),
        body: JSON.stringify({ order }),
      });
    } catch {
      toast.error('Reorder failed');
    }
  };

  // ── Add custom section ─────────────────────────────────
  const addSection = async () => {
    if (!report) return;
    try {
      const maxOrder = sections.length ? Math.max(...sections.map((s) => s.sort_order)) : 0;
      const res = await fetch(`${api('reports')}/${report.id}/sections`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ title: 'New Section', content: '', sort_order: maxOrder + 10 }),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setSections((prev) => [...prev, data.section]);
      setEditingSection(data.section.id);
      setEditTitle(data.section.title);
      setEditContent(data.section.content);
      toast.success('Section added');
    } catch {
      toast.error('Failed to add section');
    }
  };

  // ── Delete section ─────────────────────────────────────
  const deleteSection = async (sectionId: string) => {
    if (!report || !confirm('Delete this section? This cannot be undone.')) return;
    try {
      await fetch(`${api('reports')}/${report.id}/sections/${sectionId}`, {
        method: 'DELETE',
        headers: headers(),
      });
      setSections((prev) => prev.filter((s) => s.id !== sectionId));
      if (editingSection === sectionId) setEditingSection(null);
      toast.success('Section deleted');
    } catch {
      toast.error('Delete failed');
    }
  };

  // ── Upload media ───────────────────────────────────────
  const handleMediaUpload = async (sectionId: string, e: ChangeEvent<HTMLInputElement>) => {
    if (!report || !e.target.files?.length) return;
    const file = e.target.files[0];
    if (file.size > 25 * 1024 * 1024) { toast.error('File too large (max 25 MB)'); return; }
    setUploadingSectionId(sectionId);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('sectionId', sectionId);
      const res = await fetch(`${api('reports')}/${report.id}/media`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: fd,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setMedia((prev) => [...prev, data.media]);
      toast.success('Image uploaded');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploadingSectionId(null);
      e.target.value = '';
    }
  };

  // ── Delete media ───────────────────────────────────────
  const handleDeleteMedia = async (mediaId: string) => {
    if (!report || !confirm('Remove this image?')) return;
    try {
      await fetch(`${api('reports')}/${report.id}/media/${mediaId}`, {
        method: 'DELETE',
        headers: headers(),
      });
      setMedia((prev) => prev.filter((m) => m.id !== mediaId));
      toast.success('Image removed');
    } catch {
      toast.error('Failed to remove');
    }
  };

  // ── Import media from project gallery ──────────────────
  const handleImportProjectMedia = async (sectionId: string, pm: ProjectMediaItem) => {
    if (!report) return;
    setImportingMediaId(pm.id);
    try {
      const res = await fetch(`${api('reports')}/${report.id}/media/from-project`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          sectionId,
          filePath: pm.file_path,
          fileName: pm.file_name,
          contentType: pm.content_type || 'application/octet-stream',
          caption: pm.file_name.replace(/\.[^/.]+$/, ''),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Import failed');
      const data = await res.json();
      setMedia((prev) => [...prev, data.media]);
      setImportedIds((prev) => new Set(prev).add(pm.id));
      toast.success(`Imported "${pm.file_name}"`);
    } catch (err: any) {
      toast.error(err.message || 'Import failed');
    } finally {
      setImportingMediaId(null);
    }
  };

  // ── Issue to client ────────────────────────────────────
  const handleIssue = async () => {
    if (!report) return;
    if (!confirm('Issue this report to the client? They will receive an email and can view/download the report.')) return;
    setIssuing(true);
    try {
      const res = await fetch(`${api('reports')}/${report.id}/issue`, {
        method: 'POST',
        headers: headers(),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      const data = await res.json();
      setReport(data.report);
      toast.success('Report issued to client');
      onRefresh();
    } catch (e: any) {
      toast.error(e.message || 'Failed to issue');
    } finally {
      setIssuing(false);
    }
  };

  // ── Generate PDF ───────────────────────────────────────
  const generatePdf = async () => {
    if (!report) return;
    setPdfGenerating(true);
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentW = pageW - margin * 2;
      let y = 0;

      const addPageIfNeeded = (needed: number) => {
        if (y + needed > pageH - 25) {
          doc.addPage();
          y = margin;
        }
      };

      // ── Cover Page ────────────────────────────────────
      doc.setFillColor(226, 88, 42);
      doc.rect(0, 0, pageW, 80, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.text(branding.companyName || 'Webian Contracting', pageW / 2, 35, { align: 'center' });
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Geophysics & Geotechnical Solutions', pageW / 2, 48, { align: 'center' });

      doc.setFontSize(11);
      doc.text(report.report_number || '', pageW / 2, 62, { align: 'center' });

      doc.setTextColor(51, 51, 51);
      y = 100;
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      const titleLines = doc.splitTextToSize(report.title || 'Report', contentW);
      doc.text(titleLines, pageW / 2, y, { align: 'center' });
      y += titleLines.length * 10 + 15;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      const metaLines = [
        `Client: ${request.clientName || request.client_name || ''}`,
        `Project: ${request.projectName || request.project_name || ''}`,
        `Location: ${request.venue || request.project_address || request.project_location || ''}`,
        `Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
      ];
      for (const line of metaLines) {
        doc.text(line, pageW / 2, y, { align: 'center' });
        y += 7;
      }

      // ── Sections ──────────────────────────────────────
      const visibleSections = sections.filter((s) => s.is_visible);
      for (const section of visibleSections) {
        doc.addPage();
        y = margin;

        // Section title
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(226, 88, 42);
        const secTitleLines = doc.splitTextToSize(section.title, contentW);
        doc.text(secTitleLines, margin, y);
        y += secTitleLines.length * 7 + 3;

        // Divider
        doc.setDrawColor(226, 88, 42);
        doc.setLineWidth(0.5);
        doc.line(margin, y, margin + contentW, y);
        y += 8;

        // Content
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 51, 51);
        const contentLines = doc.splitTextToSize(section.content || '', contentW);
        for (const line of contentLines) {
          addPageIfNeeded(6);
          doc.text(line, margin, y);
          y += 5.5;
        }

        // Section images
        const sectionMedia = media.filter((m) => m.section_id === section.id);
        for (const m of sectionMedia) {
          const url = mediaUrls[m.id];
          if (!url || !m.content_type?.startsWith('image/')) continue;
          try {
            const img = await loadImage(url);
            const imgW = Math.min(contentW, 140);
            const imgH = (img.height / img.width) * imgW;
            addPageIfNeeded(imgH + 15);
            y += 5;
            doc.addImage(img, 'JPEG', margin, y, imgW, imgH);
            y += imgH + 3;
            if (m.caption) {
              doc.setFontSize(9);
              doc.setTextColor(120, 120, 120);
              doc.text(m.caption, margin, y);
              y += 5;
            }
          } catch {
            // Skip broken images
          }
        }
      }

      // ── Footer on every page ──────────────────────────
      const pageCount = doc.internal.pages.length - 1;
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`${branding.companyName} — ${report.report_number || ''}`, margin, pageH - 10);
        doc.text(`Page ${i} of ${pageCount}`, pageW - margin, pageH - 10, { align: 'right' });
      }

      const fileName = `${report.report_number || 'report'}_${request.project_name || 'project'}.pdf`
        .replace(/[^a-zA-Z0-9_\-.]/g, '_');
      doc.save(fileName);
      toast.success('PDF downloaded');
    } catch (e) {
      console.error('[PDF]', e);
      toast.error('PDF generation failed');
    } finally {
      setPdfGenerating(false);
    }
  };

  // ── Helpers ────────────────────────────────────────────
  function loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }

  function getSectionMedia(sectionId: string) {
    return media.filter((m) => m.section_id === sectionId);
  }

  // ── Render: No report yet ──────────────────────────────
  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Loading report…</span>
        </CardContent>
      </Card>
    );
  }

  if (!report && isAdmin) {
    const templates: { key: ReportTemplateType; label: string; icon: typeof Layers; description: string; sections: string[] }[] = [
      {
        key: 'cavity',
        label: 'Cavity / Void Detection',
        icon: Layers,
        description: 'For subsurface void and cavity detection surveys using GPR or similar geophysical methods.',
        sections: ['Executive Summary', 'Introduction', 'Site Description', 'Methodology', 'Findings & Results', 'Analysis', 'Conclusions', 'Recommendations', 'Limitations', 'Appendices'],
      },
      {
        key: 'utility_anomaly',
        label: 'Utility Location & Anomaly',
        icon: Route,
        description: 'For utility location, mapping, and anomaly scanning to support safe excavation and construction.',
        sections: ['Executive Summary', 'Introduction', 'Site Description', 'Methodology', 'Utilities Mapped', 'Subsurface Anomalies', 'Conflict & Clearance', 'Conclusions', 'Recommendations', 'Limitations', 'Appendices'],
      },
    ];

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Create Project Report
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <p className="text-gray-600 text-sm leading-relaxed">
              Select the report template that matches this project. Each template comes with prepopulated sections tailored to the type of work.
            </p>
          </div>

          {/* ── Template Cards ──────────────────────────── */}
          <div className="grid sm:grid-cols-2 gap-4">
            {templates.map((t) => {
              const Icon = t.icon;
              const isSelected = selectedTemplate === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setSelectedTemplate(t.key)}
                  disabled={creating}
                  className={`relative flex flex-col items-start gap-3 p-5 rounded-xl border-2 transition-all text-left cursor-pointer group ${
                    isSelected
                      ? 'border-[#E2582A] bg-orange-50/60 shadow-md ring-1 ring-[#E2582A]/20'
                      : 'border-gray-200 hover:border-[#E2582A]/40 hover:bg-orange-50/30'
                  }`}
                >
                  {/* Selection indicator */}
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#E2582A] flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}

                  {/* Icon + Title */}
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isSelected
                        ? 'bg-[#E2582A] text-white'
                        : 'bg-gray-100 text-gray-500 group-hover:bg-[#E2582A]/10 group-hover:text-[#E2582A]'
                    } transition-colors`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-semibold text-gray-900">{t.label}</span>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-500 leading-relaxed">{t.description}</p>

                  {/* Section list preview */}
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {t.sections.map((s) => (
                      <span key={s} className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{s}</span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          {/* ── Create Button ──────────────────────────── */}
          <div className="flex items-center gap-3 pt-1">
            <Button
              onClick={() => selectedTemplate && handleCreate(selectedTemplate)}
              disabled={!selectedTemplate || creating}
              className="cursor-pointer bg-[#E2582A] hover:bg-[#c94d25] text-white"
            >
              {creating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Create Report
            </Button>
            {!selectedTemplate && (
              <span className="text-sm text-gray-400">Select a template above to continue</span>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!report) return null;

  // ── Render: Report exists ──────────────────────────────
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5" />
              {report.title}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge className={statusColors[report.status] || 'bg-gray-100'}>
                {statusLabels[report.status] || report.status}
              </Badge>
              {report.template_type && (
                <Badge variant="outline" className="text-xs font-normal text-gray-600">
                  {report.template_type === 'utility_anomaly' ? 'Utility & Anomaly' : 'Cavity / Void'}
                </Badge>
              )}
              <span className="text-xs text-gray-400">{report.report_number}</span>
              {report.issued_at && (
                <span className="text-xs text-gray-400">
                  Issued {new Date(report.issued_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPreviewMode(!previewMode)}
              className="cursor-pointer"
            >
              {previewMode ? <Edit3 className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
              {previewMode ? 'Edit' : 'Preview'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={generatePdf}
              disabled={pdfGenerating}
              className="cursor-pointer"
            >
              {pdfGenerating ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Download className="w-4 h-4 mr-1" />}
              PDF
            </Button>
            {isAdmin && report.status !== 'issued' && (
              <Button
                size="sm"
                onClick={handleIssue}
                disabled={issuing}
                className="cursor-pointer bg-emerald-600 hover:bg-emerald-700"
              >
                {issuing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
                Issue to Client
              </Button>
            )}
            {isAdmin && report.status === 'issued' && (
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  try {
                    const res = await fetch(`${api('reports')}/${report.id}`, {
                      method: 'PUT',
                      headers: headers(),
                      body: JSON.stringify({ status: 'amended' }),
                    });
                    if (!res.ok) throw new Error('Failed');
                    const data = await res.json();
                    setReport(data.report);
                    toast.success('Report set to amended — you can edit and re-issue');
                  } catch {
                    toast.error('Failed to amend');
                  }
                }}
                className="cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Amend
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* ── Sections ──────────────────────────────────── */}
        {sections.map((section, idx) => {
          const sectionMediaItems = getSectionMedia(section.id);
          const isEditing = editingSection === section.id;
          const canEdit = isAdmin && !previewMode && !['issued'].includes(report.status);

          // Preview mode or client view
          if (previewMode || !isAdmin) {
            if (!section.is_visible) return null;
            return (
              <div key={section.id} className="border-b border-gray-100 pb-4 last:border-0">
                <h3 className="text-base font-bold text-gray-800 mb-2">{section.title}</h3>
                <div className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{section.content}</div>
                {sectionMediaItems.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                    {sectionMediaItems.map((m) => (
                      <div key={m.id} className="relative group">
                        {m.content_type?.startsWith('image/') && mediaUrls[m.id] ? (
                          <img
                            src={mediaUrls[m.id]}
                            alt={m.caption || m.file_name}
                            className="w-full h-32 object-cover rounded-lg border"
                          />
                        ) : (
                          <div className="w-full h-32 bg-gray-100 rounded-lg border flex items-center justify-center text-xs text-gray-500">
                            {m.file_name}
                          </div>
                        )}
                        {m.caption && <p className="text-xs text-gray-500 mt-1">{m.caption}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          // Edit mode (admin)
          return (
            <div
              key={section.id}
              className={`rounded-lg border ${section.is_visible ? 'border-gray-200 bg-white' : 'border-dashed border-gray-300 bg-gray-50 opacity-60'} transition-all`}
            >
              {/* Section header */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
                <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full font-semibold text-sm border-b border-gray-300 focus:border-[#E2582A] outline-none pb-1 bg-transparent"
                    />
                  ) : (
                    <h4 className="font-semibold text-sm text-gray-800 truncate">{section.title}</h4>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {canEdit && (
                    <>
                      <button onClick={() => toggleVisibility(section)} className="p-1 hover:bg-gray-100 rounded cursor-pointer" title={section.is_visible ? 'Hide' : 'Show'}>
                        {section.is_visible ? <Eye className="w-3.5 h-3.5 text-gray-400" /> : <EyeOff className="w-3.5 h-3.5 text-gray-400" />}
                      </button>
                      <button onClick={() => moveSection(idx, -1)} disabled={idx === 0} className="p-1 hover:bg-gray-100 rounded disabled:opacity-30 cursor-pointer">
                        <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
                      </button>
                      <button onClick={() => moveSection(idx, 1)} disabled={idx === sections.length - 1} className="p-1 hover:bg-gray-100 rounded disabled:opacity-30 cursor-pointer">
                        <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                      </button>
                      {!isEditing && (
                        <button
                          onClick={() => { setEditingSection(section.id); setEditTitle(section.title); setEditContent(section.content); }}
                          className="p-1 hover:bg-gray-100 rounded cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                      )}
                      <button onClick={() => deleteSection(section.id)} className="p-1 hover:bg-red-50 rounded cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Section body */}
              <div className="px-4 py-3">
                {isEditing ? (
                  <div className="space-y-3">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={Math.max(6, editContent.split('\n').length + 2)}
                      className="text-sm font-mono leading-relaxed resize-y min-h-[120px]"
                      placeholder="Enter section content…"
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => saveSection(section.id)}
                        disabled={saving === section.id}
                        className="cursor-pointer"
                      >
                        {saving === section.id ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Save className="w-3 h-3 mr-1" />}
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingSection(null)}
                        className="cursor-pointer"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed line-clamp-6 cursor-text" onClick={() => {
                    if (canEdit) { setEditingSection(section.id); setEditTitle(section.title); setEditContent(section.content); }
                  }}>
                    {section.content || <span className="italic text-gray-400">Click to add content…</span>}
                  </div>
                )}

                {/* Section media */}
                {sectionMediaItems.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                    {sectionMediaItems.map((m) => (
                      <div key={m.id} className="relative group">
                        {m.content_type?.startsWith('image/') && mediaUrls[m.id] ? (
                          <img src={mediaUrls[m.id]} alt={m.caption || m.file_name} className="w-full h-28 object-cover rounded-lg border" />
                        ) : (
                          <div className="w-full h-28 bg-gray-100 rounded-lg border flex items-center justify-center text-xs text-gray-500">{m.file_name}</div>
                        )}
                        {canEdit && (
                          <button
                            onClick={() => handleDeleteMedia(m.id)}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                        {m.caption && <p className="text-xs text-gray-500 mt-1 truncate">{m.caption}</p>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload / import image buttons */}
                {canEdit && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-3">
                      <label className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-[#E2582A] cursor-pointer transition-colors">
                        {uploadingSectionId === section.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <ImagePlus className="w-3.5 h-3.5" />
                        )}
                        Upload local
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleMediaUpload(section.id, e)}
                          disabled={!!uploadingSectionId}
                        />
                      </label>
                      <button
                        onClick={() => setPickerSectionId(pickerSectionId === section.id ? null : section.id)}
                        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-[#E2582A] cursor-pointer transition-colors"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        Pick from project
                      </button>
                    </div>

                    {/* Project media picker panel */}
                    {pickerSectionId === section.id && (
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-600">Project Media Gallery</span>
                          <button
                            onClick={() => setPickerSectionId(null)}
                            className="p-0.5 rounded hover:bg-gray-200 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5 text-gray-400" />
                          </button>
                        </div>
                        {projectMedia.length > 0 ? (
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-52 overflow-y-auto">
                            {projectMedia.map((pm) => {
                              const isImage = (pm.content_type || '').toLowerCase().startsWith('image/');
                              const thumbUrl = projectMediaUrls[pm.id];
                              const alreadyImported = importedIds.has(pm.id);
                              const isImporting = importingMediaId === pm.id;

                              return (
                                <button
                                  key={pm.id}
                                  onClick={() => !alreadyImported && !isImporting && handleImportProjectMedia(section.id, pm)}
                                  disabled={alreadyImported || isImporting}
                                  className={`relative group aspect-square rounded-lg border overflow-hidden transition-all cursor-pointer
                                    ${alreadyImported
                                      ? 'border-green-300 bg-green-50 opacity-60 cursor-not-allowed'
                                      : 'border-gray-200 bg-white hover:border-[#E2582A] hover:shadow-sm'
                                    }`}
                                  title={alreadyImported ? 'Already added' : `Add "${pm.file_name}" to this section`}
                                >
                                  {isImage && thumbUrl ? (
                                    <img
                                      src={thumbUrl}
                                      alt={pm.file_name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center p-1 text-center">
                                      <ImageIcon className="w-5 h-5 text-gray-300 mb-1" />
                                      <span className="text-[10px] text-gray-400 line-clamp-2 break-all">{pm.file_name}</span>
                                    </div>
                                  )}
                                  {/* Overlay states */}
                                  {isImporting && (
                                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                                      <Loader2 className="w-5 h-5 animate-spin text-[#E2582A]" />
                                    </div>
                                  )}
                                  {alreadyImported && (
                                    <div className="absolute inset-0 bg-green-50/70 flex items-center justify-center">
                                      <Check className="w-5 h-5 text-green-600" />
                                    </div>
                                  )}
                                  {!alreadyImported && !isImporting && (
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-all">
                                      <Plus className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-6 text-center">
                            <FolderOpen className="w-8 h-8 text-gray-300 mb-2" />
                            <p className="text-xs text-gray-500 font-medium">No project media uploaded yet</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">Upload files in the <span className="font-medium">Media</span> tab first, then pick them here.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Add section button */}
        {isAdmin && !previewMode && !['issued'].includes(report.status) && (
          <Button variant="outline" onClick={addSection} className="w-full border-dashed cursor-pointer">
            <Plus className="w-4 h-4 mr-2" />
            Add Section
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
