'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { Users, CreditCard, MessageSquare, Database, TrendingUp, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

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
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-rose-500/30 border-t-rose-600 rounded-full animate-spin" />
        <p className="text-xs text-muted">Memuat statistik global...</p>
      </div>
    );
  }

  if (!data) return null;

  const { stats, newestUsers, registrationTrend } = data;

  // Format currency
  const formatIDR = (num) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

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
        <div className="p-5 rounded-2xl border bg-card border-[var(--border-default)] shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-bl-full translate-x-4 -translate-y-4 transition-transform group-hover:scale-110" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted font-medium">Total Pengguna</p>
              <h3 className="text-2xl font-bold tracking-tight mt-1 text-primary">{stats.totalUsers}</h3>
            </div>
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex gap-2.5 mt-3 text-[10px] text-muted">
            <span>Free: <strong className="text-secondary">{stats.tierCounts.FREE}</strong></span>
            <span>Pro: <strong className="text-indigo-500">{stats.tierCounts.PRO}</strong></span>
            <span>Ent: <strong className="text-emerald-500">{stats.tierCounts.ENTERPRISE}</strong></span>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="p-5 rounded-2xl border bg-card border-[var(--border-default)] shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full translate-x-4 -translate-y-4 transition-transform group-hover:scale-110" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted font-medium">Total Pendapatan</p>
              <h3 className="text-2xl font-bold tracking-tight mt-1 text-primary">{formatIDR(stats.totalRevenue)}</h3>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10px] text-emerald-500 font-medium mt-3">Transaksi Settlement Midtrans</p>
        </div>

        {/* Total Comments Moderated */}
        <div className="p-5 rounded-2xl border bg-card border-[var(--border-default)] shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-bl-full translate-x-4 -translate-y-4 transition-transform group-hover:scale-110" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted font-medium">Komentar Dimoderasi</p>
              <h3 className="text-2xl font-bold tracking-tight mt-1 text-primary">{stats.totalComments.toLocaleString()}</h3>
            </div>
            <div className="p-3 rounded-xl bg-rose-50/20 text-rose-600 dark:text-rose-400">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10px] text-rose-500 font-medium mt-3">Total Volume Spam Judol Tersaring</p>
        </div>

        {/* Global Quota Consumed */}
        <div className="p-5 rounded-2xl border bg-card border-[var(--border-default)] shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full translate-x-4 -translate-y-4 transition-transform group-hover:scale-110" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted font-medium">Konsumsi Kuota API</p>
              <h3 className="text-2xl font-bold tracking-tight mt-1 text-primary">{stats.totalQuotaUsed.toLocaleString()} u</h3>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Database className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10px] text-amber-500 font-medium mt-3">Unit Kuota Terpakai (Semua User)</p>
        </div>
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
