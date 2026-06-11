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
  const label = searchParams.get('label') || ''; // 'Spam' | 'Normal'
  const action = searchParams.get('action') || ''; // 'published' | 'heldForReview' | 'rejected'

  try {
    let query = supabaseAdmin
      .from('moderation_history')
      .select('*', { count: 'exact' });

    if (search) {
      query = query.or(`user_email.ilike.%${search}%,comment_text.ilike.%${search}%,author.ilike.%${search}%,video_title.ilike.%${search}%`);
    }
    if (label) {
      query = query.eq('ai_label', label);
    }
    if (action) {
      query = query.eq('action', action);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: history, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      history,
      pagination: {
        page,
        limit,
        totalItems: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Fetch global moderation error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
