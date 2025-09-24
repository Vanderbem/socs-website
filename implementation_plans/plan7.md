Of course. It's clear from your description and the provided files that the current user flow is disjointed. The issues with the sign-in button, the non-functional "View Lesson" buttons, and the lack of a clear data collection mechanism are all related.

Here is a comprehensive plan to address these problems. This plan will remove Clerk as the primary sign-in method, use Drizzle and PostgreSQL to handle user interactions, and implement a non-intrusive, skippable pop-up to gather analytics when a user clicks on a lesson.

### **Analysis of the Project's State**

1.  **Authentication is Problematic**: Clerk is implemented, but it isn't seamlessly integrated. The sign-in button doesn't update its state, and this is likely because the frontend (`public/search.js`) isn't correctly reacting to changes in Clerk's authentication state.
2.  **"View Lesson" is Ineffective**: The buttons are present, but the logic to handle clicks on them is either missing or broken. This is a critical failure of the user journey.
3.  **Data Analytics are Non-existent**: You have a Drizzle and PostgreSQL setup (`src/lib/db/schema.ts`), but there is no mechanism to capture user interactions. Without a way to track which lessons are being viewed, it's impossible to gather analytics.
4.  **Onboarding is a Dead End**: You have an onboarding page (`src/app/onboarding/page.tsx`), but it's not effectively used. Forcing users through a separate page is a point of friction, and your suggestion to replace it with a skippable pop-up is an excellent one.

### **Detailed Implementation Plan**

This plan will be broken down into three phases:

1.  **Backend First**: Create the API endpoint needed to save the answers from the pop-up.
2.  **Frontend Overhaul**: Implement the pop-up modal and completely change the logic for the "View Lesson" buttons.
3.  **Cleanup**: Remove the unnecessary Clerk-specific pages and logic.

---

### **Phase 1: Create the Analytics API Endpoint**

First, we need to create an API route that the pop-up will send data to. This route will save the user's answers to your PostgreSQL database using Drizzle.

I will update the existing, but unused, onboarding API at `src/app/api/track/onboarding/route.ts` to be more generic.

<diff>
<original file="/Users/ian/Desktop/socs_website/src/app/api/track/onboarding/route.ts" />
<modified file="/Users/ian/Desktop/socs_website/src/app/api/track/onboarding/route.ts" />
</diff>
```diff
--- a/src/app/api/track/onboarding/route.ts
+++ b/src/app/api/track/onboarding/route.ts
@@ -1,37 +1,33 @@
-import { NextResponse } from 'next/server'
-import { auth } from '@clerk/nextjs/server'
+import { NextResponse } from 'next/server';
+import { db } from '@/lib/db';
+import { userProfiles } from '@/lib/db/schema';
 
 export async function POST(request: Request) {
   try {
-    const { userId: authUserId } = await auth()
-    
-    if (!authUserId) {
-      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
-    }
+    const body = await request.json();
+    const { userId, isTeacher, gradeLevel, school } = body;
 
-    const body = await request.json()
-    const { userId, isTeacher, gradeLevel, school } = body
+    // Validate that we have at least a unique ID
+    if (!userId) {
+      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
+    }
 
-    // Verify the user ID matches the authenticated user
-    if (userId !== authUserId) {
-      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
-    }
-
-    // Here you could save to a database or analytics service
-    console.log('Onboarding completed:', {
+    // Save the data to the database using Drizzle ORM
+    await db.insert(userProfiles).values({
       userId,
       isTeacher,
       gradeLevel,
       school,
-      completedAt: new Date().toISOString()
-    })
+      onboardingCompleted: true, // Mark that they have answered
+    }).onConflictDoUpdate({
+      target: userProfiles.userId,
+      set: { isTeacher, gradeLevel, school, onboardingCompleted: true, updatedAt: new Date() },
+    });
 
-    return NextResponse.json({ success: true })
+    return NextResponse.json({ success: true });
   } catch (error) {
-    console.error('Error tracking onboarding:', error)
-    return NextResponse.json(
-      { error: 'Internal server error' },
-      { status: 500 }
-    )
+    console.error('Error saving user profile:', error);
+    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
   }
 }
```

### **Phase 2: Frontend Overhaul**

Now, I'll implement the pop-up modal and connect it to the "View Lesson" buttons. This requires two changes: adding the HTML for the modal to `src/app/route.ts` and updating the JavaScript in `public/search.js` to control it.

