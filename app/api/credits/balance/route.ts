import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getBalance } from '@/lib/credits';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const balance = await getBalance(userId);
    
    if (!balance) {
      return NextResponse.json({ error: 'Failed to get balance' }, { status: 500 });
    }

    return NextResponse.json({
      balance: balance.totalAvailable
    });
  } catch (error) {
    console.error('Credits balance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}