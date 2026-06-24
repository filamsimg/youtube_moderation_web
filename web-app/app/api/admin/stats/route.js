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
    // 1. Total User & Tier Distribution
    const { data: users, error: usersError } = await supabaseAdmin
      .from('user_profiles')
      .select('tier, created_at');

    if (usersError) throw usersError;

    const totalUsers = users.length;
    const tierCounts = { FREE: 0, PRO: 0, ENTERPRISE: 0 };
    users.forEach((u) => {
      const t = u.tier?.toUpperCase();
      if (tierCounts[t] !== undefined) {
        tierCounts[t]++;
      } else {
        tierCounts['FREE']++;
      }
    });

    // 2. Total Moderated Comments
    const { count: totalComments, error: commentsError } = await supabaseAdmin
      .from('moderation_history')
      .select('*', { count: 'exact', head: true });

    if (commentsError) throw commentsError;

    // 3. Total Quota Units Consumed
    const { data: quotaLogs, error: quotaError } = await supabaseAdmin
      .from('quota_usage_logs')
      .select('units_spent');

    if (quotaError) throw quotaError;
    const totalQuotaUsed = quotaLogs.reduce((acc, log) => acc + (log.units_spent || 0), 0);

    // 3.1. Google API Quota Consumed Today (sejak jam 00:00 hari ini)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { data: todayQuotaLogs, error: todayQuotaErr } = await supabaseAdmin
      .from('quota_usage_logs')
      .select('units_spent')
      .gte('created_at', todayStart.toISOString());

    if (todayQuotaErr) throw todayQuotaErr;
    const todayQuotaUsed = todayQuotaLogs.reduce((acc, log) => acc + (log.units_spent || 0), 0);

    // 4. Total Income (settlement transactions)
    const { data: transactions, error: trxError } = await supabaseAdmin
      .from('transactions')
      .select('amount')
      .eq('status', 'settlement');

    if (trxError) throw trxError;
    const totalRevenue = transactions.reduce((acc, trx) => acc + (trx.amount || 0), 0);

    // 5. 5 Newest Registered Users
    const { data: newestUsers, error: newUsersError } = await supabaseAdmin
      .from('user_profiles')
      .select('email, tier, created_at, subscription_quota, trial_quota')
      .order('created_at', { ascending: false })
      .limit(5);

    if (newUsersError) throw newUsersError;

    // 6. Trend: Registration over last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Group users by date
    const registrationTrend = {};
    for (let i = 0; i < 30; i++) {
      const dateStr = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      registrationTrend[dateStr] = 0;
    }

    users.forEach((u) => {
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
        tierCounts,
        totalComments: totalComments || 0,
        totalQuotaUsed,
        todayQuotaUsed,
        totalRevenue,
      },
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
