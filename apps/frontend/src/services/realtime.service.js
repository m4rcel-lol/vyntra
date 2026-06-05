import { apiBaseUrl } from '@/services/backend';

const listeners = new Set();
let running = false;
let abortController = null;
let reconnectTimer = null;

export function subscribeRealtime(listener) {
  listeners.add(listener);
  if (!running) startRealtime();
  return () => {
    listeners.delete(listener);
    if (!listeners.size) stopRealtime();
  };
}

function emit(event, payload) {
  for (const listener of listeners) {
    listener(event, payload);
  }
}

function startRealtime() {
  running = true;
  abortController = new AbortController();
  void connectPolling(abortController.signal).catch(() => {
    if (!running) return;
    reconnectTimer = window.setTimeout(startRealtime, 2500);
  });
}

function stopRealtime() {
  running = false;
  if (reconnectTimer) window.clearTimeout(reconnectTimer);
  reconnectTimer = null;
  abortController?.abort();
  abortController = null;
}

async function connectPolling(signal) {
  const openPayload = await socketFetch('', signal);
  const openPacket = parsePackets(openPayload).find((packet) => packet.startsWith('0'));
  if (!openPacket) throw new Error('Socket.IO handshake failed');
  const session = JSON.parse(openPacket.slice(1));
  const sid = session.sid;
  await socketPost(sid, '40', signal);

  while (running && !signal.aborted) {
    const payload = await socketFetch(`&sid=${encodeURIComponent(sid)}`, signal);
    for (const packet of parsePackets(payload)) {
      await handlePacket(sid, packet, signal);
    }
  }
}

async function handlePacket(sid, packet, signal) {
  if (!packet) return;
  if (packet === '2') {
    await socketPost(sid, '3', signal);
    return;
  }
  if (packet.startsWith('42')) {
    const parsed = JSON.parse(packet.slice(2));
    if (Array.isArray(parsed) && typeof parsed[0] === 'string') {
      emit(parsed[0], parsed[1]);
    }
  }
}

async function socketFetch(query, signal) {
  const response = await fetch(`${apiBaseUrl}/socket.io/?EIO=4&transport=polling&t=${Date.now()}${query}`, {
    credentials: 'include',
    signal,
  });
  if (!response.ok) throw new Error(`Socket.IO poll failed with ${response.status}`);
  return response.text();
}

async function socketPost(sid, body, signal) {
  const response = await fetch(`${apiBaseUrl}/socket.io/?EIO=4&transport=polling&sid=${encodeURIComponent(sid)}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
    body,
    signal,
  });
  if (!response.ok) throw new Error(`Socket.IO post failed with ${response.status}`);
}

function parsePackets(payload) {
  return String(payload || '').split('\x1e').filter(Boolean);
}
