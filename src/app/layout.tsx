import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = { title: 'Terminal Chat' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-black text-green-400">{children}</body>
    </html>
  )
}
