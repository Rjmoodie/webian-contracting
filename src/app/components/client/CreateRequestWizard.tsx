import { useState, useEffect } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Badge } from '@/app/components/ui/badge';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, XCircle, MapPin, Ruler, HardHat, FileText, Paperclip } from 'lucide-react';
import { toast } from 'sonner';
import BrandLogo from '@/app/components/ECJLogo';
import GooglePlacesAutocomplete, { type PlaceResult } from '@/app/components/ui/google-places-autocomplete';
import { getSupabase } from '/utils/supabase/client';
import { api } from '/utils/supabase/api';

interface CreateRequestWizardProps {
  accessToken: string;
  onClose: () => void;
  onNavigate: (page: string) => void;
}

interface ServiceType {
  id: string;
  name: string;
  description: string;
  base_rate: number;
  discount_rate: number;
}

const MAX_ATTACHMENTS = 10;
const MAX_FILE_SIZE_MB = 10;

export default function CreateRequestWizard({ accessToken, onClose, onNavigate }: CreateRequestWizardProps) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [attachments, setAttachments] = useState<File[]>([]);

  const [formData, setFormData] = useState({
    // Client info (pre-filled where possible)
    clientAddress: '',
    clientAddressLat: null as number | null,
    clientAddressLng: null as number | null,
    clientAddressPlaceId: null as string | null,

    // Project details
    projectName: '',
    projectDescription: '',          // ← required detailed description
    projectLocation: '',
    projectAddress: '',
    projectAddressLat: null as number | null,
    projectAddressLng: null as number | null,
    projectAddressPlaceId: null as string | null,
    serviceTypeId: '',
    investigationType: '',
    surveyAreaSqm: '',

    // Site logistics
    clearanceAccess: false,
    mobilizationNeeded: false,
    mobilizationCost: '',
    accommodationNeeded: false,
    accommodationCost: '',
    serviceHeadCount: '1',

    // Additional
    notes: '',
  });

  useEffect(() => {
    fetchServiceTypes();
  }, []);

  const fetchServiceTypes = async () => {
    try {
      const response = await fetch(`${api('lookups')}/services`);
      if (response.ok) {
        const data = await response.json();
        setServiceTypes(data.services || []);
      }
    } catch (error) {
      console.error('Error fetching service types:', error);
    } finally {
      setLoadingServices(false);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        projectName: formData.projectName,
        projectDescription: formData.projectDescription,
        projectLocation: formData.projectLocation,
        projectAddress: formData.projectAddress || formData.projectLocation,
        projectAddressLat: formData.projectAddressLat,
        projectAddressLng: formData.projectAddressLng,
        projectAddressPlaceId: formData.projectAddressPlaceId,
        serviceTypeId: formData.serviceTypeId,
        investigationType: formData.investigationType || getSelectedServiceName(),
        surveyAreaSqm: formData.surveyAreaSqm ? parseFloat(formData.surveyAreaSqm) : null,
        clearanceAccess: formData.clearanceAccess,
        mobilizationNeeded: formData.mobilizationNeeded,
        mobilizationCost: formData.mobilizationCost ? parseFloat(formData.mobilizationCost) : 0,
        accommodationNeeded: formData.accommodationNeeded,
        accommodationCost: formData.accommodationCost ? parseFloat(formData.accommodationCost) : 0,
        serviceHeadCount: parseInt(formData.serviceHeadCount) || 1,
        clientAddress: formData.clientAddress || null,
        clientAddressLat: formData.clientAddressLat,
        clientAddressLng: formData.clientAddressLng,
        clientAddressPlaceId: formData.clientAddressPlaceId,
        notes: formData.notes || null,
      };

      const response = await fetch(`${api('projects')}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        const projectId = data.project?.id;

        if (projectId && attachments.length > 0) {
          const supabase = getSupabase();
          const uploaded: { file_path: string; file_name: string; file_size: number; content_type: string }[] = [];
          for (const file of attachments) {
            const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            const filePath = `${projectId}/${crypto.randomUUID()}_${safeName}`;
            const { error: uploadError } = await supabase.storage
              .from('request-attachments')
              .upload(filePath, file, { contentType: file.type || 'application/octet-stream', upsert: false });
            if (uploadError) {
              console.error('Upload error:', uploadError);
              toast.error(`Could not upload ${file.name}. Request was created.`);
              continue;
            }
            uploaded.push({
              file_path: filePath,
              file_name: file.name,
              file_size: file.size,
              content_type: file.type || '',
            });
          }
          if (uploaded.length > 0) {
            const attachRes = await fetch(`${api('projects')}/${projectId}/attachments`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
              body: JSON.stringify({ attachments: uploaded }),
            });
            if (!attachRes.ok) {
              toast.warning('Request created but some attachments could not be registered.');
            }
          }
        }

        toast.success('Request for Quote submitted successfully! Our team will review and prepare a quote.');
        onClose();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to submit request');
      }
    } catch (error) {
      console.error('Error submitting RFQ:', error);
      toast.error('Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const addAttachmentFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const maxBytes = MAX_FILE_SIZE_MB * 1024 * 1024;
    const next: File[] = [...attachments];
    for (let i = 0; i < files.length && next.length < MAX_ATTACHMENTS; i++) {
      const f = files[i];
      if (f.size > maxBytes) {
        toast.error(`${f.name} is over ${MAX_FILE_SIZE_MB}MB and was skipped.`);
        continue;
      }
      next.push(f);
    }
    if (next.length > MAX_ATTACHMENTS) {
      toast.warning(`Maximum ${MAX_ATTACHMENTS} files. Some were skipped.`);
      setAttachments(next.slice(0, MAX_ATTACHMENTS));
    } else {
      setAttachments(next);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const getSelectedServiceName = () => {
    const selected = serviceTypes.find(st => st.id === formData.serviceTypeId);
    return selected?.name || '';
  };

  const canProceedStep1 = formData.projectName.trim() && formData.projectDescription.trim() && formData.projectLocation;
  const canProceedStep2 = formData.serviceTypeId && formData.surveyAreaSqm;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 gap-2 sm:gap-4">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="flex items-center cursor-pointer shrink-0"
              aria-label="Webian Contracting – Home"
            >
              <BrandLogo size="xl" className="max-h-full" />
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
      <div className="h-24" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                  s < step ? 'bg-green-600 text-white' :
                  s === step ? 'bg-[#E2582A] text-white' :
                  'bg-gray-200 text-gray-600'
                }`}>
                  {s < step ? <Check className="w-5 h-5" /> : s}
                </div>
                {s < 4 && <div className={`w-12 sm:w-16 h-1 ${s < step ? 'bg-green-600' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-8 mt-3 text-xs text-gray-500">
            <span className={step === 1 ? 'text-[#E2582A] font-semibold' : ''}>Project Info</span>
            <span className={step === 2 ? 'text-[#E2582A] font-semibold' : ''}>Survey Details</span>
            <span className={step === 3 ? 'text-[#E2582A] font-semibold' : ''}>Site Logistics</span>
            <span className={step === 4 ? 'text-[#E2582A] font-semibold' : ''}>Review</span>
          </div>
        </div>

        {/* Step Content */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-gray-900">
              {step === 1 && 'Project Information'}
              {step === 2 && 'Survey & Service Details'}
              {step === 3 && 'Site Logistics'}
              {step === 4 && 'Review & Submit'}
            </CardTitle>
            <CardDescription>
              {step === 1 && 'Tell us about the project that needs surveying'}
              {step === 2 && 'Specify the type of investigation and area'}
              {step === 3 && 'Logistics details for mobilization and access'}
              {step === 4 && 'Review your Request for Quote before submitting'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* ── STEP 1: Project Information ── */}
            {step === 1 && (
              <>
                <div>
                  <Label htmlFor="projectName" className="font-semibold text-gray-900">
                    Project Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="projectName"
                    placeholder="e.g. CPFSA - Utility & Anomaly Scan"
                    value={formData.projectName}
                    onChange={(e) => updateFormData('projectName', e.target.value)}
                    className="mt-1 cursor-text"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="projectDescription" className="font-semibold text-gray-900">
                    Detailed Project Description <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="projectDescription"
                    placeholder="Describe the scope, objectives, and any specific requirements for this project. E.g. 'Conduct a GPR utility scan to identify underground utilities and anomalies before excavation begins. The site is a 3,500 sq m lot adjacent to a main road with known drainage infrastructure…'"
                    rows={5}
                    value={formData.projectDescription}
                    onChange={(e) => updateFormData('projectDescription', e.target.value)}
                    className="mt-1 cursor-text resize-none"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Include the project scope, objectives, site conditions, and any known constraints. This helps us prepare an accurate quote.
                  </p>
                  {formData.projectDescription.trim().length > 0 && formData.projectDescription.trim().length < 30 && (
                    <p className="text-xs text-amber-600 mt-1">
                      Please provide more detail — at least a few sentences about the project scope.
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="projectLocation" className="font-semibold text-gray-900">
                    Project Location / Parish <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="projectLocation"
                    placeholder="e.g. Kingston 13, Jamaica"
                    value={formData.projectLocation}
                    onChange={(e) => updateFormData('projectLocation', e.target.value)}
                    className="mt-1 cursor-text"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Parish, city, or region where the project is located</p>
                </div>

                <div>
                  <Label htmlFor="projectAddress" className="font-semibold text-gray-900">
                    Project Site Address
                  </Label>
                  <div className="mt-1">
                    <GooglePlacesAutocomplete
                      id="projectAddress"
                      value={formData.projectAddress}
                      onChange={(val) => updateFormData('projectAddress', val)}
                      onPlaceSelect={(place: PlaceResult) => {
                        updateFormData('projectAddress', place.formattedAddress);
                        updateFormData('projectAddressLat', place.lat);
                        updateFormData('projectAddressLng', place.lng);
                        updateFormData('projectAddressPlaceId', place.placeId);
                      }}
                      placeholder="Search for the project site address..."
                      countryRestriction="jm"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Start typing to search. The precise location will be used for logistics planning.
                  </p>
                  {formData.projectAddressLat && formData.projectAddressLng && (
                    <div className="flex items-center gap-1.5 mt-1.5 text-xs text-green-700 bg-green-50 rounded-lg px-2.5 py-1.5 w-fit">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Location verified ({formData.projectAddressLat.toFixed(5)}, {formData.projectAddressLng.toFixed(5)})</span>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="clientAddress" className="font-semibold text-gray-900">
                    Your Company / Billing Address
                  </Label>
                  <div className="mt-1">
                    <GooglePlacesAutocomplete
                      id="clientAddress"
                      value={formData.clientAddress}
                      onChange={(val) => updateFormData('clientAddress', val)}
                      onPlaceSelect={(place: PlaceResult) => {
                        updateFormData('clientAddress', place.formattedAddress);
                        updateFormData('clientAddressLat', place.lat);
                        updateFormData('clientAddressLng', place.lng);
                        updateFormData('clientAddressPlaceId', place.placeId);
                      }}
                      placeholder="Search for your company address..."
                      countryRestriction="jm"
                    />
                  </div>
                  {formData.clientAddressLat && formData.clientAddressLng && (
                    <div className="flex items-center gap-1.5 mt-1.5 text-xs text-green-700 bg-green-50 rounded-lg px-2.5 py-1.5 w-fit">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Location verified</span>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ── STEP 2: Survey Details ── */}
            {step === 2 && (
              <>
                <div>
                  <Label>Investigation / Service Type *</Label>
                  {loadingServices ? (
                    <div className="flex justify-center py-6">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E2582A]" />
                    </div>
                  ) : (
                    <div className="grid gap-3 mt-2">
                      {serviceTypes.map((st) => {
                        const isSelected = formData.serviceTypeId === st.id;
                        return (
                          <div
                            key={st.id}
                            className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                              isSelected
                                ? 'border-[#E2582A] bg-[#E2582A]/5 shadow-md'
                                : 'border-gray-200 hover:border-[#E2582A]/40 hover:shadow-sm'
                            }`}
                            onClick={() => {
                              updateFormData('serviceTypeId', st.id);
                              updateFormData('investigationType', st.name);
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                isSelected ? 'bg-[#E2582A] text-white' : 'bg-gray-100 text-gray-600'
                              }`}>
                                <HardHat className="w-5 h-5" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold text-gray-900">{st.name}</h4>
                                  {isSelected && <CheckCircle2 className="w-5 h-5 text-[#E2582A]" />}
                                </div>
                                {st.description && (
                                  <p className="text-sm text-gray-600 mt-0.5">{st.description}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="surveyAreaSqm">
                    <div className="flex items-center gap-2">
                      <Ruler className="w-4 h-4" />
                      Survey Area (sq metres) *
                    </div>
                  </Label>
                  <Input
                    id="surveyAreaSqm"
                    type="number"
                    placeholder="e.g. 3570"
                    value={formData.surveyAreaSqm}
                    onChange={(e) => updateFormData('surveyAreaSqm', e.target.value)}
                    className="mt-1 cursor-text"
                    min="0"
                    step="0.01"
                  />
                  <p className="text-xs text-gray-500 mt-1">Total area to be surveyed in square metres</p>
                </div>

                <div>
                  <Label htmlFor="investigationType">Investigation Type (optional override)</Label>
                  <Input
                    id="investigationType"
                    placeholder="Auto-filled from selection above"
                    value={formData.investigationType}
                    onChange={(e) => updateFormData('investigationType', e.target.value)}
                    className="mt-1 cursor-text"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Defaults to the service type above. Override if your investigation is more specific.
                  </p>
                </div>

                {/* Estimated area info */}
                {formData.surveyAreaSqm && parseFloat(formData.surveyAreaSqm) > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-900">
                        <p className="font-semibold mb-1">Area Summary</p>
                        <p>{parseFloat(formData.surveyAreaSqm).toLocaleString()} sq m
                          {parseFloat(formData.surveyAreaSqm) > 5000 && (
                            <Badge className="ml-2 bg-green-100 text-green-800 text-xs">
                              Volume discount eligible
                            </Badge>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── STEP 3: Site Logistics ── */}
            {step === 3 && (
              <>
                <div className="space-y-4">
                  {/* Clearance & Access */}
                  <div className="flex items-start gap-3 p-4 border rounded-xl border-gray-200">
                    <Checkbox
                      id="clearanceAccess"
                      checked={formData.clearanceAccess}
                      onCheckedChange={(checked) => updateFormData('clearanceAccess', !!checked)}
                      className="mt-1"
                    />
                    <div>
                      <Label htmlFor="clearanceAccess" className="cursor-pointer font-semibold text-gray-900">
                        Site Clearance & Access Required
                      </Label>
                      <p className="text-sm text-gray-600 mt-1">
                        Check if the site requires clearance, permissions, or special access arrangements
                      </p>
                    </div>
                  </div>

                  {/* Mobilization */}
                  <div className="p-4 border rounded-xl border-gray-200 space-y-3">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="mobilizationNeeded"
                        checked={formData.mobilizationNeeded}
                        onCheckedChange={(checked) => updateFormData('mobilizationNeeded', !!checked)}
                        className="mt-1"
                      />
                      <div>
                        <Label htmlFor="mobilizationNeeded" className="cursor-pointer font-semibold text-gray-900">
                          Mobilization Required
                        </Label>
                        <p className="text-sm text-gray-600 mt-1">
                          Equipment transport and crew deployment to site
                        </p>
                      </div>
                    </div>
                    {formData.mobilizationNeeded && (
                      <div className="ml-8">
                        <Label htmlFor="mobilizationCost" className="text-sm">
                          Estimated Mobilization Budget (JMD)
                        </Label>
                        <Input
                          id="mobilizationCost"
                          type="number"
                          placeholder="e.g. 45000"
                          value={formData.mobilizationCost}
                          onChange={(e) => updateFormData('mobilizationCost', e.target.value)}
                          className="mt-1 cursor-text"
                          min="0"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Leave blank if you'd prefer us to estimate
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Accommodation */}
                  <div className="p-4 border rounded-xl border-gray-200 space-y-3">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="accommodationNeeded"
                        checked={formData.accommodationNeeded}
                        onCheckedChange={(checked) => updateFormData('accommodationNeeded', !!checked)}
                        className="mt-1"
                      />
                      <div>
                        <Label htmlFor="accommodationNeeded" className="cursor-pointer font-semibold text-gray-900">
                          Accommodation & Subsistence Required
                        </Label>
                        <p className="text-sm text-gray-600 mt-1">
                          For remote or multi-day projects requiring overnight stays
                        </p>
                      </div>
                    </div>
                    {formData.accommodationNeeded && (
                      <div className="ml-8">
                        <Label htmlFor="accommodationCost" className="text-sm">
                          Estimated Accommodation Budget (JMD)
                        </Label>
                        <Input
                          id="accommodationCost"
                          type="number"
                          placeholder="e.g. 50000"
                          value={formData.accommodationCost}
                          onChange={(e) => updateFormData('accommodationCost', e.target.value)}
                          className="mt-1 cursor-text"
                          min="0"
                        />
                      </div>
                    )}
                  </div>

                  {/* Head count */}
                  <div>
                    <Label htmlFor="serviceHeadCount">Service Crew Head Count</Label>
                    <Select
                      value={formData.serviceHeadCount}
                      onValueChange={(val) => updateFormData('serviceHeadCount', val)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map(n => (
                          <SelectItem key={n} value={n.toString()}>
                            {n} {n === 1 ? 'person' : 'people'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      Estimated crew needed for this project (we'll confirm in the quote)
                    </p>
                  </div>

                  {/* Additional notes */}
                  <div>
                    <Label htmlFor="notes" className="font-semibold text-gray-900">
                      Additional Notes / Requirements
                    </Label>
                    <Textarea
                      id="notes"
                      placeholder="Any special requirements, access instructions, safety considerations, preferred schedule, etc."
                      rows={4}
                      value={formData.notes}
                      onChange={(e) => updateFormData('notes', e.target.value)}
                      className="mt-1 cursor-text resize-none"
                    />
                  </div>

                  {/* Attachments (optional) */}
                  <div className="p-4 border rounded-xl border-gray-200">
                    <Label className="font-semibold text-gray-900 flex items-center gap-2">
                      <Paperclip className="w-4 h-4" />
                      Attachments (optional)
                    </Label>
                    <p className="text-xs text-gray-500 mt-1 mb-2">
                      PDF, images, Word, Excel, or text. Max {MAX_FILE_SIZE_MB}MB per file, up to {MAX_ATTACHMENTS} files.
                    </p>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,image/jpeg,image/png,image/gif,image/webp"
                      onChange={(e) => addAttachmentFiles(e.target.files)}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border file:border-gray-300 file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100 cursor-pointer"
                    />
                    {attachments.length > 0 && (
                      <ul className="mt-3 space-y-1.5">
                        {attachments.map((file, i) => (
                          <li key={`${file.name}-${i}`} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                            <span className="truncate text-gray-700">{file.name}</span>
                            <span className="text-gray-500 shrink-0 ml-2">{(file.size / 1024).toFixed(1)} KB</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="shrink-0 h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => removeAttachment(i)}
                              aria-label={`Remove ${file.name}`}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* ── STEP 4: Review & Submit ── */}
            {step === 4 && (
              <div className="space-y-5">
                <div className="text-center pb-4 border-b border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Review Your Request for Quote</h3>
                  <p className="text-gray-600 text-sm">Please confirm the details below before submitting</p>
                </div>

                {/* Project Info */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#E2582A] text-white flex items-center justify-center text-xs font-bold">1</div>
                    Project Information
                  </h4>
                  <div className="space-y-3 text-sm ml-9">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Project Name:</span>
                      <span className="font-semibold text-gray-900">{formData.projectName}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 block mb-1">Description:</span>
                      <p className="text-gray-900 text-sm leading-relaxed whitespace-pre-wrap bg-white rounded-lg border border-gray-100 p-3">
                        {formData.projectDescription}
                      </p>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Location:</span>
                      <span className="font-semibold text-gray-900">{formData.projectLocation}</span>
                    </div>
                    {formData.projectAddress && (
                      <div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Site Address:</span>
                          <span className="font-semibold text-gray-900 text-right max-w-[60%]">{formData.projectAddress}</span>
                        </div>
                        {formData.projectAddressLat && formData.projectAddressLng && (
                          <div className="flex items-center gap-1.5 mt-1 text-xs text-green-700">
                            <MapPin className="w-3 h-3" />
                            <span>GPS: {formData.projectAddressLat.toFixed(5)}, {formData.projectAddressLng.toFixed(5)}</span>
                          </div>
                        )}
                      </div>
                    )}
                    {formData.clientAddress && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Your Address:</span>
                        <span className="font-semibold text-gray-900 text-right max-w-[60%]">{formData.clientAddress}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Survey Details */}
                <div className="bg-[#E2582A]/5 rounded-xl p-5 border border-[#E2582A]/20">
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#E2582A] text-white flex items-center justify-center text-xs font-bold">2</div>
                    Survey Details
                  </h4>
                  <div className="space-y-2 text-sm ml-9">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Service Type:</span>
                      <Badge className="bg-[#E2582A] text-white">{getSelectedServiceName()}</Badge>
                    </div>
                    {formData.investigationType && formData.investigationType !== getSelectedServiceName() && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Investigation Type:</span>
                        <span className="font-semibold text-gray-900">{formData.investigationType}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Survey Area:</span>
                      <span className="font-semibold text-gray-900">
                        {parseFloat(formData.surveyAreaSqm).toLocaleString()} sq m
                      </span>
                    </div>
                  </div>
                </div>

                {/* Logistics */}
                <div className="bg-white rounded-xl p-5 border border-gray-200">
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gray-800 text-white flex items-center justify-center text-xs font-bold">3</div>
                    Site Logistics
                  </h4>
                  <div className="space-y-2 text-sm ml-9">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Clearance & Access:</span>
                      <span className={`font-semibold ${formData.clearanceAccess ? 'text-green-700' : 'text-gray-500'}`}>
                        {formData.clearanceAccess ? 'Required' : 'Not needed'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mobilization:</span>
                      <span className={`font-semibold ${formData.mobilizationNeeded ? 'text-green-700' : 'text-gray-500'}`}>
                        {formData.mobilizationNeeded
                          ? (formData.mobilizationCost ? `JMD ${parseFloat(formData.mobilizationCost).toLocaleString()}` : 'Required (TBD)')
                          : 'Not needed'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Accommodation:</span>
                      <span className={`font-semibold ${formData.accommodationNeeded ? 'text-green-700' : 'text-gray-500'}`}>
                        {formData.accommodationNeeded
                          ? (formData.accommodationCost ? `JMD ${parseFloat(formData.accommodationCost).toLocaleString()}` : 'Required (TBD)')
                          : 'Not needed'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Crew Size:</span>
                      <span className="font-semibold text-gray-900">
                        {formData.serviceHeadCount} {parseInt(formData.serviceHeadCount) === 1 ? 'person' : 'people'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {formData.notes && (
                  <div className="bg-amber-50 rounded-xl p-5 border border-amber-200">
                    <h4 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Additional Notes
                    </h4>
                    <p className="text-sm text-amber-900 whitespace-pre-wrap">{formData.notes}</p>
                  </div>
                )}

                {/* Attachments */}
                {attachments.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                    <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                      <Paperclip className="w-5 h-5" />
                      Attachments ({attachments.length})
                    </h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {attachments.map((f, i) => (
                        <li key={`${f.name}-${i}`}>{f.name} ({(f.size / 1024).toFixed(1)} KB)</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* What happens next */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#E2582A] flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-2">What Happens Next?</h4>
                      <ul className="space-y-2 text-sm text-gray-700">
                        <li className="flex items-start gap-2">
                          <span className="text-[#E2582A] font-bold">1.</span>
                          <span>Our engineering team reviews your RFQ within 24–48 hours</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-[#E2582A] font-bold">2.</span>
                          <span>We prepare a detailed project quotation with pricing breakdown</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-[#E2582A] font-bold">3.</span>
                          <span>You review the quote and accept or request adjustments</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-[#E2582A] font-bold">4.</span>
                          <span>Upon acceptance, 40% prepayment secures your project schedule</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="text-center text-xs text-gray-500">
                  By submitting, you acknowledge that final pricing will be provided in the formal quotation.
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row justify-between gap-3 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                disabled={step === 1}
                className="w-full sm:w-auto min-h-[44px] sm:min-h-0 order-2 sm:order-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2 shrink-0" />
                Previous
              </Button>

              {step < 4 ? (
                <Button
                  onClick={() => setStep(step + 1)}
                  disabled={(step === 1 && !canProceedStep1) || (step === 2 && !canProceedStep2)}
                  className="w-full sm:w-auto min-h-[44px] sm:min-h-0 order-1 sm:order-2 bg-[#E2582A] hover:bg-[#c94a22]"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2 shrink-0" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full sm:w-auto min-h-[44px] sm:min-h-0 order-1 sm:order-2 bg-green-600 hover:bg-green-700"
                >
                  {submitting ? 'Submitting...' : 'Submit Request for Quote'}
                  {!submitting && <Check className="w-4 h-4 ml-2 shrink-0" />}
                </Button>
              )}
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
