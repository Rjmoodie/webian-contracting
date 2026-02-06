import { Clock, User, FileText, CheckCircle2, XCircle, UserPlus, AlertCircle, MessageSquare, Edit3 } from 'lucide-react';
import { Badge } from '@/app/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';

interface ActivityLogProps {
  activities: Activity[];
  userRole?: string;
}

interface Activity {
  id: string;
  requestId: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  details?: any;
  oldValue?: any;
  newValue?: any;
  timestamp: string;
}

export default function ActivityLog({ activities, userRole }: ActivityLogProps) {
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'request_created':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'status_changed':
        return <Edit3 className="w-5 h-5 text-blue-600" />;
      case 'talents_assigned':
        return <UserPlus className="w-5 h-5 text-purple-600" />;
      case 'note_added':
        return <MessageSquare className="w-5 h-5 text-gray-600" />;
      case 'request_cancelled':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'request_created':
        return 'border-green-200 bg-green-50';
      case 'status_changed':
        return 'border-blue-200 bg-blue-50';
      case 'talents_assigned':
        return 'border-purple-200 bg-purple-50';
      case 'note_added':
        return 'border-gray-200 bg-gray-50';
      case 'request_cancelled':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'client':
        return 'bg-blue-100 text-blue-800';
      case 'admin':
        return 'bg-[#755f52] text-[#c9a882]';
      case 'manager':
        return 'bg-purple-100 text-purple-800';
      case 'talent':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatActionDescription = (activity: Activity) => {
    switch (activity.action) {
      case 'request_created':
        return (
          <div>
            <p className="font-semibold text-gray-900">Request Created</p>
            <p className="text-sm text-gray-600 mt-1">
              Event: <span className="font-medium">{activity.details?.eventName}</span>
              {activity.details?.parish && ` • ${activity.details.parish}`}
              {activity.details?.serviceCount && ` • ${activity.details.serviceCount} service${activity.details.serviceCount !== 1 ? 's' : ''}`}
            </p>
          </div>
        );
      
      case 'status_changed':
        return (
          <div>
            <p className="font-semibold text-gray-900">Status Changed</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge className="bg-gray-200 text-gray-700 text-xs capitalize">{activity.oldValue}</Badge>
              <span className="text-gray-400">→</span>
              <Badge className="bg-[#BDFF1C] text-white text-xs capitalize">{activity.newValue}</Badge>
            </div>
            {activity.details?.note && (
              <p className="text-sm text-gray-600 mt-2 italic">"{activity.details.note}"</p>
            )}
          </div>
        );
      
      case 'talents_assigned':
        return (
          <div>
            <p className="font-semibold text-gray-900">Talents Assigned</p>
            <p className="text-sm text-gray-600 mt-1">
              {activity.details?.talentCount} talent{activity.details?.talentCount !== 1 ? 's' : ''} assigned to this request
            </p>
            {activity.details?.talentNames && (
              <p className="text-xs text-gray-500 mt-1">
                {activity.details.talentNames.join(', ')}
              </p>
            )}
          </div>
        );
      
      case 'note_added':
        return (
          <div>
            <p className="font-semibold text-gray-900">
              Note Added
              {activity.details?.isInternal && (
                <Badge className="ml-2 bg-amber-100 text-amber-800 text-xs">Internal</Badge>
              )}
            </p>
            <p className="text-sm text-gray-600 mt-1 italic">
              "{activity.details?.notePreview}..."
            </p>
          </div>
        );
      
      case 'request_cancelled':
        return (
          <div>
            <p className="font-semibold text-gray-900">Request Cancelled</p>
            {activity.details?.reason && (
              <p className="text-sm text-gray-600 mt-1">
                Reason: <span className="italic">{activity.details.reason}</span>
              </p>
            )}
          </div>
        );
      
      default:
        return (
          <div>
            <p className="font-semibold text-gray-900 capitalize">{activity.action.replace(/_/g, ' ')}</p>
            {activity.details && (
              <p className="text-sm text-gray-600 mt-1">{JSON.stringify(activity.details)}</p>
            )}
          </div>
        );
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No activity recorded yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Activity Log
          <Badge className="ml-auto bg-gray-100 text-gray-700">{activities.length} {activities.length === 1 ? 'event' : 'events'}</Badge>
        </CardTitle>
        <p className="text-sm text-gray-600">Complete history of all changes and actions</p>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#BDFF1C] via-[#755f52] to-gray-300" />
          
          <div className="space-y-6">
            {activities.map((activity, index) => (
              <div key={activity.id} className="relative flex gap-4">
                {/* Icon */}
                <div className="relative z-10 flex-shrink-0 w-12 h-12 rounded-full bg-white border-2 border-[#BDFF1C] flex items-center justify-center shadow-sm">
                  {getActionIcon(activity.action)}
                </div>
                
                {/* Content */}
                <div className="flex-1 pb-4">
                  <div className={`border-2 rounded-xl p-4 ${getActionColor(activity.action)}`}>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="font-semibold text-gray-900">{activity.userName}</span>
                        <Badge className={`text-xs ${getRoleBadgeColor(activity.userRole)}`}>
                          {activity.userRole}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {formatTimestamp(activity.timestamp)}
                      </div>
                    </div>
                    
                    {/* Action Description */}
                    <div className="mt-2">
                      {formatActionDescription(activity)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
