'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useQuota } from '@/contexts/QuotaContext';
import { useYouTube } from '@/contexts/YouTubeContext';
import { useToast } from '@/contexts/ToastContext';
import PaginationControls from '@/components/PaginationControls';
import { Tv, CheckCircle2, User, CreditCard, Shield, RefreshCw, X, Play, Ban, Clock, AlertTriangle, ExternalLink } from 'lucide-react';
import Script from 'next/script';

export default function ProfilePage() {
  const { data: session } = useSession();
  const { profile, loading: loadingQuota, fetchQuota } = useQuota();
  const { channels, activeChannel, loadingChannel, updateSelectedChannelId } = useYouTube();
  const toast = useToast();

  const [transactions, setTransactions] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // Track loading per orderId

  // States untuk Pagination Riwayat Transaksi
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    if (session?.user?.email) {
      loadTransactionHistory();
    }
  }, [session?.user?.email]);

  // Reset halaman pagination ke 1 jika data transaksi diubah/segarkan
  useEffect(() => {
    setCurrentPage(1);
  }, [transactions]);

  const loadTransactionHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await fetch('/api/payment/history');
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Gagal memuat riwayat');
      setTransactions(data || []);
    } catch (err) {
      console.error('Gagal mengambil riwayat transaksi:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // ── Resume Payment: Buka kembali popup Snap dengan token yang sudah ada ──
  const handleResumePayment = async (tx) => {
    if (actionLoading) return;

    try {
      setActionLoading(tx.id);

      // Pertama, cek status terkini via Status API (sinkronisasi dengan Midtrans)
      const statusRes = await fetch(`/api/payment/status?order_id=${encodeURIComponent(tx.id)}`);
      const statusData = await statusRes.json();

      if (statusRes.ok && statusData.status !== 'pending') {
        // Status sudah berubah di Midtrans → refresh tabel
        toast.info(`Status transaksi sudah berubah ke "${getStatusLabel(statusData.status)}". Memperbarui data...`);
        await loadTransactionHistory();
        if (statusData.status === 'settlement') fetchQuota();
        return;
      }

      // Cek apakah snap_token masih tersedia
      const snapToken = statusData?.snap_token || tx.snap_token;
      
      if (!snapToken) {
        toast.error('Token pembayaran tidak tersedia. Silakan buat transaksi baru dari halaman Pricing.');
        return;
      }

      // Cek apakah transaksi sudah terlalu lama (> 24 jam)
      const ageHours = (Date.now() - new Date(tx.created_at).getTime()) / (1000 * 60 * 60);
      if (ageHours > 24) {
        toast.warning('Token pembayaran sudah kedaluwarsa (> 24 jam). Silakan buat transaksi baru dari halaman Pricing.');
        // Auto-expire transaksi ini di background
        try {
          await fetch('/api/payment/cancel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: tx.id }),
          });
          await loadTransactionHistory();
        } catch (e) { /* silent */ }
        return;
      }

      // Buka Snap popup
      if (window.snap) {
        window.snap.pay(snapToken, {
          onSuccess: async (result) => {
            toast.success('Pembayaran sukses! Menambahkan kuota Anda secara instan.');
            await syncPaymentStatus(tx.id, tx.package_id);
            setTimeout(() => {
              fetchQuota();
              loadTransactionHistory();
            }, 1000);
          },
          onPending: (result) => {
            toast.warning('Pembayaran ditunda. Silakan selesaikan transaksi Anda.');
          },
          onError: (result) => {
            toast.error('Pembayaran gagal. Silakan coba kembali.');
            loadTransactionHistory();
          },
          onClose: () => {
            toast.info('Menu pembayaran ditutup.');
          },
        });
      } else {
        toast.error('SDK Midtrans Snap gagal dimuat. Pastikan koneksi internet aktif.');
      }
    } catch (err) {
      console.error('Resume payment error:', err);
      toast.error('Gagal melanjutkan pembayaran.');
    } finally {
      setActionLoading(null);
    }
  };

  // ── Cancel Transaction ──
  const handleCancelTransaction = async (tx) => {
    if (actionLoading) return;

    // Konfirmasi visual sederhana melalui toast
    try {
      setActionLoading(tx.id);
      
      const res = await fetch('/api/payment/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: tx.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal membatalkan transaksi');
      }

      toast.success(`Transaksi ${tx.id.substring(0, 20)}... berhasil dibatalkan.`);
      await loadTransactionHistory();
    } catch (err) {
      console.error('Cancel transaction error:', err);
      toast.error(err.message || 'Gagal membatalkan transaksi.');
    } finally {
      setActionLoading(null);
    }
  };

  // Sandbox demo helper: Bypass localhost webhook
  const syncPaymentStatus = async (orderId, packageId) => {
    try {
      const allPackages = {
        'PRO': 49000, 'ENTERPRISE': 149000,
        'PRO_1M': 49000, 'PRO_3M': 139000, 'PRO_6M': 264000, 'PRO_12M': 470000,
        'ENTERPRISE_1M': 149000, 'ENTERPRISE_3M': 424000, 'ENTERPRISE_6M': 804000, 'ENTERPRISE_12M': 1430000,
      };
      const mockAmount = allPackages[packageId] || 15000;

      await fetch('/api/payment/notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          status_code: '200',
          gross_amount: mockAmount.toString(),
          transaction_status: 'settlement',
          fraud_status: 'accept',
          signature_key: 'mock-local-bypass-signature',
          payment_type: 'sandbox_demo',
        }),
      });
    } catch (e) {
      console.warn('Gagal memicu sinkronisasi status lokal:', e);
    }
  };

  const handleSelectChannel = (channel) => {
    if (channel.id === activeChannel?.id) return;
    updateSelectedChannelId(channel.id);
    toast.success(`Berhasil beralih ke kanal: ${channel.snippet.title}`);
  };

  // ── Helper: Label status yang human-readable ──
  const getStatusLabel = (status) => {
    const labels = {
      settlement: 'Pembayaran Sukses',
      pending: 'Menunggu Pembayaran',
      expired: 'Kedaluwarsa',
      cancelled: 'Dibatalkan',
      failed: 'Gagal',
      // Legacy support
      expire: 'Kedaluwarsa',
      cancel: 'Dibatalkan',
    };
    return labels[status] || status;
  };

  // ── Helper: Status badge visual ──
  const getStatusBadge = (status) => {
    const config = {
      settlement: { cls: 'badge badge-success', icon: '✅', label: 'Pembayaran Sukses' },
      pending: { cls: 'badge badge-warning', icon: '⏳', label: 'Menunggu Pembayaran' },
      expired: { cls: 'badge badge-danger', icon: '⏰', label: 'Kedaluwarsa' },
      cancelled: { cls: 'badge badge-muted', icon: '🗑️', label: 'Dibatalkan' },
      failed: { cls: 'badge badge-danger', icon: '❌', label: 'Gagal' },
      // Legacy support
      expire: { cls: 'badge badge-danger', icon: '⏰', label: 'Kedaluwarsa' },
      cancel: { cls: 'badge badge-muted', icon: '🗑️', label: 'Dibatalkan' },
    };

    const c = config[status] || { cls: 'badge badge-muted', icon: '❓', label: status };

    return (
      <span className={`${c.cls} px-2.5 py-1 text-xs font-semibold rounded-lg`}>
        {c.icon} {c.label}
      </span>
    );
  };

  // ── Helper: Transaction type tag ──
  const getTypeBadge = (tx) => {
    const txType = tx.transaction_type || (tx.duration_days > 0 ? 'subscription' : 'topup');
    
    if (txType === 'subscription') {
      return (
        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          Langganan
        </span>
      );
    }
    return (
      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        Top-up
      </span>
    );
  };

  // Kalkulasi Pagination
  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const paginatedTransactions = transactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Kalkulasi detail masa aktif kuota
  const getExpiryDetails = () => {
    if (!profile) return null;
    
    if (profile.tier === 'FREE') {
      const totalBalance = profile.quota_balance || 0;
      
      if (totalBalance <= 0) {
        return {
          text: 'Kuota Habis',
          className: 'text-rose-500 font-bold animate-pulse',
          isWarning: true,
          message: 'Seluruh kuota Anda telah habis. Silakan tingkatkan ke paket Pro.'
        };
      }
      
      return {
        text: 'Trial Uji Coba Aktif',
        className: 'text-slate-400 font-semibold',
        isWarning: false,
        message: null
      };
    }
    
    // PRO & ENTERPRISE selalu memiliki masa aktif definitif
    if (!profile.quota_expiry) {
      return {
        text: 'Perlu Verifikasi',
        className: 'text-amber-400 font-medium',
        isWarning: true,
        message: 'Data masa aktif tidak ditemukan. Hubungi dukungan teknis.'
      };
    }

    const expiryDate = new Date(profile.quota_expiry);
    const diffTime = expiryDate - new Date();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const formattedDate = expiryDate.toLocaleDateString('id-ID', { dateStyle: 'medium' });

    if (daysLeft < 0) {
      return {
        text: `${formattedDate} (Kedaluwarsa)`,
        className: 'text-rose-500 font-bold',
        isWarning: true,
        message: 'Masa aktif paket Anda telah habis. Kuota langganan telah hangus. Silakan lakukan perpanjangan.'
      };
    } else if (daysLeft === 0) {
      return {
        text: `Hari ini!`,
        className: 'text-rose-500 font-bold animate-pulse',
        isWarning: true,
        message: 'Masa aktif paket Anda habis hari ini! Kuota langganan akan hangus.'
      };
    } else if (daysLeft <= 3) {
      return {
        text: `${formattedDate} (${daysLeft} hari lagi!)`,
        className: 'text-rose-400 font-bold animate-pulse',
        isWarning: true,
        message: `Masa aktif paket tinggal ${daysLeft} hari lagi! Kuota langganan akan hangus saat expire.`
      };
    } else if (daysLeft <= 7) {
      return {
        text: `${formattedDate} (${daysLeft} hari lagi)`,
        className: 'text-amber-400 font-semibold',
        isWarning: true,
        message: `Masa aktif paket akan berakhir dalam ${daysLeft} hari.`
      };
    } else {
      return {
        text: formattedDate,
        className: 'text-emerald-500 dark:text-emerald-400 font-semibold',
        isWarning: false
      };
    }
  };

  const expiryDetails = getExpiryDetails();

  // Persentase lingkaran progres kuota
  const pct = profile?.percentage ?? 100;
  const strokeDashoffset = 251.2 - (251.2 * Math.min(pct, 100)) / 100;
  const ringColor =
    pct > 50 ? 'stroke-emerald-500' :
    pct > 20 ? 'stroke-amber-400' :
    'stroke-rose-500';

  return (
    <div className="animate-fade-in-up space-y-6 pb-12 max-w-5xl mx-auto">
      
      {/* Midtrans Snap SDK untuk Resume Payment */}
      <Script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        strategy="lazyOnload"
      />

      {/* ── Page Header ────────────────────────────────────────── */}
      <div>
        <h1 className="text-lg lg:text-xl font-bold tracking-tight text-primary">
          Profil Saya
        </h1>
        <p className="text-sm mt-0.5 text-secondary">
          Kelola profil pengguna, beralih kanal YouTube aktif, dan lihat histori transaksi Anda.
        </p>
      </div>

      {/* ── Bento Grid: Bagian Atas ────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Modul 1: Ringkasan Pengguna (Bento Card 1) */}
        <div className="bento-card p-6 md:col-span-3 flex flex-col justify-between relative overflow-hidden">
          {/* Neon Glow */}
          <div className="absolute right-0 top-0 w-48 h-48 bg-indigo-500/5 blur-[40px] rounded-full pointer-events-none" />
          
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              {/* Avatar Google HD */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={session?.user?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(session?.user?.name || 'User')}&background=6366f1&color=fff&size=64`}
                alt="user avatar"
                className="w-16 h-16 rounded-full border-2 border-indigo-500/30 object-cover shadow-lg"
                loading="lazy"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-primary truncate">
                    {session?.user?.name || 'Nama Kreator'}
                  </h2>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                    profile?.tier === 'PRO' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    profile?.tier === 'ENTERPRISE' ? 'bg-violet-500/10 text-violet-400 border-violet-500/20' :
                    'bg-slate-500/10 text-slate-400 border-slate-500/20'
                  }`}>
                    Tier {profile?.tier || 'FREE'}
                  </span>
                </div>
                <p className="text-xs text-secondary truncate">{session?.user?.email}</p>
                <p className="text-[10px] text-muted mt-1 flex items-center gap-1">
                  <Shield className="w-3 h-3 text-indigo-400" />
                  Athena Shield Moderation Member
                </p>
              </div>
            </div>

            {/* Quota Indicators */}
            {profile && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[var(--border-default)]">
                <div className="space-y-1.5">
                  <p className="text-xs text-muted uppercase tracking-wider">Kuota Total</p>
                  <p className="text-xl font-black text-primary">
                    {profile.quota_balance.toLocaleString('id-ID')} <span className="text-xs font-normal text-secondary">unit</span>
                  </p>
                  <p className="text-[10px] text-muted">
                    Batas maksimum: {profile.quota_limit.toLocaleString('id-ID')} unit kuota
                  </p>
                  
                  {/* Breakdown Kuota Terpisah */}
                  <div className="pt-2 border-t border-[var(--border-default)]/30 space-y-1.5">
                    <p className="text-[9px] text-muted uppercase tracking-wider font-bold">Rincian Kuota</p>
                    
                    {/* Kuota Langganan */}
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-muted flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block flex-shrink-0" />
                        <span>Langganan <span className="text-[8px] opacity-60">(hangus saat expire)</span></span>
                      </span>
                      <span className="text-indigo-400 font-bold">{(profile.subscription_quota || 0).toLocaleString('id-ID')}</span>
                    </div>
                    
                    {/* Kuota Trial */}
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-muted flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-slate-400 inline-block flex-shrink-0" />
                        <span>Trial <span className="text-[8px] opacity-60">(sekali pakai)</span></span>
                      </span>
                      <span className="text-slate-400 font-bold">{(profile.trial_quota || 0).toLocaleString('id-ID')}</span>
                    </div>
                  </div>

                  {/* Masa Aktif Kuota */}
                  {expiryDetails && (
                    <div className="pt-2 border-t border-[var(--border-default)]/30 space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] text-muted">
                        <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
                        </svg>
                        <span>Masa Aktif: <span className={`font-semibold ${expiryDetails.className}`}>{expiryDetails.text}</span></span>
                      </div>
                      
                      {/* Warning Banner jika akan kedaluwarsa */}
                      {expiryDetails.isWarning && (
                        <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[9px] text-rose-400 font-medium">
                          ⚠️ {expiryDetails.message}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                  {/* Lingkaran SVG Neon untuk visual progres kuota */}
                  <div className="relative w-14 h-14 flex-shrink-0">
                    <svg className="w-full h-full transform -rotate-95" viewBox="0 0 36 36">
                      {/* Background circle */}
                      <circle cx="18" cy="18" r="15.915" fill="none" className="stroke-slate-500/10" strokeWidth="2.8" />
                      {/* Progress circle */}
                      <circle
                        cx="18" cy="18" r="15.915" fill="none"
                        className={`transition-all duration-700 ${ringColor}`}
                        strokeWidth="2.8"
                        strokeDasharray="100"
                        strokeDashoffset={100 - Math.min(pct, 100)}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-primary">
                      {Math.min(pct, 100)}%
                    </span>
                  </div>
                  <div className="text-xs text-secondary leading-tight">
                    <p className="font-semibold">Kapasitas API</p>
                    <p className="text-[10px] text-muted">Meningkat pesat jika melakukan upgrade ke tier PRO.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ── Bento Grid: Bagian Bawah (Riwayat Transaksi Pembayaran) ── */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <h2 className="text-md md:text-lg font-bold text-primary flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-400" />
              Riwayat Transaksi Pembayaran
            </h2>
            <p className="text-xs text-secondary mt-0.5">
              Daftar log pembelian kuota dan tagihan pembayaran Anda via Midtrans Sandbox.
            </p>
          </div>
          <button
            onClick={loadTransactionHistory}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 self-start md:self-auto px-3 py-1.5 rounded-lg border border-indigo-500/20 hover:bg-indigo-500/5 transition-all select-none cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            Segarkan Data
          </button>
        </div>

        {loadingHistory ? (
          <div className="bento-card p-12 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs text-muted">Mengambil data transaksi dari Supabase...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="bento-card p-16 text-center" style={{ borderColor: 'var(--border-default)' }}>
            <svg className="w-12 h-12 mx-auto text-muted mb-4 opacity-30" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
            </svg>
            <p className="text-sm font-semibold text-secondary">Belum Ada Transaksi Pembayaran</p>
            <p className="text-xs mt-1 text-muted max-w-sm mx-auto">
              Log pembayaran akan tercatat di sini secara real-time setelah Anda memulai simulasi checkout.
            </p>
          </div>
        ) : (
          <div className="bento-card overflow-hidden border border-[var(--border-default)] shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--border-default)', background: 'rgba(255, 255, 255, 0.01)' }}>
                    {['Tanggal', 'Order ID', 'Tipe', 'Item / Paket', 'Nominal', 'Kredit', 'Status', 'Aksi'].map((h) => (
                      <th key={h} className="px-4 py-4 font-bold uppercase tracking-wider text-[10px] text-secondary whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ divideColor: 'var(--border-default)' }}>
                  {paginatedTransactions.map((tx) => {
                    const isPending = tx.status === 'pending';
                    const isSettlement = tx.status === 'settlement';
                    const isLoading = actionLoading === tx.id;

                    return (
                      <tr key={tx.id} className="hover:bg-card-hover transition-all duration-150">
                        {/* Tanggal */}
                        <td className="px-4 py-4 whitespace-nowrap text-xs text-secondary font-medium">
                          {new Date(tx.created_at).toLocaleString('id-ID', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </td>
                        {/* Order ID */}
                        <td className="px-4 py-4">
                          <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-500/10 text-slate-400 border border-slate-500/5">
                            {tx.id.length > 25 ? `${tx.id.substring(0, 25)}...` : tx.id}
                          </span>
                        </td>
                        {/* Tipe Transaksi */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          {getTypeBadge(tx)}
                        </td>
                        {/* Paket */}
                        <td className="px-4 py-4 font-semibold text-xs text-secondary whitespace-nowrap">
                          {(() => {
                            const packageNames = {
                              'PRO': 'Pro (1 Bulan)', 'PRO_1M': 'Pro (1 Bulan)', 'PRO_3M': 'Pro (3 Bulan)',
                              'PRO_6M': 'Pro (6 Bulan)', 'PRO_12M': 'Pro (1 Tahun)',
                              'ENTERPRISE': 'Enterprise (1 Bulan)', 'ENTERPRISE_1M': 'Enterprise (1 Bulan)',
                              'ENTERPRISE_3M': 'Enterprise (3 Bulan)', 'ENTERPRISE_6M': 'Enterprise (6 Bulan)',
                              'ENTERPRISE_12M': 'Enterprise (1 Tahun)',
                            };
                            const pkgName = packageNames[tx.package_id] || (
                              tx.target_tier === 'PRO' ? 'Pro Upgrade' :
                              tx.target_tier === 'ENTERPRISE' ? 'Enterprise Upgrade' : 'Langganan'
                            );
                            const icon = tx.target_tier === 'PRO' ? '💎' : tx.target_tier === 'ENTERPRISE' ? '👑' : '📦';
                            const colorClass = tx.target_tier === 'PRO' ? 'text-amber-500' : tx.target_tier === 'ENTERPRISE' ? 'text-violet-500' : 'text-emerald-500';
                            
                            return (
                              <span className={`flex items-center gap-1.5 ${colorClass}`}>
                                <span>{icon}</span> {pkgName}
                              </span>
                            );
                          })()}
                        </td>
                        {/* Harga */}
                        <td className="px-4 py-4 font-bold text-xs text-primary whitespace-nowrap">
                          Rp {tx.amount.toLocaleString('id-ID')}
                        </td>
                        {/* Kredit Kuota — hanya tampil untuk transaksi sukses */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          {isSettlement ? (
                            <span className="font-extrabold text-indigo-500 dark:text-indigo-400 text-sm">
                              +{tx.quota_units.toLocaleString('id-ID')}
                            </span>
                          ) : (
                            <span className="text-muted text-xs">—</span>
                          )}
                        </td>
                        {/* Status */}
                        <td className="px-4 py-4 whitespace-nowrap">{getStatusBadge(tx.status)}</td>
                        {/* Aksi */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          {isPending ? (
                            <div className="flex items-center gap-1.5">
                              {/* Tombol Lanjutkan Bayar */}
                              <button
                                onClick={() => handleResumePayment(tx)}
                                disabled={isLoading}
                                title="Lanjutkan Pembayaran"
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/40 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isLoading ? (
                                  <span className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Play className="w-3 h-3" />
                                )}
                                <span className="hidden sm:inline">Bayar</span>
                              </button>
                              {/* Tombol Batalkan */}
                              <button
                                onClick={() => handleCancelTransaction(tx)}
                                disabled={isLoading}
                                title="Batalkan Transaksi"
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 hover:border-rose-500/40 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isLoading ? (
                                  <span className="w-3 h-3 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Ban className="w-3 h-3" />
                                )}
                                <span className="hidden sm:inline">Batal</span>
                              </button>
                            </div>
                          ) : isSettlement ? (
                            <span className="text-[10px] text-emerald-500 font-medium flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Selesai
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls untuk Tabel Transaksi */}
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

    </div>
  );
}
