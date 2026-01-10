import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { promptId, rating, notes } = body;

    if (!promptId || rating === undefined) {
      return NextResponse.json({ error: 'promptId and rating are required' }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
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
        user_feedback: rating,
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
      rating,
      hasNotes: !!notes
    });

    return NextResponse.json({ 
      success: true,
      message: 'Feedback recorded successfully',
      prompt: updatedPrompt
    });

  } catch (error) {
    console.error('Feedback API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
