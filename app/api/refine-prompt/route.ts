import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';

export async function POST(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { originalPrompt, brandId, platform, userFeedback } = await request.json();

    // Validation
    if (!originalPrompt || !platform) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Build refinement system prompt
    const systemPrompt = `You are refining an existing AI video/image generation prompt.

CRITICAL RULES FOR REFINEMENT:

1. PRESERVE CORE STRUCTURE
   - Keep motion-first methodology (for video)
   - Maintain brand elements
   - Preserve technical specifications

2. INCORPORATE USER FEEDBACK
   - User wants to change: ${userFeedback || 'minor adjustments'}
   - Make targeted refinements only

3. MAINTAIN PLATFORM OPTIMIZATION
   - This is for ${platform}
   - Keep platform-specific optimizations

4. LEARNING OPPORTUNITY
   - This refinement teaches the agent
   - Note what changed and why

DO NOT:
- Completely rewrite (this is refinement, not regeneration)
- Remove core brand elements
- Change fundamental shot structure

OUTPUT:
Refined prompt only. No explanation, no preamble.`;

    // Call Claude API for refinement
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: `Original Prompt:
${originalPrompt}

Platform: ${platform}
User Feedback/Changes: ${userFeedback}

Refine the prompt based on user feedback while preserving core structure.`,
        }],
        system: systemPrompt,
      }),
    });

    if (!response.ok) {
      throw new Error('Claude API failed');
    }

    const data = await response.json();
    const refinedPrompt = data.content[0].text;

    // TODO: Store refinement in database
    // - Link to original prompt
    // - Refinement iteration number
    // - What changed
    // - Timestamp
    // - Brand ID
    // This data teaches the agent what refinements work

    return NextResponse.json({
      refinedPrompt,
      creditsCharged: 2,
    });

  } catch (error: any) {
    console.error('Refinement error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to refine prompt' },
      { status: 500 }
    );
  }
}
