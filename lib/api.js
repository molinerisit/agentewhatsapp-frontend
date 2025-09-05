const BASE = process.env.NEXT_PUBLIC_BACKEND_URL;
const KEY  = process.env.NEXT_PUBLIC_BACKEND_KEY;

async function req(path, { method = 'GET', body } = {}) {
  const headers = { 'x-backend-key': KEY, 'Content-Type': 'application/json' };
  let payload = null;

  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store'
    });

    try {
      payload = await res.json();
    } catch {
      payload = { ok: false, error: 'Invalid JSON response' };
    }

    if (!res.ok && (!payload || typeof payload !== 'object')) {
      payload = { ok: false, error: `HTTP ${res.status}` };
    }
  } catch (err) {
    payload = { ok: false, error: err.message };
  }

  return payload;
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
  findChats: (instance) =>
    req('/api/chat/find', { method: 'POST', body: { instance } }),
  findMessages: (instance, remoteJid, limit) =>
    req('/api/messages/find', { method: 'POST', body: { instance, remoteJid, limit } }),
  sendText: (instance, number, text, quoted) =>
    req('/api/messages/send', { method: 'POST', body: { instance, number, text, quoted } }),
  markRead: (instance, messages) =>
    req('/api/messages/mark-read', { method: 'POST', body: { instance, messages } }),
};
