import React, { useEffect, useMemo, useState } from 'react'
import InstancePicker from '../components/InstancePicker.jsx'
import InstanceCreator from '../components/InstanceCreator.jsx'
import ConnectionBanner from '../components/ConnectionBanner.jsx'
import ChatList from '../components/ChatList.jsx'
import MessageThread from '../components/MessageThread.jsx'
import Composer from '../components/Composer.jsx'
import { api, socket } from '../lib/api.js'

export default function App(){
  const [instances, setInstances] = useState([])
  const [instance, setInstance] = useState('')
  const [state, setState] = useState(null)
  const [qr, setQr] = useState(null)
  const [chats, setChats] = useState([])
  const [activeJid, setActiveJid] = useState(null)
  const [messages, setMessages] = useState([])

  useEffect(()=>{
    api.instances().then(setInstances).catch(console.error)
    const s = socket()
    s.on('connect', ()=> console.log('socket connected'))
    s.on('evolution:event', (evt)=>{
      // Podés filtrar y actualizar estados segun evt.type
      if(evt.type === 'message.upsert' && evt.instanceId === instance && evt.message){
        if(evt.message.jid === activeJid){
          setMessages(prev => [...prev, { from: evt.message.from, text: evt.message.text }])
        }
      }
      if(evt.type === 'connection.update' && evt.instanceId === instance){
        setState(evt.state)
        setQr(evt.qr || null)
      }
    })
    return ()=> s.close()
  }, [instance, activeJid])

  async function pickInstance(id){
    setInstance(id)
    setQr(null)
    setState('connecting')
    try {
      const st = await api.state(id)
      setState(st?.state || 'disconnected')
      if(st?.state === 'qr'){
        const q = await api.qr(id)
        setQr(q?.qr || q?.image || q?.data)
      }
      const cs = await api.chats(id)
      setChats(cs?.chats || cs || [])
    } catch (e){
      console.error(e)
      setState('disconnected')
    }
  }

  async function createInstance(name){
    const created = await api.createInstance(name)
    const list = await api.instances()
    setInstances(list)
    const id = created?.id || created?.name || name
    pickInstance(id)
  }

  async function deleteInstance(id){
    await api.deleteInstance(id)
    const list = await api.instances()
    setInstances(list)
    if(instance === id){ setInstance(''); setChats([]); setMessages([]) }
  }

  async function openChat(jid){
    setActiveJid(jid)
    const ms = await api.messages(instance, jid)
    const data = ms?.messages || ms || []
    const norm = data.map(m => ({
      from: m.from || (m.key?.fromMe ? 'me' : 'them'),
      text: m.text || m.message?.conversation || m.body || ''
    }))
    setMessages(norm)
  }

  async function send(text){
    if(!instance || !activeJid) return
    await api.sendText(instance, activeJid, text)
    setMessages(prev => [...prev, { from: 'me', text }])
  }

  return (
    <div>
      <header>
        <h3 style={{margin:0}}>Evolution Bot Panel</h3>
        <ConnectionBanner state={state} />
      </header>

      <div className='toolbar'>
        <InstancePicker 
          instances={instances} 
          value={instance} 
          onChange={pickInstance} 
          onDelete={deleteInstance}
        />
        <InstanceCreator onCreate={createInstance} />
      </div>

      <div className='container'>
        <aside className='sidebar'>
          <ChatList items={chats} active={activeJid} onPick={openChat} />
        </aside>
        <main className='content'>
          {qr && state === 'qr' ? (
            <div className='qr'>
              <img src={qr} alt='QR' style={{maxWidth:320}} />
            </div>
          ) : (
            <div className='chat'>
              <MessageThread messages={messages} me='me' />
              <Composer onSend={send} />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
