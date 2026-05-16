'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

const PLANS = [
  {
    key: 'FREE',
    name: 'Free',
    price: 'Rp 0',
    period: 'Selamanya',
    quota: '1.000',
    quotaNum: 1000,
    color: 'gray',
    description: 'Untuk percobaan & penggunaan pribadi ringan.',
    features: [
      '1.000 unit API / hari (auto-reset)',
      'Moderasi manual komentar',
      'Analisis AI (Spam & Sentimen)',
      'Riwayat moderasi',
    ],
    disabled: ['Auto-moderasi (Tahan/Hapus)', 'Polling otomatis', 'Multi-video filter'],
    cta: 'Paket Saat Ini',
    isCurrent: true,
    badge: null,
  },
  {
    key: 'PRO',
    name: 'Pro',
    price: 'Rp 49.000',
    period: '/ bulan',
    quota: '50.000',
    quotaNum: 50000,
    color: 'indigo',
    description: 'Untuk content creator aktif dengan video yang sering ramai komentar.',
    features: [
      '50.000 unit API / bulan',
      'Semua fitur Free',
      'Auto-moderasi (Tahan & Hapus)',
      'Polling otomatis tiap 2 menit',
      'Multi-video filter & batch moderasi',
      'Prioritas support',
    ],
    disabled: [],
    cta: 'Pilih Pro',
    isCurrent: false,
    badge: '🔥 Paling Populer',
  },
  {
    key: 'ENTERPRISE',
    name: 'Enterprise',
    price: 'Rp 149.000',
    period: '/ bulan',
    quota: 'Tak Terbatas*',
    quotaNum: 999999,
    color: 'amber',
    description: 'Untuk agency atau channel dengan volume komentar sangat tinggi.',
    features: [
      'Quota tak terbatas (BYOK)*',
      'Semua fitur Pro',
      'Bring Your Own API Key (BYOK)',
      'Dashboard analitik lanjutan',
      'Ekspor data CSV',
      'Dedicated support',
    ],
    disabled: [],
    cta: 'Hubungi Kami',
    isCurrent: false,
    badge: '⭐ Terlengkap',
  },
];

const TOP_UP_PACKAGES = [
  { units: 5000,  price: 'Rp 15.000', label: 'Starter',   color: 'emerald' },
  { units: 20000, price: 'Rp 50.000', label: 'Standard',  color: 'blue', badge: 'Terlaris' },
  { units: 60000, price: 'Rp 120.000', label: 'Power',    color: 'violet' },
];

const COST_TABLE = [
  { action: 'Ambil Daftar Video',      api: 'playlistItems.list',          cost: 1 },
  { action: 'Ambil Komentar (100 komentar)', api: 'commentThreads.list',   cost: 1 },
  { action: 'Moderasi Komentar (Single)', api: 'setModerationStatus',      cost: 50 },
  { action: 'Moderasi Batch',           api: 'setModerationStatus (batch)', cost: 50 },
  { action: 'Polling Auto-refresh',     api: 'List call per siklus',        cost: 1 },
];

