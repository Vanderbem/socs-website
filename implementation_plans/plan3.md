Of course. I can certainly help you refactor your SOCS website's authentication flow to be more user-friendly and robust. Using popups for sign-in/sign-up and intelligently redirecting users after they log in is a great way to improve the experience.

Drawing inspiration from the "White Rabbit" project's use of Clerk and modals, and adapting it to your current vanilla JavaScript setup on the main search page, I've created a comprehensive implementation plan. This plan replaces the separate sign-in pages with a seamless popup flow controlled directly from your `search.js` file.

Here is the plan and the updated code to achieve your goals.

### **Implementation Plan**

1.  **Switch to Clerk's Popup Modals:** We will stop using the separate `/sign-in` and `/sign-up` pages. Instead, we'll use Clerk's frontend JavaScript library, which is already available on your pages via the `<ClerkProvider>`, to open sign-in and sign-up modals directly on the search page.

2.  **Refactor `public/search.js`:** This file will be updated to manage all authentication logic.
    *   It will now initialize Clerk's frontend library when the page loads.
    *   An `updateAuthUI` function will dynamically show a "Sign In / Sign Up" or "Sign Out" button in the header based on the user's login status.
    *   The `handleLessonClick` function will be updated. When a non-authenticated user clicks a lesson, it will now open the sign-in modal instead of redirecting to a new page.

3.  **Implement Smart Redirection for Lessons:** Handling redirects to external links (like Google Drive) after sign-in requires a specific approach.
    *   When a logged-out user clicks a lesson, we will save the target lesson URL into the browser's `localStorage`.
    *   We will then trigger the sign-in popup.
    *   After the user successfully signs in, they will be redirected back to the main search page.
    *   A new function, `checkRedirect()`, will run on page load. It will check if a user is logged in *and* if a redirect URL exists in `localStorage`. If both are true, it will open the lesson link in a new tab and clear the stored URL.

4.  **Cleanup:** Finally, we will remove the now-obsolete `/sign-in` and `/sign-up` page directories to keep the project clean.

Here are the updated files to implement these changes.

### **Updated Files**

This change ensures that your application gracefully handles the loading of the Clerk library, preventing any UI flashes or components appearing before they are ready.

<diff>
<original file="/Users/ian/Desktop/socs_website/src/app/layout.tsx" />
<modified file="/Users/ian/Desktop/socs_website/src/app/layout.tsx" />
</diff>
```diff
--- a/src/app/layout.tsx
+++ b/src/app/layout.tsx
@@ -1,7 +1,7 @@
 import type { Metadata } from "next";
 import { Inter } from "next/font/google";
-import { ClerkProvider } from '@clerk/nextjs';
+import { ClerkProvider, ClerkLoaded, ClerkLoading } from '@clerk/nextjs';
 import "./globals.css";
 
 const inter = Inter({
@@ -21,7 +21,14 @@
       <html lang="en">
         <body
           className={`${inter.variable} font-sans antialiased`}
         >
-          {children}
+          <ClerkLoaded>
+            {children}
+          </ClerkLoaded>
+          <ClerkLoading>
+            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#fff' }}>
+              <p style={{ color: '#000' }}>Loading Application...</p>
+            </div>
+          </ClerkLoading>
         </body>
       </html>
     </ClerkProvider>

```

The `search.js` file contains the most significant changes. The previous authentication logic is replaced entirely with a new system that directly uses the ClerkJS library to manage popups and user state.

