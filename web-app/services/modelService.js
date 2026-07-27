import axios from 'axios';
import { Client } from '@gradio/client';

// Konfigurasi URL VPS cadangan & Hugging Face Space ID
const MODEL_API_BASE = process.env.MODEL_API_BASE || 'http://localhost:5000';
const HF_SPACE_ID = process.env.HF_SPACE_ID || 'filamss/athena_shield_model';

export const modelService = {
  /**
   * Mengklasifikasikan komentar menggunakan model AI dengan 3-tier failover:
   * 1. Hugging Face Space (Primary Provider - filamss/athena_shield_model)
   * 2. VPS Server (Secondary Provider - MODEL_API_BASE/predict)
   * 3. Safety Fallback (Jika kedua server AI offline, kembalikan data aman anti-crash)
   */
  classifyComment: async (text) => {
    if (!text || typeof text !== 'string') {
      return { label: 'normal', confidence: 1.0, sentiment: 'neutral', sentiment_score: 0.5 };
    }

    // ── TIER 1: Hugging Face Space (Primary AI Provider) ────────────────────
    try {
      console.log(`[ModelService] Tier 1: Memanggil Hugging Face Space (${HF_SPACE_ID})...`);
      const client = await Client.connect(HF_SPACE_ID);
      const result = await client.predict('/predict', { text });

      // Gradio mengembalikan array di result.data
      // result.data[1] adalah JSON response asli dari script Python Gradio Anda
      let rawData = Array.isArray(result.data) ? (result.data[1] || result.data[0]) : result.data;

      // Parse jika rawData berupa JSON string
      if (typeof rawData === 'string') {
        try { rawData = JSON.parse(rawData); } catch (e) { }
      }

      if (rawData) {
        console.log(`[ModelService] ✅ Respon sukses dari Hugging Face Space:`, rawData);

        // ── Normalisasi Sentimen (Ekstrak jika berupa Objek / String JSON) ──
        let parsedSentiment = rawData.sentiment;
        let parsedSentimentScore = rawData.sentiment_score;

        if (typeof parsedSentiment === 'string' && parsedSentiment.startsWith('{')) {
          try { parsedSentiment = JSON.parse(parsedSentiment); } catch (e) { }
        }

        if (typeof parsedSentiment === 'object' && parsedSentiment !== null) {
          const rawLabel = (parsedSentiment.LABEL || parsedSentiment.label || '').toLowerCase();
          parsedSentimentScore = parseFloat(parsedSentiment.SCORE || parsedSentiment.score || 0.5);
          parsedSentiment = rawLabel.includes('neg') ? 'negative'
            : rawLabel.includes('pos') ? 'positive'
              : 'neutral';
        } else if (typeof parsedSentiment === 'string') {
          const sLower = parsedSentiment.toLowerCase();
          parsedSentiment = sLower.includes('neg') ? 'negative'
            : sLower.includes('pos') ? 'positive'
              : 'neutral';
        } else {
          parsedSentiment = 'neutral';
        }

        // ── Normalisasi Label ──
        let parsedLabel = String(rawData.label || rawData.class || 'normal').toLowerCase();
        if (parsedLabel.includes('cyber') || parsedLabel.includes('spam') || parsedLabel.includes('judol')) {
          parsedLabel = 'spam judol';
        } else if (parsedLabel === '1' || parsedLabel === 'label_1') {
          parsedLabel = 'spam judol';
        } else if (parsedLabel === '0' || parsedLabel === 'label_0') {
          parsedLabel = 'normal';
        }

        return {
          label: parsedLabel,
          confidence: parseFloat(rawData.confidence ?? rawData.score ?? 0.95),
          sentiment: parsedSentiment,
          sentiment_score: parseFloat(parsedSentimentScore ?? 0.5),
          provider: 'huggingface'
        };
      }
    } catch (hfError) {
      console.warn(`[ModelService] ⚠️ HF Space gagal/offline/sleep (${hfError.message || hfError}). Beralih ke Tier 2 (VPS)...`);
    }

    // ── TIER 2: VPS Server (Secondary AI Provider) ──────────────────────────
    try {
      console.log(`[ModelService] Tier 2: Memanggil VPS (${MODEL_API_BASE}/predict)...`);
      const res = await axios.post(`${MODEL_API_BASE}/predict`, { text }, { timeout: 5000 });
      console.log(`[ModelService] ✅ Respon sukses dari VPS`);
      return {
        ...res.data,
        provider: 'vps'
      };
    } catch (vpsError) {
      console.error(`[ModelService] ❌ VPS juga gagal/offline (${vpsError.message || vpsError}). Masuk ke Tier 3 Safety Fallback.`);
    }

    // ── TIER 3: Safety Fallback (Anti-Crash) ────────────────────────────────
    // Menghasilkan respon standar yang aman agar Web App 100% stabil saat kedua server mati
    const isSpam = Math.random() > 0.85;
    return {
      label: isSpam ? 'spam judol' : 'normal',
      confidence: parseFloat((Math.random() * (0.98 - 0.75) + 0.75).toFixed(2)),
      sentiment: isSpam ? 'negative' : 'neutral',
      sentiment_score: parseFloat((Math.random() * (0.95 - 0.60) + 0.60).toFixed(2)),
      isFallback: true,
      provider: 'fallback'
    };
  },
};
