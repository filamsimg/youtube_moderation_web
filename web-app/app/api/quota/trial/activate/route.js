import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * POST /api/quota/trial/activate
 * Mengaktifkan trial premium 30 hari untuk pengguna FREE.
 * Menggunakan quota_expiry sebagai penanda tanggal berakhir trial.
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = session.user.email;

    // Ambil data profil untuk validasi tier dan status trial sebelumnya
    const { data: profile, error: fetchError } = await supabaseAdmin
      .from('user_profiles')
      .select('tier, quota_expiry')
      .eq('email', email)
      .single();

    if (fetchError || !profile) {
      return NextResponse.json({ error: 'Profil pengguna tidak ditemukan.' }, { status: 404 });
    }

    if (profile.tier !== 'FREE') {
      return NextResponse.json({ error: 'Hanya pengguna tier GRATIS (FREE) yang dapat mengaktifkan trial.' }, { status: 400 });
    }

    if (profile.quota_expiry !== null) {
      return NextResponse.json({ error: 'Anda sudah pernah mengaktifkan trial sebelumnya.' }, { status: 400 });
    }

    // Set tanggal berakhir trial 30 hari dari sekarang
    const trialExpiry = new Date();
    trialExpiry.setDate(trialExpiry.getDate() + 30);

    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .update({
        quota_expiry: trialExpiry.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('email', email)
      .select('email, tier, quota_expiry')
      .single();

    if (updateError || !updatedProfile) {
      console.error('Trial activation update error:', updateError);
      return NextResponse.json({ error: 'Gagal memperbarui masa aktif trial di database.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Trial premium 30 hari berhasil diaktifkan.',
      quota_expiry: updatedProfile.quota_expiry
    });
  } catch (err) {
    console.error('POST /api/quota/trial/activate error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
