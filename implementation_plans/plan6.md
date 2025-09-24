clean this up and implement it 
Of course. I can help you implement a more seamless authentication flow for your website. Based on your requirements, I will outline a plan to create a pop-up modal for login/sign-up that ensures users are redirected to their intended lesson after authentication and includes your specified questions in the sign-up process.

This implementation will use Clerk.js to handle the authentication logic, ensuring a secure and smooth user experience without full-page reloads.

### **Implementation Plan**

1.  **Create a Custom Authentication Modal:**
    *   Instead of relying on separate pages, a single, hidden modal will be added to your main search page. This modal will contain two tabs: one for "Sign In" and one for a custom "Sign Up" form.
    *   The "Sign In" tab will use Clerk's standard pop-up for a quick and easy login process.
    *   The "Sign Up" tab will feature a custom form that includes the "Are you a teacher?" and "What grade do you teach?" questions, built to capture this information directly.

2.  **Implement Smart Redirection:**
    *   When a non-authenticated user clicks a "View Lesson" button, the link to the Google Drive folder will be temporarily saved in the browser's `localStorage`.
    *   The custom authentication modal will then be displayed.
    *   After the user successfully signs in or signs up, the page will recognize their new login status, retrieve the saved folder link, and automatically open it in a new tab. This ensures that any filters the user applied on the search page remain intact.

3.  **Integrate Custom Sign-Up Fields:**
    *   The new sign-up form will be wired to a JavaScript function that captures the answers to your custom questions.
    *   Upon submission, this data will be passed to Clerk and stored in the `unsafeMetadata` field of the new user's profile, making it available for future use.
    *   This process will replace the previous, multi-step onboarding flow with a single, integrated sign-up experience.

4.  **Code Cleanup:**
    *   The now-redundant sign-up and onboarding pages (`/src/app/sign-up` and `/src/app/onboarding`) can be safely removed from the project to keep the codebase clean and maintainable.

Here are the updated files to implement this functionality.

### **Updated Files**

First, the main page's HTML structure is updated to include the new, hidden authentication modal.

<diff>
<original file="/Users/ian/Desktop/socs_website/src/app/route.ts" />
<modified file="/Users/ian/Desktop/socs_website/src/app/route.ts" />
</diff>
```diff
--- a/src/app/route.ts
+++ b/src/app/route.ts
@@ -29,6 +29,91 @@
       gap: 2rem;
       flex: 1;
     }
+    /* Custom Auth Modal Styles */
+    .auth-modal-overlay {
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
+    .auth-modal-content {
+      background-color: white;
+      padding: 2rem;
+      border-radius: 8px;
+      width: 90%;
+      max-width: 420px;
+      box-shadow: 0 5px 15px rgba(0,0,0,0.3);
+    }
+    .auth-modal-header {
+      display: flex;
+      justify-content: space-between;
+      align-items: center;
+      margin-bottom: 1rem;
+    }
+    .auth-modal-close {
+      background: none;
+      border: none;
+      font-size: 1.5rem;
+      cursor: pointer;
+    }
+    .auth-modal-body form .form-group {
+      margin-bottom: 1rem;
+    }
+    .auth-modal-body label {
+      display: block;
+      margin-bottom: 0.5rem;
+      font-weight: 500;
+    }
+    .auth-modal-body input[type="email"],
+    .auth-modal-body input[type="password"],
+    .auth-modal-body select {
+      width: 100%;
+      padding: 0.75rem;
+      border: 1px solid #ccc;
+      border-radius: 4px;
+    }
+    .auth-modal-body button {
+        width: 100%;
+        padding: 0.75rem;
+        border: none;
+        border-radius: 4px;
+        background-color: #0070f3;
+        color: white;
+        font-size: 1rem;
+        cursor: pointer;
+    }
+    .auth-modal-footer {
+      margin-top: 1rem;
+      text-align: center;
+    }
+    .auth-modal-footer a {
+      color: #0070f3;
+      cursor: pointer;
+    }
+    #grade-level-group {
+      display: none; /* Hidden by default */
+    }
+    #teacher-radios label {
+      display: inline-block;
+      margin-right: 1rem;
+    }
+    /* Error message styling */
+    #signup-error {
+        color: red;
+        margin-bottom: 1rem;
+        text-align: center;
+    }
   </style>
 </head>
 <body>
@@ -62,6 +147,56 @@
       </div>
     </header>
 
+    <!-- Custom Authentication Modal -->
+    <div id="auth-modal" class="auth-modal-overlay">
+      <div class="auth-modal-content">
+        <div class="auth-modal-header">
+          <h2 id="auth-modal-title">Sign Up</h2>
+          <button id="auth-modal-close" class="auth-modal-close">&times;</button>
+        </div>
+        <div class="auth-modal-body">
+          <p id="auth-modal-subtitle">Create an account to view this lesson.</p>
+          <div id="signup-error"></div>
+          <form id="signup-form">
+            <div class="form-group">
+              <label for="signup-email">Email Address</label>
+              <input type="email" id="signup-email" required>
+            </div>
+            <div class="form-group">
+              <label for="signup-password">Password</label>
+              <input type="password" id="signup-password" required>
+            </div>
+            <div class="form-group">
+              <label>Are you a teacher?</label>
+              <div id="teacher-radios">
+                <label><input type="radio" name="isTeacher" value="true" required> Yes</label>
+                <label><input type="radio" name="isTeacher" value="false"> No</label>
+              </div>
+            </div>
+            <div class="form-group" id="grade-level-group">
+              <label for="gradeLevel">What grade do you teach?</label>
+              <select id="gradeLevel">
+                <option value="">Select a grade</option>
+                <option value="K-2">K-2</option>
+                <option value="3-5">3-5</option>
+                <option value="Other">Other</option>
+              </select>
+            </div>
+            <button type="submit" id="signup-submit-btn">Continue</button>
+          </form>
+        </div>
+        <div class="auth-modal-footer">
+            <p>Already have an account? <a id="switch-to-signin">Sign In</a></p>
+        </div>
+      </div>
+    </div>
+
     <main>
       <div id="left-column">
         <div class="facet">

```

