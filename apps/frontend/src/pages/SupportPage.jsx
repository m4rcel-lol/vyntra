import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bot, Headphones, Lock, Plus, Send } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/common/GlassCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supportService } from '@/services/support.service';
import { formatRelative } from '@/utils/format';
import { cn } from '@/lib/utils';

const statusLabel = {
  bot: 'Bot triage',
  waiting_for_staff: 'Waiting for staff',
  active: 'Staff joined',
  closed: 'Closed',
};

export default function SupportPage() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState('');
  const [subject, setSubject] = useState('');
  const [firstMessage, setFirstMessage] = useState('');
  const [body, setBody] = useState('');
  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['support', 'me'],
    queryFn: supportService.myConversations,
    refetchInterval: 15_000,
  });
  const active = conversations.find((conversation) => conversation.id === selectedId) || conversations[0] || null;

  useEffect(() => {
    if (!selectedId && conversations[0]) setSelectedId(conversations[0].id);
  }, [conversations, selectedId]);

  const refresh = async () => queryClient.invalidateQueries({ queryKey: ['support', 'me'] });

  const createConversation = useMutation({
    mutationFn: () => supportService.create({ subject, message: firstMessage }),
    onSuccess: async (conversation) => {
      setSelectedId(conversation.id);
      setSubject('');
      setFirstMessage('');
      toast.success('Support chat created');
      await refresh();
    },
    onError: (error) => toast.error(error.message || 'Could not create support chat'),
  });

  const sendMessage = useMutation({
    mutationFn: () => supportService.sendMessage(active.id, body),
    onSuccess: async () => {
      setBody('');
      await refresh();
    },
    onError: (error) => toast.error(error.message || 'Could not send message'),
  });

  const escalate = useMutation({
    mutationFn: () => supportService.escalate(active.id),
    onSuccess: async () => {
      toast.success('Sent to staff queue');
      await refresh();
    },
    onError: (error) => toast.error(error.message || 'Could not escalate chat'),
  });

  const inputLocked = active?.status === 'waiting_for_staff' || active?.status === 'closed';

  return (
    <DashboardLayout title="Support" fluid>
      <div className="grid gap-4 lg:grid-cols-[22rem_1fr]">
        <GlassCard className="overflow-hidden">
          <div className="border-b border-border p-4">
            <h2 className="font-display text-xl font-semibold">Support chats</h2>
            <p className="text-sm text-muted-foreground">Ask the assistant first, then request staff when needed.</p>
          </div>
          <div className="max-h-72 overflow-y-auto p-2 lg:max-h-[30rem]">
            {isLoading ? (
              <p className="p-4 text-sm text-muted-foreground">Loading chats...</p>
            ) : conversations.length ? conversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                onClick={() => setSelectedId(conversation.id)}
                className={cn('w-full rounded-xl p-3 text-left transition-colors hover:bg-secondary/50', active?.id === conversation.id && 'bg-secondary/70')}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium">{conversation.subject}</p>
                  <Badge variant="outline" className="shrink-0">{statusLabel[conversation.status] || conversation.status}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{formatRelative(conversation.updatedAt)}</p>
              </button>
            )) : (
              <div className="p-6 text-center text-sm text-muted-foreground">No support chats yet.</div>
            )}
          </div>
          <form className="space-y-3 border-t border-border p-4" onSubmit={(event) => { event.preventDefault(); createConversation.mutate(); }}>
            <p className="flex items-center gap-2 text-sm font-medium"><Plus className="h-4 w-4" /> New issue</p>
            <Input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Short subject" />
            <Textarea rows={4} value={firstMessage} onChange={(event) => setFirstMessage(event.target.value)} placeholder="What happened? Include page, steps, and exact error." />
            <Button type="submit" disabled={createConversation.isPending || !subject.trim() || !firstMessage.trim()} className="w-full">
              {createConversation.isPending ? 'Creating...' : 'Start support chat'}
            </Button>
          </form>
        </GlassCard>

        <GlassCard className="flex min-h-[36rem] flex-col overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-border p-4">
            <div className="min-w-0">
              <h2 className="truncate font-display text-xl font-semibold">{active?.subject || 'Select a chat'}</h2>
              <p className="text-sm text-muted-foreground">
                {active?.assignedStaff ? `Staff: @${active.assignedStaff.username}` : active ? statusLabel[active.status] : 'Support conversations are saved for staff review.'}
              </p>
            </div>
            {active && active.status === 'bot' && (
              <Button variant="outline" onClick={() => escalate.mutate()} disabled={escalate.isPending}>
                <Headphones className="h-4 w-4" /> Speak with staff
              </Button>
            )}
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {active?.messages?.length ? active.messages.map((message) => {
              const bot = message.authorRole === 'bot';
              const staff = message.authorRole === 'staff';
              return (
                <div key={message.id} className={cn('flex', staff ? 'justify-end' : 'justify-start')}>
                  <div className={cn('max-w-[84%] rounded-2xl border px-4 py-2.5 text-sm shadow-soft', staff ? 'border-white/15 bg-white text-black' : bot ? 'border-border bg-secondary/70' : 'border-border bg-secondary/35')}>
                    <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide opacity-70">
                      {bot && <Bot className="h-3.5 w-3.5" />}
                      {bot ? 'Vyntra Assist' : staff ? message.author?.displayName || 'Staff' : message.author?.displayName || 'You'}
                    </div>
                    <p className="whitespace-pre-wrap break-words">{message.body}</p>
                    <p className={cn('mt-1 text-[11px]', staff ? 'text-black/55' : 'text-muted-foreground')}>{formatRelative(message.createdAt)}</p>
                  </div>
                </div>
              );
            }) : (
              <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                <Headphones className="mb-3 h-10 w-10" />
                <p className="text-sm">Create or select a support chat.</p>
              </div>
            )}
          </div>

          <form className="border-t border-border p-4" onSubmit={(event) => { event.preventDefault(); if (active && body.trim()) sendMessage.mutate(); }}>
            {inputLocked && (
              <div className="mb-3 flex items-center gap-2 rounded-xl border border-border bg-secondary/30 px-3 py-2 text-xs text-muted-foreground">
                <Lock className="h-3.5 w-3.5" /> {active.status === 'waiting_for_staff' ? 'Waiting for a staff representative to accept this chat.' : 'This support chat is closed.'}
              </div>
            )}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Textarea value={body} onChange={(event) => setBody(event.target.value)} rows={2} disabled={!active || inputLocked} placeholder={active ? 'Write a reply...' : 'Select a support chat'} className="min-h-12 flex-1 resize-none" />
              <Button type="submit" disabled={!active || inputLocked || !body.trim() || sendMessage.isPending} className="sm:self-end">
                <Send className="h-4 w-4" /> Send
              </Button>
            </div>
          </form>
        </GlassCard>
      </div>
    </DashboardLayout>
  );
}
