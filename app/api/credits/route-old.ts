// app/api/credits/route.ts
// Credit balance API

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { getBalance } from '@/lib/credits';

export async function GET() {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const balance = await getBalance(userId);

  if (!balance) {
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
