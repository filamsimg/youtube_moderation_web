import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/user/settings
 * Mengambil konfigurasi preferensi moderasi pengguna terautentikasi
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = session.user.email;

    const { data, error } = await supabaseAdmin
      .from('user_settings')
      .select('*')
      .eq('user_email', email)
      .maybeSingle();

    if (error) {
      console.error('GET /api/user/settings DB error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      settings: data || null,
    });
  } catch (err) {
    console.error('GET /api/user/settings error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST /api/user/settings
 * Menyimpan konfigurasi preferensi moderasi pengguna
 */
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = session.user.email;
    const body = await req.json().catch(() => ({}));

    const { data, error } = await supabaseAdmin
      .from('user_settings')
      .upsert({
        user_email: email,
        auto_hapus: Boolean(body.autoHapus),
        auto_tahan: body.autoTahan ?? true,
        threshold_reject: Number(body.thresholdReject) || 90,
        threshold_hold: Number(body.thresholdHold) || 70,
        polling_interval: Number(body.pollingInterval) || 120,
        batch_moderation: body.batchModeration ?? true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_email' })
      .select()
      .maybeSingle();

    if (error) {
      console.error('POST /api/user/settings DB error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      settings: data,
    });
  } catch (err) {
    console.error('POST /api/user/settings error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
