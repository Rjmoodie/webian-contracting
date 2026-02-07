import { useMemo } from 'react';
import {
  Clock, User, CheckCircle2, XCircle, AlertCircle, MessageSquare,
  Edit3, FileText, Send, Mail, DollarSign, ThumbsUp, ThumbsDown, Zap,
} from 'lucide-react';
import { Badge } from '@/app/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';

/* ────────────────────────────────────────────────────── types */

interface Activity {
  id: string;
  project_id?: string;
  requestId?: string;
  user_id?: string;
  userId?: string;
  user_name?: string;
  userName?: string;
  user_role?: string;
  userRole?: string;
  action: string;
  old_value?: string;
  oldValue?: string;
  new_value?: string;
  newValue?: string;
  details?: Record<string, unknown> | null;
  created_at?: string;
  timestamp?: string;
}

interface ActivityLogProps {
  activities: Activity[];
  userRole?: string;
}

/* ────────────────────────────────────── normalise backend row */

function norm(a: Activity) {
  return {
    ...a,
    userName: a.user_name ?? a.userName ?? 'System',
    userRole: a.user_role ?? a.userRole ?? 'system',
    oldValue: a.old_value ?? a.oldValue ?? null,
    newValue: a.new_value ?? a.newValue ?? null,
    ts: a.created_at ?? a.timestamp ?? '',
  };
}

/* ──────────────────────────────────────── action → appearance */

type ActionMeta = {
  icon: React.ReactNode;
  label: string;
  dotColor: string; // tailwind ring/bg for the dot
  bgColor: string;  // card background
};

function actionMeta(action: string): ActionMeta {
  switch (action) {
    case 'rfq_submitted':
    case 'request_created':
      return { icon: <Send className="w-4 h-4" />, label: 'Request Submitted', dotColor: 'bg-blue-500 ring-blue-100', bgColor: 'bg-blue-50/60' };
    case 'status_changed':
      return { icon: <Edit3 className="w-4 h-4" />, label: 'Status Changed', dotColor: 'bg-amber-500 ring-amber-100', bgColor: 'bg-amber-50/60' };
    case 'quote_generated':
      return { icon: <DollarSign className="w-4 h-4" />, label: 'Quote Generated', dotColor: 'bg-emerald-500 ring-emerald-100', bgColor: 'bg-emerald-50/60' };
    case 'quote_accepted':
      return { icon: <ThumbsUp className="w-4 h-4" />, label: 'Quote Accepted', dotColor: 'bg-green-600 ring-green-100', bgColor: 'bg-green-50/60' };
    case 'quote_rejected':
      return { icon: <ThumbsDown className="w-4 h-4" />, label: 'Quote Declined', dotColor: 'bg-red-500 ring-red-100', bgColor: 'bg-red-50/60' };
    case 'note_added':
      return { icon: <MessageSquare className="w-4 h-4" />, label: 'Note Added', dotColor: 'bg-gray-500 ring-gray-200', bgColor: 'bg-gray-50/60' };
    case 'message_sent':
      return { icon: <MessageSquare className="w-4 h-4" />, label: 'Message Sent', dotColor: 'bg-indigo-500 ring-indigo-100', bgColor: 'bg-indigo-50/60' };
    case 'message_received_email':
      return { icon: <Mail className="w-4 h-4" />, label: 'Email Reply Received', dotColor: 'bg-violet-500 ring-violet-100', bgColor: 'bg-violet-50/60' };
    case 'project_cancelled':
    case 'request_cancelled':
      return { icon: <XCircle className="w-4 h-4" />, label: 'Cancelled', dotColor: 'bg-red-600 ring-red-100', bgColor: 'bg-red-50/60' };
    default:
      return { icon: <Zap className="w-4 h-4" />, label: action.replace(/_/g, ' '), dotColor: 'bg-gray-400 ring-gray-100', bgColor: 'bg-gray-50/60' };
  }
}

/* ──────────────────────────────────── human-readable details */

