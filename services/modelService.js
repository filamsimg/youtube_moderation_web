import axios from 'axios';

// Replace with actual IndoBERT base URL
const MODEL_API_BASE = process.env.MODEL_API_BASE || 'http://localhost:5000';

export const modelService = {
  classifyComment: async (text) => {
    try {
      // Assuming IndoBERT API expects { text: "..." }
      const res = await axios.post(`${MODEL_API_BASE}/predict`, { text });
      // Typical response shape assumed: { label: "spam" | "normal", confidence: 0.95 }
      return res.data;
    } catch (error) {
      console.error('Model API error:', error);
      // Fallback for demo if API is down
      return { 
        label: Math.random() > 0.8 ? 'spam' : 'normal', 
        confidence: (Math.random() * (0.99 - 0.70) + 0.70).toFixed(2),
        sentiment: ['positive', 'negative', 'neutral'][Math.floor(Math.random() * 3)],
        sentiment_score: (Math.random() * (0.99 - 0.70) + 0.70).toFixed(2),
        isMock: true
      };
    }
  },
};
