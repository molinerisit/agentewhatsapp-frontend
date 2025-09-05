//frontend/components/InstanceCreator.jsx

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
      // crea en Evolution y fuerza connect
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
    <form onSubmit={create} className="flex gap-2">
      <input
        className="flex-1 p-2 rounded bg-gray-900 border border-gray-700"
        placeholder="Nombre de instancia (ej: brand_1)"
        value={name}
        onChange={e => setName(e.target.value)}
      />
      <button
        className="px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50"
        disabled={loading}
        title="Crear instancia y generar QR"
      >
        {loading ? 'Creando…' : 'Crear + QR'}
      </button>
      {err && <span className="text-sm text-red-400 ml-2">{err}</span>}
    </form>
  );
}