Next, the client-side JavaScript is updated to manage the new modal, handle the custom sign-up form, and ensure the redirection logic works as intended.

<diff>
<original file="/Users/ian/Desktop/socs_website/public/search.js" />
<modified file="/Users/ian/Desktop/socs_website/public/search.js" />
</diff>
```diff
--- a/public/search.js
+++ b/public/search.js
@@ -352,22 +352,109 @@
     document.getElementById('clear-filters-btn')?.addEventListener('click', clearFilters);
 }
 
-// --- NEW CLERK.JS AUTHENTICATION LOGIC ---
-
-let clerk = null; // This will hold the global Clerk instance
-
 /**
- * This function is called once the Clerk.js script is fully loaded.
- * It initializes the Clerk instance and sets up listeners to keep the UI in sync.
+ * Handles clicking on a "View Lesson" button.
+ * If the user is signed in, it opens the lesson. If not, it opens the sign-in modal
+ * and saves the lesson URL to be opened after a successful login.
+ * @param {string} lessonUrl - The URL of the lesson to view.
+ */
+function handleLessonClick(lessonUrl) {
+  if (clerk && clerk.user) {
+    // User is signed in, open the lesson directly
+    window.open(lessonUrl, '_blank', 'noopener,noreferrer');
+  } else {
+    // User is not signed in. Store the target URL and open the authentication modal.
+    localStorage.setItem('redirectAfterSignIn', lessonUrl);
+    openAuthModal();
+  }
+}
+
+/**
+ * Checks if there is a pending lesson redirect in localStorage after a user signs in.
+ * If found, it opens the lesson and clears the stored URL.
+ */
+function checkRedirect() {
+    const redirectUrl = localStorage.getItem('redirectAfterSignIn');
+    if (redirectUrl && clerk && clerk.user) {
+        localStorage.removeItem('redirectAfterSignIn');
+        window.open(redirectUrl, '_blank', 'noopener,noreferrer');
+    }
+}
+
+// --- NEW CUSTOM AUTHENTICATION MODAL LOGIC ---
+
+let clerk = null; 
+
+/**
+ * Opens and initializes the custom authentication modal.
+ */
+function openAuthModal() {
+    const modal = document.getElementById('auth-modal');
+    if (modal) {
+        modal.style.display = 'flex';
+    }
+}
+
+/**
+ * Closes the custom authentication modal and resets the form.
+ */
+function closeAuthModal() {
+    const modal = document.getElementById('auth-modal');
+    if (modal) {
+        modal.style.display = 'none';
+        document.getElementById('signup-form').reset();
+        document.getElementById('grade-level-group').style.display = 'none';
+        document.getElementById('signup-error').textContent = '';
+    }
+}
+
+/**
+ * Handles the submission of the custom sign-up form.
+ * @param {Event} e - The form submission event.
+ */
+async function handleCustomSignUp(e) {
+    e.preventDefault();
+    if (!clerk) return;
+
+    const submitBtn = document.getElementById('signup-submit-btn');
+    const errorDiv = document.getElementById('signup-error');
+    submitBtn.disabled = true;
+    submitBtn.textContent = 'Submitting...';
+    errorDiv.textContent = '';
+
+    const email = document.getElementById('signup-email').value;
+    const password = document.getElementById('signup-password').value;
+    const isTeacher = document.querySelector('input[name="isTeacher"]:checked').value === 'true';
+    const gradeLevel = isTeacher ? document.getElementById('gradeLevel').value : null;
+
+    try {
+        const signUp = await clerk.signUp.create({
+            emailAddress: email,
+            password: password,
+            unsafeMetadata: {
+                isTeacher: isTeacher,
+                gradeLevel: gradeLevel
+            }
+        });
+
+        if (signUp.status === 'complete') {
+            await clerk.setActive({ session: signUp.createdSessionId });
+            closeAuthModal();
+        } else {
+            // Handle verification steps if necessary (e.g., email code)
+            errorDiv.textContent = 'Please check your email to verify your account.';
+        }
+    } catch (err) {
+        errorDiv.textContent = err.errors?.[0]?.longMessage || 'An error occurred during sign up.';
+    } finally {
+        submitBtn.disabled = false;
+        submitBtn.textContent = 'Continue';
+    }
+}
+
+/**
+ * Initializes the Clerk instance and sets up UI listeners.
  */
 function startClerk() {
   clerk = window.Clerk;
@@ -382,10 +469,7 @@
 }
 
 /**
- * Dynamically updates the header buttons based on the user's authentication state.
- * @param {object | null} user - The Clerk user object, or null if signed out.
+ * Updates the header UI based on authentication status.
  */
 function updateAuthUI(user) {
     const authContainer = document.getElementById('auth-container');
@@ -400,54 +484,40 @@
     } else {
         // User is signed out: show a "Sign In / Sign Up" button
         authContainer.innerHTML = `
