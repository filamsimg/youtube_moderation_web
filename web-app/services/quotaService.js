import { supabase } from '@/lib/supabase';

// ── Biaya per aksi (YouTube API v3 Quota Units) ──────────────────────────────
export const QUOTA_COSTS = {
  FETCH_VIDEOS: 1,        // playlistItems.list
  FETCH_COMMENTS: 1,      // commentThreads.list
  MODERATE_SINGLE: 50,    // comments.setModerationStatus (1 komentar)
  MODERATE_BATCH: 50,     // comments.setModerationStatus (batch = biaya sama)
  POLLING: 1,             // list call saat polling otomatis
};

// ── Batas kuota per tier ──────────────────────────────────────────────────────
export const TIER_LIMITS = {
  FREE:       { limit: 1000,   label: 'Free',       color: 'gray' },
  PRO:        { limit: 50000,  label: 'Pro',         color: 'indigo' },
  ENTERPRISE: { limit: 200000, label: 'Enterprise',  color: 'amber' },
};

export const quotaService = {
  // Ambil profil kuota user (buat baru jika belum ada)
  async getProfile(email) {
    if (!email) return null;
    try {
      // Panggil fungsi SQL ensure_user_profile agar auto-create jika baru
      const { data, error } = await supabase.rpc('ensure_user_profile', {
        p_email: email,
      });
      if (error) throw error;

      // Compute total balance dari sumber kuota aktif
      if (data) {
        data.quota_balance = (data.subscription_quota || 0) + (data.trial_quota || 0);
      }

      return data;
    } catch (err) {
      console.error('[quotaService] getProfile error:', err);
      return null;
    }
  },

  // Cek apakah saldo cukup untuk suatu aksi (tanpa memotong)
  async canAfford(email, actionKey) {
    const cost = QUOTA_COSTS[actionKey] ?? 0;
    const profile = await this.getProfile(email);
    if (!profile) return false;
    return profile.quota_balance >= cost;
  },

  // Potong saldo kuota (dipanggil dari API Route server-side)
  async deduct(email, actionKey, description = '') {
    const cost = QUOTA_COSTS[actionKey] ?? 0;
    if (cost === 0) return { success: true };
    try {
      const { data, error } = await supabase.rpc('deduct_quota', {
        p_email: email,
        p_units: cost,
        p_action: actionKey,
        p_description: description,
      });
      if (error) throw error;
      return data; // { success: bool, balance: int, reason?: string }
    } catch (err) {
      console.error('[quotaService] deduct error:', err);
      return { success: false, reason: 'server_error' };
    }
  },

  // Ambil log pemakaian 30 hari terakhir
  async getUsageLogs(email, limit = 50) {
    if (!email) return [];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('quota_usage_logs')
      .select('*')
      .eq('user_email', email)
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) { console.error('[quotaService] getUsageLogs error:', error); return []; }
    return data;
  },
};
