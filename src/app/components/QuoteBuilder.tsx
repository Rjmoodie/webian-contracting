import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Badge } from '@/app/components/ui/badge';
import { Plus, Trash2, Calculator, Send, DollarSign, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '/utils/supabase/api';

// ── Types ──────────────────────────────────────────────────
type SystemKey = 'gpsGridLayout' | 'dataCollection' | 'dataProcessing' | 'evaluationReporting';

interface LineItem {
  id: string;
  systemKey?: SystemKey;
  description: string;
  quantity: number;
  unitPrice: number;
  uom: string;
  category: 'initiation' | 'professional_service' | 'other';
}

interface QuoteBuilderProps {
  request: any;
  accessToken: string;
  onQuoteSent: () => void;
}

// ── Constants ──────────────────────────────────────────────
const RISK_PROFILES = [
  { value: 'low', label: 'Low', multiplier: 4 },
  { value: 'medium', label: 'Medium', multiplier: 5 },
  { value: 'high', label: 'High', multiplier: 7 },
] as const;

const UOM_OPTIONS = ['SQ M.', 'Days', 'Lump Sum', 'Hours', 'Each'] as const;

const SERVICE_RATE_FACTORS: Record<SystemKey, number> = {
  gpsGridLayout: 0.06,
  dataCollection: 0.37,
  dataProcessing: 0.23,
  evaluationReporting: 0.34,
};

const DRAFT_KEY = (requestId: string) => `quote-draft:${requestId}`;
const USD_RATE = 128.5;

const fmtJMD = (n: number) => (Number.isFinite(n) ? `$${Math.round(n).toLocaleString('en-US')}` : '$0');
const fmtUSD = (n: number) => (Number.isFinite(n) ? `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00');

function createEmptyLine(category: LineItem['category'] = 'professional_service'): LineItem {
  return {
    id: `li-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    description: '',
    quantity: 0,
    unitPrice: 0,
    uom: 'SQ M.',
    category,
  };
}

function createDefaultLines(surveyArea: number, effectiveFactor: number): LineItem[] {
  const sf = effectiveFactor;
  return [
    { id: 'li-1', systemKey: 'gpsGridLayout', description: 'GPS Grid Layout and Referencing', quantity: surveyArea, unitPrice: Math.round(sf * SERVICE_RATE_FACTORS.gpsGridLayout), uom: 'SQ M.', category: 'professional_service' },
    { id: 'li-2', systemKey: 'dataCollection', description: 'Increment Data Collection', quantity: surveyArea, unitPrice: Math.round(sf * SERVICE_RATE_FACTORS.dataCollection), uom: 'SQ M.', category: 'professional_service' },
    { id: 'li-3', systemKey: 'dataProcessing', description: 'Data Processing', quantity: surveyArea, unitPrice: Math.round(sf * SERVICE_RATE_FACTORS.dataProcessing), uom: 'SQ M.', category: 'professional_service' },
    { id: 'li-4', systemKey: 'evaluationReporting', description: 'Evaluation and Reporting', quantity: surveyArea, unitPrice: Math.round(sf * SERVICE_RATE_FACTORS.evaluationReporting), uom: 'SQ M.', category: 'professional_service' },
  ];
}

