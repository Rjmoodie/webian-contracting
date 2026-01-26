import { useState, useEffect } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Textarea } from '@/app/components/ui/textarea';
import { CheckCircle, XCircle, AlertCircle, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface ApprovalQueueProps {
  serverUrl: string;
  accessToken: string;
}

export default function ApprovalQueue({ serverUrl, accessToken }: ApprovalQueueProps) {
  const [services, setServices] = useState<any[]>([]);
  const [talents, setTalents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'services' | 'talents'>('services');
  const [reviewingItem, setReviewingItem] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  useEffect(() => {
    fetchPendingItems();
  }, []);

  const fetchPendingItems = async () => {
    try {
      // Fetch pending services
      const servicesResponse = await fetch(`${serverUrl}/admin/services`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });

      if (servicesResponse.ok) {
        const servicesData = await servicesResponse.json();
        const pending = servicesData.services.filter((s: any) => s.status === 'pending_approval');
        setServices(pending);
      }

      // Fetch pending talents
      const talentsResponse = await fetch(`${serverUrl}/admin/talents`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });

      if (talentsResponse.ok) {
        const talentsData = await talentsResponse.json();
        const pending = talentsData.talents.filter((t: any) => t.status === 'pending');
        setTalents(pending);
      }
    } catch (error) {
      console.error('Error fetching pending items:', error);
      toast.error('Failed to load approval queue');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveService = async (serviceId: string) => {
    try {
      const response = await fetch(`${serverUrl}/services/${serviceId}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });

      if (response.ok) {
        toast.success('Service approved! Admin can now publish it.');
        setReviewingItem(null);
        fetchPendingItems();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to approve service');
      }
    } catch (error) {
      console.error('Error approving service:', error);
      toast.error('Failed to approve service');
    }
  };

  const handleRejectService = async (serviceId: string) => {
    if (!reviewNotes.trim()) {
      toast.error('Please provide feedback for rejection');
      return;
    }

    try {
      // Update service back to draft with notes
      const response = await fetch(`${serverUrl}/services/${serviceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'draft',
          internalNotes: `MANAGER FEEDBACK: ${reviewNotes}\n\n${reviewingItem.internalNotes || ''}`,
        }),
      });

      if (response.ok) {
        toast.success('Service returned to draft with feedback');
        setReviewingItem(null);
        setReviewNotes('');
        fetchPendingItems();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to reject service');
      }
    } catch (error) {
      console.error('Error rejecting service:', error);
      toast.error('Failed to reject service');
    }
  };

  const handleApproveTalent = async (talentId: string) => {
    try {
      const response = await fetch(`${serverUrl}/talents/${talentId}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });

      if (response.ok) {
        toast.success('Talent approved and added to crew pool');
        setReviewingItem(null);
        fetchPendingItems();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to approve talent');
      }
    } catch (error) {
      console.error('Error approving talent:', error);
      toast.error('Failed to approve talent');
    }
  };

  const handleRejectTalent = async (talentId: string) => {
    if (!reviewNotes.trim()) {
      toast.error('Please provide rejection reason');
      return;
    }

    try {
      const response = await fetch(`${serverUrl}/talents/${talentId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: reviewNotes }),
      });

      if (response.ok) {
        toast.success('Talent application rejected');
        setReviewingItem(null);
        setReviewNotes('');
        fetchPendingItems();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to reject talent');
      }
    } catch (error) {
      console.error('Error rejecting talent:', error);
      toast.error('Failed to reject talent');
    }
  };

  if (reviewingItem) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">
            Review {activeTab === 'services' ? 'Service' : 'Talent Application'}
          </h2>
          <Button variant="outline" onClick={() => {
            setReviewingItem(null);
            setReviewNotes('');
          }}>
            Back to Queue
          </Button>
        </div>

        {activeTab === 'services' ? (
          <ServiceReviewCard
            service={reviewingItem}
            reviewNotes={reviewNotes}
            onNotesChange={setReviewNotes}
            onApprove={() => handleApproveService(reviewingItem.id)}
            onReject={() => handleRejectService(reviewingItem.id)}
          />
        ) : (
          <TalentReviewCard
            talent={reviewingItem}
            reviewNotes={reviewNotes}
            onNotesChange={setReviewNotes}
            onApprove={() => handleApproveTalent(reviewingItem.id)}
            onReject={() => handleRejectTalent(reviewingItem.id)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Approval Queue</h2>
        <p className="text-sm sm:text-base text-gray-600">Review and approve services and talent applications</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          className={`px-3 sm:px-4 py-2 text-sm sm:text-base font-medium transition-colors ${
            activeTab === 'services'
              ? 'border-b-2 border-[#B0DD16] text-[#B0DD16]'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => setActiveTab('services')}
        >
          Services ({services.length})
        </button>
        <button
          className={`px-3 sm:px-4 py-2 text-sm sm:text-base font-medium transition-colors ${
            activeTab === 'talents'
              ? 'border-b-2 border-[#B0DD16] text-[#B0DD16]'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => setActiveTab('talents')}
        >
          Talent Applications ({talents.length})
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : activeTab === 'services' ? (
        services.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-gray-600">No services pending approval</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {services.map((service) => (
              <Card key={service.id} className="card-premium">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-start gap-3">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                        <h3 className="text-base sm:text-lg font-semibold tracking-tight">{service.serviceName}</h3>
                        <Badge className="bg-yellow-100 text-yellow-800">
                          Pending Approval
                        </Badge>
                        <span className="text-xs sm:text-sm text-gray-500 capitalize">{service.category}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                      <div className="text-xs text-gray-500">
                        Submitted: {new Date(service.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <Button 
                      className="button-glow gradient-premium-green text-white shadow-premium hover:shadow-premium-lg hover:scale-105 transition-all w-full sm:w-auto"
                      onClick={() => setReviewingItem(service)}
                    >
                      <Eye className="w-4 h-4 sm:mr-2" />
                      Review
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : (
        talents.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-gray-600">No talent applications pending</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {talents.map((talent) => (
              <Card key={talent.id} className="card-premium">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-start gap-3">
                    <div className="flex-1">
                      <h3 className="text-base sm:text-lg font-semibold mb-2 tracking-tight">Talent Application</h3>
                      <div className="text-sm text-gray-700 mb-2">
                        <strong>Skills:</strong> {talent.skills?.join(', ')}
                      </div>
                      <div className="text-sm text-gray-700 mb-2">
                        <strong>Experience:</strong> {talent.experience}
                      </div>
                      <div className="text-xs text-gray-500">
                        Applied: {new Date(talent.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <Button 
                      className="button-glow gradient-premium-green text-white shadow-premium hover:shadow-premium-lg hover:scale-105 transition-all w-full sm:w-auto"
                      onClick={() => setReviewingItem(talent)}
                    >
                      <Eye className="w-4 h-4 sm:mr-2" />
                      Review
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      )}
    </div>
  );
}

function ServiceReviewCard({ service, reviewNotes, onNotesChange, onApprove, onReject }: any) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Service Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-sm font-semibold text-gray-700 mb-1">Service Name</div>
            <div className="text-lg font-bold">{service.serviceName}</div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-1">Category</div>
              <div className="capitalize">{service.category}</div>
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-1">Sub-Type</div>
              <div>{service.subType || 'N/A'}</div>
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-gray-700 mb-1">Description</div>
            <div className="text-gray-700">{service.description}</div>
          </div>

          {service.goodFor && service.goodFor.length > 0 && (
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-2">Good For</div>
              <div className="flex flex-wrap gap-2">
                {service.goodFor.map((tag: string, i: number) => (
                  <Badge key={i} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </div>
          )}

          {service.deliverables && service.deliverables.length > 0 && (
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-2">Deliverables</div>
              <ul className="list-disc list-inside space-y-1">
                {service.deliverables.map((item: string, i: number) => (
                  <li key={i} className="text-sm text-gray-700">{item}</li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <div className="text-sm font-semibold text-gray-700 mb-1">Coverage</div>
            <div>
              {service.coverageParishes?.length === 14
                ? 'Islandwide (All Parishes)'
                : `${service.coverageParishes?.length || 0} parishes`}
            </div>
          </div>

          {service.internalNotes && (
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-1">Internal Notes</div>
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
                {service.internalNotes}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manager Review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              Feedback / Notes (required for rejection)
            </label>
            <Textarea
              value={reviewNotes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Provide feedback on wording, brand tone, deliverables clarity, risks..."
              rows={4}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              className="flex-1 min-h-[44px] sm:h-10 border-2 border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 transition-all"
              onClick={onReject}
            >
              <XCircle className="w-4 h-4 sm:mr-2" />
              Request Changes
            </Button>
            <Button
              className="button-glow flex-1 min-h-[44px] sm:h-10 gradient-premium-green text-white shadow-premium hover:shadow-premium-lg hover:scale-105 transition-all"
              onClick={onApprove}
            >
              <CheckCircle className="w-4 h-4 sm:mr-2" />
              Approve Service
            </Button>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded text-sm">
            <AlertCircle className="w-4 h-4 inline mr-2 text-blue-700" />
            <strong>Note:</strong> Approving will move this service to "Approved - Not Live" status.
            Admin must explicitly publish it to make it visible to clients.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TalentReviewCard({ talent, reviewNotes, onNotesChange, onApprove, onReject }: any) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Talent Application</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-sm font-semibold text-gray-700 mb-1">Skills</div>
            <div className="flex gap-2">
              {talent.skills?.map((skill: string, i: number) => (
                <Badge key={i}>{skill}</Badge>
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-gray-700 mb-1">Experience</div>
            <div className="text-gray-700">{talent.experience}</div>
          </div>

          <div>
            <div className="text-sm font-semibold text-gray-700 mb-1">Bio</div>
            <div className="text-gray-700">{talent.bio}</div>
          </div>

          <div>
            <div className="text-sm font-semibold text-gray-700 mb-1">Gear</div>
            <div className="text-gray-700">{talent.gear}</div>
          </div>

          <div>
            <div className="text-sm font-semibold text-gray-700 mb-1">Coverage Parishes</div>
            <div className="flex flex-wrap gap-2">
              {talent.coverageParishes?.map((parish: string, i: number) => (
                <Badge key={i} variant="outline">{parish}</Badge>
              ))}
            </div>
          </div>

          {talent.portfolioLinks && (
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-1">Portfolio Links</div>
              <div className="text-sm text-blue-600">{talent.portfolioLinks}</div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manager Review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              Notes / Rejection Reason
            </label>
            <Textarea
              value={reviewNotes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Provide reason for rejection or approval notes..."
              rows={4}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              className="flex-1 min-h-[44px] sm:h-10 border-2 border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 transition-all"
              onClick={onReject}
            >
              <XCircle className="w-4 h-4 sm:mr-2" />
              Reject Application
            </Button>
            <Button
              className="button-glow flex-1 min-h-[44px] sm:h-10 gradient-premium-green text-white shadow-premium hover:shadow-premium-lg hover:scale-105 transition-all"
              onClick={onApprove}
            >
              <CheckCircle className="w-4 h-4 sm:mr-2" />
              Approve & Add to Crew
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
