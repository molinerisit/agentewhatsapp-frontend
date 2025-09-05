'use client';
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { api } from '../lib/api';
import InstancePicker from '../components/InstancePicker';
import InstanceCreator from '../components/InstanceCreator';
import ConnectionBanner from '../components/ConnectionBanner';
import ChatList from '../components/ChatList';
import MessageThread from '../components/MessageThread';
import Composer from '../components/Composer';

export default function Home() {
  const [instances, setInstances] = useState([]);
  const [instance, setInstance] = useState('');
  const [state, setState] = useState(null);
  const [qr, setQr] = useState(null);
  const [pairing, setPairing] = useState(null);
  const [chats, setChats] = useState([]);
  const [activeJid, setActiveJid] = useState(null);
  const [messages, setMessages] = useState([]);

  // cargar instancias
  const loadInstances = async () => {
    try {
      const data = await api.instances();
      const arr = Array.isArray(data) ? data : (data?.instances || data?.data || []);
      setInstances(arr);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadInstances();
  }, []);

  // conectar socket y cargar datos al elegir instancia
  useEffect(() => {
    if (!instance) return;

    (async () => {
      try {
        const { state: st, qr: q, pairingCode: pc } = await api.connection(instance + '?fresh=1');
        setState(st);
        setQr(q || null);
        if (pc) setPairing(String(pc));
      } catch (e) {
        console.error(e);
      }
      try {
        const list = await api.findChats(instance);
        const arr = Array.isArray(list) ? list : (list?.chats || list?.data || []);
        setChats(arr);
      } catch (e) {
        console.error(e);
      }
    })();

    const socket = io(process.env.NEXT_PUBLIC_BACKEND_URL, { transports: ['websocket'] });
    socket.emit('join', { instance });
    socket.on('evolution_event', ({ event, payload }) => {
      if (event === 'CONNECTION_UPDATE') {
        setState(payload);
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
    return () => { socket.disconnect(); };
  }, [instance, activeJid]);

  // cargar mensajes del chat activo
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
    // optimista
    setMessages(prev => [
      ...prev,
      { key: { id: `tmp-${Date.now()}`, remoteJid: activeJid, fromMe: true }, message: { conversation: text } }
    ]);
  };

  return (
    <div className="page-grid">
      <div className="panel">
        <InstanceCreator
          onCreated={async (name, res) => {
            await loadInstances();
            setInstance(name);
            setActiveJid(null);
            setMessages([]);
            try {
              const { state: st, qr: q, pairingCode: pc } = await api.connection(name + '?fresh=1');
              setState(st);
              setQr(q || null);
              if (pc) setPairing(String(pc));
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
          state={state}
          qr={qr}
          pairingManual={pairing}
          instance={instance}
          onRefresh={async () => {
            if (!instance) return;
            try {
              const { state: st, qr: q, pairingCode: pc } = await api.connection(instance);
              setState(st);
              setQr(q || null);
              if (pc) setPairing(String(pc));
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
