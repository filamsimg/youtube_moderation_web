'use client';

import { useState } from 'react';
import { useQuota } from '@/contexts/QuotaContext';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';
import { Sparkles, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';

export default function TrialBanner() {
  const { profile, fetchQuota } = useQuota();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  // Jika profil belum siap, atau user bukan FREE tier, tidak usah tampilkan banner
  if (!profile || profile.tier !== 'FREE') return null;

  const hasTrialActivated = profile.quota_expiry !== null;
  const isTrialActive = profile.is_trial_active;
  const isTrialExpired = profile.is_trial_expired;

  // Jika trial sedang aktif, tidak perlu menampilkan banner iklan/aktifkan di tengah konten
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
      // Refresh quota profile agar feature flags ter-update di seluruh aplikasi
      await fetchQuota();
    } catch (err) {
      console.error('Error activating trial:', err);
      toast.error(err.message || 'Terjadi kesalahan saat mengaktifkan trial.');
    } finally {
      setLoading(false);
    }
  };

  // KONDISI 1: Pengguna FREE belum pernah mengaktifkan trial
  if (!hasTrialActivated) {
    return (
      <div 
        className="relative overflow-hidden rounded-3xl border p-5 sm:p-6 shadow-md transition-all duration-300 hover:border-indigo-500/30"
        style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.03) 100%)',
          borderColor: 'var(--border-default)',
        }}
      >
        {/* Background Decorative Glow */}
        <div className="absolute right-0 top-0 w-32 h-32 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute left-10 bottom-0 w-24 h-24 rounded-full bg-purple-500/5 blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
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
    );
  }

  // KONDISI 2: Masa trial sudah kedaluwarsa
  if (isTrialExpired) {
    return (
      <div 
        className="relative overflow-hidden rounded-3xl border p-5 sm:p-6 shadow-md transition-all duration-300 hover:border-rose-500/30"
        style={{
          background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.05) 0%, rgba(244, 63, 94, 0.01) 100%)',
          borderColor: 'var(--border-default)',
        }}
      >
        <div className="absolute right-0 top-0 w-32 h-32 rounded-full bg-rose-500/5 blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 flex-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-bold uppercase tracking-wider">
              <AlertCircle className="w-3.5 h-3.5" />
              Trial Selesai
            </div>
            <h3 className="text-base font-extrabold text-primary">
              Masa Trial Fitur Premium Anda Telah Berakhir
            </h3>
            <p className="text-xs text-secondary leading-relaxed max-w-2xl">
              Fitur moderasi otomatis latar belakang, bulk action, dan ekspor data kini terkunci. Sisa kuota Anda tetap aman untuk moderasi manual. Tingkatkan ke paket **PRO** untuk mengaktifkan kembali seluruh fitur otomatisasi.
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
    );
  }

  return null;
}
