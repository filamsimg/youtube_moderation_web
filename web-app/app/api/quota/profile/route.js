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

    if (error || !profile) {
      console.error('ensure_user_profile error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Ambil detail konfigurasi fitur dinamis untuk tier pengguna ini dari pricing_packages
    const { data: pkg } = await supabaseAdmin
      .from('pricing_packages')
      .select('disabled_features, allow_bulk_moderation, allow_export_csv, allow_auto_moderation')
      .eq('type', 'subscription')
      .eq('tier', profile.tier)
      .eq('is_active', true)
      .order('price', { ascending: false })
      .limit(1)
      .maybeSingle();

    const disabledFeatures = pkg?.disabled_features || [];
    const allowBulkModeration = pkg?.allow_bulk_moderation ?? false;
    const allowExportCSV = pkg?.allow_export_csv ?? false;
    const allowAutoModeration = pkg?.allow_auto_moderation ?? false;

    // Compute total balance dari kedua sumber kuota (Langganan & Trial)
    const totalBalance = profile.subscription_quota + profile.trial_quota;
    const percentage = Math.round((totalBalance / (profile.quota_limit || 1000)) * 100);

    return NextResponse.json({
      email: profile.email,
      tier: profile.tier,
      active_package_id: profile.active_package_id,

      // Role & status akun (dibutuhkan oleh halaman admin untuk cek hak akses secara real-time)
      role: profile.role,
      is_active: profile.is_active,

      // Breakdown kuota terpisah untuk transparansi UI
      subscription_quota: profile.subscription_quota,
      trial_quota: profile.trial_quota,

      // Total balance (computed)
      quota_balance: totalBalance,
      quota_limit: profile.quota_limit,

      // Masa aktif langganan
      quota_expiry: profile.quota_expiry,
      last_reset: profile.last_reset,

      // Persentase terpakai
      percentage: Math.min(percentage, 100),

      // Fitur pemasaran yang dinonaktifkan untuk tier ini (Estetika UI)
      disabled_features: disabledFeatures,

      // Feature Flags Konfigurasi Hak Akses Boolean Baku (Aplikasi)
      allow_bulk_moderation: allowBulkModeration,
      allow_export_csv: allowExportCSV,
      allow_auto_moderation: allowAutoModeration,
    });
  } catch (err) {
    console.error('GET /api/quota/profile error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