First, here is the updated `route.ts` with the new, hidden modal.

<diff>
<original file="/Users/ian/Desktop/socs_website/src/app/route.ts" />
<modified file="/Users/ian/Desktop/socs_website/src/app/route.ts" />
</diff>
```diff
--- a/src/app/route.ts
+++ b/src/app/route.ts
@@ -29,6 +29,88 @@
       gap: 2rem;
       flex: 1;
     }
+    /* Analytics Modal Styles */
+    .modal-overlay {
+      position: fixed;
+      top: 0;
+      left: 0;
+      width: 100%;
+      height: 100%;
+      background-color: rgba(0, 0, 0, 0.6);
+      display: none; /* Hidden by default */
+      justify-content: center;
+      align-items: center;
+      z-index: 1000;
+    }
+    .modal-content {
+      background-color: white;
+      padding: 2rem;
+      border-radius: 8px;
+      width: 90%;
+      max-width: 480px;
+      box-shadow: 0 5px 15px rgba(0,0,0,0.3);
+    }
+    .modal-content h2 {
+      margin-top: 0;
+      font-size: 1.5rem;
+      font-weight: 600;
+    }
+    .modal-content p {
+      margin-bottom: 1.5rem;
+      color: #555;
+    }
+    .modal-content .form-group {
+      margin-bottom: 1.5rem;
+    }
+    .modal-content label {
+      display: block;
+      margin-bottom: 0.5rem;
+      font-weight: 500;
+    }
+    .modal-content select {
+      width: 100%;
+      padding: 0.75rem;
+      border: 1px solid #ccc;
+      border-radius: 4px;
+      background-color: #f8f8f8;
+    }
+    .modal-content #teacher-radios {
+      display: flex;
+      gap: 1rem;
+    }
+    .modal-content #teacher-radios label {
+      display: flex;
+      align-items: center;
+      gap: 0.5rem;
+    }
+    .modal-buttons {
+      display: flex;
+      justify-content: flex-end;
+      gap: 0.75rem;
+      margin-top: 2rem;
+    }
+    .modal-buttons button {
+        padding: 0.75rem 1.25rem;
+        border: none;
+        border-radius: 6px;
+        font-size: 1rem;
+        cursor: pointer;
+        transition: background-color 0.2s;
+    }
+    .btn-submit {
+        background-color: #0070f3;
+        color: white;
+    }
+    .btn-submit:hover {
+        background-color: #0051cc;
+    }
+    .btn-skip {
+        background-color: #e0e0e0;
+        color: #333;
+    }
+    .btn-skip:hover {
+        background-color: #c7c7c7;
+    }
   </style>
 </head>
 <body>
@@ -62,6 +144,38 @@
       </div>
     </header>
 
+    <!-- Analytics Pop-up Modal -->
+    <div id="analytics-modal" class="modal-overlay">
+      <div class="modal-content">
+        <h2>A quick question...</h2>
+        <p>To help us improve our resources, please answer the following optional questions.</p>
+        <form id="analytics-form">
+          <div class="form-group">
+            <label>Are you a teacher?</label>
+            <div id="teacher-radios">
+              <label><input type="radio" name="isTeacher" value="true" required> Yes</label>
+              <label><input type="radio" name="isTeacher" value="false"> No</label>
+            </div>
+          </div>
+          <div class="form-group" id="grade-level-group" style="display: none;">
+            <label for="gradeLevel">What grade do you teach?</label>
+            <select id="gradeLevel">
+              <option value="">Select a grade</option>
+              <option value="K-2">K-2</option>
+              <option value="3-5">3-5</option>
+              <option value="Other">Other</option>
+            </select>
+          </div>
+          <div class="modal-buttons">
+            <button type="button" id="skip-button" class="btn-skip">Continue to Lesson</button>
+            <button type="submit" class="btn-submit">Submit & Continue</button>
+          </div>
+        </form>
+      </div>
+    </div>
+
+
     <main>
       <div id="left-column">
         <div class="facet">

```

Next, here is the updated `public/search.js`. I've removed all the Clerk-related code and implemented the logic to show the modal, handle its submission, and ensure the lesson opens correctly.

