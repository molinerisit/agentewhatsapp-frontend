import axios from 'axios'
import { io } from 'socket.io-client'

export const api = {
  async health(){ return (await axios.get('/api/health')).data },
  async instances(){ return (await axios.get('/api/instances')).data },
  async createInstance(name){ return (await axios.post('/api/instances',{name})).data },
  async deleteInstance(id){ return (await axios.delete(`/api/instances/${id}`)).data },
  async qr(id){ return (await axios.get(`/api/instances/${id}/qr`)).data },
  async state(id){ return (await axios.get(`/api/instances/${id}/state`)).data },
  async chats(id){ return (await axios.get(`/api/instances/${id}/chats`)).data },
  async messages(id, jid, cursor){ 
    return (await axios.get(`/api/instances/${id}/messages`, { params: { jid, cursor } })).data 
  },
  async sendText(id, to, text){ 
    return (await axios.post(`/api/instances/${id}/messages`, { to, text })).data 
  },
}

export function socket(){
  return io('', { path: '/socket.io' }) // al mismo origen del frontend, proxyeado por Vite
}
