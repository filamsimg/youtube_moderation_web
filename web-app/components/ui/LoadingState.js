import React from 'react';
import Image from 'next/image';

export default function LoadingState({ message = 'Memuat data...', className = '', variant = 'spinner' }) {
  if (variant === 'logo') {
    return (
      <div className={`flex justify-center items-center py-16 ${className}`}>
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-lg animate-pulse" />
            <Image src="/logo.webp" alt="Athena Logo" width={40} height={40} className="relative w-10 h-10 animate-float" />
          </div>
          {message && <p className="text-xs text-muted" style={{ color: 'var(--text-muted)' }}>{message}</p>}
          <div className="w-24 h-1 rounded-full overflow-hidden" style={{ background: 'var(--border-default)' }}>
            <div className="h-full w-2/3 bg-indigo-500 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center py-20 text-center space-y-3 ${className}`}>
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-lg animate-pulse" />
        <div className="w-10 h-10 border-4 border-rose-500/30 border-t-rose-600 rounded-full animate-spin relative" />
      </div>
      <p className="text-xs text-muted" style={{ color: 'var(--text-muted)' }}>{message}</p>
    </div>
  );
}
