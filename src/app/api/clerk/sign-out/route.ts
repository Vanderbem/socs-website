import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const returnUrl = searchParams.get('returnUrl') || '/'
  
  // Clear the session and redirect
  const response = NextResponse.redirect(new URL(returnUrl, request.url))
  
  // Clear Clerk cookies
  response.cookies.set('__session', '', { maxAge: 0 })
  response.cookies.set('__client_uat', '', { maxAge: 0 })
  
  return response
}