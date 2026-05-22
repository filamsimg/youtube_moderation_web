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

    const body = await req.json();
    
    // Support Batch Inference
    if (body.texts && Array.isArray(body.texts)) {
      const results = [];
      for (const text of body.texts) {
        try {
          const prediction = await modelService.classifyComment(text);
          results.push(prediction);
        } catch (e) {
          console.error('Batch classification item error:', e);
          results.push({ 
            label: 'Normal', 
            confidence: 1.0, 
            sentiment: 'neutral', 
            sentiment_score: 0.5 
          });
        }
      }
      return NextResponse.json({ results });
    }

    // Support Single Inference
    const { text } = body;
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
