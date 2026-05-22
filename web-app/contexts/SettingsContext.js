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
        try {
          setSettingsState({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
        } catch {
          setSettingsState(DEFAULT_SETTINGS);
        }
      } else {
        setSettingsState(DEFAULT_SETTINGS);
      }
      setLoading(false);
    }
  }, [session?.user?.email]);

  const loadSettings = async (email) => {
    // Muat dari localStorage terlebih dahulu untuk responsivitas instan
    const saved = localStorage.getItem(`userSettings_${email}`);
    if (saved) {
      try {
        setSettingsState({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
      } catch (err) {
        console.error('Error parsing scoped local settings:', err);
      }
    }

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
        localStorage.setItem(`userSettings_${email}`, JSON.stringify(mapped));

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
    
    const email = session?.user?.email;
    const storageKey = email ? `userSettings_${email}` : 'userSettings';
    localStorage.setItem(storageKey, JSON.stringify(updated));

    if (newSettings.theme && newSettings.theme !== theme) {
      setTheme(newSettings.theme);
    }

    if (email) {
      try {
        await settingsService.saveSettings(email, updated);
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
