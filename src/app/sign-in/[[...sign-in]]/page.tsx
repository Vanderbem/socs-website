'use client'

import { useEffect } from 'react'
import * as Clerk from '@clerk/elements/common'
import * as SignIn from '@clerk/elements/sign-in'

export default function SignInPage() {
  useEffect(() => {
    // Detect if trapped inside the WordPress iframe
    if (window.top !== window.self) {
      // Break out and redirect the top-level browser window to this sign-in URL
      window.top!.location.href = window.location.href
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <SignIn.Root fallback={<p className="text-center text-gray-600">Loading sign in...</p>}>
          <SignIn.Step name="start">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign in to SOCS4AI</h1>
            <p className="text-gray-600 mb-6">Use Google to access lesson plans.</p>

            <Clerk.GlobalError className="text-red-600 text-sm mb-4" />

            <Clerk.Connection
              name="google"
              className="w-full py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center font-medium text-gray-900"
            >
              Continue with Google
            </Clerk.Connection>
          </SignIn.Step>

          <SignIn.Step name="sso-callback">
            <SignIn.Captcha />
            <p className="text-center text-gray-600">Completing sign in...</p>
          </SignIn.Step>
        </SignIn.Root>
      </div>
    </div>
  )
}