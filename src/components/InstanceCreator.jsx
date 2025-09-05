import React, { useState } from 'react'

export default function InstanceCreator({ onCreate }){
  const [name, setName] = useState('')
  return (
    <div style={{display:'flex', gap:8}}>
      <input placeholder='Nombre de instancia' value={name} onChange={e=>setName(e.target.value)} />
      <button onClick={()=> name && onCreate?.(name)}>Crear</button>
    </div>
  )
}
