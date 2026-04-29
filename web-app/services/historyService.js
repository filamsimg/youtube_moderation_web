import { supabase } from '@/lib/supabase';

export const historyService = {
  async getHistory(email) {
    if (!email) return [];
    const { data, error } = await supabase
      .from('moderation_history')
      .select('*')
      .eq('user_email', email)
      .order('created_at', { ascending: false })
      .limit(200);
    
    if (error) {
      console.error('Error fetching history:', error);
      return [];
    }
    return data;
  },

  async saveAction(email, item) {
    if (!email) return null;
    const { data, error } = await supabase
      .from('moderation_history')
      .upsert({
        user_email: email,
        channel_id: item.channelId,
        comment_id: item.commentId,
        action: item.action,
        comment_text: item.commentText,
        author: item.author,
        video_title: item.videoTitle,
        ai_label: item.aiLabel,
        ai_confidence: item.aiConfidence,
        sentiment: item.sentiment,
        sentiment_score: item.sentimentScore
      }, { onConflict: 'comment_id' }); // Cegah duplikat berdasarkan ID Komentar
    
    if (error) {
      console.error('Error saving action:', error);
      return null;
    }
    return data;
  },

  async saveBatchActions(email, items) {
    if (!email || items.length === 0) return null;
    const records = items.map(item => ({
      user_email: email,
      channel_id: item.channelId,
      comment_id: item.commentId,
      action: item.action,
      comment_text: item.commentText,
      author: item.author,
      video_title: item.videoTitle,
      ai_label: item.aiLabel,
      ai_confidence: item.aiConfidence,
      sentiment: item.sentiment,
      sentiment_score: item.sentimentScore
    }));

    const { data, error } = await supabase
      .from('moderation_history')
      .upsert(records, { onConflict: 'comment_id' });
    
    if (error) {
      console.error('Error saving batch actions:', error);
      return null;
    }
    return data;
  }
};
