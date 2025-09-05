'use client';
import { useState } from 'react';

export default function Composer({ onSend, disabled }) {
  const [text, setText] = useState('');
  return (
    <form
      className="flex gap-2 p-2 border-t border-gray-800"
      onSubmit={e => { e.preventDefault(); if (!text.trim()) return; onSend(text); setText(''); }}
    >
      <input
        className="flex-1 p-2 rounded bg-gray-900 border border-gray-700"
        placeholder="Escribe un mensaje…"
        value={text}
        onChange={e => setText(e.target.value)}
      />
      <button className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50" disabled={disabled}>Enviar</button>
    </form>
  );
}
