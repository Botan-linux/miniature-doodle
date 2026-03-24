'use client'

import { useEffect, useState } from 'react'

interface User { username: string; count: number }

export default function Users() {
  const [users, setUsers] = useState<User[]>([])
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
    <div className="min-h-screen bg-black text-green-400 font-mono p-4">
      <div className="max-w-2xl mx-auto">
        <div className="border border-green-600 p-3 mb-4">
          {'>'} USERS ONLINE: {total}
        </div>
        <div className="border border-green-600">
          <table className="w-full">
            <thead>
              <tr className="border-b border-green-600">
                <th className="p-2 text-left">USERNAME</th>
                <th className="p-2 text-right">MSGS</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={2} className="p-4 text-center text-green-600">No users yet</td></tr>
              ) : users.map((u, i) => (
                <tr key={i} className="border-b border-green-800">
                  <td className="p-2 text-cyan-400">{u.username}</td>
                  <td className="p-2 text-right text-green-600">{u.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
