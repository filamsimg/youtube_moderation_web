import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * GET /api/payment/status?order_id=ATHENA-TRX-XXX
 * Endpoint untuk memeriksa status terkini transaksi secara realtime.
 * 
 * Alur:
 * 1. Ambil status dari database Supabase lokal
 * 2. Jika masih 'pending', sinkronisasi dengan Midtrans Status API
 * 3. Update database jika ada perubahan status
 * 4. Kembalikan status terbaru + snap_token (untuk resume payment)
 */
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = session.user.email;
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('order_id');

    if (!orderId) {
      return NextResponse.json({ error: 'Parameter order_id diperlukan' }, { status: 400 });
    }

    // 1. Ambil transaksi dari database
    const { data: transaction, error: fetchError } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError || !transaction) {
      return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 });
    }

    // Validasi kepemilikan
    if (transaction.user_email !== email) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    // 2. Jika masih pending, cek status terkini di Midtrans
    if (transaction.status === 'pending') {
      try {
        const serverKey = process.env.MIDTRANS_SERVER_KEY;
        const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
        const baseUrl = isProduction
          ? 'https://api.midtrans.com'
          : 'https://api.sandbox.midtrans.com';

        const midtransResponse = await fetch(`${baseUrl}/v2/${orderId}/status`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Basic ${Buffer.from(serverKey + ':').toString('base64')}`,
          },
        });

        if (midtransResponse.ok) {
          const midtransData = await midtransResponse.json();
          const midtransStatus = midtransData.transaction_status;
          const now = new Date().toISOString();

          // Mapping status Midtrans → status DB V2
          const statusMap = {
            'settlement': { status: 'settlement', paid_at: now },
            'capture': midtransData.fraud_status === 'accept'
              ? { status: 'settlement', paid_at: now }
              : null,
            'expire': { status: 'expired', expired_at: now },
            'cancel': { status: 'cancelled', cancelled_at: now },
            'deny': { status: 'failed' },
            'failure': { status: 'failed' },
          };

          const mappedUpdate = statusMap[midtransStatus];

          if (mappedUpdate && mappedUpdate.status !== 'pending') {
            // Status berubah di Midtrans → sinkronisasi ke DB
            const updatePayload = {
              ...mappedUpdate,
              updated_at: now,
            };

            if (midtransData.payment_type) {
              updatePayload.midtrans_payment_type = midtransData.payment_type;
            }

            await supabaseAdmin
              .from('transactions')
              .update(updatePayload)
              .eq('id', orderId);

            console.log(`[Status API] Sinkronisasi status ${orderId}: pending → ${mappedUpdate.status}`);

            // Return data yang sudah diupdate
            return NextResponse.json({
              ...transaction,
              ...updatePayload,
            });
          }
        }
      } catch (midtransErr) {
        // Jika Midtrans API gagal, tetap return data lokal
        console.warn(`[Status API] Gagal cek status Midtrans untuk ${orderId}:`, midtransErr.message);
      }
    }

    // 3. Return data transaksi dari database (status terkini)
    return NextResponse.json(transaction);

  } catch (err) {
    console.error('[Status API] Crash Error:', err.message || err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
