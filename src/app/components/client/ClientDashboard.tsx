import { useState, useEffect } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Plus, FileText, LogOut, Eye } from 'lucide-react';
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

  useEffect(() => {
    fetchRequests();
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
      {/* Header */}
      <nav className="bg-white border-b border-[#755f5233]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-6">
              <h1 className="text-2xl font-bold text-[#B0DD16] cursor-pointer" onClick={() => onNavigate('home')}>
                EventCoverageJamaica
              </h1>
              <span className="text-gray-600">Client Portal</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-700">Hi, {user.name}</span>
              <Button variant="outline" size="sm" onClick={() => onNavigate('services')}>
                Browse Services
              </Button>
              <Button variant="ghost" size="sm" onClick={onLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Card */}
        <Card className="mb-8 bg-gradient-to-r from-[#B0DD16] to-[#9ac514] text-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold mb-2">Welcome back, {user.name}!</h2>
                <p className="opacity-90">Manage your event coverage requests and track deliverables</p>
              </div>
              <Button 
                size="lg" 
                variant="secondary"
                onClick={() => setShowCreateWizard(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Request
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-[#B0DD16]">{requests.length}</div>
              <div className="text-sm text-gray-600 mt-1">Total Requests</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-yellow-600">
                {requests.filter(r => r.status === 'submitted' || r.status === 'under_review').length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Pending</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-green-600">
                {requests.filter(r => r.status === 'confirmed' || r.status === 'in_progress').length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Active</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-gray-600">
                {requests.filter(r => r.status === 'delivered' || r.status === 'closed').length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Completed</div>
            </CardContent>
          </Card>
        </div>

        {/* Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Your Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No requests yet</h3>
                <p className="text-gray-600 mb-6">Create your first event coverage request to get started</p>
                <Button onClick={() => setShowCreateWizard(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Request
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">{request.eventName}</h3>
                        <p className="text-sm text-gray-600">
                          {new Date(request.eventDate).toLocaleDateString()} • {request.parish}
                        </p>
                      </div>
                      <Badge className={getStatusColor(request.status)}>
                        {formatStatus(request.status)}
                      </Badge>
                    </div>
                    
                    <div className="flex gap-2 mb-3">
                      {request.services?.photo && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Photography</span>
                      )}
                      {request.services?.video && (
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Videography</span>
                      )}
                      {request.services?.audio && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Audio</span>
                      )}
                    </div>

                    <div className="text-sm text-gray-600">
                      <p>Submitted: {new Date(request.createdAt).toLocaleDateString()}</p>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedRequest(request)}
                      className="flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}