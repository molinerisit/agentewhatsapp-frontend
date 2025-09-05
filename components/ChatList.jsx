'use client';

export default function ChatList({ chats = [], activeJid, onSelect }) {
  return (
    <div className="list">
      {chats.map((c, i) => {
        const jid = c?.id || c?.jid || c?.key?.remoteJid || c?.remoteJid || c?.chatId;
        const name = c?.name || c?.pushName || c?.subject || jid;
        const last = c?.lastMessage?.message || c?.previewMessage || '';
        const isActive = activeJid === jid;
        return (
          <button
            key={`${jid}-${i}`}
            onClick={() => onSelect(jid)}
            className={`list-item ${isActive ? 'active' : ''}`}
          >
            <div className="item-title">{name}</div>
            {last && <div className="item-subtitle">{typeof last === 'string' ? last : ''}</div>}
          </button>
        );
      })}
    </div>
  );
}
