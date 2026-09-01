'use client';

import { useState, useEffect } from 'react';
import { useQuota } from '@/contexts/QuotaContext';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';
import { Sparkles, ShieldCheck, AlertCircle, ArrowRight, X, Clock, RefreshCw } from 'lucide-react';

export default function TrialBanner({ className = '', dismissible = false }) {
  const { profile, fetchQuota } = useQuota();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [offerDismissed, setOfferDismissed] = useState(false);
  const [expiredDismissed, setExpiredDismissed] = useState(false);
  const [renewalDismissed, setRenewalDismissed] = useState(false);

  useEffect(() => {
    setMounted(true);
    setOfferDismissed(localStorage.getItem('athena_trial_offer_dismissed') === 'true');
    setExpiredDismissed(localStorage.getItem('athena_trial_expired_dismissed') === 'true');
    setRenewalDismissed(localStorage.getItem('athena_renewal_warning_dismissed') === 'true');
  }, []);

  const handleDismissOffer = () => {
    localStorage.setItem('athena_trial_offer_dismissed', 'true');
    setOfferDismissed(true);
    toast.info('Penawaran trial disembunyikan.');
  };

  const handleDismissExpired = () => {
    localStorage.setItem('athena_trial_expired_dismissed', 'true');
    setExpiredDismissed(true);
    toast.info('Pemberitahuan trial berakhir disembunyikan.');
  };

  const handleDismissRenewal = () => {
    localStorage.setItem('athena_renewal_warning_dismissed', 'true');
    setRenewalDismissed(true);
    toast.info('Peringatan masa aktif disembunyikan.');
  };

  if (!mounted || !profile) return null;

  // ══════════════════════════════════════════════════════════════════
  // KASUS 1 & 2: PENGGUNA FREE TIER (Penawaran Trial / Trial Expired)
  // ══════════════════════════════════════════════════════════════════
  if (profile.tier === 'FREE') {
    const hasTrialActivated = profile.quota_expiry !== null;
    const isTrialActive = profile.is_trial_active;
    const isTrialExpired = profile.is_trial_expired;

    // Jika trial sedang aktif, tidak perlu banner iklan
    if (isTrialActive) return null;

    // Handler untuk mengaktifkan trial premium
    const handleActivateTrial = async () => {
      if (loading) return;
      try {
        setLoading(true);
        toast.info('Mengaktifkan trial premium...');
        
        const res = await fetch('/api/quota/trial/activate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Gagal mengaktifkan trial.');
        }

        toast.success('Selamat! Trial Premium 30 Hari Anda telah aktif.');
        await fetchQuota();
      } catch (err) {
        console.error('Error activating trial:', err);
        toast.error(err.message || 'Terjadi kesalahan saat mengaktifkan trial.');
      } finally {
        setLoading(false);
      }
    };

    // 1A. Pengguna FREE belum pernah aktivasi trial
    if (!hasTrialActivated) {
      if (dismissible && offerDismissed) return null;
      return (
        <div className={className}>
          <div 
            className="relative overflow-hidden rounded-3xl border p-5 sm:p-6 shadow-md transition-all duration-300 hover:border-indigo-500/30"
            style={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.03) 100%)',
              borderColor: 'var(--border-default)',
            }}
          >
            {dismissible && (
              <button
                onClick={handleDismissOffer}
                className="absolute top-3.5 right-3.5 p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/5 active:scale-90 transition-all select-none cursor-pointer z-20"
                title="Sembunyikan penawaran"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <div className="absolute right-0 top-0 w-32 h-32 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10 pr-6 sm:pr-0">
              <div className="space-y-2 flex-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  Penawaran Khusus Pengguna Baru
                </div>
                <h3 className="text-base font-extrabold text-primary flex items-center gap-2">
                  Cobalah Fitur Premium Athena Shield Gratis!
                </h3>
                <p className="text-xs text-secondary leading-relaxed max-w-2xl">
                  Dapatkan akses ke fitur Auto-Moderasi otomatis (tiap 2 menit), Bulk Moderation (massal), dan Ekspor Riwayat CSV selama 30 hari penuh dengan kuota 1.000 unit lifetime Anda.
                </p>
              </div>

              <button
                onClick={handleActivateTrial}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/25 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer flex-shrink-0"
              >
                {loading ? (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
                Aktifkan Trial 30 Hari
              </button>
            </div>
          </div>
        </div>
      );
    }

    // 1B. Trial FREE sudah habis
    if (isTrialExpired) {
      if (dismissible && expiredDismissed) return null;
      return (
        <div className={className}>
          <div 
            className="relative overflow-hidden rounded-3xl border p-5 sm:p-6 shadow-md transition-all duration-300 hover:border-rose-500/30"
            style={{
              background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.05) 0%, rgba(244, 63, 94, 0.01) 100%)',
              borderColor: 'var(--border-default)',
            }}
          >
            {dismissible && (
              <button
                onClick={handleDismissExpired}
                className="absolute top-3.5 right-3.5 p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/5 active:scale-90 transition-all select-none cursor-pointer z-20"
                title="Sembunyikan pemberitahuan"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10 pr-6 sm:pr-0">
              <div className="space-y-2 flex-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-bold uppercase tracking-wider">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Trial Selesai
                </div>
                <h3 className="text-base font-extrabold text-primary">
                  Masa Trial Fitur Premium Anda Telah Berakhir
                </h3>
                <p className="text-xs text-secondary leading-relaxed max-w-2xl">
                  Fitur moderasi otomatis latar belakang dan bulk action kini terjeda. Tingkatkan ke paket **PRO** untuk membuka kapasitas kuota lebih besar dan menjaga saluran YouTube terlindungi 24/7.
                </p>
              </div>

              <Link
                href="/pricing"
                className="flex items-center justify-center gap-1.5 px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/10 hover:shadow-rose-600/25 active:scale-95 select-none cursor-pointer flex-shrink-0"
              >
                Upgrade ke PRO
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      );
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // KASUS 3 & 4: PENGGUNA BERBAYAR (PRO & ENTERPRISE)
  // Peringatan Masa Aktif Mendekati Habis (H-7 s/d H-0) atau Expired
  // ══════════════════════════════════════════════════════════════════
  if (profile.tier === 'PRO' || profile.tier === 'ENTERPRISE') {
    if (!profile.quota_expiry) return null;

    const expiryDate = new Date(profile.quota_expiry);
    const now = new Date();
    const diffTime = expiryDate - now;
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // 3A. Paket sudah kedaluwarsa (Expired)
    if (daysLeft < 0) {
      if (dismissible && expiredDismissed) return null;
      return (
        <div className={className}>
          <div 
            className="relative overflow-hidden rounded-3xl border border-rose-500/30 p-5 sm:p-6 shadow-md"
            style={{
              background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.08) 0%, rgba(244, 63, 94, 0.02) 100%)',
            }}
          >
            {dismissible && (
              <button
                onClick={handleDismissExpired}
                className="absolute top-3.5 right-3.5 p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/5 active:scale-90 transition-all select-none cursor-pointer z-20"
                title="Sembunyikan peringatan"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10 pr-6 sm:pr-0">
              <div className="space-y-2 flex-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-bold uppercase tracking-wider">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Langganan Kedaluwarsa
                </div>
                <h3 className="text-base font-extrabold text-primary">
                  Masa Aktif Paket {profile.tier} Telah Berakhir
                </h3>
                <p className="text-xs text-secondary leading-relaxed max-w-2xl">
                  Layanan moderasi otomatis dan kuota langganan Anda dijeda. Segera lakukan perpanjangan agar sistem langsung aktif kembali secara otomatis.
                </p>
              </div>

              <Link
                href="/pricing"
                className="flex items-center justify-center gap-1.5 px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/10 hover:shadow-rose-600/25 active:scale-95 select-none cursor-pointer flex-shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Perpanjang Langganan
              </Link>
            </div>
          </div>
        </div>
      );
    }

    // 3B. Paket mendekati kedaluwarsa (<= 7 hari)
    if (daysLeft <= 7) {
      if (dismissible && renewalDismissed) return null;

      const isUrgent = daysLeft <= 2;
      const formattedDate = expiryDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

      return (
        <div className={className}>
          <div 
            className={`relative overflow-hidden rounded-3xl border p-5 sm:p-6 shadow-md transition-all duration-300 ${
              isUrgent ? 'border-rose-500/40' : 'border-amber-500/40'
            }`}
            style={{
              background: isUrgent
                ? 'linear-gradient(135deg, rgba(244, 63, 94, 0.08) 0%, rgba(245, 158, 11, 0.03) 100%)'
                : 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(99, 102, 241, 0.03) 100%)',
            }}
          >
            {dismissible && (
              <button
                onClick={handleDismissRenewal}
                className="absolute top-3.5 right-3.5 p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/5 active:scale-90 transition-all select-none cursor-pointer z-20"
                title="Sembunyikan peringatan"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10 pr-6 sm:pr-0">
              <div className="space-y-2 flex-1">
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  isUrgent 
                    ? 'bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 animate-pulse'
                    : 'bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400'
                }`}>
                  <Clock className="w-3.5 h-3.5" />
                  {daysLeft === 0 ? 'Berakhir Hari Ini!' : `Masa Aktif Tersisa ${daysLeft} Hari (${formattedDate})`}
                </div>
                <h3 className="text-base font-extrabold text-primary">
                  Perpanjang Paket {profile.tier} Anda Sebelum Berakhir
                </h3>
                <p className="text-xs text-secondary leading-relaxed max-w-2xl">
                  Perpanjangan sebelum jatuh tempo akan <strong>mengakumulasikan sisa masa aktif</strong> dan menggabungkan sisa kuota moderasi Anda tanpa hangus.
                </p>
              </div>

              <Link
                href="/pricing"
                className={`flex items-center justify-center gap-1.5 px-5 py-3 rounded-2xl text-white text-xs font-bold transition-all shadow-md active:scale-95 select-none cursor-pointer flex-shrink-0 ${
                  isUrgent
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/15'
                    : 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/15'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Perpanjang Sekarang
              </Link>
            </div>
          </div>
        </div>
      );
    }
  }

  return null;
}
