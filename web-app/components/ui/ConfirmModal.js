'use client';

import React, { useEffect } from 'react';

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  variant = 'info',
  isLoading = false,
}) {
  // Prevent background body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Icon and background presets for styling variants
  const variantStyles = {
    danger: {
      bgIcon: 'bg-rose-500/10 text-rose-500 dark:bg-rose-500/20 dark:text-rose-400',
      bgConfirm: 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/20 focus:ring-rose-500/50',
      iconPath: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    info: {
      bgIcon: 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400',
      bgConfirm: 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/20 focus:ring-indigo-500/50',
      iconPath: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
        </svg>
      ),
    },
  };

  const style = variantStyles[variant] || variantStyles.info;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop with smooth blur */}
      <div
        className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card with premium animations and responsive styling */}
      <div
        className="relative w-full max-w-sm rounded-2xl border p-5 shadow-2xl animate-fade-in-up bg-white border-slate-200 text-slate-800 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header / Warning Icon */}
        <div className="flex items-center gap-3 mb-3.5">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${style.bgIcon}`}>
            {style.iconPath}
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight">{title}</h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Konfirmasi Tindakan</p>
          </div>
        </div>

        {/* Content Description */}
        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400 mb-5">
          {description}
        </p>

        {/* Action Buttons */}
        <div className="flex gap-2.5">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800/80 text-[12px] font-semibold rounded-xl transition-all active:scale-95 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-800/50 disabled:opacity-50 select-none cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-2.5 px-3 text-[12px] font-semibold rounded-xl transition-all active:scale-95 text-white shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5 select-none cursor-pointer ${style.bgConfirm}`}
          >
            {isLoading && (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin flex-shrink-0" />
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
