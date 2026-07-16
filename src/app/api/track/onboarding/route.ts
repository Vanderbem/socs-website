import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { updateTeacherOnboarding } from '@/lib/db/teachers';
import { gradeLevel, type GradeLevel } from '@/lib/db/schema';

function isGradeLevel(value: unknown): value is GradeLevel {
  return typeof value === 'string' && (gradeLevel.enumValues as readonly string[]).includes(value);
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const grade = body.gradeLevel || null;
    const district = typeof body.district === 'string' && body.district.trim() ? body.district.trim() : null;

    if (grade !== null && !isGradeLevel(grade)) {
      return NextResponse.json({ error: 'Invalid grade level' }, { status: 400 });
    }

    const teacher = await updateTeacherOnboarding(userId, grade, district);

    return NextResponse.json({ success: true, teacherId: teacher.id });
  } catch (error) {
    console.error('Error saving onboarding:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
