import axios from 'axios';

// Konfigurasi model AI dari Environment Variables (Lokal atau VPS)
const MODEL_API_BASE = process.env.MODEL_API_BASE || 'http://localhost:5000';

export const modelService = {
  classifyComment: async (text) => {
    // Memanggil API lokal (localhost:5000) atau VPS Anda
    try {
      const res = await axios.post(`${MODEL_API_BASE}/predict`, { text }, { timeout: 5000 });
      return res.data;
    } catch (error) {
      console.error('Model API error / Fallback to mock:', error.message || error);

      // Fallback Terakhir: Mock Data secara acak agar aplikasi tidak crash jika server mati
      const isSpam = Math.random() > 0.8;
      return {
        label: isSpam ? 'spam' : 'normal',
        confidence: (Math.random() * (0.99 - 0.70) + 0.70).toFixed(2),
        sentiment: isSpam ? 'negative' : ['positive', 'negative', 'neutral'][Math.floor(Math.random() * 3)],
        sentiment_score: (Math.random() * (0.99 - 0.70) + 0.70).toFixed(2),
        isMock: true
      };
    }
  },
};
