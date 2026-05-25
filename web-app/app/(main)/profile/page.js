'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useQuota } from '@/contexts/QuotaContext';
import { useYouTube } from '@/contexts/YouTubeContext';
import { useToast } from '@/contexts/ToastContext';
import PaginationControls from '@/components/PaginationControls';
import { Tv, CheckCircle2, User, CreditCard, Shield, RefreshCw } from 'lucide-react';

export default function ProfilePage() {
  const { data: session } = useSession();
  const { profile, loading: loadingQuota, fetchQuota } = useQuota();
  const { channels, activeChannel, loadingChannel, updateSelectedChannelId } = useYouTube();
  const toast = useToast();

  const [transactions, setTransactions] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

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

  const handleSelectChannel = (channel) => {
    if (channel.id === activeChannel?.id) return;
    updateSelectedChannelId(channel.id);
    toast.success(`Berhasil beralih ke kanal: ${channel.snippet.title}`);
  };

  const getStatusBadge = (status) => {
    const cls = {
      settlement: 'badge badge-success px-2.5 py-1 text-xs font-semibold rounded-lg',
      pending: 'badge badge-warning px-2.5 py-1 text-xs font-semibold rounded-lg',
      expire: 'badge badge-danger px-2.5 py-1 text-xs font-semibold rounded-lg',
      cancel: 'badge badge-muted px-2.5 py-1 text-xs font-semibold rounded-lg',
    }[status] || 'badge badge-muted px-2.5 py-1 text-xs font-semibold rounded-lg';

    const labels = {
      settlement: '✅ Pembayaran Sukses',
      pending: '⏳ Menunggu Pembayaran',
      expire: '❌ Batas Waktu Habis',
      cancel: '🗑️ Dibatalkan',
    };

    return <span className={cls}>{labels[status] || status}</span>;
  };

  // Kalkulasi Pagination
  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const paginatedTransactions = transactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Persentase lingkaran progres kuota
  const pct = profile?.percentage ?? 100;
  const strokeDashoffset = 251.2 - (251.2 * Math.min(pct, 100)) / 100;
  const ringColor =
    pct > 50 ? 'stroke-emerald-500' :
    pct > 20 ? 'stroke-amber-400' :
    'stroke-rose-500';

  return (
    <div className="animate-fade-in-up space-y-6 pb-12 max-w-5xl mx-auto">
      
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
        <div className="bento-card p-6 md:col-span-2 flex flex-col justify-between relative overflow-hidden">
          {/* Neon Glow */}
          <div className="absolute right-0 top-0 w-48 h-48 bg-indigo-500/5 blur-[40px] rounded-full pointer-events-none" />
          
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              {/* Avatar Google HD */}
              <img
                src={session?.user?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(session?.user?.name || 'User')}&background=6366f1&color=fff&size=64`}
                alt="user avatar"
                className="w-16 h-16 rounded-full border-2 border-indigo-500/30 object-cover shadow-lg"
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
                <div className="space-y-1">
                  <p className="text-xs text-muted uppercase tracking-wider">Kuota Tersisa</p>
                  <p className="text-xl font-black text-primary">
                    {profile.quota_balance.toLocaleString('id-ID')} <span className="text-xs font-normal text-secondary">unit</span>
                  </p>
                  <p className="text-[10px] text-muted">
                    Batas maksimum: {profile.quota_limit.toLocaleString('id-ID')} unit kuota
                  </p>
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

        {/* Modul 2: YouTube Channel Management (Bento Card 2) */}
        <div className="bento-card p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-primary flex items-center gap-1.5">
              <Tv className="w-4 h-4 text-amber-500" />
              Kanal YouTube Aktif
            </h3>
            
            {activeChannel ? (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-500/5 border border-amber-500/20">
                <img
                  src={activeChannel.snippet.thumbnails.default.url}
                  alt={activeChannel.snippet.title}
                  className="w-10 h-10 rounded-full border border-amber-500/30 flex-shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-amber-400 truncate">{activeChannel.snippet.title}</p>
                  <p className="text-[10px] text-muted truncate">{activeChannel.snippet.customUrl}</p>
                </div>
              </div>
            ) : (
              <div className="p-3 text-center text-xs text-muted border border-dashed rounded-xl">
                Tidak ada kanal aktif terpilih
              </div>
            )}

            {/* Opsi Alih Kanal Langsung */}
            <div className="space-y-2">
              <p className="text-[10px] text-muted uppercase tracking-wider">Alih Kanal YouTube:</p>
              
              {loadingChannel ? (
                <div className="flex items-center justify-center py-4">
                  <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : channels.length <= 1 ? (
                <p className="text-[11px] text-muted">Hanya memiliki 1 kanal YouTube.</p>
              ) : (
                <div className="max-h-24 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-500/5">
                  {channels.map((ch) => {
                    const isActive = ch.id === activeChannel?.id;
                    return (
                      <div
                        key={ch.id}
                        onClick={() => handleSelectChannel(ch)}
                        className={`flex items-center justify-between py-1.5 cursor-pointer text-xs transition-colors rounded-lg px-2 ${
                          isActive
                            ? 'text-indigo-400 font-semibold bg-indigo-500/5'
                            : 'text-secondary hover:text-primary hover:bg-card-hover'
                        }`}
                      >
                        <span className="truncate max-w-[130px]">{ch.snippet.title}</span>
                        {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
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
                    {['Tanggal Transaksi', 'Order ID', 'Item / Paket', 'Nominal Pembayaran', 'Kredit Kuota', 'Status'].map((h) => (
                      <th key={h} className="px-6 py-4.5 font-bold uppercase tracking-wider text-[11px] text-secondary">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ divideColor: 'var(--border-default)' }}>
                  {paginatedTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-card-hover transition-all duration-150 hover:scale-[1.002]">
                      {/* Tanggal */}
                      <td className="px-6 py-4.5 whitespace-nowrap text-secondary font-medium">
                        {new Date(tx.created_at).toLocaleString('id-ID', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </td>
                      {/* Order ID */}
                      <td className="px-6 py-4.5 font-mono text-[13px] font-bold text-secondary">
                        <span className="px-2.5 py-1 rounded bg-slate-500/10 text-slate-400 border border-slate-500/5">{tx.id}</span>
                      </td>
                      {/* Paket */}
                      <td className="px-6 py-4.5 font-semibold text-secondary">
                        {tx.target_tier === 'PRO' ? (
                          <span className="flex items-center gap-1.5 text-amber-500">
                            <span>💎</span> Pro Upgrade
                          </span>
                        ) : tx.target_tier === 'ENTERPRISE' ? (
                          <span className="flex items-center gap-1.5 text-violet-500">
                            <span>👑</span> Enterprise Upgrade
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-emerald-500">
                            <span>📦</span> Starter Top-up
                          </span>
                        )}
                      </td>
                      {/* Harga */}
                      <td className="px-6 py-4.5 font-bold text-primary">
                        Rp {tx.amount.toLocaleString('id-ID')}
                      </td>
                      {/* Tambahan Kuota */}
                      <td className="px-6 py-4.5 font-extrabold text-indigo-500 dark:text-indigo-400 text-md">
                        +{tx.quota_units.toLocaleString('id-ID')} Unit
                      </td>
                      {/* Status */}
                      <td className="px-6 py-4.5 whitespace-nowrap">{getStatusBadge(tx.status)}</td>
                    </tr>
                  ))}
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
