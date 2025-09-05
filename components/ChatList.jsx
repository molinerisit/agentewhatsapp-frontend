//frontend/components/ChatList.jsx

'use client';

export default function ChatList({ chats = [], activeJid, onSelect }) {
  return (
    <div className="overflow-y-auto h-full space-y-1 pr-2">
      {chats.map((c, i) => {
        const jid = c?.id || c?.jid || c?.key?.remoteJid || c?.remoteJid || c?.chatId;
        const name = c?.name || c?.pushName || c?.subject || jid;
        const last = c?.lastMessage?.message || c?.previewMessage || '';
        const isActive = activeJid === jid;
        return (
          <button
            key={`${jid}-${i}`}
            onClick={() => onSelect(jid)}
            className={`w-full text-left p-3 rounded-lg ${isActive ? 'bg-gray-800' : 'bg-gray-900 hover:bg-gray-800'}`}
          >
            <div className="text-sm font-medium truncate">{name}</div>
            {last && <div className="text-xs opacity-70 truncate">{typeof last === 'string' ? last : ''}</div>}
          </button>
        );
      })}
    </div>
  );
}
