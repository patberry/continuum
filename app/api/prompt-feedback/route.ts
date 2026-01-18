import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { promptId, rating, notes } = await request.json();

    if (!promptId || !rating) {
      return NextResponse.json(
        { error: 'Missing required fields: promptId, rating' },
        { status: 400 }
      );
    }

    // Validate rating value
    const validRatings = ['failed', 'poor', 'okay', 'good', 'perfect'];
    if (!validRatings.includes(rating)) {
      return NextResponse.json(
        { error: `Invalid rating. Valid values: ${validRatings.join(', ')}` },
        { status: 400 }
      );
    }

    // Verify the prompt belongs to this user
    const { data: prompt, error: fetchError } = await supabase
      .from('prompts')
      .select('prompt_id, brand_id, platform, metadata')
      .eq('prompt_id', promptId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !prompt) {
      return NextResponse.json(
        { error: 'Prompt not found or access denied' },
        { status: 404 }
      );
    }

    // Map rating to issues for negative feedback
    const issuesReported: string[] = [];
    if (rating === 'failed' || rating === 'poor') {
      // Parse common issues from notes if provided
      const notesLower = (notes || '').toLowerCase();
      if (notesLower.includes('motion') || notesLower.includes('moving') || notesLower.includes('speed')) {
        issuesReported.push('motion');
      }
      if (notesLower.includes('light') || notesLower.includes('dark') || notesLower.includes('bright')) {
        issuesReported.push('lighting');
      }
      if (notesLower.includes('color') || notesLower.includes('muddy') || notesLower.includes('saturate')) {
        issuesReported.push('color');
      }
      if (notesLower.includes('consistent') || notesLower.includes('flicker') || notesLower.includes('jump')) {
        issuesReported.push('consistency');
      }
      if (notesLower.includes('physics') || notesLower.includes('realistic') || notesLower.includes('fake')) {
        issuesReported.push('physics');
      }
    }

    // Update the prompt with feedback
    const updatedMetadata = {
      ...(prompt.metadata || {}),
      feedback_at: new Date().toISOString(),
      issues_reported: issuesReported.length > 0 ? issuesReported : undefined,
    };

    const { error: updateError } = await supabase
      .from('prompts')
      .update({
        user_feedback: rating,
        feedback_notes: notes || null,
        metadata: updatedMetadata,
      })
      .eq('prompt_id', promptId);

    if (updateError) {
      console.error('Failed to save feedback:', updateError);
      return NextResponse.json(
        { error: 'Failed to save feedback' },
        { status: 500 }
      );
    }

    // Update brand intelligence based on feedback
    await updateIntelligenceFromFeedback(
      prompt.brand_id,
      prompt.platform,
      rating,
      issuesReported
    );

    return NextResponse.json({
      success: true,
      message: 'Feedback saved successfully',
      rating,
      issuesDetected: issuesReported,
    });

  } catch (error: any) {
    console.error('Feedback error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process feedback' },
      { status: 500 }
    );
  }
}

// Update brand intelligence based on explicit feedback
async function updateIntelligenceFromFeedback(
  brandId: string,
  platform: string,
  rating: string,
  issues: string[]
) {
  // Positive feedback increases platform confidence
  if (rating === 'good' || rating === 'perfect') {
    await adjustPlatformConfidence(brandId, platform, 0.1);
  }
  
  // Negative feedback decreases platform confidence
  if (rating === 'failed' || rating === 'poor') {
    await adjustPlatformConfidence(brandId, platform, -0.15);
    
    // Store specific issues as negative intelligence
    for (const issue of issues) {
      await storeNegativePattern(brandId, platform, issue);
    }
  }
}

async function adjustPlatformConfidence(
  brandId: string,
  platform: string,
  adjustment: number
) {
  const { data: existing } = await supabase
    .from('brand_intelligence')
    .select('intelligence_id, confidence_score, occurrences')
    .eq('brand_id', brandId)
    .eq('intelligence_type', 'platform_preference')
    .eq('learned_value', platform)
    .single();

  if (existing) {
    const newConfidence = Math.max(0, Math.min(1, existing.confidence_score + adjustment));
    await supabase
      .from('brand_intelligence')
      .update({
        confidence_score: newConfidence,
        occurrences: existing.occurrences + 1,
        last_seen: new Date().toISOString(),
      })
      .eq('intelligence_id', existing.intelligence_id);
  }
}

async function storeNegativePattern(
  brandId: string,
  platform: string,
  issue: string
) {
  const intelligenceType = `platform_issue_${platform}`;
  
  const { data: existing } = await supabase
    .from('brand_intelligence')
    .select('intelligence_id, occurrences')
    .eq('brand_id', brandId)
    .eq('intelligence_type', intelligenceType)
    .eq('learned_value', issue)
    .single();

  if (existing) {
    await supabase
      .from('brand_intelligence')
      .update({
        occurrences: existing.occurrences + 1,
        last_seen: new Date().toISOString(),
      })
      .eq('intelligence_id', existing.intelligence_id);
  } else {
    await supabase
      .from('brand_intelligence')
      .insert({
        brand_id: brandId,
        intelligence_type: intelligenceType,
        learned_value: issue,
        confidence_score: 0.6,
        occurrences: 1,
      });
  }
}
