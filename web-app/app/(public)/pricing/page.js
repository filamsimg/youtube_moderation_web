'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useQuota } from '@/contexts/QuotaContext';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';
import Script from 'next/script';
import { CreditCard } from 'lucide-react';
import KineticGrid from '@/components/KineticGrid';
import ByokGuideModal from '@/components/ByokGuideModal';

// =========================================================================
// DEFINISI PAKET LANGGANAN SECARA DINAMIS (Sesuai Konfigurasi Keamanan Sisi Server)

const COST_TABLE = [
  { action: 'Ambil Daftar Video', api: 'playlistItems.list', cost: 1 },
  { action: 'Ambil Komentar (100 komentar)', api: 'commentThreads.list', cost: 1 },
  { action: 'Moderasi Komentar (Single)', api: 'setModerationStatus', cost: 50 },
  { action: 'Moderasi Batch', api: 'setModerationStatus (batch)', cost: 50 },
  { action: 'Polling Auto-refresh', api: 'List call per siklus', cost: 1 },
];

// Client-side In-Memory Cache for Public Pricing Plans
let cachedPublicPlans = null;

export default function PricingPage() {
  const { data: session } = useSession();
  const { profile, loading: loadingProfile, fetchQuota } = useQuota();
  const toast = useToast();

  const [billingCycle, setBillingCycle] = useState('1M'); // '1M' | '3M' | '6M' | '12M'
  const [loadingTx, setLoadingTx] = useState(null);

  const [plans, setPlans] = useState(cachedPublicPlans || []);
  const [loadingPackages, setLoadingPackages] = useState(!cachedPublicPlans);

  // State Modal Aktivasi Pasca Bayar Enterprise (BYOK)
  const [showEnterpriseModal, setShowEnterpriseModal] = useState(false);
  const [enterpriseApiKeyInput, setEnterpriseApiKeyInput] = useState('');
  const [savingEnterpriseKey, setSavingEnterpriseKey] = useState(false);
  const [showByokGuide, setShowByokGuide] = useState(false);

  const formatIDR = (num) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  useEffect(() => {
    let isMounted = true;
    async function loadPackages() {
      if (!cachedPublicPlans) {
        setLoadingPackages(true);
      }
      try {
        const response = await fetch('/api/plans', { cache: 'no-store' });
        const json = await response.json();
        if (json.success) {
          cachedPublicPlans = json.plans;
          if (isMounted) {
            setPlans(json.plans);
          }
        } else if (!cachedPublicPlans && isMounted) {
          toast.error(json.error || 'Gagal memuat paket pricing');
        }
      } catch (error) {
        console.error('Fetch pricing error:', error);
        if (!cachedPublicPlans && isMounted) {
          toast.error('Koneksi internet bermasalah');
        }
      } finally {
        if (isMounted) {
          setLoadingPackages(false);
        }
      }
    }
    loadPackages();
    return () => {
      isMounted = false;
    };
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
        quota: plan.tier === 'ENTERPRISE' ? `${plan.quota_units.toLocaleString('id-ID')} + BYOK` : plan.quota_units.toLocaleString('id-ID'),
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
            toast.success('Pembayaran sukses! Paket Anda telah aktif secara instan.');

            // Simulasikan pemicu webhook instan agar database lokal terupdate (Sandbox Demo Helper)
            await syncPaymentStatus(orderId, packageId);

            setTimeout(() => {
              fetchQuota();
            }, 1000);

            // Jika paket yang dibeli adalah Enterprise, munculkan Modal Aktivasi BYOK Pasca Bayar
            if (packageId.toUpperCase().includes('ENTERPRISE')) {
              setShowEnterpriseModal(true);
            }
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
      const matchedPkg = plans.find(p => p.id === packageId);
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

  const handleSaveEnterpriseKey = async () => {
    if (!enterpriseApiKeyInput.trim()) {
      toast.warning('Silakan masukkan Google YouTube API Key terlebih dahulu.');
      return;
    }

    try {
      setSavingEnterpriseKey(true);
      const res = await fetch('/api/user/byok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: enterpriseApiKeyInput.trim() }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.error || 'Gagal menyambungkan API Key.');
        return;
      }

      toast.success('API Key berhasil diverifikasi! Kuota pembersihan tanpa batas kini telah aktif.');
      setEnterpriseApiKeyInput('');
      setShowEnterpriseModal(false);
      fetchQuota();
    } catch (err) {
      console.error('Error saving Enterprise key:', err);
      toast.error('Terjadi kesalahan koneksi saat memverifikasi API Key.');
    } finally {
      setSavingEnterpriseKey(false);
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

      <div className="relative z-10 max-w-5xl mx-auto space-y-10">
        {/* ── Page Header ──────────────────────────────────────── */}
        <div className="text-center space-y-3 pt-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-2 shadow-sm">
            Kelola Kuota API
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
                  className={`h-full rounded-full transition-all duration-500 ${profile.percentage > 50 ? 'bg-emerald-500' :
                      profile.percentage > 20 ? 'bg-amber-400' : 'bg-rose-500'
                    }`}
                  style={{ width: `${profile.percentage}%` }}
                />
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${profile.tier === 'PRO' ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400' :
                  profile.tier === 'ENTERPRISE' ? 'bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-400' :
                    'bg-card-hover text-muted border-[var(--border-default)]'
                }`}>
                {profile.tier}
              </span>
            </div>
          )}
        </div>

        {/* ── Billing Cycle Switcher ── */}
        <div className="flex flex-col items-center gap-4">
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
                  className={`px-4 py-1.5 rounded-xl text-[10px] sm:text-xs font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap border border-transparent ${billingCycle === cycle.key
                      ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/25 dark:border-indigo-500/35 shadow-sm'
                      : 'text-secondary hover:text-primary hover:bg-card-hover'
                    }`}
                >
                  {cycle.label}
                </button>
              ))}
            </div>

            {/* Google One style hemat notice */}
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 min-h-[18px] text-center">
              {billingCycle === '1M' ? (
                'Pilih paket jangka panjang untuk hemat hingga 20%!'
              ) : billingCycle === '3M' ? (
                'Hemat 5% jika Anda memilih paket 3 Bulan'
              ) : billingCycle === '6M' ? (
                'Hemat 10% jika Anda memilih paket 6 Bulan'
              ) : (
                'Hemat 20% jika Anda memilih paket 1 Tahun (Diskon Terbesar)'
              )}
            </p>
          </div>
        </div>

        {loadingPackages && plans.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bento-card p-6 space-y-5 animate-pulse border border-[var(--border-default)]">
                <div className="space-y-2">
                  <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded-md" />
                  <div className="h-7 w-36 bg-slate-200 dark:bg-slate-800 rounded-md" />
                  <div className="h-3 w-48 bg-slate-200 dark:bg-slate-800 rounded-md" />
                </div>
                <div className="h-px bg-slate-200 dark:bg-slate-800 my-4" />
                <div className="space-y-2.5">
                  <div className="h-3.5 w-full bg-slate-200 dark:bg-slate-800 rounded-md" />
                  <div className="h-3.5 w-5/6 bg-slate-200 dark:bg-slate-800 rounded-md" />
                  <div className="h-3.5 w-4/6 bg-slate-200 dark:bg-slate-800 rounded-md" />
                </div>
                <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 rounded-xl mt-6" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((plan) => {
              const userTier = profile?.tier || 'FREE';
              const activePackageId = profile?.active_package_id;
              
              const isCurrentTier = userTier === plan.tier;
              const isCurrentPackage = activePackageId === plan.key;
              
              const isFree = plan.tier === 'FREE';
              const isPro = plan.tier === 'PRO';
              const isEnterprise = plan.tier === 'ENTERPRISE';

              // Tentukan relasi paket untuk downgrade/upgrade
              let isDowngrade = false;
              let isUpgrade = false;

              if (userTier === 'ENTERPRISE') {
                if (plan.tier === 'PRO' || plan.tier === 'FREE') {
                  isDowngrade = true;
                }
              } else if (userTier === 'PRO') {
                if (plan.tier === 'FREE') {
                  isDowngrade = true;
                } else if (plan.tier === 'ENTERPRISE') {
                  isUpgrade = true;
                }
              } else if (userTier === 'FREE') {
                if (plan.tier !== 'FREE') {
                  isUpgrade = true;
                }
              }

              // Tentukan label dan status disabled untuk tombol CTA
              let ctaLabel = plan.cta;
              let isBtnDisabled = false;

              if (isFree) {
                if (userTier === 'FREE') {
                  ctaLabel = 'Paket Saat Ini';
                  isBtnDisabled = true;
                } else {
                  ctaLabel = 'Kembali ke Free (Saat Expired)';
                  isBtnDisabled = true;
                }
              } else if (isCurrentPackage) {
                ctaLabel = 'Paket Aktif Anda';
                isBtnDisabled = true;
              } else if (isCurrentTier && !isCurrentPackage) {
                ctaLabel = 'Perpanjang / Ubah Siklus';
                isBtnDisabled = false;
              } else if (isDowngrade) {
                ctaLabel = 'Downgrade Otomatis (Saat Expired)';
                isBtnDisabled = true;
              } else if (isUpgrade) {
                ctaLabel = plan.cta;
                isBtnDisabled = false;
              }

              return (
                <div
                  key={plan.key}
                  className={`relative flex flex-col gap-6 p-6 rounded-3xl transition-all duration-300 border backdrop-blur-md ${isPro
                      ? 'bg-card/75 bg-gradient-to-b from-indigo-500/10 to-indigo-500/[0.02] border-indigo-500/35 shadow-[0_0_30px_rgba(99,102,241,0.12)]'
                      : isEnterprise
                        ? 'bg-card/75 bg-gradient-to-b from-purple-500/10 to-purple-500/[0.02] border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.08)]'
                        : 'bg-card/60 border-[var(--border-default)]'
                    } ${isCurrentPackage ? 'ring-2 ring-indigo-500/40' : ''}`}
                >
                  {/* Popular Badge */}
                  {plan.badge && (
                    <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold border shadow-sm ${isPro
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
                    <div className="relative group/tooltip inline-block mt-2.5">
                      <p className="text-xs text-indigo-700 dark:text-indigo-400 font-semibold flex items-center gap-1 cursor-help">
                        <svg className="w-3.5 h-3.5 text-indigo-700 dark:text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                        </svg>
                        <span>Jatah: {plan.quota} unit API</span>
                        <svg className="w-3.5 h-3.5 text-indigo-500/70 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors ml-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                        </svg>
                      </p>

                      {/* Floating Glassmorphic Tooltip Card (Opsi A: Dynamic Calculation) */}
                      <div className="absolute bottom-full left-0 mb-2 hidden group-hover/tooltip:block z-30 w-64 p-3 rounded-2xl bg-slate-900/95 dark:bg-slate-900/95 border border-indigo-500/30 text-white text-[11px] shadow-xl backdrop-blur-xl animate-fade-in pointer-events-none">
                        <p className="font-bold text-indigo-300 mb-1 flex items-center gap-1">
                          Estimasi Penggunaan Kuota:
                        </p>
                        <div className="space-y-1 text-slate-300 text-[10px] leading-relaxed">
                          <p>• <strong>Muat Komentar:</strong> s.d <strong>{plan.quotaNum?.toLocaleString('id-ID')}x</strong> fetch (setara {((plan.quotaNum || 0) * 100).toLocaleString('id-ID')} komentar).</p>
                          <p>• <strong>Hapus/Moderasi:</strong> s.d <strong>{Math.floor((plan.quotaNum || 0) / 50).toLocaleString('id-ID')}x</strong> aksi hapus spam.</p>
                          {isEnterprise && (
                            <p className="text-emerald-400 font-semibold mt-1">• <strong>BYOK Opsional:</strong> Pasang API Key GCP di Preferensi untuk Bebas Limit Server.</p>
                          )}
                        </div>
                        <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-slate-900/95" />
                      </div>
                    </div>
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
                    disabled={isBtnDisabled || loadingTx !== null}
                    onClick={() => handlePurchase(plan.key)}
                    className={`relative overflow-hidden w-full py-3 rounded-2xl text-xs font-bold transition-all duration-300 cursor-pointer select-none ${isBtnDisabled
                        ? 'bg-card-hover text-muted cursor-default border border-[var(--border-default)]'
                        : isPro
                          ? 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white shadow-xs hover:-translate-y-0.5 active:scale-98'
                          : 'bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-500 text-white shadow-xs hover:-translate-y-0.5 active:scale-98'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {!isBtnDisabled && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700" />
                    )}
                    <span className="relative">
                      {loadingTx === plan.key ? (
                        <span className="flex items-center justify-center gap-1.5">
                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Inisialisasi...
                        </span>
                      ) : (
                        ctaLabel
                      )}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Helper Banner Riwayat Tagihan & Invoice (Opsi 4) ── */}
        {session?.user && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl border border-[var(--border-default)] bg-card/60 backdrop-blur-md shadow-sm">
            <div className="flex items-center gap-3.5 text-left">
              <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-primary">Sudah Memiliki Tagihan atau Pembayaran?</h3>
                <p className="text-xs text-secondary mt-0.5">
                  Lanjutkan pembayaran tertunda atau unduh bukti transaksi resmi di Riwayat Transaksi Anda.
                </p>
              </div>
            </div>
            <Link
              href="/profile#billing"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white text-xs font-bold shadow-xs hover:-translate-y-0.5 active:scale-98 transition-all select-none whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Buka Riwayat Tagihan</span>
              <span className="font-extrabold">→</span>
            </Link>
          </div>
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
                    <td className="py-3 text-secondary font-medium text-xs opacity-75">{row.api}</td>
                    <td className="py-3 text-right">
                      <span className={`font-bold px-2 py-0.5 rounded-md ${row.cost >= 50 ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/10' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/10'
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

      {/* ── Modal Aktivasi BYOK Enterprise Pasca Bayar ──────────── */}
      {showEnterpriseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white border border-amber-300 text-slate-900 dark:bg-slate-900 dark:border-amber-500/40 dark:text-slate-100 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-7 space-y-5">
            {/* Modal Header */}
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 rounded-2xl flex-shrink-0">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121 8.25z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100">Pembayaran Enterprise Sukses!</h3>
                <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold mt-0.5">Paket Enterprise Anda kini telah aktif.</p>
              </div>
            </div>

            {/* Information Notice */}
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-950 dark:bg-amber-950/30 dark:border-amber-500/30 dark:text-amber-200 text-xs font-medium leading-relaxed">
              Masukkan Google YouTube API Key Anda sekarang untuk langsung mengaktifkan pembersihan komentar bebas limit. Kunci Anda akan diverifikasi secara otomatis ke server Google.
            </div>

            {/* Input Form */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-900 dark:text-slate-200 flex items-center justify-between">
                <span>Google YouTube API Key</span>
                <button
                  type="button"
                  onClick={() => setShowByokGuide(true)}
                  className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                >
                  Panduan Pembuatan Key →
                </button>
              </label>
              <input
                type="password"
                placeholder="Tempelkan kode Kunci API Anda (AIzaSyD...)"
                value={enterpriseApiKeyInput}
                onChange={(e) => setEnterpriseApiKeyInput(e.target.value)}
                className="w-full px-4 py-3 text-xs rounded-xl border border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder-slate-500 font-mono font-medium shadow-xs transition-all"
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
              <button
                onClick={handleSaveEnterpriseKey}
                disabled={savingEnterpriseKey}
                className="w-full sm:flex-1 py-3 px-5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-500 rounded-xl transition-all shadow-xs active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {savingEnterpriseKey ? 'Memverifikasi...' : 'Simpan & Aktifkan BYOK'}
              </button>
              <button
                onClick={() => {
                  setShowEnterpriseModal(false);
                  toast.info('Anda dapat memasukkan API Key kapan saja di Halaman Preferensi.');
                }}
                className="w-full sm:w-auto py-3 px-4 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Set Up Nanti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tutorial Pembuatan YouTube API Key */}
      <ByokGuideModal
        isOpen={showByokGuide}
        onClose={() => setShowByokGuide(false)}
      />
    </div>
  );
}