<diff>
<original file="/Users/ian/Desktop/socs_website/public/search.js" />
<modified file="/Users/ian/Desktop/socs_website/public/search.js" />
</diff>
```diff
--- a/public/search.js
+++ b/public/search.js
@@ -242,75 +242,79 @@
     document.getElementById('clear-filters-btn')?.addEventListener('click', clearFilters);
 }
 
-// Authentication handling
-async function checkAuthStatus() {
-    try {
-        const response = await fetch('/api/auth/check', {
-            credentials: 'include'
-        });
-        return response.ok;
-    } catch (error) {
-        console.error('Error checking auth status:', error);
-        return false;
-    }
-}
-
-function handleLessonClick(lessonUrl) {
-    // Check if user is authenticated
-    checkAuthStatus().then(isAuthenticated => {
-        if (isAuthenticated) {
-            // User is signed in, open the lesson
-            window.open(lessonUrl, '_blank', 'noopener,noreferrer');
-        } else {
-            // User is not signed in, redirect to sign-in page
-            // For now, use redirect since Clerk pop-up integration needs more setup
-            localStorage.setItem('redirectAfterSignIn', lessonUrl);
-            window.location.href = '/sign-in';
-        }
-    });
-}
-
-function initializeAuthButtons() {
+// --- NEW CLERK.JS AUTHENTICATION LOGIC ---
+
+let clerk = null; // This will hold the global Clerk instance
+
+/**
+ * This function is called once the Clerk.js script is fully loaded.
+ * It initializes the Clerk instance and sets up listeners to keep the UI in sync.
+ */
+function startClerk() {
+  clerk = window.Clerk;
+  
+  // Add a listener to automatically update the UI whenever the user signs in or out
+  clerk.addListener(({ user }) => {
+    updateAuthUI(user);
+    checkRedirect(); // Check for a pending lesson redirect after auth state changes
+  });
+  
+  // Initial UI setup and redirect check
+  updateAuthUI(clerk.user);
+  checkRedirect();
+}
+
+/**
+ * Dynamically updates the header buttons based on the user's authentication state.
+ * @param {object | null} user - The Clerk user object, or null if signed out.
+ */
+function updateAuthUI(user) {
     const authContainer = document.getElementById('auth-container');
-    if (authContainer) {
-        // Check if user is authenticated
-        checkAuthStatus().then(isAuthenticated => {
-            if (isAuthenticated) {
-                // Show sign out button
-                authContainer.innerHTML = `
-                    <button class="sign-in-btn" onclick="handleSignOut()">
-                        Sign Out
-                    </button>
-                `;
-            } else {
-                // Show single sign in button
-                authContainer.innerHTML = `
-                    <button class="sign-up-btn" onclick="handleSignIn()">
-                        Sign In
-                    </button>
-                `;
-            }
-        });
-    }
-}
-
-function handleSignIn() {
-    window.location.href = '/sign-in';
-}
-
-function handleSignOut() {
-    // Use Clerk's sign-out flow by redirecting to home which will clear the session
-    window.location.href = '/api/clerk/sign-out?returnUrl=/';
+    if (!authContainer) return;
+
+    if (user) {
+        // User is signed in: show a "Sign Out" button
+        authContainer.innerHTML = `
+            <button class="sign-in-btn" id="sign-out-btn">Sign Out</button>
+        `;
+        document.getElementById('sign-out-btn')?.addEventListener('click', () => {
+            clerk?.signOut({ redirectUrl: '/' });
+        });
+    } else {
+        // User is signed out: show a "Sign In / Sign Up" button
+        authContainer.innerHTML = `
+            <button class="sign-up-btn" id="sign-in-btn">Sign In / Sign Up</button>
+        `;
+        document.getElementById('sign-in-btn')?.addEventListener('click', () => {
+            clerk?.openSignIn();
+        });
+    }
+}
+
+/**
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
+    // User is not signed in. Store the target URL and open the sign-in modal.
+    localStorage.setItem('redirectAfterSignIn', lessonUrl);
+    clerk?.openSignIn();
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
 }
 
 // --- SCRIPT EXECUTION ---
-
-// Wait for the DOM to be fully loaded before initializing.
-if (document.readyState === 'loading') {
-    document.addEventListener('DOMContentLoaded', () => {
-        initializeSearch();
-        initializeAuthButtons();
-    });
-} else {
-    initializeSearch();
-    initializeAuthButtons();
-}
+initializeSearch();
+
+// Clerk.js is loaded by the root layout. Once it's ready, the `startClerk` function is called.
+if (window.Clerk) {
+  window.Clerk.load().then(startClerk).catch(console.error);
+}

```

### **Final Steps: Configuration and Cleanup**

1.  **Configure Clerk Redirects:**
    To ensure users are returned to the search page after the sign-in/sign-up popup closes, add the following variables to your environment file (`.env.local`):

    ```
    NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
    NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
    ```

2.  **Delete Obsolete Pages:**
    The separate sign-in and sign-up pages are no longer necessary. You can safely delete the following directories from your project:
    *   `src/app/sign-in/`
    *   `src/app/sign-up/`

After applying these changes, your SOCS website will feature a much smoother and more modern authentication experience that guides users effectively without unnecessary page loads.