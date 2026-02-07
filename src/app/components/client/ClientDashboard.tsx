import React, { useState, useEffect } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Plus, FileText, Eye, FileCheck, Clock, CheckCircle2, Package } from 'lucide-react';
import { toast } from 'sonner';
import { getSupabase, getFreshToken } from '/utils/supabase/client';
import { api } from '/utils/supabase/api';
import Navigation from '../Navigation';
import CreateRequestWizard from './CreateRequestWizard';
import RequestDetailsPage from '@/app/components/RequestDetailsPage';
import ReportsListPanel from '@/app/components/ReportsListPanel';

interface ClientDashboardProps {
  user: any;
  accessToken: string;
  onLogout: () => void;
  onNavigate: (page: string) => void;
}

export default function ClientDashboard({ user, accessToken, onLogout, onNavigate }: ClientDashboardProps) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [currentToken, setCurrentToken] = useState<string>(accessToken);
  const [backendAvailable, setBackendAvailable] = useState(true);
  const [authErrorReason, setAuthErrorReason] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  // Open create wizard when arriving from "Get a quote" (services, etc.)
  useEffect(() => {
    try {
      if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('openCreateWizard') === '1') {
        sessionStorage.removeItem('openCreateWizard');
        setShowCreateWizard(true);
      }
    } catch (_) {}
  }, []);

  // Helper: make authenticated request — single attempt + one refresh, no cascading retries
  const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}) => {
    // Always get the freshest token available
    let token = await getFreshToken() || currentToken || accessToken;

    if (!token || !token.trim()) {
      console.warn('[ClientDashboard] No access token available — try logging in again.');
      setBackendAvailable(false);
      return null;
    }

    // Update state with the fresh token
    if (token !== currentToken) setCurrentToken(token);

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
      console.warn('[ClientDashboard] Backend returned 401:', reason, '— Try logging out and back in, or ensure your user has a profile with role "client".');
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
        // Authentication failed, user will be logged out
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
      // Set empty array on error so UI doesn't break
      setRequests([]);
    } finally {
      setLoading(false);
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

  if (showCreateWizard) {
    return (
      <CreateRequestWizard
        accessToken={accessToken}
        onClose={() => {
          setShowCreateWizard(false);
          fetchRequests();
        }}
        onNavigate={onNavigate}
      />
    );
  }

  if (selectedRequest) {
    return (
      <RequestDetailsPage
        requestId={selectedRequest.id}
        user={user}
        accessToken={accessToken}
        onBack={() => {
          setSelectedRequest(null);
          fetchRequests();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f1eb]">
      {/* Header - Using Golden Navbar Contract */}
      <Navigation
        user={user}
        onNavigate={onNavigate}
        onLogout={onLogout}
        variant="dashboard"
        portalLabel="Client Portal"
        showBrowseServices={true}
        showNavLinks={false}
      />
      {/* Spacer for fixed header (taller on dashboard for larger logo) */}
      <div className="h-16" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Backend connectivity warning */}
        {!backendAvailable && (
          <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex flex-col gap-2">
            <div className="flex items-start gap-3">
              <span className="shrink-0 text-lg">&#9888;</span>
              <div>
                <strong>Backend unavailable</strong> — {authErrorReason ?? 'The server returned an error.'}
                <br />
                <span className="text-amber-700">
                  Try logging out and back in. If the problem continues, run <strong>scripts/backfill-missing-profiles.sql</strong> in Supabase SQL Editor to create missing profiles.
                </span>
                <button onClick={() => { setBackendAvailable(true); setAuthErrorReason(null); fetchRequests(); }} className="ml-2 mt-1 inline-block underline font-semibold">Retry</button>
              </div>
            </div>
          </div>
        )}
        {/* Welcome + primary CTA */}
        <Card className="mb-6 sm:mb-8 bg-secondary text-secondary-foreground shadow-lg border-0 rounded-xl overflow-hidden">
          <CardContent className="p-5 sm:p-6 md:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="typography-page-title-hero mb-1 sm:mb-2 truncate text-white">Welcome back, {user.name}</h1>
                <p className="typography-body-sm text-white/90">Manage project requests and track your surveys</p>
              </div>
              <Button 
                size="lg" 
                onClick={() => setShowCreateWizard(true)}
                className="inline-flex items-center justify-center gap-2 bg-white text-secondary hover:bg-white/95 font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all shrink-0 min-h-[48px] sm:min-h-[52px] px-5 sm:px-8 w-full sm:w-auto rounded-xl"
              >
                <Plus className="w-5 h-5 shrink-0" />
                New request
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Card className="card-premium hover:shadow-lg transition-all hover:border-primary/30 border border-transparent">
            <CardContent className="p-4 sm:p-5 flex flex-row items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="typography-stat">{requests.length}</div>
                <div className="typography-caption">Total</div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-premium hover:shadow-premium-lg transition-all hover:border-amber-300 border border-transparent">
            <CardContent className="p-4 sm:p-5 flex flex-row items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-amber-700" />
              </div>
              <div className="min-w-0">
                <div className="typography-stat text-amber-700">
                  {requests.filter(r => r.status === 'rfq_submitted' || r.status === 'under_review' || r.status === 'quoted').length}
                </div>
                <div className="typography-caption">Pending</div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-premium hover:shadow-premium-lg transition-all hover:border-green-300 border border-transparent">
            <CardContent className="p-4 sm:p-5 flex flex-row items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-green-700" />
              </div>
              <div className="min-w-0">
                <div className="typography-stat text-green-700">
                  {requests.filter(r => ['quote_accepted','in_progress','data_processing','reporting'].includes(r.status)).length}
                </div>
                <div className="typography-caption">Active</div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-premium hover:shadow-premium-lg transition-all hover:border-gray-300 border border-transparent">
            <CardContent className="p-4 sm:p-5 flex flex-row items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                <Package className="w-5 h-5 text-gray-600" />
              </div>
              <div className="min-w-0">
                <div className="typography-stat text-gray-700">
                  {requests.filter(r => r.status === 'delivered' || r.status === 'completed').length}
                </div>
                <div className="typography-caption">Completed</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Requests Section */}
        <Card className="card-premium">
          <CardHeader className="pb-4">
            <CardTitle className="typography-section-title">Your Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={`skeleton-${i}`} className="rounded-xl border border-gray-200 bg-white p-5 animate-pulse">
                    <div className="h-5 bg-gray-200 rounded w-2/3 mb-3" />
                    <div className="h-4 bg-gray-100 rounded w-1/2 mb-4" />
                    <div className="flex gap-2 mb-4">
                      <div className="h-6 bg-gray-100 rounded-full w-20" />
                      <div className="h-6 bg-gray-100 rounded-full w-24" />
                    </div>
                    <div className="h-4 bg-gray-100 rounded w-1/3" />
                  </div>
                ))}
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-14 sm:py-16 px-4">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-primary/15 border-2 border-primary/30 mb-6">
                  <FileText className="w-12 h-12 text-primary" />
                </div>
                <h3 className="typography-card-title-lg mb-2">No requests yet</h3>
                <p className="typography-body-sm-muted mb-8 max-w-sm mx-auto">Submit a Request for Quote for your geophysical survey or utility scan project.</p>
                <Button 
                  onClick={() => setShowCreateWizard(true)}
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold shadow-md hover:opacity-90 hover:scale-105 transition-all min-h-[48px] px-6 sm:px-8 whitespace-nowrap"
                >
                  <Plus className="w-5 h-5 shrink-0" />
                  Create your first request
                </Button>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {requests.map((request) => (
                  <button
                    key={request.id}
                    type="button"
                    onClick={() => setSelectedRequest(request)}
                    className="w-full text-left card-premium border border-border rounded-xl p-4 sm:p-5 hover:shadow-lg hover:border-primary/40 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-start gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="typography-card-title mb-1 truncate">{request.eventName || request.project_name}</h3>
                        <p className="typography-body-sm-muted">
                          {request.parish || request.project_location}
                          {request.project_code && ` • ${request.project_code}`}
                        </p>
                      </div>
                      <Badge className={`${getStatusColor(request.status)} shrink-0 font-medium px-3 py-1`}>
                        {formatStatus(request.status)}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {request.serviceType && (
                        <Badge variant="outline" className="text-xs bg-[#E2582A]/10 text-[#E2582A] border-[#E2582A]/30 px-2.5 py-0.5">
                          {request.serviceType}
                        </Badge>
                      )}
                      {request.survey_area_sqm && (
                        <Badge variant="outline" className="text-xs bg-gray-50 text-gray-700 border-gray-200 px-2.5 py-0.5">
                          {parseFloat(request.survey_area_sqm).toLocaleString()} sq m
                        </Badge>
                      )}
                      {request.total_cost_jmd && (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 px-2.5 py-0.5">
                          JMD {parseFloat(request.total_cost_jmd).toLocaleString()}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <span className="typography-caption">
                        Submitted {new Date(request.created_at || request.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                        <Eye className="w-4 h-4" />
                        View details
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        {/* Reports Section */}
        <div className="mt-6 sm:mt-8">
          <ReportsListPanel
            accessToken={currentToken || accessToken}
            onSelectRequest={(projectId: string) => {
              const match = requests.find((r: any) => r.id === projectId);
              if (match) setSelectedRequest(match);
            }}
            isClient={true}
          />
        </div>
      </div>
    </div>
  );
}