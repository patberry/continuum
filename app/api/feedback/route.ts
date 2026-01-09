import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Valid feedback values
const VALID_FEEDBACK = ['great', 'good', 'okay', 'bad', 'terrible'];

export async function POST(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { promptId, feedback, notes, platformUsed, issues } = await request.json();

    // Validation
    if (!promptId) {
      return NextResponse.json({ error: 'Missing promptId' }, { status: 400 });
    }

    if (feedback && !VALID_FEEDBACK.includes(feedback.toLowerCase())) {
      return NextResponse.json(
        { error: `Invalid feedback. Use: ${VALID_FEEDBACK.join(', ')}` },
        { status: 400 }
      );
    }

    // Verify prompt belongs to user
    const { data: prompt, error: fetchError } = await supabase
      .from('prompts')
      .select('prompt_id, brand_id, user_id, metadata')
      .eq('prompt_id', promptId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !prompt) {
      return NextResponse.json(
        { error: 'Prompt not found or access denied' },
        { status: 404 }
      );
    }

    // Update prompt with feedback
    const { error: updateError } = await supabase
      .from('prompts')
      .update({
        user_feedback: feedback?.toLowerCase(),
        feedback_notes: notes,
        metadata: {
          ...prompt.metadata,
          platform_actually_used: platformUsed,
          issues_reported: issues, // e.g., ['motion', 'lighting', 'consistency']
          feedback_at: new Date().toISOString()
        }
      })
      .eq('prompt_id', promptId);

    if (updateError) {
      console.error('Feedback update error:', updateError);
      return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
    }

    // If feedback is good/great, boost brand intelligence confidence
    if (feedback === 'great' || feedback === 'good') {
      await boostIntelligenceFromSuccess(prompt.brand_id, promptId);
    }

    // If feedback is bad/terrible, potentially reduce confidence or flag for review
    if (feedback === 'bad' || feedback === 'terrible') {
      await flagIntelligenceIssue(prompt.brand_id, promptId, issues);
    }

    return NextResponse.json({
      success: true,
      message: 'Feedback recorded',
      promptId
    });

  } catch (error: any) {
    console.error('Feedback error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to record feedback' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch prompts awaiting feedback
export async function GET(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get('brandId');
    const limit = parseInt(searchParams.get('limit') || '10');

    let query = supabase
      .from('prompts')
      .select(`
        prompt_id,
        user_input,
        prompt_text,
        platform,
        created_at,
        brand_id,
        brand_profiles!inner(brand_name)
      `)
      .eq('user_id', userId)
      .is('user_feedback', null) // Only prompts without feedback
      .order('created_at', { ascending: false })
      .limit(limit);

    if (brandId) {
      query = query.eq('brand_id', brandId);
    }

    const { data: prompts, error } = await query;

    if (error) {
      console.error('Fetch prompts error:', error);
      return NextResponse.json({ error: 'Failed to fetch prompts' }, { status: 500 });
    }

    return NextResponse.json({
      prompts: prompts || [],
      count: prompts?.length || 0
    });

  } catch (error: any) {
    console.error('Fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch prompts' },
      { status: 500 }
    );
  }
}


// ============================================
// INTELLIGENCE BOOSTING
// ============================================
async function boostIntelligenceFromSuccess(brandId: string, promptId: string) {
  // Get the prompt to analyze what patterns were applied
  const { data: prompt } = await supabase
    .from('prompts')
    .select('metadata, prompt_text')
    .eq('prompt_id', promptId)
    .single();

  if (!prompt?.metadata?.patterns_applied) return;

  // Boost confidence for patterns that led to success
  for (const pattern of prompt.metadata.patterns_applied) {
    // Try to find matching intelligence record and boost it
    const { data: intel } = await supabase
      .from('brand_intelligence')
      .select('intelligence_id, confidence_score')
      .eq('brand_id', brandId)
      .ilike('learned_value', `%${pattern}%`)
      .limit(1)
      .single();

    if (intel) {
      await supabase
        .from('brand_intelligence')
        .update({
          confidence_score: Math.min(intel.confidence_score + 0.1, 1.0),
          last_seen: new Date().toISOString()
        })
        .eq('intelligence_id', intel.intelligence_id);
    }
  }
}


// ============================================
// INTELLIGENCE FLAGGING
// ============================================
async function flagIntelligenceIssue(brandId: string, promptId: string, issues?: string[]) {
  // Get the prompt
  const { data: prompt } = await supabase
    .from('prompts')
    .select('metadata')
    .eq('prompt_id', promptId)
    .single();

  if (!prompt?.metadata?.patterns_applied) return;

  // Reduce confidence for patterns that led to failure
  for (const pattern of prompt.metadata.patterns_applied) {
    const { data: intel } = await supabase
      .from('brand_intelligence')
      .select('intelligence_id, confidence_score')
      .eq('brand_id', brandId)
      .ilike('learned_value', `%${pattern}%`)
      .limit(1)
      .single();

    if (intel) {
      await supabase
        .from('brand_intelligence')
        .update({
          confidence_score: Math.max(intel.confidence_score - 0.15, 0.1), // Don't go below 0.1
          last_seen: new Date().toISOString()
        })
        .eq('intelligence_id', intel.intelligence_id);
    }
  }
}
