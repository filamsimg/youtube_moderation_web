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
  const tier = searchParams.get('tier') || '';
  const role = searchParams.get('role') || '';
  const status = searchParams.get('status') || ''; // 'active' | 'suspended'

  try {
    let query = supabaseAdmin
      .from('user_profiles')
      .select('*', { count: 'exact' });

    // Terapkan filter jika ada
    if (search) {
      query = query.ilike('email', `%${search}%`);
    }
    if (tier) {
      query = query.eq('tier', tier.toUpperCase());
    }
    if (role) {
      query = query.eq('role', role.toLowerCase());
    }
    if (status) {
      const isActive = status === 'active';
      query = query.eq('is_active', isActive);
    }

    // Paginasi & sorting
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: users, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    const formattedUsers = (users || []).map(u => ({
      ...u,
      has_byok: Boolean(u.youtube_api_key),
      youtube_api_key: undefined,
    }));

    return NextResponse.json({
      success: true,
      users: formattedUsers,
      pagination: {
        page,
        limit,
        totalItems: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Fetch users error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
