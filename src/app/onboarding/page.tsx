'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

export default function OnboardingPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [isTeacher, setIsTeacher] = useState<boolean | null>(null)
  const [gradeLevel, setGradeLevel] = useState('')
  const [school, setSchool] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirect users who have already completed onboarding
  if (isLoaded && user && user.unsafeMetadata?.onboardingCompleted) {
    router.push('/')
    return null
  }

  // Don't render until Clerk is loaded
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  // If no user, redirect to sign up
  if (!user) {
    router.push('/sign-up')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsSubmitting(true)

    try {
      // Update user metadata in Clerk
      await user.update({
        unsafeMetadata: {
          isTeacher,
          gradeLevel: isTeacher ? gradeLevel : null,
          school: isTeacher ? school : null,
          onboardingCompleted: true,
        }
      })

      // Track the onboarding completion
      await fetch('/api/track/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          isTeacher,
          gradeLevel,
          school,
        })
      })

      router.push('/')
    } catch (error) {
      console.error('Onboarding error:', error)
      alert('There was an error completing your profile. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-12 px-4">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to SOCS4AI!</h1>
        <p className="text-gray-600 mb-6">
          Let's personalize your experience. This helps us understand who uses our platform.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
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

          {isTeacher && (
            <>
              <div>
                <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-2">
                  What grade(s) do you teach?
                </label>
                <select
                  id="grade"
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
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

              <div>
                <label htmlFor="school" className="block text-sm font-medium text-gray-700 mb-2">
                  School Name (Optional)
                </label>
                <input
                  type="text"
                  id="school"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  placeholder="Enter your school name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isSubmitting || isTeacher === null}
            className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Saving...' : 'Complete Profile'}
          </button>

          <p className="text-xs text-gray-500 text-center">
            You can update this information anytime in your profile settings.
          </p>
        </form>
      </div>
    </div>
  )
}