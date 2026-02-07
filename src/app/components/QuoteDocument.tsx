import { useRef, useState, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Textarea } from '@/app/components/ui/textarea';
import { Download, CheckCircle2, XCircle, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { getBranding } from '@/app/config';
import { api } from '/utils/supabase/api';
import BrandLogo from '@/app/components/ECJLogo';

// ── Types ──────────────────────────────────────────────────
interface QuoteDocumentProps {
  request: any;
  lineItems: any[];
  user: { id: string; name: string; role: string };
  accessToken: string;
  onAction: () => void; // called after accept/reject to refresh
}

const fmtJMD = (n: number) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const fmtUSD = (n: number) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';

// ── Component ──────────────────────────────────────────────
export default function QuoteDocument({ request, lineItems, user, accessToken, onAction }: QuoteDocumentProps) {
  const quoteRef = useRef<HTMLDivElement>(null);
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const branding = getBranding();

  const isAdmin = user.role === 'admin' || user.role === 'manager';
  const isClient = user.role === 'client';
  const canRespond = isClient && request.status === 'quoted';

  // Group line items by category
  const groupedItems = useMemo(() => {
    const items = lineItems || [];
    return {
      initiation: items.filter((i: any) => i.category === 'initiation'),
      professional: items.filter((i: any) => i.category === 'professional_service'),
      other: items.filter((i: any) => i.category === 'other'),
    };
  }, [lineItems]);

  // ── Accept / Reject handlers ───────────────────────────
  const handleAccept = useCallback(async () => {
    setAccepting(true);
    try {
      const res = await fetch(`${api('quotes')}/${request.id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      toast.success('Quote accepted! The project will proceed.');
      onAction();
    } catch (e: any) {
      toast.error(e.message || 'Failed to accept quote');
    } finally {
      setAccepting(false);
    }
  }, [request.id, accessToken, onAction]);

  const handleReject = useCallback(async () => {
    setRejecting(true);
    try {
      const res = await fetch(`${api('quotes')}/${request.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ reason: rejectReason }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      toast.success('Quote declined.');
      setShowRejectDialog(false);
      onAction();
    } catch (e: any) {
      toast.error(e.message || 'Failed to decline quote');
    } finally {
      setRejecting(false);
    }
  }, [request.id, accessToken, rejectReason, onAction]);

  // ── PDF Download (client-side jsPDF) ───────────────────
  const handleDownloadPDF = useCallback(async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pw = doc.internal.pageSize.getWidth();
      const margin = 15;
      const headerH = 35;
      let y = 20;

      // Optional logo (same-origin or data URL)
      let logoDataUrl: string | null = null;
      const logoUrl = branding.logoUrl;
      if (logoUrl && typeof window !== 'undefined') {
        const fullUrl = logoUrl.startsWith('http') ? logoUrl : `${window.location.origin}${logoUrl.startsWith('/') ? '' : '/'}${logoUrl}`;
        try {
          logoDataUrl = await new Promise<string | null>((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              const canvas = document.createElement('canvas');
              canvas.width = img.naturalWidth;
              canvas.height = img.naturalHeight;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/png'));
              } else resolve(null);
            };
            img.onerror = () => resolve(null);
            img.src = fullUrl;
          });
        } catch (_) {
          logoDataUrl = null;
        }
      }

      const leftStart = logoDataUrl ? 35 : margin; // shift text right if logo

      // Header bar
      doc.setFillColor(226, 88, 42); // #E2582A
      doc.rect(0, 0, pw, headerH, 'F');
      if (logoDataUrl) {
        try {
          doc.addImage(logoDataUrl, 'PNG', 5, 4, 26, 26);
        } catch (_) {}
      }
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(branding.companyName || 'Webian Contracting', leftStart, 18);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(branding.tagline || 'Geotechnical & Geological Solutions', leftStart, 26);
      doc.text(branding.contactPhone || '', pw - margin, 18, { align: 'right' });
      doc.text(branding.contactEmail || '', pw - margin, 24, { align: 'right' });
      doc.text(branding.website || '', pw - margin, 30, { align: 'right' });

      y = 45;
      doc.setTextColor(51, 51, 51);

      // Quote ref + date
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`Project Quotation — ${request.project_code || ''}`, margin, y);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Date: ${fmtDate(request.quoted_at)}`, pw - margin, y, { align: 'right' });
      y += 10;

      // Client + Project info (two columns)
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('CLIENT', margin, y);
      doc.text('PROJECT', pw / 2 + 5, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      const clientLines = [
        `Name: ${request.clientName || request.client_name || ''}`,
        `Address: ${request.clientAddress || request.client_address || '—'}`,
        `Attn: ${request.client_contact || request.clientName || ''}`,
      ];
      const projectLines = [
        `Project Name: ${request.eventName || request.project_name || ''}`,
        `Project Address: ${request.venue || request.project_address || '—'}`,
        `Investigation Type: ${request.investigation_type || request.service_types?.name || '—'}`,
      ];
      clientLines.forEach((l, i) => { doc.text(l, margin, y + i * 5); });
      projectLines.forEach((l, i) => { doc.text(l, pw / 2 + 5, y + i * 5); });
      y += 20;

      // Line items table
      const tableBody: (string | number)[][] = [];

      if (request.clearance_access_cost > 0 || request.mobilization_cost > 0 || request.accommodation_cost > 0) {
        tableBody.push([{ content: 'INITIATION:', colSpan: 5, styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } } as any]);
        if (request.clearance_access_cost > 0) tableBody.push(['Site Clearance and Access', '', '', 'Days', fmtJMD(request.clearance_access_cost)]);
        if (request.mobilization_cost > 0) tableBody.push(['Mobilization of Equipment and Crew', '', '', 'Days', fmtJMD(request.mobilization_cost)]);
        if (request.accommodation_cost > 0) tableBody.push(['Accommodation and Subsistence', '', '', 'Days', fmtJMD(request.accommodation_cost)]);
      }

      if (groupedItems.professional.length > 0) {
        tableBody.push([{ content: 'PROFESSIONAL SERVICE:', colSpan: 5, styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } } as any]);
        groupedItems.professional.forEach((li: any) => {
          tableBody.push([
            li.description,
            Number(li.quantity || 0).toLocaleString(),
            fmtJMD(Number(li.unit_price || 0)),
            li.uom || 'SQ M.',
            fmtJMD(Number(li.total_price || 0)),
          ]);
        });
      }

      if (groupedItems.other.length > 0) {
        tableBody.push([{ content: 'OTHER:', colSpan: 5, styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } } as any]);
        groupedItems.other.forEach((li: any) => {
          tableBody.push([li.description, Number(li.quantity || 0).toLocaleString(), fmtJMD(Number(li.unit_price || 0)), li.uom || '', fmtJMD(Number(li.total_price || 0))]);
        });
      }

      autoTable(doc, {
        startY: y,
        head: [['Description', 'Qty', 'Unit Price', 'UOM', 'Total Price']],
        body: tableBody,
        margin: { left: margin, right: margin },
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [226, 88, 42], textColor: 255 },
        columnStyles: {
          0: { cellWidth: 70 },
          4: { halign: 'right', fontStyle: 'bold' },
        },
        theme: 'grid',
      });

      y = (doc as any).lastAutoTable.finalY + 8;

      // Duration
      if (request.data_collection_days || request.estimated_weeks) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('PROJECT DURATION (ESTIMATE)', margin, y);
        y += 5;
        doc.setFont('helvetica', 'normal');
        if (request.data_collection_days) { doc.text(`Data Collection: ${request.data_collection_days} days`, margin, y); y += 4; }
        if (request.evaluation_days) { doc.text(`Evaluation & Reporting: ${request.evaluation_days} days`, margin, y); y += 4; }
        if (request.estimated_weeks) { doc.text(`Estimated Total: ${request.estimated_weeks} weeks`, margin, y); y += 4; }
        y += 4;
      }

      // Totals — right-aligned
      const rightX = pw - margin;
      doc.setFontSize(10);
      const totalRows = [
        ['Subtotal', fmtJMD(request.subtotal)],
        ['Discount', `-${fmtJMD(request.discount_amount || 0)}`],
        [`${request.prepayment_pct || 40}% Prior to Mobilization`, fmtJMD(request.prepayment_amount)],
        [`${request.balance_pct || 60}% on Report`, fmtJMD(request.balance_amount)],
      ];
      totalRows.forEach(([label, val]) => {
        doc.setFont('helvetica', 'normal');
        doc.text(label, rightX - 70, y);
        doc.setFont('helvetica', 'bold');
        doc.text(val, rightX, y, { align: 'right' });
        y += 6;
      });

      y += 2;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Total (JMD)', rightX - 70, y);
      doc.setTextColor(226, 88, 42);
      doc.text(fmtJMD(request.total_cost_jmd), rightX, y, { align: 'right' });
      y += 6;
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('(USD)', rightX - 70, y);
      doc.text(fmtUSD(request.total_cost_usd), rightX, y, { align: 'right' });

      // Signature line
      y += 20;
      doc.setTextColor(51, 51, 51);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Yours Truly,', margin, y); y += 5;
      doc.text('Damian Moodie B.Eng (Construction), M.Eng (Civil), GPR Application and Analysis', margin, y);

      // Footer
      y += 15;
      doc.setDrawColor(200);
      doc.line(margin, y, pw - margin, y);
      y += 5;
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text('Payment Information — see platform for details or contact us.', margin, y);

      const fileName = `Quote_${request.project_code || request.id}_${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(fileName);
      toast.success('PDF downloaded');
    } catch (e) {
      console.error('PDF generation error:', e);
      toast.error('Failed to generate PDF');
    }
  }, [request, groupedItems, branding]);

  // ── Print ──────────────────────────────────────────────
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // Status badge
  const statusLabel = request.status?.replace(/_/g, ' ').toUpperCase();
  const statusIsQuoted = request.status === 'quoted';
  const statusIsAccepted = request.status === 'quote_accepted';
  const statusIsRejected = request.status === 'quote_rejected';

  return (
    <div className="space-y-4">
      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge className={`text-sm px-3 py-1.5 ${statusIsAccepted ? 'bg-green-100 text-green-800' : statusIsRejected ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
          {statusLabel}
        </Badge>
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="w-4 h-4 mr-1" /> Print
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
          <Download className="w-4 h-4 mr-1" /> Download PDF
        </Button>
        {canRespond && !showRejectDialog && (
          <>
            <Button onClick={handleAccept} disabled={accepting} className="bg-green-600 hover:bg-green-700 text-white min-h-[40px]">
              <CheckCircle2 className="w-4 h-4 mr-1" />
              {accepting ? 'Accepting...' : 'Accept Quote'}
            </Button>
            <Button onClick={() => setShowRejectDialog(true)} variant="outline" className="border-red-300 text-red-600 hover:bg-red-50 min-h-[40px]">
              <XCircle className="w-4 h-4 mr-1" /> Decline
            </Button>
          </>
        )}
      </div>

      {/* Decline reason dialog */}
      {showRejectDialog && (
        <Card className="border-red-200 bg-red-50/30">
          <CardContent className="p-4 space-y-3">
            <p className="text-sm font-semibold text-red-700">Reason for declining (optional)</p>
            <Textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Let us know why..."
              rows={3}
              className="cursor-text"
            />
            <div className="flex gap-2">
              <Button onClick={() => setShowRejectDialog(false)} variant="outline" size="sm">Cancel</Button>
              <Button onClick={handleReject} disabled={rejecting} className="bg-red-600 hover:bg-red-700 text-white" size="sm">
                {rejecting ? 'Declining...' : 'Confirm Decline'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Quote Document ─── */}
      <Card ref={quoteRef} className="print:shadow-none print:border-0">
        <CardContent className="p-6 sm:p-8 space-y-6">
          {/* Header with logo */}
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 print:block">
                <BrandLogo size="lg" className="max-h-14 w-auto" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#E2582A]">{branding.companyName || 'Webian Contracting'}</h2>
                <p className="text-sm text-gray-600">{branding.tagline}</p>
                <div className="text-xs text-gray-500 mt-2 space-y-0.5">
                  <p>{branding.contactPhone}</p>
                  <p>{branding.contactEmail}</p>
                  <p>{branding.website}</p>
                </div>
              </div>
            </div>
            <div className="text-right sm:text-right">
              <h3 className="text-lg font-bold text-gray-900">Project Quotation</h3>
              {request.project_code && <p className="text-base font-semibold text-[#E2582A]">{request.project_code}</p>}
              <p className="text-sm text-gray-600">Date: {fmtDate(request.quoted_at)}</p>
            </div>
          </div>

          {/* Client + Project info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-b py-4">
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Client</h4>
              <p className="text-sm font-semibold">{request.clientName || request.client_name}</p>
              <p className="text-sm text-gray-600">{request.clientAddress || request.client_address || '—'}</p>
              <p className="text-sm text-gray-600">Attn: {request.client_contact || request.clientName || ''}</p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Project</h4>
              <p className="text-sm font-semibold">{request.eventName || request.project_name}</p>
              <p className="text-sm text-gray-600">{request.venue || request.project_address || '—'}</p>
              <p className="text-sm text-gray-600">Investigation: {request.investigation_type || request.service_types?.name || '—'}</p>
            </div>
          </div>

          {/* Line items table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[#E2582A] text-white">
                  <th className="text-left px-3 py-2 rounded-tl-lg">Description</th>
                  <th className="text-right px-3 py-2">Qty</th>
                  <th className="text-right px-3 py-2">Unit Price</th>
                  <th className="text-center px-3 py-2">UOM</th>
                  <th className="text-right px-3 py-2 rounded-tr-lg">Total Price</th>
                </tr>
              </thead>
              <tbody>
                {/* Initiation */}
                {(Number(request.clearance_access_cost) > 0 || Number(request.mobilization_cost) > 0 || Number(request.accommodation_cost) > 0) && (
                  <>
                    <tr className="bg-gray-50"><td colSpan={5} className="px-3 py-1.5 font-bold text-gray-700 text-xs uppercase">Initiation</td></tr>
                    {Number(request.clearance_access_cost) > 0 && (
                      <tr className="border-b border-gray-100">
                        <td className="px-3 py-2">Site Clearance and Access</td>
                        <td className="px-3 py-2 text-right">—</td>
                        <td className="px-3 py-2 text-right">—</td>
                        <td className="px-3 py-2 text-center">Days</td>
                        <td className="px-3 py-2 text-right font-semibold">{fmtJMD(request.clearance_access_cost)}</td>
                      </tr>
                    )}
                    {Number(request.mobilization_cost) > 0 && (
                      <tr className="border-b border-gray-100">
                        <td className="px-3 py-2">Mobilization of Equipment and Crew</td>
                        <td className="px-3 py-2 text-right">—</td>
                        <td className="px-3 py-2 text-right">—</td>
                        <td className="px-3 py-2 text-center">Days</td>
                        <td className="px-3 py-2 text-right font-semibold">{fmtJMD(request.mobilization_cost)}</td>
                      </tr>
                    )}
                    {Number(request.accommodation_cost) > 0 && (
                      <tr className="border-b border-gray-100">
                        <td className="px-3 py-2">Accommodation and Subsistence</td>
                        <td className="px-3 py-2 text-right">—</td>
                        <td className="px-3 py-2 text-right">—</td>
                        <td className="px-3 py-2 text-center">Days</td>
                        <td className="px-3 py-2 text-right font-semibold">{fmtJMD(request.accommodation_cost)}</td>
                      </tr>
                    )}
                  </>
                )}

                {/* Professional Service */}
                {groupedItems.professional.length > 0 && (
                  <>
                    <tr className="bg-gray-50"><td colSpan={5} className="px-3 py-1.5 font-bold text-gray-700 text-xs uppercase">Professional Service</td></tr>
                    {groupedItems.professional.map((li: any) => (
                      <tr key={li.id} className="border-b border-gray-100">
                        <td className="px-3 py-2">{li.description}</td>
                        <td className="px-3 py-2 text-right">{Number(li.quantity || 0).toLocaleString()}</td>
                        <td className="px-3 py-2 text-right">{fmtJMD(Number(li.unit_price || 0))}</td>
                        <td className="px-3 py-2 text-center">{li.uom}</td>
                        <td className="px-3 py-2 text-right font-semibold">{fmtJMD(Number(li.total_price || 0))}</td>
                      </tr>
                    ))}
                  </>
                )}

                {/* Other */}
                {groupedItems.other.length > 0 && (
                  <>
                    <tr className="bg-gray-50"><td colSpan={5} className="px-3 py-1.5 font-bold text-gray-700 text-xs uppercase">Other</td></tr>
                    {groupedItems.other.map((li: any) => (
                      <tr key={li.id} className="border-b border-gray-100">
                        <td className="px-3 py-2">{li.description}</td>
                        <td className="px-3 py-2 text-right">{Number(li.quantity || 0).toLocaleString()}</td>
                        <td className="px-3 py-2 text-right">{fmtJMD(Number(li.unit_price || 0))}</td>
                        <td className="px-3 py-2 text-center">{li.uom}</td>
                        <td className="px-3 py-2 text-right font-semibold">{fmtJMD(Number(li.total_price || 0))}</td>
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* Duration estimate */}
          {(request.data_collection_days || request.estimated_weeks) && (
            <div className="text-sm text-gray-600 space-y-1 pt-2">
              <h4 className="font-bold text-gray-700 text-xs uppercase">Project Duration (Estimate)</h4>
              {request.data_collection_days && <p>Data Collection: {request.data_collection_days} days</p>}
              {request.evaluation_days && <p>Evaluation & Reporting: {request.evaluation_days} days</p>}
              {request.estimated_weeks && <p>Estimated Total: <strong>{request.estimated_weeks} weeks</strong></p>}
            </div>
          )}

          {/* Totals */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-semibold">{fmtJMD(request.subtotal)}</span>
            </div>
            {Number(request.discount_amount) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Discount</span>
                <span className="font-semibold text-red-600">-{fmtJMD(request.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{request.prepayment_pct || 40}% Prior to Mobilization</span>
              <span className="font-semibold">{fmtJMD(request.prepayment_amount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{request.balance_pct || 60}% on Report</span>
              <span className="font-semibold">{fmtJMD(request.balance_amount)}</span>
            </div>
            <div className="flex justify-between items-baseline border-t pt-3 mt-2">
              <span className="text-lg font-bold text-gray-900">Total (JMD)</span>
              <span className="text-2xl font-bold text-[#E2582A]">{fmtJMD(request.total_cost_jmd)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>(USD)</span>
              <span>{fmtUSD(request.total_cost_usd)}</span>
            </div>
          </div>

          {/* Admin notes */}
          {request.admin_notes && (
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">
              <p className="font-bold text-xs text-gray-500 uppercase mb-1">Notes</p>
              {request.admin_notes}
            </div>
          )}

          {/* Signature */}
          <div className="pt-6 text-sm text-gray-600">
            <p>Yours Truly,</p>
            <p className="font-semibold mt-1">Damian Moodie B.Eng (Construction), M.Eng (Civil), GPR Application and Analysis</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
