import React from 'react'

export default function InstancePicker({ instances = [], value, onChange, onDelete }){
  return (
    <div style={{display:'flex', gap:8}}>
      <select value={value || ''} onChange={e=>onChange(e.target.value)}>
        <option value=''>Elegir instancia…</option>
        {instances.map((i)=>(
          <option key={i.id || i.name} value={i.id || i.name}>
            {i.name || i.id}
          </option>
        ))}
      </select>
      {value && <button onClick={()=>onDelete?.(value)}>Eliminar</button>}
    </div>
  )
}
