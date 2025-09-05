'use client';
import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import InstancePicker from '../components/InstancePicker';
import InstanceCreator from '../components/InstanceCreator';
import ConnectionBanner from '../components/ConnectionBanner';
import ChatList from '../components/ChatList';
import MessageThread from '../components/MessageThread';
import Composer from '../components/Composer';

// helpers de fetch locales para poder usar fresh=1 sin tocar lib/api.js
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

  // Cargar lista de instancias (sin pisar la lista si llega vacía/500)
  const loadInstances = async () => {
    try {
      const data = await api.instances();
      const arr = Array.isArray(data) ? data : (data?.instances || data?.data || []);
      if (arr && arr.length) {
        setInstances(arr);
      } else {
        console.warn('[instances] vacío, conservo listado previo');
      }
    } catch (e) {
      console.error('[instances ERROR]', e);
      // No tocar setInstances() en caso de error para no perder selección
    }
  };

  useEffect(() => {
    loadInstances();
  }, []);

  // Al elegir instancia: pedir estado con fresh=1 y, si conecta, cargar inbox
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
          const arr = Array.isArray(list) ? list : (list?.chats || list?.data || []);
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

      // Cargar chats (aunque no esté conectado aún, por si Evolution ya los tiene)
      try {
        const list = await api.findChats(instance);
        const arr = Array.isArray(list) ? list : (list?.chats || list?.data || []);
        setChats(arr);
      } catch (e) {
        console.error('[findChats initial ERROR]', e);
      }
    })();

    // Conectar socket.io para eventos Evolution
    if (socketRef.current) {
      try { socketRef.current.disconnect(); } catch {}
    }
    const socket = io(BASE, { transports: ['websocket'] });
    socketRef.current = socket;
    socket.emit('join', { instance });

    socket.on('evolution_event', async ({ event, payload }) => {
      // Estado de conexión: normalizamos
      if (event === 'CONNECTION_UPDATE') {
        setState(payload);
        const s = (payload?.state || payload?.instance?.state || '').toString().toLowerCase();
        const ok = payload?.connected === true || s === 'open' || s === 'connected';
        setConnected(ok);
        // Si se conectó recién ahora → cargar inbox
        if (ok) {
          try {
            const list = await api.findChats(instance);
            const arr = Array.isArray(list) ? list : (list?.chats || list?.data || []);
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
      .then(data => {
        const arr = Array.isArray(data) ? data : (data?.messages || data?.data || []);
        setMessages(arr);
      })
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
                const arr = Array.isArray(list) ? list : (list?.chats || list?.data || []);
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
                const arr = Array.isArray(list) ? list : (list?.chats || list?.data || []);
                setChats(arr);
                // si no hay activo, abrir primero
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
