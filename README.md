# Frontend (sin Tailwind) – Evolution WhatsApp Inbox

## Configuración
1. Copiá `.env.example` a `.env.local` y completá:
```
NEXT_PUBLIC_BACKEND_URL=https://tu-backend.railway.app
NEXT_PUBLIC_BACKEND_KEY=tu-clave-backend
```
2. Instalar y arrancar:
```
npm i
npm run dev
```
3. Primer uso:
- Creá instancia con el botón **Crear + QR**.
- Si WhatsApp te ofrece **Vincular con número de teléfono**, ingresá el **Pairing Code** mostrado en el banner.
- Si usa QR, escanealo desde **Dispositivos vinculados**.

> Este front espera que el backend exponga los endpoints `/api/...` tal como en tu server Express.

