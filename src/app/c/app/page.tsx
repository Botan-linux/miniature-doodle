'use client'

import { useEffect, useState, useRef } from 'react'

interface Msg { id: string; user: string; content: string; time: number }
interface User { fp: string; user: string }

export default function Chat() {
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [me, setMe] = useState<User | null>(null)
  const [last, setLast] = useState(0)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/x?action=whoami').then(r => r.json()).then(d => d.ok && setMe({ fp: d.fp, user: d.user }))
  }, [])

  useEffect(() => {
    const poll = () => {
      fetch(`/api/x?action=messages&since=${last}`).then(r => r.json()).then(d => {
        if (d.ok && d.messages?.length) {
          setMsgs(p => [...p, ...d.messages].slice(-100))
          setLast(d.messages.at(-1).time)
        }
      })
    }
    poll()
    const i = setInterval(poll, 2000)
    return () => clearInterval(i)
  }, [last])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  const send = async () => {
    if (!input.trim()) return
    await fetch('/api/x', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: input }) })
    setInput('')
  }

  const t = (ts: number) => new Date(ts).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono p-4">
      <div className="max-w-4xl mx-auto">
        <div className="border border-green-600 p-3 mb-4 flex justify-between">
          <span>{'>'} TERMINAL_CHAT</span>
          {me && <span className="text-green-600">USER: {me.user}</span>}
        </div>
        <div className="border border-green-600 h-[60vh] overflow-y-auto p-3 mb-4">
          {msgs.length === 0 ? <div className="text-green-600">{'>'} Waiting for messages...</div> :
            msgs.map(m => (
              <div key={m.id} className="mb-1">
                <span className="text-green-600">[{t(m.time)}]</span>{' '}
                <span className="text-cyan-400">&lt;{m.user}&gt;</span>{' '}
                <span>{m.content}</span>
              </div>
            ))}
          <div ref={endRef} />
        </div>
        <div className="border border-green-600 p-3 flex gap-2">
          <span className="text-green-600">{'>'}</span>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
            className="flex-1 bg-transparent outline-none" placeholder="Type..." />
          <button onClick={send} className="text-green-600 hover:text-green-400">[SEND]</button>
        </div>
        <div className="text-green-600 text-sm mt-4 text-center">
          curl -X POST SITE/api/x -H "Content-Type: application/json" -d '{"content":"hello"}'
        </div>
      </div>
    </div>
  )
}
