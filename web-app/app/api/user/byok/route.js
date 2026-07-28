import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

/**
 * Masking API Key untuk keamanan UI (misal: AIzaSyD...8x9a)
 */
function maskApiKey(key) {
  if (!key || key.length < 10) return '••••••••';
  return `${key.substring(0, 7)}...${key.substring(key.length - 4)}`;
}

/**
 * GET /api/user/byok
 * Memeriksa status BYOK pengguna terautentikasi
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = session.user.email;

    const { data: profile, error } = await supabaseAdmin
      .from('user_profiles')
      .select('tier, youtube_api_key')
      .eq('email', email)
      .maybeSingle();

    if (error || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    const isEnterprise = profile.tier === 'ENTERPRISE';
    const hasKey = Boolean(profile.youtube_api_key);
    const maskedKey = profile.youtube_api_key ? maskApiKey(profile.youtube_api_key) : null;

    return NextResponse.json({
      success: true,
      isEnterprise,
      hasKey,
      maskedKey,
    });
  } catch (err) {
    console.error('GET /api/user/byok error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST /api/user/byok
 * Menyimpan & memverifikasi Google YouTube API Key milik pengguna
 * Request body: { apiKey: "AIzaSy..." }
 */
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = session.user.email;
    const body = await req.json().catch(() => ({}));
    const apiKey = body?.apiKey?.trim();

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Google YouTube API Key tidak boleh kosong.' },
        { status: 400 }
      );
    }

    if (!apiKey.startsWith('AIzaSy')) {
      return NextResponse.json(
        { success: false, error: 'Format API Key tidak valid. Kunci Google API biasanya diawali dengan "AIzaSy".' },
        { status: 400 }
      );
    }

    // Check user tier
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('user_profiles')
      .select('tier')
      .eq('email', email)
      .maybeSingle();

    if (profileErr || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    if (profile.tier !== 'ENTERPRISE') {
      return NextResponse.json(
        {
          success: false,
          error: 'Fitur Kunci Akses Mandiri (BYOK) khusus untuk Pengguna Paket Enterprise. Silakan Tingkatkan Paket Anda.',
        },
        { status: 403 }
      );
    }

    // Uji validitas kunci langsung ke server Google YouTube API
    const testUrl = `https://www.googleapis.com/youtube/v3/videoCategories?part=id&id=1&key=${apiKey}`;
    const testRes = await fetch(testUrl, { method: 'GET' });

    if (!testRes.ok) {
      const errData = await testRes.json().catch(() => ({}));
      const googleErrMsg = errData?.error?.message || 'Google API Key tidak aktif atau kuota habis.';
      return NextResponse.json(
        {
          success: false,
          error: `Verifikasi Gagal ke Server Google: ${googleErrMsg}. Pastikan YouTube Data API v3 sudah diaktifkan di GCP Anda.`,
        },
        { status: 400 }
      );
    }

    // Kunci valid -> Simpan ke DB
    const { error: updateErr } = await supabaseAdmin
      .from('user_profiles')
      .update({
        youtube_api_key: apiKey,
        updated_at: new Date().toISOString(),
      })
      .eq('email', email);

    if (updateErr) {
      console.error('Update BYOK key error:', updateErr);
      return NextResponse.json({ error: 'Gagal menyimpan API Key ke database.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Google YouTube API Key berhasil diverifikasi dan diaktifkan!',
      maskedKey: maskApiKey(apiKey),
    });
  } catch (err) {
    console.error('POST /api/user/byok error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * DELETE /api/user/byok
 * Menghapus API Key pribadi pengguna (kembali ke kuota server)
 */
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = session.user.email;

    const { error } = await supabaseAdmin
      .from('user_profiles')
      .update({
        youtube_api_key: null,
        updated_at: new Date().toISOString(),
      })
      .eq('email', email);

    if (error) {
      console.error('DELETE BYOK key error:', error);
      return NextResponse.json({ error: 'Gagal menghapus API Key.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'API Key pribadi berhasil dihapus. Akun Anda kembali menggunakan kuota server.',
    });
  } catch (err) {
    console.error('DELETE /api/user/byok error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
