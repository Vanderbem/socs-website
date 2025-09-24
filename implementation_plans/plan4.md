Of course. Implementing a brief onboarding survey for new users is an excellent way to gather information and personalize their experience. Based on your request and existing codebase, the best approach is to redirect new users to a dedicated onboarding page immediately after they sign up.

The good news is that an onboarding page with the questions you need already exists in your project. The missing piece is the logic to ensure all new users are sent there. I'll add this logic to your site's middleware. This will also preserve the functionality that redirects users to the lesson they were trying to view after they complete the survey.

Here is the implementation plan and the updated file.

### Implementation Plan

1.  **Update Middleware Logic (`src/middleware.ts`):**
    *   The middleware file is the perfect place to handle this redirection, as it checks the user's authentication status on every relevant page request.
    *   I will add logic to the middleware to check if a user is logged in.
    *   If they are, it will check for a specific flag in their user profile (`onboardingCompleted`).
    *   If the user is logged in but the `onboardingCompleted` flag is not `true`, they will be automatically redirected to the `/onboarding` page.
    *   This ensures that every new user is seamlessly guided to the survey right after signing up, before they can access the rest of the site.
    *   Once a user completes the survey on the onboarding page, the flag is set, and they will no longer be redirected.

This single change connects the existing authentication flow with the onboarding page you already have, making the entire process work as you intended.

### Updated File

Here is the updated middleware file with the new redirection logic.

<diff>
<original file="/Users/ian/Desktop/socs_website/src/middleware.ts" />
<modified file="/Users/ian/Desktop/socs_website/src/middleware.ts" />
</diff>
```diff
--- a/src/middleware.ts
+++ b/src/middleware.ts
@@ -1,5 +1,6 @@
 import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
+import { NextResponse } from 'next/server';
 
 // Define public routes that don't require authentication
 const isPublicRoute = createRouteMatcher([
@@ -11,6 +12,9 @@
   '/api/lessons', // Allow fetching lesson list without auth
 ])
 
+// Onboarding route needs to be defined to handle redirects
+const isOnboardingRoute = createRouteMatcher(['/onboarding']);
+
 // Define routes that should be protected
 const isProtectedRoute = createRouteMatcher([
   '/lesson/(.*)', // Individual lesson pages
@@ -18,17 +22,29 @@
   '/dashboard(.*)', // Analytics dashboard
 ])
 
-export default clerkMiddleware(async (auth, req) => {
+export default clerkMiddleware((auth, req) => {
+  const { userId, sessionClaims } = auth();
+
+  // Redirect to onboarding if user is new and hasn't completed the survey
+  if (userId && !sessionClaims?.unsafeMetadata?.onboardingCompleted) {
+    // Avoid redirect loop by checking if the user is already on the onboarding page or accessing an API
+    if (!isOnboardingRoute(req) && !req.nextUrl.pathname.startsWith('/api')) {
+      const onboardingUrl = new URL('/onboarding', req.url);
+      return NextResponse.redirect(onboardingUrl);
+    }
+  }
+
+  // If a user has completed onboarding, prevent them from accessing the onboarding page again
+  if (userId && sessionClaims?.unsafeMetadata?.onboardingCompleted && isOnboardingRoute(req)) {
+      const homeUrl = new URL('/', req.url);
+      return NextResponse.redirect(homeUrl);
+  }
+  
   // Allow public routes
   if (isPublicRoute(req)) {
     return
   }
 
-  // Protect specific routes
+  // Protect specific routes by requiring authentication
   if (isProtectedRoute(req)) {
-    await auth.protect()
+    auth().protect();
   }
 })
 

```