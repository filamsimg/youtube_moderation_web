'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

/**
 * QuotaIndicator
 * Menampilkan sisa kuota user dalam bentuk progress bar mini.
 * Dipanggil dari Sidebar dan Header.
 */
export default function QuotaIndicator({ compact = false }) {
  const { data: session } = useSession();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!session?.user?.email) return;
    try {
      const res = await fetch('/api/quota/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (err) {
      console.error('QuotaIndicator fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.email]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Listen untuk event custom dari halaman lain saat kuota berubah
  useEffect(() => {
    const handler = () => fetchProfile();
    window.addEventListener('quota-updated', handler);
    return () => window.removeEventListener('quota-updated', handler);
  }, [fetchProfile]);

  if (loading || !profile) {
    return compact ? null : (
      <div className="h-4 w-full bg-gray-100 rounded-full animate-pulse" />
    );
  }

  const pct = profile.percentage;

  // Warna berubah sesuai sisa kuota
  const barColor =
    pct > 50 ? 'bg-emerald-500' :
    pct > 20 ? 'bg-amber-400' :
    'bg-red-500';

  const textColor =
    pct > 50 ? 'text-emerald-600' :
    pct > 20 ? 'text-amber-600' :
    'text-red-600';

  const tierBadgeColor =
    profile.tier === 'PRO' ? 'bg-amber-100 text-amber-700' :
    profile.tier === 'ENTERPRISE' ? 'bg-amber-100 text-amber-700' :
    'bg-gray-100 text-gray-500';

  // ── Mode Compact (untuk Header) ──────────────────────────────────────────
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="text-right">
          <p className="text-[10px] text-gray-400">Kuota</p>
          <p className={`text-xs font-semibold ${textColor}`}>
            {profile.quota_balance.toLocaleString('id-ID')} unit
          </p>
        </div>
        <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
      </div>
    );
  }

  // ── Mode Full (untuk Sidebar) ─────────────────────────────────────────────
  return (
    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
      {/* Header baris */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold text-gray-600">Kuota API</p>
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${tierBadgeColor}`}>
          {profile.tier}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>

      {/* Angka */}
      <div className="flex items-center justify-between">
        <p className={`text-[11px] font-medium ${textColor}`}>
          {profile.quota_balance.toLocaleString('id-ID')} unit tersisa
        </p>
        <p className="text-[10px] text-gray-400">
          / {profile.quota_limit.toLocaleString('id-ID')}
        </p>
      </div>

      {/* Alert jika kuota menipis */}
      {pct <= 20 && (
        <Link
          href="/pricing"
          className="block w-full text-center py-1.5 rounded-lg bg-red-50 border border-red-100 text-[11px] font-medium text-red-600 hover:bg-red-100 transition-colors"
        >
          ⚡ Top-up Kuota
        </Link>
      )}
    </div>
  );
}
