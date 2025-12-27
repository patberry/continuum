// app/api/credits/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { getBalance } from '@/lib/credits';

export async function GET() {
  console.log('=== CREDITS ENDPOINT HIT ===');
  
  const { userId } = auth();
  console.log('User ID:', userId);

  if (!userId) {
    console.log('No user - returning unauthorized');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const balance = await getBalance(userId);
  console.log('Balance result:', balance);

  if (!balance) {
    console.log('No balance - returning error');
    return NextResponse.json({ error: 'Failed to get balance' }, { status: 500 });
  }

  return NextResponse.json({
    credits: {
      monthly: balance.monthlyCredits,
      topup: balance.topupCredits,
      total: balance.totalAvailable
    }
  });
}