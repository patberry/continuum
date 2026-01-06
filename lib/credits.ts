// lib/credits.ts
// Credit system for Continuum
// Pricing: 10 base + 2 per iteration, time multipliers

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Time multiplier tiers (minutes since session start)
const TIME_MULTIPLIERS = [
  { maxMinutes: 10, multiplier: 1.0 },
  { maxMinutes: 20, multiplier: 1.5 },
  { maxMinutes: 30, multiplier: 2.0 },
];

// Credit costs
const BASE_SESSION_COST = 10;
const ITERATION_COST = 2;

export interface CreditBalance {
  userId: string;
  monthlyCredits: number;
  topupCredits: number;
  totalAvailable: number;
}

export interface DeductionResult {
  success: boolean;
  creditsDeducted: number;
  remainingBalance: number;
  error?: string;
}

/**
 * Get current credit balance for a user
 */
export async function getBalance(userId: string): Promise<CreditBalance | null> {
  const { data, error } = await supabase
    .from('credit_balances')
    .select('monthly_credits, topup_credits, total_credits_used')
    .eq('balance_id', userId)
    .single();

  if (error || !data) {
    // New user - create initial balance (free tier: 50 credits)
    const { data: newBalance, error: insertError } = await supabase
      .from('credit_balances')
      .insert({
        user_id: userId,
        monthly_credits: 50,
        topup_credits: 0,
        total_credits_used: 0
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to create credit balance:', insertError);
      return null;
    }

    return {
      userId,
      monthlyCredits: 50,
      topupCredits: 0,
      totalAvailable: 50
    };
  }

  return {
    userId,
    monthlyCredits: data.monthly_credits,
    topupCredits: data.topup_credits,
    totalAvailable: data.monthly_credits + data.topup_credits
  };
}

/**
 * Calculate time multiplier based on session duration
 */
export function getTimeMultiplier(sessionStartTime: Date): number {
  const now = new Date();
  const minutesElapsed = (now.getTime() - sessionStartTime.getTime()) / (1000 * 60);

  for (const tier of TIME_MULTIPLIERS) {
    if (minutesElapsed <= tier.maxMinutes) {
      return tier.multiplier;
    }
  }

  // Beyond 30 minutes = 2x (max)
  return 2.0;
}

/**
 * Calculate cost for a prompt generation
 */
export function calculateCost(
  isFirstInSession: boolean,
  sessionStartTime: Date
): number {
  const baseCost = isFirstInSession ? BASE_SESSION_COST : ITERATION_COST;
  const multiplier = getTimeMultiplier(sessionStartTime);
  return Math.ceil(baseCost * multiplier);
}

/**
 * Check if user can afford a generation
 */
export async function canAfford(
  userId: string,
  cost: number
): Promise<boolean> {
  const balance = await getBalance(userId);
  if (!balance) return false;
  return balance.totalAvailable >= cost;
}

/**
 * Deduct credits from user balance
 * Uses monthly credits first, then topup
 */
export async function deductCredits(
  userId: string,
  amount: number,
  sessionId: string,
  promptId?: string,
  description?: string
): Promise<DeductionResult> {
  // Get current balance with total_credits_used
  const { data: currentData, error: fetchError } = await supabase
    .from('credit_balances')
    .select('monthly_credits, topup_credits, total_credits_used')
    .eq('user_id', userId)
    .single();

  if (fetchError || !currentData) {
    return { success: false, creditsDeducted: 0, remainingBalance: 0, error: 'No balance found' };
  }

  const totalAvailable = currentData.monthly_credits + currentData.topup_credits;

  if (totalAvailable < amount) {
    return {
      success: false,
      creditsDeducted: 0,
      remainingBalance: totalAvailable,
      error: 'Insufficient credits'
    };
  }

  // Calculate how to split deduction
  let monthlyDeduction = 0;
  let topupDeduction = 0;

  if (currentData.monthly_credits >= amount) {
    monthlyDeduction = amount;
  } else {
    monthlyDeduction = currentData.monthly_credits;
    topupDeduction = amount - currentData.monthly_credits;
  }

  // Update balance with explicit values (no RPC)
  const { error: updateError } = await supabase
    .from('credit_balances')
    .update({
      monthly_credits: currentData.monthly_credits - monthlyDeduction,
      topup_credits: currentData.topup_credits - topupDeduction,
      total_credits_used: (currentData.total_credits_used || 0) + amount,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  if (updateError) {
    console.error('Failed to update balance:', updateError);
    return { success: false, creditsDeducted: 0, remainingBalance: totalAvailable, error: 'Update failed' };
  }

  // Log transaction
  await supabase.from('credit_transactions').insert({
    user_id: userId,
    transaction_type: 'deduction',
    credit_type: monthlyDeduction > 0 ? 'monthly' : 'topup',
    amount: -amount,
    description: description || 'Prompt generation',
    related_session_id: sessionId,
    related_prompt_id: promptId
  });

  return {
    success: true,
    creditsDeducted: amount,
    remainingBalance: totalAvailable - amount
  };
}

/**
 * Add credits to user balance (for purchases)
 */
export async function addCredits(
  userId: string,
  amount: number,
  creditType: 'monthly' | 'topup',
  stripePaymentIntentId?: string
): Promise<boolean> {
  // Get current values first
  const { data: currentData, error: fetchError } = await supabase
    .from('credit_balances')
    .select('monthly_credits, topup_credits')
    .eq('user_id', userId)
    .single();

  if (fetchError || !currentData) return false;

  const updateField = creditType === 'monthly' ? 'monthly_credits' : 'topup_credits';
  const currentAmount = creditType === 'monthly' ? currentData.monthly_credits : currentData.topup_credits;

  const { error } = await supabase
    .from('credit_balances')
    .update({
      [updateField]: currentAmount + amount,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  if (error) return false;

  // Log transaction
  await supabase.from('credit_transactions').insert({
    user_id: userId,
    transaction_type: 'purchase',
    credit_type: creditType,
    amount: amount,
    description: `Added ${amount} ${creditType} credits`,
    stripe_payment_intent_id: stripePaymentIntentId
  });

  // If topup, create expiration record (12 months)
  if (creditType === 'topup') {
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 12);

    await supabase.from('topup_purchases').insert({
      user_id: userId,
      credits_purchased: amount,
      credits_remaining: amount,
      expires_at: expiresAt.toISOString(),
      stripe_payment_intent_id: stripePaymentIntentId
    });
  }

  return true;
}
