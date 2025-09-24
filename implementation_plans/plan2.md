Of course. I can help you with these changes to improve your website's user experience and layout. Here is a plan and the updated code to fix the search bar overlap and implement a pop-up modal for signing in.

### **Implementation Plan**

1.  **Standardize Header Layout:**
    *   The issue of the search bar overlapping with the logo is due to legacy CSS (`position: absolute`) that conflicts with the modern flexbox layout used in the header.
    *   To fix this, I will remove the conflicting absolute positioning and margin styles from `public/search/style.css`. This will allow the flexbox properties, which are best practice for this type of layout, to correctly align the logo and search bar with appropriate spacing.

2.  **Implement Pop-Up Authentication:**
    *   To prevent the sign-in button from redirecting to a new page, I will modify the JavaScript that handles authentication events.
    *   Instead of changing `window.location.href`, I will use the Clerk.js client-side library, which is already loaded on your page, to open a pre-built, centered pop-up modal for both sign-in and sign-up.
    *   The `handleSignIn()` function in `public/search.js` will be updated to call `window.Clerk.openSignIn()`.
    *   Similarly, `handleSignOut()` will be updated to use `window.Clerk.signOut()` for a smoother sign-out process without a full page redirect.

Here are the updated files with the necessary changes.

### **Updated Files**

<diff>
<original file="/Users/ian/Desktop/socs_website/public/search/style.css" />
<modified file="/Users/ian/Desktop/socs_website/public/search/style.css" />
</diff>
```diff
--- a/public/search/style.css
+++ b/public/search/style.css
@@ -20,19 +20,10 @@
 
 /* INPUT */
 header {
-  position: relative;
   height: 80px;
   margin-top: 40px;
 }
-header img {
-  position: absolute;
-  top: 9px;
-  left: 0;
-  float: left;
-  max-width: 23%;
-}
 .ais-SearchBox-form {
   position: relative;
 }
@@ -62,9 +53,6 @@
   height: 1.25em;
   fill: rgb(142, 142, 142);
 }
-#search-input {
-  margin-left: 26%;
-}
 #search-input input {
   font-size: 28px;
   padding-left: 100px;

```

<diff>
<original file="/Users/ian/Desktop/socs_website/public/search.js" />
<modified file="/Users/ian/Desktop/socs_website/public/search.js" />
</diff>
```diff
--- a/public/search.js
+++ b/public/search.js
@@ -298,16 +298,34 @@
     });
 }
 
 function handleSignIn() {
-    window.location.href = '/sign-in';
+    if (window.Clerk) {
+        window.Clerk.openSignIn({
+            appearance: {
+                elements: {
+                    formButtonPrimary: 'bg-primary-600 hover:bg-primary-700',
+                    footerActionLink: 'text-primary-600 hover:text-primary-700',
+                }
+            }
+        });
+    } else {
+        console.error("Clerk.js is not available. Redirecting to sign-in page.");
+        window.location.href = '/sign-in';
+    }
 }
 
 function handleSignOut() {
-    // Use Clerk's sign out endpoint
-    window.location.href = '/sign-in';  // Clerk will handle sign out through middleware
+    if (window.Clerk) {
+        window.Clerk.signOut().then(() => {
+            window.location.reload();
+        });
+    } else {
+        console.error("Clerk.js is not available.");
+    }
 }
 
 // --- SCRIPT EXECUTION ---
 

```