// Simple front for Evolution-backed backend
const $ = (sel) => document.querySelector(sel);
const chatList = $("#chatList");
const messagesBox = $("#messages");
const textInput = $("#text");
const composer = $("#composer");
const backendUrlInput = $("#backendUrl");
const instanceInput = $("#instance");
const remoteJidInput = $("#remoteJid");
const btnLoadChats = $("#btnLoadChats");
const btnSaveCfg = $("#btnSaveCfg");
const realtimeToggle = $("#enableRealtime");
const realtimeStatus = $("#realtimeStatus");

let state = {
  backendUrl: "",
  instance: "",
  activeJid: "",
  socket: null,
  socketLoaded: false,
};

function saveCfg() {
  state.backendUrl = backendUrlInput.value.trim().replace(/\/$/, "");
  state.instance = instanceInput.value.trim();
  localStorage.setItem("wb_cfg", JSON.stringify({
    backendUrl: state.backendUrl,
    instance: state.instance,
    remoteJid: remoteJidInput.value.trim(),
    realtime: realtimeToggle.checked,
  }));
  logHint("Configuración guardada.");
}

function loadCfg() {
  try {
    const raw = localStorage.getItem("wb_cfg");
    if (!raw) return;
    const cfg = JSON.parse(raw);
    backendUrlInput.value = cfg.backendUrl || location.origin;
    instanceInput.value = cfg.instance || "";
    remoteJidInput.value = cfg.remoteJid || "";
    realtimeToggle.checked = !!cfg.realtime;
  } catch {}
}

function logHint(t) {
  realtimeStatus.textContent = t;
  setTimeout(() => { if (realtimeStatus.textContent === t) realtimeStatus.textContent = ""; }, 3000);
}