-            <button class="sign-up-btn" id="sign-in-btn">Sign In / Sign Up</button>
+            <button class="sign-up-btn" id="auth-action-btn">Sign In / Sign Up</button>
         `;
-        document.getElementById('sign-in-btn')?.addEventListener('click', () => {
-            clerk?.openSignIn();
+        document.getElementById('auth-action-btn')?.addEventListener('click', openAuthModal);
+    }
+}
+
+/**
+ * Sets up all event listeners for the authentication modal and its controls.
+ */
+function initializeAuthModalListeners() {
+    document.getElementById('auth-modal-close')?.addEventListener('click', closeAuthModal);
+    document.getElementById('signup-form')?.addEventListener('submit', handleCustomSignUp);
+    
+    // Logic to switch from our custom sign-up modal to Clerk's sign-in pop-up
+    document.getElementById('switch-to-signin')?.addEventListener('click', () => {
+        closeAuthModal();
+        clerk?.openSignIn();
+    });
+
+    // Show/hide the grade level dropdown based on the "Are you a teacher?" answer
+    document.querySelectorAll('input[name="isTeacher"]').forEach(radio => {
+        radio.addEventListener('change', (e) => {
+            const gradeGroup = document.getElementById('grade-level-group');
+            if (e.target.value === 'true') {
+                gradeGroup.style.display = 'block';
+                document.getElementById('gradeLevel').required = true;
+            } else {
+                gradeGroup.style.display = 'none';
+                document.getElementById('gradeLevel').required = false;
+            }
         });
-    }
-}
-
-/**
- * Handles clicking on a "View Lesson" button.
- * If the user is signed in, it opens the lesson. If not, it opens the sign-in modal
- * and saves the lesson URL to be opened after a successful login.
- * @param {string} lessonUrl - The URL of the lesson to view.
- */
-function handleLessonClick(lessonUrl) {
-  if (clerk && clerk.user) {
-    // User is signed in, open the lesson directly
-    window.open(lessonUrl, '_blank', 'noopener,noreferrer');
-  } else {
-    // User is not signed in. Store the target URL and open the sign-in modal.
-    localStorage.setItem('redirectAfterSignIn', lessonUrl);
-    clerk?.openSignIn();
-  }
-}
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
+    });
 }
 
 // --- SCRIPT EXECUTION ---
@@ -457,11 +527,13 @@
 if (document.readyState === 'loading') {
     document.addEventListener('DOMContentLoaded', () => {
         initializeSearch();
+        initializeAuthModalListeners();
         initializeClerk();
     });
 } else {
     initializeSearch();
+    initializeAuthModalListeners();
     initializeClerk();
 }
 

```