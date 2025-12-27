// app/api/sessions/route.ts
// Session management API - with debug logging
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSession, getActiveSession, closeSession } from '@/lib/sessions';

// GET - Get active session
export async function GET() {
  console.log('=== SESSION GET HIT ===');
  
  const { userId } = await auth();
  console.log('User ID:', userId);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const session = await getActiveSession(userId);
  console.log('Active session:', session);
  
  if (!session) {
    return NextResponse.json({ session: null, message: 'No active session' });
  }

  return NextResponse.json({
    session: {
      id: session.sessionId,
      brand_id: session.brandId,
      status: session.status,
      created_at: session.sessionStart.toISOString(),
      promptCount: session.promptCount,
      totalCreditsUsed: session.totalCreditsUsed,
      minutesElapsed: Math.floor((Date.now() - session.sessionStart.getTime()) / 60000)
    }
  });
}

// POST - Create new session
export async function POST(request: NextRequest) {
  console.log('=== SESSION CREATE HIT ===');
  
  const { userId } = await auth();
  console.log('User ID:', userId);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    console.log('Request body:', body);
    const brandId = body.brand_id;
    
    if (!brandId) {
      return NextResponse.json({ error: 'brand_id is required' }, { status: 400 });
    }

    const result = await createSession(userId, brandId);
    console.log('Session result:', result);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      session: {
        id: result.session!.sessionId,
        brand_id: result.session!.brandId,
        status: result.session!.status,
        created_at: result.session!.sessionStart.toISOString(),
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
  console.log('=== SESSION DELETE HIT ===');
  
  const { userId } = await auth();
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