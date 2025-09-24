import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const { userId } = await auth()
  
  if (userId) {
    return NextResponse.json({ authenticated: true }, { status: 200 })
  } else {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
}