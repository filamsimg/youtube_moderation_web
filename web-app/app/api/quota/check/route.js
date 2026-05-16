import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { quotaService, QUOTA_COSTS } from '@/services/quotaService';

/**
 * GET /api/quota/check?action=FETCH_COMMENTS
 * Mengecek apakah user punya saldo cukup untuk suatu aksi.
 * Response: { canAfford: bool, balance: int, cost: int, action: string }
 */
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') || 'FETCH_COMMENTS';
    const cost = QUOTA_COSTS[action] ?? 0;

    const profile = await quotaService.getProfile(session.user.email);
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({
      canAfford: profile.quota_balance >= cost,
      balance: profile.quota_balance,
      limit: profile.quota_limit,
      tier: profile.tier,
      cost,
      action,
    });
  } catch (err) {
    console.error('GET /api/quota/check error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
