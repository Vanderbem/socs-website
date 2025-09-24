Of course. I can certainly help you devise a comprehensive plan to refactor your SOCS website. Your goal to capture user demographics in a non-invasive way is an excellent product decision, and your proposed architecture using a pop-up modal, Postgres with Drizzle, and tight integration with Clerk is a robust and modern approach.

By referencing the successful Clerk/Postgres integration in the `whiterabbit` repository, we can create a clear and actionable plan to remove what isn't working and build a system that achieves your goals.

Here is a comprehensive implementation plan to overhaul your demographic analytics capture flow.

---

### **Phase 1: Database & Backend Foundation**

The first step is to set up the database, define the data structure for your analytics, and create the necessary backend endpoints to support the new flow.

#### **Step 1.1: Add Dependencies**

First, we need to add Drizzle ORM and the PostgreSQL driver to your `socs_website` project.

```bash
npm install drizzle-orm @vercel/postgres
npm install -D drizzle-kit pg
```

#### **Step 1.2: Configure Drizzle and Database Connection**

Next, you'll need a Vercel Postgres database. Once you have your connection string, create the following configuration files.

**1. Create `drizzle.config.ts` in the root directory:**
This file tells Drizzle Kit how to connect to your database to generate migrations.

```typescript
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv';

config({ path: '.env.local' }); // Make sure your POSTGRES_URL is in this file

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.POSTGRES_URL!,
  },
  verbose: true,
  strict: true,
});
```

**2. Create the database connection utility at `src/lib/db/index.ts`:**
This file will be used by your application to query the database.

```typescript
// src/lib/db/index.ts
import { drizzle } from 'drizzle-orm/vercel-postgres';
import { sql } from '@vercel/postgres';
import * as schema from './schema';

export const db = drizzle(sql, { schema });
```

#### **Step 1.3: Define the Database Schema**

Now, let's define the table that will store the demographic data. This schema is inspired by the `whiterabbit` repository's structure for linking users to Clerk.

**Create a new file at `src/lib/db/schema.ts`:**

```typescript
// src/lib/db/schema.ts
import { pgTable, uuid, text, boolean, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  // A unique ID for our internal records
  id: uuid('id').primaryKey().defaultRandom(),
  
  // A link to the Clerk user, which is the most reliable identifier
  clerkId: text('clerk_id').unique(),
  
  // A fallback identifier for users who are not signed in
  anonymousId: text('anonymous_id').unique(),
  
  // The demographic data we want to capture
  isTeacher: boolean('is_teacher'),
  gradeLevel: text('grade_level'),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

#### **Step 1.4: Generate and Apply the Initial Migration**

With the schema defined, run the following command to create your first SQL migration file.

```bash
npx drizzle-kit generate
```
Then, apply the migration to set up your database table:
```bash
npm run build && node -e 'require("dotenv").config({ path: ".env.local" }); require("drizzle-kit/bin/utils").migrate(require("./drizzle.config.default").default)'
```

---

### **Phase 2: Integrating Clerk with the Database**

This phase ensures that every new user in Clerk has a corresponding entry in your database, ready to be updated with demographic info.

#### **Step 2.1: Create a Clerk Webhook Handler**

The best practice is to use a webhook to automatically create a user in your database whenever a new user signs up via Clerk.

**Create a new file at `src/app/api/webhooks/clerk/route.ts`:**

```typescript
// src/app/api/webhooks/clerk/route.ts
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';

