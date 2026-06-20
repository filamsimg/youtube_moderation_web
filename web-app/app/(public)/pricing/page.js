'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useQuota } from '@/contexts/QuotaContext';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';
import Script from 'next/script';
import KineticGrid from '@/components/KineticGrid';

// =========================================================================
// DEFINISI PAKET LANGGANAN & TOP-UP (Sesuai Konfigurasi Keamanan Sisi Server)
// =========================================================================
// DEFINISI PAKET LANGGANAN SECARA DINAMIS (Sesuai Konfigurasi Keamanan Sisi Server)
// TOP_UP_PACKAGES is now loaded dynamically from the database.

const COST_TABLE = [
  { action: 'Ambil Daftar Video', api: 'playlistItems.list', cost: 1 },
  { action: 'Ambil Komentar (100 komentar)', api: 'commentThreads.list', cost: 1 },
  { action: 'Moderasi Komentar (Single)', api: 'setModerationStatus', cost: 50 },
  { action: 'Moderasi Batch', api: 'setModerationStatus (batch)', cost: 50 },
  { action: 'Polling Auto-refresh', api: 'List call per siklus', cost: 1 },
];

const topupColorMap = {
  emerald: {
    btn: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:shadow-[0_0_20px_rgba(16,185,129,0.35)]',
    badge: 'border-emerald-500/30 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10',
    icon: 'text-emerald-600 dark:text-emerald-400',
  },
  blue: {
    btn: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-[0_0_20px_rgba(59,130,246,0.35)]',
    badge: 'border-blue-500/30 text-blue-700 dark:text-blue-400 bg-blue-500/10',
    icon: 'text-blue-600 dark:text-blue-400',
  },
  violet: {
    btn: 'bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:shadow-[0_0_20px_rgba(124,58,237,0.35)]',
    badge: 'border-violet-500/30 text-violet-700 dark:text-violet-400 bg-violet-500/10',
    icon: 'text-violet-600 dark:text-violet-400',
  },
};

