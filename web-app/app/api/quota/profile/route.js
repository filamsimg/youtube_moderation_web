import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * GET /api/quota/profile
 * Mengambil profil kuota user (saldo, tier, limit) - buat profil jika belum ada.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = session.user.email;

    // Auto-create profil jika user pertama kali login
    const { data: profile, error } = await supabaseAdmin.rpc('ensure_user_profile', {
      p_email: email,
    });

    if (error) {
      console.error('ensure_user_profile error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    const percentage = Math.round((profile.quota_balance / (profile.quota_limit || 1000)) * 100);

    return NextResponse.json({
      email: profile.email,
      tier: profile.tier,
      quota_balance: profile.quota_balance,
      quota_limit: profile.quota_limit,
      last_reset: profile.last_reset,
      percentage: Math.min(percentage, 100),
    });
  } catch (err) {
    console.error('GET /api/quota/profile error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
