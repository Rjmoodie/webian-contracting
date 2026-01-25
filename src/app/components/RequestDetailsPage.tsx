import { useState, useEffect } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Clock, 
  DollarSign, 
  CheckCircle2, 
  XCircle,
  MessageSquare,
  Send,
  AlertCircle,
  Building2,
  Camera
} from 'lucide-react';
import { toast } from 'sonner';
import ActivityLog from '@/app/components/ActivityLog';

interface RequestDetailsPageProps {
  requestId: string;
  user: any;
  serverUrl: string;
  accessToken: string;
  onBack: () => void;
}

export default function RequestDetailsPage({ 
  requestId, 
  user, 
  serverUrl, 
  accessToken, 
  onBack 
}: RequestDetailsPageProps) {
  const [request, setRequest] = useState<any>(null);
  const [activityLog, setActivityLog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [cancellationReason, setCancellationReason] = useState('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const isAdmin = user.role === 'admin' || user.role === 'manager';
  const isClient = user.role === 'client';

  useEffect(() => {
    fetchRequestDetails();
  }, [requestId]);

  const fetchRequestDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${serverUrl}/requests/${requestId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRequest(data.request);
        setActivityLog(data.activityLog || []);
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

    try {
      const response = await fetch(`${serverUrl}/requests/${requestId}/status`, {
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
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      toast.error('Please enter a note');
      return;
    }

    try {
      const response = await fetch(`${serverUrl}/requests/${requestId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ 
          note: newNote,
          isInternal: isInternalNote 
        }),
      });

      if (response.ok) {
        toast.success('Note added successfully');
        setNewNote('');
        setIsInternalNote(false);
        fetchRequestDetails();
      } else {
        toast.error('Failed to add note');
      }
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
    }
  };

  const handleCancelRequest = async () => {
    try {
      const response = await fetch(`${serverUrl}/requests/${requestId}/cancel`, {
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      reviewing: 'bg-blue-100 text-blue-800',
      assigned: 'bg-purple-100 text-purple-800',
      in_progress: 'bg-indigo-100 text-indigo-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'photography':
        return <Camera className="w-4 h-4" />;
      case 'videography':
        return <Camera className="w-4 h-4" />;
      case 'audio':
        return <Camera className="w-4 h-4" />;
      default:
        return <Camera className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f1eb] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B0DD16]"></div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-[#f5f1eb] flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Request Not Found</h3>
            <p className="text-gray-600 mb-4">The request you're looking for doesn't exist or you don't have access to it.</p>
            <Button onClick={onBack}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f1eb]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-[#755f52]">{request.eventName}</h1>
                <p className="text-sm text-gray-600">Request ID: {request.id}</p>
              </div>
            </div>
            <Badge className={`text-sm px-4 py-2 ${getStatusColor(request.status)}`}>
              {request.status.replace(/_/g, ' ').toUpperCase()}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Request Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Event Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-600">Event Date</Label>
                    <p className="font-semibold text-gray-900">
                      {new Date(request.eventDate).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                  {request.eventTime && (
                    <div>
                      <Label className="text-gray-600">Time</Label>
                      <p className="font-semibold text-gray-900">{request.eventTime}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-gray-600">Parish</Label>
                    <p className="font-semibold text-gray-900">{request.parish}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Venue</Label>
                    <p className="font-semibold text-gray-900">{request.venue}</p>
                  </div>
                  {request.venueType && (
                    <div>
                      <Label className="text-gray-600">Venue Type</Label>
                      <p className="font-semibold text-gray-900 capitalize">{request.venueType}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-gray-600">Turnaround</Label>
                    <p className="font-semibold text-gray-900 capitalize">
                      {request.turnaround === 'standard' && 'Standard (7-14 days)'}
                      {request.turnaround === 'rush' && 'Rush (3-5 days)'}
                      {request.turnaround === 'express' && 'Express (24-48 hours)'}
                    </p>
                  </div>
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  Selected Services ({request.serviceDetails?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {request.serviceDetails && request.serviceDetails.map((service: any) => (
                    <div key={service.id} className="border-2 border-gray-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#B0DD16] text-white flex items-center justify-center flex-shrink-0">
                          {getCategoryIcon(service.category)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-[#755f52]">{service.serviceName}</h4>
                            <Badge className="bg-[#755f52] text-[#c9a882] text-xs capitalize">
                              {service.category}
                            </Badge>
                          </div>
                          {service.deliverables && service.deliverables.length > 0 && (
                            <ul className="space-y-1">
                              {service.deliverables.slice(0, 3).map((item: string, i: number) => (
                                <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                                  <CheckCircle2 className="w-4 h-4 text-[#B0DD16] mt-0.5 flex-shrink-0" />
                                  {item}
                                </li>
                              ))}
                              {service.deliverables.length > 3 && (
                                <li className="text-sm text-gray-500">
                                  +{service.deliverables.length - 3} more items
                                </li>
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

            {/* Client Notes */}
            {request.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Notes & Communication
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {request.notes.map((note: any) => (
                      <div 
                        key={note.id} 
                        className={`border rounded-lg p-4 ${
                          note.isInternal 
                            ? 'bg-amber-50 border-amber-200' 
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{note.userName}</span>
                            <Badge className="text-xs bg-gray-100 text-gray-700">
                              {note.userRole}
                            </Badge>
                            {note.isInternal && (
                              <Badge className="text-xs bg-amber-100 text-amber-800">
                                Internal
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(note.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.note}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Activity Log */}
            <ActivityLog activities={activityLog} userRole={user.role} />
          </div>

          {/* Right Column - Actions */}
          <div className="space-y-6">
            {/* Client Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Client Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <Label className="text-gray-600">Name</Label>
                    <p className="font-semibold">{request.clientName}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Email</Label>
                    <p className="font-semibold">{request.clientEmail}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Submitted</Label>
                    <p className="font-semibold">
                      {new Date(request.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status Management (Admin only) */}
            {isAdmin && request.status !== 'cancelled' && (
              <Card>
                <CardHeader>
                  <CardTitle>Manage Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Change Status</Label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="reviewing">Reviewing</SelectItem>
                        <SelectItem value="assigned">Assigned</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {newStatus !== request.status && (
                    <Button 
                      onClick={handleStatusChange} 
                      className="w-full bg-[#B0DD16] hover:bg-[#9ac514] text-white"
                    >
                      Update Status
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Add Note */}
            <Card>
              <CardHeader>
                <CardTitle>Add Note</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Textarea
                    placeholder="Add a note or comment..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={4}
                  />
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="internal"
                      checked={isInternalNote}
                      onChange={(e) => setIsInternalNote(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="internal" className="text-sm cursor-pointer">
                      Internal note (not visible to client)
                    </Label>
                  </div>
                )}
                <Button 
                  onClick={handleAddNote}
                  className="w-full bg-[#755f52] hover:bg-[#6a5548] text-white"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Add Note
                </Button>
              </CardContent>
            </Card>

            {/* Cancel Request */}
            {(isClient || isAdmin) && request.status !== 'cancelled' && request.status !== 'completed' && (
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="text-red-600">Cancel Request</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!showCancelDialog ? (
                    <Button 
                      onClick={() => setShowCancelDialog(true)}
                      variant="outline"
                      className="w-full border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Cancel Request
                    </Button>
                  ) : (
                    <>
                      <div>
                        <Label>Cancellation Reason</Label>
                        <Textarea
                          placeholder="Please provide a reason for cancellation..."
                          value={cancellationReason}
                          onChange={(e) => setCancellationReason(e.target.value)}
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setShowCancelDialog(false)}
                          variant="outline"
                          className="flex-1"
                        >
                          Back
                        </Button>
                        <Button
                          onClick={handleCancelRequest}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white"
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
