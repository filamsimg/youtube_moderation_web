'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from './ToastContext';
import { QUOTA_COSTS } from '@/services/quotaService';
import { checkIsFeatureDisabled } from '@/lib/featureGate';

const QuotaContext = createContext(null);

export function QuotaProvider({ children }) {
  const { data: session } = useSession();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchQuota = useCallback(async () => {
    if (!session?.user?.email) return;
    try {
      const res = await fetch('/api/quota/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (err) {
      console.error('QuotaContext fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.email]);

  useEffect(() => {
    if (!session?.user?.email) {
      setProfile(null);
      setLoading(false);
      return;
    }
    fetchQuota();
  }, [session?.user?.email, fetchQuota]);

  const deductQuota = async (actionKey, description = '') => {
    try {
      const res = await fetch('/api/quota/deduct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionKey, description }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 402) {
          toast.error(`Kuota habis! Sisa: ${data.balance ?? 0} unit. Diperlukan: ${QUOTA_COSTS[actionKey]} unit.`);
          return false;
        }
        toast.error('Gagal memotong kuota.');
        return false;
      }
      // Update local state directly to save a fetch, or just re-fetch
      fetchQuota();
      return true;
    } catch (err) {
      console.error('deductQuota error:', err);
      toast.error('Terjadi kesalahan jaringan saat mengecek kuota.');
      return false;
    }
  };

  // Pengecekan status fitur dibatasi (Feature Gating) secara dinamis
  const isFeatureDisabled = useCallback((featureKey) => {
    return checkIsFeatureDisabled(featureKey, profile?.disabled_features || []);
  }, [profile?.disabled_features]);

  return (
    <QuotaContext.Provider value={{ profile, loading, fetchQuota, deductQuota, isFeatureDisabled }}>
      {children}
    </QuotaContext.Provider>
  );
}

export const useQuota = () => {
  const context = useContext(QuotaContext);
  if (!context) {
    throw new Error('useQuota must be used within a QuotaProvider');
  }
  return context;
};
