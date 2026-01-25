import { useState, useEffect } from 'react';
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

export default function AdminDashboard({ user, serverUrl, accessToken, onLogout, onNavigate }: AdminDashboardProps) {
  const [requests, setRequests] = useState<any[]>([]);
  const [pendingTalents, setPendingTalents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  // If viewing request details, show RequestDetailsPage
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

  useEffect(() => {
    fetchRequests();
    fetchPendingTalents();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await fetch(`${serverUrl}/requests`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

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
      const response = await fetch(`${serverUrl}/admin/talent/pending`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

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
      const response = await fetch(`${serverUrl}/requests/${requestId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status }),
      });

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
      const response = await fetch(`${serverUrl}/admin/talent/${talentId}/review`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status, tier: status === 'approved' ? tier : null }),
      });

      if (response.ok) {
        toast.success(`Talent ${status}!`);
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
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('home')}>
                <div className="w-10 h-10 bg-[#755f52] rounded-xl flex items-center justify-center">
                  <Camera className="w-6 h-6 text-[#c9a882]" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-[#755f52]">EventCoverageJamaica</h1>
                </div>
              </div>
              <Badge className="bg-[#755f52] text-[#c9a882] border-0">
                {user.role === 'admin' ? 'Admin' : 'Manager'} Portal
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-[#755f52]">Hi, {user.name}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onLogout}
                className="text-[#755f52] hover:text-[#8b7263] hover:bg-[#f5f1eb]"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Card */}
        <Card className="mb-8 bg-gradient-to-r from-[#755f52] to-[#8b7263] text-white border-0 shadow-xl overflow-hidden">
          <CardContent className="p-8">
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <Shield className="w-8 h-8 text-[#B0DD16]" />
                  <h2 className="text-3xl font-bold">Admin Dashboard</h2>
                </div>
                <p className="text-[#e8dfd1] text-lg">
                  Manage services, approve talent, and coordinate event coverage across Jamaica
                </p>
              </div>
              <div className="hidden md:block">
                <div className="w-20 h-20 bg-[#c9a882] bg-opacity-20 rounded-2xl flex items-center justify-center">
                  <Settings className="w-12 h-12 text-[#c9a882]" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="approvals">Approvals {user.role === 'manager' && '(Manager)'}</TabsTrigger>
            <TabsTrigger value="talent">Talent Pool</TabsTrigger>
            <TabsTrigger value="requests">Requests</TabsTrigger>
            <TabsTrigger value="vetting">Vetting</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-[#755f52] to-[#8b7263] text-white">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  All Requests
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
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
                      <div key={request.id} className="border-2 border-gray-200 rounded-xl p-5 hover:shadow-xl hover:border-[#B0DD16] transition-all duration-300 bg-white">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-bold text-lg text-[#755f52]">{request.eventName}</h3>
                              <Badge className={getStatusColor(request.status)}>
                                {formatStatus(request.status)}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 font-medium">
                              {new Date(request.eventDate).toLocaleDateString()} • {request.parish}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Client ID: {request.clientId}
                            </p>
                          </div>
                          
                          <div className="flex flex-col gap-2">
                            <Select 
                              value={request.status}
                              onValueChange={(value) => updateRequestStatus(request.id, value)}
                            >
                              <SelectTrigger className="w-48 border-2 border-gray-200 focus:border-[#B0DD16]">
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

                        <div className="flex gap-2 mb-3">
                          {request.services?.photo && (
                            <span className="text-xs bg-[#755f52] bg-opacity-10 text-[#755f52] px-3 py-1.5 rounded-full font-semibold">Photography</span>
                          )}
                          {request.services?.video && (
                            <span className="text-xs bg-[#c9a882] bg-opacity-20 text-[#755f52] px-3 py-1.5 rounded-full font-semibold">Videography</span>
                          )}
                          {request.services?.audio && (
                            <span className="text-xs bg-[#B0DD16] bg-opacity-20 text-[#B0DD16] px-3 py-1.5 rounded-full font-semibold">Audio</span>
                          )}
                        </div>

                        {request.notes && (
                          <p className="text-sm text-gray-700 mt-3 bg-[#f5f1eb] p-3 rounded-lg border-l-4 border-[#B0DD16]">
                            <span className="font-bold text-[#755f52]">Notes:</span> {request.notes}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
                          <span>Created: {new Date(request.createdAt).toLocaleString()}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedRequest(request)}
                            className="text-[#B0DD16] hover:text-[#9ac514] hover:bg-[#B0DD16]/10"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details & Activity Log
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
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-[#755f52] to-[#8b7263] text-white">
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  All Client Requests
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
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
                      <div key={request.id} className="border-2 border-gray-200 rounded-xl p-5 hover:shadow-xl hover:border-[#B0DD16] transition-all duration-300 bg-white">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-bold text-lg text-[#755f52]">{request.eventName}</h3>
                              <Badge className={getStatusColor(request.status)}>
                                {formatStatus(request.status)}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 font-medium">
                              {new Date(request.eventDate).toLocaleDateString()} • {request.parish}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Client ID: {request.clientId}
                            </p>
                          </div>
                          
                          <div className="flex flex-col gap-2">
                            <Select 
                              value={request.status}
                              onValueChange={(value) => updateRequestStatus(request.id, value)}
                            >
                              <SelectTrigger className="w-48 border-2 border-gray-200 focus:border-[#B0DD16]">
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

                        <div className="flex gap-2 mb-3">
                          {request.services?.photo && (
                            <span className="text-xs bg-[#755f52] bg-opacity-10 text-[#755f52] px-3 py-1.5 rounded-full font-semibold">Photography</span>
                          )}
                          {request.services?.video && (
                            <span className="text-xs bg-[#c9a882] bg-opacity-20 text-[#755f52] px-3 py-1.5 rounded-full font-semibold">Videography</span>
                          )}
                          {request.services?.audio && (
                            <span className="text-xs bg-[#B0DD16] bg-opacity-20 text-[#B0DD16] px-3 py-1.5 rounded-full font-semibold">Audio</span>
                          )}
                        </div>

                        {request.notes && (
                          <p className="text-sm text-gray-700 mt-3 bg-[#f5f1eb] p-3 rounded-lg border-l-4 border-[#B0DD16]">
                            <span className="font-bold text-[#755f52]">Notes:</span> {request.notes}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
                          <span>Created: {new Date(request.createdAt).toLocaleString()}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedRequest(request)}
                            className="text-[#B0DD16] hover:text-[#9ac514] hover:bg-[#B0DD16]/10"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details & Activity Log
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
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-[#755f52] to-[#8b7263] text-white">
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Talent Applications Pending Review
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
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
                      <div key={talent.id} className="border-2 border-gray-200 rounded-xl p-6 bg-white hover:shadow-xl hover:border-[#B0DD16] transition-all duration-300">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-bold text-xl text-[#755f52] mb-1">Application #{talent.userId}</h3>
                            <p className="text-sm text-gray-500">
                              Submitted: {new Date(talent.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge className="bg-[#c9a882] bg-opacity-20 text-[#755f52] border-0">
                            Pending Review
                          </Badge>
                        </div>

                        <div className="space-y-4 bg-[#f5f1eb] bg-opacity-50 p-4 rounded-lg">
                          <div>
                            <h4 className="text-sm font-bold text-[#755f52] mb-2 flex items-center gap-2">
                              <Camera className="w-4 h-4" />
                              Services Offered
                            </h4>
                            <div className="flex gap-2">
                              {talent.skills?.map((skill: string) => (
                                <Badge key={skill} className="bg-[#B0DD16] text-white border-0">
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
                                    className="text-sm text-[#B0DD16] hover:text-[#9ac514] hover:underline block font-medium flex items-center gap-2"
                                  >
                                    <Award className="w-4 h-4" />
                                    {link}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-3 mt-6 pt-6 border-t-2 border-gray-200">
                          <div className="flex-1">
                            <Label className="text-sm font-bold text-[#755f52] mb-2 block">Tier (if approving)</Label>
                            <Select defaultValue="certified">
                              <SelectTrigger id={`tier-${talent.userId}`} className="border-2 border-gray-200 focus:border-[#B0DD16]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="certified">✓ Certified</SelectItem>
                                <SelectItem value="premium">⭐ Premium</SelectItem>
                                <SelectItem value="elite">👑 Elite</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex gap-3 items-end">
                            <Button
                              className="bg-[#B0DD16] hover:bg-[#9ac514] text-white shadow-lg"
                              onClick={() => {
                                const tierSelect = document.getElementById(`tier-${talent.userId}`) as any;
                                const tier = tierSelect?.getAttribute('data-value') || 'certified';
                                reviewTalent(talent.userId, 'approved', tier);
                              }}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              className="border-2 border-gray-300 hover:bg-red-50 hover:border-red-300 hover:text-red-600"
                              onClick={() => reviewTalent(talent.userId, 'rejected')}
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Reject
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