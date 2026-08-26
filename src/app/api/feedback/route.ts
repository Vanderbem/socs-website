import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const DEFAULT_FEEDBACK_TO_EMAIL = 'vanderbem@sou.edu';
const DEFAULT_FEEDBACK_FROM_EMAIL = 'SOCS4ALL Feedback <feedback@socs4all.org>';
const FEEDBACK_SUBJECT = 'SOCS lesson feedback';

function cleanOptionalString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function formatFeedbackEmail({
  feedbackText,
  lessonTitle,
  lessonLink,
  senderEmail,
  pageUrl,
}: {
  feedbackText: string;
  lessonTitle: string | null;
  lessonLink: string | null;
  senderEmail: string;
  pageUrl: string | null;
}) {
  const lines = [
    `To: ${process.env.FEEDBACK_TO_EMAIL || DEFAULT_FEEDBACK_TO_EMAIL}`,
    `Subject: ${FEEDBACK_SUBJECT}`,
    '',
    'Feedback:',
    feedbackText,
  ];

  if (lessonTitle || lessonLink) {
    lines.push('', 'Lesson:');
    if (lessonTitle) lines.push(`Title: ${lessonTitle}`);
    if (lessonLink) lines.push(`Link: ${lessonLink}`);
  }

  lines.push('', `Submitted by: ${senderEmail}`);
  // if (pageUrl) lines.push(`Submitted from: ${pageUrl}`);

  return lines.join('\n');
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const feedbackToEmail = process.env.FEEDBACK_TO_EMAIL || DEFAULT_FEEDBACK_TO_EMAIL;
  const feedbackFromEmail = process.env.FEEDBACK_FROM_EMAIL || DEFAULT_FEEDBACK_FROM_EMAIL;

  if (!resendApiKey) {
    return NextResponse.json({ error: 'Feedback email is not configured' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const feedbackText = cleanOptionalString(body.feedbackText);
    const lessonTitle = cleanOptionalString(body.lessonTitle);
    const lessonLink = cleanOptionalString(body.lessonLink);
    const pageUrl = cleanOptionalString(body.pageUrl);

    if (!feedbackText) {
      return NextResponse.json({ error: 'Feedback is required' }, { status: 400 });
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const senderEmail = user.primaryEmailAddress?.emailAddress || user.emailAddresses[0]?.emailAddress;

    if (!senderEmail) {
      return NextResponse.json({ error: 'Signed-in user does not have an email address' }, { status: 400 });
    }

    const resend = new Resend(resendApiKey);
    const { data, error } = await resend.emails.send({
      from: feedbackFromEmail,
      to: feedbackToEmail,
      replyTo: senderEmail,
      subject: FEEDBACK_SUBJECT,
      text: formatFeedbackEmail({
        feedbackText,
        lessonTitle,
        lessonLink,
        senderEmail,
        pageUrl,
      }),
    });

    if (error) {
      console.error('Resend feedback email error:', error);
      return NextResponse.json({ error: 'Unable to send feedback email' }, { status: 502 });
    }

    return NextResponse.json({ success: true, emailId: data?.id });
  } catch (error) {
    console.error('Error sending feedback:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
