'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { settingsService } from '@/services/settingsService';
import { useTheme } from '@/components/ThemeProvider';
import { useToast } from './ToastContext';

const SettingsContext = createContext(null);

const DEFAULT_SETTINGS = {
  theme: 'dark',
  notifKomentar: true,
  autoTahan: true,
  autoHapus: false,
  thresholdHold: 70,
  thresholdReject: 90,
  pollingInterval: 120,
  batchModeration: true,
};

export function SettingsProvider({ children }) {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const toast = useToast();
  
  const [settings, setSettingsState] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.email) {
      loadSettings(session.user.email);
    } else {
      const saved = localStorage.getItem('userSettings');
      if (saved) {
        setSettingsState({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
      }
      setLoading(false);
    }
  }, [session?.user?.email]);

  const loadSettings = async (email) => {
    try {
      const data = await settingsService.getSettings(email);
      if (data) {
        const mapped = {
          theme: data.theme || 'dark',
          autoTahan: data.auto_tahan ?? true,
          autoHapus: data.auto_hapus ?? false,
          thresholdHold: data.threshold_hold ?? 70,
          thresholdReject: data.threshold_reject ?? 90,
          pollingInterval: data.polling_interval ?? 120,
          batchModeration: data.batch_moderation ?? true,
        };
        setSettingsState({ ...DEFAULT_SETTINGS, ...mapped });
        localStorage.setItem('userSettings', JSON.stringify(mapped));

        if (mapped.theme && mapped.theme !== theme) {
          setTheme(mapped.theme);
        }
      }
    } catch (err) {
      console.error('Settings load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings) => {
    const updated = { ...settings, ...newSettings };
    setSettingsState(updated);
    localStorage.setItem('userSettings', JSON.stringify(updated));

    if (newSettings.theme && newSettings.theme !== theme) {
      setTheme(newSettings.theme);
    }

    if (session?.user?.email) {
      try {
        await settingsService.saveSettings(session.user.email, updated);
        toast.success('Pengaturan berhasil disimpan');
      } catch (err) {
        toast.error('Gagal menyimpan pengaturan ke server');
      }
    } else {
      toast.success('Pengaturan tersimpan sementara');
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
