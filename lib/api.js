const BASE = process.env.NEXT_PUBLIC_BACKEND_URL; // ej: https://tu-backend.railway.app
const KEY  = process.env.NEXT_PUBLIC_BACKEND_KEY; // debe matchear BACKEND_API_KEY

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

export const api = {
  instances: () => req('/api/instances'),
  connection: (instance) => req(`/api/instance/${encodeURIComponent(instance)}/connection`),
  connect:   (instance) => req(`/api/instance/${encodeURIComponent(instance)}/connect`),
  createInstance: (instanceName) =>
    req('/api/instance', {
      method: 'POST',
      body: { instanceName }
    }),
  findChats: (instance) => req('/api/chat/find', { method: 'POST', body: { instance } }),
  findMessages: (instance, remoteJid, limit) => req('/api/messages/find', { method: 'POST', body: { instance, remoteJid, limit } }),
  sendText: (instance, number, text) => req('/api/messages/send', { method: 'POST', body: { instance, number, text } }),
  markRead: (instance, messages) => req('/api/messages/mark-read', { method: 'POST', body: { instance, messages } }),
};
