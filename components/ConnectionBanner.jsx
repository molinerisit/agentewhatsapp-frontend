//frontend/components/ConnectionBanner.jsx

'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../lib/api';
import { normalizeQrData } from '../utils/sanitize';
import QRCode from 'qrcode';

export default function ConnectionBanner({ state, qr, instance, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false); // evita dobles llamados
  const [localQr, setLocalQr] = useState(null);        // QR que viene de /connect
  const [generatedUrl, setGeneratedUrl] = useState(null);

  // Si ya estamos conectados, limpiamos QR local
  const connected = !!state?.connected;
  useEffect(() => {
    if (connected) {
      setLocalQr(null);
      setGeneratedUrl(null);
    }
  }, [connected]);

  // Preferencias: localQr (si existe) > prop qr > state fields
  const rawQr = useMemo(() => {
    return localQr || qr || state?.qrcode || state?.code || state?.base64 || state?.qr || null;
  }, [localQr, qr, state]);

  const pairing = pairingManual || state?.pairingCode || state?.pairing?.code || null;


  // Normalizamos lo que venga
  const { dataUrl, content } = useMemo(() => normalizeQrData(rawQr), [rawQr]);

  // Si solo hay "contenido", generamos PNG
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
    if (!instance || connecting) return;
    setConnecting(true);
    setLoading(true);
    try {
      // Solo pedimos un QR y lo mostramos (NO llamamos onRefresh inmediatamente)
      const res = await api.connect(instance);
// solo QR real en localQr
setLocalQr(res?.code || null);
// guarda pairing por separado (NO como QR)
if (res?.pairingCode) {
  // pegá esto junto a los useState de arriba:
  // const [pairingManual, setPairingManual] = useState(null);
  setPairingManual(res.pairingCode.toString());
}

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      // Dejamos un pequeño cooldown para evitar spam que rote QR
      setTimeout(() => setConnecting(false), 1500);
    }
  };

  const doRefresh = async () => {
    setLoading(true);
    try {
      // Refrescamos solo estado, sin rotar QR
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
                disabled={loading || connecting}
                title="Generar/Actualizar QR"
              >
                {loading || connecting ? 'Generando…' : 'Generar/Actualizar QR'}
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
                No hay QR disponible todavía. Tocá “Generar/Actualizar QR”.
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
