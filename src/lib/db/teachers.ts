import { eq, sql } from 'drizzle-orm';
import { clerkClient } from '@clerk/nextjs/server';
import { db } from './index';
import { gradeLevel, teachers, type GradeLevel } from './schema';

export function isGradeLevel(value: unknown): value is GradeLevel {
  return typeof value === 'string' && (gradeLevel.enumValues as readonly string[]).includes(value);
}

function getTeacherName(firstName?: string | null, lastName?: string | null, username?: string | null) {
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
  return fullName || username || null;
}

export async function upsertTeacherFromClerk(userId: string) {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const email = user.primaryEmailAddress?.emailAddress || user.emailAddresses[0]?.emailAddress;
  const metadata = user.unsafeMetadata as {
    gradeLevel?: unknown;
    district?: string | null;
    onboardingCompleted?: boolean;
  };
  const metadataGrade = isGradeLevel(metadata.gradeLevel) ? metadata.gradeLevel : null;
  const metadataDistrict = typeof metadata.district === 'string' && metadata.district.trim()
    ? metadata.district.trim()
    : null;

  if (!email) {
    throw new Error(`Clerk user ${userId} does not have an email address`);
  }

  const [teacher] = await db
    .insert(teachers)
    .values({
      clerkUserId: user.id,
      email,
      name: getTeacherName(user.firstName, user.lastName, user.username),
      grade: metadata.onboardingCompleted ? metadataGrade : null,
      district: metadata.onboardingCompleted ? metadataDistrict : null,
    })
    .onConflictDoUpdate({
      target: teachers.clerkUserId,
      set: {
        email,
        name: getTeacherName(user.firstName, user.lastName, user.username),
        grade: metadata.onboardingCompleted ? metadataGrade : sql`${teachers.grade}`,
        district: metadata.onboardingCompleted ? metadataDistrict : sql`${teachers.district}`,
        updatedAt: sql`now()`,
      },
    })
    .returning();

  return teacher;
}

export async function updateTeacherOnboarding(userId: string, grade: GradeLevel | null, district: string | null) {
  const teacher = await upsertTeacherFromClerk(userId);

  const [updatedTeacher] = await db
    .update(teachers)
    .set({
      grade,
      district,
      updatedAt: sql`now()`,
    })
    .where(eq(teachers.id, teacher.id))
    .returning();

  return updatedTeacher;
}
