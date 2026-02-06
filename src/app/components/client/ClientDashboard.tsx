import React, { useState, useEffect } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Plus, FileText, Eye, FileCheck, Clock, CheckCircle2, Package } from 'lucide-react';
import { toast } from 'sonner';
import { getSupabase, getFreshToken } from '/utils/supabase/client';
import Navigation from '../Navigation';
import CreateRequestWizard from './CreateRequestWizard';
import RequestDetailsPage from '@/app/components/RequestDetailsPage';

interface ClientDashboardProps {
  user: any;
  serverUrl: string;
  accessToken: string;
  onLogout: () => void;
  onNavigate: (page: string) => void;
}

export default function ClientDashboard({ user, serverUrl, accessToken, onLogout, onNavigate }: ClientDashboardProps) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [currentToken, setCurrentToken] = useState<string>(accessToken);
  const [backendAvailable, setBackendAvailable] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  // Helper: make authenticated request — single attempt + one refresh, no cascading retries
  const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}) => {
    // Always get the freshest token available
    let token = await getFreshToken() || currentToken || accessToken;

    if (!token) {
      console.warn('[ClientDashboard] No access token available');
      return null;
    }

    // Update state with the fresh token
    if (token !== currentToken) setCurrentToken(token);

    const response = await fetch(url, {
      ...options,
      headers: { ...options.headers, 'Authorization': `Bearer ${token}` },
    });

    if (response.status === 401) {
      // Backend rejected the token — likely a backend config issue, not a session issue
      console.warn('[ClientDashboard] Backend returned 401. Edge function may need redeployment.');
      setBackendAvailable(false);
      return null;
    }

    // If we got here the backend is working
    setBackendAvailable(true);
    return response;
  };

  const fetchRequests = async () => {
    try {
      const response = await makeAuthenticatedRequest(`${serverUrl}/requests`);

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
      submitted: 'bg-blue-100 text-blue-800',
      under_review: 'bg-yellow-100 text-yellow-800',
      assigned: 'bg-purple-100 text-purple-800',
      confirmed: 'bg-green-100 text-green-800',
      in_progress: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-teal-100 text-teal-800',
      closed: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  if (showCreateWizard) {
    return (
      <CreateRequestWizard
        serverUrl={serverUrl}
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
        serverUrl={serverUrl}
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
          <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-center gap-3">
            <span className="shrink-0 text-lg">&#9888;</span>
            <span>
              <strong>Backend unavailable</strong> — The server is not responding to authenticated requests.
              Your data may not be up to date. The Edge Function may need to be redeployed.
              <button onClick={() => { setBackendAvailable(true); fetchRequests(); }} className="ml-2 underline font-semibold">Retry</button>
            </span>
          </div>
        )}
        {/* Welcome + primary CTA */}
        <Card className="mb-6 sm:mb-8 gradient-premium-green text-white shadow-premium-lg border-0 rounded-xl overflow-hidden">
          <CardContent className="p-5 sm:p-6 md:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2 truncate">Welcome back, {user.name}</h1>
                <p className="text-sm sm:text-base text-white/90">Manage requests and track your event coverage</p>
              </div>
              <Button 
                size="lg" 
                onClick={() => setShowCreateWizard(true)}
                className="inline-flex items-center justify-center gap-2 bg-white text-[#755f52] hover:bg-white/95 font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all shrink-0 min-h-[48px] sm:min-h-[52px] px-5 sm:px-8 w-full sm:w-auto rounded-xl"
              >
                <Plus className="w-5 h-5 shrink-0" />
                New request
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Card className="card-premium hover:shadow-premium-lg transition-all hover:border-[#BDFF1C]/30 border border-transparent">
            <CardContent className="p-4 sm:p-5 flex flex-row items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-[#BDFF1C]/20 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-[#755f52]" />
              </div>
              <div className="min-w-0">
                <div className="text-2xl sm:text-3xl font-bold text-[#755f52] tracking-tight">{requests.length}</div>
                <div className="text-xs sm:text-sm font-medium text-gray-600">Total</div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-premium hover:shadow-premium-lg transition-all hover:border-amber-300 border border-transparent">
            <CardContent className="p-4 sm:p-5 flex flex-row items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-amber-700" />
              </div>
              <div className="min-w-0">
                <div className="text-2xl sm:text-3xl font-bold text-amber-700 tracking-tight">
                  {requests.filter(r => r.status === 'submitted' || r.status === 'under_review').length}
                </div>
                <div className="text-xs sm:text-sm font-medium text-gray-600">Pending</div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-premium hover:shadow-premium-lg transition-all hover:border-green-300 border border-transparent">
            <CardContent className="p-4 sm:p-5 flex flex-row items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-green-700" />
              </div>
              <div className="min-w-0">
                <div className="text-2xl sm:text-3xl font-bold text-green-700 tracking-tight">
                  {requests.filter(r => r.status === 'confirmed' || r.status === 'in_progress').length}
                </div>
                <div className="text-xs sm:text-sm font-medium text-gray-600">Active</div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-premium hover:shadow-premium-lg transition-all hover:border-gray-300 border border-transparent">
            <CardContent className="p-4 sm:p-5 flex flex-row items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                <Package className="w-5 h-5 text-gray-600" />
              </div>
              <div className="min-w-0">
                <div className="text-2xl sm:text-3xl font-bold text-gray-700 tracking-tight">
                  {requests.filter(r => r.status === 'delivered' || r.status === 'closed').length}
                </div>
                <div className="text-xs sm:text-sm font-medium text-gray-600">Completed</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Requests Section */}
        <Card className="card-premium">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900">Your Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-xl border border-gray-200 bg-white p-5 animate-pulse">
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
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-[#BDFF1C]/15 border-2 border-[#BDFF1C]/30 mb-6">
                  <FileText className="w-12 h-12 text-[#755f52]" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">No requests yet</h3>
                <p className="text-gray-600 mb-8 max-w-sm mx-auto text-sm sm:text-base">Request photography, videography, or audio for your next event in one simple flow.</p>
                <Button 
                  onClick={() => setShowCreateWizard(true)}
                  className="inline-flex items-center gap-2 gradient-premium-green text-white font-semibold shadow-premium hover:shadow-premium-lg hover:scale-105 transition-all min-h-[48px] px-6 sm:px-8 whitespace-nowrap"
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
                    className="w-full text-left card-premium border border-gray-200 rounded-xl p-4 sm:p-5 hover:shadow-premium hover:border-[#BDFF1C]/40 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#BDFF1C]/50 focus:ring-offset-2"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-start gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg sm:text-xl text-gray-900 mb-1 truncate">{request.eventName}</h3>
                        <p className="text-sm text-gray-600">
                          {new Date(request.eventDate).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })} • {request.parish}
                        </p>
                      </div>
                      <Badge className={`${getStatusColor(request.status)} shrink-0 font-medium px-3 py-1`}>
                        {formatStatus(request.status)}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {request.services?.photo && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 px-2.5 py-0.5">
                          Photography
                        </Badge>
                      )}
                      {request.services?.video && (
                        <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200 px-2.5 py-0.5">
                          Videography
                        </Badge>
                      )}
                      {request.services?.audio && (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 px-2.5 py-0.5">
                          Audio
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <span className="text-xs sm:text-sm text-gray-500">
                        Submitted {new Date(request.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[#755f52]">
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
      </div>
    </div>
  );
}