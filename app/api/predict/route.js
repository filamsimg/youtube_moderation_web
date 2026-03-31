import { NextResponse } from 'next/server';
import { modelService } from '@/services/modelService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { text } = await req.json();
    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const prediction = await modelService.classifyComment(text);
    return NextResponse.json(prediction);
  } catch (error) {
    console.error('API /predict error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
