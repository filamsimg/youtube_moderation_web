import axios from 'axios';

/**
 * predictionCacheService
 * 
 * Service untuk mengambil & menyimpan hasil prediksi AI ke database cache.
 * Mencegah komentar yang sama dianalisis ulang setiap kali halaman di-refresh,
 * sehingga menghemat resource AI server dan menjaga konsistensi hasil prediksi.
 */
export const predictionCacheService = {
  /**
   * Ambil prediksi yang sudah tersimpan di cache untuk sekumpulan comment ID.
   * @param {string[]} commentIds - Array of comment IDs
   * @returns {Promise<Object>} Map: { [commentId]: { label, confidence, score, sentiment, sentiment_score } }
   */
  async getCachedPredictions(commentIds) {
    if (!commentIds || commentIds.length === 0) return {};

    try {
      // Kirim request dalam batch maks 500 ID sekaligus
      const chunks = [];
      for (let i = 0; i < commentIds.length; i += 500) {
        chunks.push(commentIds.slice(i, i + 500));
      }

      let allPredictions = {};
      for (const chunk of chunks) {
        const idsParam = chunk.join(',');
        const res = await axios.get(`/api/predictions?ids=${encodeURIComponent(idsParam)}`);
        allPredictions = { ...allPredictions, ...(res.data || {}) };
      }

      return allPredictions;
    } catch (error) {
      console.error('[predictionCacheService] Error fetching cached predictions:', error);
      return {}; // Graceful fallback — re-analisis akan dilakukan
    }
  },

  /**
   * Simpan hasil prediksi AI ke cache database (upsert).
   * Dipanggil setelah batch inference selesai.
   * @param {Object} predictionsMap - Map: { [commentId]: { label, confidence, sentiment, sentiment_score } }
   */
  async savePredictions(predictionsMap) {
    if (!predictionsMap || Object.keys(predictionsMap).length === 0) return;

    try {
      const items = Object.entries(predictionsMap).map(([commentId, pred]) => ({
        commentId,
        label: pred.label,
        confidence: pred.confidence ?? pred.score ?? 0,
        sentiment: pred.sentiment ?? null,
        sentiment_score: pred.sentiment_score ?? null,
      }));

      // Simpan dalam chunk maks 100 per request agar tidak melebihi batas payload
      for (let i = 0; i < items.length; i += 100) {
        const chunk = items.slice(i, i + 100);
        await axios.post('/api/predictions', chunk);
      }
    } catch (error) {
      // Non-fatal: jika gagal simpan cache, proses tetap berlanjut normal
      console.error('[predictionCacheService] Error saving predictions to cache:', error);
    }
  },
};
