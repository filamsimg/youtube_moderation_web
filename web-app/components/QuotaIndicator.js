'use client';

import { useQuota } from '@/contexts/QuotaContext';
import Link from 'next/link';

/**
 * QuotaIndicator
 * Menampilkan sisa kuota user dalam bentuk progress bar mini (dark mode).
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

  // Warna berubah sesuai sisa kuota
  const barColor =
    pct > 50 ? 'bg-emerald-500' :
    pct > 20 ? 'bg-amber-400' :
    'bg-rose-500';

  const barGlow =
    pct > 50 ? '0 0 8px rgba(16, 185, 129, 0.60)' :
    pct > 20 ? '0 0 8px rgba(245, 158, 11, 0.60)' :
    '0 0 8px rgba(244, 63, 94, 0.60)';

  const textColor =
    pct > 50 ? 'text-emerald-400' :
    pct > 20 ? 'text-amber-400' :
    'text-rose-400';

  const tierBadgeClass =
    profile.tier === 'PRO'
      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
      : profile.tier === 'ENTERPRISE'
      ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
      : 'bg-card-hover text-muted border border-[var(--border-default)]';

  // ── Compact Mode (untuk Header) ──────────────────────────────
  if (compact) {
    return (
      <div className="flex items-center gap-2.5">
        <div className="text-right">
          <p className="text-[10px] text-muted">Kuota</p>
          <p className={`text-xs font-semibold ${textColor}`}>
            {profile.quota_balance.toLocaleString('id-ID')} unit
          </p>
        </div>
        <div className="w-14 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-default)' }}>
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{
              width: `${Math.min(pct, 100)}%`,
              boxShadow: barGlow,
            }}
          />
        </div>
      </div>
    );
  }

  // ── Full Mode (untuk Sidebar) ─────────────────────────────────
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
          {profile.tier}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-default)' }}>
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{
            width: `${Math.min(pct, 100)}%`,
            boxShadow: barGlow,
          }}
        />
      </div>

      {/* Numbers */}
      <div className="flex items-center justify-between">
        <p className={`text-[11px] font-semibold ${textColor}`}>
          {profile.quota_balance.toLocaleString('id-ID')} unit
        </p>
        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
          / {profile.quota_limit.toLocaleString('id-ID')}
        </p>
      </div>

      {/* Top-up Alert */}
      {pct <= 20 && (
        <Link
          href="/pricing"
          className="block w-full text-center py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[11px] font-medium text-rose-400 hover:bg-rose-500/15 transition-colors"
        >
          ⚡ Top-up Kuota
        </Link>
      )}
    </div>
  );
}