export default function PricingPage() {
  const { data: session } = useSession();
  const { profile, loading: loadingProfile, fetchQuota } = useQuota();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('plans');
  const [billingCycle, setBillingCycle] = useState('1M'); // '1M' | '3M' | '6M' | '12M'
  const [loadingTx, setLoadingTx] = useState(null);

  const [plans, setPlans] = useState([]);
  const [topups, setTopups] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(true);

  const formatIDR = (num) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  useEffect(() => {
    async function loadPackages() {
      try {
        const response = await fetch('/api/plans');
        const json = await response.json();
        if (json.success) {
          setPlans(json.plans);
          setTopups(json.topups);
        } else {
          toast.error(json.error || 'Gagal memuat paket pricing');
        }
      } catch (error) {
        console.error('Fetch pricing error:', error);
        toast.error('Koneksi internet bermasalah');
      } finally {
        setLoadingPackages(false);
      }
    }
    loadPackages();
  }, [toast]);

  const multipliers = {
    '1M': { label: 'bulan', days: 30, discount: 0, textSuffix: '/ bulan' },
    '3M': { label: '3 bulan', days: 90, discount: 5, textSuffix: '/ 3 bulan' },
    '6M': { label: '6 bulan', days: 180, discount: 10, textSuffix: '/ 6 bulan' },
    '12M': { label: 'tahun', days: 360, discount: 20, textSuffix: '/ tahun' }
  };

  const cycleInfo = multipliers[billingCycle] || multipliers['1M'];

  const PLANS = plans
    .filter(plan => plan.tier === 'FREE' || plan.billing_cycle === billingCycle)
    .map(plan => {
      const isFree = plan.tier === 'FREE';
      return {
        key: plan.id,
        name: plan.name,
        price: plan.price === 0 ? 'Rp 0' : formatIDR(plan.price),
        period: isFree ? 'Sekali Pakai' : cycleInfo.textSuffix,
        quota: plan.tier === 'ENTERPRISE' ? 'Bebas Kuota YouTube*' : plan.quota_units.toLocaleString('id-ID'),
        quotaNum: plan.quota_units,
        description: plan.description,
        features: plan.features || [],
        disabled: plan.disabled_features || [],
        cta: isFree ? 'Paket Saat Ini' : `Pilih ${plan.name} (${cycleInfo.label === 'bulan' ? '1 Bulan' : cycleInfo.label === 'tahun' ? '1 Tahun' : billingCycle.replace('M', ' Bulan')})`,
        badge: plan.badge,
        tier: plan.tier,
        originalPrice: plan.original_price ? formatIDR(plan.original_price) : null,
        savedAmount: plan.original_price && plan.original_price > plan.price ? formatIDR(plan.original_price - plan.price) : null,
      };
    });

  const TOP_UP_PACKAGES = topups.map(pkg => ({
    key: pkg.id,
    units: pkg.quota_units,
    price: formatIDR(pkg.price),
    label: pkg.name,
    color: pkg.color || 'blue',
    badge: pkg.badge
  }));

  // Menangani inisialisasi checkout pembayaran Midtrans Snap (Aman & Server-Verified)
  const handlePurchase = async (packageId) => {
    if (!session?.user?.email) {
      toast.error('Anda harus login terlebih dahulu untuk melakukan pembayaran.');
      return;
    }

    if (loadingTx) return;

    try {
      setLoadingTx(packageId);
      toast.info('Menghubungkan ke sistem pembayaran simulasi (Uji Coba)...');

      // 1. Dapatkan Snap Token dari server (Server-side price check)
      const res = await fetch('/api/payment/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ packageId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal inisialisasi checkout');

      const { token, orderId, resumed } = data;
      
      if (resumed) {
        toast.info('Melanjutkan transaksi sebelumnya yang belum selesai...');
      }

      // 2. Luncurkan Popup Midtrans Snap di browser
      if (window.snap) {
        window.snap.pay(token, {
          onSuccess: async function (result) {
            console.log('Sandbox Success:', result);
            toast.success('Pembayaran sukses! Menambahkan kuota Anda secara instan.');

            // Simulasikan pemicu webhook instan agar database lokal terupdate (Sandbox Demo Helper)
            await syncPaymentStatus(orderId, packageId);

            setTimeout(() => {
              fetchQuota();
            }, 1000);
          },
          onPending: function (result) {
            toast.warning('Pembayaran ditunda. Silakan selesaikan transaksi Anda di halaman simulasi pembayaran (gratis/uji coba).');
          },
          onError: function (result) {
            toast.error('Pembayaran gagal. Silakan coba kembali.');
          },
          onClose: function () {
            toast.info('Menu pembayaran ditutup.');
          },
        });
      } else {
        throw new Error('SDK Midtrans Snap gagal dimuat. Pastikan koneksi internet aktif.');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      toast.error(err.message || 'Gagal memproses inisialisasi pembayaran.');
    } finally {
      setLoadingTx(null);
    }
  };

  // Sandbox demo helper: Bypass localhost untuk webhook local agar demo skripsi lancar tanpa ngrok
  // Mengambil harga secara dinamis dari SECURE_PACKAGES (checkout route) agar tidak hardcode
  const syncPaymentStatus = async (orderId, packageId) => {
    try {
      // Lookup harga secara dinamis dari state paket yang dimuat
      const matchedPkg = [...plans, ...topups].find(p => p.id === packageId);
      const mockAmount = matchedPkg ? matchedPkg.price : 15000;

      await fetch('/api/payment/notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id: orderId,
          status_code: '200',
          gross_amount: mockAmount.toString(),
          transaction_status: 'settlement',
          fraud_status: 'accept',
          signature_key: 'mock-local-bypass-signature',
        }),
      });
    } catch (e) {
      console.warn('Gagal memicu sinkronisasi status lokal:', e);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
      {/* Memuat Midtrans Snap SDK (Sandbox Environment) */}
      <Script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        strategy="lazyOnload"
      />

      {/* ── Background Effects ── */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-500/10 dark:bg-indigo-950/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-500/10 dark:bg-purple-950/5 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-mesh-dark opacity-[0.06] dark:opacity-40 dark:mix-blend-screen" />
        <KineticGrid />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto space-y-10 animate-fade-in-up">
        {/* ── Page Header ──────────────────────────────────────── */}
        <div className="text-center space-y-3 pt-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-2 shadow-sm">
            ⚡ Kelola Kuota API
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-primary tracking-tight">
            Pilih Paket Terbaik untuk Menjaga Kanal Anda
          </h1>
          <p className="text-sm text-secondary max-w-xl mx-auto leading-relaxed">
            Kelola kuota moderasi sistem Anda. Setiap tindakan pemeriksaan atau penghapusan komentar akan mengurangi jatah poin dari YouTube.
          </p>

          {/* Current Quota Status Badge */}
          {!loadingProfile && profile && (
            <div className="inline-flex items-center gap-4 mt-4 px-5 py-3 rounded-2xl border border-[var(--border-default)] bg-card/60 backdrop-blur-md shadow-sm">
              <div className="text-left">
                <p className="text-[10px] text-secondary uppercase tracking-wider font-semibold">Sisa Kuota Anda</p>
                <p className="text-sm font-bold text-primary mt-0.5">
                  {profile.quota_balance.toLocaleString('id-ID')}
                  <span className="text-xs font-normal text-muted"> / {profile.quota_limit.toLocaleString('id-ID')} unit</span>
                </p>
              </div>
              <div className="w-20 h-1.5 rounded-full overflow-hidden bg-[var(--border-default)]">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    profile.percentage > 50 ? 'bg-emerald-500' :
                    profile.percentage > 20 ? 'bg-amber-400' : 'bg-rose-500'
                  }`}
                  style={{ width: `${profile.percentage}%` }}
                />
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${
                profile.tier === 'PRO' ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400' :
                profile.tier === 'ENTERPRISE' ? 'bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-400' :
                'bg-card-hover text-muted border-[var(--border-default)]'
              }`}>
                {profile.tier}
              </span>
            </div>
          )}
        </div>

        {/* ── Tab Switcher ─────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex bg-card/60 backdrop-blur-md border border-[var(--border-default)] rounded-2xl p-1 gap-1 shadow-sm">
            {[
              { key: 'plans', label: 'Paket Langganan' },
              { key: 'topup', label: 'Top-up Kredit' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  activeTab === tab.key
                    ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/35 dark:border-indigo-500/50 shadow-sm'
                    : 'text-secondary hover:text-primary hover:bg-card-hover/50 border border-transparent'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Billing Cycle Switcher ── */}
          {activeTab === 'plans' && (
            <div className="flex flex-col items-center gap-2.5 select-none w-full">
              <div className="flex bg-slate-500/5 backdrop-blur-md border border-[var(--border-default)]/40 rounded-2xl p-1 gap-1.5 max-w-full overflow-x-auto shadow-sm">
                {[
                  { key: '1M', label: '1 Bulan' },
                  { key: '3M', label: '3 Bulan' },
                  { key: '6M', label: '6 Bulan' },
                  { key: '12M', label: '1 Tahun' },
                ].map(cycle => (
                  <button
                    key={cycle.key}
                    onClick={() => setBillingCycle(cycle.key)}
                    className={`px-4 py-1.5 rounded-xl text-[10px] sm:text-xs font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap border border-transparent ${
                      billingCycle === cycle.key
                        ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/25 dark:border-indigo-500/35 shadow-sm'
                        : 'text-secondary hover:text-primary hover:bg-card-hover'
                    }`}
                  >
                    {cycle.label}
                  </button>
                ))}
              </div>
              
              {/* Google One style hemat notice */}
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 min-h-[18px] animate-fade-in text-center">
                {billingCycle === '1M' ? (
                  '💡 Pilih paket jangka panjang untuk hemat hingga 20%!'
                ) : billingCycle === '3M' ? (
                  '🎉 Hemat 5% jika Anda memilih paket 3 Bulan'
                ) : billingCycle === '6M' ? (
                  '💎 Hemat 10% jika Anda memilih paket 6 Bulan'
                ) : (
                  '🚀 Hemat 20% jika Anda memilih paket 1 Tahun (Diskon Terbesar)'
                )}
              </p>
            </div>
          )}
        </div>

        {loadingPackages ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-xs text-secondary">Memuat paket pricing...</p>
          </div>
        ) : (
          <>
            {/* ── PLANS TAB ────────────────────────────────────────── */}
            {activeTab === 'plans' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((plan) => {
              const isCurrentTier = profile?.tier === plan.tier;
              const isFree = plan.tier === 'FREE';
              const isPro = plan.tier === 'PRO';
              const isEnterprise = plan.tier === 'ENTERPRISE';

              return (
                <div
                  key={plan.key}
                  className={`relative flex flex-col gap-6 p-6 rounded-3xl transition-all duration-300 border backdrop-blur-md ${
                    isPro 
                      ? 'bg-card/75 bg-gradient-to-b from-indigo-500/10 to-indigo-500/[0.02] border-indigo-500/35 shadow-[0_0_30px_rgba(99,102,241,0.12)]' 
                      : isEnterprise
                        ? 'bg-card/75 bg-gradient-to-b from-purple-500/10 to-purple-500/[0.02] border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.08)]'
                        : 'bg-card/60 border-[var(--border-default)]'
                  } ${isCurrentTier ? 'ring-2 ring-indigo-500/40' : ''}`}
                >
                  {/* Popular Badge */}
                  {plan.badge && (
                    <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold border shadow-sm ${
                      isPro
                        ? 'text-indigo-700 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/30'
                        : 'text-purple-700 dark:text-purple-400 bg-purple-500/10 border-purple-500/30'
                    }`}>
                      {plan.badge}
                    </div>
                  )}

                  {/* Plan Header */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-lg font-bold ${isPro ? 'text-indigo-700 dark:text-indigo-300' : isEnterprise ? 'text-purple-700 dark:text-purple-300' : 'text-primary'}`}>
                        {plan.name}
                      </span>
                      {isCurrentTier && (
                        <span className="bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 dark:border-emerald-500/30 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
                          Aktif
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-secondary leading-relaxed">{plan.description}</p>
                  </div>

                   {/* Price */}
                  <div className="border-y py-4 border-[var(--border-default)]/40 my-1">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span className="text-3xl font-extrabold text-primary">{plan.price}</span>
                        <span className="text-xs text-secondary">{plan.period}</span>
                        {plan.originalPrice && (
                          <span className="text-xs sm:text-sm text-dimmed line-through decoration-1 opacity-75">
                            {plan.originalPrice}
                          </span>
                        )}
                      </div>
                      {plan.savedAmount && (
                        <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                          Hemat {plan.savedAmount}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-indigo-700 dark:text-indigo-400 font-semibold mt-2.5 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-indigo-700 dark:text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                      </svg>
                      Jatah: {plan.quota} unit API
                    </p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 flex-1">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2.5 text-xs text-secondary">
                        <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        <span className="leading-tight">{f}</span>
                      </li>
                    ))}
                    {plan.disabled.map(f => (
                      <li key={f} className="flex items-start gap-2.5 text-xs text-muted/60">
                        <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-muted/40" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span className="leading-tight">{f}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <button
                    disabled={isCurrentTier || isFree || loadingTx !== null}
                    onClick={() => handlePurchase(plan.key)}
                    className={`relative overflow-hidden w-full py-3 rounded-2xl text-xs font-bold transition-all duration-300 cursor-pointer select-none ${
                      isCurrentTier || isFree
                        ? 'bg-card-hover text-muted cursor-default border border-[var(--border-default)]'
                        : isPro
                          ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:shadow-[0_0_24px_rgba(99,102,241,0.45)] hover:-translate-y-0.5 active:scale-98'
                          : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:shadow-[0_0_24px_rgba(168,85,247,0.4)] hover:-translate-y-0.5 active:scale-98'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {!isCurrentTier && !isFree && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700" />
                    )}
                    <span className="relative">
                      {loadingTx === plan.key ? (
                        <span className="flex items-center justify-center gap-1.5">
                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Inisialisasi...
                        </span>
                      ) : isCurrentTier ? (
                        '✓ Paket Aktif Anda'
                      ) : (
                        plan.cta
                      )}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* ── TOP-UP TAB ───────────────────────────────────────── */}
        {activeTab === 'topup' && (
          <div className="space-y-6">
            <p className="text-center text-xs text-secondary max-w-xl mx-auto leading-relaxed">
              Beli paket kredit sekali bayar. Kredit top-up bersifat permanen — <strong className="text-emerald-700 dark:text-emerald-400">tidak akan hangus</strong> meskipun masa aktif langganan Anda habis.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {TOP_UP_PACKAGES.map((pkg) => {
                const c = topupColorMap[pkg.color];
                const isBlue = pkg.color === 'blue';
                const isEmerald = pkg.color === 'emerald';

                return (
                  <div 
                    key={pkg.units} 
                    className={`relative flex flex-col gap-5 p-6 rounded-3xl transition-all duration-300 border backdrop-blur-md ${
                      isEmerald 
                        ? 'bg-card/75 bg-gradient-to-b from-emerald-500/10 to-emerald-500/[0.02] border-emerald-500/30 shadow-[0_0_25px_rgba(16,185,129,0.04)]'
                        : isBlue
                          ? 'bg-card/75 bg-gradient-to-b from-blue-500/10 to-blue-500/[0.02] border-blue-500/30 shadow-[0_0_25px_rgba(59,130,246,0.08)]'
                          : 'bg-card/75 bg-gradient-to-b from-violet-500/10 to-violet-500/[0.02] border-violet-500/30 shadow-[0_0_25px_rgba(139,92,246,0.04)]'
                    }`}
                  >
                    {pkg.badge && (
                      <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold border shadow-sm ${
                        isBlue ? 'text-blue-700 dark:text-blue-400 bg-blue-500/10 border-blue-500/30' : ''
                      }`}>
                        {pkg.badge}
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-semibold text-secondary uppercase tracking-wider">{pkg.label}</p>
                      <p className="text-2xl font-extrabold text-primary mt-1">{pkg.price}</p>
                    </div>
                    <div className={`flex items-center gap-1.5 text-sm font-semibold ${c.icon}`}>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                      </svg>
                      {pkg.units.toLocaleString('id-ID')} Unit
                    </div>
                    <button
                      disabled={loadingTx !== null}
                      className={`relative overflow-hidden w-full py-3 rounded-2xl text-xs font-bold transition-all duration-300 hover:-translate-y-0.5 active:scale-98 cursor-pointer select-none ${c.btn} disabled:opacity-50 disabled:cursor-not-allowed`}
                      onClick={() => handlePurchase(pkg.key)}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700" />
                      <span className="relative">
                        {loadingTx === pkg.key ? (
                          <span className="flex items-center justify-center gap-1.5">
                            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Inisialisasi...
                          </span>
                        ) : (
                          'Beli Sekarang'
                        )}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
          </>
        )}

        {/* ── Tabel Biaya API ──────────────────────────────────── */}
        <div className="border border-[var(--border-default)]/60 bg-card/50 backdrop-blur-md rounded-3xl p-6 space-y-4 shadow-sm">
          <div>
            <h2 className="text-base font-bold text-primary">Panduan Konsumsi Jatah Poin</h2>
            <p className="text-xs text-secondary mt-0.5">Setiap tindakan pemeriksaan atau penghapusan komentar akan memotong jatah poin Anda.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border-default)' }}>
                  <th className="py-2.5 text-left font-bold text-secondary uppercase tracking-wider text-[10px]">Tindakan</th>
                  <th className="py-2.5 text-left font-bold text-secondary uppercase tracking-wider text-[10px]">Nama Teknis YouTube</th>
                  <th className="py-2.5 text-right font-bold text-secondary uppercase tracking-wider text-[10px]">Konsumsi Poin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-default)]/45">
                {COST_TABLE.map((row) => (
                  <tr key={row.action} className="hover:bg-card-hover/30 transition-colors">
                    <td className="py-3 text-primary font-semibold">{row.action}</td>
                    <td className="py-3 text-secondary font-mono text-[10px] opacity-75">{row.api}</td>
                    <td className="py-3 text-right">
                      <span className={`font-bold px-2 py-0.5 rounded-md ${
                        row.cost >= 50 ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/10' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/10'
                      }`}>
                        {row.cost} unit
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-muted opacity-80">* Batas gratis YouTube API: 10.000 unit/hari per project Google Cloud.</p>
        </div>

        {/* Footer Note */}
        <p className="text-center text-[11px] text-muted bg-card/30 backdrop-blur-sm border border-[var(--border-default)]/40 rounded-2xl py-3 px-4 max-w-3xl mx-auto">
          *Gunakan Kunci Akses Sendiri (Gratis): Anda bisa membuat dan menggunakan Kunci Akses YouTube (API Key) milik Anda sendiri dari Google untuk menikmati penyaringan tanpa batasan. Dapat dikonfigurasi di{' '}
          <Link href="/preferensi" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-300 hover:underline font-semibold">
            Preferensi
          </Link>.
        </p>
      </div>
    </div>
  );
}
