'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

export default function OnboardingPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [isTeacher, setIsTeacher] = useState<boolean | null>(null)
  const [gradeLevel, setGradeLevel] = useState('')
  const [district, setDistrict] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const hasCompletedOnboarding = Boolean(user?.unsafeMetadata?.onboardingCompleted)

  useEffect(() => {
    if (!isLoaded) return

    if (!user) {
      router.replace('/sign-up')
      return
    }

    if (hasCompletedOnboarding) {
      router.replace('/')
    }
  }, [hasCompletedOnboarding, isLoaded, router, user])

  // Don't render until Clerk is loaded
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  if (!user || hasCompletedOnboarding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <p>Redirecting...</p>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/track/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isTeacher,
          gradeLevel: isTeacher ? gradeLevel : null,
          district: isTeacher ? district : null,
        })
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}))
        throw new Error(errorBody.error || 'Unable to save onboarding information')
      }

      // Update user metadata in Clerk after the database write succeeds
      await user.update({
        unsafeMetadata: {
          isTeacher,
          gradeLevel: isTeacher ? gradeLevel : null,
          district: isTeacher ? district : null,
          onboardingCompleted: true,
        }
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to SOCS4ALL!</h1>
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
                </select>
              </div>

              <div>
                <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-2">
                  School District (Optional)
                </label>
                <input
                  type="text"
                  id="district"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="Enter your school district"
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
