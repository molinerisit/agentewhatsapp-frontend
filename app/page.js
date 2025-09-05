'use client';
import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import InstancePicker from '../components/InstancePicker';
import InstanceCreator from '../components/InstanceCreator';
import ConnectionBanner from '../components/ConnectionBanner';
import ChatList from '../components/ChatList';
import MessageThread from '../components/MessageThread';
import Composer from '../components/Composer';

/* ============================ */
/* Helpers de fetch y normalización */
/* ============================ */

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL;
const KEY  = process.env.NEXT_PUBLIC_BACKEND_KEY;

async function req(path, { method = 'GET', body } = {}) {
  const headers = { 'x-backend-key': KEY, 'Content-Type': 'application/json' };
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store'
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

const api = {
  instances: () => req('/api/instances'),
  connection: (instance, fresh = false) =>
    req(`/api/instance/${encodeURIComponent(instance)}/connection${fresh ? '?fresh=1' : ''}`),
  connect: (instance) =>
    req(`/api/instance/${encodeURIComponent(instance)}/connect`),
  findChats: (instance) =>
    req('/api/chat/find', { method: 'POST', body: { instance } }),
  findMessages: (instance, remoteJid, limit = 50) =>
    req('/api/messages/find', { method: 'POST', body: { instance, remoteJid, limit } }),
  sendText: (instance, number, text) =>
    req('/api/messages/send', { method: 'POST', body: { instance, number, text } }),
};

function normalizeList(x) {
  if (Array.isArray(x)) return x;
  if (Array.isArray(x?.chats)) return x.chats;
  if (Array.isArray(x?.data)) return x.data;
  if (Array.isArray(x?.items)) return x.items;
  return [];
}

/* ============================ */

export default function Home() {
  const [instances, setInstances] = useState([]);
  const [instance, setInstance] = useState('');

  const [state, setState] = useState(null);
  const [connected, setConnected] = useState(false);
  const [qr, setQr] = useState(null);
  const [pairing, setPairing] = useState(null);

  const [chats, setChats] = useState([]);
  const [activeJid, setActiveJid] = useState(null);
  const [messages, setMessages] = useState([]);

  const socketRef = useRef(null);

  // Cargar lista de instancias (sin pisar estado si viene vacío/500)
  const loadInstances = async () => {
    try {
      const data = await api.instances();
      const arr = normalizeList(data);
      if (arr.length) setInstances(arr);
      else console.warn('[instances] vacío, conservo listado previo');
    } catch (e) {
      console.error('[instances ERROR]', e);
      // no tocar setInstances() para no perder selección
    }
  };

  useEffect(() => {
    loadInstances();
  }, []);

  // Al elegir instancia: pedir estado (fresh=1), si conecta cargar inbox; setear socket con fallback
  useEffect(() => {
    if (!instance) return;

    (async () => {
      try {
        const { state: st, qr: q, pairingCode: pc, connected: ok } = await api.connection(instance, true);
        setState(st);
        setConnected(!!ok);
        setQr(q || null);
        setPairing(pc ? String(pc) : null);

        if (ok) {
          const list = await api.findChats(instance);
          const arr = normalizeList(list);
          setChats(arr);
          if (!activeJid && arr.length) {
            const first = arr[0];
            const jid = first?.id || first?.jid || first?.remoteJid || first?.chatId;
            if (jid) setActiveJid(jid);
          }
        }
      } catch (e) {
        console.error('[connection initial ERROR]', e);
      }

      // Intentar cargar chats igual (puede traer algo aunque aún no esté conectado)
      try {
        const list = await api.findChats(instance);
        const arr = normalizeList(list);
        setChats(arr);
      } catch (e) {
        console.error('[findChats initial ERROR]', e);
      }
    })();

    // Socket.io con fallback a polling (Railway/proxies pueden cortar WS)
    if (socketRef.current) {
      try { socketRef.current.disconnect(); } catch {}
    }
    const socket = io(BASE, {
      transports: ['websocket', 'polling'],
      path: '/socket.io',
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000,
      withCredentials: false
    });
    socketRef.current = socket;
    socket.emit('join', { instance });

    socket.on('evolution_event', async ({ event, payload }) => {
      if (event === 'CONNECTION_UPDATE') {
        setState(payload);
        const s = (payload?.state || payload?.instance?.state || '').toString().toLowerCase();
        const ok = payload?.connected === true || s === 'open' || s === 'connected';
        setConnected(ok);
        if (ok) {
          try {
            const list = await api.findChats(instance);
            const arr = normalizeList(list);
            setChats(arr);
            if (!activeJid && arr.length) {
              const first = arr[0];
              const jid = first?.id || first?.jid || first?.remoteJid || first?.chatId;
              if (jid) setActiveJid(jid);
            }
          } catch (e) { console.error('[findChats on connect ERROR]', e); }
        }
      }

      if (event === 'QRCODE_UPDATED' && payload?.qrcode) {
        setQr(payload.qrcode);
      }

      if (event === 'MESSAGES_UPSERT') {
        try {
          const incoming = payload?.data || payload?.messages || payload?.message || payload;
          const msgs = Array.isArray(incoming?.messages) ? incoming.messages : (Array.isArray(incoming) ? incoming : []);
          if (activeJid && msgs.length) {
            const sameChat = msgs.filter(m => (m?.key?.remoteJid) === activeJid);
            if (sameChat.length) setMessages(prev => [...prev, ...sameChat]);
          }
        } catch (_) {}
      }
    });

    return () => { try { socket.disconnect(); } catch {} };
  }, [instance, activeJid]);

  // Cargar mensajes del chat activo
  useEffect(() => {
    if (!instance || !activeJid) return;
    api.findMessages(instance, activeJid, 50)
      .then(data => setMessages(normalizeList(data)))
      .catch(console.error);
  }, [instance, activeJid]);

  const onSend = async (text) => {
    if (!instance || !activeJid) return;
    await api.sendText(instance, activeJid, text);
    // Optimista
    setMessages(prev => [
      ...prev,
      { key: { id: `tmp-${Date.now()}`, remoteJid: activeJid, fromMe: true }, message: { conversation: text } }
    ]);
  };

  return (
    <div className="page-grid">
      <div className="panel">
        <InstanceCreator
          onCreated={async (name) => {
            await loadInstances();
            setInstance(name);
            setActiveJid(null);
            setMessages([]);
            try {
              const { state: st, qr: q, pairingCode: pc, connected: ok } = await api.connection(name, true);
              setState(st);
              setConnected(!!ok);
              setQr(q || null);
              setPairing(pc ? String(pc) : null);
              if (ok) {
                const list = await api.findChats(name);
                const arr = normalizeList(list);
                setChats(arr);
                if (arr.length) {
                  const first = arr[0];
                  const jid = first?.id || first?.jid || first?.remoteJid || first?.chatId;
                  if (jid) setActiveJid(jid);
                }
              }
            } catch (e) { console.error(e); }
          }}
        />

        <InstancePicker
          instances={instances}
          value={instance}
          onChange={(v) => {
            setInstance(v);
            setActiveJid(null);
            setMessages([]);
          }}
        />

        <div style={{flex:1, minHeight:0}}>
          <ChatList
            chats={chats}
            activeJid={activeJid}
            onSelect={(jid) => {
              if (!jid) return;
              setActiveJid(jid);
              setMessages([]);
            }}
          />
        </div>
      </div>

      <div style={{display:'flex', flexDirection:'column', minHeight:0}}>
        <ConnectionBanner
          state={{ ...(state || {}), connected }}
          connected={connected}
          qr={qr}
          pairingManual={pairing}
          instance={instance}
          onRefresh={async () => {
            if (!instance) return;
            try {
              const { state: st, qr: q, pairingCode: pc, connected: ok } = await api.connection(instance);
              setState(st);
              setConnected(!!ok);
              setQr(q || null);
              setPairing(pc ? String(pc) : null);
              if (ok) {
                const list = await api.findChats(instance);
                const arr = normalizeList(list);
                setChats(arr);
                if (!activeJid && arr.length) {
                  const first = arr[0];
                  const jid = first?.id || first?.jid || first?.remoteJid || first?.chatId;
                  if (jid) setActiveJid(jid);
                }
              }
            } catch (e) { console.error(e); }
          }}
        />

        <div style={{flex:1, minHeight:0}}>
          <MessageThread messages={messages} />
        </div>

        <Composer onSend={onSend} disabled={!instance || !activeJid} />
      </div>
    </div>
  );
}
