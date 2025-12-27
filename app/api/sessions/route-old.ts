// app/api/sessions/route.ts
// Session management API

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { createSession, getActiveSession, closeSession } from '@/lib/sessions';

// GET - Get active session
export async function GET() {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const session = await getActiveSession(userId);

  if (!session) {
    return NextResponse.json({ session: null, message: 'No active session' });
  }

  return NextResponse.json({
    session: {
      sessionId: session.sessionId,
      brandId: session.brandId,
      status: session.status,
      sessionStart: session.sessionStart.toISOString(),
      promptCount: session.promptCount,
      totalCreditsUsed: session.totalCreditsUsed,
      minutesElapsed: Math.floor((Date.now() - session.sessionStart.getTime()) / 60000)
    }
  });
}

// POST - Create new session
export async function POST(request: NextRequest) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { brandId } = await request.json();

    if (!brandId) {
      return NextResponse.json({ error: 'brandId is required' }, { status: 400 });
    }

    const result = await createSession(userId, brandId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      session: {
        sessionId: result.session!.sessionId,
        brandId: result.session!.brandId,
        status: result.session!.status,
        sessionStart: result.session!.sessionStart.toISOString(),
        promptCount: 0,
        totalCreditsUsed: 0
      },
      costEstimate: result.costEstimate,
      message: 'Session created. First prompt will cost 10 credits.'
    });

  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}

// DELETE - Close active session
export async function DELETE(request: NextRequest) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const session = await getActiveSession(userId);

  if (!session) {
    return NextResponse.json({ error: 'No active session to close' }, { status: 404 });
  }

  const closed = await closeSession(session.sessionId, 'completed');

  if (!closed) {
    return NextResponse.json({ error: 'Failed to close session' }, { status: 500 });
  }

  return NextResponse.json({
    message: 'Session closed',
    summary: {
      sessionId: session.sessionId,
      promptCount: session.promptCount,
      totalCreditsUsed: session.totalCreditsUsed,
      duration: Math.floor((Date.now() - session.sessionStart.getTime()) / 60000) + ' minutes'
    }
  });
}
