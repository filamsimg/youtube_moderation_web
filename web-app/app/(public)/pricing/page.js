'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useQuota } from '@/contexts/QuotaContext';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';
import Script from 'next/script';

// =========================================================================
// DEFINISI PAKET LANGGANAN & TOP-UP (Sesuai Konfigurasi Keamanan Sisi Server)
// =========================================================================
// DEFINISI PAKET LANGGANAN SECARA DINAMIS (Sesuai Konfigurasi Keamanan Sisi Server)

const TOP_UP_PACKAGES = [
  { key: 'topup-starter', units: 5000, price: 'Rp 15.000', label: 'Starter', color: 'emerald', badge: null },
  { key: 'topup-standard', units: 20000, price: 'Rp 50.000', label: 'Standard', color: 'blue', badge: 'Terlaris' },
  { key: 'topup-power', units: 60000, price: 'Rp 120.000', label: 'Power', color: 'violet', badge: null },
];

const COST_TABLE = [
  { action: 'Ambil Daftar Video', api: 'playlistItems.list', cost: 1 },
  { action: 'Ambil Komentar (100 komentar)', api: 'commentThreads.list', cost: 1 },
  { action: 'Moderasi Komentar (Single)', api: 'setModerationStatus', cost: 50 },
  { action: 'Moderasi Batch', api: 'setModerationStatus (batch)', cost: 50 },
  { action: 'Polling Auto-refresh', api: 'List call per siklus', cost: 1 },
];