// ── Component ──────────────────────────────────────────────
export default function QuoteBuilder({ request, accessToken, onQuoteSent }: QuoteBuilderProps) {
  const surveyArea = Number(request?.survey_area_sqm ?? request?.surveyAreaSqm ?? 0) || 0;

  const [clearanceCost, setClearanceCost] = useState(Number(request?.clearance_access_cost) || 0);
  const [mobilizationCost, setMobilizationCost] = useState(Number(request?.mobilization_cost) || 0);
  const [accommodationCost, setAccommodationCost] = useState(Number(request?.accommodation_cost) || 0);
  const [serviceFactor, setServiceFactor] = useState(Number(request?.service_factor) || 200);
  const [riskProfile, setRiskProfile] = useState(request?.risk_profile ?? 'low');
  const [areaDiscounted, setAreaDiscounted] = useState(Number(request?.area_discounted_sqm) || 0);
  const [serviceHeadCount, setServiceHeadCount] = useState(Math.max(1, Number(request?.service_head_count) || 1));
  const [dataCollectionDays, setDataCollectionDays] = useState(Number(request?.data_collection_days) || 3);
  const [evaluationDays, setEvaluationDays] = useState(Number(request?.evaluation_days) || 5);
  const [estimatedWeeks, setEstimatedWeeks] = useState(Number(request?.estimated_weeks) || 3);
  const [discountAmount, setDiscountAmount] = useState(Number(request?.discount_amount) || 0);
  const [prepaymentPct, setPrepaymentPct] = useState(Math.min(100, Math.max(0, Number(request?.prepayment_pct) || 40)));
  const [adminNotes, setAdminNotes] = useState(request?.admin_notes ?? '');
  const [lineItems, setLineItems] = useState<LineItem[]>(() => {
    if (request?.lineItems?.length > 0) {
      return request.lineItems.map((li: any) => ({
        id: li.id || `li-${Math.random().toString(36).slice(2, 8)}`,
        systemKey: li.systemKey,
        description: li.description ?? '',
        quantity: Math.max(0, Number(li.quantity) || 0),
        unitPrice: Math.max(0, Number(li.unit_price ?? li.unitPrice) || 0),
        uom: li.uom || 'SQ M.',
        category: li.category || 'professional_service',
      }));
    }
    if (surveyArea > 0) {
      const riskMult = RISK_PROFILES.find(r => r.value === (request?.risk_profile ?? 'low'))?.multiplier ?? 4;
      const effectiveFactor = (request?.service_factor ?? 200) * (riskMult / 4);
      return createDefaultLines(surveyArea, effectiveFactor);
    }
    return [createEmptyLine()];
  });
  const [submitting, setSubmitting] = useState(false);

  const riskMult = RISK_PROFILES.find(r => r.value === riskProfile)?.multiplier ?? 4;
  const effectiveFactor = (serviceFactor || 0) * (riskMult / 4);

  // ── Draft persist ────────────────────────────────────────
  useEffect(() => {
    const key = DRAFT_KEY(request.id);
    const draft = {
      lineItems, clearanceCost, mobilizationCost, accommodationCost,
      serviceFactor, riskProfile, areaDiscounted, serviceHeadCount,
      dataCollectionDays, evaluationDays, estimatedWeeks,
      discountAmount, prepaymentPct, adminNotes,
    };
    try {
      localStorage.setItem(key, JSON.stringify(draft));
    } catch (_) {}
  }, [request.id, lineItems, clearanceCost, mobilizationCost, accommodationCost, serviceFactor, riskProfile, areaDiscounted, serviceHeadCount, dataCollectionDays, evaluationDays, estimatedWeeks, discountAmount, prepaymentPct, adminNotes]);

  useEffect(() => {
    const key = DRAFT_KEY(request.id);
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.lineItems?.length) setLineItems(d.lineItems);
      if (d.clearanceCost != null) setClearanceCost(Number(d.clearanceCost) || 0);
      if (d.mobilizationCost != null) setMobilizationCost(Number(d.mobilizationCost) || 0);
      if (d.accommodationCost != null) setAccommodationCost(Number(d.accommodationCost) || 0);
      if (d.serviceFactor != null) setServiceFactor(Number(d.serviceFactor) || 200);
      if (d.riskProfile != null) setRiskProfile(d.riskProfile);
      if (d.areaDiscounted != null) setAreaDiscounted(Number(d.areaDiscounted) || 0);
      if (d.serviceHeadCount != null) setServiceHeadCount(Math.max(1, Number(d.serviceHeadCount) || 1));
      if (d.dataCollectionDays != null) setDataCollectionDays(Number(d.dataCollectionDays) || 0);
      if (d.evaluationDays != null) setEvaluationDays(Number(d.evaluationDays) || 0);
      if (d.estimatedWeeks != null) setEstimatedWeeks(Number(d.estimatedWeeks) || 0);
      if (d.discountAmount != null) setDiscountAmount(Number(d.discountAmount) || 0);
      if (d.prepaymentPct != null) setPrepaymentPct(Math.min(100, Math.max(0, Number(d.prepaymentPct) || 0)));
      if (typeof d.adminNotes === 'string') setAdminNotes(d.adminNotes);
      toast.info('Draft restored');
    } catch (_) {}
  }, [request.id]);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(DRAFT_KEY(request.id));
      toast.success('Draft cleared');
    } catch (_) {}
  }, [request.id]);

  // ── Recalculate standard lines ────────────────────────────
  const recalcStandardLines = useCallback(() => {
    const sf = effectiveFactor;
    setLineItems(prev =>
      prev.map(li => {
        if (!li.systemKey) return li;
        const factor = SERVICE_RATE_FACTORS[li.systemKey];
        return {
          ...li,
          quantity: li.uom === 'SQ M.' ? surveyArea : li.quantity,
          unitPrice: Math.round(sf * factor),
        };
      })
    );
    toast.success('Standard service lines recalculated');
  }, [effectiveFactor, surveyArea]);

  // ── Totals ───────────────────────────────────────────────
  const totals = useMemo(() => {
    const lineSubtotal = lineItems.reduce((sum, li) => sum + li.quantity * li.unitPrice, 0);
    const initiation = clearanceCost + mobilizationCost + accommodationCost;
    const subtotal = lineSubtotal + initiation;
    const total = Math.max(0, subtotal - discountAmount);
    const usd = total / USD_RATE;
    const prepay = total * (prepaymentPct / 100);
    const balance = total - prepay;
    return { lineSubtotal, initiation, subtotal, total, usd, prepay, balance };
  }, [lineItems, clearanceCost, mobilizationCost, accommodationCost, discountAmount, prepaymentPct]);

  // ── Validation ───────────────────────────────────────────
  const validation = useMemo(() => {
    const hasAny = lineItems.some(li => (li.description ?? '').trim().length > 0);
    const badRows = lineItems.filter(
      li =>
        li.quantity < 0 ||
        li.unitPrice < 0 ||
        ((li.quantity > 0 || li.unitPrice > 0) && !(li.description ?? '').trim())
    );
    const subtotalBeforeDiscount =
      lineItems.reduce((s, li) => s + li.quantity * li.unitPrice, 0) + clearanceCost + mobilizationCost + accommodationCost;
    const discountTooHigh = discountAmount > subtotalBeforeDiscount;
    const totalNonPositive = subtotalBeforeDiscount - discountAmount <= 0;
    return { hasAny, badRows, discountTooHigh, totalNonPositive };
  }, [lineItems, clearanceCost, mobilizationCost, accommodationCost, discountAmount]);

  // ── Line helpers ──────────────────────────────────────────
  const updateLine = useCallback((id: string, field: keyof LineItem, value: unknown) => {
    setLineItems(prev => prev.map(li => (li.id === id ? { ...li, [field]: value } : li)));
  }, []);

  const addLine = useCallback((category: LineItem['category'] = 'professional_service') => {
    setLineItems(prev => [...prev, createEmptyLine(category)]);
  }, []);

  const addQuick = useCallback((description: string, uom: string) => {
    setLineItems(prev => [...prev, { ...createEmptyLine('other'), description, uom }]);
  }, []);

  const removeLine = useCallback((id: string) => {
    setLineItems(prev => prev.filter(li => li.id !== id));
  }, []);

  // ── Submit ───────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!validation.hasAny) {
      toast.error('Please add at least one line item');
      return;
    }
    if (validation.badRows.length > 0) {
      toast.error('Fix line items: add description or fix negative values');
      return;
    }
    if (validation.discountTooHigh) {
      toast.error('Discount cannot exceed subtotal');
      return;
    }
    if (validation.totalNonPositive) {
      toast.error('Total must be greater than $0');
      return;
    }
    if (!confirm(`Send quote for ${fmtJMD(totals.total)} JMD?`)) return;

    setSubmitting(true);
    try {
      const payload = {
        serviceFactor,
        riskProfile,
        riskMultiplier: riskMult,
        areaDiscountedSqm: areaDiscounted,
        clearanceAccessCost: clearanceCost,
        mobilizationCost,
        accommodationCost,
        serviceHeadCount,
        dataCollectionDays,
        evaluationDays,
        estimatedWeeks,
        discountAmount,
        prepaymentPct,
        notes: adminNotes,
        lineItems: lineItems
          .filter(li => (li.description ?? '').trim())
          .map((li, idx) => ({
            description: li.description.trim(),
            quantity: Math.max(0, li.quantity),
            unitPrice: Math.max(0, li.unitPrice),
            uom: li.uom,
            category: li.category,
            sortOrder: idx,
          })),
      };

      const res = await fetch(`${api('quotes')}/${request.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to generate quote');
      }

      try {
        localStorage.removeItem(DRAFT_KEY(request.id));
      } catch (_) {}
      toast.success('Quote sent to client');
      onQuoteSent();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to generate quote');
    } finally {
      setSubmitting(false);
    }
  }, [validation, totals, lineItems, serviceFactor, riskProfile, riskMult, areaDiscounted, clearanceCost, mobilizationCost, accommodationCost, serviceHeadCount, dataCollectionDays, evaluationDays, estimatedWeeks, discountAmount, prepaymentPct, adminNotes, request.id, accessToken, onQuoteSent]);

  const serviceItems = lineItems.filter(li => li.category === 'professional_service');
  const otherItems = lineItems.filter(li => li.category === 'other');

  const renderLineItems = (items: LineItem[], label: string, category: LineItem['category']) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">{label}</h4>
        <Button size="sm" variant="outline" onClick={() => addLine(category)} className="h-7 text-xs">
          <Plus className="w-3 h-3 mr-1" /> Add Row
        </Button>
      </div>
      {items.map(li => (
        <div key={li.id} className="border rounded-lg p-3 sm:border-0 sm:p-0 sm:rounded-none">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
            <div className="sm:col-span-5">
              <Label className="text-[10px] text-gray-400 sm:hidden">Description</Label>
              <Input
                placeholder="Description"
                value={li.description}
                onChange={e => updateLine(li.id, 'description', e.target.value)}
                className="text-sm cursor-text"
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-[10px] text-gray-400 sm:hidden">Qty</Label>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                placeholder="Qty"
                value={li.quantity || ''}
                onChange={e => updateLine(li.id, 'quantity', Math.max(0, Number(e.target.value) || 0))}
                className="text-sm cursor-text"
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-[10px] text-gray-400 sm:hidden">Unit (JMD)</Label>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                placeholder="Unit JMD"
                value={li.unitPrice || ''}
                onChange={e => updateLine(li.id, 'unitPrice', Math.max(0, Number(e.target.value) || 0))}
                className="text-sm cursor-text"
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-[10px] text-gray-400 sm:hidden">UOM</Label>
              <Select value={li.uom} onValueChange={v => updateLine(li.id, 'uom', v)}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {UOM_OPTIONS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-1 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700 whitespace-nowrap">{fmtJMD(li.quantity * li.unitPrice)}</span>
              <button type="button" onClick={() => removeLine(li.id)} className="text-red-400 hover:text-red-600 ml-1">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calculator className="w-5 h-5" />
          Build Quote — {request.eventName || request.project_name}
          {request.project_code && <Badge variant="secondary" className="ml-auto text-xs">{request.project_code}</Badge>}
        </CardTitle>
        <p className="text-xs text-gray-500 mt-1">
          Survey area: {surveyArea.toLocaleString()} sq m · Service factor: ${serviceFactor}/sq m
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          Effective factor: {effectiveFactor.toFixed(2)} / sq m (includes risk ×{riskMult})
        </p>
      </CardHeader>

      <CardContent className="space-y-6 p-4 sm:p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <Label className="text-xs">Service Factor ($/sq m)</Label>
            <Input type="number" inputMode="numeric" min={0} step={1} value={serviceFactor || ''} onChange={e => setServiceFactor(Math.max(0, Number(e.target.value) || 0))} className="cursor-text" />
          </div>
          <div>
            <Label className="text-xs">Risk Profile</Label>
            <Select value={riskProfile} onValueChange={setRiskProfile}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {RISK_PROFILES.map(r => <SelectItem key={r.value} value={r.value}>{r.label} (×{r.multiplier})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Head Count</Label>
            <Input type="number" inputMode="numeric" min={1} step={1} value={serviceHeadCount || ''} onChange={e => setServiceHeadCount(Math.max(1, Number(e.target.value) || 1))} className="cursor-text" />
          </div>
          <div>
            <Label className="text-xs">Area Discounted (sq m)</Label>
            <Input type="number" inputMode="numeric" min={0} step={1} value={areaDiscounted || ''} onChange={e => setAreaDiscounted(Math.max(0, Number(e.target.value) || 0))} className="cursor-text" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={recalcStandardLines} className="h-8 text-xs">
            <Calculator className="w-3 h-3 mr-1" /> Recalculate standard lines
          </Button>
          <Button size="sm" variant="ghost" onClick={clearDraft} className="h-8 text-xs text-gray-500">
            <RotateCcw className="w-3 h-3 mr-1" /> Clear draft
          </Button>
        </div>

        <div>
          <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">Initiation Costs (JMD)</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Site Clearance & Access</Label>
              <Input type="number" inputMode="numeric" min={0} step={1} value={clearanceCost || ''} onChange={e => setClearanceCost(Math.max(0, Number(e.target.value) || 0))} className="cursor-text" />
            </div>
            <div>
              <Label className="text-xs">Mobilization</Label>
              <Input type="number" inputMode="numeric" min={0} step={1} value={mobilizationCost || ''} onChange={e => setMobilizationCost(Math.max(0, Number(e.target.value) || 0))} className="cursor-text" />
            </div>
            <div>
              <Label className="text-xs">Accommodation</Label>
              <Input type="number" inputMode="numeric" min={0} step={1} value={accommodationCost || ''} onChange={e => setAccommodationCost(Math.max(0, Number(e.target.value) || 0))} className="cursor-text" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 mb-2">
            <span className="text-xs font-medium text-gray-500 w-full">Quick add:</span>
            <Button size="sm" variant="outline" onClick={() => addQuick('Travel / Transport', 'Lump Sum')} className="h-7 text-xs">+ Travel</Button>
            <Button size="sm" variant="outline" onClick={() => addQuick('Equipment Rental', 'Days')} className="h-7 text-xs">+ Equipment</Button>
            <Button size="sm" variant="outline" onClick={() => addQuick('Permits / Fees', 'Lump Sum')} className="h-7 text-xs">+ Permits</Button>
          </div>
          <div className="grid grid-cols-12 gap-2 text-xs text-gray-500 font-medium px-1 hidden sm:grid">
            <span className="col-span-5">Description</span>
            <span className="col-span-2">Qty</span>
            <span className="col-span-2">Unit (JMD)</span>
            <span className="col-span-2">UOM</span>
            <span className="col-span-1">Total</span>
          </div>
          {serviceItems.length > 0 && renderLineItems(serviceItems, 'Professional Service', 'professional_service')}
          {otherItems.length > 0 && renderLineItems(otherItems, 'Other', 'other')}
          {serviceItems.length === 0 && (
            <Button variant="outline" size="sm" onClick={() => addLine('professional_service')}>
              <Plus className="w-4 h-4 mr-1" /> Add Professional Service Line
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => addLine('other')} className="text-xs">
            <Plus className="w-3 h-3 mr-1" /> Add Other Line Item
          </Button>
        </div>

        <div>
          <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">Project Duration (Estimate)</h4>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Data Collection (days)</Label>
              <Input type="number" inputMode="numeric" min={0} step={1} value={dataCollectionDays || ''} onChange={e => setDataCollectionDays(Math.max(0, Number(e.target.value) || 0))} className="cursor-text" />
            </div>
            <div>
              <Label className="text-xs">Evaluation & Reporting (days)</Label>
              <Input type="number" inputMode="numeric" min={0} step={1} value={evaluationDays || ''} onChange={e => setEvaluationDays(Math.max(0, Number(e.target.value) || 0))} className="cursor-text" />
            </div>
            <div>
              <Label className="text-xs">Estimated Total (weeks)</Label>
              <Input type="number" inputMode="numeric" min={0} step={1} value={estimatedWeeks || ''} onChange={e => setEstimatedWeeks(Math.max(0, Number(e.target.value) || 0))} className="cursor-text" />
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 space-y-2 border">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Line Items Subtotal</span>
            <span className="font-semibold">{fmtJMD(totals.lineSubtotal)}</span>
          </div>
          {totals.initiation > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Initiation Costs</span>
              <span className="font-semibold">{fmtJMD(totals.initiation)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm border-t pt-2">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-bold">{fmtJMD(totals.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm items-center">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Discount</span>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                value={discountAmount || ''}
                onChange={e => setDiscountAmount(Math.max(0, Number(e.target.value) || 0))}
                className="w-28 h-7 text-xs cursor-text"
                placeholder="0"
              />
            </div>
            <span className="font-semibold text-red-600">-{fmtJMD(discountAmount)}</span>
          </div>
          {validation.discountTooHigh && <p className="text-xs text-red-600">Discount exceeds subtotal.</p>}
          <div className="flex justify-between text-base border-t pt-2 border-gray-300">
            <span className="font-bold text-gray-900">Total (JMD)</span>
            <span className="font-bold text-[#E2582A] text-lg">{fmtJMD(totals.total)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Total (USD ≈ {USD_RATE} JMD/USD)</span>
            <span className="text-gray-600">{fmtUSD(totals.usd)}</span>
          </div>
          <div className="border-t pt-2 mt-2 space-y-1">
            <div className="flex justify-between text-sm items-center">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={100}
                  step={1}
                  value={prepaymentPct || ''}
                  onChange={e => setPrepaymentPct(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                  className="w-16 h-7 text-xs cursor-text"
                />
                <span className="text-gray-600 text-xs">% Prior to Mobilization</span>
              </div>
              <span className="font-semibold">{fmtJMD(totals.prepay)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{100 - prepaymentPct}% on Report</span>
              <span className="font-semibold">{fmtJMD(totals.balance)}</span>
            </div>
          </div>
        </div>

        <div>
          <Label className="text-xs">Admin Notes (included in quote)</Label>
          <Textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} placeholder="Additional notes for the client..." rows={3} className="cursor-text" />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full bg-[#E2582A] hover:bg-[#c74a22] text-white min-h-[48px] text-base font-semibold"
        >
          {submitting ? (
            <span className="flex items-center gap-2"><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Generating Quote...</span>
          ) : (
            <span className="flex items-center gap-2"><Send className="w-4 h-4" /> Send Quote to Client</span>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
