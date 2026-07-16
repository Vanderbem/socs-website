import { auth } from '@clerk/nextjs/server';
import { asc } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { upsertTeacherFromClerk } from '@/lib/db/teachers';
import { lessons } from '@/lib/db/schema';

function getErrorDetails(error: unknown) {
  if (process.env.NODE_ENV === 'production') {
    return undefined;
  }

  const err = error as {
    message?: string;
    cause?: unknown;
    code?: string;
    detail?: string;
    constraint?: string;
    table?: string;
    column?: string;
    schema?: string;
  };
  const cause = err.cause as
    | {
        message?: string;
        code?: string;
        detail?: string;
        constraint?: string;
        table?: string;
        column?: string;
        schema?: string;
      }
    | undefined;

  return {
    message: err.message || 'Unknown database error',
    code: err.code || cause?.code,
    detail: err.detail || cause?.detail,
    constraint: err.constraint || cause?.constraint,
    table: err.table || cause?.table,
    column: err.column || cause?.column,
    schema: err.schema || cause?.schema,
    cause: cause?.message,
  };
}

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await upsertTeacherFromClerk(userId);

    const lessonRows = await db.select().from(lessons).orderBy(asc(lessons.title));

    return NextResponse.json(
      lessonRows.map((lesson) => ({
        id: String(lesson.id),
        lessonNumber: '',
        dateFinalized: '',
        revisedBy: '',
        readyToPublish: true,
        linkToFolder: lesson.englishLesson || lesson.englishFolder,
        linkToMaterials: lesson.englishFolder,
        linkToSpanishMaterials: lesson.spanishFolder || '',
        linkToSpanishLesson: lesson.spanishLesson || '',
        notes: '',
        lessonTitle: lesson.title,
        grade: lesson.grades.join(', '),
        ctConcept: lesson.ctConcepts.join(', '),
        subject: lesson.subjects.join(', '),
        originalAuthor: '',
        originalFolderLink: '',
        hasSpanish: Boolean(lesson.spanishFolder && lesson.spanishLesson),
      }))
    );
  } catch (error) {
    console.error('Error reading lessons from database:', error);

    return NextResponse.json(
      {
        error: 'Failed to load lessons',
        details: getErrorDetails(error),
      },
      { status: 500 }
    );
  }
}
