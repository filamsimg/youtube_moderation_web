'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { 
  ReceiptText, Search, RefreshCw, Download, CheckCircle2, AlertCircle, 
  XCircle, Clock, Eye, X, Copy, Check, User
} from 'lucide-react';
import Link from 'next/link';
import { formatIDR } from '@/lib/utils';
import { TableSkeleton } from '@/components/ui/Skeleton';
import StatCard from '@/components/ui/StatCard';

// Client-side in-memory cache
let cachedAdminTransactions = null;

export default function AdminTransactionsPage() {
  const [data, setData] = useState(cachedAdminTransactions);
  const [loading, setLoading] = useState(!cachedAdminTransactions);
  const [syncingId, setSyncingId] = useState(null);
  const [selectedTx, setSelectedTx] = useState(null); // Modal detail invoice
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'settlement' | 'pending' | 'expired' | 'cancel'
  const [copiedId, setCopiedId] = useState(null);
  const toast = useToast();
  useEffect(() => {
    let isMounted = true;
    async function fetchTransactions() {
      try {
        const res = await fetch('/api/admin/transactions');
        const json = await res.json();
        if (json.success) {
          cachedAdminTransactions = json;
          if (isMounted) setData(json);
        } else if (!cachedAdminTransactions && isMounted) {
          toast.error(json.error || 'Gagal memuat log transaksi');
        }
      } catch (err) {
        console.error('Fetch transactions error:', err);
        if (!cachedAdminTransactions && isMounted) {
          toast.error('Gagal terhubung ke server');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchTransactions();
    return () => {
      isMounted = false;
    };
  }, [toast]);

  const stats = data?.stats || {
    totalTransactions: 0,
    totalRevenue: 0,
    settlementCount: 0,
    pendingCount: 0,
    expiredCount: 0,
    cancelledCount: 0,
  };

  // Filter Data Transaksi secara Realtime
  const filteredTransactions = useMemo(() => {
    const list = data?.transactions || [];
    return list.filter((t) => {
      // Filter Status
      if (statusFilter !== 'all') {
        if (statusFilter === 'cancel') {
          if (t.status !== 'cancel' && t.status !== 'cancelled') return false;
        } else if (t.status !== statusFilter) {
          return false;
        }
      }

      // Filter Pencarian
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = t.id && t.id.toLowerCase().includes(q);
        const matchEmail = t.user_email && t.user_email.toLowerCase().includes(q);
        const matchTier = t.target_tier && t.target_tier.toLowerCase().includes(q);
        const matchPayType = t.payment_type && t.payment_type.toLowerCase().includes(q);
        return matchId || matchEmail || matchTier || matchPayType;
      }

      return true;
    });
  }, [data?.transactions, statusFilter, searchQuery]);

  const handleRefreshData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/transactions');
      const json = await res.json();
      if (json.success) {
        cachedAdminTransactions = json;
        setData(json);
      } else {
        toast.error(json.error || 'Gagal memuat log transaksi');
      }
    } catch (err) {
      console.error('Fetch transactions error:', err);
      toast.error('Gagal terhubung ke server');
    } finally {
      setLoading(false);
    }
  };

  // Handle Sync status ke Midtrans API
  const handleSyncStatus = async (orderId) => {
    try {
      setSyncingId(orderId);
      const res = await fetch('/api/admin/transactions/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message || 'Status transaksi berhasil diperbarui');
        handleRefreshData();
      } else {
        toast.error(json.error || 'Gagal sinkronisasi dengan Midtrans');
      }
    } catch (err) {
      console.error('Sync status error:', err);
      toast.error('Koneksi internet bermasalah');
    } finally {
      setSyncingId(null);
    }
  };

  // Copy Order ID
  const handleCopy = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success('Order ID disalin ke clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      toast.error('Tidak ada data transaksi untuk diekspor');
      return;
    }

    const headers = ['Order ID', 'Email Pembeli', 'Paket', 'Nominal (IDR)', 'Status', 'Metode Bayar', 'Waktu Order', 'Waktu Lunas'];
    const rows = filteredTransactions.map((t) => [
      `"${t.id}"`,
      `"${t.user_email}"`,
      `"${t.target_tier || t.package_id}"`,
      t.amount || 0,
      `"${t.status}"`,
      `"${t.midtrans_payment_type || t.payment_type || '-'}"`,
      `"${t.created_at || '-'}"`,
      `"${t.paid_at || '-'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `laporan_transaksi_athena_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Laporan transaksi berhasil diunduh (.CSV)');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ── Header Halaman ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-primary flex items-center gap-2">
            <ReceiptText className="w-6 h-6 text-emerald-500" />
            Manajemen Transaksi &amp; Pembayaran
          </h1>
          <p className="text-xs text-muted mt-1">
            Pusat monitoring arus kas, rekonsiliasi invoice Midtrans Sandbox, dan status langganan kreator.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefreshData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-[var(--border-default)] bg-card text-secondary hover:text-primary hover:bg-[var(--bg-card-hover)] transition-all cursor-pointer shadow-sm disabled:opacity-50"
            title="Muat Ulang Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all cursor-pointer shadow-md shadow-emerald-500/20"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* ── 4 Bento Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Pendapatan (Lunas)"
          value={formatIDR(stats.totalRevenue)}
          sub={`${stats.settlementCount} Transaksi Settlement`}
          color="emerald"
          icon={<CheckCircle2 className="w-5 h-5" />}
        />
        <StatCard
          label="Menunggu Pembayaran"
          value={`${stats.pendingCount} Invoice`}
          sub="Belum diselesaikan kreator"
          color="amber"
          icon={<Clock className="w-5 h-5" />}
        />
        <StatCard
          label="Tagihan Kedaluwarsa"
          value={`${stats.expiredCount} Invoice`}
          sub="Batas waktu bayar habis"
          color="rose"
          icon={<AlertCircle className="w-5 h-5" />}
        />
        <StatCard
          label="Dibatalkan (Cancelled)"
          value={`${stats.cancelledCount} Invoice`}
          sub="Dibatalkan user/admin"
          color="violet"
          icon={<XCircle className="w-5 h-5" />}
        />
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="p-4 rounded-2xl border bg-card border-[var(--border-default)] shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari Order ID, Email, Paket..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-default)] text-primary focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-medium"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { id: 'all', label: 'Semua Status' },
            { id: 'settlement', label: 'Settlement' },
            { id: 'pending', label: 'Pending' },
            { id: 'expired', label: 'Expired' },
            { id: 'cancel', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-[var(--bg-card-hover)] border border-[var(--border-default)] text-secondary hover:text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tabel Transaksi Utama ── */}
      <div className="rounded-2xl border bg-card border-[var(--border-default)] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={6} />
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <ReceiptText className="w-10 h-10 text-muted mx-auto opacity-40" />
            <p className="text-sm font-semibold text-primary">Tidak Ada Transaksi Ditemukan</p>
            <p className="text-xs text-muted">Coba ubah kata kunci pencarian atau filter status transaksi.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-default)] bg-[var(--bg-card-hover)] text-muted font-semibold">
                  <th className="py-3 px-4">Order ID &amp; Waktu</th>
                  <th className="py-3 px-4">Kreator (Email)</th>
                  <th className="py-3 px-4">Paket &amp; Nominal</th>
                  <th className="py-3 px-4">Metode Bayar</th>
                  <th className="py-3 px-4">Status Transaksi</th>
                  <th className="py-3 px-4 text-right">Aksi Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-default)]">
                {filteredTransactions.map((trx) => {
                  const isSettled = trx.status === 'settlement';
                  const isPending = trx.status === 'pending';
                  const isExpired = trx.status === 'expired';
                  const isCancelled = trx.status === 'cancel' || trx.status === 'cancelled';
                  const isSyncing = syncingId === trx.id;

                  return (
                    <tr key={trx.id} className="hover:bg-[var(--bg-card-hover)] transition-colors">
                      {/* Kolom 1: Order ID */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-primary font-mono text-[11px]">
                            {trx.id}
                          </span>
                          <button
                            onClick={() => handleCopy(trx.id)}
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-muted hover:text-primary transition-colors cursor-pointer"
                            title="Salin Order ID"
                          >
                            {copiedId === trx.id ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <p className="text-[10px] text-muted mt-0.5">
                          {trx.created_at ? new Date(trx.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : '-'}
                        </p>
                      </td>

                      {/* Kolom 2: Email Pembeli */}
                      <td className="py-3 px-4">
                        <p className="font-semibold text-primary truncate max-w-[200px]" title={trx.user_email}>
                          {trx.user_email}
                        </p>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Akun Kreator Terdaftar</p>
                      </td>

                      {/* Kolom 3: Paket & Nominal */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            trx.target_tier === 'ENTERPRISE'
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300'
                              : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300'
                          }`}>
                            {trx.target_tier || trx.package_id}
                          </span>
                        </div>
                        <p className="text-xs font-extrabold text-primary mt-1">
                          {formatIDR(trx.amount || 0)}
                        </p>
                      </td>

                      {/* Kolom 4: Metode Bayar */}
                      <td className="py-3 px-4">
                        <span className="font-medium text-secondary capitalize text-xs">
                          {(trx.midtrans_payment_type || trx.payment_type) ? (trx.midtrans_payment_type || trx.payment_type).replace('_', ' ') : 'Midtrans Snap'}
                        </span>
                        {isSettled && trx.paid_at && (
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                            Lunas: {new Date(trx.paid_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                          </p>
                        )}
                      </td>

                      {/* Kolom 5: Status Badge */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          isSettled
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : isPending
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                            : isExpired
                            ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                            : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                        }`}>
                          {isSettled && <CheckCircle2 className="w-3 h-3" />}
                          {isPending && <Clock className="w-3 h-3" />}
                          {isExpired && <AlertCircle className="w-3 h-3" />}
                          {isCancelled && <XCircle className="w-3 h-3" />}
                          {isSettled ? 'Settlement' : isPending ? 'Pending' : isExpired ? 'Expired' : 'Cancelled'}
                        </span>
                      </td>

                      {/* Kolom 6: Aksi Admin */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Tombol Detail */}
                          <button
                            onClick={() => setSelectedTx(trx)}
                            className="p-1.5 rounded-lg border border-[var(--border-default)] bg-card text-secondary hover:text-primary hover:bg-[var(--bg-card-hover)] transition-all cursor-pointer"
                            title="Lihat Rincian Teknis"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Tombol Sync Midtrans — Hanya aktif untuk transaksi Pending */}
                          {isPending ? (
                            <button
                              onClick={() => handleSyncStatus(trx.id)}
                              disabled={isSyncing}
                              className="p-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 dark:text-amber-400 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                              title="Verifikasi status pembayaran Midtrans (Cek apakah sudah dibayar)"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                            </button>
                          ) : isSettled ? (
                            <button
                              disabled
                              className="p-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 opacity-60 cursor-not-allowed"
                              title="Status Pembayaran Lunas (Settlement) — Terverifikasi"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              disabled
                              className="p-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card-hover)] text-muted opacity-40 cursor-not-allowed"
                              title="Status transaksi sudah final"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Tautan ke Manajemen User */}
                          <Link
                            href="/admin/users"
                            className="p-1.5 rounded-lg border border-[var(--border-default)] bg-card text-indigo-600 hover:bg-indigo-500/10 transition-all"
                            title="Buka Manajemen Akun User"
                          >
                            <User className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          MODAL DETAIL TRANSAKSI & TEKNIS MIDTRANS
      ══════════════════════════════════════════════════════════════════ */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div 
            className="w-full max-w-xl rounded-2xl bg-card border border-[var(--border-default)] shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
              <div>
                <h3 className="text-sm font-bold text-primary flex items-center gap-1.5">
                  <ReceiptText className="w-4 h-4 text-emerald-500" />
                  Rincian Invoice Transaksi
                </h3>
                <p className="text-xs text-muted font-mono mt-0.5">{selectedTx.id}</p>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="p-1.5 rounded-xl text-muted hover:text-primary hover:bg-[var(--bg-card-hover)] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Status Highlight Banner */}
            <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
              selectedTx.status === 'settlement' 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-300'
                : selectedTx.status === 'pending'
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-300'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-300'
            }`}>
              <div className="space-y-0.5">
                <p className="font-bold uppercase tracking-wider text-[10px]">Status Midtrans</p>
                <p className="text-sm font-extrabold">{selectedTx.status.toUpperCase()}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-[10px] uppercase tracking-wider">Total Tagihan</p>
                <p className="text-sm font-extrabold">{formatIDR(selectedTx.amount || 0)}</p>
              </div>
            </div>

            {/* Metadata Detail */}
            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-default)]">
                <div>
                  <span className="text-muted font-medium">Email Pembeli:</span>
                  <p className="font-semibold text-primary break-all">{selectedTx.user_email}</p>
                </div>
                <div>
                  <span className="text-muted font-medium">Paket Langganan:</span>
                  <p className="font-semibold text-primary">{selectedTx.target_tier || selectedTx.package_id}</p>
                </div>
                <div>
                  <span className="text-muted font-medium">Metode Pembayaran:</span>
                  <p className="font-semibold text-primary capitalize">{selectedTx.midtrans_payment_type || selectedTx.payment_type || 'Midtrans Snap'}</p>
                </div>
                <div>
                  <span className="text-muted font-medium">Waktu Transaksi Dibuat:</span>
                  <p className="font-semibold text-primary">{selectedTx.created_at ? new Date(selectedTx.created_at).toLocaleString('id-ID') : '-'}</p>
                </div>
                {selectedTx.paid_at && (
                  <div className="col-span-2">
                    <span className="text-muted font-medium">Waktu Pembayaran Lunas (Settlement):</span>
                    <p className="font-semibold text-emerald-600 dark:text-emerald-400">{new Date(selectedTx.paid_at).toLocaleString('id-ID')}</p>
                  </div>
                )}
              </div>

              {/* Raw Response Technical Debug Viewer */}
              {selectedTx.raw_response && (
                <div className="space-y-1 pt-1">
                  <span className="text-[11px] font-bold text-muted">Response Payload Midtrans (JSON Log):</span>
                  <pre className="p-3 rounded-xl bg-slate-950 text-emerald-400 text-[10px] font-mono overflow-x-auto max-h-40 border border-slate-800">
                    {JSON.stringify(selectedTx.raw_response, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--border-default)]">
              <div>
                {selectedTx.status === 'settlement' && (
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Transaksi Sah &amp; Terverifikasi
                  </span>
                )}
                {selectedTx.status === 'pending' && (
                  <span className="text-xs font-semibold text-amber-500 flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    Menunggu Pembayaran
                  </span>
                )}
                {(selectedTx.status === 'expired' || selectedTx.status === 'cancelled') && (
                  <span className="text-xs font-semibold text-muted flex items-center gap-1.5">
                    <XCircle className="w-4 h-4" />
                    Status Transaksi Final
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {selectedTx.status === 'pending' && (
                  <button
                    onClick={() => {
                      handleSyncStatus(selectedTx.id);
                      setSelectedTx(null);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-500 text-white transition-all cursor-pointer shadow-sm"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Verifikasi Midtrans
                  </button>
                )}
                <button
                  onClick={() => setSelectedTx(null)}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-[var(--border-default)] text-secondary hover:text-primary transition-all cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
