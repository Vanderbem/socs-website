import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function POST() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json(
    { error: 'This endpoint has been replaced by /api/track/lesson-access' },
    { status: 410 }
  );
}
