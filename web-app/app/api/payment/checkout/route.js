import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import midtransClient from 'midtrans-client';

// =========================================================================
// SECURITY BEST PRACTICE: KAMUS PAKET RESMI SISI SERVER (Server-Side Source of Truth)
// Mencegah manipulasi harga atau jumlah kuota oleh pengguna jahat (Frontend Tampering)
// =========================================================================
export const SECURE_PACKAGES = {
  // Paket Upgrade Tier Langganan Bulanan
  'PRO': {
    price: 49000,
    quotaUnits: 50000,
    tier: 'PRO',
    name: 'Upgrade ke Pro (50.000 Kuota)',
  },
  'ENTERPRISE': {
    price: 149000,
    quotaUnits: 999999,
    tier: 'ENTERPRISE',
    name: 'Upgrade ke Enterprise (Kuota Maksimal)',
  },
  // Paket Top-Up Kredit Sekali Bayar
  'topup-starter': {
    price: 15000,
    quotaUnits: 5000,
    tier: 'FREE',
    name: 'Top-Up Starter (5.000 Kuota)',
  },
  'topup-standard': {
    price: 50000,
    quotaUnits: 20000,
    tier: 'FREE',
    name: 'Top-Up Standard (20.000 Kuota)',
  },
  'topup-power': {
    price: 120000,
    quotaUnits: 60000,
    tier: 'FREE',
    name: 'Top-Up Power (60.000 Kuota)',
  }
};

// Helper inisialisasi Midtrans Snap Client
const getSnapClient = () => {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const clientKey = process.env.MIDTRANS_CLIENT_KEY;

  if (!serverKey || !clientKey) {
    throw new Error('Kunci akses Midtrans (Server/Client Key) belum dikonfigurasi di file .env');
  }

  return new midtransClient.Snap({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
    serverKey: serverKey,
    clientKey: clientKey,
  });
};

/**
 * POST /api/payment/checkout
 * Endpoint inisialisasi pembayaran di Midtrans Sandbox (Server-Secure)
 */
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = session.user.email;
    const body = await req.json();
    const { packageId } = body;

    // VALIDASI KEAMANAN: Cari paket berdasarkan ID di server-side dictionary
    const pkg = SECURE_PACKAGES[packageId];
    if (!pkg) {
      return NextResponse.json({ error: 'ID Paket tidak valid atau tidak terdaftar' }, { status: 400 });
    }

    const { price, quotaUnits, tier: targetTier, name: packageName } = pkg;

    // Buat Order ID unik dengan awalan ATHENA-
    const orderId = `ATHENA-TRX-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    // 1. Buat record transaksi di Supabase berstatus 'pending'
    const { error: dbError } = await supabaseAdmin
      .from('transactions')
      .insert({
        id: orderId,
        user_email: email,
        amount: price,
        quota_units: quotaUnits,
        target_tier: targetTier,
        status: 'pending',
      });

    if (dbError) {
      console.error('[Checkout] Gagal mencatat transaksi di Supabase:', dbError);
      return NextResponse.json({ error: 'Database Error' }, { status: 500 });
    }

    // 2. Siapkan parameter pesanan untuk Midtrans Snap
    const snap = getSnapClient();
    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: price,
      },
      customer_details: {
        first_name: session.user.name || 'User',
        email: email,
      },
      item_details: [
        {
          id: packageId,
          price: price,
          quantity: 1,
          name: packageName,
        },
      ],
      callbacks: {
        finish: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/pricing?status=finish&order_id=${orderId}`,
        unfinish: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/pricing?status=unfinish&order_id=${orderId}`,
        error: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/pricing?status=error&order_id=${orderId}`,
      },
    };

    // 3. Buat transaksi Snap di Midtrans untuk mendapatkan Snap Token
    const transaction = await snap.createTransaction(parameter);
    const snapToken = transaction.token;

    // 4. Update transaksi di database dengan token yang valid
    await supabaseAdmin
      .from('transactions')
      .update({ snap_token: snapToken })
      .eq('id', orderId);

    return NextResponse.json({
      token: snapToken,
      orderId: orderId,
    });
  } catch (err) {
    console.error('[Checkout] Internal Server Error:', err.message || err);
    return NextResponse.json(
      { error: err.message || 'Gagal memproses inisialisasi pembayaran' },
      { status: 500 }
    );
  }
}
