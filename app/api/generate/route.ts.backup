// app/api/generate/route.ts
// Prompt generation API with credit handling

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getActiveSession, getSession, updateSessionCredits } from '@/lib/sessions';
import { calculateCost, deductCredits, getBalance } from '@/lib/credits';
import { generatePrompt } from '@/lib/claude';

export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      userInput,
      platform = 'veo3',
      outputType = 'video',
      sessionId,
      duration = 7,
      shotType = 'auto'
    } = body;

    // Validate input
    if (!userInput || userInput.trim().length === 0) {
      return NextResponse.json({ error: 'userInput is required' }, { status: 400 });
    }

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required. Create a session first.' }, { status: 400 });
    }

    // Validate platform
    const validPlatforms = ['veo3', 'sora', 'midjourney', 'flux'];
    if (!validPlatforms.includes(platform)) {
      return NextResponse.json({
        error: `Invalid platform. Use one of: ${validPlatforms.join(', ')}`
      }, { status: 400 });
    }

    // Validate output type
    const validOutputTypes = ['video', 'still'];
    if (!validOutputTypes.includes(outputType)) {
      return NextResponse.json({
        error: `Invalid outputType. Use one of: ${validOutputTypes.join(', ')}`
      }, { status: 400 });
    }

    // Get session
    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.userId !== userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (session.status !== 'active') {
      return NextResponse.json({
        error: 'Session is no longer active. Create a new session.'
      }, { status: 400 });
    }

    // Calculate cost
    const isFirstPrompt = session.promptCount === 0;
    const cost = calculateCost(isFirstPrompt, session.sessionStart);

    // Check balance before generation
    const balance = await getBalance(userId);
    if (!balance || balance.totalAvailable < cost) {
      return NextResponse.json({
        error: 'Insufficient credits',
        required: cost,
        available: balance?.totalAvailable || 0
      }, { status: 402 });
    }

    // Generate prompt using Claude
    const result = await generatePrompt({
      userInput: userInput.trim(),
      platform,
      outputType,
      sessionId,
      brandId: session.brandId,
      userId,
      duration,
      shotType
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Deduct credits AFTER successful generation
    const deduction = await deductCredits(
      userId,
      cost,
      sessionId,
      result.promptId,
      `Generated ${outputType} prompt for ${platform}`
    );

    if (!deduction.success) {
      // Generation succeeded but credit deduction failed
      // Log this for manual review but still return the prompt
      console.error('Credit deduction failed after successful generation:', {
        userId,
        sessionId,
        promptId: result.promptId,
        cost
      });
    }

    // Update session credit total
    await updateSessionCredits(sessionId, cost);

    // Get updated balance
    const newBalance = await getBalance(userId);

    return NextResponse.json({
      success: true,
      prompt: {
        id: result.promptId,
        text: result.promptText,
        platform: result.platformRecommendation,
        outputType,
        technicalNotes: result.technicalNotes
      },
      credits: {
        cost,
        remaining: newBalance?.totalAvailable || 0,
        isFirstPrompt,
        multiplier: getMultiplierForDisplay(session.sessionStart)
      },
      session: {
        promptCount: session.promptCount + 1,
        totalCreditsUsed: session.totalCreditsUsed + cost
      }
    });

  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}

function getMultiplierForDisplay(sessionStart: Date): string {
  const minutesElapsed = (Date.now() - sessionStart.getTime()) / (1000 * 60);

  if (minutesElapsed <= 10) return '1x (0-10 min)';
  if (minutesElapsed <= 20) return '1.5x (10-20 min)';
  return '2x (20+ min)';
}
