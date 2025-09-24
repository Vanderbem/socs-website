import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const { userId } = await auth()
    
    if (userId) {
      // Sign out the user via Clerk backend
      const client = await clerkClient()
      await client.sessions.revokeSession(userId)
    }
    
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Sign out error:', error)
    return NextResponse.json({ success: false }, { status: 200 })
  }
}

export async function GET() {
  // Redirect to home page for GET requests
  return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'))
}