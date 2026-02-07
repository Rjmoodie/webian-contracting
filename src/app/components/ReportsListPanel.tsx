import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { FileText, Loader2, Search, Download, Eye } from 'lucide-react';
import { api } from '/utils/supabase/api';

interface Report {
  id: string;
  project_id: string;
  report_number: string;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
  issued_at: string | null;
  projects?: {
    id: string;
    project_name: string;
    client_name: string;
    project_code: string;
    status: string;
  };
}

interface ReportsListPanelProps {
  accessToken: string;
  onSelectRequest: (projectId: string) => void;
  isClient?: boolean;
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

export default function ReportsListPanel({ accessToken, onSelectRequest, isClient }: ReportsListPanelProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${api('reports')}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch (e) {
      console.error('[Reports] load error:', e);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => { loadReports(); }, [loadReports]);

  const filtered = reports.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.title?.toLowerCase().includes(q) ||
      r.report_number?.toLowerCase().includes(q) ||
      r.projects?.project_name?.toLowerCase().includes(q) ||
      r.projects?.client_name?.toLowerCase().includes(q) ||
      r.projects?.project_code?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Loading reports…</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border-0 shadow-[0_8px_30px_rgba(117,95,82,0.12)] bg-white">
        <div className="relative bg-gradient-to-r from-secondary via-secondary/90 to-secondary p-6 sm:p-7">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 20px)'}}></div>
          </div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30 shadow-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="typography-section-title text-white mb-1">
                  {isClient ? 'My Reports' : 'Reports'}
                </h3>
                <p className="text-sm text-white/80">{reports.length} report{reports.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6 md:p-7">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by project, client, or report number…"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-[#E2582A] focus:ring-1 focus:ring-[#E2582A] outline-none transition-colors cursor-text"
            />
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="typography-card-title-lg mb-2">
                {search ? 'No matching reports' : 'No reports yet'}
              </h3>
              <p className="text-gray-500">
                {search ? 'Try adjusting your search.' : isClient ? 'Reports will appear here when issued by the team.' : 'Create a report from any project\'s detail page.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((r) => (
                <div
                  key={r.id}
                  className="group flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-[#E2582A]/30 hover:shadow-md transition-all cursor-pointer bg-white"
                  onClick={() => onSelectRequest(r.project_id)}
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#E2582A]/10 to-[#E2582A]/5 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-[#E2582A]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="typography-label truncate">{r.title}</h4>
                      <Badge className={`text-[10px] px-1.5 py-0 ${statusColors[r.status] || 'bg-gray-100'}`}>
                        {statusLabels[r.status] || r.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{r.report_number}</span>
                      {r.projects?.project_name && (
                        <span className="truncate">{r.projects.project_name}</span>
                      )}
                      {r.projects?.client_name && (
                        <span className="truncate text-gray-400">{r.projects.client_name}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {r.issued_at && (
                      <span className="text-xs text-gray-400">
                        Issued {new Date(r.issued_at).toLocaleDateString()}
                      </span>
                    )}
                    <Eye className="w-4 h-4 text-gray-300 group-hover:text-[#E2582A] transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
