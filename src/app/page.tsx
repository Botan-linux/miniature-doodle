import { NextResponse } from 'next/server'

export default function NotFound() {
  return new NextResponse(null, { status: 404 })
}
