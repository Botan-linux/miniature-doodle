'use client'

import { useEffect, useState } from 'react'

export default function Users() {
  const [users, setUsers] = useState<string[]>([])
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const fetchUsers = () => {
      fetch('/api/x?action=users').then(r => r.json()).then(d => {
        if (d.ok) { setUsers(d.users); setTotal(d.total) }
      })
    }
    fetchUsers()
    const i = setInterval(fetchUsers, 5000)
    return () => clearInterval(i)
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#4ade80', fontFamily: 'monospace', padding: '1rem' }}>
      <div style={{ maxWidth: '48rem', margin: '0 auto' }}>
        <div style={{ border: '1px solid #16a34a', padding: '0.75rem', marginBottom: '1rem' }}>
          &gt; USERS ONLINE: {total}
        </div>
        <div style={{ border: '1px solid #16a34a' }}>
          <table style={{ width: '100%' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #16a34a' }}>
                <th style={{ padding: '0.5rem', textAlign: 'left' }}>USERNAME</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={1} style={{ padding: '1rem', textAlign: 'center', color: '#16a34a' }}>No users yet</td></tr>
              ) : users.map((u, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #166534' }}>
                  <td style={{ padding: '0.5rem', color: '#22d3ee' }}>{u}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
