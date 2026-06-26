import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/moderation/history
 * Mengambil riwayat moderasi pengguna secara aman dari server-side (bypass RLS via supabaseAdmin).
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = session.user.email;

    const { data: history, error } = await supabaseAdmin
      .from('moderation_history')
      .select('*')
      .eq('user_email', email)
      .order('created_at', { ascending: false })
      .limit(5000);

    if (error) {
      console.error('[History API GET] Error:', error);
      return NextResponse.json({ error: 'Database Error' }, { status: 500 });
    }

    return NextResponse.json(history || []);
  } catch (err) {
    console.error('[History API GET] Crash:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST /api/moderation/history
 * Menyimpan riwayat moderasi baru (bisa berupa objek tunggal atau array).
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = session.user.email;
    const body = await request.json();

    if (!body) {
      return NextResponse.json({ error: 'Bad Request: Missing body' }, { status: 400 });
    }

    const isBatch = Array.isArray(body);
    const items = isBatch ? body : [body];

    if (items.length === 0) {
      return NextResponse.json({ success: true, count: 0 });
    }

    // Petakan item dari format camelCase frontend ke format snake_case database
    const records = items.map(item => ({
      user_email: email,
      channel_id: item.channelId,
      comment_id: item.commentId,
      action: item.action,
      comment_text: item.commentText,
      author: item.author,
      video_title: item.videoTitle,
      ai_label: item.aiLabel,
      ai_confidence: item.aiConfidence,
      sentiment: item.sentiment,
      sentiment_score: item.sentimentScore
    }));

    const { data, error } = await supabaseAdmin
      .from('moderation_history')
      .upsert(records, { onConflict: 'comment_id' });

    if (error) {
      console.error('[History API POST] Error:', error);
      return NextResponse.json({ error: 'Database Error', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: records.length, data });
  } catch (err) {
    console.error('[History API POST] Crash:', err);
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
  }
}

/**
 * DELETE /api/moderation/history
 * Menghapus/membatalkan (undo) aksi moderasi dari riwayat.
 */
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = session.user.email;
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('commentId');

    if (!commentId) {
      return NextResponse.json({ error: 'Bad Request: Missing commentId parameter' }, { status: 400 });
    }

    // Validasi kepemilikan sebelum menghapus (opsional tapi disarankan untuk keamanan ekstra)
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('moderation_history')
      .select('user_email')
      .eq('comment_id', commentId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('[History API DELETE] Fetch ownership error:', fetchError);
      return NextResponse.json({ error: 'Database Error' }, { status: 500 });
    }

    if (existing && existing.user_email !== email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error: deleteError } = await supabaseAdmin
      .from('moderation_history')
      .delete()
      .eq('comment_id', commentId);

    if (deleteError) {
      console.error('[History API DELETE] Delete error:', deleteError);
      return NextResponse.json({ error: 'Database Error' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[History API DELETE] Crash:', err);
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
  }
}
