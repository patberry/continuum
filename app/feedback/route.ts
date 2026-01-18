import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Map numeric ratings to text labels
const RATING_LABELS: Record<number, string> = {
  1: 'terrible',
  2: 'poor',
  3: 'okay',
  4: 'good',
  5: 'great'
};

// Valid string ratings (for sidebar compatibility)
const VALID_STRING_RATINGS = ['terrible', 'bad', 'poor', 'okay', 'good', 'great'];

// ============================================
// GET - Fetch unrated prompts for sidebar
// ============================================
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Fetch prompts without feedback for this user
    const { data: prompts, error } = await supabase
      .from('prompts')
      .select(`
        prompt_id,
        user_input,
        prompt_text,
        platform,
        created_at,
        brand_profiles!inner(brand_name)
      `)
      .eq('user_id', userId)
      .is('user_feedback', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching unrated prompts:', error);
      
      // Try simpler query without join if the join fails
      const { data: simplePrompts, error: simpleError } = await supabase
        .from('prompts')
        .select('prompt_id, user_input, prompt_text, platform, created_at')
        .eq('user_id', userId)
        .is('user_feedback', null)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (simpleError) {
        return NextResponse.json({ error: 'Failed to fetch prompts' }, { status: 500 });
      }

      return NextResponse.json({ prompts: simplePrompts || [] });
    }

    return NextResponse.json({ prompts: prompts || [] });

  } catch (error) {
    console.error('Feedback GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// POST - Submit feedback for a prompt
// ============================================
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { promptId, rating, feedback, notes } = body;

    if (!promptId) {
      return NextResponse.json({ error: 'promptId is required' }, { status: 400 });
    }

    // Handle both numeric rating and string feedback
    let ratingLabel: string;
    
    if (typeof rating === 'number') {
      // Numeric rating (1-5) from modal
      if (rating < 1 || rating > 5) {
        return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
      }
      ratingLabel = RATING_LABELS[rating];
    } else if (typeof feedback === 'string') {
      // String feedback from sidebar
      const normalizedFeedback = feedback.toLowerCase();
      if (!VALID_STRING_RATINGS.includes(normalizedFeedback)) {
        return NextResponse.json({ 
          error: `Invalid feedback. Valid values: ${VALID_STRING_RATINGS.join(', ')}` 
        }, { status: 400 });
      }
      // Map 'bad' to 'poor' for consistency
      ratingLabel = normalizedFeedback === 'bad' ? 'poor' : normalizedFeedback;
    } else if (typeof rating === 'string') {
      // String rating from new modal component
      const normalizedRating = rating.toLowerCase();
      if (!VALID_STRING_RATINGS.includes(normalizedRating)) {
        return NextResponse.json({ 
          error: `Invalid rating. Valid values: ${VALID_STRING_RATINGS.join(', ')}` 
        }, { status: 400 });
      }
      ratingLabel = normalizedRating === 'bad' ? 'poor' : normalizedRating;
    } else {
      return NextResponse.json({ error: 'rating or feedback is required' }, { status: 400 });
    }

    // Verify the prompt belongs to this user
    const { data: existingPrompt, error: fetchError } = await supabase
      .from('prompts')
      .select('prompt_id, user_id, brand_id, platform')
      .eq('prompt_id', promptId)
      .single();

    if (fetchError || !existingPrompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    if (existingPrompt.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update the prompt with feedback
    const { data: updatedPrompt, error: updateError } = await supabase
      .from('prompts')
      .update({
        user_feedback: ratingLabel,
        feedback_notes: notes || null
      })
      .eq('prompt_id', promptId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating prompt feedback:', updateError);
      return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
    }

    // Log for learning system analytics
    console.log('=== FEEDBACK RECORDED ===', {
      promptId,
      brandId: existingPrompt.brand_id,
      platform: existingPrompt.platform,
      rating: ratingLabel,
      hasNotes: !!notes
    });

    return NextResponse.json({ 
      success: true,
      message: 'Feedback recorded',
      promptId: promptId,
      rating: ratingLabel
    });

  } catch (error) {
    console.error('Feedback API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
