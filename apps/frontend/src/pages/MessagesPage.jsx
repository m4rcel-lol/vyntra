import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Search, Send } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/common/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { socialService } from '@/services/social.service';
import { useAuthStore } from '@/stores/auth.store';
import { formatRelative } from '@/utils/format';
import { cn } from '@/lib/utils';

export default function MessagesPage() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const [selectedId, setSelectedId] = useState('');
  const [targetUsername, setTargetUsername] = useState('');
  const [body, setBody] = useState('');

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['messages', 'conversations'],
    queryFn: socialService.conversations,
    refetchInterval: 20_000,
  });
  const activeConversation = conversations.find((conversation) => conversation.id === selectedId) || conversations[0] || null;

  useEffect(() => {
    if (!selectedId && conversations[0]) setSelectedId(conversations[0].id);
  }, [conversations, selectedId]);

  const { data: detail } = useQuery({
    queryKey: ['messages', selectedId || activeConversation?.id],
    queryFn: () => socialService.conversation(selectedId || activeConversation.id),
    enabled: !!(selectedId || activeConversation?.id),
    refetchInterval: 15_000,
  });
  const friend = detail?.conversation?.friend || activeConversation?.friend || null;
  const messages = detail?.messages ?? [];

  const sendMessage = useMutation({
    mutationFn: () => socialService.sendMessage((friend?.username || targetUsername).trim(), body),
    onSuccess: async (result) => {
      setBody('');
      setTargetUsername('');
      setSelectedId(result.conversationId);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['messages', 'conversations'] }),
        queryClient.invalidateQueries({ queryKey: ['messages', result.conversationId] }),
      ]);
    },
    onError: (error) => toast.error(error.message || 'Could not send message'),
  });

  const recipient = friend?.username || targetUsername.trim();
  const canSend = recipient && body.trim() && !sendMessage.isPending;

  return (
    <DashboardLayout title="Messages" fluid>
      <div className="grid min-h-[calc(100vh-8rem)] gap-4 lg:grid-cols-[22rem_1fr]">
        <GlassCard className="overflow-hidden">
          <div className="border-b border-border p-4">
            <h2 className="font-display text-xl font-semibold">Friends chat</h2>
            <p className="text-sm text-muted-foreground">Messages are saved and delivered in realtime while you are online.</p>
            <div className="relative mt-4">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={targetUsername} onChange={(event) => setTargetUsername(event.target.value)} placeholder="Message @username" className="pl-9" />
            </div>
          </div>
          <div className="max-h-[64vh] overflow-y-auto p-2">
            {isLoading ? (
              <p className="p-4 text-sm text-muted-foreground">Loading conversations...</p>
            ) : conversations.length ? conversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                onClick={() => { setSelectedId(conversation.id); setTargetUsername(''); }}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-secondary/50',
                  activeConversation?.id === conversation.id && 'bg-secondary/70'
                )}
              >
                <img src={conversation.friend.avatar} alt={conversation.friend.displayName} className="h-10 w-10 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{conversation.friend.displayName}</p>
                  <p className="truncate text-xs text-muted-foreground">{conversation.lastMessage?.body || 'No messages yet'}</p>
                </div>
              </button>
            )) : (
              <div className="p-6 text-center text-sm text-muted-foreground">No conversations yet. Add a friend from their profile, then message them here.</div>
            )}
          </div>
        </GlassCard>

        <GlassCard className="flex min-h-[34rem] flex-col overflow-hidden">
          <div className="flex items-center gap-3 border-b border-border p-4">
            {friend ? (
              <>
                <img src={friend.avatar} alt={friend.displayName} className="h-10 w-10 rounded-xl object-cover" />
                <div className="min-w-0">
                  <h2 className="truncate font-display text-lg font-semibold">{friend.displayName}</h2>
                  <p className="text-xs text-muted-foreground">@{friend.username}</p>
                </div>
              </>
            ) : (
              <div>
                <h2 className="font-display text-lg font-semibold">Start a conversation</h2>
                <p className="text-xs text-muted-foreground">Enter an accepted friend username, then send a message.</p>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length ? messages.map((message) => {
              const mine = message.sender.id === currentUser?.id || message.sender.username === currentUser?.username;
              return (
                <div key={message.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                  <div className={cn('max-w-[82%] rounded-2xl border px-4 py-2.5 text-sm shadow-soft', mine ? 'border-white/15 bg-white text-black' : 'border-border bg-secondary/50')}>
                    <p className="whitespace-pre-wrap break-words">{message.body}</p>
                    <p className={cn('mt-1 text-[11px]', mine ? 'text-black/55' : 'text-muted-foreground')}>{formatRelative(message.createdAt)}</p>
                  </div>
                </div>
              );
            }) : (
              <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                <MessageCircle className="mb-3 h-10 w-10" />
                <p className="text-sm">No messages selected.</p>
              </div>
            )}
          </div>

          <form className="border-t border-border p-4" onSubmit={(event) => { event.preventDefault(); if (canSend) sendMessage.mutate(); }}>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Textarea value={body} onChange={(event) => setBody(event.target.value)} rows={2} placeholder={recipient ? `Message @${recipient}` : 'Choose a friend first'} className="min-h-12 flex-1 resize-none" />
              <Button type="submit" disabled={!canSend} className="sm:self-end">
                <Send className="h-4 w-4" /> Send
              </Button>
            </div>
          </form>
        </GlassCard>
      </div>
    </DashboardLayout>
  );
}
