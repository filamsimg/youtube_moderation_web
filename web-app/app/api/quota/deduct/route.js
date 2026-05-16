import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { QUOTA_COSTS } from '@/services/quotaService';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * POST /api/quota/deduct
 * Body: { action: string, description?: string }
 *
 * Memotong saldo kuota user setelah aksi YouTube berhasil.
 * Menggunakan supabaseAdmin (Service Role) untuk bypass RLS secara aman dari server.
 */
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, description } = await req.json();
    if (!action || QUOTA_COSTS[action] === undefined) {
      return NextResponse.json({ error: `Action '${action}' tidak dikenal.` }, { status: 400 });
    }

    const email = session.user.email;
    const cost = QUOTA_COSTS[action];

    // Panggil fungsi SQL atomic deduct_quota via supabaseAdmin
    const { data, error } = await supabaseAdmin.rpc('deduct_quota', {
      p_email: email,
      p_units: cost,
      p_action: action,
      p_description: description || null,
    });

    if (error) {
      console.error('deduct_quota RPC error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // data adalah return value dari fungsi SQL (JSON)
    if (!data.success) {
      const status = data.reason === 'insufficient_quota' ? 402 : data.reason === 'user_not_found' ? 404 : 500;
      return NextResponse.json(data, { status });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('POST /api/quota/deduct error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
