'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { 
  Users, CreditCard, MessageSquare, Database, TrendingUp, ShieldCheck, 
  ArrowUpRight, X, UserCheck, UserX, DollarSign, Filter, CheckCircle2, AlertCircle, XCircle
} from 'lucide-react';
import Link from 'next/link';
import StatCard from '@/components/ui/StatCard';
import { AdminOverviewSkeleton } from '@/components/ui/Skeleton';
import { formatIDR } from '@/lib/utils';

export default function AdminOverviewPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedModal, setSelectedModal] = useState(null); // 'users' | 'revenue' | null
  const [userFilter, setUserFilter] = useState('all'); // 'all' | 'active' | 'suspended' | 'paid'
  const toast = useToast();

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/admin/stats');
        const json = await response.json();
        if (json.success) {
          setData(json);
        } else {
          toast.error(json.error || 'Gagal memuat statistik admin');
        }
      } catch (error) {
        console.error('Fetch stats error:', error);
        toast.error('Koneksi internet bermasalah');
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [toast]);

  if (loading) {
    return <AdminOverviewSkeleton />;
  }

  if (!data) return null;

  const { stats, newestUsers, registrationTrend, allUsers = [], recentTransactions = [] } = data;

  // Filter list pengguna untuk modal
  const filteredUsers = allUsers.filter((u) => {
    if (userFilter === 'active') return u.is_active !== false;
    if (userFilter === 'suspended') return u.is_active === false;
    if (userFilter === 'paid') return u.tier === 'PRO' || u.tier === 'ENTERPRISE';
    return true;
  });

  // Scaling untuk grafik SVG tren pendaftaran
  const maxTrendVal = Math.max(...(registrationTrend || []).map(t => t.count), 1);
  const width = 600;
  const height = 150;
  const padding = 20;
  const graphWidth = width - padding * 2;
  const graphHeight = height - padding * 2;
  
  let svgPoints = '';
  if (registrationTrend && registrationTrend.length > 0) {
    registrationTrend.forEach((t, index) => {
      const x = padding + (index / (registrationTrend.length - 1)) * graphWidth;
      const y = height - padding - (t.count / maxTrendVal) * graphHeight;
      svgPoints += `${index === 0 ? 'M' : 'L'} ${x} ${y} `;
    });
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-primary flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-rose-500" />
            Dashboard Ikhtisar Admin
          </h1>
          <p className="text-xs text-muted mt-1">
            Pantau dan kelola seluruh performa operasional sistem Athena Shield secara terpusat.
          </p>
        </div>
      </div>

      {/* ── Grid Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Users (Clickable -> Modal / Users Page) */}
        <div 
          onClick={() => setSelectedModal('users')}
          className="cursor-pointer group relative transition-transform duration-200 active:scale-[0.99]"
          title="Klik untuk melihat rincian pengguna aktif & suspend"
        >
          <div className="absolute -top-1.5 -right-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <span className="p-1 rounded-full bg-indigo-500 text-white shadow-md block">
              <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <StatCard
            label="Total Pengguna"
            value={stats.totalUsers}
            sub={
              <div className="space-y-1.5 mt-2 text-[10px]">
                <div className="flex items-center justify-between text-muted border-b border-[var(--border-default)] pb-1">
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                    <UserCheck className="w-3 h-3" /> Aktif: {stats.activeUsers}
                  </span>
                  <span className="text-rose-500 font-semibold flex items-center gap-0.5">
                    <UserX className="w-3 h-3" /> Suspend: {stats.suspendedUsers}
                  </span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Free: <strong className="text-secondary">{stats.tierCounts.FREE}</strong></span>
                  <span>Pro: <strong className="text-indigo-500">{stats.tierCounts.PRO}</strong></span>
                  <span>Ent: <strong className="text-emerald-500">{stats.tierCounts.ENTERPRISE}</strong></span>
                </div>
              </div>
            }
            color="indigo"
            icon={<Users className="w-5 h-5" />}
          />
        </div>

        {/* Card 2: Total Revenue (Clickable -> Modal / Plans Page) */}
        <div 
          onClick={() => setSelectedModal('revenue')}
          className="cursor-pointer group relative transition-transform duration-200 active:scale-[0.99]"
          title="Klik untuk melihat rincian pendapatan & status transaksi Midtrans"
        >
          <div className="absolute -top-1.5 -right-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <span className="p-1 rounded-full bg-emerald-500 text-white shadow-md block">
              <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <StatCard
            label="Total Pendapatan"
            value={formatIDR(stats.totalRevenue)}
            sub={
              <div className="space-y-1.5 mt-2 text-[10px]">
                <div className="flex items-center justify-between text-muted border-b border-[var(--border-default)] pb-1">
                  <span>Settlement Midtrans:</span>
                  <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                    {stats.trxStatusCounts?.settlement || 0} Transaksi
                  </strong>
                </div>
                <div className="flex justify-between text-muted">
                  <span>PRO: <strong className="text-primary">{formatIDR(stats.revenueByTier.PRO)}</strong></span>
                  <span>ENT: <strong className="text-primary">{formatIDR(stats.revenueByTier.ENTERPRISE)}</strong></span>
                </div>
              </div>
            }
            color="emerald"
            icon={<CreditCard className="w-5 h-5" />}
          />
        </div>

        {/* Card 3: Total Comments Moderated (Format Asli/Lama) */}
        <StatCard
          label="Komentar Dimoderasi"
          value={stats.totalComments.toLocaleString('id-ID')}
          sub="Total Volume Spam Judol Tersaring"
          color="rose"
          icon={<MessageSquare className="w-5 h-5" />}
        />

        {/* Card 4: Global Quota Consumed (Format Asli/Lama) */}
        <StatCard
          label="Kuota Server Hari Ini"
          value={
            <>
              {(stats.todayQuotaUsed || 0).toLocaleString('id-ID')}{' '}
              <span className="text-[10px] text-muted font-normal">/ 10.000 unit</span>
            </>
          }
          color="amber"
          icon={<Database className="w-5 h-5" />}
          sub={(() => {
            const rawQuota = Math.max(0, stats.todayQuotaUsed || 0);
            const percentage = Math.max(0, Math.min(Math.round((rawQuota / 10000) * 100), 100));
            const barColor = percentage > 90 ? 'bg-rose-500' : percentage > 70 ? 'bg-amber-500' : 'bg-emerald-500';
            const textColor = percentage > 90 ? 'text-rose-500' : percentage > 70 ? 'text-amber-500' : 'text-emerald-500';
            return (
              <div className="mt-3.5 space-y-1">
                <div className="h-1.5 rounded-full overflow-hidden bg-[var(--bg-card-hover)] border border-[var(--border-default)]">
                  <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${percentage}%` }} />
                </div>
                <div className="flex justify-between text-[9px] font-medium">
                  <span className={textColor}>{percentage}% Terpakai</span>
                  <span className="text-muted">Total: {(stats.totalQuotaUsed || 0).toLocaleString('id-ID')} u</span>
                </div>
              </div>
            );
          })()}
        />
      </div>

      {/* ── Trend Graph & 5 Newest Users ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Graph (2 Cols on desktop) */}
        <div className="lg:col-span-2 p-5 rounded-2xl border bg-card border-[var(--border-default)] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-primary flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-rose-500" />
              Tren Pendaftaran Pengguna (30 Hari Terakhir)
            </h2>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-muted font-bold">Terbaru</span>
          </div>

          <div className="w-full overflow-x-auto">
            <div className="min-w-[500px] flex flex-col justify-center">
              <svg className="w-full h-[180px]" viewBox={`0 0 ${width} ${height}`}>
                {/* Graph Background Grids */}
                <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="var(--border-default)" strokeWidth="0.5" strokeDasharray="3 3" />
                <line x1={padding} y1={height/2} x2={width - padding} y2={height/2} stroke="var(--border-default)" strokeWidth="0.5" strokeDasharray="3 3" />
                <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="var(--border-default)" strokeWidth="1" />

                {/* SVG Trend Line */}
                <path d={svgPoints} fill="none" stroke="rgb(244, 63, 94)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_4px_6px_rgba(244,63,94,0.3)]" />
                
                {/* SVG Area fill under path */}
                {registrationTrend && registrationTrend.length > 0 && (
                  <path
                    d={`${svgPoints} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`}
                    fill="url(#grad)"
                    opacity="0.1"
                  />
                )}

                <defs>
                  <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgb(244, 63, 94)" />
                    <stop offset="100%" stopColor="rgb(244, 63, 94)" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Graph Labels */}
                <text x={padding} y={height - 5} fill="var(--text-muted)" fontSize="8" textAnchor="start">
                  {registrationTrend[0]?.date ? new Date(registrationTrend[0].date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'}) : ''}
                </text>
                <text x={width - padding} y={height - 5} fill="var(--text-muted)" fontSize="8" textAnchor="end">
                  {registrationTrend[registrationTrend.length-1]?.date ? new Date(registrationTrend[registrationTrend.length-1].date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'}) : ''}
                </text>
              </svg>
            </div>
          </div>
        </div>

        {/* 5 Newest Users (1 Col on desktop) */}
        <div className="p-5 rounded-2xl border bg-card border-[var(--border-default)] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-primary">Kreator Baru Bergabung</h2>
            <Link href="/admin/users" className="text-[10px] text-rose-500 font-bold hover:underline">Semua User</Link>
          </div>

          <div className="divide-y divide-[var(--border-default)]">
            {newestUsers.map((user, idx) => (
              <div key={user.email || idx} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-primary truncate" title={user.email}>
                    {user.email}
                  </p>
                  <p className="text-[10px] text-muted mt-0.5">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                  </p>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                  user.tier === 'FREE' ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' :
                  user.tier === 'PRO' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300' :
                  'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300'
                }`}>
                  {user.tier}
                </span>
              </div>
            ))}
            {newestUsers.length === 0 && (
              <p className="text-xs text-muted text-center py-6">Belum ada user terdaftar.</p>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          MODAL DETAIL 1: RINCIAN PENGGUNA (AKTIF / SUSPEND / TIER)
      ══════════════════════════════════════════════════════════════════ */}
      {selectedModal === 'users' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-card border border-[var(--border-default)] w-full max-w-2xl rounded-3xl p-6 shadow-2xl space-y-5 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-4">
              <div>
                <h3 className="text-base font-bold text-primary flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-500" />
                  Rincian Spesifik Pengguna
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  Informasi status keaktifan akun dan distribusi paket langganan.
                </p>
              </div>
              <button
                onClick={() => setSelectedModal(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-[var(--bg-card-hover)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-2xl bg-indigo-500/5 border border-indigo-500/15 text-center">
                <p className="text-[10px] text-muted font-medium">Total Akun</p>
                <p className="text-base font-extrabold text-indigo-500">{stats.totalUsers}</p>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/15 text-center">
                <p className="text-[10px] text-muted font-medium">Pengguna Aktif</p>
                <p className="text-base font-extrabold text-emerald-500">{stats.activeUsers}</p>
              </div>
              <div className="p-3 rounded-2xl bg-rose-500/5 border border-rose-500/15 text-center">
                <p className="text-[10px] text-muted font-medium">Ditangguhkan (Suspend)</p>
                <p className="text-base font-extrabold text-rose-500">{stats.suspendedUsers}</p>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[11px] text-muted flex items-center gap-1">
                <Filter className="w-3 h-3" /> Filter:
              </span>
              {[
                { id: 'all', label: 'Semua' },
                { id: 'active', label: `Aktif (${stats.activeUsers})` },
                { id: 'suspended', label: `Suspend (${stats.suspendedUsers})` },
                { id: 'paid', label: `Berbayar (${stats.tierCounts.PRO + stats.tierCounts.ENTERPRISE})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setUserFilter(tab.id)}
                  className={`px-3 py-1 rounded-xl text-[11px] font-semibold transition-all ${
                    userFilter === tab.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-[var(--bg-card-hover)] text-muted hover:text-primary'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* List Table */}
            <div className="overflow-y-auto flex-1 border border-[var(--border-default)] rounded-2xl divide-y divide-[var(--border-default)]">
              {filteredUsers.map((user, idx) => (
                <div key={user.email || idx} className="p-3 flex items-center justify-between hover:bg-[var(--bg-card-hover)] transition-colors text-xs">
                  <div className="min-w-0 pr-3">
                    <p className="font-semibold text-primary truncate">{user.email}</p>
                    <p className="text-[10px] text-muted">
                      Bergabung: {user.created_at ? new Date(user.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      user.tier === 'FREE' ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' :
                      user.tier === 'PRO' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300' :
                      'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300'
                    }`}>
                      {user.tier}
                    </span>
                    {user.is_active !== false ? (
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        Aktif
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full">
                        Suspend
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {filteredUsers.length === 0 && (
                <p className="text-center py-6 text-xs text-muted">Tidak ada pengguna pada kategori ini.</p>
              )}
            </div>

            {/* Footer Direct Navigation */}
            <div className="flex items-center justify-between pt-2 border-t border-[var(--border-default)]">
              <span className="text-[11px] text-muted">Menampilkan {filteredUsers.length} pengguna</span>
              <Link
                href="/admin/users"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
              >
                Buka Manajemen Pengguna Lengkap
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL DETAIL 2: RINCIAN PENDAPATAN & TRANSAKSI MIDTRANS
      ══════════════════════════════════════════════════════════════════ */}
      {selectedModal === 'revenue' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-card border border-[var(--border-default)] w-full max-w-2xl rounded-3xl p-6 shadow-2xl space-y-5 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-4">
              <div>
                <h3 className="text-base font-bold text-primary flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-500" />
                  Rincian Transaksi & Pendapatan Midtrans
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  Laporan rekapitulasi status pembayaran dan distribusi penjualan paket.
                </p>
              </div>
              <button
                onClick={() => setSelectedModal(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-[var(--bg-card-hover)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/15 text-center">
                <div className="flex items-center justify-center gap-1 text-[10px] text-muted font-medium">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  Pembayaran Berhasil
                </div>
                <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                  {formatIDR(stats.totalRevenue)}
                </p>
                <p className="text-[9px] text-muted mt-0.5">
                  {stats.trxStatusCounts?.settlement || 0} Transaksi Settlement
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-amber-500/5 border border-amber-500/15 text-center">
                <div className="flex items-center justify-center gap-1 text-[10px] text-muted font-medium">
                  <AlertCircle className="w-3 h-3 text-amber-500" />
                  Tidak Dibayar (Expired)
                </div>
                <p className="text-sm font-extrabold text-amber-500 mt-1">
                  {stats.trxStatusCounts?.expired || 0} Tagihan
                </p>
                <p className="text-[9px] text-muted mt-0.5">Batas waktu bayar habis</p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-500/5 border border-slate-500/15 text-center">
                <div className="flex items-center justify-center gap-1 text-[10px] text-muted font-medium">
                  <XCircle className="w-3 h-3 text-slate-400" />
                  Dibatalkan (Cancelled)
                </div>
                <p className="text-sm font-extrabold text-slate-500 dark:text-slate-300 mt-1">
                  {stats.trxStatusCounts?.cancelled || 0} Tagihan
                </p>
                <p className="text-[9px] text-muted mt-0.5">Dibatalkan pengguna</p>
              </div>
            </div>

            {/* Breakdown per Paket */}
            <div className="p-4 rounded-2xl bg-[var(--bg-card-hover)] border border-[var(--border-default)] space-y-2">
              <h4 className="text-xs font-bold text-primary flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                Total Pendapatan Berhasil Berdasarkan Paket:
              </h4>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="flex justify-between border-r border-[var(--border-default)] pr-4">
                  <span className="text-muted">Paket PRO:</span>
                  <strong className="text-indigo-500">{formatIDR(stats.revenueByTier.PRO)}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Paket ENTERPRISE:</span>
                  <strong className="text-emerald-500">{formatIDR(stats.revenueByTier.ENTERPRISE)}</strong>
                </div>
              </div>
            </div>

            {/* Riwayat Transaksi Terbaru */}
            <div className="space-y-2 flex-1 overflow-hidden flex flex-col">
              <h4 className="text-xs font-bold text-primary">Riwayat Transaksi Terbaru:</h4>
              <div className="overflow-y-auto flex-1 border border-[var(--border-default)] rounded-2xl divide-y divide-[var(--border-default)]">
                {recentTransactions.map((trx, idx) => {
                  const isSettled = trx.status === 'settlement';
                  const isExpired = trx.status === 'expired';
                  return (
                    <div key={trx.id || idx} className="p-3 flex items-center justify-between hover:bg-[var(--bg-card-hover)] transition-colors text-xs">
                      <div className="min-w-0 pr-3">
                        <p className="font-semibold text-primary truncate">{trx.user_email}</p>
                        <p className="text-[10px] text-muted">
                          {trx.id} • {trx.created_at ? new Date(trx.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0 space-y-0.5">
                        <p className={`font-bold ${isSettled ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted'}`}>
                          {formatIDR(trx.amount || 0)}
                        </p>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          isSettled ? 'bg-emerald-500/10 text-emerald-500' :
                          isExpired ? 'bg-amber-500/10 text-amber-500' :
                          'bg-slate-500/10 text-slate-400'
                        }`}>
                          {isSettled ? 'Settlement' : isExpired ? 'Expired' : trx.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {recentTransactions.length === 0 && (
                  <p className="text-center py-6 text-xs text-muted">Belum ada transaksi tercatat.</p>
                )}
              </div>
            </div>

            {/* Footer Direct Navigation */}
            <div className="flex items-center justify-between pt-2 border-t border-[var(--border-default)]">
              <span className="text-[11px] text-muted">Gateway: Midtrans Snap API</span>
              <Link
                href="/admin/plans"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
              >
                Buka Manajemen Paket & Harga
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
