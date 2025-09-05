import React from 'react'

export default function MessageThread({ messages = [], me }){
  return (
    <div className='messages'>
      {messages.map((m,i)=>(
        <div key={i} className={'msg ' + (m.from === me ? 'me' : 'them')}>
          {m.text || m.body || JSON.stringify(m)}
        </div>
      ))}
    </div>
  )
}
