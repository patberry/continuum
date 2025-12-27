import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const amount = body.amount || 50;

    // Get current balance
    const { data: existing } = await supabase
      .from('credit_balances')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('credit_balances')
        .update({
          topup_credits: existing.topup_credits + amount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;
    } else {
      // Create new
      const { error } = await supabase
        .from('credit_balances')
        .insert({
          user_id: userId,
          monthly_credits: 50,
          topup_credits: amount,
        });

      if (error) throw error;
    }

    return NextResponse.json({ success: true, added: amount });
  } catch (error) {
    console.error('Add credits error:', error);
    return NextResponse.json({ error: 'Failed to add credits' }, { status: 500 });
  }
}