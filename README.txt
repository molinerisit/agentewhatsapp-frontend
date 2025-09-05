WhatsBot Frontend Mínimo
==========================

Este paquete es solo **frontend** (estático). Necesita un **backend** que exponga:

- GET  /api/chats?instance=ID
- GET  /api/messages?instance=ID&remoteJid=JID&limit=50
- POST /api/send (body: { instance, number, text })

Opcional: si tu backend sirve Socket.IO en `/socket.io/socket.io.js` y emite
`evolution_event` con `MESSAGES_UPSERT`, activá el checkbox "Realtime" y verás mensajes entrantes sin refrescar.

Uso
---
1) Serví esta carpeta con cualquier server estático (o copiá los archivos a tu app).
2) Abrí index.html en el navegador (o la ruta donde lo sirvas).
3) Completá:
   - Backend URL (ej: https://tu-backend.railway.app)
   - Instance ID (el ID de Evolution que ya conectaste)
   - Remote JID (por ejemplo 549...@s.whatsapp.net) o elegí desde la lista de chats.
4) Clic en "Cargar chats", elegí un chat, y probá enviar mensajes.

Notas
-----
- El frontend guarda los datos en localStorage para comodidad.
- Los mensajes se renderizan solo como texto; no incluye adjuntos.
