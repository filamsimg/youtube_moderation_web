import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Ambil semua paket yang aktif
    const { data: packages, error } = await supabaseAdmin
      .from('pricing_packages')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true });

    if (error) {
      throw error;
    }

    // Kelompokkan menjadi subscription plans
    const plans = packages.filter((pkg) => pkg.type === 'subscription');
    const topups = []; // Top-up telah dihapus secara menyeluruh

    return NextResponse.json({
      success: true,
      plans,
      topups,
    });
  } catch (error) {
    console.error('[Public Plans API] Error fetching plans:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
