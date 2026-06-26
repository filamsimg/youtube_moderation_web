import axios from 'axios';

export const historyService = {
  async getHistory(email) {
    try {
      const res = await axios.get('/api/moderation/history');
      return res.data || [];
    } catch (error) {
      console.error('Error fetching history:', error);
      return [];
    }
  },

  async saveAction(email, item) {
    try {
      const res = await axios.post('/api/moderation/history', item);
      return res.data?.data || res.data;
    } catch (error) {
      console.error('Error saving action:', error);
      return null;
    }
  },

  async saveBatchActions(email, items) {
    try {
      const res = await axios.post('/api/moderation/history', items);
      return res.data?.data || res.data;
    } catch (error) {
      console.error('Error saving batch actions:', error);
      return null;
    }
  },

  async deleteAction(commentId) {
    try {
      const res = await axios.delete(`/api/moderation/history?commentId=${commentId}`);
      return res.data?.success || false;
    } catch (error) {
      console.error('Error deleting action:', error);
      return false;
    }
  }
};
