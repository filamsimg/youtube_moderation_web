import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * POST /api/payment/cancel
 * Endpoint pembatalan transaksi pending oleh user.
 * 
 * Alur:
 * 1. Validasi kepemilikan transaksi (session email = transaction user_email)
 * 2. Validasi status = 'pending' (hanya pending yang bisa dibatalkan)
 * 3. Panggil Midtrans Cancel API (jika bukan sandbox bypass)
 * 4. Update status di DB → 'cancelled' + set cancelled_at
 */
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = session.user.email;
    const body = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID diperlukan' }, { status: 400 });
    }

    // 1. Ambil transaksi dari database
    const { data: transaction, error: fetchError } = await supabaseAdmin
      .from('transactions')
      .select('id, user_email, status, snap_token')
      .eq('id', orderId)
      .single();

    if (fetchError || !transaction) {
      return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 });
    }

    // 2. Validasi kepemilikan
    if (transaction.user_email !== email) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    // 3. Validasi status (hanya pending yang bisa dibatalkan)
    if (transaction.status !== 'pending') {
      return NextResponse.json({ 
        error: `Transaksi berstatus "${transaction.status}" tidak dapat dibatalkan. Hanya transaksi pending yang bisa dibatalkan.` 
      }, { status: 400 });
    }

    // 4. Panggil Midtrans Cancel API
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
    const baseUrl = isProduction
      ? 'https://api.midtrans.com'
      : 'https://api.sandbox.midtrans.com';

    try {
      const midtransResponse = await fetch(`${baseUrl}/v2/${orderId}/cancel`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(serverKey + ':').toString('base64')}`,
        },
      });

      const midtransResult = await midtransResponse.json();
      console.log(`[Cancel API] Midtrans response for ${orderId}:`, midtransResult);

      // Midtrans bisa return error jika transaksi sudah expired di sisi mereka,
      // tapi kita tetap update status di DB kita ke 'cancelled'
      if (!midtransResponse.ok && midtransResult.status_code !== '412') {
        // 412 = transaksi sudah berubah status (sudah expired/cancelled di Midtrans)
        // Ini masih aman untuk di-mark cancelled di DB kita
        console.warn(`[Cancel API] Midtrans cancel gagal (non-412):`, midtransResult);
      }
    } catch (midtransErr) {
      // Jika Midtrans API tidak bisa dijangkau (misalnya offline / sandbox down),
      // kita tetap batalkan di DB lokal kita
      console.warn(`[Cancel API] Gagal menghubungi Midtrans API (lanjutkan cancel lokal):`, midtransErr.message);
    }

    // 5. Update status di database
    const now = new Date().toISOString();
    const { error: updateError } = await supabaseAdmin
      .from('transactions')
      .update({
        status: 'cancelled',
        cancelled_at: now,
        updated_at: now,
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('[Cancel API] Gagal memperbarui status transaksi:', updateError);
      return NextResponse.json({ error: 'Gagal membatalkan transaksi' }, { status: 500 });
    }

    console.log(`[Cancel API] Transaksi ${orderId} berhasil dibatalkan oleh ${email}`);
    return NextResponse.json({ success: true, orderId, status: 'cancelled' });

  } catch (err) {
    console.error('[Cancel API] Crash Error:', err.message || err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