export default function PricingPage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [activeTab, setActiveTab] = useState('plans'); // 'plans' | 'topup'

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/quota/profile');
        if (res.ok) setProfile(await res.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingProfile(false);
      }
    };
    if (session?.user?.email) fetchProfile();
    else setLoadingProfile(false);
  }, [session]);

  const colorMap = {
    gray:    { border: 'border-gray-200',  bg: 'bg-gray-50',    badge: 'bg-gray-100 text-gray-600',   btn: 'bg-gray-100 text-gray-500 cursor-default',       icon: 'text-gray-400',  check: 'text-gray-500' },
    indigo:  { border: 'border-indigo-400 ring-2 ring-indigo-200', bg: 'bg-indigo-600', badge: 'bg-indigo-100 text-indigo-700', btn: 'bg-indigo-600 hover:bg-indigo-700 text-white', icon: 'text-indigo-500', check: 'text-indigo-600' },
    amber:   { border: 'border-amber-300', bg: 'bg-amber-500',   badge: 'bg-amber-100 text-amber-700', btn: 'bg-amber-500 hover:bg-amber-600 text-white',       icon: 'text-amber-500', check: 'text-amber-600' },
    emerald: { btn: 'bg-emerald-500 hover:bg-emerald-600 text-white', badge: 'bg-emerald-100 text-emerald-700' },
    blue:    { btn: 'bg-blue-600 hover:bg-blue-700 text-white',   badge: 'bg-blue-100 text-blue-700' },
    violet:  { btn: 'bg-violet-600 hover:bg-violet-700 text-white', badge: 'bg-violet-100 text-violet-700' },
  };

  return (
    <div className="animate-fade-in-up space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2 pt-2">
        <h1 className="text-2xl font-bold text-gray-900">Paket & Kuota API</h1>
        <p className="text-sm text-gray-500">
          Kelola penggunaan YouTube API Anda. Setiap aksi mengonsumsi unit kuota.
        </p>

        {/* Current quota status */}
        {!loadingProfile && profile && (
          <div className="inline-flex items-center gap-3 mt-3 px-4 py-2.5 bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="text-left">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Sisa Kuota Anda</p>
              <p className="text-sm font-bold text-gray-900">
                {profile.quota_balance.toLocaleString('id-ID')}
                <span className="text-xs font-normal text-gray-400"> / {profile.quota_limit.toLocaleString('id-ID')} unit</span>
              </p>
            </div>
            <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${profile.percentage > 50 ? 'bg-emerald-500' : profile.percentage > 20 ? 'bg-amber-400' : 'bg-red-500'}`}
                style={{ width: `${profile.percentage}%` }}
              />
            </div>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              profile.tier === 'PRO' ? 'bg-indigo-100 text-indigo-700' :
              profile.tier === 'ENTERPRISE' ? 'bg-amber-100 text-amber-700' :
              'bg-gray-100 text-gray-600'
            }`}>{profile.tier}</span>
          </div>
        )}
      </div>

      {/* Tab switcher */}
      <div className="flex justify-center">
        <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
          {[
            { key: 'plans', label: 'Langganan Bulanan' },
            { key: 'topup', label: 'Top-up Kredit' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === tab.key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── PLANS TAB ─────────────────────────────────────────────── */}
      {activeTab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map((plan) => {
            const c = colorMap[plan.color];
            const isCurrentTier = profile?.tier === plan.key;
            return (
              <div
                key={plan.key}
                className={`relative bg-white rounded-2xl border p-5 flex flex-col gap-4 transition-shadow hover:shadow-md ${c.border}`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[11px] font-semibold ${c.badge} border border-white shadow-sm whitespace-nowrap`}>
                    {plan.badge}
                  </div>
                )}

                {/* Plan header */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-gray-900">{plan.name}</span>
                    {isCurrentTier && (
                      <span className="text-[10px] font-medium bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Aktif</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">{plan.description}</p>
                </div>

                {/* Price */}
                <div>
                  <span className="text-2xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-xs text-gray-400 ml-1">{plan.period}</span>
                  <p className="text-[11px] text-indigo-600 font-medium mt-1">⚡ {plan.quota} unit API</p>
                </div>

                {/* Features */}
                <ul className="space-y-1.5 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-xs text-gray-600">
                      <svg className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${c.check}`} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      {f}
                    </li>
                  ))}
                  {plan.disabled.map(f => (
                    <li key={f} className="flex items-start gap-2 text-xs text-gray-300">
                      <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  disabled={isCurrentTier || plan.key === 'FREE'}
                  className={`w-full py-2 rounded-xl text-xs font-semibold transition-all ${
                    isCurrentTier || plan.key === 'FREE' ? 'bg-gray-100 text-gray-400 cursor-default' : c.btn
                  }`}
                >
                  {isCurrentTier ? '✓ Paket Aktif Anda' : plan.cta}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── TOP-UP TAB ─────────────────────────────────────────────── */}
      {activeTab === 'topup' && (
        <div className="space-y-4">
          <p className="text-center text-xs text-gray-400">
            Beli paket kredit sekali bayar. Kredit tidak kedaluwarsa dan bisa dipakai kapan saja.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {TOP_UP_PACKAGES.map((pkg) => {
              const c = colorMap[pkg.color];
              return (
                <div key={pkg.units} className="relative bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
                  {pkg.badge && (
                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[11px] font-semibold ${c.badge} border border-white shadow-sm`}>
                      {pkg.badge}
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{pkg.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{pkg.price}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                    <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                    </svg>
                    {pkg.units.toLocaleString('id-ID')} Unit
                  </div>
                  <button
                    className={`w-full py-2 rounded-xl text-xs font-semibold transition-all ${c.btn}`}
                    onClick={() => alert('Fitur pembayaran akan segera tersedia (Midtrans Sandbox)')}
                  >
                    Beli Sekarang
                  </button>
                </div>
              );
            })}
          </div>

          {/* Info Sandbox */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
            <svg className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
            <div>
              <p className="text-xs font-semibold text-blue-800">Mode Sandbox (Demo)</p>
              <p className="text-xs text-blue-600 mt-0.5">
                Pembayaran menggunakan simulasi Midtrans Sandbox. Tidak ada uang nyata yang dipotong.
                Gunakan nomor kartu <strong>4811 1111 1111 1114</strong> untuk simulasi berhasil.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Tabel Biaya API ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Tabel Biaya Kuota</h2>
          <p className="text-xs text-gray-400 mt-0.5">Setiap aksi dalam aplikasi mengonsumsi unit YouTube API v3.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="py-2 text-left font-semibold text-gray-500 uppercase tracking-wider text-[10px]">Aksi</th>
                <th className="py-2 text-left font-semibold text-gray-500 uppercase tracking-wider text-[10px]">YouTube API</th>
                <th className="py-2 text-right font-semibold text-gray-500 uppercase tracking-wider text-[10px]">Biaya</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {COST_TABLE.map((row) => (
                <tr key={row.action} className="hover:bg-gray-50/50">
                  <td className="py-2.5 text-gray-700 font-medium">{row.action}</td>
                  <td className="py-2.5 text-gray-400 font-mono text-[10px]">{row.api}</td>
                  <td className="py-2.5 text-right">
                    <span className={`font-semibold ${row.cost >= 50 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {row.cost} unit
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-gray-400">* Batas gratis YouTube API: 10.000 unit/hari per project Google Cloud.</p>
      </div>

      {/* Footer note */}
      <p className="text-center text-[11px] text-gray-400">
        *BYOK (Bring Your Own Key): Gunakan API Key YouTube Anda sendiri untuk kuota tak terbatas. Dapat dikonfigurasi di{' '}
        <Link href="/preferensi" className="text-indigo-500 hover:underline">Preferensi</Link>.
      </p>
    </div>
  );
}
