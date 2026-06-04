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
    type: 'subscription',
  },
  'ENTERPRISE': {
    price: 149000,
    quotaUnits: 999999,
    tier: 'ENTERPRISE',
    durationDays: 30,
    name: 'Upgrade ke Enterprise (1 Bulan)',
    type: 'subscription',
  },

  // --- BULANAN (1 Bulan = 30 Hari) ---
  'PRO_1M': {
    price: 49000,
    quotaUnits: 50000,
    tier: 'PRO',
    durationDays: 30,
    name: 'Pro (1 Bulan)',
    type: 'subscription',
  },
  'ENTERPRISE_1M': {
    price: 149000,
    quotaUnits: 999999,
    tier: 'ENTERPRISE',
    durationDays: 30,
    name: 'Enterprise (1 Bulan)',
    type: 'subscription',
  },
  
  // --- 3 BULAN (Diskon 5%, 90 Hari) ---
  'PRO_3M': {
    price: 139000, // Biasa 147k, hemat ~5%
    quotaUnits: 150000,
    tier: 'PRO',
    durationDays: 90,
    name: 'Pro (3 Bulan)',
    type: 'subscription',
  },
  'ENTERPRISE_3M': {
    price: 424000, // Biasa 447k, hemat ~5%
    quotaUnits: 999999,
    tier: 'ENTERPRISE',
    durationDays: 90,
    name: 'Enterprise (3 Bulan)',
    type: 'subscription',
  },

  // --- 6 BULAN (Diskon 10%, 180 Hari) ---
  'PRO_6M': {
    price: 264000, // Biasa 294k, hemat ~10%
    quotaUnits: 300000,
    tier: 'PRO',
    durationDays: 180,
    name: 'Pro (6 Bulan)',
    type: 'subscription',
  },
  'ENTERPRISE_6M': {
    price: 804000, // Biasa 894k, hemat ~10%
    quotaUnits: 999999,
    tier: 'ENTERPRISE',
    durationDays: 180,
    name: 'Enterprise (6 Bulan)',
    type: 'subscription',
  },

  // --- 1 TAHUN (Diskon 20%, 360 Hari) ---
  'PRO_12M': {
    price: 470000, // Biasa 588k, hemat ~20%
    quotaUnits: 600000,
    tier: 'PRO',
    durationDays: 360,
    name: 'Pro (1 Tahun)',
    type: 'subscription',
  },
  'ENTERPRISE_12M': {
    price: 1430000, // Biasa 1.788k, hemat ~20%
    quotaUnits: 999999,
    tier: 'ENTERPRISE',
    durationDays: 360,
    name: 'Enterprise (1 Tahun)',
    type: 'subscription',
  },

  // --- TOP-UP KREDIT (Sekali Bayar, Tidak Kedaluwarsa) ---
  'topup-starter': {
    price: 15000,
    quotaUnits: 5000,
    tier: 'FREE',
    durationDays: 0,
    name: 'Top-Up Starter (5.000 Kuota)',
    type: 'topup',
  },
  'topup-standard': {
    price: 50000,
    quotaUnits: 20000,
    tier: 'FREE',
    durationDays: 0,
    name: 'Top-Up Standard (20.000 Kuota)',
    type: 'topup',
  },
  'topup-power': {
    price: 120000,
    quotaUnits: 60000,
    tier: 'FREE',
    durationDays: 0,
    name: 'Top-Up Power (60.000 Kuota)',
    type: 'topup',
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
 * 
 * Fitur V2:
 * - Cek transaksi pending yang sudah ada → resume dengan snap_token lama (cegah duplikat)
 * - Simpan transaction_type, snap_redirect_url secara eksplisit
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

    const { price, quotaUnits, tier: targetTier, durationDays, name: packageName, type: transactionType } = pkg;

    // ── V2: Cek transaksi pending duplikat ─────────────────────
    // Jika user sudah punya transaksi pending untuk paket yang sama dan masih < 24 jam,
    // kembalikan snap_token yang sudah ada (cegah tumpukan transaksi duplikat)
    const { data: existingPending } = await supabaseAdmin
      .from('transactions')
      .select('id, snap_token, snap_redirect_url, created_at')
      .eq('user_email', email)
      .eq('package_id', packageId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existingPending?.snap_token) {
      const createdAt = new Date(existingPending.created_at);
      const ageHours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);

      // Token masih valid jika < 24 jam (default expiry Midtrans)
      if (ageHours < 24) {
        console.log(`[Checkout] Resume transaksi pending: ${existingPending.id} (${ageHours.toFixed(1)}h lalu)`);
        return NextResponse.json({
          token: existingPending.snap_token,
          orderId: existingPending.id,
          redirectUrl: existingPending.snap_redirect_url,
          resumed: true,
        });
      } else {
        // Token sudah terlalu lama → mark sebagai expired dan buat baru
        await supabaseAdmin
          .from('transactions')
          .update({
            status: 'expired',
            expired_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingPending.id);
        console.log(`[Checkout] Auto-expired transaksi lama: ${existingPending.id}`);
      }
    }

    // Buat Order ID unik dengan awalan ATHENA-
    const orderId = `ATHENA-TRX-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    // 1. Buat record transaksi di Supabase berstatus 'pending'
    const { error: dbError } = await supabaseAdmin
      .from('transactions')
      .insert({
        id: orderId,
        user_email: email,
        package_id: packageId,
        transaction_type: transactionType,
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
    const redirectUrl = transaction.redirect_url || null;

    // 4. Update transaksi di database dengan token dan redirect URL
    await supabaseAdmin
      .from('transactions')
      .update({
        snap_token: snapToken,
        snap_redirect_url: redirectUrl,
      })
      .eq('id', orderId);

    return NextResponse.json({
      token: snapToken,
      orderId: orderId,
      redirectUrl: redirectUrl,
      resumed: false,
    });
  } catch (err) {
    console.error('[Checkout] Internal Server Error:', err.message || err);
    return NextResponse.json(
      { error: err.message || 'Gagal memproses inisialisasi pembayaran' },
      { status: 500 }
    );
  }
}
