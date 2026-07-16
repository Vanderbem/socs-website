'use client'

import * as Clerk from '@clerk/elements/common'
import * as SignUp from '@clerk/elements/sign-up'

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <SignUp.Root fallback={<p className="text-center text-gray-600">Loading sign up...</p>}>
          <SignUp.Step name="start">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Join SOCS4AI</h1>
            <p className="text-gray-600 mb-6">Use Google to access lesson plans.</p>

            <Clerk.GlobalError className="text-red-600 text-sm mb-4" />

            <Clerk.Connection
              name="google"
              className="w-full py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center font-medium text-gray-900"
            >
              Continue with Google
            </Clerk.Connection>
          </SignUp.Step>
        </SignUp.Root>
      </div>
    </div>
  )
}
