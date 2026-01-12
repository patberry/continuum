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

// Beta tester configuration
const BETA_CREDITS_AMOUNT = 1000;
const BETA_REPLENISH_THRESHOLD = 100;  // Auto-replenish when below this
const BETA_PERIOD_DAYS = 30;           // Beta access duration

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
 * Check if user is an active beta tester (within 30 days of signup)
 */
async function isActiveBetaTester(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('beta_testers')
    .select('signed_up_at')
    .eq('user_id', userId)
    .single();

  if (error || !data || !data.signed_up_at) {
    return false;
  }

  const signedUpAt = new Date(data.signed_up_at);
  const now = new Date();
  const daysSinceSignup = (now.getTime() - signedUpAt.getTime()) / (1000 * 60 * 60 * 24);

  return daysSinceSignup <= BETA_PERIOD_DAYS;
}

/**
 * Replenish beta tester credits to full amount
 */
async function replenishBetaCredits(userId: string): Promise<void> {
  console.log(`🔄 Auto-replenishing beta credits for user: ${userId}`);
  
  const { error } = await supabase
    .from('credit_balances')
    .update({
      monthly_credits: BETA_CREDITS_AMOUNT,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  if (error) {
    console.error('Failed to replenish beta credits:', error);
  } else {
    // Log the replenishment
    await supabase.from('credit_transactions').insert({
      user_id: userId,
      transaction_type: 'beta_replenish',
      credit_type: 'monthly',
      amount: BETA_CREDITS_AMOUNT,
      description: 'Beta tester auto-replenish'
    });
    console.log(`✓ Beta credits replenished to ${BETA_CREDITS_AMOUNT}`);
  }
}

/**
 * Get current credit balance for a user
 * Auto-replenishes for active beta testers when below threshold
 */
export async function getBalance(userId: string): Promise<CreditBalance | null> {
  const { data, error } = await supabase
    .from('credit_balances')
    .select('monthly_credits, topup_credits, total_credits_used')
    .eq('user_id', userId)
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

  // Check for beta tester auto-replenish
  const totalAvailable = data.monthly_credits + data.topup_credits;
  
  if (totalAvailable < BETA_REPLENISH_THRESHOLD) {
    const isBeta = await isActiveBetaTester(userId);
    
    if (isBeta) {
      await replenishBetaCredits(userId);
      
      // Return replenished balance
      return {
        userId,
        monthlyCredits: BETA_CREDITS_AMOUNT,
        topupCredits: data.topup_credits,
        totalAvailable: BETA_CREDITS_AMOUNT + data.topup_credits
      };
    }
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
