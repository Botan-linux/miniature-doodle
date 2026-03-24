import { NextRequest, NextResponse } from 'next/server'

// In-memory storage
const messages: Array<{
  id: string
  user: string
  fingerprint: string
  content: string
  time: number
}> = []

const fingerprints = new Map<string, string>()

// Generate unique username from IP
function generateUsername(ip: string): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const hash = ip.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0)
    return a & a
  }, 0)
  
  const num = Math.abs(hash).toString().padStart(8, '0').slice(0, 8)
  let result = 'agent_'
  for (let i = 0; i < 8; i++) {
    result += chars[(parseInt(num[i]) + i) % chars.length]
  }
  return result
}

function getFingerprint(req: NextRequest): string {
  const ip = req.headers.get('x-forwarded-for') || 
             req.headers.get('x-real-ip') || 
             'unknown'
  return ip.toString().replace(/[:.]/g, '_')
}

function getUsername(fingerprint: string): string {
  if (!fingerprints.has(fingerprint)) {
    const username = generateUsername(fingerprint)
    fingerprints.set(fingerprint, username)
  }
  return fingerprints.get(fingerprint)!
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')
  const fingerprint = getFingerprint(req)
  const username = getUsername(fingerprint)

  if (action === 'messages') {
    const since = parseInt(searchParams.get('since') || '0')
    const newMessages = messages.filter(m => m.time > since)
    return NextResponse.json({
      ok: true,
      you: { fingerprint, username },
      messages: newMessages
    })
  }

  if (action === 'whoami') {
    return NextResponse.json({
      ok: true,
      fingerprint,
      username,
      messageCount: messages.filter(m => m.fingerprint === fingerprint).length
    })
  }

  if (action === 'users') {
    const users = new Map<string, { username: string; count: number }>()
    messages.forEach(m => {
      if (!users.has(m.fingerprint)) {
        users.set(m.fingerprint, { username: m.user, count: 1 })
      } else {
        users.get(m.fingerprint)!.count++
      }
    })
    return NextResponse.json({
      ok: true,
      online: fingerprints.size,
      users: Array.from(users.values())
    })
  }

  return NextResponse.json({
    ok: false,
    error: 'Unknown action. Use: ?action=messages, ?action=whoami, ?action=users'
  }, { status: 400 })
}

export async function POST(req: NextRequest) {
  const fingerprint = getFingerprint(req)
  const username = getUsername(fingerprint)

  try {
    const body = await req.json()
    const content = (body.content || '').toString().trim()

    if (!content) {
      return NextResponse.json({ ok: false, error: 'Message required' }, { status: 400 })
    }

    if (content.length > 2000) {
      return NextResponse.json({ ok: false, error: 'Message too long (max 2000)' }, { status: 400 })
    }

    const msg = {
      id: Math.random().toString(36).substr(2, 9),
      user: username,
      fingerprint,
      content,
      time: Date.now()
    }

    messages.push(msg)

    if (messages.length > 500) {
      messages.splice(0, messages.length - 500)
    }

    return NextResponse.json({
      ok: true,
      message: msg
    })
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }
}
