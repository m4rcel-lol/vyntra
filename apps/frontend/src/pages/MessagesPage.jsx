import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Download,
  File as FileIcon,
  Loader2,
  MessageCircle,
  Mic,
  MicOff,
  Paperclip,
  Phone,
  PhoneCall,
  PhoneOff,
  Reply,
  Search,
  Send,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/common/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { socialService } from '@/services/social.service';
import { filesService } from '@/services/files.service';
import { emitRealtime, subscribeRealtime } from '@/services/realtime.service';
import { useAuthStore } from '@/stores/auth.store';
import { formatRelative } from '@/utils/format';
import { cn } from '@/lib/utils';

const CALL_ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];

export default function MessagesPage() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedId, setSelectedId] = useState(searchParams.get('conversation') || '');
  const [targetUsername, setTargetUsername] = useState('');
  const [body, setBody] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});
  const [callState, setCallState] = useState('idle');
  const [incomingCall, setIncomingCall] = useState(null);
  const [callConversationId, setCallConversationId] = useState('');
  const [callStartedAt, setCallStartedAt] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const typingClearTimersRef = useRef({});
  const activeConversationIdRef = useRef('');
  const callConversationIdRef = useRef('');
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const ringtoneRef = useRef(null);

  const { data: conversations = [], isLoading, isError: conversationsError, error: conversationsErrorValue } = useQuery({
    queryKey: ['messages', 'conversations'],
    queryFn: socialService.conversations,
    refetchInterval: 20_000,
  });
  const manualRecipient = targetUsername.trim();
  const activeConversation = selectedId
    ? conversations.find((conversation) => conversation.id === selectedId) || null
    : manualRecipient
      ? null
      : conversations[0] || null;
  const activeConversationId = selectedId || activeConversation?.id || '';

  useEffect(() => {
    const fromUrl = searchParams.get('conversation') || '';
    if (fromUrl && fromUrl !== selectedId) setSelectedId(fromUrl);
  }, [searchParams, selectedId]);

  useEffect(() => {
    if (selectedId && !isLoading && conversations.length && !conversations.some((conversation) => conversation.id === selectedId)) {
      setSelectedConversation(conversations[0].id);
      return;
    }
    if (!selectedId && !manualRecipient && conversations[0]) {
      setSelectedConversation(conversations[0].id);
    }
  }, [conversations, isLoading, manualRecipient, selectedId]);

  const { data: detail, isError: detailError, error: detailErrorValue } = useQuery({
    queryKey: ['messages', activeConversationId],
    queryFn: () => socialService.conversation(activeConversationId),
    enabled: !!activeConversationId && !!activeConversation,
    refetchInterval: 15_000,
  });
  const friend = detail?.conversation?.friend || activeConversation?.friend || null;
  const messages = detail?.messages ?? [];
  const callConversation = callConversationId
    ? conversations.find((conversation) => conversation.id === callConversationId) || null
    : null;
  const callFriend = callConversation?.friend
    || (callConversationId === activeConversationId ? friend : null)
    || (incomingCall?.from
      ? {
          username: incomingCall.from.username,
          displayName: incomingCall.from.username,
          avatar: null,
        }
      : null);

  const typingNames = useMemo(
    () => Object.values(typingUsers).filter(Boolean).join(', '),
    [typingUsers]
  );

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  useEffect(() => {
    callConversationIdRef.current = callConversationId;
  }, [callConversationId]);

  useEffect(() => {
    if (callState !== 'connected' || !callStartedAt) {
      setCallDuration(0);
      return undefined;
    }
    const updateDuration = () => setCallDuration(Math.max(0, Math.floor((Date.now() - callStartedAt) / 1000)));
    updateDuration();
    const interval = window.setInterval(updateDuration, 1000);
    return () => window.clearInterval(interval);
  }, [callStartedAt, callState]);

  useEffect(() => {
    if (!activeConversationId) return undefined;
    emitRealtime('messages:join', { conversationId: activeConversationId }).catch(() => null);
    return () => {
      emitRealtime('messages:typing', { conversationId: activeConversationId, isTyping: false }).catch(() => null);
    };
  }, [activeConversationId]);

  useEffect(() => {
    return subscribeRealtime((event, payload) => {
      if (event === 'message:new') {
        queryClient.invalidateQueries({ queryKey: ['messages', 'conversations'] });
        if (payload?.conversationId) {
          queryClient.invalidateQueries({ queryKey: ['messages', payload.conversationId] });
        }
      }

      if (event === 'messages:typing' && payload?.conversationId === activeConversationIdRef.current && payload.userId !== currentUser?.id) {
        setTypingUsers((current) => {
          const next = { ...current };
          if (payload.isTyping) next[payload.userId] = payload.username;
          else delete next[payload.userId];
          return next;
        });
        window.clearTimeout(typingClearTimersRef.current[payload.userId]);
        if (payload.isTyping) {
          typingClearTimersRef.current[payload.userId] = window.setTimeout(() => {
            setTypingUsers((current) => {
              const next = { ...current };
              delete next[payload.userId];
              return next;
            });
          }, 3500);
        }
      }

      if (payload?.from?.id === currentUser?.id) return;

      if (event === 'voice:offer' && payload?.conversationId) {
        callConversationIdRef.current = payload.conversationId;
        setCallConversationId(payload.conversationId);
        setSelectedConversation(payload.conversationId);
        setIncomingCall(payload);
        setCallState((state) => (state === 'idle' ? 'ringing' : state));
        setCallStartedAt(null);
        startRingtone('incoming');
        toast.info(`Incoming voice call from @${payload.from?.username || 'friend'}`);
        return;
      }

      const activeCallConversationId = callConversationIdRef.current || activeConversationIdRef.current;
      if (!payload?.conversationId || payload.conversationId !== activeCallConversationId) return;

      if (event === 'voice:answer' && payload.answer) {
        peerRef.current?.setRemoteDescription(new RTCSessionDescription(payload.answer)).catch(() => null);
        stopRingtone();
        setCallStartedAt(Date.now());
        setCallState('connected');
      }
      if (event === 'voice:ice' && payload.candidate) {
        peerRef.current?.addIceCandidate(new RTCIceCandidate(payload.candidate)).catch(() => null);
      }
      if (event === 'voice:end') {
        cleanupVoiceCall(false);
        toast.info(`${payload.from?.username || 'Your friend'} ended the voice chat`);
      }
    });
  }, [currentUser?.id, queryClient, setSearchParams]);

  useEffect(() => () => cleanupVoiceCall(false), []);

  const sendMessage = useMutation({
    mutationFn: async () => {
      const uploaded = attachmentFile ? await filesService.uploadFile(attachmentFile, 'OTHER') : null;
      return socialService.sendMessage((friend?.username || targetUsername).trim(), {
        body,
        replyToMessageId: replyTo?.id || undefined,
        attachmentFileId: uploaded?.id || undefined,
      });
    },
    onSuccess: async (result) => {
      setBody('');
      setReplyTo(null);
      setAttachmentFile(null);
      setTargetUsername('');
      setSelectedConversation(result.conversationId);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['messages', 'conversations'] }),
        queryClient.invalidateQueries({ queryKey: ['messages', result.conversationId] }),
      ]);
    },
    onError: (error) => toast.error(error.message || 'Could not send message'),
  });

  const recipient = friend?.username || manualRecipient;
  const canSend = !!recipient && (!!body.trim() || !!attachmentFile) && !sendMessage.isPending;

  function setSelectedConversation(id) {
    setSelectedId(id);
    setSearchParams(id ? { conversation: id } : {});
    setTargetUsername('');
    setTypingUsers({});
  }

  function updateBody(value) {
    setBody(value);
    if (!activeConversationId) return;
    emitRealtime('messages:typing', { conversationId: activeConversationId, isTyping: true }).catch(() => null);
    window.clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = window.setTimeout(() => {
      emitRealtime('messages:typing', { conversationId: activeConversationId, isTyping: false }).catch(() => null);
    }, 1200);
  }

  function submitMessage() {
    if (!canSend) return;
    emitRealtime('messages:typing', { conversationId: activeConversationId, isTyping: false }).catch(() => null);
    sendMessage.mutate();
  }

  async function startVoiceCall() {
    if (!activeConversationId || !friend) return;
    try {
      callConversationIdRef.current = activeConversationId;
      setCallConversationId(activeConversationId);
      setCallStartedAt(null);
      setCallState('connecting');
      const stream = await window.navigator.mediaDevices.getUserMedia({ audio: true });
      const peer = createPeer(activeConversationId);
      localStreamRef.current = stream;
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      await emitRealtime('voice:offer', { conversationId: activeConversationId, offer });
      setCallState('calling');
      startRingtone('outgoing');
      toast.info(`Calling @${friend.username}...`);
    } catch (error) {
      cleanupVoiceCall(false);
      toast.error(error?.message || 'Could not start voice chat');
    }
  }

  async function acceptVoiceCall() {
    const conversationId = incomingCall?.conversationId || callConversationId || activeConversationId;
    if (!incomingCall?.offer || !conversationId) return;
    try {
      stopRingtone();
      callConversationIdRef.current = conversationId;
      setCallConversationId(conversationId);
      setCallState('connecting');
      const stream = await window.navigator.mediaDevices.getUserMedia({ audio: true });
      const peer = createPeer(conversationId);
      localStreamRef.current = stream;
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
      await peer.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      await emitRealtime('voice:answer', { conversationId, answer });
      setIncomingCall(null);
      setCallStartedAt(Date.now());
      setCallState('connected');
    } catch (error) {
      cleanupVoiceCall(true);
      toast.error(error?.message || 'Could not join voice chat');
    }
  }

  function createPeer(conversationId) {
    resetVoiceResources();
    const peer = new RTCPeerConnection({ iceServers: CALL_ICE_SERVERS });
    peerRef.current = peer;
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        emitRealtime('voice:ice', { conversationId, candidate: event.candidate }).catch(() => null);
      }
    };
    peer.ontrack = (event) => {
      if (remoteAudioRef.current && event.streams[0]) {
        remoteAudioRef.current.srcObject = event.streams[0];
        remoteAudioRef.current.play().catch(() => null);
      }
      stopRingtone();
      setCallStartedAt((startedAt) => startedAt || Date.now());
      setCallState('connected');
    };
    peer.onconnectionstatechange = () => {
      if (peer.connectionState === 'connected') {
        stopRingtone();
        setCallStartedAt((startedAt) => startedAt || Date.now());
        setCallState('connected');
      }
      if (peer.connectionState === 'disconnected') setCallState('connecting');
      if (['failed', 'closed'].includes(peer.connectionState)) cleanupVoiceCall(false);
    };
    return peer;
  }

  function resetVoiceResources() {
    stopRingtone();
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    peerRef.current?.close();
    peerRef.current = null;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
  }

  function cleanupVoiceCall(notifyPeer = true) {
    const conversationId = callConversationIdRef.current || activeConversationIdRef.current;
    if (notifyPeer && conversationId && callState !== 'idle') {
      emitRealtime('voice:end', { conversationId }).catch(() => null);
    }
    resetVoiceResources();
    setIncomingCall(null);
    setCallConversationId('');
    setCallStartedAt(null);
    setCallDuration(0);
    setMuted(false);
    setCallState('idle');
  }

  function startRingtone(kind = 'incoming') {
    if (typeof window === 'undefined') return;
    stopRingtone();
    try {
      const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextCtor) return;
      const context = new AudioContextCtor();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const level = kind === 'incoming' ? 0.075 : 0.035;
      const activeMs = kind === 'incoming' ? 420 : 260;
      const intervalMs = kind === 'incoming' ? 920 : 1550;

      oscillator.type = 'sine';
      oscillator.frequency.value = kind === 'incoming' ? 880 : 440;
      gain.gain.value = 0.0001;
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();

      const pulse = () => {
        const now = context.currentTime;
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(level, now + 0.04);
        gain.gain.linearRampToValueAtTime(level, now + activeMs / 1000);
        gain.gain.linearRampToValueAtTime(0.0001, now + activeMs / 1000 + 0.08);
      };

      context.resume().catch(() => null);
      pulse();
      const interval = window.setInterval(pulse, intervalMs);
      ringtoneRef.current = { context, oscillator, interval };
    } catch {
      ringtoneRef.current = null;
    }
  }

  function stopRingtone() {
    const ringtone = ringtoneRef.current;
    if (!ringtone) return;
    window.clearInterval(ringtone.interval);
    try {
      ringtone.oscillator.stop();
    } catch {
      // The oscillator may already be stopped by the browser.
    }
    ringtone.context.close?.().catch(() => null);
    ringtoneRef.current = null;
  }

  function toggleMute() {
    const nextMuted = !muted;
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted;
    });
    setMuted(nextMuted);
  }

  return (
    <DashboardLayout
      title="Messages"
      fluid
      mainClassName="box-border h-[calc(100dvh-3.5rem)] overflow-hidden !py-3 !pb-24 sm:h-[calc(100dvh-4rem)] sm:!py-4 lg:!pb-4"
    >
      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />
      <CallOverlay
        state={callState}
        friend={callFriend}
        incoming={incomingCall}
        duration={callDuration}
        muted={muted}
        onAccept={acceptVoiceCall}
        onDecline={() => cleanupVoiceCall(true)}
        onEnd={() => cleanupVoiceCall(true)}
        onToggleMute={toggleMute}
      />
      <div className="grid h-full min-h-0 grid-rows-[minmax(10rem,14rem)_minmax(0,1fr)] gap-4 lg:grid-cols-[22rem_1fr] lg:grid-rows-none">
        <GlassCard className="flex min-h-0 flex-col overflow-hidden">
          <div className="border-b border-border p-4">
            <h2 className="font-display text-xl font-semibold">Friends chat</h2>
            <p className="text-sm text-muted-foreground">Reply, attach files, and talk live with accepted friends.</p>
            <div className="relative mt-4">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={targetUsername}
                onChange={(event) => {
                  setTargetUsername(event.target.value);
                  if (event.target.value.trim()) {
                    setSelectedId('');
                    setSearchParams({});
                  }
                }}
                placeholder="Message @username"
                className="pl-9"
              />
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {conversationsError ? (
              <div className="p-6 text-center text-sm text-destructive">{conversationsErrorValue?.message || 'Could not load conversations.'}</div>
            ) : isLoading ? (
              <p className="p-4 text-sm text-muted-foreground">Loading conversations...</p>
            ) : conversations.length ? conversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                onClick={() => setSelectedConversation(conversation.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-secondary/50',
                  activeConversation?.id === conversation.id && 'bg-secondary/70'
                )}
              >
                <img src={conversation.friend.avatar} alt={conversation.friend.displayName} className="h-10 w-10 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{conversation.friend.displayName}</p>
                  <p className="truncate text-xs text-muted-foreground">{previewMessage(conversation.lastMessage)}</p>
                </div>
              </button>
            )) : (
              <div className="p-6 text-center text-sm text-muted-foreground">No conversations yet. Add a friend from their profile, then message them here.</div>
            )}
          </div>
        </GlassCard>

        <GlassCard className="flex min-h-0 flex-col overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
            {friend ? (
              <>
                <img src={friend.avatar} alt={friend.displayName} className="h-10 w-10 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-display text-lg font-semibold">{friend.displayName}</h2>
                  <p className="text-xs text-muted-foreground">@{friend.username}</p>
                </div>
                <VoiceControls
                  state={callState}
                  incoming={incomingCall}
                  onStart={startVoiceCall}
                  onAccept={acceptVoiceCall}
                  onEnd={() => cleanupVoiceCall(true)}
                />
              </>
            ) : (
              <div>
                <h2 className="font-display text-lg font-semibold">Start a conversation</h2>
                <p className="text-xs text-muted-foreground">Enter an accepted friend username, then send a message.</p>
              </div>
            )}
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
            {detailError ? (
              <div className="flex h-full flex-col items-center justify-center px-6 text-center text-sm text-destructive">
                {detailErrorValue?.message || 'Could not load this conversation.'}
              </div>
            ) : messages.length ? messages.map((message) => {
              const mine = message.sender.id === currentUser?.id || message.sender.username === currentUser?.username;
              return (
                <div key={message.id} className={cn('group flex gap-2', mine ? 'justify-end' : 'justify-start')}>
                  {!mine && <img src={message.sender.avatar} alt="" className="mt-1 h-8 w-8 rounded-lg object-cover" />}
                  <div className={cn('max-w-[82%] rounded-2xl border px-4 py-2.5 text-sm shadow-soft', mine ? 'border-white/15 bg-white text-black' : 'border-border bg-secondary/50')}>
                    {message.replyTo && (
                      <button
                        type="button"
                        onClick={() => setReplyTo(message.replyTo)}
                        className={cn('mb-2 block w-full rounded-lg border px-3 py-2 text-left text-xs', mine ? 'border-black/10 bg-black/5 text-black/70' : 'border-white/10 bg-black/15 text-muted-foreground')}
                      >
                        Replying to @{message.replyTo.sender.username}: {previewMessage(message.replyTo)}
                      </button>
                    )}
                    {message.body && <p className="whitespace-pre-wrap break-words">{message.body}</p>}
                    {message.attachment && <AttachmentCard attachment={message.attachment} mine={mine} />}
                    <div className="mt-1 flex items-center justify-between gap-3">
                      <p className={cn('text-[11px]', mine ? 'text-black/55' : 'text-muted-foreground')}>{formatRelative(message.createdAt)}</p>
                      <button
                        type="button"
                        onClick={() => setReplyTo(message)}
                        className={cn('inline-flex items-center gap-1 text-[11px] opacity-80 transition hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100', mine ? 'text-black/60' : 'text-muted-foreground')}
                      >
                        <Reply className="h-3 w-3" /> Reply
                      </button>
                    </div>
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

          {typingNames && (
            <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
              {typingNames} {typingNames.includes(',') ? 'are' : 'is'} typing...
            </div>
          )}

          <form className="border-t border-border p-4" onSubmit={(event) => { event.preventDefault(); submitMessage(); }}>
            {replyTo && (
              <div className="mb-2 flex items-center justify-between gap-3 rounded-xl border border-border bg-secondary/35 px-3 py-2 text-xs">
                <span className="min-w-0 truncate">Replying to @{replyTo.sender.username}: {previewMessage(replyTo)}</span>
                <button type="button" onClick={() => setReplyTo(null)} className="shrink-0 text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            {attachmentFile && (
              <div className="mb-2 flex items-center justify-between gap-3 rounded-xl border border-border bg-secondary/35 px-3 py-2 text-xs">
                <span className="min-w-0 truncate"><Paperclip className="mr-1 inline h-3.5 w-3.5" /> {attachmentFile.name}</span>
                <button type="button" onClick={() => setAttachmentFile(null)} className="shrink-0 text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(event) => setAttachmentFile(event.target.files?.[0] || null)}
                accept="image/*,video/mp4,video/webm,audio/*"
              />
              <Button type="button" variant="outline" size="icon" className="sm:self-end" onClick={() => fileInputRef.current?.click()} disabled={!recipient || sendMessage.isPending} aria-label="Attach file">
                <Paperclip className="h-4 w-4" />
              </Button>
              <Textarea
                value={body}
                onChange={(event) => updateBody(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && event.ctrlKey) {
                    event.preventDefault();
                    submitMessage();
                  }
                }}
                rows={2}
                placeholder={recipient ? `Message @${recipient}. Ctrl+Enter sends.` : 'Choose a friend first'}
                className="min-h-12 flex-1 resize-none"
              />
              <Button type="submit" disabled={!canSend} className="sm:self-end">
                {sendMessage.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send
              </Button>
            </div>
          </form>
        </GlassCard>
      </div>
    </DashboardLayout>
  );
}

function VoiceControls({ state, incoming, onStart, onAccept, onEnd }) {
  if (incoming && state === 'ringing') {
    return (
      <div className="flex gap-2">
        <Button size="sm" onClick={onAccept}><Phone className="h-4 w-4" /> Accept</Button>
        <Button size="sm" variant="outline" onClick={onEnd}><PhoneOff className="h-4 w-4" /> Decline</Button>
      </div>
    );
  }
  if (state !== 'idle') {
    return (
      <Button size="sm" variant="outline" onClick={onEnd} className="text-destructive hover:text-destructive">
        <PhoneOff className="h-4 w-4" /> {state === 'connected' ? 'End call' : 'Cancel'}
      </Button>
    );
  }
  return (
    <Button size="sm" variant="outline" onClick={onStart}>
      <Mic className="h-4 w-4" /> Voice
    </Button>
  );
}

function CallOverlay({ state, friend, incoming, duration, muted, onAccept, onDecline, onEnd, onToggleMute }) {
  if (state === 'idle' && !incoming) return null;

  const displayName = friend?.displayName || friend?.username || incoming?.from?.username || 'Friend';
  const username = friend?.username || incoming?.from?.username || 'friend';
  const avatar = friend?.avatar || '';
  const isRinging = state === 'ringing';
  const isConnected = state === 'connected';
  const status = isRinging
    ? 'Incoming voice call'
    : isConnected
      ? `Connected · ${formatCallDuration(duration)}`
      : state === 'calling'
        ? 'Ringing...'
        : 'Connecting audio...';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-2xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_32%),radial-gradient(circle_at_bottom,rgba(255,255,255,0.08),transparent_34%)]" />
      <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white/15 bg-zinc-950/95 p-6 text-center shadow-[0_30px_100px_rgba(0,0,0,0.75)] sm:p-8">
        <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/55 to-transparent" />
        <div className="mx-auto mb-7 flex h-40 w-40 items-center justify-center rounded-full bg-white/[0.03]">
          <div className="relative">
            {(isRinging || state === 'calling') && (
              <>
                <span className="absolute inset-0 rounded-full border border-white/30 animate-ping" />
                <span className="absolute -inset-5 rounded-full border border-white/10 animate-pulse" />
              </>
            )}
            {avatar ? (
              <img src={avatar} alt={displayName} className="relative h-28 w-28 rounded-full border border-white/15 object-cover shadow-2xl" />
            ) : (
              <div className="relative flex h-28 w-28 items-center justify-center rounded-full border border-white/15 bg-white text-4xl font-black text-black shadow-2xl">
                {displayName.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <p className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs uppercase tracking-[0.18em] text-zinc-400">
            <PhoneCall className="h-3.5 w-3.5" /> Voice call
          </p>
          <h2 className="font-display text-3xl font-semibold text-white">{displayName}</h2>
          <p className="text-sm text-zinc-500">@{username}</p>
          <p className="pt-2 text-sm font-medium text-zinc-300">{status}</p>
        </div>

        <div className="mt-8 flex items-center justify-center gap-3">
          {isRinging ? (
            <>
              <Button type="button" size="lg" onClick={onAccept} className="rounded-full bg-white px-6 text-black hover:bg-zinc-200">
                <Phone className="h-4 w-4" /> Accept
              </Button>
              <Button type="button" size="lg" variant="outline" onClick={onDecline} className="rounded-full border-red-500/40 bg-red-500/10 px-6 text-red-200 hover:bg-red-500/20">
                <PhoneOff className="h-4 w-4" /> Decline
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={onToggleMute}
                className={cn('h-12 w-12 rounded-full border-white/15 bg-white/[0.06]', muted && 'border-yellow-400/40 bg-yellow-400/15 text-yellow-100')}
                aria-label={muted ? 'Unmute microphone' : 'Mute microphone'}
              >
                {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Button>
              <Button type="button" size="icon" onClick={onEnd} className="h-14 w-14 rounded-full bg-red-500 text-white shadow-[0_0_35px_rgba(239,68,68,0.45)] hover:bg-red-400" aria-label="End call">
                <PhoneOff className="h-6 w-6" />
              </Button>
            </>
          )}
        </div>

        <p className="mt-6 text-xs text-zinc-500">
          Keep this page open while the call connects. Browser microphone permission is required.
        </p>
      </div>
    </div>
  );
}

function AttachmentCard({ attachment, mine }) {
  const name = attachment.originalName || 'Attachment';
  const mime = attachment.mimeType || '';
  const commonClass = cn('mt-2 overflow-hidden rounded-xl border', mine ? 'border-black/10 bg-black/5' : 'border-white/10 bg-black/15');

  if (mime.startsWith('image/')) {
    return (
      <a href={attachment.url} target="_blank" rel="noreferrer" className={commonClass}>
        <img src={attachment.url} alt={name} className="max-h-64 w-full object-cover" loading="lazy" />
        <AttachmentFooter attachment={attachment} mine={mine} />
      </a>
    );
  }
  if (mime.startsWith('audio/')) {
    return (
      <div className={cn(commonClass, 'p-3')}>
        <audio src={attachment.url} controls className="w-full" />
        <AttachmentFooter attachment={attachment} mine={mine} />
      </div>
    );
  }
  if (mime.startsWith('video/')) {
    return (
      <div className={commonClass}>
        <video src={attachment.url} controls className="max-h-72 w-full" />
        <AttachmentFooter attachment={attachment} mine={mine} />
      </div>
    );
  }
  return (
    <a href={attachment.url} target="_blank" rel="noreferrer" className={cn(commonClass, 'flex items-center gap-3 p-3')}>
      <FileIcon className="h-5 w-5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{name}</p>
        <p className={cn('text-xs', mine ? 'text-black/55' : 'text-muted-foreground')}>{formatBytes(attachment.sizeBytes)}</p>
      </div>
      <Download className="h-4 w-4 shrink-0" />
    </a>
  );
}

function AttachmentFooter({ attachment, mine }) {
  return (
    <div className={cn('flex items-center justify-between gap-3 px-3 py-2 text-xs', mine ? 'text-black/60' : 'text-muted-foreground')}>
      <span className="truncate">{attachment.originalName || 'Attachment'}</span>
      <span className="shrink-0">{formatBytes(attachment.sizeBytes)}</span>
    </div>
  );
}

function previewMessage(message) {
  if (!message) return 'No messages yet';
  if (message.body) return message.body;
  if (message.attachment) return `Attachment: ${message.attachment.originalName || 'file'}`;
  return 'Message';
}

function formatBytes(bytes = 0) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
}

function formatCallDuration(seconds = 0) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}
