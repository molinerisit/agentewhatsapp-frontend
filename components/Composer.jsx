'use client';
import { useState } from 'react';

export default function Composer({ onSend, disabled }) {
  const [text, setText] = useState('');
  return (
    <form
      className="composer"
      onSubmit={e => { e.preventDefault(); if (!text.trim()) return; onSend(text); setText(''); }}
    >
      <input
        className="input"
        placeholder="Escribe un mensaje…"
        value={text}
        onChange={e => setText(e.target.value)}
      />
      <button className="button" disabled={disabled}>Enviar</button>
    </form>
  );
}
