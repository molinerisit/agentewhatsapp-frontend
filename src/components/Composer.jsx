import React, { useState } from 'react'

export default function Composer({ onSend }){
  const [text, setText] = useState('')
  return (
    <div className='composer'>
      <input placeholder='Escribí un mensaje…' value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>{
        if(e.key === 'Enter' && text.trim()) { onSend?.(text); setText('') }
      }} />
      <button onClick={()=>{ if(text.trim()){ onSend?.(text); setText('') }}}>Enviar</button>
    </div>
  )
}
