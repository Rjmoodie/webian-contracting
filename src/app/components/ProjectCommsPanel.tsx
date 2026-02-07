import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import { Badge } from '@/app/components/ui/badge';
import {
  MessageSquare,
  Send,
  Lock,
  Mail,
  Monitor,
  Settings,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { getSupabase } from '/utils/supabase/client';
import { api } from '/utils/supabase/api';

// ── Types ──────────────────────────────────────────────────
interface Message {
  id: string;
  project_id: string;
  sender_id: string | null;
  sender_name: string;
  sender_role: string;
  body: string;
  is_internal: boolean;
  source: 'panel' | 'email' | 'system';
  created_at: string;
}

interface ProjectCommsPanelProps {
  projectId: string;
  user: { id: string; name: string; role: string; email?: string };
  accessToken: string;
  /** Pre-loaded messages from the GET request (avoids double-fetch) */
  initialMessages?: Message[];
}

// ── Constants ──────────────────────────────────────────────
const SOURCE_ICONS: Record<string, typeof Mail> = {
  email: Mail,
  panel: Monitor,
  system: Settings,
};

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-800',
  manager: 'bg-blue-100 text-blue-800',
  client: 'bg-green-100 text-green-800',
  system: 'bg-gray-100 text-gray-600',
  external: 'bg-orange-100 text-orange-800',
};

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ── Component ──────────────────────────────────────────────
export default function ProjectCommsPanel({
  projectId,
  user,
  accessToken,
  initialMessages,
}: ProjectCommsPanelProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages ?? []);
  const [newMessage, setNewMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const isAdmin = user.role === 'admin' || user.role === 'manager';

  // ── Scroll helpers ─────────────────────────────────────
  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 100);
  }, []);

  // ── Load messages if not provided ──────────────────────
  useEffect(() => {
    if (initialMessages) return;
    (async () => {
      try {
        const res = await fetch(`${api('comms')}/${projectId}/messages`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages || []);
        }
      } catch (e) {
        console.error('[Comms] Failed to load messages:', e);
      }
    })();
  }, [projectId, accessToken, initialMessages]);

  // ── Realtime subscription ──────────────────────────────
  useEffect(() => {
    const supabase = getSupabase();
    const channel = supabase
      .channel(`project-messages:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'project_messages',
          filter: `project_id=eq.${projectId}`,
        },
        (payload: { new: Message }) => {
          const msg = payload.new as Message;
          // Skip internal messages for clients
          if (!isAdmin && msg.is_internal) return;
          setMessages((prev) => {
            // Avoid duplicates (optimistic insert may already exist)
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, isAdmin]);

  // ── Auto-scroll on new message ─────────────────────────
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom(true);
    }
  }, [messages.length, scrollToBottom]);

  // ── Send message ───────────────────────────────────────
  const handleSend = useCallback(async () => {
    const text = newMessage.trim();
    if (!text) return;

    setSending(true);

    // Optimistic insert
    const optimisticMsg: Message = {
      id: `temp-${Date.now()}`,
      project_id: projectId,
      sender_id: user.id,
      sender_name: user.name,
      sender_role: user.role,
      body: text,
      is_internal: isInternal,
      source: 'panel',
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setNewMessage('');

    try {
      const res = await fetch(`${api('comms')}/${projectId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ body: text, isInternal }),
      });

      if (!res.ok) {
        // Remove optimistic msg
        setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
        toast.error('Failed to send message');
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  }, [newMessage, isInternal, projectId, accessToken, user]);

  // ── Key handler (Ctrl+Enter to send) ──────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  // ── Group messages by date ─────────────────────────────
  const groupedMessages = useMemo(() => {
    const groups: { date: string; msgs: Message[] }[] = [];
    let currentDate = '';
    for (const m of messages) {
      const d = new Date(m.created_at).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });
      if (d !== currentDate) {
        currentDate = d;
        groups.push({ date: d, msgs: [] });
      }
      groups[groups.length - 1].msgs.push(m);
    }
    return groups;
  }, [messages]);

  return (
    <Card className="flex flex-col max-h-[600px] sm:max-h-[700px]">
      <CardHeader className="pb-3 border-b flex-shrink-0">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <MessageSquare className="w-5 h-5" />
          Communications
          {messages.length > 0 && (
            <Badge variant="secondary" className="ml-auto text-xs">
              {messages.length} message{messages.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </CardTitle>
        <p className="text-xs text-gray-500 mt-1">
          Messages sent here are also emailed. Email replies appear in this panel.
        </p>
      </CardHeader>

      {/* Message list — use wrapper div for ref/scroll (CardContent doesn't forward ref) */}
      <CardContent className="flex-1 min-h-[200px] relative flex flex-col p-0">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 space-y-1 min-h-[200px]"
        >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
            <MessageSquare className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm font-medium">No messages yet</p>
            <p className="text-xs mt-1">Start the conversation below</p>
          </div>
        ) : (
          groupedMessages.map((group) => (
            <div key={group.date}>
              {/* Date separator */}
              <div className="flex items-center gap-3 my-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">
                  {group.date}
                </span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {group.msgs.map((msg) => {
                const isOwn = msg.sender_id === user.id;
                const isSystem = msg.sender_role === 'system';
                const SourceIcon = SOURCE_ICONS[msg.source] || Monitor;

                if (isSystem) {
                  return (
                    <div key={msg.id} className="flex justify-center my-2">
                      <div className="bg-gray-50 border border-gray-100 rounded-full px-4 py-1.5 flex items-center gap-2">
                        <Settings className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">{msg.body}</span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 ${
                        isOwn
                          ? 'bg-[#E2582A] text-white rounded-br-md'
                          : msg.is_internal
                          ? 'bg-amber-50 border border-amber-200 rounded-bl-md'
                          : 'bg-white border border-gray-200 rounded-bl-md shadow-sm'
                      }`}
                    >
                      {/* Sender header */}
                      {!isOwn && (
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-xs font-semibold">
                            {msg.sender_name}
                          </span>
                          <Badge
                            className={`text-[10px] px-1.5 py-0 ${
                              ROLE_COLORS[msg.sender_role] || 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {msg.sender_role}
                          </Badge>
                          {msg.is_internal && (
                            <Lock className="w-3 h-3 text-amber-600" />
                          )}
                        </div>
                      )}

                      {/* Body */}
                      <p
                        className={`text-sm leading-relaxed whitespace-pre-wrap ${
                          isOwn ? 'text-white' : 'text-gray-800'
                        }`}
                      >
                        {msg.body}
                      </p>

                      {/* Footer */}
                      <div
                        className={`flex items-center gap-2 mt-1.5 ${
                          isOwn ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <SourceIcon
                          className={`w-3 h-3 ${
                            isOwn ? 'text-white/60' : 'text-gray-400'
                          }`}
                        />
                        <span
                          className={`text-[11px] ${
                            isOwn ? 'text-white/60' : 'text-gray-400'
                          }`}
                        >
                          {msg.source === 'email' ? 'via email' : ''}
                          {msg.source === 'email' ? ' · ' : ''}
                          {formatTime(msg.created_at)}
                        </span>
                        {isOwn && msg.is_internal && (
                          <Lock className="w-3 h-3 text-white/60" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={bottomRef} />

        {/* Scroll-to-bottom button (inside scroll area for sticky) */}
        {showScrollBtn && (
          <button
            onClick={() => scrollToBottom()}
            className="sticky bottom-2 left-1/2 -translate-x-1/2 bg-white border border-gray-200 shadow-lg rounded-full p-2 hover:bg-gray-50 transition-colors"
            aria-label="Scroll to latest"
          >
            <ChevronDown className="w-4 h-4 text-gray-600" />
          </button>
        )}
        </div>
      </CardContent>

      {/* Compose area */}
      <div className="border-t p-4 flex-shrink-0">
        {isAdmin && (
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => setIsInternal(!isInternal)}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
                isInternal
                  ? 'bg-amber-50 border-amber-300 text-amber-700'
                  : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              <Lock className="w-3 h-3" />
              {isInternal ? 'Internal note' : 'Visible to client'}
            </button>
          </div>
        )}

        <div className="flex gap-2">
          <Textarea
            placeholder={isInternal ? 'Internal note (admin-only)...' : 'Type a message...'}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            className="flex-1 resize-none min-h-[44px] cursor-text"
          />
          <Button
            onClick={handleSend}
            disabled={sending || !newMessage.trim()}
            className="self-end bg-[#E2582A] hover:bg-[#c74a22] text-white min-h-[44px] px-4"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-[11px] text-gray-400 mt-1.5">
          Press Ctrl+Enter to send · Replies to email notifications appear here
        </p>
      </div>
    </Card>
  );
}
