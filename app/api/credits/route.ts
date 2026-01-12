// app/api/credits/route.ts
import { auth } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Beta signup bonus - change this value to adjust new user credits
const BETA_SIGNUP_CREDITS = 250;

export async function GET() {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Try to fetch existing credit balance
    let { data: credits, error } = await supabase
      .from('credit_balances')
      .select('*')
      .eq('user_id', userId)
      .single();

    // If no record exists, create one with beta signup bonus
    if (error?.code === 'PGRST116' || !credits) {
      // Insert new credit balance with 250 beta tokens
      const { data: newCredits, error: insertError } = await supabase
        .from('credit_balances')
        .insert({
          user_id: userId,
          monthly_credits: 0,
          monthly_credits_expire_at: null,
          topup_credits: BETA_SIGNUP_CREDITS,
          total_credits_used: 0
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating credit balance:', insertError);
        return NextResponse.json({ error: 'Failed to initialize credits' }, { status: 500 });
      }

      // Log the transaction for audit trail
      await supabase
        .from('credit_transactions')
        .insert({
          user_id: userId,
          transaction_type: 'credit',
          credit_type: 'beta_signup',
          amount: BETA_SIGNUP_CREDITS,
          description: 'Beta signup bonus'
        });

      credits = newCredits;
    } else if (error) {
      console.error('Error fetching credits:', error);
      return NextResponse.json({ error: 'Failed to fetch credits' }, { status: 500 });
    }

    // Calculate total available credits
    const totalCredits = (credits.monthly_credits || 0) + (credits.topup_credits || 0);

    return NextResponse.json({
      credits: {
        total: totalCredits,
        monthly: credits.monthly_credits || 0,
        topup: credits.topup_credits || 0,
        used: credits.total_credits_used || 0
      }
    });

  } catch (error) {
    console.error('Credits API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
