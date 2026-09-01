'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { 
  Users, CreditCard, MessageSquare, Database, ShieldCheck, UserCheck, UserX 
} from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import { AdminOverviewSkeleton } from '@/components/ui/Skeleton';
import { formatIDR } from '@/lib/utils';

// Import Komponen Modular Admin Dashboard
import UserGrowthSplineChart from '@/components/admin/UserGrowthSplineChart';
import RevenueStackedBarChart from '@/components/admin/RevenueStackedBarChart';
import UserTierDonutChart from '@/components/admin/UserTierDonutChart';
import FinancialSummaryCard from '@/components/admin/FinancialSummaryCard';
import NewUsersTable from '@/components/admin/NewUsersTable';
import RecentTransactionsTable from '@/components/admin/RecentTransactionsTable';

// Client-side In-Memory Cache (SWR Pattern)
let cachedAdminStats = null;

export default function AdminOverviewPage() {
  const [data, setData] = useState(cachedAdminStats);
  const [loading, setLoading] = useState(!cachedAdminStats);
  const toast = useToast();

  useEffect(() => {
    let isMounted = true;
    async function fetchStats() {
      try {
        const response = await fetch('/api/admin/stats');
        const json = await response.json();
        if (json.success) {
          cachedAdminStats = json;
          if (isMounted) {
            setData(json);
          }
        } else if (!cachedAdminStats && isMounted) {
          toast.error(json.error || 'Gagal memuat statistik admin');
        }
      } catch (error) {
        console.error('Fetch stats error:', error);
        if (!cachedAdminStats && isMounted) {
          toast.error('Koneksi internet bermasalah');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    fetchStats();
    return () => {
      isMounted = false;
    };
  }, [toast]);

  if (loading && !data) {
    return <AdminOverviewSkeleton />;
  }

  if (!data) return null;

  const { stats, newestUsers = [], allUsers = [], recentTransactions = [] } = data;

  return (
    <div className="space-y-6 pb-8">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-primary flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-rose-500" />
            Dashboard Ikhtisar Admin
          </h1>
          <p className="text-xs text-muted mt-1">
            Pusat kendali, intelijen bisnis, dan performa operasional sistem Athena Shield secara terpusat.
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          BARIS 1: 4 KPI METRIK UTAMA
      ══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Pengguna */}
        <StatCard
          label="Total Pengguna"
          value={stats.totalUsers}
          sub={
            <div className="space-y-1.5 mt-2 text-xs">
              <div className="flex items-center justify-between text-muted border-b border-[var(--border-default)] pb-1">
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                  <UserCheck className="w-3.5 h-3.5" /> Aktif: {stats.activeUsers}
                </span>
                <span className="text-rose-500 font-semibold flex items-center gap-0.5">
                  <UserX className="w-3.5 h-3.5" /> Suspend: {stats.suspendedUsers}
                </span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Free: <strong className="text-secondary">{stats.tierCounts?.FREE || 0}</strong></span>
                <span>Pro: <strong className="text-indigo-500">{stats.tierCounts?.PRO || 0}</strong></span>
                <span>Ent: <strong className="text-emerald-500">{stats.tierCounts?.ENTERPRISE || 0}</strong></span>
              </div>
            </div>
          }
          color="indigo"
          icon={<Users className="w-5 h-5" />}
        />

        {/* Card 2: Total Pendapatan */}
        <StatCard
          label="Total Pendapatan"
          value={formatIDR(stats.totalRevenue)}
          sub={
            <div className="space-y-1.5 mt-2 text-xs">
              <div className="flex items-center justify-between text-muted border-b border-[var(--border-default)] pb-1">
                <span>Settlement Midtrans:</span>
                <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {stats.trxStatusCounts?.settlement || 0} Transaksi
                </strong>
              </div>
              <div className="flex justify-between text-muted">
                <span>PRO: <strong className="text-primary">{formatIDR(stats.revenueByTier?.PRO || 0)}</strong></span>
                <span>ENT: <strong className="text-primary">{formatIDR(stats.revenueByTier?.ENTERPRISE || 0)}</strong></span>
              </div>
            </div>
          }
          color="emerald"
          icon={<CreditCard className="w-5 h-5" />}
        />

        {/* Card 3: Total Comments Moderated */}
        <StatCard
          label="Komentar Dimoderasi"
          value={stats.totalComments.toLocaleString('id-ID')}
          sub="Total Volume Spam Judol Tersaring"
          color="rose"
          icon={<MessageSquare className="w-5 h-5" />}
        />

        {/* Card 4: Global Quota Consumed */}
        <StatCard
          label="Kuota Server Hari Ini"
          value={
            <>
              {(stats.todayQuotaUsed || 0).toLocaleString('id-ID')}{' '}
              <span className="text-xs text-muted font-normal">/ 10.000 unit</span>
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
                <div className="flex justify-between text-xs font-medium">
                  <span className={textColor}>{percentage}% Terpakai</span>
                  <span className="text-muted">Total: {(stats.totalQuotaUsed || 0).toLocaleString('id-ID')} u</span>
                </div>
              </div>
            );
          })()}
        />
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          BARIS 2: DUA GRAFIK ANALITIK UTAMA (PILAR PENGGUNA VS FINANSIAL)
      ══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kolom Kiri: Tren Pertumbuhan Kreator (Pilar Pengguna) */}
        <UserGrowthSplineChart allUsers={allUsers} />

        {/* Kolom Kanan: Tren Penjualan Paket Midtrans (Pilar Finansial) */}
        <RevenueStackedBarChart recentTransactions={recentTransactions} stats={stats} />
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          BARIS 3: DONUT CHART DISTRIBUSI & REKAPITULASI FINANSIAL
      ══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kolom Kiri: Donut Chart Distribusi Paket (Pilar Pengguna) */}
        <UserTierDonutChart stats={stats} />

        {/* Kolom Kanan: Rekapitulasi Status Tagihan & Konversi (Pilar Finansial) */}
        <FinancialSummaryCard stats={stats} />
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          BARIS 4: DUA TABEL AKTIVITAS TERKINI (KONSISTEN 2 PILAR)
      ══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kolom Kiri: Kreator Baru Bergabung (Pilar Pengguna) */}
        <NewUsersTable newestUsers={newestUsers} />

        {/* Kolom Kanan: Log Transaksi Midtrans Terbaru (Pilar Finansial) */}
        <RecentTransactionsTable recentTransactions={recentTransactions} stats={stats} />
      </div>
    </div>
  );
}
