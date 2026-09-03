import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  // Verifikasi wewenang admin (minimal role 'admin')
  const authCheck = await requireAdmin('admin');
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  try {
    const { order_id } = await req.json();
    if (!order_id) {
      return NextResponse.json({ error: 'Parameter order_id diperlukan' }, { status: 400 });
    }

    // 1. Ambil data transaksi lokal
    const { data: transaction, error: fetchError } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('id', order_id)
      .single();

    if (fetchError || !transaction) {
      return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 });
    }

    // 2. Proteksi Idempotensi: Jika transaksi di database lokal sudah Settlement (Lunas), tidak perlu update kuota lagi
    if (transaction.status === 'settlement') {
      return NextResponse.json({
        success: true,
        message: 'Transaksi ini sudah berstatus Settlement (Lunas). Data langganan sudah aktif.',
        status: 'settlement',
      });
    }

    // 3. Hubungi API Midtrans
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
    const baseUrl = isProduction
      ? 'https://api.midtrans.com'
      : 'https://api.sandbox.midtrans.com';

    const midtransRes = await fetch(`${baseUrl}/v2/${order_id}/status`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Basic ${Buffer.from(`${serverKey}:`).toString('base64')}`,
      },
    });

    const midtransData = await midtransRes.json();

    if (midtransRes.status === 404) {
      return NextResponse.json({
        success: true,
        message: 'Order ID belum tercatat di server Midtrans Sandbox',
        status: transaction.status,
      });
    }

    const trxStatus = midtransData.transaction_status;
    let newStatus = transaction.status;

    if (trxStatus === 'capture') {
      newStatus = midtransData.fraud_status === 'challenge' ? 'challenge' : 'settlement';
    } else if (trxStatus === 'settlement') {
      newStatus = 'settlement';
    } else if (trxStatus === 'pending') {
      newStatus = 'pending';
    } else if (trxStatus === 'deny') {
      newStatus = 'deny';
    } else if (trxStatus === 'expire') {
      newStatus = 'expired';
    } else if (trxStatus === 'cancel') {
      newStatus = 'cancelled';
    }

    const updates = {
      status: newStatus,
      raw_response: midtransData,
      midtrans_payment_type: midtransData.payment_type || transaction.midtrans_payment_type,
    };

    if (newStatus === 'settlement' && !transaction.paid_at) {
      updates.paid_at = midtransData.settlement_time || new Date().toISOString();
    }

    // Update transaksi di database
    await supabaseAdmin
      .from('transactions')
      .update(updates)
      .eq('id', order_id);

    // Hanya jika transaksi berubah status dari NON-settlement menjadi Settlement, update kuota & tier user
    if (newStatus === 'settlement' && transaction.status !== 'settlement') {
      const quota = transaction.target_tier === 'ENTERPRISE' ? 10000 : 2500;
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 30);

      await supabaseAdmin
        .from('user_profiles')
        .update({
          tier: transaction.target_tier,
          subscription_quota: quota,
          quota_expiry: expiry.toISOString(),
        })
        .eq('email', transaction.user_email);
    }

    return NextResponse.json({
      success: true,
      message: `Status transaksi berhasil diverifikasi: ${newStatus.toUpperCase()}`,
      status: newStatus,
      midtransData,
    });
  } catch (error) {
    console.error('API Admin Transaction Sync error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
