import { auth } from '@clerk/nextjs/server';
import { eq, or } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { upsertTeacherFromClerk } from '@/lib/db/teachers';
import { accessLogs, lessons } from '@/lib/db/schema';

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const lessonId = Number(body.lessonId);
    const lessonUrl = typeof body.lessonUrl === 'string' ? body.lessonUrl.trim() : '';
    const isSpanish = Boolean(body.isSpanish);

    if (!Number.isInteger(lessonId)) {
      return NextResponse.json({ error: 'Lesson ID is required' }, { status: 400 });
    }

    let [lesson] = await db.select({ id: lessons.id }).from(lessons).where(eq(lessons.id, lessonId)).limit(1);

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

    const teacher = await upsertTeacherFromClerk(userId);
    const [accessLog] = await db
      .insert(accessLogs)
      .values({
        teacherId: teacher.id,
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
