import React from 'react'

export default function ConnectionBanner({ state }){
  const map = {
    connected: 'Conectado ✅',
    connecting: 'Conectando… ⏳',
    disconnected: 'Desconectado ❌',
    qr: 'Escaneá el QR para vincular 📱'
  }
  return (
    <div className='badge' title={state || 'unknown'}>
      {map[state] || state || '—'}
    </div>
  )
}
