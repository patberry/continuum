// app/api/feedback/route.ts
// Prompt feedback API - powers the learning system

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { storeFeedback } from '@/lib/claude';

export async function POST(request: NextRequest) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { promptId, rating } = await request.json();

    if (!promptId) {
      return NextResponse.json({ error: 'promptId is required' }, { status: 400 });
    }

    const validRatings = ['great', 'good', 'bad'];
    if (!rating || !validRatings.includes(rating)) {
      return NextResponse.json({
        error: `Invalid rating. Use one of: ${validRatings.join(', ')}`
      }, { status: 400 });
    }

    const success = await storeFeedback(promptId, userId, rating);

    if (!success) {
      return NextResponse.json({ error: 'Failed to store feedback' }, { status: 500 });
    }

    const messages: Record<string, string> = {
      great: '🧠 Recording... This pattern will be remembered for future prompts.',
      good: '👍 Thanks! This helps calibrate future generations.',
      bad: '📝 Noted. I\'ll adjust my approach for this brand.'
    };

    return NextResponse.json({
      success: true,
      message: messages[rating]
    });

  } catch (error) {
    console.error('Feedback error:', error);
    return NextResponse.json({ error: 'Failed to process feedback' }, { status: 500 });
  }
}
