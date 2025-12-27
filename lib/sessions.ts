// lib/sessions.ts
// Session management for Continuum
// Tracks creative sessions with brand isolation

import { createClient } from '@supabase/supabase-js';
import { calculateCost, deductCredits, canAfford } from './credits';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Session auto-close after 30 minutes of inactivity
const SESSION_TIMEOUT_MINUTES = 30;

export interface Session {
  sessionId: string;
  brandId: string;
  userId: string;
  status: 'active' | 'completed' | 'abandoned';
  sessionStart: Date;
  promptCount: number;
  totalCreditsUsed: number;
}

export interface CreateSessionResult {
  success: boolean;
  session?: Session;
  error?: string;
  costEstimate?: number;
}

/**
 * Create a new session for a brand
 */
export async function createSession(
  userId: string,
  brandId: string
): Promise<CreateSessionResult> {
  // Check if user owns this brand
  const { data: brand, error: brandError } = await supabase
    .from('brand_profiles')
    .select('brand_id, brand_name')
    .eq('brand_id', brandId)
    .eq('user_id', userId)
    .single();

  if (brandError || !brand) {
    return { success: false, error: 'Brand not found or access denied' };
  }

  // Check if user can afford base session cost (10 credits)
  const canStart = await canAfford(userId, 10);
  if (!canStart) {
    return { success: false, error: 'Insufficient credits. Need 10 credits to start a session.' };
  }

  // Close any existing active sessions for this user
  await supabase
    .from('sessions')
    .update({ status: 'abandoned', session_end: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('status', 'active');

  // Create new session
  const { data: session, error } = await supabase
    .from('sessions')
    .insert({
      brand_id: brandId,
      user_id: userId,
      status: 'active',
      total_credits_used: 0
    })
    .select()
    .single();

  if (error || !session) {
    return { success: false, error: 'Failed to create session' };
  }

  return {
    success: true,
    session: {
      sessionId: session.session_id,
      brandId: session.brand_id,
      userId: session.user_id,
      status: session.status,
      sessionStart: new Date(session.session_start),
      promptCount: 0,
      totalCreditsUsed: 0
    },
    costEstimate: 10
  };
}

/**
 * Get active session for a user
 */
export async function getActiveSession(userId: string): Promise<Session | null> {
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      session_id,
      brand_id,
      user_id,
      status,
      session_start,
      total_credits_used,
      prompts(count)
    `)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (error || !data) return null;

  // Check for timeout
  const sessionStart = new Date(data.session_start);
  const minutesElapsed = (Date.now() - sessionStart.getTime()) / (1000 * 60);

  if (minutesElapsed > SESSION_TIMEOUT_MINUTES) {
    // Auto-close expired session
    await closeSession(data.session_id, 'abandoned');
    return null;
  }

  return {
    sessionId: data.session_id,
    brandId: data.brand_id,
    userId: data.user_id,
    status: data.status,
    sessionStart,
    promptCount: data.prompts?.[0]?.count || 0,
    totalCreditsUsed: data.total_credits_used
  };
}

/**
 * Get session by ID
 */
export async function getSession(sessionId: string): Promise<Session | null> {
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      session_id,
      brand_id,
      user_id,
      status,
      session_start,
      total_credits_used
    `)
    .eq('session_id', sessionId)
    .single();

  if (error || !data) return null;

  // Get prompt count
  const { count } = await supabase
    .from('prompts')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', sessionId);

  return {
    sessionId: data.session_id,
    brandId: data.brand_id,
    userId: data.user_id,
    status: data.status,
    sessionStart: new Date(data.session_start),
    promptCount: count || 0,
    totalCreditsUsed: data.total_credits_used
  };
}

/**
 * Close a session
 */
export async function closeSession(
  sessionId: string,
  status: 'completed' | 'abandoned' = 'completed'
): Promise<boolean> {
  const { error } = await supabase
    .from('sessions')
    .update({
      status,
      session_end: new Date().toISOString()
    })
    .eq('session_id', sessionId);

  return !error;
}

/**
 * Update session credit usage
 */
export async function updateSessionCredits(
  sessionId: string,
  creditsUsed: number
): Promise<boolean> {
  const { error } = await supabase
    .from('sessions')
    .update({
      total_credits_used: supabase.rpc('add_to_session_credits', {
        session_id: sessionId,
        amount: creditsUsed
      })
    })
    .eq('session_id', sessionId);

  // Fallback if RPC doesn't exist - fetch and update
  if (error) {
    const session = await getSession(sessionId);
    if (!session) return false;

    const { error: updateError } = await supabase
      .from('sessions')
      .update({
        total_credits_used: session.totalCreditsUsed + creditsUsed
      })
      .eq('session_id', sessionId);

    return !updateError;
  }

  return true;
}

/**
 * Get session cost estimate (for UI display)
 */
export function getNextPromptCost(session: Session): {
  cost: number;
  multiplier: number;
  isFirstPrompt: boolean;
} {
  const isFirstPrompt = session.promptCount === 0;
  const multiplier = getTimeMultiplierValue(session.sessionStart);
  const baseCost = isFirstPrompt ? 10 : 2;
  const cost = Math.ceil(baseCost * multiplier);

  return { cost, multiplier, isFirstPrompt };
}

function getTimeMultiplierValue(sessionStart: Date): number {
  const minutesElapsed = (Date.now() - sessionStart.getTime()) / (1000 * 60);

  if (minutesElapsed <= 10) return 1.0;
  if (minutesElapsed <= 20) return 1.5;
  return 2.0;
}