function formatMoney(v: unknown): string {
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function formatStatus(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function DetailLine({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-gray-600">
      <span className="font-medium text-gray-500">{label}</span>
      <span className="text-gray-800">{children}</span>
    </span>
  );
}

function renderDetails(action: string, details: Record<string, unknown> | null | undefined, oldValue?: string | null, newValue?: string | null) {
  if (action === 'status_changed' && (oldValue || newValue)) {
    return (
      <div className="flex flex-wrap items-center gap-2 mt-1.5">
        {oldValue && <Badge variant="outline" className="text-[11px] px-2 py-0.5 capitalize font-normal border-gray-300 text-gray-600">{formatStatus(oldValue)}</Badge>}
        <span className="text-gray-300 text-xs">→</span>
        {newValue && <Badge className="text-[11px] px-2 py-0.5 capitalize font-medium bg-primary/10 text-primary border border-primary/20">{formatStatus(newValue)}</Badge>}
        {details?.note && <p className="w-full text-xs text-gray-500 italic mt-1">&ldquo;{String(details.note)}&rdquo;</p>}
      </div>
    );
  }

  if (action === 'project_cancelled' || action === 'request_cancelled') {
    return (
      <div className="flex flex-wrap items-center gap-2 mt-1.5">
        {oldValue && <Badge variant="outline" className="text-[11px] px-2 py-0.5 capitalize font-normal border-gray-300 text-gray-600">{formatStatus(oldValue)}</Badge>}
        <span className="text-gray-300 text-xs">→</span>
        <Badge className="text-[11px] px-2 py-0.5 font-medium bg-red-100 text-red-700 border border-red-200">Cancelled</Badge>
        {details?.reason && <p className="w-full text-xs text-gray-500 mt-1">Reason: <span className="italic">{String(details.reason)}</span></p>}
      </div>
    );
  }

  if (action === 'quote_generated' && details) {
    const items: React.ReactNode[] = [];
    if (details.totalJmd != null) items.push(<DetailLine key="jmd" label="Total">J${formatMoney(details.totalJmd)}</DetailLine>);
    if (details.totalUsd != null) items.push(<DetailLine key="usd" label="USD">US${formatMoney(details.totalUsd)}</DetailLine>);
    if (details.lineItemCount != null) items.push(<DetailLine key="items" label="Items">{String(details.lineItemCount)}</DetailLine>);
    return items.length > 0 ? <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">{items}</div> : null;
  }

  if (action === 'quote_rejected' && details?.reason) {
    return <p className="text-xs text-gray-500 mt-1.5">Reason: <span className="italic">{String(details.reason)}</span></p>;
  }

  if (action === 'rfq_submitted' || action === 'request_created') {
    if (!details) return null;
    const items: React.ReactNode[] = [];
    if (details.projectName) items.push(<DetailLine key="name" label="Project">{String(details.projectName)}</DetailLine>);
    if (details.eventName) items.push(<DetailLine key="event" label="Event">{String(details.eventName)}</DetailLine>);
    if (details.surveyAreaSqm) items.push(<DetailLine key="area" label="Area">{formatMoney(details.surveyAreaSqm)} m²</DetailLine>);
    if (details.parish) items.push(<DetailLine key="parish" label="Location">{String(details.parish)}</DetailLine>);
    return items.length > 0 ? <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">{items}</div> : null;
  }

  if ((action === 'note_added' || action === 'message_sent') && details) {
    const body = String(details.body ?? details.note ?? details.notePreview ?? '');
    const preview = body.length > 120 ? body.slice(0, 120) + '…' : body;
    return (
      <div className="mt-1.5">
        {details.isInternal && <Badge className="text-[10px] bg-amber-100 text-amber-700 border border-amber-200 mr-2">Internal</Badge>}
        {preview && <p className="text-xs text-gray-500 italic">&ldquo;{preview}&rdquo;</p>}
      </div>
    );
  }

  if (action === 'message_received_email' && details) {
    const items: React.ReactNode[] = [];
    if (details.from) items.push(<DetailLine key="from" label="From">{String(details.from)}</DetailLine>);
    if (details.subject) items.push(<DetailLine key="subj" label="Subject">{String(details.subject)}</DetailLine>);
    return items.length > 0 ? <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">{items}</div> : null;
  }

  // Fallback: render each key as a detail line (skip huge values)
  if (details && Object.keys(details).length > 0) {
    const entries = Object.entries(details).filter(([, v]) => v != null && String(v).length < 200);
    if (entries.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
        {entries.map(([k, v]) => (
          <DetailLine key={k} label={k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}>{String(v)}</DetailLine>
        ))}
      </div>
    );
  }

  return null;
}

/* ──────────────────────────────────────── relative timestamp */

function relativeTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const now = Date.now();
  const diff = now - d.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined });
}

function fullDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/* ──────────────────────────────────── role badge color */

function roleBadge(role: string) {
  const map: Record<string, string> = {
    admin: 'bg-secondary text-secondary-foreground',
    manager: 'bg-purple-100 text-purple-700',
    client: 'bg-blue-100 text-blue-700',
    talent: 'bg-green-100 text-green-700',
    system: 'bg-gray-100 text-gray-500',
  };
  return map[role] ?? 'bg-gray-100 text-gray-600';
}

/* ──────────────────────────────────────────── component */

export default function ActivityLog({ activities }: ActivityLogProps) {
  const sorted = useMemo(
    () => [...activities].sort((a, b) => new Date(b.created_at ?? b.timestamp ?? 0).getTime() - new Date(a.created_at ?? a.timestamp ?? 0).getTime()),
    [activities],
  );

  if (!sorted.length) {
    return (
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="w-4 h-4 text-gray-500" />
            Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10 text-gray-400">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No activity recorded yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="w-4 h-4 text-gray-500" />
            Activity Log
          </CardTitle>
          <span className="text-xs font-medium text-gray-500 bg-gray-100 rounded-full px-2.5 py-0.5">{sorted.length}</span>
        </div>
      </CardHeader>

      <CardContent className="pt-1 pb-4">
        <ol className="relative ml-3">
          {/* Vertical timeline line */}
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-200" aria-hidden="true" />

          {sorted.map((raw, idx) => {
            const a = norm(raw);
            const meta = actionMeta(a.action);
            const isLast = idx === sorted.length - 1;

            return (
              <li key={a.id ?? idx} className={`relative pl-7 ${isLast ? '' : 'pb-5'}`}>
                {/* Dot */}
                <span
                  className={`absolute left-0 top-[5px] flex h-[15px] w-[15px] items-center justify-center rounded-full ring-[3px] ring-white ${meta.dotColor} text-white`}
                  aria-hidden="true"
                >
                  {/* Tiny inner icon is too small at 15px; leave it as colored dot */}
                </span>

                {/* Card */}
                <div className={`rounded-lg border border-gray-100 px-3.5 py-2.5 ${meta.bgColor} transition-colors hover:border-gray-200`}>
                  {/* Top row: label + timestamp */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-gray-600">{meta.icon}</span>
                      <span className="text-sm font-semibold text-gray-900 capitalize">{meta.label}</span>
                    </div>
                    <time
                      dateTime={a.ts}
                      title={fullDate(a.ts)}
                      className="shrink-0 text-[11px] text-gray-400 tabular-nums cursor-default"
                    >
                      {relativeTime(a.ts)}
                    </time>
                  </div>

                  {/* Details */}
                  {renderDetails(a.action, a.details, a.oldValue, a.newValue)}

                  {/* Author row */}
                  <div className="flex items-center gap-1.5 mt-2">
                    <User className="w-3 h-3 text-gray-400" />
                    <span className="text-[11px] text-gray-500">{a.userName}</span>
                    <Badge className={`text-[10px] px-1.5 py-0 leading-4 font-normal ${roleBadge(a.userRole)}`}>
                      {a.userRole}
                    </Badge>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
