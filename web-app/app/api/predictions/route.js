import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/predictions?ids=id1,id2,id3
 * Mengambil hasil prediksi AI yang sudah tersimpan di cache database
 * berdasarkan daftar comment_id.
 * Mengembalikan map: { [comment_id]: { label, confidence, sentiment, sentiment_score } }
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids');

    if (!idsParam) {
      return NextResponse.json({}, { status: 200 });
    }

    const ids = idsParam.split(',').filter(Boolean);
    if (ids.length === 0) {
      return NextResponse.json({}, { status: 200 });
    }

    // Batasi jumlah ID per request untuk mencegah query terlalu besar
    const limitedIds = ids.slice(0, 500);

    const { data, error } = await supabaseAdmin
      .from('comment_predictions')
      .select('comment_id, label, confidence, sentiment, sentiment_score')
      .in('comment_id', limitedIds);

    if (error) {
      console.error('[Predictions GET] DB error:', error);
      return NextResponse.json({ error: 'Database Error' }, { status: 500 });
    }

    // Ubah array hasil menjadi map untuk kemudahan lookup di frontend
    const predictionMap = {};
    (data || []).forEach(row => {
      predictionMap[row.comment_id] = {
        label: row.label,
        confidence: row.confidence,
        score: row.confidence,
        sentiment: row.sentiment,
        sentiment_score: row.sentiment_score,
      };
    });

    return NextResponse.json(predictionMap);
  } catch (err) {
    console.error('[Predictions GET] Crash:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST /api/predictions
 * Menyimpan hasil prediksi AI ke cache database (upsert by comment_id).
 * Body: Array of { commentId, label, confidence, sentiment, sentiment_score }
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const items = Array.isArray(body) ? body : [body];

    if (items.length === 0) {
      return NextResponse.json({ success: true, count: 0 });
    }

    const records = items.map(item => ({
      comment_id: item.commentId,
      label: item.label,
      confidence: item.confidence,
      sentiment: item.sentiment ?? null,
      sentiment_score: item.sentiment_score ?? null,
    }));

    const { error } = await supabaseAdmin
      .from('comment_predictions')
      .upsert(records, { onConflict: 'comment_id' });

    if (error) {
      console.error('[Predictions POST] DB error:', error);
      return NextResponse.json({ error: 'Database Error', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: records.length });
  } catch (err) {
    console.error('[Predictions POST] Crash:', err);
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
  }
}
