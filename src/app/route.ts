import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'

export async function GET() {
  const { userId } = await auth()
  const isSignedIn = !!userId

  if (userId) {
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const unsafeMetadata = user.unsafeMetadata as { onboardingCompleted?: boolean } | undefined

    if (!unsafeMetadata?.onboardingCompleted) {
      return NextResponse.redirect(new URL('/onboarding', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'))
    }
  }

  const bodyClass = isSignedIn ? '' : ' class="signed-out-preview"'
  const shellClass = isSignedIn ? 'instant-search-container' : 'instant-search-container app-shell'
  const resultsCount = isSignedIn ? '' : '0 results'
  const hitsContent = isSignedIn ? '' : '<li class="no-results">Sign in with Google to view lessons.</li>'
  const scriptTag = isSignedIn ? '<script src="/search.js?v=db-access-6"></script>' : ''
  const profileButton = isSignedIn ? '<button type="button" id="open-profile-modal" class="feedback-button profile-button">Profile</button>' : ''
  const loginModal = isSignedIn ? '' : `
    <div id="login-required-modal" class="modal-overlay auth-required-overlay" aria-hidden="false">
      <div class="modal-content auth-required-modal">
        <h2>Sign in to view lessons</h2>
        <p>Use Google to access the SOCS4AI lesson search and lesson materials.</p>
        <div class="modal-buttons">
          <a href="/sign-in" class="btn-submit auth-google-button">Continue with Google</a>
        </div>
      </div>
    </div>
  `

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SOCS4AI Lesson Search</title>
  <link rel="stylesheet" href="/search/style.css">
  <link rel="stylesheet" href="/search/custom-overrides.css">
  <style>
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 2rem;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 2rem;
      flex: 1;
    }
    /* Analytics Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.6);
      display: none; /* Hidden by default */
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
    .modal-content {
      background-color: white;
      padding: 2rem;
      border-radius: 8px;
      width: 90%;
      max-width: 480px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 5px 15px rgba(0,0,0,0.3);
    }
    .modal-content h2 {
      margin-top: 0;
      font-size: 1.5rem;
      font-weight: 600;
    }
    .modal-content p {
      margin-bottom: 1.5rem;
      color: #555;
    }
    .modal-content .form-group {
      margin-bottom: 1.5rem;
    }
    .modal-content label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }
    .modal-content select {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ccc;
      border-radius: 4px;
      background-color: #f8f8f8;
    }
    .modal-content textarea,
    .modal-content input[type="text"],
    .modal-content input[type="email"],
    .modal-content input[type="search"] {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ccc;
      border-radius: 4px;
      background-color: #fff;
      font-size: 1rem;
    }
    .modal-content input[readonly] {
      background-color: #f3f5f7;
      color: #555;
    }
    .modal-content textarea {
      min-height: 120px;
      resize: vertical;
    }
    .modal-content .inline-checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0;
      cursor: pointer;
    }
    .feedback-button {
      margin-top: 0.75rem;
      padding: 0.6rem 1rem;
      border: none;
      border-radius: 6px;
      background-color: #0070f3;
      color: white;
      cursor: pointer;
      font-size: 0.95rem;
      transition: background-color 0.2s;
    }
    .feedback-button:hover {
      background-color: #0051cc;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .profile-button {
      background-color: #374151;
    }
    .profile-button:hover {
      background-color: #1f2937;
    }
    .feedback-lesson-results {
      margin-top: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      max-height: 170px;
      overflow-y: auto;
      display: none;
    }
    .feedback-lesson-result {
      width: 100%;
      display: block;
      padding: 0.65rem 0.75rem;
      border: none;
      border-bottom: 1px solid #eee;
      background: #fff;
      color: #333;
      text-align: left;
      cursor: pointer;
      font-size: 0.95rem;
    }
    .feedback-lesson-result:hover,
    .feedback-lesson-result:focus {
      background-color: #f5f8ff;
      outline: none;
    }
    .feedback-selected-lesson {
      display: none;
      padding: 0.75rem;
      border: 1px solid #d7e8fb;
      border-radius: 4px;
      background-color: #f5fbff;
      color: #333;
      font-size: 0.9rem;
      overflow-wrap: anywhere;
    }
    .feedback-selected-lesson strong {
      display: block;
      margin-bottom: 0.25rem;
    }
    .feedback-preview {
      min-height: 160px;
      padding: 0.75rem;
      border: 1px solid #ccc;
      border-radius: 4px;
      background-color: #f8f8f8;
      color: #333;
      font-family: Consolas, Monaco, monospace;
      font-size: 0.85rem;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }
    .feedback-status {
      min-height: 1.2rem;
      margin-top: 0.75rem;
      color: #2e7d32;
      font-size: 0.9rem;
    }
    .modal-content #teacher-radios {
      display: flex;
      gap: 1rem;
    }
    .modal-content #teacher-radios label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .modal-buttons {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 2rem;
    }
    .modal-buttons button {
        padding: 0.75rem 1.25rem;
        border: none;
        border-radius: 6px;
        font-size: 1rem;
        cursor: pointer;
        transition: background-color 0.2s;
    }
    .btn-submit {
        background-color: #0070f3;
        color: white;
    }
    .btn-submit:hover {
        background-color: #0051cc;
    }
    .btn-skip {
        background-color: #e0e0e0;
        color: #333;
    }
    .btn-skip:hover {
        background-color: #c7c7c7;
    }
    .signed-out-preview {
      min-height: 100vh;
      overflow: hidden;
    }
    .signed-out-preview .app-shell {
      filter: blur(5px);
      pointer-events: none;
      user-select: none;
    }
    .auth-required-overlay {
      display: flex;
      backdrop-filter: blur(2px);
    }
    .auth-required-modal {
      text-align: center;
    }
    .auth-required-modal .modal-buttons {
      justify-content: center;
    }
    .auth-google-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.75rem 1.25rem;
      border-radius: 6px;
      text-decoration: none;
      font-size: 1rem;
      transition: background-color 0.2s;
    }
  </style>