<diff>
<original file="/Users/ian/Desktop/socs_website/public/search.js" />
<modified file="/Users/ian/Desktop/socs_website/public/search.js" />
</diff>
```diff
--- a/public/search.js
+++ b/public/search.js
@@ -310,81 +310,105 @@
     document.getElementById('clear-filters-btn')?.addEventListener('click', clearFilters);
 }
 
-// --- NEW CLERK.JS AUTHENTICATION LOGIC ---
-
-let clerk = null; // This will hold the global Clerk instance
-
-/**
- * This function is called once the Clerk.js script is fully loaded.
- * It initializes the Clerk instance and sets up listeners to keep the UI in sync.
- */
-function startClerk() {
-  clerk = window.Clerk;
-  
-  // Add a listener to automatically update the UI whenever the user signs in or out
-  clerk.addListener(({ user }) => {
-    updateAuthUI(user);
-    checkRedirect(); // Check for a pending lesson redirect after auth state changes
-  });
-  
-  // Initial UI setup and redirect check
-  updateAuthUI(clerk.user);
-  checkRedirect();
-}
-
-/**
- * Dynamically updates the header buttons based on the user's authentication state.
- * @param {object | null} user - The Clerk user object, or null if signed out.
- */
-function updateAuthUI(user) {
-    const authContainer = document.getElementById('auth-container');
-    if (!authContainer) return;
-
-    if (user) {
-        // User is signed in: show a "Sign Out" button
-        authContainer.innerHTML = `
-            <button class="sign-in-btn" id="sign-out-btn">Sign Out</button>
-        `;
-        document.getElementById('sign-out-btn')?.addEventListener('click', () => {
-            clerk?.signOut({ redirectUrl: '/' });
-        });
-    } else {
-        // User is signed out: show a "Sign In / Sign Up" button
-        authContainer.innerHTML = `
-            <button class="sign-up-btn" id="auth-action-btn">Sign In / Sign Up</button>
-        `;
-        document.getElementById('auth-action-btn')?.addEventListener('click', () => {
-            window.location.href = '/sign-in';
-        });
-    }
-}
-
-/**
- * Opens the authentication modal or redirects to sign-in page
- */
-function openAuthModal() {
-    // For now, redirect to the sign-in page
-    // In the future, this could open a modal with Clerk's authentication UI
-    window.location.href = '/sign-in';
-}
+// --- NEW ANALYTICS & LESSON VIEW LOGIC ---
+
+let lessonUrlToOpen = null;
 
 /**
  * Handles clicking on a "View Lesson" button.
- * If the user is signed in, it opens the lesson. If not, it opens the custom auth modal
- * and saves the lesson URL to be opened after a successful login.
- * @param {string} lessonUrl - The URL of the lesson to view.
+ * Stores the lesson URL and displays the analytics modal.
  */
 function handleLessonClick(lessonUrl) {
-  if (clerk && clerk.user) {
-    // User is signed in, open the lesson directly
+  lessonUrlToOpen = lessonUrl;
+  document.getElementById('analytics-modal').style.display = 'flex';
+}
+
+// Expose handleLessonClick to the global scope so inline `onclick` attributes can find it
+window.handleLessonClick = handleLessonClick;
+
+/**
+ * Hides the modal and opens the stored lesson link in a new tab.
+ */
+function proceedToLesson() {
+  document.getElementById('analytics-modal').style.display = 'none';
+  document.getElementById('analytics-form').reset();
+  document.getElementById('grade-level-group').style.display = 'none';
+  
+  if (lessonUrlToOpen) {
     window.open(lessonUrlToOpen, '_blank', 'noopener,noreferrer');
-  } else {
-    // User is not signed in. Store the target URL and open the authentication modal.
-    localStorage.setItem('redirectAfterSignIn', lessonUrl);
-    openAuthModal();
-  }
-}
-
-// Expose handleLessonClick to global scope so onclick handlers can access it
-window.handleLessonClick = handleLessonClick;
-
-/**
- * Checks if there is a pending lesson redirect in localStorage after a user signs in.
- * If found, it opens the lesson and clears the stored URL.
- */
-function checkRedirect() {
-    const redirectUrl = localStorage.getItem('redirectAfterSignIn');
-    if (redirectUrl && clerk && clerk.user) {
-        localStorage.removeItem('redirectAfterSignIn');
-        window.open(redirectUrl, '_blank', 'noopener,noreferrer');
-    }
+    lessonUrlToOpen = null; // Clear after use
+  }
+}
+
+/**
+ * Generates or retrieves a unique anonymous ID for the user.
+ */
+function getAnonymousId() {
+  let anonId = localStorage.getItem('socs-anonymous-id');
+  if (!anonId) {
+    anonId = crypto.randomUUID();
+    localStorage.setItem('socs-anonymous-id', anonId);
+  }
+  return anonId;
+}
+
+/**
+ * Sets up event listeners for the analytics modal.
+ */
+function initializeAnalyticsModal() {
+  const form = document.getElementById('analytics-form');
+  const skipButton = document.getElementById('skip-button');
+  const teacherRadios = document.querySelectorAll('input[name="isTeacher"]');
+
+  // Handle form submission
+  form.addEventListener('submit', async (e) => {
+    e.preventDefault();
+    const formData = new FormData(form);
+    const isTeacher = formData.get('isTeacher') === 'true';
+    const gradeLevel = isTeacher ? formData.get('gradeLevel') : null;
+    
+    const payload = {
+      userId: getAnonymousId(),
+      isTeacher,
+      gradeLevel,
+      school: null // School is not asked in this version
+    };
+
+    try {
+      await fetch('/api/track/onboarding', {
+        method: 'POST',
+        headers: { 'Content-Type': 'application/json' },
+        body: JSON.stringify(payload),
+      });
+    } catch (error) {
+      console.error("Failed to submit analytics:", error);
+      // We still proceed to the lesson even if the analytics call fails
+    } finally {
+      proceedToLesson();
+    }
+  });
+
+  // Handle the skip button
+  skipButton.addEventListener('click', () => {
+    proceedToLesson();
+  });
+
+  // Show/hide grade level question based on teacher status
+  teacherRadios.forEach(radio => {
+    radio.addEventListener('change', (e) => {
+      const isTeacher = e.target.value === 'true';
+      const gradeGroup = document.getElementById('grade-level-group');
+      const gradeSelect = document.getElementById('gradeLevel');
+      
+      if (isTeacher) {
+        gradeGroup.style.display = 'block';
+        gradeSelect.required = true;
+      } else {
+        gradeGroup.style.display = 'none';
+        gradeSelect.required = false;
+      }
+    });
+  });
 }
 
 // --- SCRIPT EXECUTION ---
@@ -393,39 +417,10 @@
 if (document.readyState === 'loading') {
     document.addEventListener('DOMContentLoaded', () => {
         initializeSearch();
-        initializeClerk();
+        initializeAnalyticsModal();
     });
 } else {
     initializeSearch();
-    initializeClerk();
-}
-
-function initializeClerk() {
-    // Try to initialize Clerk if it's available
-    if (window.Clerk) {
-        window.Clerk.load().then(startClerk).catch((error) => {
-            console.error('Failed to load Clerk:', error);
-            // Fallback to basic auth buttons
-            showFallbackAuth();
-        });
-    } else {
-        // Wait for Clerk to be available
-        let attempts = 0;
-        const checkClerk = setInterval(() => {
-            attempts++;
-            if (window.Clerk) {
-                clearInterval(checkClerk);
-                window.Clerk.load().then(startClerk).catch((error) => {
-                    console.error('Failed to load Clerk:', error);
-                    showFallbackAuth();
-                });
-            } else if (attempts > 20) {
-                // After 10 seconds, show fallback
-                clearInterval(checkClerk);
-                console.warn('Clerk not available, using fallback');
-                showFallbackAuth();
-            }
-        }, 500);
-    }
-}
-
-function showFallbackAuth() {
-    const authContainer = document.getElementById('auth-container');
-    if (!authContainer) return;
-    
-    authContainer.innerHTML = `
-        <button class="sign-up-btn" onclick="window.location.href='/sign-in'">Sign In</button>
-    `;
-}
+    initializeAnalyticsModal();
+}
```

### **Phase 3: Cleanup**

With the new modal flow, the old Clerk sign-in, sign-up, and onboarding pages are no longer needed. You can safely delete the following directories and files to keep your project clean:

*   **Delete**: `/src/app/sign-in/`
*   **Delete**: `/src/app/sign-up/`
*   **Delete**: `/src/app/onboarding/`
*   **Delete**: `/src/app/api/auth/`
*   **Delete**: `/src/app/api/clerk/`

By following these steps, you will have a much more streamlined and effective user experience. The "View Lesson" buttons will now work, you'll be able to gather valuable (but optional) data from your users, and the codebase will be simpler and easier to maintain.