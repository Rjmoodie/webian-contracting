import { useState, useEffect } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Label } from '@/app/components/ui/label';
import { LogOut, FileText, Users, Briefcase, Settings, CheckCircle, CheckCircle2, XCircle, UserPlus, Camera, Shield, Award, Eye } from 'lucide-react';
import { toast } from 'sonner';
import ServiceManagement from './ServiceManagement';
import ApprovalQueue from './ApprovalQueue';
import TalentManagement from './TalentManagement';
import UserManagement from './UserManagement';
import RequestDetailsPage from '@/app/components/RequestDetailsPage';

interface AdminDashboardProps {
  user: any;
  serverUrl: string;
  accessToken: string;
  onLogout: () => void;
  onNavigate: (page: string) => void;
}

// Use singleton Supabase client at module level to avoid multiple instances
let supabaseInstance: SupabaseClient | null = null;
const getSupabase = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      `https://${projectId}.supabase.co`,
      publicAnonKey
    );
  }
  return supabaseInstance;
};

export default function AdminDashboard({ user, serverUrl, accessToken, onLogout, onNavigate }: AdminDashboardProps) {
  const [requests, setRequests] = useState<any[]>([]);
  const [pendingTalents, setPendingTalents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [talentTiers, setTalentTiers] = useState<Record<string, string>>({});
  const [currentToken, setCurrentToken] = useState<string>(accessToken);

  // Helper function to get fresh token from Supabase
  const getFreshToken = async (): Promise<string | null> => {
    try {
      const supabase = getSupabase();
      const { data: { session }, error } = await supabase.auth.getSession();
      if (session?.access_token) {
        setCurrentToken(session.access_token);
        return session.access_token;
      }
      return null;
    } catch (error) {
      console.error('Error getting fresh token:', error);
      return null;
    }
  };

  // Helper function to make authenticated requests with token refresh
  const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}) => {
    let token = currentToken || accessToken;
    
    // If no token, try to get a fresh one
    if (!token) {
      token = await getFreshToken();
      if (!token) {
        console.error('No access token available');
        onLogout();
        return null;
      }
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
      },
    });

    // If 401, try refreshing token once
    if (response.status === 401) {
      const freshToken = await getFreshToken();
      if (freshToken && freshToken !== token) {
        // Retry with fresh token
        return await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${freshToken}`,
          },
        });
      } else {
        // Token refresh failed, logout
        console.error('Authentication failed. Please log in again.');
        toast.error('Session expired. Please log in again.');
        onLogout();
        return null;
      }
    }

    return response;
  };

  // If viewing request details, show RequestDetailsPage
  if (selectedRequest) {
    return (
      <RequestDetailsPage
        requestId={selectedRequest.id}
        user={user}
        serverUrl={serverUrl}
        accessToken={currentToken || accessToken}
        onBack={() => {
          setSelectedRequest(null);
          fetchRequests();
        }}
      />
    );
  }

  useEffect(() => {
    if (currentToken || accessToken) {
      fetchRequests();
      fetchPendingTalents();
    } else {
      // Try to get token on mount
      getFreshToken().then((token) => {
        if (token) {
          fetchRequests();
          fetchPendingTalents();
        } else {
          setLoading(false);
          toast.error('Please log in to continue');
          onLogout();
        }
      });
    }
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await makeAuthenticatedRequest(`${serverUrl}/requests`);

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
      const response = await makeAuthenticatedRequest(`${serverUrl}/admin/talent/pending`);

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
      const response = await makeAuthenticatedRequest(`${serverUrl}/requests/${requestId}/status`, {
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
      const response = await makeAuthenticatedRequest(`${serverUrl}/admin/talent/${talentId}/review`, {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f1eb] via-[#ebe4d8] to-[#e8dfd1]">
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
      {/* Spacer for fixed header */}
      <div className="h-16 sm:h-16" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Card */}
        <Card className="mb-6 sm:mb-8 gradient-premium text-white border-0 shadow-premium-xl overflow-hidden">
          <CardContent className="p-4 sm:p-6 md:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 gradient-premium-green rounded-xl flex items-center justify-center shadow-premium">
                    <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Admin Dashboard</h2>
                </div>
                <p className="text-[#e8dfd1] text-base sm:text-lg">
                  Manage services, approve talent, and coordinate event coverage across Jamaica
                </p>
              </div>
              <div className="hidden md:block">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#c9a882] bg-opacity-20 rounded-2xl flex items-center justify-center shadow-premium">
                  <Settings className="w-8 h-8 sm:w-12 sm:h-12 text-[#c9a882]" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 sm:mb-6 flex-wrap gap-2">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
            <TabsTrigger value="services" className="text-xs sm:text-sm">Services</TabsTrigger>
            <TabsTrigger value="approvals" className="text-xs sm:text-sm">
              Approvals {user.role === 'manager' && '(Manager)'}
            </TabsTrigger>
            <TabsTrigger value="talent" className="text-xs sm:text-sm">Talent Pool</TabsTrigger>
            <TabsTrigger value="requests" className="text-xs sm:text-sm">Requests</TabsTrigger>
            <TabsTrigger value="vetting" className="text-xs sm:text-sm">Vetting</TabsTrigger>
            <TabsTrigger value="users" className="text-xs sm:text-sm">Users</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <Card className="border-0 shadow-premium card-premium">
              <CardHeader className="gradient-premium text-white">
                <CardTitle className="flex items-center gap-2 tracking-tight">
                  <FileText className="w-5 h-5" />
                  All Requests
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 md:p-6">
                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B0DD16]"></div>
                  </div>
                ) : requests.length === 0 ? (
                  <div className="text-center py-16 bg-gradient-to-br from-[#f5f1eb] to-[#ebe4d8] rounded-xl">
                    <div className="w-20 h-20 bg-[#755f52] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-10 h-10 text-[#755f52]" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#755f52] mb-2">No Requests Yet</h3>
                    <p className="text-gray-600">Client requests will appear here once submitted</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {requests.map((request) => (
                      <div key={request.id} className="card-premium border-2 border-gray-200 rounded-xl p-3 sm:p-4 md:p-5 hover:border-[#B0DD16] transition-all duration-300 bg-white">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-start gap-3 sm:gap-0 mb-3">
                          <div className="flex-1 w-full sm:w-auto">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                              <h3 className="font-bold text-base sm:text-lg text-[#755f52] break-words">{request.eventName}</h3>
                              <Badge className={getStatusColor(request.status)}>
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
                          
                          <div className="flex flex-col gap-2 w-full sm:w-auto">
                            <Select 
                              value={request.status}
                              onValueChange={(value) => updateRequestStatus(request.id, value)}
                            >
                              <SelectTrigger className="w-full sm:w-48 border-2 border-gray-200 focus:border-[#B0DD16] rounded-xl min-h-[44px] sm:h-10">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="submitted">Submitted</SelectItem>
                                <SelectItem value="under_review">Under Review</SelectItem>
                                <SelectItem value="assigned">Assigned</SelectItem>
                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="delivered">Delivered</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-3">
                          {request.services?.photo && (
                            <span className="text-xs bg-[#755f52] bg-opacity-10 text-[#755f52] px-2 sm:px-3 py-1 sm:py-1.5 rounded-full font-semibold whitespace-nowrap">Photography</span>
                          )}
                          {request.services?.video && (
                            <span className="text-xs bg-[#c9a882] bg-opacity-20 text-[#755f52] px-2 sm:px-3 py-1 sm:py-1.5 rounded-full font-semibold whitespace-nowrap">Videography</span>
                          )}
                          {request.services?.audio && (
                            <span className="text-xs bg-[#B0DD16] bg-opacity-20 text-[#B0DD16] px-2 sm:px-3 py-1 sm:py-1.5 rounded-full font-semibold whitespace-nowrap">Audio</span>
                          )}
                        </div>

                        {request.notes && (
                          <p className="text-xs sm:text-sm text-gray-700 mt-3 bg-[#f5f1eb] p-2 sm:p-3 rounded-lg border-l-4 border-[#B0DD16]">
                            <span className="font-bold text-[#755f52]">Notes:</span> {request.notes}
                          </p>
                        )}

                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
                          <span className="whitespace-nowrap">Created: {new Date(request.createdAt).toLocaleString()}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedRequest(request)}
                            className="min-h-[44px] sm:h-8 text-[#B0DD16] hover:text-[#9ac514] hover:bg-[#B0DD16]/10 w-full sm:w-auto whitespace-nowrap"
                          >
                            <Eye className="w-4 h-4 sm:mr-2" />
                            <span className="hidden sm:inline">View Details & Activity Log</span>
                            <span className="sm:hidden">View Details</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services">
            <ServiceManagement
              serverUrl={serverUrl}
              accessToken={accessToken}
              userRole={user.role}
            />
          </TabsContent>

          {/* Approvals Tab */}
          <TabsContent value="approvals">
            <ApprovalQueue
              serverUrl={serverUrl}
              accessToken={accessToken}
            />
          </TabsContent>

          {/* Talent Tab */}
          <TabsContent value="talent">
            <TalentManagement
              serverUrl={serverUrl}
              accessToken={accessToken}
            />
          </TabsContent>

          {/* Requests Tab */}
          <TabsContent value="requests">
            <Card className="border-0 shadow-premium card-premium">
              <CardHeader className="gradient-premium text-white">
                <CardTitle className="flex items-center gap-2 tracking-tight">
                  <Briefcase className="w-5 h-5" />
                  All Client Requests
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 md:p-6">
                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B0DD16]"></div>
                  </div>
                ) : requests.length === 0 ? (
                  <div className="text-center py-16 bg-gradient-to-br from-[#f5f1eb] to-[#ebe4d8] rounded-xl">
                    <div className="w-20 h-20 bg-[#755f52] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Briefcase className="w-10 h-10 text-[#755f52]" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#755f52] mb-2">No Requests Yet</h3>
                    <p className="text-gray-600">Client requests will appear here once submitted</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {requests.map((request) => (
                      <div key={request.id} className="card-premium border-2 border-gray-200 rounded-xl p-3 sm:p-4 md:p-5 hover:border-[#B0DD16] transition-all duration-300 bg-white">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-start gap-3 sm:gap-0 mb-3">
                          <div className="flex-1 w-full sm:w-auto">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                              <h3 className="font-bold text-base sm:text-lg text-[#755f52] break-words">{request.eventName}</h3>
                              <Badge className={getStatusColor(request.status)}>
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
                          
                          <div className="flex flex-col gap-2 w-full sm:w-auto">
                            <Select 
                              value={request.status}
                              onValueChange={(value) => updateRequestStatus(request.id, value)}
                            >
                              <SelectTrigger className="w-full sm:w-48 border-2 border-gray-200 focus:border-[#B0DD16] rounded-xl min-h-[44px] sm:h-10">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="submitted">Submitted</SelectItem>
                                <SelectItem value="under_review">Under Review</SelectItem>
                                <SelectItem value="assigned">Assigned</SelectItem>
                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="delivered">Delivered</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-3">
                          {request.services?.photo && (
                            <span className="text-xs bg-[#755f52] bg-opacity-10 text-[#755f52] px-2 sm:px-3 py-1 sm:py-1.5 rounded-full font-semibold whitespace-nowrap">Photography</span>
                          )}
                          {request.services?.video && (
                            <span className="text-xs bg-[#c9a882] bg-opacity-20 text-[#755f52] px-2 sm:px-3 py-1 sm:py-1.5 rounded-full font-semibold whitespace-nowrap">Videography</span>
                          )}
                          {request.services?.audio && (
                            <span className="text-xs bg-[#B0DD16] bg-opacity-20 text-[#B0DD16] px-2 sm:px-3 py-1 sm:py-1.5 rounded-full font-semibold whitespace-nowrap">Audio</span>
                          )}
                        </div>

                        {request.notes && (
                          <p className="text-xs sm:text-sm text-gray-700 mt-3 bg-[#f5f1eb] p-2 sm:p-3 rounded-lg border-l-4 border-[#B0DD16]">
                            <span className="font-bold text-[#755f52]">Notes:</span> {request.notes}
                          </p>
                        )}

                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
                          <span className="whitespace-nowrap">Created: {new Date(request.createdAt).toLocaleString()}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedRequest(request)}
                            className="min-h-[44px] sm:h-8 text-[#B0DD16] hover:text-[#9ac514] hover:bg-[#B0DD16]/10 w-full sm:w-auto whitespace-nowrap"
                          >
                            <Eye className="w-4 h-4 sm:mr-2" />
                            <span className="hidden sm:inline">View Details & Activity Log</span>
                            <span className="sm:hidden">View Details</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pending Talent Tab */}
          <TabsContent value="vetting">
            <Card className="border-0 shadow-premium card-premium">
              <CardHeader className="gradient-premium text-white">
                <CardTitle className="flex items-center gap-2 tracking-tight">
                  <UserPlus className="w-5 h-5" />
                  Talent Applications Pending Review
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 md:p-6">
                {pendingTalents.length === 0 ? (
                  <div className="text-center py-16 bg-gradient-to-br from-[#f5f1eb] to-[#ebe4d8] rounded-xl">
                    <div className="w-20 h-20 bg-[#755f52] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <UserPlus className="w-10 h-10 text-[#755f52]" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#755f52] mb-2">No Pending Applications</h3>
                    <p className="text-gray-600">Talent applications will appear here for review</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {pendingTalents.map((talent) => (
                      <div key={talent.id} className="card-premium border-2 border-gray-200 rounded-xl p-3 sm:p-4 md:p-6 bg-white hover:border-[#B0DD16] transition-all duration-300 hover-lift">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-start mb-3 sm:mb-4 gap-3">
                          <div className="flex-1">
                            <h3 className="font-bold text-lg sm:text-xl text-[#755f52] mb-1 tracking-tight">Application #{talent.userId}</h3>
                            <p className="text-xs sm:text-sm text-gray-500">
                              Submitted: {new Date(talent.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge className="bg-[#c9a882] bg-opacity-20 text-[#755f52] border-0">
                            Pending Review
                          </Badge>
                        </div>

                        <div className="space-y-3 sm:space-y-4 bg-[#f5f1eb] bg-opacity-50 p-3 sm:p-4 rounded-lg">
                          <div>
                            <h4 className="text-sm font-bold text-[#755f52] mb-2 flex items-center gap-2">
                              <Camera className="w-4 h-4" />
                              Services Offered
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {talent.skills?.map((skill: string) => (
                                <Badge key={skill} className="gradient-premium-green text-white border-0 shadow-premium">
                                  {skill === 'photo' ? 'Photography' : skill === 'video' ? 'Videography' : 'Audio'}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {talent.experience && (
                            <div>
                              <h4 className="text-sm font-bold text-[#755f52] mb-2">Experience</h4>
                              <p className="text-sm text-gray-700 bg-white p-3 rounded-lg">{talent.experience}</p>
                            </div>
                          )}

                          {talent.bio && (
                            <div>
                              <h4 className="text-sm font-bold text-[#755f52] mb-2">Bio</h4>
                              <p className="text-sm text-gray-700 bg-white p-3 rounded-lg">{talent.bio}</p>
                            </div>
                          )}

                          {talent.coverageParishes && talent.coverageParishes.length > 0 && (
                            <div>
                              <h4 className="text-sm font-bold text-[#755f52] mb-2">Coverage Areas</h4>
                              <div className="flex flex-wrap gap-2">
                                {talent.coverageParishes.map((parish: string) => (
                                  <span key={parish} className="text-xs bg-[#755f52] bg-opacity-10 text-[#755f52] px-3 py-1.5 rounded-full font-semibold">
                                    {parish}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {talent.portfolioLinks && talent.portfolioLinks.length > 0 && (
                            <div>
                              <h4 className="text-sm font-bold text-[#755f52] mb-2">Portfolio Links</h4>
                              <div className="space-y-2 bg-white p-3 rounded-lg">
                                {talent.portfolioLinks.map((link: string, i: number) => (
                                  <a 
                                    key={i} 
                                    href={link} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs sm:text-sm text-[#B0DD16] hover:text-[#9ac514] hover:underline block font-medium flex items-center gap-2 break-all"
                                  >
                                    <Award className="w-4 h-4 flex-shrink-0" />
                                    <span className="truncate">{link}</span>
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t-2 border-gray-200">
                          <div className="flex-1 w-full sm:w-auto">
                            <Label className="text-xs sm:text-sm font-bold text-[#755f52] mb-2 block">Tier (if approving)</Label>
                            <Select 
                              value={talentTiers[talent.userId] || 'certified'}
                              onValueChange={(value) => setTalentTiers({ ...talentTiers, [talent.userId]: value })}
                            >
                              <SelectTrigger className="w-full sm:w-auto border-2 border-gray-200 focus:border-[#B0DD16] rounded-xl">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="certified">✓ Certified</SelectItem>
                                <SelectItem value="premium">⭐ Premium</SelectItem>
                                <SelectItem value="elite">👑 Elite</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-end w-full sm:w-auto">
                            <Button
                              className="button-glow flex-1 sm:flex-none min-h-[44px] sm:h-10 gradient-premium-green text-white shadow-premium hover:shadow-premium-lg hover:scale-105 transition-all whitespace-nowrap"
                              onClick={() => reviewTalent(talent.userId, 'approved')}
                            >
                              <CheckCircle2 className="w-4 h-4 sm:mr-2" />
                              <span className="hidden sm:inline">Approve</span>
                              <span className="sm:hidden">✓ Approve</span>
                            </Button>
                            <Button
                              variant="outline"
                              className="flex-1 sm:flex-none min-h-[44px] sm:h-10 border-2 border-gray-300 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all whitespace-nowrap"
                              onClick={() => reviewTalent(talent.userId, 'rejected')}
                            >
                              <XCircle className="w-4 h-4 sm:mr-2" />
                              <span className="hidden sm:inline">Reject</span>
                              <span className="sm:hidden">✗ Reject</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <UserManagement
              serverUrl={serverUrl}
              accessToken={accessToken}
              currentUser={user}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}