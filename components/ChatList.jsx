'use client';

export default function ChatList({ chats = [], activeJid, onSelect }) {
  const safe = Array.isArray(chats) ? chats : [];
  return (
    <div className="list">
      {safe.map((c, i) => {
        const jid = c?.id || c?.jid || c?.key?.remoteJid || c?.remoteJid || c?.chatId;
        const name = c?.name || c?.pushName || c?.subject || jid || `chat-${i}`;
        const last = c?.lastMessage?.message || c?.previewMessage || '';
        const isActive = activeJid === jid;
        return (
          <button
            key={`${jid || i}`}
            onClick={() => jid && onSelect(jid)}
            className={`list-item ${isActive ? 'active' : ''}`}
          >
            <div className="item-title">{name}</div>
            {typeof last === 'string' && last && (
              <div className="item-subtitle">{last}</div>
            )}
          </button>
        );
      })}
    </div>
  );
}
