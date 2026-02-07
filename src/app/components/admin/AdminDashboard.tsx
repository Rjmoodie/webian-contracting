import React, { useState, useEffect, useRef } from 'react';
import { getSupabase, getFreshToken } from '/utils/supabase/client';
import { api } from '/utils/supabase/api';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Label } from '@/app/components/ui/label';
import { LogOut, FileText, Users, Briefcase, Settings, CheckCircle, CheckCircle2, XCircle, UserPlus, Camera, Shield, Award, Eye, LayoutDashboard, Image, ImagePlus } from 'lucide-react';
import { toast } from 'sonner';
import Navigation from '@/app/components/Navigation';
import ServiceManagement from './ServiceManagement';
import ApprovalQueue from './ApprovalQueue';
import TalentManagement from './TalentManagement';
import UserManagement from './UserManagement';
import PortfolioManagement from './PortfolioManagement';
import PastWorkManagement from './PastWorkManagement';
import RequestDetailsPage from '@/app/components/RequestDetailsPage';
import ReportsListPanel from '@/app/components/ReportsListPanel';

interface AdminDashboardProps {
  user: any;
  accessToken: string;
  onLogout: () => void;
  onNavigate: (page: string) => void;
}

export default function AdminDashboard({ user, accessToken, onLogout, onNavigate }: AdminDashboardProps) {
  const [requests, setRequests] = useState<any[]>([]);
  const [pendingTalents, setPendingTalents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [talentTiers, setTalentTiers] = useState<Record<string, string>>({});
  const [currentToken, setCurrentToken] = useState<string>(accessToken);
  const [backendAvailable, setBackendAvailable] = useState(true);
  const [authErrorReason, setAuthErrorReason] = useState<string | null>(null);

  // Keep a ref so closures always read the latest token
  const tokenRef = useRef<string>(accessToken);
  useEffect(() => { tokenRef.current = currentToken || accessToken; }, [currentToken, accessToken]);

  useEffect(() => {
    fetchRequests();
    fetchPendingTalents();
  }, []);

  // Helper: make authenticated request — single attempt, no cascading retries
  const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}) => {
    // Always get the freshest token available
    let token = await getFreshToken() || tokenRef.current;

    if (!token || !token.trim()) {
      console.warn('[AdminDashboard] No access token available — try logging in again.');
      setBackendAvailable(false);
      return null;
    }

    // Update ref + state
    if (token !== tokenRef.current) {
      tokenRef.current = token;
      setCurrentToken(token);
    }

    const response = await fetch(url, {
      ...options,
      headers: { ...options.headers, 'Authorization': `Bearer ${token}` },
    });

    if (response.status === 401) {
      let reason = 'Unauthorized';
      try {
        const body = await response.clone().json().catch(() => ({}));
        reason = (body as { reason?: string })?.reason ?? (body as { error?: string })?.error ?? reason;
      } catch (_) {}
      console.warn('[AdminDashboard] Backend returned 401:', reason);
      setAuthErrorReason(reason);
      setBackendAvailable(false);
      return null;
    }

    setBackendAvailable(true);
    setAuthErrorReason(null);
    return response;
  };

  const fetchRequests = async () => {
    try {
      const response = await makeAuthenticatedRequest(`${api('projects')}`);

      if (!response) {
        setRequests([]);
        setLoading(false);
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
      } else {
        console.error('Failed to fetch requests:', response.status, response.statusText);
        setRequests([]);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingTalents = async () => {
    try {
      const response = await makeAuthenticatedRequest(`${api('admin')}/talent/pending`);

      if (!response) {
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setPendingTalents(data.talents || []);
      }
    } catch (error) {
      console.error('Error fetching pending talents:', error);
    }
  };

  const updateRequestStatus = async (requestId: string, status: string) => {
    try {
      const response = await makeAuthenticatedRequest(`${api('projects')}/${requestId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response) {
        return;
      }

      if (response.ok) {
        toast.success('Request status updated');
        fetchRequests();
      } else {
        toast.error('Failed to update request');
      }
    } catch (error) {
      console.error('Error updating request:', error);
      toast.error('Failed to update request');
    }
  };

  const reviewTalent = async (talentId: string, status: 'approved' | 'rejected', tier?: string) => {
    try {
      const selectedTier = tier || talentTiers[talentId] || 'certified';
      const response = await makeAuthenticatedRequest(`${api('admin')}/talent/${talentId}/review`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, tier: status === 'approved' ? selectedTier : null }),
      });

      if (!response) {
        return;
      }

      if (response.ok) {
        toast.success(`Talent ${status}!`);
        // Remove from tiers state
        const newTiers = { ...talentTiers };
        delete newTiers[talentId];
        setTalentTiers(newTiers);
        fetchPendingTalents();
      } else {
        toast.error('Failed to review talent');
      }
    } catch (error) {
      console.error('Error reviewing talent:', error);
      toast.error('Failed to review talent');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      rfq_submitted: 'bg-blue-100 text-blue-800',
      under_review: 'bg-yellow-100 text-yellow-800',
      quoted: 'bg-purple-100 text-purple-800',
      quote_accepted: 'bg-green-100 text-green-800',
      quote_rejected: 'bg-red-100 text-red-800',
      in_progress: 'bg-indigo-100 text-indigo-800',
      data_processing: 'bg-cyan-100 text-cyan-800',
      reporting: 'bg-teal-100 text-teal-800',
      delivered: 'bg-emerald-100 text-emerald-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  // If viewing request details, show RequestDetailsPage
  if (selectedRequest) {
    return (
      <RequestDetailsPage
        requestId={selectedRequest.id}
        user={user}
        accessToken={currentToken || accessToken}
        onBack={() => {
          setSelectedRequest(null);
          fetchRequests();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted via-muted/80 to-background">
      {/* Header */}
      <Navigation
        user={user}
        onNavigate={onNavigate}
        onLogout={onLogout}
        variant="dashboard"
        portalLabel={`${user.role === 'admin' ? 'Admin' : 'Manager'} Portal`}
        showBrowseServices={false}
        showNavLinks={false}
      />
      {/* Spacer for fixed header (taller on dashboard for larger logo) */}
      <div className="h-16" />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Backend connectivity warning */}
        {!backendAvailable && (
          <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex flex-col gap-2">
            <div className="flex items-start gap-3">
              <span className="shrink-0 text-lg">&#9888;</span>
              <div>
                <strong>Backend unavailable</strong> — {authErrorReason ?? 'The server returned an error.'}
                <br />
                <span className="text-amber-700">
                  If you see &quot;Profile not found&quot; or &quot;Unauthorized&quot;, ensure your user has a profile with role <strong>admin</strong> or <strong>manager</strong> (e.g. run <code className="bg-amber-100 px-1 rounded">scripts/set-admin-role.sql</code> in Supabase SQL Editor). Otherwise try logging out and back in.
                </span>
                <button onClick={() => { setBackendAvailable(true); setAuthErrorReason(null); fetchRequests(); fetchPendingTalents(); }} className="ml-2 mt-1 inline-block underline font-semibold">Retry</button>
              </div>
            </div>
          </div>
        )}
        {/* Welcome Card - Enhanced Mobile */}
        <div className="mb-4 sm:mb-6 md:mb-8 relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-secondary via-secondary/90 to-secondary shadow-lg-xl border-0">
          {/* Decorative background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-32 h-32 sm:w-64 sm:h-64 bg-primary rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 sm:w-48 sm:h-48 bg-primary rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative p-4 sm:p-6 md:p-8 lg:p-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6">
              <div className="flex-1 w-full">
                <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div className="relative">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-primary to-[primary] rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg-lg transform hover:scale-105 transition-transform">
                      <Shield className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-white rounded-full flex items-center justify-center shadow-lg">
                      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-primary rounded-full"></div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
<h2 className="typography-page-title-hero text-white mb-1 break-words">
                    Admin Dashboard
                    </h2>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                      <span className="typography-caption text-white">Active Control Center</span>
                    </div>
                  </div>
                </div>
                <p className="text-white typography-body-sm sm:text-base leading-relaxed max-w-2xl">
                  Manage projects, generate quotes, and track geophysical survey operations
                </p>
              </div>
              <div className="hidden lg:block shrink-0">
                <div className="w-20 h-20 lg:w-24 lg:h-24 bg-white/10 backdrop-blur-sm rounded-2xl lg:rounded-3xl flex items-center justify-center shadow-lg-lg border border-white/20 transform hover:scale-105 transition-transform">
                  <Settings className="w-10 h-10 lg:w-12 lg:h-12 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs - Grid Layout (Desktop) / Scroll (Mobile) */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="mb-4 sm:mb-6 md:mb-8">
            <div className="relative w-full">
              {/* Scroll hint gradient for mobile */}
              <div className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-muted to-transparent z-10 md:hidden" />
              <TabsList
                className="
                  bg-white/80
                  backdrop-blur-sm
                  border border-gray-200/60
                  shadow-sm
                "
              >
                {[
                  { value: 'overview', label: 'Overview', icon: LayoutDashboard },
                  { value: 'requests', label: 'Projects', short: 'Projects', icon: FileText },
                  { value: 'reports', label: 'Reports', short: 'Reports', icon: FileText },
                  { value: 'pastwork', label: 'Past work', short: 'Past work', icon: ImagePlus },
                  { value: 'services', label: 'Service Types', short: 'Services', icon: Briefcase },
                  { value: 'users', label: 'Users', icon: UserPlus },
                ].map((t) => {
                  const Icon = t.icon;
                  return (
                    <TabsTrigger
                      key={t.value}
                      value={t.value}
                      className="inline-flex items-center gap-2 text-secondary hover:bg-[secondary]/10 data-[state=active]:bg-gradient-to-r data-[state=active]:from-secondary data-[state=active]:to-secondary/90 data-[state=active]:text-white data-[state=active]:shadow-lg"
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="hidden sm:inline">{t.value === 'approvals' && user.role === 'manager' ? (t.managerLabel || t.label) : t.label}</span>
                      <span className="sm:hidden">{t.short ?? t.label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <p className="text-sm text-gray-600">At a glance — projects, quotes, and items needing action.</p>
            {/* Stats Cards - Ultra Premium */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-muted to-white border border-border shadow-[0_4px_20px_rgba(117,95,82,0.08)] hover:shadow-[0_8px_30px_rgba(117,95,82,0.15)] transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative p-6 sm:p-7">
                  <div className="flex items-center justify-between mb-4">
                    <div className="relative">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-secondary via-secondary/90 to-secondary rounded-xl sm:rounded-2xl flex items-center justify-center shadow-[0_4px_12px_rgba(117,95,82,0.3)] transform group-hover:scale-110 transition-transform">
                        <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-primary rounded-full border-2 border-white shadow-lg"></div>
                    </div>
                    <div className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-primary/20 to-[primary]/20 rounded-full border border-primary/30">
                      <span className="text-base sm:text-lg font-bold text-secondary">{requests.length}</span>
                    </div>
                  </div>
                  <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-secondary to-secondary/90 bg-clip-text text-transparent mb-1 sm:mb-2">Total Requests</h3>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">All client requests</p>
                </div>
              </div>
              
              <div className="group relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-white via-green-50/30 to-white border border-green-200/50 shadow-[0_4px_20px_rgba(176,221,22,0.08)] hover:shadow-[0_8px_30px_rgba(176,221,22,0.15)] transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 active:scale-[0.98]">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative p-4 sm:p-5 md:p-6 lg:p-7">
                  <div className="flex items-center justify-between mb-4">
                    <div className="relative">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-primary via-primary to-primary rounded-xl sm:rounded-2xl flex items-center justify-center shadow-[0_4px_12px_rgba(176,221,22,0.3)] transform group-hover:scale-110 transition-transform">
                        <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full border-2 border-white shadow-lg"></div>
                    </div>
                    <div className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full border border-green-300">
                      <span className="text-base sm:text-lg font-bold text-green-700">
                        {requests.filter((r: any) => ['in_progress','data_processing','reporting','quote_accepted'].includes(r.status)).length}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-1 sm:mb-2">Active</h3>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">In progress projects</p>
                </div>
              </div>
              
              <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-amber-50/30 to-white border border-amber-200/50 shadow-[0_4px_20px_rgba(201,168,130,0.08)] hover:shadow-[0_8px_30px_rgba(201,168,130,0.15)] transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative p-6 sm:p-7">
                  <div className="flex items-center justify-between mb-4">
                    <div className="relative">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-primary via-primary/80 to-primary rounded-xl sm:rounded-2xl flex items-center justify-center shadow-[0_4px_12px_rgba(201,168,130,0.3)] transform group-hover:scale-110 transition-transform">
                        <Users className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-amber-500 rounded-full border-2 border-white shadow-lg"></div>
                    </div>
                    <div className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-amber-100 to-yellow-100 rounded-full border border-amber-300">
                      <span className="text-base sm:text-lg font-bold text-amber-700">
                        {requests.filter((r: any) => r.status === 'quoted').length}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent mb-1 sm:mb-2">Quoted</h3>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Awaiting client response</p>
                </div>
              </div>
              
              <div className="group relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-white via-blue-50/30 to-white border border-blue-200/50 shadow-[0_4px_20px_rgba(59,130,246,0.08)] hover:shadow-[0_8px_30px_rgba(59,130,246,0.15)] transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 active:scale-[0.98]">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative p-4 sm:p-5 md:p-6 lg:p-7">
                  <div className="flex items-center justify-between mb-4">
                    <div className="relative">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-[0_4px_12px_rgba(59,130,246,0.3)] transform group-hover:scale-110 transition-transform">
                        <Briefcase className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>
                    </div>
                    <div className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-full border border-blue-300">
                      <span className="text-base sm:text-lg font-bold text-blue-700">
                        {requests.filter((r: any) => r.status === 'rfq_submitted' || r.status === 'under_review').length}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-1 sm:mb-2">New RFQs</h3>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Awaiting quote</p>
                </div>
              </div>
            </div>

            {/* All Requests Card - Ultra Premium */}
            <div className="relative overflow-hidden rounded-2xl border-0 shadow-[0_8px_30px_rgba(117,95,82,0.12)] bg-white">
              <div className="relative bg-gradient-to-r from-secondary via-secondary/90 to-secondary p-6 sm:p-7">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0" style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 20px)'}}></div>
                </div>
                <div className="relative flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30 shadow-lg">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="typography-section-title text-white mb-1">All Requests</h3>
                    <p className="text-sm text-white/80">Complete request overview</p>
                  </div>
                </div>
              </div>
              <div className="p-5 sm:p-6 md:p-7 bg-gradient-to-br from-white to-[muted]">
                {loading ? (
                  <div className="flex justify-center py-16">
                    <div className="relative">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-[muted] border-t-primary"></div>
                    </div>
                  </div>
                ) : requests.length === 0 ? (
                  <div className="text-center py-20 bg-gradient-to-br from-muted to-muted/80 rounded-2xl border-2 border-dashed border-secondary/20">
                    <div className="w-24 h-24 bg-gradient-to-br from-secondary/10 to-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <FileText className="w-12 h-12 text-secondary" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-secondary mb-3">No Requests Yet</h3>
                    <p className="text-gray-600 max-w-md mx-auto">Client requests will appear here once submitted. Check back soon!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {requests.map((request) => (
                      <div key={request.id} className="card-premium border-2 border-gray-200 rounded-xl p-3 sm:p-4 md:p-5 hover:border-primary transition-all duration-300 bg-white">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-start gap-4 sm:gap-4 mb-4">
                          <div className="flex-1 w-full sm:w-auto min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                              <h3 className="font-bold text-base sm:text-lg text-secondary break-words">{request.eventName}</h3>
                              <Badge className={`${getStatusColor(request.status)} shrink-0`}>
                                {formatStatus(request.status)}
                              </Badge>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600 font-medium">
                              {new Date(request.eventDate).toLocaleDateString()} • {request.parish}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Client ID: {request.clientId}
                            </p>
                          </div>
                          
                          <div className="flex flex-col gap-2 w-full sm:w-auto shrink-0 min-w-[140px]">
                            <Select 
                              value={request.status}
                              onValueChange={(value) => updateRequestStatus(request.id, value)}
                            >
                              <SelectTrigger className="w-full sm:w-48 border-2 border-gray-200 focus:border-primary rounded-xl h-10 min-h-0 sm:min-h-0">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="rfq_submitted">RFQ Submitted</SelectItem>
                                <SelectItem value="under_review">Under Review</SelectItem>
                                <SelectItem value="quoted">Quoted</SelectItem>
                                <SelectItem value="quote_accepted">Quote Accepted</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="data_processing">Data Processing</SelectItem>
                                <SelectItem value="reporting">Reporting</SelectItem>
                                <SelectItem value="delivered">Delivered</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-4">
                          {request.serviceType && (
                            <span className="text-xs sm:text-sm bg-primary text-primary-foreground px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-semibold whitespace-nowrap shadow-sm">
                              {request.serviceType}
                            </span>
                          )}
                          {request.survey_area_sqm && (
                            <span className="text-xs sm:text-sm bg-gray-100 text-gray-800 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-semibold whitespace-nowrap">
                              {parseFloat(request.survey_area_sqm).toLocaleString()} sq m
                            </span>
                          )}
                          {request.project_code && (
                            <span className="text-xs sm:text-sm bg-gray-800 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-semibold whitespace-nowrap">
                              {request.project_code}
                            </span>
                          )}
                          {request.total_cost_jmd && (
                            <span className="text-xs sm:text-sm bg-green-100 text-green-800 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-semibold whitespace-nowrap">
                              JMD {parseFloat(request.total_cost_jmd).toLocaleString()}
                            </span>
                          )}
                        </div>

                        {request.client_notes && (
                          <div className="mt-4 bg-gray-50 p-4 rounded-xl border-l-4 border-[primary] shadow-sm">
                            <p className="text-xs sm:text-sm text-gray-700">
                              <span className="font-bold text-gray-900">Notes:</span> {request.client_notes}
                            </p>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 text-xs text-gray-500 mt-4 pt-4 border-t border-gray-200">
                          <span className="whitespace-nowrap shrink-0">Created: {new Date(request.created_at || request.createdAt).toLocaleString()}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedRequest(request)}
                            className="h-9 sm:h-9 min-h-0 sm:min-h-0 px-3 sm:px-4 text-[primary] hover:text-[primary] hover:bg-[primary]/10 w-full sm:w-auto whitespace-nowrap shrink-0"
                          >
                            <Eye className="w-4 h-4 sm:mr-2 shrink-0" />
                            <span className="hidden sm:inline">View Details & Activity Log</span>
                            <span className="sm:hidden">View Details</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Services Tab – lazy rendered */}
          <TabsContent value="services">
            {activeTab === 'services' && (
              <ServiceManagement
                accessToken={currentToken || accessToken}
                userRole={user.role}
              />
            )}
          </TabsContent>

          {/* Approvals Tab – lazy rendered */}
          <TabsContent value="approvals">
            {activeTab === 'approvals' && (
              <ApprovalQueue
                accessToken={currentToken || accessToken}
              />
            )}
          </TabsContent>

          {/* Talent Tab – lazy rendered */}
          <TabsContent value="talent">
            {activeTab === 'talent' && (
              <TalentManagement
                accessToken={currentToken || accessToken}
              />
            )}
          </TabsContent>

          {/* Requests Tab */}
          <TabsContent value="requests">
            <div className="relative overflow-hidden rounded-2xl border-0 shadow-[0_8px_30px_rgba(117,95,82,0.12)] bg-white">
              <div className="relative bg-gradient-to-r from-secondary via-secondary/90 to-secondary p-6 sm:p-7">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0" style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 20px)'}}></div>
                </div>
                <div className="relative flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30 shadow-lg">
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="typography-section-title text-white mb-1">All Client Requests</h3>
                    <p className="text-sm text-white/80">Complete request management</p>
                  </div>
                </div>
              </div>
              <div className="p-5 sm:p-6 md:p-7 bg-gradient-to-br from-white to-[muted]">
                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : requests.length === 0 ? (
                  <div className="text-center py-16 bg-gradient-to-br from-muted to-muted/80 rounded-xl">
                    <div className="w-20 h-20 bg-[secondary] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Briefcase className="w-10 h-10 text-secondary" />
                    </div>
                    <h3 className="text-lg font-semibold text-secondary mb-2">No Requests Yet</h3>
                    <p className="text-gray-600">Client requests will appear here once submitted</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {requests.map((request) => (
                      <div key={request.id} className="card-premium border-2 border-gray-200 rounded-xl p-3 sm:p-4 md:p-5 hover:border-[primary]/50 transition-all duration-300 bg-white">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-start gap-4 sm:gap-4 mb-4">
                          <div className="flex-1 w-full sm:w-auto min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                              <h3 className="font-bold text-base sm:text-lg text-gray-900 break-words">{request.eventName || request.project_name}</h3>
                              <Badge className={`${getStatusColor(request.status)} shrink-0`}>
                                {formatStatus(request.status)}
                              </Badge>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600 font-medium">
                              {request.parish || request.project_location} {request.project_code && `• ${request.project_code}`}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Client: {request.clientName || request.client_name}
                            </p>
                          </div>
                          
                          <div className="flex flex-col gap-2 w-full sm:w-auto shrink-0 min-w-[140px]">
                            <Select 
                              value={request.status}
                              onValueChange={(value) => updateRequestStatus(request.id, value)}
                            >
                              <SelectTrigger className="w-full sm:w-48 border-2 border-gray-200 focus:border-[primary] rounded-xl h-10 min-h-0 sm:min-h-0">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="rfq_submitted">RFQ Submitted</SelectItem>
                                <SelectItem value="under_review">Under Review</SelectItem>
                                <SelectItem value="quoted">Quoted</SelectItem>
                                <SelectItem value="quote_accepted">Quote Accepted</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="data_processing">Data Processing</SelectItem>
                                <SelectItem value="reporting">Reporting</SelectItem>
                                <SelectItem value="delivered">Delivered</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-4">
                          {request.serviceType && (
                            <span className="text-xs sm:text-sm bg-primary text-primary-foreground px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-semibold whitespace-nowrap shadow-sm">
                              {request.serviceType}
                            </span>
                          )}
                          {request.survey_area_sqm && (
                            <span className="text-xs sm:text-sm bg-gray-100 text-gray-800 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-semibold whitespace-nowrap">
                              {parseFloat(request.survey_area_sqm).toLocaleString()} sq m
                            </span>
                          )}
                          {request.total_cost_jmd && (
                            <span className="text-xs sm:text-sm bg-green-100 text-green-800 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-semibold whitespace-nowrap">
                              JMD {parseFloat(request.total_cost_jmd).toLocaleString()}
                            </span>
                          )}
                        </div>

                        {request.client_notes && (
                          <div className="mt-4 bg-gray-50 p-4 rounded-xl border-l-4 border-[primary] shadow-sm">
                            <p className="text-xs sm:text-sm text-gray-700">
                              <span className="font-bold text-gray-900">Notes:</span> {request.client_notes}
                            </p>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 text-xs text-gray-500 mt-4 pt-4 border-t border-gray-200">
                          <span className="whitespace-nowrap shrink-0">Created: {new Date(request.created_at || request.createdAt).toLocaleString()}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedRequest(request)}
                            className="h-9 sm:h-9 min-h-0 sm:min-h-0 px-3 sm:px-4 text-[primary] hover:text-[primary] hover:bg-[primary]/10 w-full sm:w-auto whitespace-nowrap shrink-0"
                          >
                            <Eye className="w-4 h-4 sm:mr-2 shrink-0" />
                            <span className="hidden sm:inline">View Details & Activity Log</span>
                            <span className="sm:hidden">View Details</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <ReportsListPanel accessToken={currentToken || accessToken} onSelectRequest={(id: string) => { setSelectedRequest({ id }); }} />
          </TabsContent>

          {/* Pending Talent Tab */}
          <TabsContent value="vetting">
            <div className="relative overflow-hidden rounded-2xl border-0 shadow-[0_8px_30px_rgba(117,95,82,0.12)] bg-white">
              <div className="relative bg-gradient-to-r from-secondary via-secondary/90 to-secondary p-6 sm:p-7">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0" style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 20px)'}}></div>
                </div>
                <div className="relative flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30 shadow-lg">
                    <UserPlus className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="typography-section-title text-white mb-1">Talent Applications</h3>
                    <p className="text-sm text-white/80">Pending review queue</p>
                  </div>
                </div>
              </div>
              <div className="p-5 sm:p-6 md:p-7 bg-gradient-to-br from-white to-[muted]">
                {pendingTalents.length === 0 ? (
                  <div className="text-center py-16 bg-gradient-to-br from-muted to-muted/80 rounded-xl">
                    <div className="w-20 h-20 bg-[secondary] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <UserPlus className="w-10 h-10 text-secondary" />
                    </div>
                    <h3 className="typography-card-title-lg mb-2">No Pending Applications</h3>
                    <p className="text-gray-600">Talent applications will appear here for review</p>
                  </div>
                ) : (
                  <div className="space-y-4 sm:space-y-6">
                    {pendingTalents.map((talent) => (
                      <div key={talent.id} className="card-premium border-2 border-gray-200 rounded-xl p-3 sm:p-4 md:p-5 lg:p-6 bg-white hover:border-primary transition-all duration-300 hover-lift active:scale-[0.99]">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-start mb-3 sm:mb-4 gap-3">
                          <div className="flex-1">
                            <h3 className="font-bold text-lg sm:text-xl text-secondary mb-1 tracking-tight">Application #{talent.userId}</h3>
                            <p className="text-xs sm:text-sm text-gray-500">
                              Submitted: {new Date(talent.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge className="bg-primary bg-opacity-20 text-secondary border-0">
                            Pending Review
                          </Badge>
                        </div>

                        <div className="space-y-3 sm:space-y-4 bg-[muted] bg-opacity-50 p-3 sm:p-4 rounded-lg">
                          <div>
                            <h4 className="text-sm font-bold text-secondary mb-2 flex items-center gap-2">
                              <Camera className="w-4 h-4" />
                              Services Offered
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {talent.skills?.map((skill: string) => (
                                <Badge key={skill} className="bg-primary text-white border-0 shadow-lg">
                                  {skill === 'photo' ? 'Photography' : skill === 'video' ? 'Videography' : 'Audio'}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {talent.experience && (
                            <div>
                              <h4 className="text-sm font-bold text-secondary mb-2">Experience</h4>
                              <p className="text-sm text-gray-700 bg-white p-3 rounded-lg">{talent.experience}</p>
                            </div>
                          )}

                          {talent.bio && (
                            <div>
                              <h4 className="text-sm font-bold text-secondary mb-2">Bio</h4>
                              <p className="text-sm text-gray-700 bg-white p-3 rounded-lg">{talent.bio}</p>
                            </div>
                          )}

                          {talent.coverageParishes && talent.coverageParishes.length > 0 && (
                            <div>
                              <h4 className="text-sm font-bold text-secondary mb-2">Coverage Areas</h4>
                              <div className="flex flex-wrap gap-2">
                                {talent.coverageParishes.map((parish: string) => (
                                  <span key={parish} className="text-xs bg-[secondary] bg-opacity-10 text-secondary px-3 py-1.5 rounded-full font-semibold">
                                    {parish}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {talent.portfolioLinks && talent.portfolioLinks.length > 0 && (
                            <div>
                              <h4 className="text-sm font-bold text-secondary mb-2">Portfolio Links</h4>
                              <div className="space-y-2 bg-white p-3 rounded-lg">
                                {talent.portfolioLinks.map((link: string) => (
                                  <a 
                                    key={link} 
                                    href={link} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs sm:text-sm text-primary hover:text-[primary] hover:underline block font-medium flex items-center gap-2 break-all"
                                  >
                                    <Award className="w-4 h-4 flex-shrink-0" />
                                    <span className="truncate">{link}</span>
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t-2 border-gray-200">
                          <div className="flex-1 w-full sm:w-auto min-w-0">
                            <Label className="text-xs sm:text-sm font-bold text-secondary mb-2 block">Tier (if approving)</Label>
                            <Select 
                              value={talentTiers[talent.userId] || 'certified'}
                              onValueChange={(value) => setTalentTiers({ ...talentTiers, [talent.userId]: value })}
                            >
                              <SelectTrigger className="w-full sm:w-auto min-w-[140px] border-2 border-gray-200 focus:border-primary rounded-xl h-10 min-h-0">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="certified">✓ Certified</SelectItem>
                                <SelectItem value="premium">⭐ Premium</SelectItem>
                                <SelectItem value="elite">👑 Elite</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-3 sm:gap-3 items-stretch sm:items-center w-full sm:w-auto shrink-0">
                            <Button
                              className="button-glow flex-1 sm:flex-none h-10 min-h-0 sm:min-h-0 px-4 sm:px-5 bg-primary text-white shadow-lg hover:shadow-lg-lg hover:scale-105 transition-all whitespace-nowrap shrink-0"
                              onClick={() => reviewTalent(talent.userId, 'approved')}
                            >
                              <CheckCircle2 className="w-4 h-4 sm:mr-2 shrink-0" />
                              <span className="hidden sm:inline">Approve</span>
                              <span className="sm:hidden">✓ Approve</span>
                            </Button>
                            <Button
                              variant="outline"
                              className="flex-1 sm:flex-none h-10 min-h-0 sm:min-h-0 px-4 sm:px-5 border-2 border-gray-300 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all whitespace-nowrap shrink-0"
                              onClick={() => reviewTalent(talent.userId, 'rejected')}
                            >
                              <XCircle className="w-4 h-4 sm:mr-2 shrink-0" />
                              <span className="hidden sm:inline">Reject</span>
                              <span className="sm:hidden">✗ Reject</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Users Tab – lazy rendered */}
          <TabsContent value="users">
            {activeTab === 'users' && (
              <UserManagement
                accessToken={currentToken || accessToken}
                currentUser={user}
              />
            )}
          </TabsContent>

          {/* Past work Tab – add past projects with photos for Portfolio */}
          <TabsContent value="pastwork">
            {activeTab === 'pastwork' && (
              <PastWorkManagement accessToken={currentToken || accessToken} />
            )}
          </TabsContent>

          {/* Portfolio Tab – lazy rendered */}
          <TabsContent value="portfolio">
            {activeTab === 'portfolio' && (
              <PortfolioManagement accessToken={currentToken || accessToken} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}