import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  // Verifikasi wewenang admin (minimal role 'admin')
  const authCheck = await requireAdmin('admin');
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const search = searchParams.get('search') || '';

  try {
    let query = supabaseAdmin
      .from('admin_audit_logs')
      .select('*', { count: 'exact' });

    if (search) {
      query = query.or(`admin_email.ilike.%${search}%,target_email.ilike.%${search}%`);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: logs, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    // Ambil rekapitulasi cepat jenis aksi audit
    const { data: allLogsMeta } = await supabaseAdmin
      .from('admin_audit_logs')
      .select('action, admin_email');

    let mutationCount = 0;
    let suspendCount = 0;
    const uniqueAdmins = new Set();

    (allLogsMeta || []).forEach(log => {
      const act = (log.action || '').toLowerCase();
      if (act.includes('tier') || act.includes('role') || act.includes('quota') || act.includes('update')) {
        mutationCount++;
      }
      if (act.includes('suspend') || act.includes('block') || act.includes('deactivate')) {
        suspendCount++;
      }
      if (log.admin_email) {
        uniqueAdmins.add(log.admin_email);
      }
    });

    return NextResponse.json({
      success: true,
      logs,
      stats: {
        totalLogs: (allLogsMeta || []).length,
        mutationCount,
        suspendCount,
        adminCount: uniqueAdmins.size,
      },
      pagination: {
        page,
        limit,
        totalItems: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Fetch audit logs error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
