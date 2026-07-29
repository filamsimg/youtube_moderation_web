import axios from 'axios';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

const extractError = (err) => {
  if (err.response?.data?.error) {
    const googleError = err.response.data.error;
    const firstDetail = googleError.errors?.[0];
    return {
      message: firstDetail?.message || googleError.message || err.message,
      reason: firstDetail?.reason || 'unknown',
      status: err.response.status,
      isExpired: err.response.status === 401 // Deteksi sesi habis
    };
  }
  return { message: err.message, reason: 'network_error', status: 500, isExpired: false };
};

export const youtubeService = {
  getUserChannel: async (token, customApiKey = null) => {
    try {
      const params = { part: 'snippet,contentDetails', mine: true };
      if (customApiKey) params.key = customApiKey;

      const res = await axios.get(`${YOUTUBE_API_BASE}/channels`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      return res.data;
    } catch (error) {
      const err = extractError(error);
      console.error('Error fetching channel:', err);
      throw err;
    }
  },

  getVideosByChannel: async (channelId, token, customApiKey = null) => {
    try {
      // Step 1: Check for cached uploads playlist ID in localStorage first
      let uploadsPlaylistId = typeof window !== 'undefined' ? localStorage.getItem(`playlist_${channelId}`) : null;
      
      if (!uploadsPlaylistId) {
        const channelParams = { part: 'contentDetails', id: channelId };
        if (customApiKey) channelParams.key = customApiKey;

        const channelRes = await axios.get(`${YOUTUBE_API_BASE}/channels`, {
          headers: { Authorization: `Bearer ${token}` },
          params: channelParams,
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
      const playlistParams = {
        part: 'snippet',
        playlistId: uploadsPlaylistId,
        maxResults: 50,
      };
      if (customApiKey) playlistParams.key = customApiKey;

      const res = await axios.get(`${YOUTUBE_API_BASE}/playlistItems`, {
        headers: { Authorization: `Bearer ${token}` },
        params: playlistParams,
      });

      return {
        ...res.data,
        items: (res.data?.items || [])
          .filter(item => item?.snippet?.resourceId?.videoId)
          .map(item => ({
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

  getComments: async (videoId, token, pageToken = null, customApiKey = null) => {
    try {
      const params = {
        part: 'snippet,replies',
        videoId,
        maxResults: 100, // Batch maksimum YouTube API: 1 unit kuota per 100 komentar (efisiensi 80% vs batch 20)
        textFormat: 'html'
      };
      
      if (pageToken) {
        params.pageToken = pageToken;
      }
      if (customApiKey) {
        params.key = customApiKey;
      }

      const res = await axios.get(`${YOUTUBE_API_BASE}/commentThreads`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      return res.data;
    } catch (error) {
      const err = extractError(error);
      console.error('Error fetching comments:', err);
      throw err;
    }
  },

  moderateComment: async (commentId, status, token, customApiKey = null) => {
    try {
      const params = { id: commentId, moderationStatus: status };
      if (customApiKey) params.key = customApiKey;

      const res = await axios.post(
        `${YOUTUBE_API_BASE}/comments/setModerationStatus`,
        null,
        {
          headers: { Authorization: `Bearer ${token}` },
          params,
        }
      );
      return res.data;
    } catch (error) {
      const err = extractError(error);
      console.error('Error moderating comment:', err);
      throw err;
    }
  },

  moderateCommentsBatch: async (commentIds, status, token, customApiKey = null) => {
    // commentIds: array of strings
    if (!commentIds || commentIds.length === 0) return;
    try {
      const idsString = commentIds.join(',');
      const params = { id: idsString, moderationStatus: status };
      if (customApiKey) params.key = customApiKey;

      const res = await axios.post(
        `${YOUTUBE_API_BASE}/comments/setModerationStatus`,
        null,
        {
          headers: { Authorization: `Bearer ${token}` },
          params,
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


