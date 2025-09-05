'use client';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { normalizeQrData } from '../utils/sanitize';
import QRCode from 'qrcode';

export default function ConnectionBanner({ state, qr, pairingManual, instance, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [localQr, setLocalQr] = useState(null);
  const [generatedUrl, setGeneratedUrl] = useState(null);
  const [pairing, setPairing] = useState(pairingManual || null);

  useEffect(() => {
    setPairing(pairingManual || null);
  }, [pairingManual]);

  const connected = !!state?.connected;
  useEffect(() => {
    if (connected) {
      setLocalQr(null);
      setGeneratedUrl(null);
    }
  }, [connected]);

  const rawQr = useMemo(() => {
    return localQr || qr || state?.qrcode || state?.code || state?.base64 || state?.qr || null;
  }, [localQr, qr, state]);

  const { dataUrl, content } = useMemo(() => normalizeQrData(rawQr), [rawQr]);

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
      const res = await api.connect(instance);
      // Solo QR real en localQr
      setLocalQr(res?.code || null);
      // Pairing code guardado por separado
      if (res?.pairingCode) setPairing(String(res.pairingCode));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setTimeout(() => setConnecting(false), 1500);
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
    <div className={`banner ${connected ? 'ok' : 'warn'}`}>
      {connected ? (
        <div className="row">
          <p style={{fontSize:14}}>✅ Conectado a WhatsApp</p>
          <button
            onClick={doRefresh}
            className="button spacer"
            disabled={loading}
          >
            {loading ? 'Actualizando…' : 'Refrescar estado'}
          </button>
        </div>
      ) : (
        <>
          <div style={{flex:1}}>
            <p style={{fontSize:14, fontWeight:600}}>📱 Aún no conectado</p>
            <p style={{fontSize:12, opacity:.8, marginBottom:8}}>
              Escaneá el QR o ingresá el pairing code desde WhatsApp → Dispositivos vinculados.
            </p>

            {pairing && (
              <div className="badge" style={{marginBottom:8}}>
                Pairing Code: <span style={{fontWeight:700}}>{pairing}</span>
              </div>
            )}

            <div style={{display:'flex', gap:8}}>
              <button
                onClick={doConnect}
                className="button"
                disabled={loading || connecting}
                title="Generar/Actualizar QR"
              >
                {loading || connecting ? 'Generando…' : 'Generar/Actualizar QR'}
              </button>
              <button
                onClick={doRefresh}
                className="button"
                disabled={loading}
              >
                {loading ? 'Actualizando…' : 'Refrescar estado'}
              </button>
            </div>

            {!imgSrc && rawQr && (
              <div style={{marginTop:8, fontSize:12, opacity:.8}}>
                Recibimos el QR pero no como imagen; intentando generarlo…
              </div>
            )}
            {!imgSrc && !rawQr && (
              <div style={{marginTop:8, fontSize:12, opacity:.8}}>
                No hay QR disponible todavía. Tocá “Generar/Actualizar QR”.
              </div>
            )}
          </div>

          {imgSrc && (
            <img
              alt="QR"
              src={imgSrc}
              className="qr"
            />
          )}
        </>
      )}
    </div>
  );
}
