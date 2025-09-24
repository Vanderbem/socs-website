import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { lesson, teacher } from '@/lib/db/schema';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { lessonUrl, lessonTitle, isTeacher, gradeLevel, schoolDistrict, interactionType } = body;

    // Validate required fields
    if (!lessonUrl || !interactionType) {
      return NextResponse.json({ error: 'Lesson URL and interaction type are required' }, { status: 400 });
    }

    // Step 1: Create lesson interaction record
    const lessonResult = await db.insert(lesson).values({
      lessonUrl,
      lessonTitle: lessonTitle || 'Unknown Lesson',
    }).returning({ id: lesson.id });

    const lessonId = lessonResult[0].id;

    // Step 2: If user submitted form (not just skipped), create teacher profile
    if (interactionType === 'submitted' && (isTeacher !== undefined)) {
      await db.insert(teacher).values({
        lessonId,
        isTeacher,
        gradeLevel,
        schoolDistrict,
        interactionType,
      });

      console.log('Teacher profile created:', { lessonId, isTeacher, gradeLevel, schoolDistrict, interactionType });
    } else if (interactionType === 'skipped') {
      // Still create a teacher record to track the skip
      await db.insert(teacher).values({
        lessonId,
        isTeacher: null,
        gradeLevel: null,
        schoolDistrict: null,
        interactionType: 'skipped',
      });

      console.log('Skip interaction tracked:', { lessonId, interactionType });
    }

    return NextResponse.json({ success: true, lessonId });
  } catch (error) {
    console.error('Error tracking lesson interaction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}