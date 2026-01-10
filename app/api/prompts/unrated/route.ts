import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get most recent unrated prompt from previous sessions (not current session)
    // We look for prompts created more than 5 minutes ago without feedback
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const { data: unratedPrompt, error } = await supabase
      .from('prompts')
      .select('prompt_id, prompt_text, platform, brand_id, created_at')
      .eq('user_id', userId)
      .is('user_feedback', null)
      .lt('created_at', fiveMinutesAgo)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is fine
      console.error('Error fetching unrated prompt:', error);
      return NextResponse.json({ error: 'Failed to fetch unrated prompts' }, { status: 500 });
    }

    return NextResponse.json({ 
      unratedPrompt: unratedPrompt || null 
    });

  } catch (error) {
    console.error('Unrated prompts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
