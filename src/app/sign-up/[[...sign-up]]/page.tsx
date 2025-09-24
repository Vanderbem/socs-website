'use client'

import { useState } from 'react'
import * as Clerk from '@clerk/elements/common'
import * as SignUp from '@clerk/elements/sign-up'

export default function SignUpPage() {
  const [isTeacher, setIsTeacher] = useState<boolean | null>(null)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 py-12 px-4">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">
        <SignUp.Root>
          {/* Initial sign-up form */}
          <SignUp.Step name="start">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Join SOCS4AI</h1>
            <p className="text-gray-600 mb-6">Create your account to access lesson plans</p>

            <Clerk.Connection name="google" className="w-full mb-4 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center">
              Sign up with Google
            </Clerk.Connection>

            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or</span>
              </div>
            </div>

            <div className="space-y-4">
              <Clerk.Field name="emailAddress">
                <Clerk.Label className="block text-sm font-medium text-gray-700 mb-1">Email</Clerk.Label>
                <Clerk.Input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <Clerk.FieldError className="text-red-600 text-sm mt-1" />
              </Clerk.Field>

              <Clerk.Field name="password">
                <Clerk.Label className="block text-sm font-medium text-gray-700 mb-1">Password</Clerk.Label>
                <Clerk.Input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <Clerk.FieldError className="text-red-600 text-sm mt-1" />
              </Clerk.Field>

              <SignUp.Captcha />

              <SignUp.Action submit className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                Continue
              </SignUp.Action>
            </div>
          </SignUp.Step>

          {/* Additional fields step - this is where we add onboarding questions */}
          <SignUp.Step name="continue">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Tell us about yourself</h1>
            <p className="text-gray-600 mb-6">This helps us personalize your experience</p>

            <div className="space-y-6">
              {/* Teacher question */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Are you a teacher?
                </label>
                <div className="space-y-2">
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="isTeacher"
                      value="yes"
                      onChange={() => setIsTeacher(true)}
                      className="mr-3"
                      required
                    />
                    <div>
                      <div className="font-medium">Yes, I'm a teacher</div>
                      <div className="text-sm text-gray-500">I teach students in K-12</div>
                    </div>
                  </label>
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="isTeacher"
                      value="no"
                      onChange={() => setIsTeacher(false)}
                      className="mr-3"
                      required
                    />
                    <div>
                      <div className="font-medium">No, I'm not a teacher</div>
                      <div className="text-sm text-gray-500">I'm a parent, administrator, or other</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Grade level - only show if teacher */}
              {isTeacher && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What grade(s) do you teach?
                  </label>
                  <select 
                    name="gradeLevel"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select grade level</option>
                    <option value="K">Kindergarten</option>
                    <option value="1">1st Grade</option>
                    <option value="2">2nd Grade</option>
                    <option value="3">3rd Grade</option>
                    <option value="4">4th Grade</option>
                    <option value="5">5th Grade</option>
                    <option value="K-2">K-2 Multiple</option>
                    <option value="3-5">3-5 Multiple</option>
                    <option value="K-5">K-5 All Elementary</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              )}

              {/* School name - only show if teacher */}
              {isTeacher && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    School Name (Optional)
                  </label>
                  <input 
                    type="text"
                    name="school"
                    placeholder="Enter your school name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <SignUp.Action submit className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                Complete Registration
              </SignUp.Action>
            </div>
          </SignUp.Step>

          {/* Email verification step */}
          <SignUp.Step name="verifications">
            <SignUp.Strategy name="email_code">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h1>
              <p className="text-gray-600 mb-6">We sent a verification code to your email address</p>

              <Clerk.Field name="code">
                <Clerk.Label className="block text-sm font-medium text-gray-700 mb-2">Verification Code</Clerk.Label>
                <Clerk.Input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <Clerk.FieldError className="text-red-600 text-sm mt-1" />
              </Clerk.Field>

              <SignUp.Action submit className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors mt-4">
                Verify Email
              </SignUp.Action>
            </SignUp.Strategy>

            <SignUp.Strategy name="phone_code">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Check your phone</h1>
              <p className="text-gray-600 mb-6">We sent a verification code to your phone</p>

              <Clerk.Field name="code">
                <Clerk.Label className="block text-sm font-medium text-gray-700 mb-2">Phone Code</Clerk.Label>
                <Clerk.Input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <Clerk.FieldError className="text-red-600 text-sm mt-1" />
              </Clerk.Field>

              <SignUp.Action submit className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors mt-4">
                Verify Phone
              </SignUp.Action>
            </SignUp.Strategy>
          </SignUp.Step>
        </SignUp.Root>
      </div>
    </div>
  )
}