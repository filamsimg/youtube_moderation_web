import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/payment/history
 * Mengambil riwayat transaksi pembayaran pengguna secara aman dari server-side.
 * Menghindari kendala Row Level Security (RLS) di sisi client karena login menggunakan NextAuth (bukan Supabase Auth).
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = session.user.email;

    // Mengambil transaksi hanya milik email pengguna yang aktif
    const { data: transactions, error } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('user_email', email)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Payment History API] Gagal mengambil data transaksi:', error);
      return NextResponse.json({ error: 'Database Error' }, { status: 500 });
    }

    return NextResponse.json(transactions || []);
  } catch (err) {
    console.error('[Payment History API] Crash Error:', err.message || err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
