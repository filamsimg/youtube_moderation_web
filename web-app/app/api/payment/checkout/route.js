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
  // Legacy / fallback aliases
  'PRO': {
    price: 49000,
    quotaUnits: 50000,
    tier: 'PRO',
    durationDays: 30,
    name: 'Upgrade ke Pro (1 Bulan)',
  },
  'ENTERPRISE': {
    price: 149000,
    quotaUnits: 999999,
    tier: 'ENTERPRISE',
    durationDays: 30,
    name: 'Upgrade ke Enterprise (1 Bulan)',
  },

  // --- BULANAN (1 Bulan = 30 Hari) ---
  'PRO_1M': {
    price: 49000,
    quotaUnits: 50000,
    tier: 'PRO',
    durationDays: 30,
    name: 'Pro (1 Bulan)',
  },
  'ENTERPRISE_1M': {
    price: 149000,
    quotaUnits: 999999,
    tier: 'ENTERPRISE',
    durationDays: 30,
    name: 'Enterprise (1 Bulan)',
  },
  
  // --- 3 BULAN (Diskon 5%, 90 Hari) ---
  'PRO_3M': {
    price: 139000, // Biasa 147k, hemat ~5%
    quotaUnits: 150000,
    tier: 'PRO',
    durationDays: 90,
    name: 'Pro (3 Bulan)',
  },
  'ENTERPRISE_3M': {
    price: 424000, // Biasa 447k, hemat ~5%
    quotaUnits: 999999,
    tier: 'ENTERPRISE',
    durationDays: 90,
    name: 'Enterprise (3 Bulan)',
  },

  // --- 6 BULAN (Diskon 10%, 180 Hari) ---
  'PRO_6M': {
    price: 264000, // Biasa 294k, hemat ~10%
    quotaUnits: 300000,
    tier: 'PRO',
    durationDays: 180,
    name: 'Pro (6 Bulan)',
  },
  'ENTERPRISE_6M': {
    price: 804000, // Biasa 894k, hemat ~10%
    quotaUnits: 999999,
    tier: 'ENTERPRISE',
    durationDays: 180,
    name: 'Enterprise (6 Bulan)',
  },

  // --- 1 TAHUN (Diskon 20%, 360 Hari) ---
  'PRO_12M': {
    price: 470000, // Biasa 588k, hemat ~20%
    quotaUnits: 600000,
    tier: 'PRO',
    durationDays: 360,
    name: 'Pro (1 Tahun)',
  },
  'ENTERPRISE_12M': {
    price: 1430000, // Biasa 1.788k, hemat ~20%
    quotaUnits: 999999,
    tier: 'ENTERPRISE',
    durationDays: 360,
    name: 'Enterprise (1 Tahun)',
  },

  // --- TOP-UP KREDIT (Sekali Bayar, Tidak Kedaluwarsa) ---
  'topup-starter': {
    price: 15000,
    quotaUnits: 5000,
    tier: 'FREE',
    durationDays: 0,
    name: 'Top-Up Starter (5.000 Kuota)',
  },
  'topup-standard': {
    price: 50000,
    quotaUnits: 20000,
    tier: 'FREE',
    durationDays: 0,
    name: 'Top-Up Standard (20.000 Kuota)',
  },
  'topup-power': {
    price: 120000,
    quotaUnits: 60000,
    tier: 'FREE',
    durationDays: 0,
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

    const { price, quotaUnits, tier: targetTier, durationDays, name: packageName } = pkg;

    // Buat Order ID unik dengan awalan ATHENA-
    const orderId = `ATHENA-TRX-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    // 1. Buat record transaksi di Supabase berstatus 'pending'
    const { error: dbError } = await supabaseAdmin
      .from('transactions')
      .insert({
        id: orderId,
        user_email: email,
        package_id: packageId,
        amount: price,
        quota_units: quotaUnits,
        target_tier: targetTier,
        duration_days: durationDays,
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
