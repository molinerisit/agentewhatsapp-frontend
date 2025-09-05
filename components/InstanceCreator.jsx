'use client';
import { useState } from 'react';
import { api } from '../lib/api';

export default function InstanceCreator({ onCreated }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const create = async (e) => {
    e.preventDefault();
    setErr('');
    if (!name.trim()) { setErr('Poné un nombre'); return; }
    setLoading(true);
    try {
      const res = await api.createInstance(name.trim());
      await onCreated?.(name.trim(), res);
      setName('');
    } catch (e) {
      try {
        const msg = JSON.parse(e.message);
        setErr(msg?.error || 'Error al crear instancia');
      } catch {
        setErr('Error al crear instancia');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={create} style={{display:'flex', gap:8}}>
      <input
        className="input"
        placeholder="Nombre de instancia (ej: brand_1)"
        value={name}
        onChange={e => setName(e.target.value)}
      />
      <button
        className="button"
        disabled={loading}
        title="Crear instancia y generar QR"
      >
        {loading ? 'Creando…' : 'Crear + QR'}
      </button>
      {err && <span style={{fontSize:12, color:'#fca5a5', marginLeft:8}}>{err}</span>}
    </form>
  );
}