export async function POST(req: Request) {
  // ... (Standard Svix webhook verification boilerplate) ...

  const eventType = evt.type;

  if (eventType === 'user.created') {
    const { id, email_addresses } = evt.data;
    const email = email_addresses[0]?.email_address;

    await db.insert(users).values({
      clerkId: id,
    }).onConflictDoNothing(); // Prevents errors if the user already exists
    
    console.log(`User ${id} (${email}) was created in the database.`);
  }

  return new Response('', { status: 200 });
}
```
**Action:** Remember to configure this webhook endpoint in your Clerk dashboard.

#### **Step 2.2: Create the Analytics Capture API Endpoint**

This API route will be called by the modal to save the demographic data. It handles both signed-in and anonymous users.

**Create `src/app/api/analytics/capture/route.ts`:**

```typescript
// src/app/api/analytics/capture/route.ts
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { clerkClient } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { userId } = auth();
  const { isTeacher, gradeLevel, anonymousId } = await req.json();

  try {
    if (userId) {
      // User is signed in
      await db
        .update(users)
        .set({ isTeacher, gradeLevel, updatedAt: new Date() })
        .where(eq(users.clerkId, userId));

      // Mark in Clerk metadata that they've answered, so we never ask again
      await clerkClient.users.updateUserMetadata(userId, {
        publicMetadata: { onboardingComplete: true },
      });
    } else if (anonymousId) {
      // User is not signed in, use the anonymous ID
      await db
        .insert(users)
        .values({ anonymousId, isTeacher, gradeLevel })
        .onConflictDoUpdate({
          target: users.anonymousId,
          set: { isTeacher, gradeLevel, updatedAt: new Date() },
        });
    } else {
      return NextResponse.json({ error: 'Missing identifier' }, { status: 400 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

---

### **Phase 3: Frontend Implementation - The Non-Invasive Modal**

This is where we implement the user-facing part of the flow within your existing `public/search.js` file.

#### **Step 3.1: Create the Modal HTML**

Add the HTML for your pop-up modal inside the `<body>` of `src/app/route.ts`. It will be hidden by default with CSS.

```html
<!-- src/app/route.ts -->

<!-- ... inside <body> ... -->
<div id="demographics-modal" class="modal-overlay" style="display: none;">
  <div class="modal-content">
    <h2>A quick question...</h2>
    <p>To help us improve our resources, please answer the following:</p>
    <form id="demographics-form">
      <div class="form-group">
        <label>Are you a teacher?</label>
        <div id="teacher-radios">
          <input type="radio" name="isTeacher" value="true" id="isTeacherYes" required> <label for="isTeacherYes">Yes</label>
          <input type="radio" name="isTeacher" value="false" id="isTeacherNo"> <label for="isTeacherNo">No</label>
        </div>
      </div>
      <div class="form-group" id="grade-level-group" style="display: none;">
        <label for="gradeLevel">What grade do you teach?</label>
        <select id="gradeLevel">
          <option value="">Select a grade</option>
          <option value="K-2">K-2</option>
          <option value="3-5">3-5</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <button type="submit" class="btn-primary">Continue to Lesson</button>
      <button type="button" id="skip-demographics" class="btn-secondary">Skip for now</button>
    </form>
  </div>
</div>
```
You will also need to add some basic CSS for `.modal-overlay` and `.modal-content` to make it appear as a centered pop-up.

#### **Step 3.2: Implement the Core Logic in `search.js`**

Modify `public/search.js` to replace the old `handleLessonClick` with a new flow that checks for demographic data before proceeding.

```javascript
// public/search.js

// ... (keep existing search logic) ...

// --- NEW DEMOGRAPHICS CAPTURE LOGIC ---

let lessonUrlToOpen = null;

// The NEW entry point when a lesson is clicked
function handleLessonClick(lessonUrl) {
  lessonUrlToOpen = lessonUrl; // Store the URL they want to visit

  // Check if we need to ask the questions
  const clerkUser = window.Clerk?.user;
  const onboardingComplete = clerkUser?.publicMetadata?.onboardingComplete || localStorage.getItem('onboardingComplete');

  if (onboardingComplete) {
    window.open(lessonUrlToOpen, '_blank', 'noopener,noreferrer');
  } else {
    document.getElementById('demographics-modal').style.display = 'flex';
  }
}

// Function to submit the data
async function submitDemographics(formData) {
  const isTeacher = formData.get('isTeacher') === 'true';
  const gradeLevel = isTeacher ? formData.get('gradeLevel') : null;
  
  let anonymousId = localStorage.getItem('anonymousId');
  if (!window.Clerk?.user && !anonymousId) {
    anonymousId = crypto.randomUUID();
    localStorage.setItem('anonymousId', anonymousId);
  }

  await fetch('/api/analytics/capture', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isTeacher, gradeLevel, anonymousId }),
  });
  
  // Mark as complete and proceed
  localStorage.setItem('onboardingComplete', 'true');
  document.getElementById('demographics-modal').style.display = 'none';
  if (lessonUrlToOpen) {
    window.open(lessonUrlToOpen, '_blank', 'noopener,noreferrer');
  }
}

// Attach event listeners when the script initializes
document.addEventListener('DOMContentLoaded', () => {
    // ... (existing initializeSearch logic) ...
    
    const form = document.getElementById('demographics-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        submitDemographics(formData);
    });
    
    document.getElementById('skip-demographics').addEventListener('click', () => {
        document.getElementById('demographics-modal').style.display = 'none';
        if (lessonUrlToOpen) {
            window.open(lessonUrlToOpen, '_blank', 'noopener,noreferrer');
        }
    });

    document.getElementById('teacher-radios').addEventListener('change', (e) => {
        const isTeacher = e.target.value === 'true';
        document.getElementById('grade-level-group').style.display = isTeacher ? 'block' : 'none';
    });
});
```

---

### **Phase 4: Cleanup and Finalizing**

To complete the transition, remove the old and unused parts of the application.

1.  **Delete Obsolete Onboarding Page:** The `/onboarding` page is now redundant. You can safely delete the directory `src/app/onboarding/`.
2.  **Remove Onboarding Middleware:** The logic in `src/middleware.ts` that redirects users to `/onboarding` is no longer needed and should be removed to avoid conflicts.
3.  **Confirm Removal of Old Sign-Up:** Based on your previous implementation plans, the old `/sign-up` and `/sign-in` pages should already be removed in favor of Clerk's popup flow. This new modal system integrates perfectly with that.

By following this plan, you will have a clean, modern, and user-friendly system for capturing valuable demographic data that will help you better serve your community.