</head>
<body${bodyClass}>
  <div class="${shellClass}">
    <header>
      <div class="header-left">
        <a href="/"><img src="/socs-wordmark.png" alt="SOCS For All" style="height: 50px;" /></a>
        <div id="search-input-container">
        <form action="" role="search">
          <input
            id="search-input"
            type="search"
            placeholder="Search for lessons..."
            class="ais-SearchBox-input"
          />
        </form>
      </div>
      <div id="search-note" style="margin-left:1rem;align-self:center;font-size:0.95rem;color:#555;">
        Lessons available are continually being updated and revised.
        Spanish translations currently under review. 
        <div class="header-actions">
          ${profileButton}
          <button type="button" id="open-feedback-modal" class="feedback-button">Submit lesson feedback</button>
        </div>
      </div>
      </div>
    </header>

    <!-- Analytics Pop-up Modal -->
    <div id="analytics-modal" class="modal-overlay">
      <div class="modal-content">
        <h2>A quick question...</h2>
        <p>To help us improve our resources, please answer the following optional questions.</p>
        <form id="analytics-form">
          <div class="form-group">
            <label>Are you a teacher?</label>
            <div id="teacher-radios">
              <label><input type="radio" name="isTeacher" value="true" required> Yes</label>
              <label><input type="radio" name="isTeacher" value="false"> No</label>
            </div>
          </div>
          <div class="form-group" id="grade-level-group" style="display: none;">
            <label for="gradeLevel">What grade do you teach?</label>
            <select id="gradeLevel" name="gradeLevel">
              <option value="">Select a grade</option>
              <option value="K">Kindergarten</option>
              <option value="1">1st Grade</option>
              <option value="2">2nd Grade</option>
              <option value="3">3rd Grade</option>
              <option value="4">4th Grade</option>
              <option value="5">5th Grade</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div class="form-group" id="teacher-info-group" style="display: none;">
            <label for="schoolDistrict">School District (Optional)</label>
            <input type="text" id="schoolDistrict" name="schoolDistrict" placeholder="Enter your school district" style="width: 100%; padding: 0.75rem; border: 1px solid #ccc; border-radius: 4px; margin-bottom: 1rem;">
          </div>
          <div class="modal-buttons">
            <button type="button" id="skip-button" class="btn-skip">Continue to Lesson</button>
            <button type="submit" class="btn-submit">Submit & Continue</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Profile Pop-up Modal -->
    <div id="profile-modal" class="modal-overlay" aria-hidden="true">
      <div class="modal-content">
        <h2>Profile</h2>
        <p>Update the grade and district saved with your SOCS4AI account.</p>
        <form id="profile-form">
          <div class="form-group">
            <label for="profile-email">Email</label>
            <input type="email" id="profile-email" readonly>
          </div>
          <div class="form-group">
            <label for="profile-name">Name</label>
            <input type="text" id="profile-name" readonly>
          </div>
          <div class="form-group">
            <label for="profile-grade">Grade</label>
            <select id="profile-grade" name="gradeLevel">
              <option value="">Select a grade</option>
              <option value="K">Kindergarten</option>
              <option value="1">1st Grade</option>
              <option value="2">2nd Grade</option>
              <option value="3">3rd Grade</option>
              <option value="4">4th Grade</option>
              <option value="5">5th Grade</option>
            </select>
          </div>
          <div class="form-group">
            <label for="profile-district">School District</label>
            <input type="text" id="profile-district" name="district" placeholder="Enter your school district">
          </div>
          <div id="profile-status" class="feedback-status" role="status" aria-live="polite"></div>
          <div class="modal-buttons">
            <button type="button" id="cancel-profile-button" class="btn-skip">Cancel</button>
            <button type="submit" class="btn-submit">Save Profile</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Feedback Pop-up Modal -->
    <div id="feedback-modal" class="modal-overlay" aria-hidden="true">
      <div class="modal-content">
        <h2>Lesson feedback</h2>
        <p>Share suggestions for improvements. If the feedback is about a specific lesson, include the lesson title and link.</p>
        <form id="feedback-form">
          <div class="form-group">
            <label for="feedback-text">Feedback</label>
            <textarea id="feedback-text" name="feedbackText" placeholder="What would you suggest improving?" required></textarea>
          </div>
          <div class="form-group">
            <label class="inline-checkbox-label">
              <input type="checkbox" id="include-lesson-toggle" name="includeLesson">
              Include lesson?
            </label>
          </div>
          <div class="form-group" id="feedback-lesson-group" style="display: none;">
            <label for="feedback-lesson-search">Search by lesson title</label>
            <input id="feedback-lesson-search" type="search" autocomplete="off" placeholder="Start typing a lesson title">
            <div id="feedback-lesson-results" class="feedback-lesson-results"></div>
          </div>
          <div class="form-group">
            <div id="feedback-selected-lesson" class="feedback-selected-lesson"></div>
          </div>
          <div class="form-group">
            <label for="feedback-preview">Email draft preview</label>
            <div id="feedback-preview" class="feedback-preview"></div>
            <div id="feedback-status" class="feedback-status" role="status" aria-live="polite"></div>
          </div>
          <div class="modal-buttons">
            <button type="button" id="cancel-feedback-button" class="btn-skip">Cancel</button>
            <button type="button" id="copy-feedback-button" class="btn-skip">Copy Draft</button>
            <button type="submit" class="btn-submit">Download Draft</button>
          </div>
        </form>
      </div>
    </div>

    <main>
      <div id="left-column">
        <div class="facet">
          <div class="facet-name">Grade Level</div>
          <ul class="facet-values" id="grade-facet"></ul>
        </div>
        
        <div class="facet">
          <div class="facet-name">Subject</div>
          <ul class="facet-values" id="subject-facet"></ul>
        </div>
        
        <div class="facet">
          <div class="facet-name">CT Concepts</div>
          <ul class="facet-values" id="concept-facet"></ul>
        </div>
        
        <div class="facet">
          <div class="facet-name">Has Spanish</div>
          <ul class="facet-values" id="spanish-facet">
            <li>
              <label>
                <input type="checkbox" id="has-spanish-checkbox" class="facet-checkbox">
                <span class="facet-value">Has Spanish</span>
              </label>
            </li>
          </ul>
        </div>
        
        
        <button class="clear-filters" id="clear-filters-btn">
          Clear all filters
        </button>
      </div>

      <div id="right-column">
        <div class="results-header">
          <span id="results-count">${resultsCount}</span>
          <div id="sort-by-wrapper">
            <select id="sort-select">
              <option value="lessonTitle">Title</option>
              <option value="grade">Grade</option>
              <option value="subject">Subject</option>
              <option value="ctConcept">CT Concept</option>
            </select>
            <button id="sort-order-toggle" data-order="asc">Ascending</button>
          </div>
        </div>
        
        <ul class="ais-Hits-list" id="hits">${hitsContent}</ul>
        <div id="pagination" class="pagination" style="margin-top:1rem;display:flex;gap:0.5rem;flex-wrap:wrap;"></div>
      </div>
    </main>

    <footer>
      <p>Powered by SOCS4AI</p>
    </footer>
  </div>
  ${loginModal}
  
  ${scriptTag}
</body>
</html>
  `
  
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  })
}
