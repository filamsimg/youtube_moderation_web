import { supabase } from '@/lib/supabase';

export const settingsService = {
  async getSettings(email) {
    if (!email) return null;
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_email', email)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found"
      console.error('Error fetching settings:', error);
    }
    return data;
  },

  async saveSettings(email, settings) {
    if (!email) return null;
    const { data, error } = await supabase
      .from('user_settings')
      .upsert({
        user_email: email,
        auto_hapus: settings.autoHapus,
        auto_tahan: settings.autoTahan,
        threshold_reject: settings.thresholdReject,
        threshold_hold: settings.thresholdHold,
        polling_interval: settings.pollingInterval,
        batch_moderation: settings.batchModeration
      });
    
    if (error) {
      console.error('Error saving settings:', error);
      return null;
    }
    return data;
  }
};
