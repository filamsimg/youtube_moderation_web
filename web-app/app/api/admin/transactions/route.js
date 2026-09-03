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
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');
    const searchFilter = searchParams.get('search');

    // Query semua transaksi dari database
    let query = supabaseAdmin
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (statusFilter && statusFilter !== 'all') {
      if (statusFilter === 'cancel') {
        query = query.in('status', ['cancel', 'cancelled']);
      } else {
        query = query.eq('status', statusFilter);
      }
    }

    const { data: transactions, error } = await query;

    if (error) {
      console.error('Fetch admin transactions error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let filtered = transactions || [];

    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          (t.id && t.id.toLowerCase().includes(q)) ||
          (t.user_email && t.user_email.toLowerCase().includes(q)) ||
          (t.target_tier && t.target_tier.toLowerCase().includes(q)) ||
          ((t.payment_type || t.midtrans_payment_type) && (t.payment_type || t.midtrans_payment_type).toLowerCase().includes(q))
      );
    }

    // Kalkulasi Rekapitulasi Metrik Transaksi
    let totalRevenue = 0;
    let settlementCount = 0;
    let pendingCount = 0;
    let expiredCount = 0;
    let cancelledCount = 0;

    (transactions || []).forEach((t) => {
      const amt = Number(t.amount) || 0;
      if (t.status === 'settlement') {
        totalRevenue += amt;
        settlementCount++;
      } else if (t.status === 'pending') {
        pendingCount++;
      } else if (t.status === 'expired') {
        expiredCount++;
      } else if (t.status === 'cancel' || t.status === 'cancelled') {
        cancelledCount++;
      }
    });

    return NextResponse.json({
      success: true,
      transactions: filtered,
      stats: {
        totalTransactions: transactions.length,
        totalRevenue,
        settlementCount,
        pendingCount,
        expiredCount,
        cancelledCount,
      },
    });
  } catch (error) {
    console.error('API Admin Transactions error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