async function api(path, { method = "GET", body } = {}) {
  const base = backendUrlInput.value.trim().replace(/\/$/, "");
  const headers = { "Content-Type": "application/json" };
  const res = await fetch(`${base}${path}`, {
    method, headers, body: body ? JSON.stringify(body) : undefined, cache: "no-store"
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function renderChats(list=[]) {
  chatList.innerHTML = "";
  list.forEach((c, i) => {
    const jid = c?.id || c?.jid || c?.key?.remoteJid || c?.remoteJid || c?.chatId;
    const name = c?.name || c?.pushName || c?.subject || jid;
    if (!jid) return;
    const li = document.createElement("li");
    li.textContent = name;
    li.className = (jid === state.activeJid) ? "active" : "";
    li.addEventListener("click", () => {
      state.activeJid = jid;
      remoteJidInput.value = jid;
      document.querySelectorAll("#chatList li").forEach(el => el.classList.remove("active"));
      li.classList.add("active");
      loadMessages();
    });
    chatList.appendChild(li);
  });
}

function extractText(msg) {
  if (!msg) return "";
  const m = msg.message || msg;
  return (
    m?.conversation ||
    m?.extendedTextMessage?.text ||
    m?.imageMessage?.caption ||
    m?.videoMessage?.caption ||
    m?.buttonsResponseMessage?.selectedDisplayText ||
    m?.listResponseMessage?.title ||
    ""
  );
}

function renderMessages(list=[]) {
  messagesBox.innerHTML = "";
  list.forEach(m => {
    const el = document.createElement("div");
    el.className = "msg " + ((m?.key?.fromMe || m?.fromMe) ? "me" : "other");
    el.textContent = extractText(m) || "⟂ mensaje sin texto";
    messagesBox.appendChild(el);
  });
  messagesBox.scrollTop = messagesBox.scrollHeight;
}

async function loadChats() {
  try {
    saveCfg();
    const inst = instanceInput.value.trim();
    if (!inst) return alert("Completá Instance ID");
    const data = await api(`/api/chats?instance=${encodeURIComponent(inst)}`);
    const arr = Array.isArray(data) ? data : (data?.chats || data?.data || []);
    renderChats(arr);
    if (arr.length && !state.activeJid) {
      // auto-seleccionar el primero
      const first = arr[0];
      const jid = first?.id || first?.jid || first?.key?.remoteJid || first?.remoteJid || first?.chatId;
      if (jid) {
        state.activeJid = jid;
        remoteJidInput.value = jid;
        loadMessages();
      }
    }
    maybeEnableRealtime();
  } catch (e) {
    console.error(e);
    alert("Error al cargar chats: " + e.message);
  }
}

async function loadMessages() {
  try {
    saveCfg();
    const inst = instanceInput.value.trim();
    const jid = remoteJidInput.value.trim();
    if (!inst || !jid) return;
    const data = await api(`/api/messages?instance=${encodeURIComponent(inst)}&remoteJid=${encodeURIComponent(jid)}&limit=50`);
    const arr = Array.isArray(data) ? data : (data?.messages || data?.data || []);
    renderMessages(arr);
  } catch (e) {
    console.error(e);
    alert("Error al cargar mensajes: " + e.message);
  }
}

async function sendText(e) {
  e.preventDefault();
  const text = textInput.value.trim();
  if (!text) return;
  try {
    saveCfg();
    const inst = instanceInput.value.trim();
    const jid = remoteJidInput.value.trim();
    await api(`/api/send`, { method: "POST", body: { instance: inst, number: jid, text } });
    // push optimista
    renderMessages([
      ...Array.from(messagesBox.children).map(el => ({ key:{ fromMe: el.classList.contains("me") }, message:{ conversation: el.textContent } })),
      { key:{ fromMe: true, id:`tmp-${Date.now()}` }, message:{ conversation: text } }
    ]);
    textInput.value = "";
  } catch (e) {
    console.error(e);
    alert("Error al enviar: " + e.message);
  }
}

async function maybeEnableRealtime() {
  if (!realtimeToggle.checked) return;
  if (state.socket) return; // ya conectado
  const base = backendUrlInput.value.trim().replace(/\/$/, "");
  try {
    // cargar socket.io client desde TU backend (no CDN)
    if (!state.socketLoaded) {
      await new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = `${base}/socket.io/socket.io.js`;
        s.onload = resolve;
        s.onerror = () => reject(new Error("No se pudo cargar Socket.IO client desde el backend"));
        document.head.appendChild(s);
      });
      state.socketLoaded = true;
    }
    const socket = window.io(base, { transports:["websocket"] });
    state.socket = socket;
    socket.on("connect", () => logHint("Realtime: conectado"));
    socket.on("disconnect", () => logHint("Realtime: desconectado"));
    // unirse a la sala de la instancia (tu backend debería aceptar este evento)
    socket.emit("join", { instance: instanceInput.value.trim() });

    socket.on("evolution_event", ({ event, payload, instance }) => {
      // escuchamos MESSAGES_UPSERT
      if (event === "MESSAGES_UPSERT") {
        try {
          const incoming = payload?.data || payload?.messages || payload?.message || payload;
          const msgs = Array.isArray(incoming?.messages) ? incoming.messages : (Array.isArray(incoming) ? incoming : []);
          const active = remoteJidInput.value.trim();
          const same = msgs.filter(m => (m?.key?.remoteJid) === active);
          if (same.length) {
            // append
            const current = Array.from(messagesBox.children).map(el => ({ key:{ fromMe: el.classList.contains("me") }, message:{ conversation: el.textContent } }));
            renderMessages([...current, ...same]);
          }
        } catch {}
      }
    });
  } catch (e) {
    console.error(e);
    logHint("Realtime deshabilitado: " + e.message);
  }
}

btnSaveCfg.addEventListener("click", saveCfg);
btnLoadChats.addEventListener("click", loadChats);
composer.addEventListener("submit", sendText);
window.addEventListener("load", () => {
  // default Backend URL = origin actual
  backendUrlInput.value = location.origin;
  loadCfg();
});
