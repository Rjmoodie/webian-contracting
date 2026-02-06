import { useState, useEffect } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { ArrowLeft, ArrowRight, Check, Camera, Video, Music, CheckCircle2, Search, MapPin, Tag, Sparkles, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import ECJLogo from '@/app/components/ECJLogo';

interface CreateRequestWizardProps {
  serverUrl: string;
  accessToken: string;
  onClose: () => void;
  onNavigate: (page: string) => void;
}

export default function CreateRequestWizard({ serverUrl, accessToken, onClose, onNavigate }: CreateRequestWizardProps) {
  const [step, setStep] = useState(1);
  const [availableServices, setAvailableServices] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  
  // Step 2 optimization states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showParishMatch, setShowParishMatch] = useState(false);
  
  const [formData, setFormData] = useState({
    eventName: '',
    eventDate: '',
    eventTime: '',
    parish: '',
    venue: '',
    venueType: '',
    selectedServices: [] as string[], // Array of service IDs
    services: {
      photo: false,
      video: false,
      audio: false,
    },
    deliverables: {
      photoCount: '',
      highlightVideo: false,
      fullEdit: false,
      audioRecording: false,
    },
    turnaround: 'standard',
    budget: '',
    notes: '',
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch(`${serverUrl}/services`);
      if (response.ok) {
        const data = await response.json();
        setAvailableServices(data.services || []);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoadingServices(false);
    }
  };

  const parishes = [
    'Kingston', 'St. Andrew', 'St. Thomas', 'Portland', 'St. Mary', 'St. Ann',
    'Trelawny', 'St. James', 'Hanover', 'Westmoreland', 'St. Elizabeth',
    'Manchester', 'Clarendon', 'St. Catherine'
  ];

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateDeliverables = (deliverable: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      deliverables: { ...prev.deliverables, [deliverable]: value }
    }));
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch(`${serverUrl}/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Request created successfully!');
        onClose();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to create request');
      }
    } catch (error) {
      console.error('Error creating request:', error);
      toast.error('Failed to create request');
    }
  };

  const canProceedStep1 = formData.eventName && formData.eventDate && formData.parish && formData.venue;
  const canProceedStep2 = formData.selectedServices.length > 0;

  const toggleService = (serviceId: string) => {
    setFormData(prev => {
      const isSelected = prev.selectedServices.includes(serviceId);
      return {
        ...prev,
        selectedServices: isSelected
          ? prev.selectedServices.filter(id => id !== serviceId)
          : [...prev.selectedServices, serviceId]
      };
    });
  };

  const getCategoryIcon = (category: string) => {
    switch(category) {
      case 'photography':
        return <Camera className="w-6 h-6" />;
      case 'videography':
        return <Video className="w-6 h-6" />;
      case 'audio':
        return <Music className="w-6 h-6" />;
      default:
        return null;
    }
  };

  // Filter and sort services for Step 2
  const getFilteredServices = () => {
    let filtered = [...availableServices];

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(service => service.category === categoryFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(service =>
        service.serviceName.toLowerCase().includes(query) ||
        service.description?.toLowerCase().includes(query) ||
        service.subType?.toLowerCase().includes(query) ||
        service.goodFor?.some((tag: string) => tag.toLowerCase().includes(query))
      );
    }

    // Parish match filter (show services available in user's parish first)
    if (showParishMatch && formData.parish) {
      filtered.sort((a, b) => {
        const aMatches = a.coverageParishes?.includes(formData.parish);
        const bMatches = b.coverageParishes?.includes(formData.parish);
        if (aMatches && !bMatches) return -1;
        if (!aMatches && bMatches) return 1;
        return 0;
      });
    }

    return filtered;
  };

  const filteredServices = getFilteredServices();

  // Check if service is available in selected parish
  const isAvailableInParish = (service: any) => {
    if (!formData.parish || !service.coverageParishes) return true;
    return service.coverageParishes.includes(formData.parish);
  };

  // Get recommended services based on venue type
  const getRecommendedServices = () => {
    if (!formData.venueType) return [];
    const recommendations: string[] = [];
    
    switch (formData.venueType) {
      case 'hotel':
      case 'conference':
        recommendations.push('corporate', 'wedding');
        break;
      case 'outdoor':
        recommendations.push('festival', 'outdoor');
        break;
      case 'street':
        recommendations.push('press', 'festival');
        break;
    }
    
    return availableServices.filter(service =>
      recommendations.includes(service.subType)
    ).slice(0, 2);
  };

  const recommendedServices = getRecommendedServices();

  // Get selected service objects for Steps 3 & 4
  const getSelectedServiceObjects = () => {
    return availableServices.filter(service => 
      formData.selectedServices.includes(service.id)
    );
  };

  const selectedServiceObjects = getSelectedServiceObjects();

  // Calculate estimated info
  const getTotalDeliverables = () => {
    let count = 0;
    selectedServiceObjects.forEach(service => {
      if (service.deliverables) count += service.deliverables.length;
    });
    return count;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50 header-nav">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 gap-2 sm:gap-4 md:gap-6">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="flex items-center cursor-pointer shrink-0"
              aria-label="Event Coverage Jamaica – Home"
            >
              <ECJLogo size="xl" className="max-h-full" />
            </button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onClose}
              className="inline-flex items-center whitespace-nowrap shrink-0"
            >
              <ArrowLeft className="w-4 h-4 mr-2 shrink-0" />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </Button>
          </div>
        </div>
      </nav>
      {/* Spacer for fixed header */}
      <div className="h-24" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  s < step ? 'bg-green-600 text-white' :
                  s === step ? 'bg-blue-600 text-white' :
                  'bg-gray-200 text-gray-600'
                }`}>
                  {s < step ? <Check className="w-5 h-5" /> : s}
                </div>
                {s < 4 && <div className={`w-16 h-1 ${s < step ? 'bg-green-600' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
          <div className="text-center mt-4 text-gray-600">
            Step {step} of 4
          </div>
        </div>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle>
              {step === 1 && 'Event Details'}
              {step === 2 && 'Coverage Needed'}
              {step === 3 && 'Deliverables & Requirements'}
              {step === 4 && 'Review & Submit'}
            </CardTitle>
            <CardDescription>
              {step === 1 && 'Tell us about your event'}
              {step === 2 && 'Select the services you need'}
              {step === 3 && 'Specify your deliverables and turnaround time'}
              {step === 4 && 'Review your request before submitting'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Event Basics */}
            {step === 1 && (
              <>
                <div>
                  <Label htmlFor="eventName">Event Name *</Label>
                  <Input
                    id="eventName"
                    placeholder="Annual Company Gala"
                    value={formData.eventName}
                    onChange={(e) => updateFormData('eventName', e.target.value)}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="eventDate">Event Date *</Label>
                    <Input
                      id="eventDate"
                      type="date"
                      value={formData.eventDate}
                      onChange={(e) => updateFormData('eventDate', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="eventTime">Event Time</Label>
                    <Input
                      id="eventTime"
                      type="time"
                      value={formData.eventTime}
                      onChange={(e) => updateFormData('eventTime', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="parish">Parish *</Label>
                  <Select value={formData.parish} onValueChange={(value) => updateFormData('parish', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select parish" />
                    </SelectTrigger>
                    <SelectContent>
                      {parishes.map(parish => (
                        <SelectItem key={parish} value={parish}>{parish}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="venue">Venue Address *</Label>
                  <Input
                    id="venue"
                    placeholder="123 Main Street, Kingston"
                    value={formData.venue}
                    onChange={(e) => updateFormData('venue', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="venueType">Venue Type</Label>
                  <Select value={formData.venueType} onValueChange={(value) => updateFormData('venueType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select venue type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hotel">Hotel</SelectItem>
                      <SelectItem value="outdoor">Outdoor</SelectItem>
                      <SelectItem value="conference">Conference Center</SelectItem>
                      <SelectItem value="street">Street / Public</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Step 2: Coverage Needed - OPTIMIZED */}
            {step === 2 && (
              <div className="space-y-6">
                {/* Selection Summary */}
                {formData.selectedServices.length > 0 && (
                  <div className="bg-gradient-to-r from-[#BDFF1C]/10 to-[#7fa589]/10 border-2 border-[#BDFF1C] rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-[#7fa589]" />
                        <span className="font-semibold text-[#755f52]">
                          {formData.selectedServices.length} service{formData.selectedServices.length !== 1 ? 's' : ''} selected
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, selectedServices: [] }))}
                        className="text-xs text-gray-600 hover:text-gray-900"
                      >
                        Clear all
                      </Button>
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {recommendedServices.length > 0 && formData.selectedServices.length === 0 && (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Recommended for your event</h4>
                        <p className="text-sm text-gray-600">Based on your venue type: {formData.venueType}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recommendedServices.map(service => (
                        <Button
                          key={service.id}
                          variant="outline"
                          size="sm"
                          onClick={() => toggleService(service.id)}
                          className="text-xs border-blue-300 hover:bg-blue-100"
                        >
                          {getCategoryIcon(service.category)}
                          <span className="ml-2">{service.serviceName}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Search and Filters */}
                <div className="space-y-3">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      placeholder="Search services by name, type, or description..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-12 border-2 border-gray-200 focus:border-[#BDFF1C] rounded-xl"
                    />
                  </div>

                  {/* Filter Controls */}
                  <div className="flex flex-wrap gap-3 items-center">
                    {/* Category Tabs */}
                    <Tabs value={categoryFilter} onValueChange={setCategoryFilter} className="flex-1">
                      <TabsList className="grid w-full grid-cols-4 bg-gray-100">
                        <TabsTrigger value="all" className="text-xs sm:text-sm">All</TabsTrigger>
                        <TabsTrigger value="photography" className="text-xs sm:text-sm">
                          <Camera className="w-4 h-4 mr-1" />
                          Photo
                        </TabsTrigger>
                        <TabsTrigger value="videography" className="text-xs sm:text-sm">
                          <Video className="w-4 h-4 mr-1" />
                          Video
                        </TabsTrigger>
                        <TabsTrigger value="audio" className="text-xs sm:text-sm">
                          <Music className="w-4 h-4 mr-1" />
                          Audio
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>

                    {/* Parish Match Toggle */}
                    {formData.parish && (
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="parishMatch"
                          checked={showParishMatch}
                          onCheckedChange={setShowParishMatch}
                        />
                        <Label htmlFor="parishMatch" className="text-sm cursor-pointer flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-[#BDFF1C]" />
                          {formData.parish} only
                        </Label>
                      </div>
                    )}
                  </div>

                  {/* Results Count */}
                  <div className="text-xs text-gray-500">
                    Showing {filteredServices.length} of {availableServices.length} services
                  </div>
                </div>

                {/* Service Cards */}
                {loadingServices ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#BDFF1C]"></div>
                  </div>
                ) : filteredServices.length === 0 ? (
                  <div className="text-center py-12 bg-gradient-to-br from-[#f5f1eb] to-[#ebe4d8] rounded-xl">
                    <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-1">No services found</h3>
                    <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
                    {(searchQuery || categoryFilter !== 'all' || showParishMatch) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearchQuery('');
                          setCategoryFilter('all');
                          setShowParishMatch(false);
                        }}
                        className="mt-4"
                      >
                        Clear filters
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    {filteredServices.map(service => {
                      const isSelected = formData.selectedServices.includes(service.id);
                      const availableHere = isAvailableInParish(service);
                      
                      return (
                        <div 
                          key={service.id} 
                          className={`border-2 rounded-xl p-5 cursor-pointer transition-all duration-200 ${
                            isSelected 
                              ? 'border-[#BDFF1C] bg-[#BDFF1C]/10 shadow-lg transform scale-[1.02]' 
                              : 'border-gray-200 hover:border-[#BDFF1C]/50 hover:shadow-md'
                          }`}
                          onClick={() => toggleService(service.id)}
                        >
                          <div className="flex items-start gap-4">
                            {/* Icon */}
                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                              isSelected ? 'bg-[#BDFF1C] text-white' : 'bg-[#755f52]/10 text-[#755f52]'
                            }`}>
                              {getCategoryIcon(service.category)}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              {/* Header */}
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <h3 className="text-lg font-bold text-[#755f52]">{service.serviceName}</h3>
                                    {isSelected && (
                                      <CheckCircle2 className="w-5 h-5 text-[#BDFF1C] flex-shrink-0" />
                                    )}
                                  </div>
                                  <div className="flex flex-wrap gap-2 items-center">
                                    <Badge className="bg-[#755f52] text-[#c9a882] text-xs">ECJ-Vetted</Badge>
                                    {service.subType && (
                                      <Badge variant="outline" className="text-xs border-[#755f52] text-[#755f52]">
                                        <Tag className="w-3 h-3 mr-1" />
                                        {service.subType}
                                      </Badge>
                                    )}
                                    {availableHere && formData.parish && (
                                      <Badge className="bg-[#BDFF1C] text-white text-xs">
                                        <MapPin className="w-3 h-3 mr-1" />
                                        {formData.parish}
                                      </Badge>
                                    )}
                                    {!availableHere && formData.parish && showParishMatch && (
                                      <Badge variant="outline" className="text-xs border-gray-300 text-gray-500">
                                        <MapPin className="w-3 h-3 mr-1" />
                                        Other parishes
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Description */}
                              <p className="text-sm text-gray-700 mb-3 leading-relaxed">{service.description}</p>

                              {/* Good For Tags */}
                              {service.goodFor && service.goodFor.length > 0 && (
                                <div className="mb-3">
                                  <p className="text-xs font-semibold text-gray-600 mb-1">Perfect for:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {service.goodFor.map((tag: string, i: number) => (
                                      <span 
                                        key={i} 
                                        className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Deliverables */}
                              {service.deliverables && service.deliverables.length > 0 && (
                                <div className="border-t border-gray-200 pt-3">
                                  <p className="text-xs font-semibold text-gray-700 mb-2">What's included:</p>
                                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {service.deliverables.slice(0, 4).map((item: string, i: number) => (
                                      <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                                        <CheckCircle2 className="w-3 h-3 text-[#BDFF1C] mt-0.5 flex-shrink-0" />
                                        <span>{item}</span>
                                      </li>
                                    ))}
                                  </ul>
                                  {service.deliverables.length > 4 && (
                                    <p className="text-xs text-gray-500 mt-2">
                                      +{service.deliverables.length - 4} more deliverable{service.deliverables.length - 4 !== 1 ? 's' : ''}
                                    </p>
                                  )}
                                </div>
                              )}

                              {/* Parish Coverage */}
                              {service.coverageParishes && service.coverageParishes.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <p className="text-xs font-semibold text-gray-600 mb-1">Coverage areas:</p>
                                  <p className="text-xs text-gray-500">
                                    {service.coverageParishes.slice(0, 5).join(', ')}
                                    {service.coverageParishes.length > 5 && ` +${service.coverageParishes.length - 5} more`}
                                  </p>
                                </div>
                              )}

                              {/* Trust Metrics */}
                              {(service.totalEventsDelivered > 0 || service.averageRating > 0) && (
                                <div className="mt-3 pt-3 border-t border-gray-200 flex gap-4">
                                  {service.totalEventsDelivered > 0 && (
                                    <div className="text-xs">
                                      <span className="font-semibold text-[#755f52]">{service.totalEventsDelivered}</span>
                                      <span className="text-gray-500"> events delivered</span>
                                    </div>
                                  )}
                                  {service.onTimeDeliveryRate && (
                                    <div className="text-xs">
                                      <span className="font-semibold text-[#BDFF1C]">{service.onTimeDeliveryRate}%</span>
                                      <span className="text-gray-500"> on-time</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Validation Message */}
                {!canProceedStep2 && !loadingServices && availableServices.length > 0 && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center gap-3">
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <p className="text-sm text-red-800">Please select at least one service to continue</p>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Deliverables & Requirements - OPTIMIZED */}
            {step === 3 && (
              <div className="space-y-6">
                {/* Selected Services Summary */}
                <div className="bg-gradient-to-br from-[#755f52]/5 to-[#c9a882]/10 border-2 border-[#755f52]/20 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle2 className="w-5 h-5 text-[#BDFF1C]" />
                    <h3 className="font-bold text-[#755f52]">Your Selected Services</h3>
                  </div>
                  
                  <div className="space-y-3">
                    {selectedServiceObjects.map((service, index) => (
                      <div key={service.id} className="bg-white rounded-lg p-4 border border-[#755f52]/10">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#BDFF1C] text-white flex items-center justify-center flex-shrink-0">
                            {getCategoryIcon(service.category)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-[#755f52]">{service.serviceName}</h4>
                              <Badge className="bg-[#755f52] text-[#c9a882] text-xs">{service.category}</Badge>
                            </div>
                            <p className="text-xs text-gray-600 mb-2">{service.description}</p>
                            
                            {/* Deliverables included */}
                            {service.deliverables && service.deliverables.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs font-semibold text-gray-700 mb-1">What's included:</p>
                                <ul className="grid grid-cols-1 gap-1">
                                  {service.deliverables.slice(0, 3).map((item: string, i: number) => (
                                    <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                                      <CheckCircle2 className="w-3 h-3 text-[#BDFF1C] mt-0.5 flex-shrink-0" />
                                      <span>{item}</span>
                                    </li>
                                  ))}
                                  {service.deliverables.length > 3 && (
                                    <li className="text-xs text-gray-500 ml-4">
                                      +{service.deliverables.length - 3} more items
                                    </li>
                                  )}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total deliverables count */}
                  <div className="mt-4 pt-4 border-t border-[#755f52]/10 flex items-center justify-between text-sm">
                    <span className="text-gray-600">Total deliverables across all services:</span>
                    <span className="font-bold text-[#755f52]">{getTotalDeliverables()}+ items</span>
                  </div>
                </div>

                {/* Turnaround Time */}
                <div>
                  <Label htmlFor="turnaround" className="text-base font-semibold text-[#755f52] mb-2 block">
                    Turnaround Time *
                  </Label>
                  <p className="text-sm text-gray-600 mb-3">
                    How quickly do you need your deliverables?
                  </p>
                  <Select value={formData.turnaround} onValueChange={(value) => updateFormData('turnaround', value)}>
                    <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-[#BDFF1C]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">
                        <div className="flex items-center gap-2 py-1">
                          <div>
                            <p className="font-semibold">Standard (7-14 days)</p>
                            <p className="text-xs text-gray-500">Most economical option</p>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="rush">
                        <div className="flex items-center gap-2 py-1">
                          <div>
                            <p className="font-semibold">Rush (3-5 days)</p>
                            <p className="text-xs text-gray-500">Priority processing</p>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="express">
                        <div className="flex items-center gap-2 py-1">
                          <div>
                            <p className="font-semibold">Express (24-48 hours)</p>
                            <p className="text-xs text-gray-500">Fastest turnaround</p>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Budget */}
                <div>
                  <Label htmlFor="budget" className="text-base font-semibold text-[#755f52] mb-2 block">
                    Budget Range (Optional)
                  </Label>
                  <p className="text-sm text-gray-600 mb-3">
                    Help us understand your budget expectations
                  </p>
                  <Input
                    id="budget"
                    placeholder="e.g., $500-$1000 or JMD 75,000-150,000"
                    value={formData.budget}
                    onChange={(e) => updateFormData('budget', e.target.value)}
                    className="h-12 border-2 border-gray-200 focus:border-[#BDFF1C]"
                  />
                </div>

                {/* Special Requirements / Notes */}
                <div>
                  <Label htmlFor="notes" className="text-base font-semibold text-[#755f52] mb-2 block">
                    Special Requirements or Notes (Optional)
                  </Label>
                  <p className="text-sm text-gray-600 mb-3">
                    Any specific needs, preferences, or important details we should know?
                  </p>
                  <Textarea
                    id="notes"
                    placeholder="Examples: Need drone footage, specific color grading style, VIP coverage requirements, accessibility needs, etc."
                    rows={5}
                    value={formData.notes}
                    onChange={(e) => updateFormData('notes', e.target.value)}
                    className="border-2 border-gray-200 focus:border-[#BDFF1C] resize-none"
                  />
                </div>

                {/* ECJ Guarantee Badge */}
                <div className="bg-gradient-to-r from-[#BDFF1C]/10 to-[#7fa589]/10 border-2 border-[#BDFF1C] rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#BDFF1C] flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#755f52] mb-1">ECJ Quality Guarantee</h4>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        All services are backed by our professional guarantee. If you're not satisfied with the quality, 
                        we'll make it right—no questions asked.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Review & Submit - OPTIMIZED */}
            {step === 4 && (
              <div className="space-y-5">
                {/* Header */}
                <div className="text-center pb-4 border-b border-gray-200">
                  <h3 className="text-2xl font-bold text-[#755f52] mb-2">Almost There!</h3>
                  <p className="text-gray-600">Review your request before submitting to ECJ</p>
                </div>

                {/* Event Information */}
                <div className="bg-gradient-to-br from-[#755f52]/5 to-[#c9a882]/10 rounded-xl p-5 border-2 border-[#755f52]/20">
                  <h3 className="font-bold text-[#755f52] mb-3 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#755f52] text-white flex items-center justify-center text-sm">
                      1
                    </div>
                    Event Information
                  </h3>
                  <div className="space-y-2 text-sm ml-10">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Event Name:</span>
                      <span className="font-semibold text-gray-900">{formData.eventName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-semibold text-gray-900">
                        {new Date(formData.eventDate).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                    {formData.eventTime && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Time:</span>
                        <span className="font-semibold text-gray-900">{formData.eventTime}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Parish:</span>
                      <span className="font-semibold text-gray-900">{formData.parish}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Venue:</span>
                      <span className="font-semibold text-gray-900">{formData.venue}</span>
                    </div>
                    {formData.venueType && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Venue Type:</span>
                        <span className="font-semibold text-gray-900 capitalize">{formData.venueType}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected Services */}
                <div className="bg-gradient-to-br from-[#BDFF1C]/10 to-[#7fa589]/10 rounded-xl p-5 border-2 border-[#BDFF1C]/50">
                  <h3 className="font-bold text-[#755f52] mb-3 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#BDFF1C] text-white flex items-center justify-center text-sm">
                      2
                    </div>
                    Selected Services ({selectedServiceObjects.length})
                  </h3>
                  <div className="space-y-3 ml-10">
                    {selectedServiceObjects.map((service, index) => (
                      <div key={service.id} className="bg-white rounded-lg p-4 border border-[#755f52]/10">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#BDFF1C] text-white flex items-center justify-center flex-shrink-0">
                            {getCategoryIcon(service.category)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-bold text-[#755f52]">{service.serviceName}</h4>
                              <Badge className="bg-[#755f52] text-[#c9a882] text-xs capitalize">{service.category}</Badge>
                            </div>
                            <p className="text-xs text-gray-600 mb-2">{service.description}</p>
                            
                            {service.deliverables && service.deliverables.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-gray-200">
                                <p className="text-xs font-semibold text-gray-700 mb-1">Includes:</p>
                                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                                  {service.deliverables.slice(0, 4).map((item: string, i: number) => (
                                    <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                                      <CheckCircle2 className="w-3 h-3 text-[#BDFF1C] mt-0.5 flex-shrink-0" />
                                      <span>{item}</span>
                                    </li>
                                  ))}
                                </ul>
                                {service.deliverables.length > 4 && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    +{service.deliverables.length - 4} more items
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Requirements & Timeline */}
                <div className="bg-white rounded-xl p-5 border-2 border-gray-200">
                  <h3 className="font-bold text-[#755f52] mb-3 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#755f52] text-white flex items-center justify-center text-sm">
                      3
                    </div>
                    Requirements & Timeline
                  </h3>
                  <div className="space-y-3 text-sm ml-10">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Turnaround Time:</span>
                      <Badge className="bg-blue-100 text-blue-800 capitalize">
                        {formData.turnaround === 'standard' && 'Standard (7-14 days)'}
                        {formData.turnaround === 'rush' && 'Rush (3-5 days)'}
                        {formData.turnaround === 'express' && 'Express (24-48 hours)'}
                      </Badge>
                    </div>
                    
                    {formData.budget && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Budget Range:</span>
                        <span className="font-semibold text-gray-900">{formData.budget}</span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Deliverables:</span>
                      <span className="font-semibold text-gray-900">{getTotalDeliverables()}+ items</span>
                    </div>
                  </div>
                </div>

                {/* Special Notes */}
                {formData.notes && (
                  <div className="bg-amber-50 rounded-xl p-5 border-2 border-amber-200">
                    <h3 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center text-sm">
                        !
                      </div>
                      Special Requirements
                    </h3>
                    <p className="text-sm text-amber-900 ml-10 leading-relaxed whitespace-pre-wrap">{formData.notes}</p>
                  </div>
                )}

                {/* ECJ Guarantee */}
                <div className="bg-gradient-to-r from-[#BDFF1C]/20 to-[#7fa589]/20 border-2 border-[#BDFF1C] rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#BDFF1C] flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#755f52] text-lg mb-2">What Happens Next?</h4>
                      <ul className="space-y-2 text-sm text-gray-700">
                        <li className="flex items-start gap-2">
                          <span className="text-[#BDFF1C] font-bold">1.</span>
                          <span>Your request will be reviewed by our team within 24 hours</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-[#BDFF1C] font-bold">2.</span>
                          <span>We'll match you with the best available talent for your event</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-[#BDFF1C] font-bold">3.</span>
                          <span>You'll receive a detailed quote and confirmation</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-[#BDFF1C] font-bold">4.</span>
                          <span>All work is backed by our quality guarantee</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Confirmation Message */}
                <div className="bg-gradient-to-br from-[#755f52]/5 to-[#c9a882]/5 rounded-xl p-5 border border-[#755f52]/20 text-center">
                  <p className="text-sm text-gray-700">
                    By submitting this request, you agree to ECJ's <span className="text-[#755f52] font-semibold cursor-pointer hover:underline">terms of service</span> and understand that final pricing will be provided after review.
                  </p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                disabled={step === 1}
                className="w-full sm:w-auto min-h-[44px] sm:min-h-0 sm:h-10 whitespace-nowrap order-2 sm:order-1"
              >
                <ArrowLeft className="w-4 h-4 sm:mr-2 shrink-0" />
                Previous
              </Button>

              {step < 4 ? (
                <Button
                  onClick={() => setStep(step + 1)}
                  disabled={(step === 1 && !canProceedStep1) || (step === 2 && !canProceedStep2)}
                  className="w-full sm:w-auto min-h-[44px] sm:min-h-0 sm:h-10 whitespace-nowrap order-1 sm:order-2"
                >
                  Next
                  <ArrowRight className="w-4 h-4 sm:ml-2 shrink-0" />
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit} 
                  className="bg-green-600 hover:bg-green-700 w-full sm:w-auto min-h-[44px] sm:min-h-0 sm:h-10 whitespace-nowrap order-1 sm:order-2"
                >
                  <span className="hidden sm:inline">Submit Request</span>
                  <span className="sm:hidden">Submit</span>
                  <Check className="w-4 h-4 sm:ml-2 shrink-0" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}