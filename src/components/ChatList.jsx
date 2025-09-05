import React from 'react'

export default function ChatList({ items = [], active, onPick }){
  return (
    <ul className='list'>
      {items.map(c => (
        <li key={c.id || c.jid} className={active === (c.id || c.jid) ? 'active' : ''}
            onClick={()=>onPick?.(c.id || c.jid)}>
          <div style={{fontWeight:600}}>{c.name || c.jid}</div>
          <div style={{fontSize:12, color:'#666'}}>{c.lastMessage?.text || ''}</div>
        </li>
      ))}
    </ul>
  )
}