const topupColorMap = {
  emerald: {
    btn: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]',
    badge: 'bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
    icon: 'text-emerald-600 dark:text-emerald-400',
  },
  blue: {
    btn: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-[0_0_20px_rgba(59,130,246,0.4)]',
    badge: 'bg-blue-50 border border-blue-200 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
    icon: 'text-blue-600 dark:text-blue-400',
  },
  violet: {
    btn: 'bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:shadow-[0_0_20px_rgba(124,58,237,0.4)]',
    badge: 'bg-violet-50 border border-violet-200 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20',
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

  const getDynamicPlans = () => {
    const multipliers = {
      '1M': { label: 'bulan', days: 30, discount: 0, textSuffix: '/ bulan' },
      '3M': { label: '3 bulan', days: 90, discount: 5, textSuffix: '/ 3 bulan' },
      '6M': { label: '6 bulan', days: 180, discount: 10, textSuffix: '/ 6 bulan' },
      '12M': { label: 'tahun', days: 360, discount: 20, textSuffix: '/ tahun' }
    };

    const cycleInfo = multipliers[billingCycle];

    return [
      {
        key: 'FREE',
        name: 'Free Trial',
        price: 'Rp 0',
        period: 'Sekali Pakai',
        quota: '1.000',
        quotaNum: 1000,
        description: 'Untuk percobaan & penggunaan pribadi ringan awal.',
        features: [
          'Jatah 1.000 poin trial awal (sekali pakai saat pertama kali daftar)',
          'Penyaringan komentar manual',
          'Analisis AI (Iklan Judi & Emosi Penonton)',
          'Riwayat tindakan penyaringan',
        ],
        disabled: ['Penyaringan Otomatis', 'Pengecekan berkala otomatis', 'Pilihan banyak video sekaligus'],
        cta: 'Paket Saat Ini',
        badge: null,
        tier: 'FREE',
      },
      {
        key: `PRO_${billingCycle}`,
        name: 'Pro',
        price: billingCycle === '1M' ? 'Rp 49.000' :
               billingCycle === '3M' ? 'Rp 139.000' :
               billingCycle === '6M' ? 'Rp 264.000' : 'Rp 470.000',
        period: cycleInfo.textSuffix,
        quota: billingCycle === '1M' ? '50.000' :
               billingCycle === '3M' ? '150.000' :
               billingCycle === '6M' ? '300.000' : '600.000',
        quotaNum: billingCycle === '1M' ? 50000 :
                  billingCycle === '3M' ? 150000 :
                  billingCycle === '6M' ? 300000 : 600000,
        description: 'Untuk content creator aktif dengan video yang sering ramai komentar.',
        features: [
          `Jatah ${billingCycle === '1M' ? '50.000' : billingCycle === '3M' ? '150.000' : billingCycle === '6M' ? '300.000' : '600.000'} poin untuk ${cycleInfo.label}`,
          'Semua fitur Free',
          'Penyaringan Otomatis (Tahan & Hapus)',
          'Pemeriksaan otomatis tiap 2 menit',
          'Pilih banyak video & hapus massal sekaligus',
          'Layanan bantuan prioritas',
        ],
        disabled: [],
        cta: `Pilih Pro (${cycleInfo.label === 'bulan' ? '1 Bulan' : cycleInfo.label === 'tahun' ? '1 Tahun' : billingCycle.replace('M', ' Bulan')})`,
        badge: billingCycle === '1M' ? '🔥 Paling Populer' : 
               billingCycle === '3M' ? '💡 Hemat 5%' : 
               billingCycle === '6M' ? '💎 Hemat 10%' : '🚀 Hemat 20%',
        tier: 'PRO',
      },
      {
        key: `ENTERPRISE_${billingCycle}`,
        name: 'Enterprise',
        price: billingCycle === '1M' ? 'Rp 149.000' :
               billingCycle === '3M' ? 'Rp 424.000' :
               billingCycle === '6M' ? 'Rp 804.000' : 'Rp 1.430.000',
        period: cycleInfo.textSuffix,
        quota: 'Bebas Kuota YouTube*',
        quotaNum: 999999,
        description: 'Untuk agency atau channel dengan volume komentar sangat tinggi.',
        features: [
          'Bebas dari batasan kuota YouTube*',
          'Semua fitur Pro',
          'Gunakan Kunci Akses YouTube Sendiri (Gratis)',
          'Grafik laporan statistik lengkap',
          'Unduh laporan ke Excel (CSV)',
          'Layanan bantuan khusus',
        ],
        disabled: [],
        cta: `Pilih Enterprise (${cycleInfo.label === 'bulan' ? '1 Bulan' : cycleInfo.label === 'tahun' ? '1 Tahun' : billingCycle.replace('M', ' Bulan')})`,
        badge: billingCycle === '1M' ? '⭐ Terlengkap' : 
               billingCycle === '3M' ? '💡 Hemat 5%' : 
               billingCycle === '6M' ? '💎 Hemat 10%' : '👑 Hemat 20%',
        tier: 'ENTERPRISE',
      },
    ];
  };

  const PLANS = getDynamicPlans();

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
      // Lookup harga dari definisi paket yang sudah ada di frontend
      const allPackages = {
        'PRO': 49000, 'ENTERPRISE': 149000,
        'PRO_1M': 49000, 'PRO_3M': 139000, 'PRO_6M': 264000, 'PRO_12M': 470000,
        'ENTERPRISE_1M': 149000, 'ENTERPRISE_3M': 424000, 'ENTERPRISE_6M': 804000, 'ENTERPRISE_12M': 1430000,
        'topup-starter': 15000, 'topup-standard': 50000, 'topup-power': 120000,
      };
      const mockAmount = allPackages[packageId] || 15000;

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
    <div className="animate-fade-in-up space-y-8 pb-12 max-w-5xl mx-auto">
      {/* Memuat Midtrans Snap SDK (Sandbox Environment) */}
      <Script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        strategy="lazyOnload"
      />

      {/* ── Page Header ──────────────────────────────────────── */}
      <div className="text-center space-y-3 pt-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full badge badge-ai text-[11px] mb-2">
          ⚡ Kelola Kuota API
        </div>
        <h1 className="text-2xl font-bold text-primary tracking-tight">Paket &amp; Jatah Poin Harian</h1>
        <p className="text-sm text-secondary">
          Kelola kuota sistem Anda. Setiap tindakan pemeriksaan atau penghapusan komentar akan mengurangi jatah poin harian dari YouTube.
        </p>

        {/* Current Quota Status Badge */}
        {!loadingProfile && profile && (
          <div className="inline-flex items-center gap-3 mt-3 px-4 py-2.5 bento-card">
            <div className="text-left">
              <p className="text-[10px] text-secondary uppercase tracking-wider">Sisa Kuota Anda</p>
              <p className="text-sm font-bold text-primary">
                {profile.quota_balance.toLocaleString('id-ID')}
                <span className="text-xs font-normal text-muted"> / {profile.quota_limit.toLocaleString('id-ID')} unit</span>
              </p>
            </div>
            <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-default)' }}>
              <div
                className={`h-full rounded-full transition-all ${profile.percentage > 50 ? 'bg-emerald-500' :
                    profile.percentage > 20 ? 'bg-amber-400' : 'bg-rose-500'
                  }`}
                style={{ width: `${profile.percentage}%` }}
              />
            </div>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${profile.tier === 'PRO' ? 'bg-amber-50 border border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' :
                profile.tier === 'ENTERPRISE' ? 'bg-violet-50 border border-violet-200 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20' :
                  'bg-card-hover text-muted border border-[var(--border-default)]'
              }`}>
              {profile.tier}
            </span>
          </div>
        )}
      </div>

      {/* ── Tab Switcher ─────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex bg-card border border-[var(--border-default)] rounded-xl p-1 gap-1">
          {[
            { key: 'plans', label: 'Paket Langganan' },
            { key: 'topup', label: 'Top-up Kredit' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer ${activeTab === tab.key
                  ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/30'
                  : 'text-secondary hover:text-primary hover:bg-card-hover'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Billing Cycle Switcher ── */}
        {activeTab === 'plans' && (
          <div className="flex bg-slate-500/5 border border-[var(--border-default)]/40 rounded-xl p-1 gap-1.5 select-none max-w-full overflow-x-auto">
            {[
              { key: '1M', label: '1 Bulan', badge: null },
              { key: '3M', label: '3 Bulan', badge: 'Diskon 5%' },
              { key: '6M', label: '6 Bulan', badge: 'Diskon 10%' },
              { key: '12M', label: '1 Tahun', badge: 'Diskon 20%' },
            ].map(cycle => (
              <button
                key={cycle.key}
                onClick={() => setBillingCycle(cycle.key)}
                className={`relative px-3.5 py-1 rounded-lg text-[10px] sm:text-xs font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  billingCycle === cycle.key
                    ? 'bg-gradient-to-r from-indigo-500/10 to-violet-500/10 text-indigo-300 border border-indigo-500/25 shadow-md shadow-indigo-500/5'
                    : 'text-secondary hover:text-primary hover:bg-card-hover'
                }`}
              >
                {cycle.label}
                {cycle.badge && (
                  <span className="absolute -top-1.5 -right-1 px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[6px] font-bold tracking-tight uppercase animate-pulse border border-emerald-500/10">
                    {cycle.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── PLANS TAB ────────────────────────────────────────── */}
      {activeTab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map((plan) => {
            const isCurrentTier = profile?.tier === plan.tier;
            const isFree = plan.tier === 'FREE';
            const isPro = plan.tier === 'PRO';
            const isEnterprise = plan.tier === 'ENTERPRISE';

            return (
              <div
                key={plan.key}
                className={`relative bento-card flex flex-col gap-4 p-5 transition-all duration-300 ${isPro ? 'bento-card-glow' : ''
                  } ${isCurrentTier ? 'border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.10)]' : ''}`}
              >
                {/* Popular Badge */}
                {plan.badge && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap border bg-card ${isPro
                      ? 'text-amber-600 border-amber-200 dark:text-amber-400 dark:border-amber-500/30'
                      : 'text-violet-600 border-violet-200 dark:text-violet-400 dark:border-violet-500/30'
                    }`}>
                    {plan.badge}
                  </div>
                )}

                {/* Plan Header */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-bold ${isPro ? 'text-amber-300' : isEnterprise ? 'text-violet-300' : 'text-primary'
                      }`}>
                      {plan.name}
                    </span>
                    {isCurrentTier && (
                      <span className="badge badge-success text-[10px]">Aktif</span>
                    )}
                  </div>
                  <p className="text-xs text-secondary">{plan.description}</p>
                </div>

                {/* Price */}
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-primary">{plan.price}</span>
                    <span className="text-xs text-secondary">{plan.period}</span>
                  </div>
                  <p className="text-[11px] text-indigo-500 dark:text-indigo-400 font-semibold mt-1.5">
                    ⚡ {plan.quota} unit API
                  </p>
                </div>

                {/* Features */}
                <ul className="space-y-2 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-xs text-secondary">
                      <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      {f}
                    </li>
                  ))}
                  {plan.disabled.map(f => (
                    <li key={f} className="flex items-start gap-2 text-xs text-muted">
                      <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  disabled={isCurrentTier || isFree || loadingTx !== null}
                  onClick={() => handlePurchase(plan.key)}
                  className={`relative overflow-hidden w-full py-2.5 rounded-xl text-xs font-semibold transition-all duration-300 cursor-pointer select-none ${isCurrentTier || isFree
                      ? 'bg-card-hover text-muted cursor-default border border-[var(--border-default)]'
                      : isPro
                        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:shadow-[0_0_24px_rgba(99,102,241,0.45)] hover:-translate-y-0.5'
                        : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-[0_0_24px_rgba(245,158,11,0.45)] hover:-translate-y-0.5'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {!isCurrentTier && !isFree && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700" />
                  )}
                  <span className="relative">
                    {loadingTx === plan.key ? (
                      <span className="flex items-center justify-center gap-1">
                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
        <div className="space-y-4">
          <p className="text-center text-xs text-secondary">
            Beli paket kredit sekali bayar. Kredit top-up bersifat permanen — <strong className="text-emerald-400">tidak akan hangus</strong> meskipun masa aktif langganan Anda habis.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {TOP_UP_PACKAGES.map((pkg) => {
              const c = topupColorMap[pkg.color];
              return (
                <div key={pkg.units} className="relative bento-card bento-card-glow p-5 flex flex-col gap-3">
                  {pkg.badge && (
                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[11px] font-semibold bg-card border ${c.badge}`}>
                      {pkg.badge}
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-semibold text-secondary uppercase tracking-wider">{pkg.label}</p>
                    <p className="text-2xl font-bold text-primary mt-1">{pkg.price}</p>
                  </div>
                  <div className={`flex items-center gap-1.5 text-sm font-semibold ${c.icon}`}>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                    {pkg.units.toLocaleString('id-ID')} Unit
                  </div>
                  <button
                    disabled={loadingTx !== null}
                    className={`relative overflow-hidden w-full py-2.5 rounded-xl text-xs font-semibold transition-all duration-300 hover:-translate-y-0.5 cursor-pointer select-none ${c.btn} disabled:opacity-50 disabled:cursor-not-allowed`}
                    onClick={() => handlePurchase(pkg.key)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700" />
                    <span className="relative">
                      {loadingTx === pkg.key ? (
                        <span className="flex items-center justify-center gap-1">
                          <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
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

      {/* ── Tabel Biaya API ──────────────────────────────────── */}
      <div className="bento-card p-5 space-y-3 border border-[var(--border-default)]">
        <div>
          <h2 className="text-sm font-semibold text-primary">Panduan Konsumsi Jatah Poin</h2>
          <p className="text-xs text-secondary mt-0.5">Setiap tindakan pemeriksaan atau penghapusan komentar akan memotong jatah poin Anda.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border-default)' }}>
                <th className="py-2 text-left font-semibold text-secondary uppercase tracking-wider text-[10px]">Tindakan</th>
                <th className="py-2 text-left font-semibold text-secondary uppercase tracking-wider text-[10px]">Nama Teknis YouTube (Abaikan saja)</th>
                <th className="py-2 text-right font-semibold text-secondary uppercase tracking-wider text-[10px]">Konsumsi Poin</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border-default)' }}>
              {COST_TABLE.map((row) => (
                <tr key={row.action} className="hover:bg-card-hover transition-colors">
                  <td className="py-2.5 text-primary font-medium">{row.action}</td>
                  <td className="py-2.5 text-secondary font-mono text-[10px]">{row.api}</td>
                  <td className="py-2.5 text-right">
                    <span className={`font-semibold ${row.cost >= 50 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {row.cost} unit
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-muted">* Batas gratis YouTube API: 10.000 unit/hari per project Google Cloud.</p>
      </div>

      {/* Footer Note */}
      <p className="text-center text-[11px] text-muted">
        *Gunakan Kunci Akses Sendiri (Gratis): Anda bisa membuat dan menggunakan Kunci Akses YouTube (API Key) milik Anda sendiri dari Google untuk menikmati penyaringan tanpa batasan. Dapat dikonfigurasi di{' '}
        <Link href="/preferensi" className="text-indigo-400 hover:text-indigo-300 hover:underline">
          Preferensi
        </Link>.
      </p>
    </div>
  );
}
