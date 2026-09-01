import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  // Verifikasi wewenang admin (minimal role 'admin')
  const authCheck = await requireAdmin('admin');
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  try {
    const now = new Date();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // ══════════════════════════════════════════════════════════════════
    // PARALLEL QUERY EXECUTION (PROMISE.ALL)
    // Mengeksekusi seluruh 4 query Supabase secara simultan (pangkas waktu 4x)
    // ══════════════════════════════════════════════════════════════════
    const [
      { data: users, error: usersError },
      { data: transactions, error: trxError },
      { count: totalComments, error: commentsError },
      { data: quotaLogs, error: quotaError }
    ] = await Promise.all([
      // 1. Data User Profiles
      supabaseAdmin
        .from('user_profiles')
        .select('email, tier, role, is_active, quota_expiry, subscription_quota, trial_quota, created_at'),

      // 2. Data Riwayat Transaksi Midtrans
      supabaseAdmin
        .from('transactions')
        .select('id, user_email, package_id, target_tier, amount, status, created_at, paid_at')
        .order('created_at', { ascending: false }),

      // 3. Total Komentar Dimoderasi (Exact Count)
      supabaseAdmin
        .from('moderation_history')
        .select('*', { count: 'exact', head: true }),

      // 4. Log Kuota Server
      supabaseAdmin
        .from('quota_usage_logs')
        .select('units_spent, created_at')
    ]);

    if (usersError) throw usersError;
    if (trxError) throw trxError;
    if (commentsError) throw commentsError;
    if (quotaError) throw quotaError;

    // ── 1. Proses Data Pengguna ──
    const userList = users || [];
    const totalUsers = userList.length;
    let activeUsers = 0;
    let suspendedUsers = 0;
    const tierCounts = { FREE: 0, PRO: 0, ENTERPRISE: 0 };
    let activePaidSubscribers = 0;
    let expiredPaidSubscribers = 0;

    userList.forEach((u) => {
      if (u.is_active === false) {
        suspendedUsers++;
      } else {
        activeUsers++;
      }

      const t = (u.tier || 'FREE').toUpperCase();
      if (tierCounts[t] !== undefined) {
        tierCounts[t]++;
      } else {
        tierCounts['FREE']++;
      }

      const expiry = u.quota_expiry ? new Date(u.quota_expiry) : null;
      const isSubActive = expiry && expiry > now;

      if (t === 'PRO' || t === 'ENTERPRISE') {
        if (isSubActive) {
          activePaidSubscribers++;
        } else {
          expiredPaidSubscribers++;
        }
      }
    });

    // ── 2. Proses Data Transaksi Finansial ──
    const trxList = transactions || [];
    let totalSettledRevenue = 0;
    let activeRevenue = 0;
    const revenueByTier = { PRO: 0, ENTERPRISE: 0 };
    const trxStatusCounts = { settlement: 0, pending: 0, expired: 0, cancelled: 0, failed: 0 };

    const activeEmailsSet = new Set(
      userList
        .filter((u) => u.quota_expiry && new Date(u.quota_expiry) > now && (u.tier === 'PRO' || u.tier === 'ENTERPRISE'))
        .map((u) => u.email)
    );

    trxList.forEach((trx) => {
      const st = trx.status || 'pending';
      if (trxStatusCounts[st] !== undefined) {
        trxStatusCounts[st]++;
      } else if (st === 'cancel') {
        trxStatusCounts.cancelled++;
      }

      if (st === 'settlement') {
        const amt = trx.amount || 0;
        totalSettledRevenue += amt;

        const tier = (trx.target_tier || 'PRO').toUpperCase();
        if (revenueByTier[tier] !== undefined) {
          revenueByTier[tier] += amt;
        }

        if (activeEmailsSet.has(trx.user_email)) {
          activeRevenue += amt;
        }
      }
    });

    // ── 3. Proses Log Kuota Server ──
    let totalQuotaUsed = 0;
    let todayQuotaUsed = 0;

    (quotaLogs || []).forEach((log) => {
      const units = log.units_spent || 0;
      if (units > 0) {
        totalQuotaUsed += units;
        if (new Date(log.created_at) >= todayStart) {
          todayQuotaUsed += units;
        }
      }
    });

    // ── 4. Kreator Baru Bergabung & Tren ──
    const newestUsers = [...userList]
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .slice(0, 5);

    const registrationTrend = {};
    for (let i = 0; i < 30; i++) {
      const dateStr = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      registrationTrend[dateStr] = 0;
    }

    userList.forEach((u) => {
      const dateStr = u.created_at ? new Date(u.created_at).toISOString().split('T')[0] : null;
      if (dateStr && registrationTrend[dateStr] !== undefined) {
        registrationTrend[dateStr]++;
      }
    });

    const trendArray = Object.keys(registrationTrend)
      .map((date) => ({ date, count: registrationTrend[date] }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        suspendedUsers,
        tierCounts,
        activePaidSubscribers,
        expiredPaidSubscribers,
        totalComments: totalComments || 0,
        totalQuotaUsed,
        todayQuotaUsed,
        totalRevenue: totalSettledRevenue,
        activeRevenue,
        expiredRevenue: totalSettledRevenue - activeRevenue,
        revenueByTier,
        trxStatusCounts,
      },
      allUsers: userList,
      recentTransactions: trxList.slice(0, 10),
      newestUsers,
      registrationTrend: trendArray,
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
