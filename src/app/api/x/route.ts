import { NextRequest, NextResponse } from 'next/server'

const messages: Array<{
  id: string
  user: string
  fp: string
  content: string
  time: number
}> = []

const users = new Map<string, string>()

function genName(ip: string): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let h = 0
  for (let i = 0; i < ip.length; i++) {
    h = ((h << 5) - h) + ip.charCodeAt(i)
    h = h & h
  }
  let name = 'agent_'
  const n = Math.abs(h).toString()
  for (let i = 0; i < 6; i++) {
    name += chars[(parseInt(n[i % n.length] || '0') + i * 7) % chars.length]
  }
  return name
}

function getFp(req: NextRequest): string {
  return (req.headers.get('x-forwarded-for') || 
          req.headers.get('x-real-ip') || 
          'unknown').toString().replace(/[:.]/g, '_')
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')
  const fp = getFp(req)
  
  if (!users.has(fp)) users.set(fp, genName(fp))
  const user = users.get(fp)!

  if (action === 'messages') {
    const since = parseInt(searchParams.get('since') || '0')
    return NextResponse.json({
      ok: true,
      you: { fp, user },
      messages: messages.filter(m => m.time > since)
    })
  }

  if (action === 'whoami') {
    return NextResponse.json({
      ok: true,
      fp,
      user,
      count: messages.filter(m => m.fp === fp).length
    })
  }

  if (action === 'users') {
    const list = [...new Set(messages.map(m => m.user))]
    return NextResponse.json({ ok: true, users: list, total: users.size })
  }

  return NextResponse.json({ ok: false, error: 'Use ?action=messages|whoami|users' }, { status: 400 })
}

export async function POST(req: NextRequest) {
  const fp = getFp(req)
  if (!users.has(fp)) users.set(fp, genName(fp))
  const user = users.get(fp)!

  try {
    const body = await req.json()
    const content = (body.content || '').toString().trim().slice(0, 2000)
    
    if (!content) {
      return NextResponse.json({ ok: false, error: 'Empty message' }, { status: 400 })
    }

    const msg = { id: Math.random().toString(36).slice(2), user, fp, content, time: Date.now() }
    messages.push(msg)
    if (messages.length > 500) messages.shift()

    return NextResponse.json({ ok: true, msg })
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }
}
