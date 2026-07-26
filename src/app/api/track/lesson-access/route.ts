import { auth} from '@clerk/nextjs/server';
import { verifyToken } from '@clerk/backend';
import { eq, or } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { upsertTeacherFromClerk } from '@/lib/db/teachers';
import { accessLogs, lessons } from '@/lib/db/schema';

async function getAnonymousTeacherId(): Promise<string> {
  const ANONYMOUS_CLERK_ID = 'anonymous_system_user';
  const teacher = await upsertTeacherFromClerk(ANONYMOUS_CLERK_ID);
  return teacher.id; // Returns UUID string
}
export async function POST(request: Request) {

  let userId: string | null = null;

  // 1. Try standard Clerk auth()
  try {
    const authObj = await auth();
    userId = authObj.userId;
  } catch (e) {
    console.warn('[Tracking API] Standard auth() failed, trying Bearer fallback');
  }

  // 2. Fallback: Parse Bearer Token directly from headers if auth() was null
  if (!userId) {
      const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
          // standalone verifyToken method from @clerk/backend
          const verifiedToken = await verifyToken(token, {
            secretKey: process.env.CLERK_SECRET_KEY,
          });
          userId = verifiedToken.sub; // 'sub' contains the Clerk userId
        } catch (err) {
          console.error('[Tracking API] Token verification failed:', err);
        }
      }
    }
  // don't reject - allow for logging with NULL userID
  // 3. Reject only if both standard auth AND token verification failed
  /*if (!userId) {
    console.error('[Tracking API] Unauthorized request: missing or invalid session/token');
    return NextResponse.json(
      { error: 'Unauthorized. Valid Clerk session required.' },
      { status: 401 }
    );
  }*/

  try {
    const body = await request.json();
    const lessonId = Number(body.lessonId);
    const lessonUrl = typeof body.lessonUrl === 'string' ? body.lessonUrl.trim() : '';
    const isSpanish = Boolean(body.isSpanish);
    const hasValidLessonId = Number.isInteger(lessonId);

    if (!hasValidLessonId && !lessonUrl) {
      return NextResponse.json({ error: 'Lesson ID is required' }, { status: 400 });
    }

    let lesson: { id: number } | undefined;

    if (hasValidLessonId) {
      [lesson] = await db.select({ id: lessons.id }).from(lessons).where(eq(lessons.id, lessonId)).limit(1);
    }

    if (!lesson && lessonUrl) {
      [lesson] = await db
        .select({ id: lessons.id })
        .from(lessons)
        .where(
          or(
            eq(lessons.englishFolder, lessonUrl),
            eq(lessons.englishLesson, lessonUrl),
            eq(lessons.spanishFolder, lessonUrl),
            eq(lessons.spanishLesson, lessonUrl)
          )
        )
        .limit(1);
    }

    if (!lesson) {
      console.warn('Lesson access not logged because lesson was not found', { lessonId, lessonUrl });
      return NextResponse.json({ error: 'Lesson not found', lessonId, lessonUrl }, { status: 404 });
    }

    //const teacher = await upsertTeacherFromClerk(userId);
    // log all access even if userID is null, but only if lesson exists
    let teacherId: string;
    if (userId) {
      const teacher = await upsertTeacherFromClerk(userId);
      teacherId = teacher.id;
    } else {
      teacherId = await getAnonymousTeacherId();
    }
    const [accessLog] = await db
      .insert(accessLogs)
      .values({
        teacherId: teacherId,
        lessonId: lesson.id,
        isSpanish,
      })
      .returning({ id: accessLogs.id });

    return NextResponse.json({ success: true, accessLogId: accessLog.id });
  } catch (error) {
    console.error('Error tracking lesson access:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
