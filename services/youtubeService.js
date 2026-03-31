import axios from 'axios';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

export const youtubeService = {
  getUserChannel: async (token) => {
    try {
      const res = await axios.get(`${YOUTUBE_API_BASE}/channels`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { part: 'snippet', mine: true },
      });
      return res.data;
    } catch (error) {
      console.error('Error fetching channel:', error);
      throw error;
    }
  },

  getVideosByChannel: async (channelId, token) => {
    try {
      const res = await axios.get(`${YOUTUBE_API_BASE}/search`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          part: 'snippet',
          channelId,
          maxResults: 50,
          type: 'video',
          order: 'date'
        },
      });
      return res.data;
    } catch (error) {
      console.error('Error fetching videos:', error);
      throw error;
    }
  },

  getComments: async (videoId, token) => {
    try {
      const res = await axios.get(`${YOUTUBE_API_BASE}/commentThreads`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          part: 'snippet,replies',
          videoId,
          maxResults: 100,
        },
      });
      return res.data;
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
  },

  moderateComment: async (commentId, status, token) => {
    // status: "hold", "publish", "reject"
    // Note: status "reject" is for marking a comment as rejected (will hide the comment)
    // Actually the docs say: moderationStatus=heldForReview, published, rejected
    try {
      const res = await axios.post(
        `${YOUTUBE_API_BASE}/comments/setModerationStatus`,
        null, // No body needs to be sent for this POST
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { id: commentId, moderationStatus: status },
        }
      );
      return res.data;
    } catch (error) {
      console.error('Error moderating comment:', error);
      throw error;
    }
  },
};
