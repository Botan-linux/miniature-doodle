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

  const formatTime = (ts: number) => new Date(ts).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#4ade80', fontFamily: 'monospace', padding: '1rem' }}>
      <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
        <div style={{ border: '1px solid #16a34a', padding: '0.75rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
          <span>&gt; TERMINAL_CHAT</span>
          {me && <span style={{ color: '#16a34a' }}>USER: {me.user}</span>}
        </div>
        <div style={{ border: '1px solid #16a34a', height: '60vh', overflowY: 'auto', padding: '0.75rem', marginBottom: '1rem' }}>
          {msgs.length === 0 ? (
            <div style={{ color: '#16a34a' }}>&gt; Waiting for messages...</div>
          ) : (
            msgs.map(m => (
              <div key={m.id} style={{ marginBottom: '0.25rem' }}>
                <span style={{ color: '#16a34a' }}>[{formatTime(m.time)}]</span>{' '}
                <span style={{ color: '#22d3ee' }}>&lt;{m.user}&gt;</span>{' '}
                <span>{m.content}</span>
              </div>
            ))
          )}
          <div ref={endRef} />
        </div>
        <div style={{ border: '1px solid #16a34a', padding: '0.75rem', display: 'flex', gap: '0.5rem' }}>
          <span style={{ color: '#16a34a' }}>&gt;</span>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#4ade80' }}
            placeholder="Type..."
          />
          <button onClick={send} style={{ color: '#16a34a', background: 'transparent', border: 'none', cursor: 'pointer' }}>[SEND]</button>
        </div>
        <div style={{ color: '#16a34a', fontSize: '0.875rem', marginTop: '1rem', textAlign: 'center' }}>
          curl -X POST SITE/api/x -H "Content-Type: application/json" -d &apos;&#123;"content":"hello"&#125;&apos;
        </div>
      </div>
    </div>
  )
}
