'use client';

import React from 'react';
import { ToastProvider } from './ToastContext';
import { QuotaProvider } from './QuotaContext';
import { SettingsProvider } from './SettingsContext';
import { YouTubeProvider } from './YouTubeContext';
import { ModerationProvider } from './ModerationContext';

export function GlobalProviders({ children }) {
  return (
    <ToastProvider>
      <SettingsProvider>
        <QuotaProvider>
          <YouTubeProvider>
            <ModerationProvider>
              {children}
            </ModerationProvider>
          </YouTubeProvider>
        </QuotaProvider>
      </SettingsProvider>
    </ToastProvider>
  );
}
