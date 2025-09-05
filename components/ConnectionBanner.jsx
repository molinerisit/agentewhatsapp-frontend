'use client';
import { useState } from 'react';
import { api } from '../lib/api';

export default function ConnectionBanner({ state, qr, instance, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const connected = !!state?.connected;
  const pairing = state?.pairingCode || state?.pairing?.code; // a veces viene así
  const showQR = qr || state?.qrcode || state?.code;          // distintos campos posibles

  const doConnect = async () => {
    if (!instance) return;
    setLoading(true);
    try {
      await api.connect(instance);     // fuerza connect en backend → Evolution
      await onRefresh?.();             // vuelve a consultar /connection
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const doRefresh = async () => {
    setLoading(true);
    try {
      await onRefresh?.();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`w-full p-3 ${connected ? 'bg-emerald-600' : 'bg-amber-600'} rounded-xl mb-3`}>
      {connected ? (
        <div className="flex items-center gap-3">
          <p className="text-sm">✅ Conectado a WhatsApp</p>
          <button
            onClick={doRefresh}
            className="ml-auto px-3 py-1.5 rounded bg-black/20 hover:bg-black/30 text-sm"
            disabled={loading}
          >
            {loading ? 'Actualizando…' : 'Refrescar estado'}
          </button>
        </div>
      ) : (
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <p className="text-sm font-medium">📱 Aún no conectado</p>
            <p className="text-xs opacity-80 mb-2">
              Escaneá el QR o ingresá el pairing code desde WhatsApp → Dispositivos vinculados.
            </p>

            {/* Pairing code (numérico) si viene */}
            {pairing && (
              <div className="text-sm font-mono mb-2 bg-black/20 inline-block px-2 py-1 rounded">
                Pairing Code: <span className="font-bold">{pairing}</span>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={doConnect}
                className="px-3 py-1.5 rounded bg-black/20 hover:bg-black/30 text-sm"
                disabled={loading}
                title="Generar/Actualizar QR"
              >
                {loading ? 'Generando…' : 'Generar/Actualizar QR'}
              </button>
              <button
                onClick={doRefresh}
                className="px-3 py-1.5 rounded bg-black/20 hover:bg-black/30 text-sm"
                disabled={loading}
              >
                {loading ? 'Actualizando…' : 'Refrescar estado'}
              </button>
            </div>
          </div>

          {/* QR si viene en base64 */}
          {showQR && (
            <img
              alt="QR"
              src={`data:image/png;base64,${showQR}`}
              className="ml-auto w-40 h-40 rounded bg-white"
            />
          )}
        </div>
      )}
    </div>
  );
}
