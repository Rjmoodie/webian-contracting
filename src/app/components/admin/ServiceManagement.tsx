import { useState, useEffect } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Plus, Edit, Pause, Play, Eye, Send, CheckCircle, X } from 'lucide-react';
import { toast } from 'sonner';

interface ServiceManagementProps {
  serverUrl: string;
  accessToken: string;
  userRole: string;
}

export default function ServiceManagement({ serverUrl, accessToken, userRole }: ServiceManagementProps) {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch(`${serverUrl}/admin/services`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });

      if (response.ok) {
        const data = await response.json();
        setServices(data.services || []);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditingService({
      serviceName: '',
      category: 'photography',
      subType: '',
      description: '',
      goodFor: [],
      deliverables: [],
      coverageParishes: [],
      sampleMedia: [],
      fulfillmentRules: {
        minTier: 'standard',
        crewSize: 1,
        requiredGear: [],
        backupRequired: false,
      },
      internalNotes: '',
    });
    setShowEditor(true);
  };

  const handleEdit = (service: any) => {
    setEditingService({ ...service });
    setShowEditor(true);
  };

  const handleSave = async () => {
    try {
      const url = editingService.id
        ? `${serverUrl}/services/${editingService.id}`
        : `${serverUrl}/services`;

      const method = editingService.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingService),
      });

      if (response.ok) {
        toast.success(editingService.id ? 'Service updated' : 'Service created');
        setShowEditor(false);
        setEditingService(null);
        fetchServices();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save service');
      }
    } catch (error) {
      console.error('Error saving service:', error);
      toast.error('Failed to save service');
    }
  };

  const handleSubmitForApproval = async (serviceId: string) => {
    try {
      const response = await fetch(`${serverUrl}/services/${serviceId}/submit-for-approval`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });

      if (response.ok) {
        toast.success('Service submitted for approval');
        fetchServices();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to submit for approval');
      }
    } catch (error) {
      console.error('Error submitting for approval:', error);
      toast.error('Failed to submit for approval');
    }
  };

  const handlePublish = async (serviceId: string) => {
    if (!confirm('This will make the service visible to clients. Continue?')) return;

    try {
      const response = await fetch(`${serverUrl}/services/${serviceId}/publish`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });

      if (response.ok) {
        toast.success('Service published successfully! Now visible to clients.');
        fetchServices();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to publish service');
      }
    } catch (error) {
      console.error('Error publishing service:', error);
      toast.error('Failed to publish service');
    }
  };

  const handlePause = async (serviceId: string) => {
    try {
      const response = await fetch(`${serverUrl}/services/${serviceId}/pause`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });

      if (response.ok) {
        toast.success('Service paused (hidden from clients)');
        fetchServices();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to pause service');
      }
    } catch (error) {
      console.error('Error pausing service:', error);
      toast.error('Failed to pause service');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; text: string }> = {
      draft: { color: 'bg-gray-100 text-gray-800', text: 'Draft' },
      pending_approval: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending Approval' },
      approved: { color: 'bg-green-100 text-green-800', text: 'Approved - Not Live' },
      published: { color: 'bg-blue-100 text-blue-800', text: '✓ Published (Live)' },
      paused: { color: 'bg-orange-100 text-orange-800', text: 'Paused' },
    };
    return badges[status] || badges.draft;
  };

  const filteredServices = filter === 'all' 
    ? services 
    : services.filter(s => s.status === filter);

  if (showEditor) {
    return (
      <ServiceEditor
        service={editingService}
        onChange={setEditingService}
        onSave={handleSave}
        onCancel={() => {
          setShowEditor(false);
          setEditingService(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Service Management</h2>
          <p className="text-gray-600">Create and manage ECJ-branded service offerings</p>
        </div>
        {userRole === 'admin' && (
          <Button onClick={handleCreateNew}>
            <Plus className="w-4 h-4 mr-2" />
            Create Service
          </Button>
        )}
      </div>

      {/* Status Filter */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All ({services.length})
        </Button>
        <Button
          variant={filter === 'draft' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('draft')}
        >
          Draft ({services.filter(s => s.status === 'draft').length})
        </Button>
        <Button
          variant={filter === 'pending_approval' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('pending_approval')}
        >
          Pending ({services.filter(s => s.status === 'pending_approval').length})
        </Button>
        <Button
          variant={filter === 'approved' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('approved')}
        >
          Approved ({services.filter(s => s.status === 'approved').length})
        </Button>
        <Button
          variant={filter === 'published' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('published')}
        >
          Published ({services.filter(s => s.status === 'published').length})
        </Button>
      </div>

      {/* Services List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredServices.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">No services found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredServices.map((service) => {
            const statusBadge = getStatusBadge(service.status);
            return (
              <Card key={service.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{service.serviceName}</h3>
                        <Badge className={statusBadge.color}>
                          {statusBadge.text}
                        </Badge>
                        <span className="text-sm text-gray-500 capitalize">
                          {service.category}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{service.description}</p>
                      
                      <div className="flex gap-4 text-sm text-gray-600">
                        <span>📊 {service.totalEventsDelivered || 0} events</span>
                        <span>⭐ {service.averageRating || 0}/5</span>
                        <span>📍 {service.coverageParishes?.length || 0} parishes</span>
                      </div>

                      {service.internalNotes && (
                        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                          <strong>Internal Notes:</strong> {service.internalNotes}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      {userRole === 'admin' && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => handleEdit(service)}>
                            <Edit className="w-4 h-4" />
                          </Button>

                          {service.status === 'draft' && (
                            <Button variant="outline" size="sm" onClick={() => handleSubmitForApproval(service.id)}>
                              <Send className="w-4 h-4 mr-1" />
                              Submit
                            </Button>
                          )}

                          {service.status === 'approved' && (
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handlePublish(service.id)}
                            >
                              <Play className="w-4 h-4 mr-1" />
                              Publish
                            </Button>
                          )}

                          {service.status === 'published' && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handlePause(service.id)}
                            >
                              <Pause className="w-4 h-4 mr-1" />
                              Pause
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Service Editor Component
function ServiceEditor({ service, onChange, onSave, onCancel }: any) {
  const parishes = [
    'Kingston', 'St. Andrew', 'St. Thomas', 'Portland', 'St. Mary', 'St. Ann',
    'Trelawny', 'St. James', 'Hanover', 'Westmoreland', 'St. Elizabeth',
    'Manchester', 'Clarendon', 'St. Catherine'
  ];

  const [newTag, setNewTag] = useState('');
  const [newDeliverable, setNewDeliverable] = useState('');

  const addTag = () => {
    if (newTag.trim()) {
      onChange({ ...service, goodFor: [...(service.goodFor || []), newTag.trim()] });
      setNewTag('');
    }
  };

  const removeTag = (index: number) => {
    onChange({ ...service, goodFor: service.goodFor.filter((_: any, i: number) => i !== index) });
  };

  const addDeliverable = () => {
    if (newDeliverable.trim()) {
      onChange({ ...service, deliverables: [...(service.deliverables || []), newDeliverable.trim()] });
      setNewDeliverable('');
    }
  };

  const removeDeliverable = (index: number) => {
    onChange({ ...service, deliverables: service.deliverables.filter((_: any, i: number) => i !== index) });
  };

  const toggleParish = (parish: string) => {
    const current = service.coverageParishes || [];
    const updated = current.includes(parish)
      ? current.filter((p: string) => p !== parish)
      : [...current, parish];
    onChange({ ...service, coverageParishes: updated });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          {service.id ? 'Edit Service' : 'Create New Service'}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={onSave}>
            <CheckCircle className="w-4 h-4 mr-2" />
            Save Service
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Service Name (Client-Facing)</Label>
            <Input
              value={service.serviceName}
              onChange={(e) => onChange({ ...service, serviceName: e.target.value })}
              placeholder="e.g., Professional Event Photography"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Category</Label>
              <select
                className="w-full border rounded-md p-2"
                value={service.category}
                onChange={(e) => onChange({ ...service, category: e.target.value })}
              >
                <option value="photography">Photography</option>
                <option value="videography">Videography</option>
                <option value="audio">Audio</option>
              </select>
            </div>

            <div>
              <Label>Sub-Type</Label>
              <Input
                value={service.subType}
                onChange={(e) => onChange({ ...service, subType: e.target.value })}
                placeholder="e.g., Corporate, Festival, Press"
              />
            </div>
          </div>

          <div>
            <Label>Description (Client-Facing)</Label>
            <Textarea
              value={service.description}
              onChange={(e) => onChange({ ...service, description: e.target.value })}
              placeholder="Describe what this service offers..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Use Cases & Tags</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Good For (Use Case Tags)</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="e.g., Corporate events, Festivals"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" onClick={addTag}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {service.goodFor?.map((tag: string, i: number) => (
                <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => removeTag(i)}>
                  {tag} <X className="w-3 h-3 ml-1" />
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Deliverables</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>What's Included</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newDeliverable}
                onChange={(e) => setNewDeliverable(e.target.value)}
                placeholder="e.g., 200+ high-res edited photos"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDeliverable())}
              />
              <Button type="button" onClick={addDeliverable}>Add</Button>
            </div>
            <ul className="space-y-2">
              {service.deliverables?.map((item: string, i: number) => (
                <li key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">{item}</span>
                  <Button variant="ghost" size="sm" onClick={() => removeDeliverable(i)}>
                    <X className="w-4 h-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Coverage Area</CardTitle>
        </CardHeader>
        <CardContent>
          <Label className="mb-3 block">Select Parishes</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {parishes.map((parish) => (
              <label key={parish} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={service.coverageParishes?.includes(parish) || false}
                  onChange={() => toggleParish(parish)}
                  className="rounded"
                />
                <span className="text-sm">{parish}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Internal Notes (Admin-Only)</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={service.internalNotes}
            onChange={(e) => onChange({ ...service, internalNotes: e.target.value })}
            placeholder="Internal notes, risks, requirements..."
            rows={3}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fulfillment Rules (Internal)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Minimum Talent Tier</Label>
              <select
                className="w-full border rounded-md p-2"
                value={service.fulfillmentRules?.minTier || 'standard'}
                onChange={(e) => onChange({
                  ...service,
                  fulfillmentRules: { ...service.fulfillmentRules, minTier: e.target.value }
                })}
              >
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
                <option value="elite">Elite</option>
              </select>
            </div>

            <div>
              <Label>Crew Size</Label>
              <Input
                type="number"
                min="1"
                value={service.fulfillmentRules?.crewSize || 1}
                onChange={(e) => onChange({
                  ...service,
                  fulfillmentRules: { ...service.fulfillmentRules, crewSize: parseInt(e.target.value) }
                })}
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={service.fulfillmentRules?.backupRequired || false}
                onChange={(e) => onChange({
                  ...service,
                  fulfillmentRules: { ...service.fulfillmentRules, backupRequired: e.target.checked }
                })}
                className="rounded"
              />
              <span className="text-sm font-medium">Backup Coverage Required</span>
            </label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
