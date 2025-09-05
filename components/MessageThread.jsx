'use client';
import { extractText } from '../utils/format';

export default function MessageThread({ messages = [] }) {
  return (
    <div className="thread">
      {messages.map((m, idx) => {
        const fromMe = m?.key?.fromMe || m?.fromMe;
        const text = extractText(m) || '⟂ mensaje sin texto';
        return (
          <div key={m?.key?.id || idx} className={`msg ${fromMe ? 'me' : 'other'}`}>
            <div>{text}</div>
          </div>
        );
      })}
    </div>
  );
}
