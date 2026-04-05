import axios from 'axios';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

const extractError = (err) => {
  if (err.response?.data?.error) {
    const googleError = err.response.data.error;
    const firstDetail = googleError.errors?.[0];
    return {
      message: firstDetail?.message || googleError.message || err.message,
      reason: firstDetail?.reason || 'unknown',
      status: err.response.status
    };
  }
  return { message: err.message, reason: 'network_error', status: 500 };
};

export const youtubeService = {
  getUserChannel: async (token) => {
    try {
      const res = await axios.get(`${YOUTUBE_API_BASE}/channels`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { part: 'snippet,contentDetails', mine: true },
      });
      return res.data;
    } catch (error) {
      const err = extractError(error);
      console.error('Error fetching channel:', err);
      throw err;
    }
  },

  getVideosByChannel: async (channelId, token) => {
    try {
      // Step 1: Check for cached uploads playlist ID in localStorage first
      let uploadsPlaylistId = typeof window !== 'undefined' ? localStorage.getItem(`playlist_${channelId}`) : null;
      
      if (!uploadsPlaylistId) {
        const channelRes = await axios.get(`${YOUTUBE_API_BASE}/channels`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { part: 'contentDetails', id: channelId },
        });

        uploadsPlaylistId = channelRes.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

        if (uploadsPlaylistId && typeof window !== 'undefined') {
          localStorage.setItem(`playlist_${channelId}`, uploadsPlaylistId);
        }
      }

      if (!uploadsPlaylistId) {
        throw new Error('Uploads playlist not found for this channel');
      }

      // Step 2: Fetch items from the uploads playlist (Cost: 1 unit)
      const res = await axios.get(`${YOUTUBE_API_BASE}/playlistItems`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          part: 'snippet',
          playlistId: uploadsPlaylistId,
          maxResults: 50,
        },
      });

      return {
        ...res.data,
        items: res.data.items.map(item => ({
          ...item,
          id: { videoId: item.snippet.resourceId.videoId }
        }))
      };
    } catch (error) {
      const err = extractError(error);
      console.error('Error fetching videos:', err);
      throw err;
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
          textFormat: 'html'
        },
      });
      return res.data;
    } catch (error) {
      const err = extractError(error);
      console.error('Error fetching comments:', err);
      throw err;
    }
  },

  moderateComment: async (commentId, status, token) => {
    try {
      const res = await axios.post(
        `${YOUTUBE_API_BASE}/comments/setModerationStatus`,
        null,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { id: commentId, moderationStatus: status },
        }
      );
      return res.data;
    } catch (error) {
      const err = extractError(error);
      console.error('Error moderating comment:', err);
      throw err;
    }
  },

  moderateCommentsBatch: async (commentIds, status, token) => {
    // commentIds: array of strings
    if (!commentIds || commentIds.length === 0) return;
    try {
      const idsString = commentIds.join(',');
      const res = await axios.post(
        `${YOUTUBE_API_BASE}/comments/setModerationStatus`,
        null,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { id: idsString, moderationStatus: status },
        }
      );
      return res.data;
    } catch (error) {
      const err = extractError(error);
      console.error('Error in batch moderation:', err);
      throw err;
    }
  },
};


