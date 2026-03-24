'use client'

import { useEffect, useState } from 'react'

interface User {
  username: string
  count: number
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [online, setOnline] = useState(0)

  useEffect(() => {
    const fetchUsers = () => {
      fetch('/api/x?action=users')
        .then(r => r.json())
        .then(data => {
          if (data.ok) {
            setUsers(data.users)
            setOnline(data.online)
          }
        })
    }
    
    fetchUsers()
    const interval = setInterval(fetchUsers, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono p-4">
      <div className="max-w-2xl mx-auto">
        <div className="border border-green-600 p-3 mb-4">
          <span className="text-green-300">{'>'} USERS ONLINE: {online}</span>
        </div>

        <div className="border border-green-600">
          <table className="w-full">
            <thead>
              <tr className="border-b border-green-600">
                <th className="p-2 text-left text-green-300">USERNAME</th>
                <th className="p-2 text-right text-green-300">MSGS</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={2} className="p-4 text-green-600 text-center">
                    No users yet
                  </td>
                </tr>
              ) : (
                users.map((user, i) => (
                  <tr key={i} className="border-b border-green-800">
                    <td className="p-2 text-cyan-400">{user.username}</td>
                    <td className="p-2 text-right text-green-600">{user.count}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="text-green-600 text-sm mt-4 text-center">
          {'>'} Auto-refresh every 5s
        </div>
      </div>
    </div>
  )
}
