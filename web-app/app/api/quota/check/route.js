import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { QUOTA_COSTS } from '@/services/quotaService';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * GET /api/quota/check?action=FETCH_COMMENTS
 * Mengecek apakah user punya saldo cukup untuk suatu aksi.
 * Response: { canAfford: bool, balance: int, cost: int, action: string }
 * 
 * Balance dihitung dari: subscription_quota + topup_credits + trial_quota
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

    // Gunakan supabaseAdmin untuk konsistensi dan auto-downgrade check
    const { data: profile, error } = await supabaseAdmin.rpc('ensure_user_profile', {
      p_email: session.user.email,
    });

    if (error || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Compute total balance dari ketiga sumber kuota
    const totalBalance = profile.subscription_quota + profile.topup_credits + profile.trial_quota;

    return NextResponse.json({
      canAfford: totalBalance >= cost,
      balance: totalBalance,
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
