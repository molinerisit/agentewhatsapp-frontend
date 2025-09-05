//frontend/components/MessageThread.jsx

'use client';
import { extractText } from '../utils/format';

export default function MessageThread({ messages = [], meJid }) {
  return (
    <div className="flex flex-col gap-2 p-2 overflow-y-auto h-full">
      {messages.map((m, idx) => {
        const fromMe = m?.key?.fromMe || m?.fromMe;
        const text = extractText(m);
        return (
          <div key={m?.key?.id || idx} className={`max-w-[70%] p-2 rounded-xl ${fromMe ? 'ml-auto bg-emerald-700' : 'bg-gray-800'}`}>
            <div className="whitespace-pre-wrap text-sm">{text || '⟂ mensaje sin texto'}</div>
          </div>
        );
      })}
    </div>
  );
}
