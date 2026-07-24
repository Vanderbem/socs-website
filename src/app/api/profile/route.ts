import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { isGradeLevel, updateTeacherOnboarding, upsertTeacherFromClerk } from '@/lib/db/teachers';

function normalizeDistrict(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const teacher = await upsertTeacherFromClerk(userId);

    return NextResponse.json({
      email: teacher.email,
      name: teacher.name,
      gradeLevel: teacher.grade,
      district: teacher.district,
    });
  } catch (error) {
    console.error('Error loading profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const grade = body.gradeLevel || null;
    const district = normalizeDistrict(body.district);

    if (grade !== null && !isGradeLevel(grade)) {
      return NextResponse.json({ error: 'Invalid grade level' }, { status: 400 });
    }

    const teacher = await updateTeacherOnboarding(userId, grade, district);
    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    await client.users.updateUserMetadata(userId, {
      unsafeMetadata: {
        ...user.unsafeMetadata,
        gradeLevel: grade,
        district,
        onboardingCompleted: true,
      },
    });

    return NextResponse.json({
      success: true,
      profile: {
        email: teacher.email,
        name: teacher.name,
        gradeLevel: teacher.grade,
        district: teacher.district,
      },
    });
  } catch (error) {
    console.error('Error saving profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
