'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { Users, CreditCard, MessageSquare, Database, TrendingUp, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import StatCard from '@/components/ui/StatCard';
import LoadingState from '@/components/ui/LoadingState';
import { formatIDR } from '@/lib/utils';

export default function AdminOverviewPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
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
    return <LoadingState message="Memuat statistik global..." className="min-h-[60vh]" />;
  }

  if (!data) return null;

  const { stats, newestUsers, registrationTrend } = data;

  // Find max registration for SVG graph scaling
  const maxTrendVal = Math.max(...registrationTrend.map(t => t.count), 1);

  // Generate SVG path for registration trend graph
  const width = 600;
  const height = 150;
  const padding = 20;
  const graphWidth = width - padding * 2;
  const graphHeight = height - padding * 2;
  
  let svgPoints = '';
  if (registrationTrend.length > 0) {
    registrationTrend.forEach((t, index) => {
      const x = padding + (index / (registrationTrend.length - 1)) * graphWidth;
      const y = height - padding - (t.count / maxTrendVal) * graphHeight;
      svgPoints += `${index === 0 ? 'M' : 'L'} ${x} ${y} `;
    });
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Title & Context */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-primary flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-rose-500" />
          Dashboard Ikhtisar Admin
        </h1>
        <p className="text-xs text-muted mt-1">Pantau dan kelola seluruh performa operasional sistem Athena Shield secara terpusat.</p>
      </div>

      {/* Grid Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <StatCard
          label="Total Pengguna"
          value={stats.totalUsers}
          sub={
            <div className="flex gap-2.5 mt-2 text-[10px] text-muted">
              <span>Free: <strong className="text-secondary">{stats.tierCounts.FREE}</strong></span>
              <span>Pro: <strong className="text-indigo-500">{stats.tierCounts.PRO}</strong></span>
              <span>Ent: <strong className="text-emerald-500">{stats.tierCounts.ENTERPRISE}</strong></span>
            </div>
          }
          color="indigo"
          icon={<Users className="w-5 h-5" />}
        />

        {/* Total Revenue */}
        <StatCard
          label="Total Pendapatan"
          value={formatIDR(stats.totalRevenue)}
          sub="Transaksi Settlement Midtrans"
          color="emerald"
          icon={<CreditCard className="w-5 h-5" />}
        />

        {/* Total Comments Moderated */}
        <StatCard
          label="Komentar Dimoderasi"
          value={stats.totalComments.toLocaleString()}
          sub="Total Volume Spam Judol Tersaring"
          color="rose"
          icon={<MessageSquare className="w-5 h-5" />}
        />

        {/* Global Quota Consumed */}
        <StatCard
          label="Kuota Google API Hari Ini"
          value={
            <>
              {stats.todayQuotaUsed.toLocaleString()}{' '}
              <span className="text-[10px] text-muted font-normal">/ 10.000 unit</span>
            </>
          }
          color="amber"
          icon={<Database className="w-5 h-5" />}
          sub={(() => {
            const percentage = Math.min(Math.round((stats.todayQuotaUsed / 10000) * 100), 100);
            const barColor = percentage > 90 ? 'bg-rose-500' : percentage > 70 ? 'bg-amber-500' : 'bg-emerald-500';
            const textColor = percentage > 90 ? 'text-rose-500' : percentage > 70 ? 'text-amber-500' : 'text-emerald-500';
            return (
              <div className="mt-3.5 space-y-1">
                <div className="h-1.5 rounded-full overflow-hidden bg-[var(--bg-card-hover)] border border-[var(--border-default)]">
                  <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${percentage}%` }} />
                </div>
                <div className="flex justify-between text-[9px] font-medium">
                  <span className={textColor}>{percentage}% Terpakai</span>
                  <span className="text-muted">Total: {stats.totalQuotaUsed.toLocaleString()} u</span>
                </div>
              </div>
            );
          })()}
        />
      </div>

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
                {registrationTrend.length > 0 && (
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
    </div>
  );
}
