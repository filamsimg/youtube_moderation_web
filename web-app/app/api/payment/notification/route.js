import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import crypto from 'crypto';
import { SECURE_PACKAGES } from '../checkout/route';

/**
 * POST /api/payment/notification
 * Webhook penerima notifikasi real-time dari Midtrans
 * 
 * Logika Kuota V2:
 * - Paket Langganan (PRO/ENTERPRISE): Menambah subscription_quota + set/perpanjang quota_expiry
 * - Paket Top-Up (FREE tier): Menambah topup_credits (permanen, tidak kedaluwarsa)
 */
export async function POST(req) {
  try {
    const body = await req.json();

    const {
      order_id,
      status_code,
      gross_amount,
      transaction_status,
      fraud_status,
      signature_key,
    } = body;

    // 1. Verifikasi Keaslian Signature Key dari Midtrans
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) {
      console.error('[Notification Webhook] MIDTRANS_SERVER_KEY tidak dikonfigurasi di berkas .env');
      return NextResponse.json({ error: 'Server Key configuration error' }, { status: 500 });
    }

    // SHA512(order_id + status_code + gross_amount + ServerKey)
    const payloadString = order_id + status_code + gross_amount + serverKey;
    const calculatedSignature = crypto
      .createHash('sha512')
      .update(payloadString)
      .digest('hex');

    // Bypass signature hanya diperbolehkan di mode SANDBOX untuk presentasi skripsi lokal (tanpa ngrok/tunnels)
    const isSandboxBypass = 
      process.env.MIDTRANS_IS_PRODUCTION !== 'true' && 
      signature_key === 'mock-local-bypass-signature';

    if (calculatedSignature !== signature_key && !isSandboxBypass) {
      console.warn('[Notification Webhook] PERCOBAAN ILEGAL: Signature Key tidak cocok!', {
        received: signature_key,
        calculated: calculatedSignature,
      });
      return NextResponse.json({ error: 'Invalid Signature Key' }, { status: 403 });
    }

    console.log(`[Notification Webhook] Signature valid. Memproses order: ${order_id}, status: ${transaction_status}`);

    // 2. Ambil detail transaksi dari database Supabase
    const { data: transaction, error: fetchTxError } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('id', order_id)
      .single();

    if (fetchTxError || !transaction) {
      console.error(`[Notification Webhook] Transaksi ${order_id} tidak ditemukan di database`);
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Jika transaksi sudah sukses diproses sebelumnya, langsung return sukses (cegah pemrosesan ganda)
    if (transaction.status === 'settlement') {
      console.log(`[Notification Webhook] Transaksi ${order_id} sudah selesai sebelumnya (Aman dari pemrosesan ganda)`);
      return NextResponse.json({ success: true, message: 'Already processed' });
    }

    // 3. Tentukan status transaksi baru sesuai spesifikasi Midtrans
    let newStatus = 'pending';
    let isSuccess = false;

    if (transaction_status === 'capture') {
      if (fraud_status === 'accept') {
        newStatus = 'settlement';
        isSuccess = true;
      }
    } else if (transaction_status === 'settlement') {
      newStatus = 'settlement';
      isSuccess = true;
    } else if (['cancel', 'deny', 'expire'].includes(transaction_status)) {
      newStatus = transaction_status;
    } else if (transaction_status === 'pending') {
      newStatus = 'pending';
    }

    // 4. Perbarui status transaksi di tabel transactions Supabase
    const { error: updateTxError } = await supabaseAdmin
      .from('transactions')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order_id);

    if (updateTxError) {
      console.error('[Notification Webhook] Gagal memperbarui status transaksi:', updateTxError);
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
    }

    // 5. Apabila status berubah menjadi Sukses (settlement), proses kuota user
    if (isSuccess) {
      const email = transaction.user_email;
      const packageId = transaction.package_id;
      const quotaToAdd = transaction.quota_units;
      const targetTier = transaction.target_tier;
      const durationDays = transaction.duration_days;

      // Validasi paket masih terdaftar di SECURE_PACKAGES (keamanan tambahan)
      const pkg = SECURE_PACKAGES[packageId];
      if (!pkg) {
        console.error(`[Notification Webhook] Package ID "${packageId}" tidak ditemukan di SECURE_PACKAGES`);
        return NextResponse.json({ error: 'Invalid package configuration' }, { status: 500 });
      }

      // Ambil profil pengguna saat ini
      const { data: profile, error: fetchProfileError } = await supabaseAdmin
        .from('user_profiles')
        .select('*')
        .eq('email', email)
        .single();

      if (fetchProfileError || !profile) {
        console.error('[Notification Webhook] Profil pengguna tidak ditemukan:', email);
        return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
      }

      // ── Tentukan jenis paket dan proses sesuai ──
      const isSubscription = durationDays > 0 && targetTier !== 'FREE';
      const isTopUp = durationDays === 0 && targetTier === 'FREE';

      if (isSubscription) {
        // ══════════════════════════════════════════════════════════
        // PAKET LANGGANAN (PRO / ENTERPRISE)
        // - Tambah subscription_quota
        // - Set/perpanjang masa aktif (quota_expiry) secara akumulatif
        // - Upgrade tier
        // ══════════════════════════════════════════════════════════
        const currentExpiry = profile.quota_expiry ? new Date(profile.quota_expiry) : null;
        const baseDate = (currentExpiry && currentExpiry > new Date()) ? currentExpiry : new Date();
        const newExpiry = new Date(baseDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

        const newLimit = targetTier === 'ENTERPRISE' ? 999999 : 50000;

        const { error: updateProfileError } = await supabaseAdmin
          .from('user_profiles')
          .update({
            tier: targetTier,
            subscription_quota: profile.subscription_quota + quotaToAdd,
            quota_limit: newLimit,
            quota_expiry: newExpiry.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('email', email);

        if (updateProfileError) {
          console.error('[Notification Webhook] Gagal memproses paket langganan:', updateProfileError);
          return NextResponse.json({ error: 'Failed to process subscription' }, { status: 500 });
        }

        console.log(`[Notification Webhook] LANGGANAN SUKSES: ${email} → ${targetTier}, +${quotaToAdd} sub_quota, expiry: ${newExpiry.toISOString()}`);

      } else if (isTopUp) {
        // ══════════════════════════════════════════════════════════
        // PAKET TOP-UP (Kredit Sekali Bayar)
        // - Tambah topup_credits (permanen, TIDAK kedaluwarsa)
        // - Tier dan masa aktif TIDAK berubah
        // ══════════════════════════════════════════════════════════
        const { error: updateProfileError } = await supabaseAdmin
          .from('user_profiles')
          .update({
            topup_credits: profile.topup_credits + quotaToAdd,
            updated_at: new Date().toISOString(),
          })
          .eq('email', email);

        if (updateProfileError) {
          console.error('[Notification Webhook] Gagal memproses top-up:', updateProfileError);
          return NextResponse.json({ error: 'Failed to process top-up' }, { status: 500 });
        }

        console.log(`[Notification Webhook] TOP-UP SUKSES: ${email} → +${quotaToAdd} topup_credits`);

      } else {
        console.warn(`[Notification Webhook] Jenis paket tidak dikenali: packageId=${packageId}, tier=${targetTier}, duration=${durationDays}`);
      }

      // Masukkan log penambahan kuota ke tabel logs
      await supabaseAdmin.from('quota_usage_logs').insert({
        user_email: email,
        action_name: isSubscription ? 'SUBSCRIPTION' : 'TOP_UP',
        units_spent: -quotaToAdd, // Negatif sebagai representasi penambahan kuota
        description: `${isSubscription ? 'Langganan' : 'Top-up'} kuota sukses via Midtrans (${order_id}) — Paket: ${pkg.name}`,
      });
    }

    return NextResponse.json({ success: true, status: newStatus });
  } catch (err) {
    console.error('[Notification Webhook] Crash Error:', err.message || err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
