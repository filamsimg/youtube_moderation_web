import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * GET /api/quota/profile
 * Mengambil profil kuota user dengan breakdown terpisah:
 * - subscription_quota: kuota langganan (hangus saat expire)
 * - topup_credits: kredit top-up (permanen)
 * - trial_quota: jatah trial awal (permanen)
 * - quota_balance: total computed (subscription + topup + trial)
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = session.user.email;

    // Auto-create profil jika user pertama kali login + auto-downgrade jika expired
    const { data: profile, error } = await supabaseAdmin.rpc('ensure_user_profile', {
      p_email: email,
    });

    if (error) {
      console.error('ensure_user_profile error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Compute total balance dari ketiga sumber kuota
    const totalBalance = profile.subscription_quota + profile.topup_credits + profile.trial_quota;
    const percentage = Math.round((totalBalance / (profile.quota_limit || 1000)) * 100);

    return NextResponse.json({
      email: profile.email,
      tier: profile.tier,

      // Breakdown kuota terpisah untuk transparansi UI
      subscription_quota: profile.subscription_quota,
      topup_credits: profile.topup_credits,
      trial_quota: profile.trial_quota,

      // Total balance (computed)
      quota_balance: totalBalance,
      quota_limit: profile.quota_limit,

      // Masa aktif langganan
      quota_expiry: profile.quota_expiry,
      last_reset: profile.last_reset,

      // Persentase terpakai
      percentage: Math.min(percentage, 100),
    });
  } catch (err) {
    console.error('GET /api/quota/profile error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
