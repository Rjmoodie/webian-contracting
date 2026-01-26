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
      <nav className="glass bg-white border-b border-[#755f5233] shadow-premium">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center h-auto sm:h-16 py-3 sm:py-0 gap-3 sm:gap-0">
            <div className="flex items-center gap-3 sm:gap-6">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-[#B0DD16] cursor-pointer" onClick={() => onNavigate('home')}>
                <span className="hidden sm:inline">EventCoverageJamaica</span>
                <span className="sm:hidden">ECJ</span>
              </h1>
              <span className="text-xs sm:text-sm text-gray-600 hidden sm:inline">Client Portal</span>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <span className="text-xs sm:text-sm text-gray-700 font-medium whitespace-nowrap">Hi, {user.name}</span>
              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 sm:flex-none min-h-[44px] sm:h-8 text-xs sm:text-sm border-2 border-[#755f52] text-[#755f52] hover:bg-[#755f52] hover:text-white transition-all whitespace-nowrap" 
                  onClick={() => onNavigate('services')}
                >
                  <span className="hidden sm:inline">Browse Services</span>
                  <span className="sm:hidden">Services</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex-1 sm:flex-none min-h-[44px] sm:h-8 text-xs sm:text-sm text-[#755f52] hover:text-[#8b7263] hover:bg-[#f5f1eb] transition-all whitespace-nowrap" 
                  onClick={onLogout}
                >
                  <LogOut className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Logout</span>
                  <span className="sm:hidden">Logout</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Card */}
        <Card className="mb-6 sm:mb-8 gradient-premium-green text-white shadow-premium-lg">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold mb-2">Welcome back, {user.name}!</h2>
                <p className="text-sm sm:text-base opacity-90">Manage your event coverage requests and track deliverables</p>
              </div>
              <Button 
                size="lg" 
                variant="secondary"
                onClick={() => setShowCreateWizard(true)}
                className="flex items-center gap-2 w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                Create Request
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
          <Card className="card-premium">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-[#B0DD16] tracking-tight">{requests.length}</div>
              <div className="text-sm text-gray-600 mt-1">Total Requests</div>
            </CardContent>
          </Card>
          <Card className="card-premium">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-yellow-600 tracking-tight">
                {requests.filter(r => r.status === 'submitted' || r.status === 'under_review').length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Pending</div>
            </CardContent>
          </Card>
          <Card className="card-premium">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-green-600 tracking-tight">
                {requests.filter(r => r.status === 'confirmed' || r.status === 'in_progress').length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Active</div>
            </CardContent>
          </Card>
          <Card className="card-premium">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-gray-600 tracking-tight">
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
              <div className="space-y-3 sm:space-y-4">
                {requests.map((request) => (
                  <div key={request.id} className="card-premium border border-[1.5px] sm:border rounded-lg p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-start mb-3 gap-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-base sm:text-lg text-gray-900">{request.eventName}</h3>
                        <p className="text-xs sm:text-sm text-gray-600">
                          {new Date(request.eventDate).toLocaleDateString()} • {request.parish}
                        </p>
                      </div>
                      <Badge className={getStatusColor(request.status)}>
                        {formatStatus(request.status)}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
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

                    <div className="text-xs sm:text-sm text-gray-600 mb-3">
                      <p>Submitted: {new Date(request.createdAt).toLocaleDateString()}</p>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedRequest(request)}
                      className="flex items-center gap-2 w-full sm:w-auto"
                    >
                      <Eye className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">View Details</span>
                      <span className="sm:hidden">Details</span>
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