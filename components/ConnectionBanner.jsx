'use client';

export default function ConnectionBanner({ state, qr }) {
  if (!state) return null;
  const connected = !!state?.connected;
  return (
    <div className={`w-full p-3 ${connected ? 'bg-emerald-600' : 'bg-amber-600'} rounded-xl mb-3`}>
      {connected ? (
        <p className="text-sm">✅ Conectado a WhatsApp</p>
      ) : (
        <div className="flex items-start gap-3">
          <div>
            <p className="text-sm font-medium">📱 Aún no conectado</p>
            <p className="text-xs opacity-80">Escaneá el QR desde WhatsApp → Dispositivos vinculados</p>
          </div>
          {qr && (
            <img alt="QR" src={`data:image/png;base64,${qr}`} className="ml-auto w-40 h-40 rounded bg-white" />
          )}
        </div>
      )}
    </div>
  );
}
