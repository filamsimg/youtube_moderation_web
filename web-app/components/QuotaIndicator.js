'use client';

import { useQuota } from '@/contexts/QuotaContext';
import Link from 'next/link';

/**
 * QuotaIndicator
 * Menampilkan sisa kuota user dalam bentuk progress bar mini (dark mode).
 * Menampilkan breakdown kuota terpisah (Langganan / Top-up / Trial).
 * Dipanggil dari Sidebar (full) dan Header (compact).
 */
export default function QuotaIndicator({ compact = false }) {
  const { profile, loading } = useQuota();

  if (loading || !profile) {
    return compact ? null : (
      <div className="h-[72px] rounded-xl skeleton" />
    );
  }

  const pct = profile.percentage;

  const isByokActive = profile.tier === 'ENTERPRISE' && profile.has_byok;

  // Warna berubah sesuai sisa kuota
  const barColor =
    isByokActive ? 'bg-gradient-to-r from-emerald-500 to-cyan-400' :
    pct > 50 ? 'bg-emerald-500' :
    pct > 20 ? 'bg-amber-400' :
    'bg-rose-500';

  const barGlow =
    isByokActive ? '0 0 10px rgba(16, 185, 129, 0.70)' :
    pct > 50 ? '0 0 8px rgba(16, 185, 129, 0.60)' :
    pct > 20 ? '0 0 8px rgba(245, 158, 11, 0.60)' :
    '0 0 8px rgba(244, 63, 94, 0.60)';

  const textColor =
    isByokActive ? 'text-emerald-600 dark:text-emerald-400' :
    pct > 50 ? 'text-emerald-600 dark:text-emerald-400' :
    pct > 20 ? 'text-amber-600 dark:text-amber-400' :
    'text-rose-600 dark:text-rose-400';

  const tierBadgeClass =
    isByokActive
      ? 'bg-cyan-50 border-cyan-200 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/20'
      : profile.tier === 'PRO'
      ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
      : profile.tier === 'ENTERPRISE'
      ? 'bg-violet-50 border-violet-200 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20'
      : 'bg-card-hover text-muted border border-[var(--border-default)]';

  // ── Compact Mode (untuk Header) ──────────────────────────────
  if (compact) {
    return (
      <div className="flex items-center gap-2.5">
        <div className="text-right">
          <p className="text-[10px] text-muted">Kuota</p>
          <p className={`text-xs font-semibold ${textColor}`}>
            {isByokActive ? 'BYOK GCP' : `${profile.quota_balance.toLocaleString('id-ID')} unit`}
          </p>
        </div>
        <div className="w-14 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-default)' }}>
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{
              width: `${isByokActive ? 100 : Math.min(pct, 100)}%`,
              boxShadow: barGlow,
            }}
          />
        </div>
      </div>
    );
  }

  // ── Full Mode (untuk Sidebar) ─────────────────────────────────

  // Logika teks masa aktif yang presisi
  const getExpiryText = () => {
    if (profile.tier === 'FREE') {
      const totalBalance = profile.quota_balance || 0;
      
      if (profile.is_trial_active) {
        const expiryDate = new Date(profile.quota_expiry);
        const diffTime = expiryDate - new Date();
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return {
          text: `Trial Premium (${daysLeft > 0 ? `${daysLeft} hari lagi` : 'Hari ini'})`,
          className: 'text-amber-500 font-semibold'
        };
      }

      if (profile.is_trial_expired) {
        return {
          text: 'Trial Selesai (Terkunci)',
          className: 'text-rose-500 font-bold'
        };
      }

      if (totalBalance <= 0) {
        return { 
          text: 'Kuota Habis', 
          className: 'text-rose-500 font-bold animate-pulse' 
        };
      }
      
      return { 
        text: 'Trial Belum Aktif', 
        className: 'text-slate-400 font-medium' 
      };
    }
    
    // PRO & ENTERPRISE selalu memiliki masa aktif definitif
    if (!profile.quota_expiry) {
      return { text: 'Perlu Verifikasi', className: 'text-amber-400 font-medium' };
    }

    const expiryDate = new Date(profile.quota_expiry);
    const diffTime = expiryDate - new Date();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const formattedDate = expiryDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

    if (daysLeft < 0) {
      return { text: `${formattedDate} (Kedaluwarsa)`, className: 'text-rose-500 font-bold' };
    } else if (daysLeft === 0) {
      return { text: `Hari ini!`, className: 'text-rose-500 font-bold animate-pulse' };
    } else if (daysLeft <= 3) {
      return { text: `${formattedDate} (${daysLeft} hari lagi!)`, className: 'text-rose-400 font-semibold animate-pulse' };
    } else if (daysLeft <= 7) {
      return { text: `${formattedDate} (${daysLeft} hari lagi)`, className: 'text-amber-400 font-semibold' };
    } else {
      return { text: formattedDate, className: 'text-emerald-500 dark:text-emerald-400 font-medium' };
    }
  };

  const expiryInfo = getExpiryText();

  // Cek apakah ada breakdown kuota terpisah
  const hasBreakdown = profile.subscription_quota !== undefined;
  const subQuota = profile.subscription_quota || 0;
  const trialQuota = profile.trial_quota || 0;

  return (
    <div
      className="p-3 rounded-xl border space-y-2.5"
      style={{ background: 'var(--bg-page)', borderColor: 'var(--border-default)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-secondary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
          </svg>
          <p className="text-[11px] font-semibold text-secondary">Kuota API</p>
        </div>
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${tierBadgeClass}`}>
          {isByokActive ? 'ENTERPRISE • BYOK' : profile.tier}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-default)' }}>
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{
            width: `${isByokActive ? 100 : Math.min(pct, 100)}%`,
            boxShadow: barGlow,
          }}
        />
      </div>

      {/* Numbers */}
      <div className="flex items-center justify-between">
        <p className={`text-[11px] font-bold ${textColor}`}>
          {isByokActive ? 'Bebas Limit Server' : `${profile.quota_balance.toLocaleString('id-ID')} unit`}
        </p>
        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
          {isByokActive ? '/ GCP Mandiri' : `/ ${profile.quota_limit.toLocaleString('id-ID')}`}
        </p>
      </div>

      {/* Breakdown Kuota Terpisah */}
      {isByokActive ? (
        <div className="space-y-1 pt-1.5 border-t border-[var(--border-default)]/40 text-[9px] sm:text-[10px]">
          <div className="flex items-center justify-between">
            <span className="text-muted">Beban Server:</span>
            <span className="text-emerald-500 font-semibold">100% Offloaded</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted">Limit GCP:</span>
            <span className="text-slate-300 font-semibold">10.000 units/hari</span>
          </div>
        </div>
      ) : hasBreakdown && (subQuota > 0 || trialQuota > 0) && (
        <div className="space-y-1 pt-1.5 border-t border-[var(--border-default)]/40">
          <p className="text-[9px] text-muted uppercase tracking-wider font-semibold">Rincian</p>
          <div className="space-y-0.5">
            {subQuota > 0 && (
              <div className="flex items-center justify-between text-[9px] sm:text-[10px]">
                <span className="text-muted flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block" />
                  Langganan
                </span>
                <span className="text-indigo-400 font-semibold">{subQuota.toLocaleString('id-ID')}</span>
              </div>
            )}
            {trialQuota > 0 && (
              <div className="flex items-center justify-between text-[9px] sm:text-[10px]">
                <span className="text-muted flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block" />
                  Trial
                </span>
                <span className="text-slate-400 font-semibold">{trialQuota.toLocaleString('id-ID')}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Active Period / Masa Aktif */}
      <div className="flex items-center justify-between pt-1.5 border-t border-[var(--border-default)]/40 text-[9px] sm:text-[10px]" style={{ color: 'var(--text-muted)' }}>
        <span>Masa Aktif:</span>
        <span className={`font-medium ${expiryInfo.className}`}>
          {expiryInfo.text}
        </span>
      </div>

      {/* Action Button */}
      {isByokActive ? (
        <a
          href="https://console.cloud.google.com/apis/api/youtube.googleapis.com/quotas"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors"
        >
          Cek Pemakaian Real-Time GCP ↗
        </a>
      ) : pct <= 20 ? (
        <Link
          href="/pricing"
          className="block w-full text-center py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-[11px] font-medium text-rose-700 hover:bg-rose-100/50 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400 dark:hover:bg-rose-500/15 transition-colors"
        >
          Upgrade Langganan
        </Link>
      ) : null}
    </div>
  );
}
