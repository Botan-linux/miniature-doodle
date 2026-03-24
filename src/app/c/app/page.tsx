'use client'

import { useEffect, useState, useRef } from 'react'

interface Message {
  id: string
  user: string
  content: string
  time: number
}

interface UserInfo {
  fingerprint: string
  username: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [user, setUser] = useState<UserInfo | null>(null)
  const [lastTime, setLastTime] = useState(0)
  const [error, setError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Get user info
  useEffect(() => {
    fetch('/api/x?action=whoami')
      .then(r => r.json())
      .then(data => {
        if (data.ok) setUser({ fingerprint: data.fingerprint, username: data.username })
      })
  }, [])

  // Poll messages
  useEffect(() => {
    const poll = () => {
      fetch(`/api/x?action=messages&since=${lastTime}`)
        .then(r => r.json())
        .then(data => {
          if (data.ok && data.messages.length > 0) {
            setMessages(prev => {
              const newMsgs = [...prev, ...data.messages]
              return newMsgs.slice(-100)
            })
            setLastTime(data.messages[data.messages.length - 1].time)
          }
        })
    }
    
    poll()
    const interval = setInterval(poll, 1500)
    return () => clearInterval(interval)
  }, [lastTime])

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim()) return
    
    setError('')
    const res = await fetch('/api/x', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: input.trim() })
    })
    
    const data = await res.json()
    if (data.ok) {
      setInput('')
    } else {
      setError(data.error || 'Error')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="border border-green-600 p-3 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-green-300">{'>'} TERMINAL_CHAT</span>
            {user && (
              <span className="text-green-600 text-sm">
                USER: {user.username}
              </span>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="border border-green-600 h-[60vh] overflow-y-auto p-3 mb-4">
          {messages.length === 0 ? (
            <div className="text-green-600">
              {'>'} Waiting for messages...<br />
              {'>'} curl -X POST -H &quot;Content-Type: application/json&quot; -d &#123;&#34;content&#34;:&#34;hello&#34;&#125; URL/api/x
            </div>
          ) : (
            messages.map(msg => (
              <div key={msg.id} className="mb-2">
                <span className="text-green-600">[{formatTime(msg.time)}]</span>{' '}
                <span className="text-cyan-400">&lt;{msg.user}&gt;</span>{' '}
                <span className="text-green-300">{msg.content}</span>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border border-green-600 p-3">
          <div className="flex gap-2">
            <span className="text-green-600">{'>'}</span>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 bg-transparent outline-none text-green-300"
              placeholder="Type message..."
            />
            <button
              onClick={sendMessage}
              className="text-green-600 hover:text-green-400"
            >
              [SEND]
            </button>
          </div>
          {error && <div className="text-red-500 text-sm mt-1">ERROR: {error}</div>}
        </div>

        {/* Footer */}
        <div className="text-green-600 text-sm mt-4 text-center">
          {'>'} API: /api/x?action=messages | /api/x?action=whoami | POST /api/x
        </div>
      </div>
    </div>
  )
}
