'use client';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { normalizeQrData } from '../utils/sanitize';
import QRCode from 'qrcode';

export default function ConnectionBanner({ state, qr, instance, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const connected = !!state?.connected;
  const pairing = state?.pairingCode || state?.pairing?.code || null;

  // Aceptamos cualquier variante posible que pueda venir
  const rawQr = qr || state?.qrcode || state?.code || state?.base64 || state?.qr || null;

  // Normalizamos: si ya es imagen -> dataUrl; si no -> content
  const { dataUrl, content } = useMemo(() => normalizeQrData(rawQr), [rawQr]);

  // Si no hay dataUrl pero sí "content", generamos PNG en cliente
  const [generatedUrl, setGeneratedUrl] = useState(null);
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!dataUrl && content) {
        try {
          const url = await QRCode.toDataURL(content, { margin: 1, errorCorrectionLevel: 'M' });
          if (mounted) setGeneratedUrl(url);
        } catch (err) {
          console.error('QR generate error:', err);
          if (mounted) setGeneratedUrl(null);
        }
      } else {
        setGeneratedUrl(null);
      }
    })();
    return () => { mounted = false; };
  }, [dataUrl, content]);

  const imgSrc = dataUrl || generatedUrl || null;

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

            {!imgSrc && rawQr && (
              <div className="mt-2 text-xs opacity-80">
                Recibimos el QR pero no como imagen; intentando generarlo…
              </div>
            )}
            {!imgSrc && !rawQr && (
              <div className="mt-2 text-xs opacity-80">
                No hay QR disponible todavía. Probá “Generar/Actualizar QR”.
              </div>
            )}
          </div>

          {imgSrc && (
            <img
              alt="QR"
              src={imgSrc}
              className="ml-auto w-40 h-40 rounded bg-white"
            />
          )}
        </div>
      )}
    </div>
  );
}
