'use client';

import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { youtubeService } from '@/services/youtubeService';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { historyService } from '@/services/historyService';

import { useYouTube } from '@/contexts/YouTubeContext';
import { useTheme } from '@/components/ThemeProvider';

// ── Dark Tooltip untuk Pie Chart ─────────────────────────────
const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card px-3 py-2 text-xs shadow-xl">
        <p className="font-semibold text-primary">{payload[0].name}</p>
        <p className="text-muted mt-0.5">{payload[0].value} komentar</p>
      </div>
    );
  }
  return null;
};

// ── Dark Tooltip untuk Bar Chart ─────────────────────────────
const CustomBarTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card px-3 py-2 text-xs shadow-xl max-w-[200px]">
        <p className="font-semibold text-primary mb-1.5 line-clamp-2">{label}</p>
        {payload.map((p) => (
          <p key={p.dataKey} className="text-xs" style={{ color: p.color }}>
            {p.name}: <span className="font-bold">{p.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ── Stat Card Component ───────────────────────────────────────
function StatCard({ label, value, sub, icon, color, delay = 0 }) {
  const glowColor = {
    blue: 'rgba(59, 130, 246, 0.12)',
    emerald: 'rgba(16, 185, 129, 0.12)',
    amber: 'rgba(245, 158, 11, 0.12)',
    rose: 'rgba(244, 63, 94, 0.12)',
  }[color] || 'rgba(99, 102, 241, 0.12)';

  const iconBg = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400',
    amber: 'bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400',
    rose: 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400',
  }[color] || 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-500/10 dark:border-indigo-500/20 dark:text-indigo-400';

  return (
    <div
      className="bento-card bento-card-glow p-5 group relative overflow-hidden animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Corner glow */}
      <div
        className="absolute -right-8 -top-8 w-28 h-28 rounded-full blur-2xl transition-all duration-500 group-hover:scale-125"
        style={{ background: glowColor }}
      />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-secondary uppercase tracking-wider">{label}</p>
          <div className={`p-1.5 rounded-lg border ${iconBg}`}>
            {icon}
          </div>
        </div>
        <p className="stat-value">{value}</p>
        <p className="text-[11px] text-muted mt-1">{sub}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { theme } = useTheme();

  const { activeChannel: channelInfo, channels, fetchChannel, fetchVideos, videosCache } = useYouTube();
  const videos = channelInfo ? (videosCache[channelInfo.id] || []).slice(0, 10) : [];

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [chartVideoFilter, setChartVideoFilter] = useState('all');

  useEffect(() => {
    if (session?.accessToken && channels.length === 0) {
      fetchChannel();
    }
  }, [session?.accessToken, fetchChannel, channels.length]);

  useEffect(() => {
    if (channelInfo && session?.accessToken) {
      loadHistoryAndVideos();
    }
  }, [channelInfo, session?.accessToken]);

  const loadHistoryAndVideos = async () => {
    try {
      setLoading(true);
      await fetchVideos(channelInfo.id);

      if (session?.user?.email) {
        const dbHistory = await historyService.getHistory(session.user.email);
        const mapped = dbHistory.map(item => ({
          ...item,
          commentText: item.comment_text,
          videoTitle: item.video_title,
          aiLabel: item.ai_label,
          aiConfidence: item.ai_confidence,
          sentimentScore: item.sentiment_score,
          timestamp: item.created_at,
        }));
        setHistory(mapped);
      }
    } catch (err) {
      console.error('Gagal memuat data dashboard:', err);
      setError(err.message || 'Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = useMemo(() => {
    if (chartVideoFilter === 'all') return history;
    return history.filter(h => h.videoTitle === chartVideoFilter);
  }, [history, chartVideoFilter]);

  // Global metrics
  const totalPublished = history.filter(h => h.action === 'published').length;
  const totalRejected = history.filter(h => h.action === 'rejected').length;
  const totalHeld = history.filter(h => h.action === 'heldForReview').length;

  // Filtered metrics
  const normalCount = filteredHistory.filter(h => h.aiLabel === 'Normal').length;
  const spamCount = filteredHistory.filter(h => h.aiLabel === 'Spam').length;
  const positiveCount = filteredHistory.filter(h => h.sentiment === 'positive').length;
  const negativeCount = filteredHistory.filter(h => h.sentiment === 'negative').length;
  const neutralCount = filteredHistory.filter(h => h.sentiment === 'neutral').length;

  const contentData = [{ name: 'Normal', value: normalCount }, { name: 'Spam Judol', value: spamCount }];
  const actionData = [
    { name: 'Aman', jumlah: history.filter(h => h.action === 'published').length },
    { name: 'Ditahan', jumlah: history.filter(h => h.action === 'heldForReview').length },
    { name: 'Ditolak', jumlah: history.filter(h => h.action === 'rejected').length },
  ];
  const sentimentData = [
    { name: 'Positif', value: positiveCount },
    { name: 'Negatif', value: negativeCount },
    { name: 'Netral', value: neutralCount },
  ];

  const perVideoData = useMemo(() => {
    const map = {};
    history.forEach(h => {
      if (!h.videoTitle || h.videoTitle.trim() === '') return;
      const title = h.videoTitle;
      if (!map[title]) map[title] = { video: title, judol: 0, normal: 0 };
      if (h.aiLabel === 'Spam') map[title].judol += 1;
      else map[title].normal += 1;
    });
    return Object.values(map)
      .sort((a, b) => (b.judol + b.normal) - (a.judol + a.normal))
      .slice(0, 8)
      .map(item => ({
        ...item,
        label: item.video.length > 20 ? `${item.video.slice(0, 20)}…` : item.video,
      }));
  }, [history]);

  const uniqueVideosInHistory = useMemo(() => {
    const titles = [...new Set(history.map(h => h.videoTitle).filter(Boolean))];
    return titles;
  }, [history]);

  // Dark chart colors
  const COLORS = ['#10b981', '#f43f5e'];
  const ACTION_COLORS = ['#3b82f6', '#f59e0b', '#f43f5e'];
  const SENTIMENT_COLORS = ['#10b981', '#f43f5e', '#475569'];

  // Axis tick style (wajib override di dark mode)
  const axisTick = { fontSize: 10, fill: '#475569' };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-lg animate-pulse" />
            <img src="/logo.webp" className="relative w-10 h-10 animate-float" />
          </div>
          <div className="w-24 h-1 rounded-full overflow-hidden" style={{ background: 'var(--border-default)' }}>
            <div className="h-full w-2/3 bg-indigo-500 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up space-y-5 pb-10">

      {/* ── Page Header ─────────────────────────────────────── */}
      <div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg lg:text-xl font-bold text-primary tracking-tight">
              Laporan Pembersihan Komentar
            </h1>
            <p className="text-sm text-secondary mt-0.5">
              Pantau kebersihan komentar dan tindakan penyaringan yang telah diambil
            </p>
          </div>
          {/* Live indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20">
            <span className="dot-online" />
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Live</span>
          </div>
        </div>

        {/* Info notice */}
        <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 dark:bg-amber-500/[0.07] dark:border-amber-500/20 dark:text-amber-400 text-[10px] font-medium">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
          Data berdasarkan riwayat kumulatif pemindaian AI
        </div>
      </div>

      {/* ── Error Alert ─────────────────────────────────────── */}
      {error && (
        <div className="bento-card border-rose-200 bg-rose-50 p-4 flex items-start gap-3 dark:border-rose-500/20 dark:bg-rose-500/[0.05]">
          <svg className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0 dark:text-rose-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-rose-800 dark:text-rose-300">Gagal Memuat Data YouTube</p>
            <p className="text-xs text-rose-600/80 mt-0.5 dark:text-rose-400/70">{error}</p>
          </div>
        </div>
      )}

      {/* ── Stat Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 stagger">
        <StatCard
          label="Video"
          value={videos.length}
          sub="dari kanal Anda"
          color="blue"
          delay={0}
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
            </svg>
          }
        />
        <StatCard
          label="Aman"
          value={totalPublished}
          sub="komentar disetujui"
          color="emerald"
          delay={60}
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Ditahan"
          value={totalHeld}
          sub="menunggu tinjauan"
          color="amber"
          delay={120}
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Ditolak"
          value={totalRejected}
          sub="komentar dihapus"
          color="rose"
          delay={180}
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* ── Video Filter ─────────────────────────────────────── */}
      {uniqueVideosInHistory.length > 0 && (
        <div className="bento-card p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <p className="text-xs font-semibold text-primary">Tampilkan Grafik Untuk:</p>
            <p className="text-[11px] text-muted mt-0.5">Filter berdasarkan video tertentu atau lihat semua</p>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-secondary flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
            </svg>
            <select
              value={chartVideoFilter}
              onChange={e => setChartVideoFilter(e.target.value)}
              className="input-dark text-xs min-w-[180px] py-1.5"
            >
              <option value="all">Semua Video ({history.length} data)</option>
              {uniqueVideosInHistory.map(title => {
                const count = history.filter(h => h.videoTitle === title).length;
                const short = title.length > 35 ? `${title.slice(0, 35)}…` : title;
                return <option key={title} value={title}>{short} ({count})</option>;
              })}
            </select>
            {chartVideoFilter !== 'all' && (
              <button
                onClick={() => setChartVideoFilter('all')}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium whitespace-nowrap"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Charts Row 1: Distribusi + Aktivitas ────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Pie: Normal vs Spam Judol */}
        <div className="bento-card p-5 lg:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-primary">Hasil Pemeriksaan Komentar</h2>
              <p className="text-xs text-secondary mt-0.5">
                {chartVideoFilter === 'all' ? 'Semua video' : 'Video terpilih'} — Komentar Bersih vs Iklan Judi
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] text-secondary">Normal</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="text-[10px] text-secondary">Spam</span>
              </div>
            </div>
          </div>

          <div className="h-[200px] lg:h-[240px] w-full">
            {filteredHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={contentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {contentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                  <text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle"
                    style={{ fontSize: 20, fontWeight: 700, fill: theme === 'dark' ? '#f1f5f9' : '#0f172a' }}>
                    {Math.round((spamCount / (normalCount + spamCount || 1)) * 100)}%
                  </text>
                  <text x="50%" y="57%" textAnchor="middle" dominantBaseline="middle"
                    style={{ fontSize: 10, fill: theme === 'dark' ? '#fb7185' : '#e11d48' }}>
                    Iklan Judi
                  </text>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state h-full">
                <span className="text-3xl mb-2">📊</span>
                <p className="text-xs text-muted">Belum ada data untuk video ini</p>
              </div>
            )}
          </div>

          {filteredHistory.length > 0 && (
            <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t" style={{ borderColor: 'var(--border-default)' }}>
              <div className="text-center">
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{normalCount}</p>
                <p className="text-[10px] text-muted">Normal</p>
              </div>
              <div className="w-px h-8 bg-border-default" style={{ background: 'var(--border-default)' }} />
              <div className="text-center">
                <p className="text-lg font-bold text-rose-600 dark:text-rose-400">{spamCount}</p>
                <p className="text-[10px] text-muted">Iklan Judi</p>
              </div>
              <div className="w-px h-8" style={{ background: 'var(--border-default)' }} />
              <div className="text-center">
                <p className="text-lg font-bold text-primary">{normalCount + spamCount}</p>
                <p className="text-[10px] text-muted">Total</p>
              </div>
            </div>
          )}
        </div>

        {/* Bar: Aktivitas Moderasi */}
        <div className="bento-card p-5 lg:p-6">
          <h2 className="text-sm font-semibold text-primary mb-1">Total Tindakan Penyaringan</h2>
          <p className="text-xs text-secondary mb-4 lg:mb-5">Jumlah komentar yang telah ditindaklanjuti</p>
          <div className="h-[200px] lg:h-[240px] w-full">
            {history.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={actionData} barSize={36}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={axisTick} />
                  <YAxis axisLine={false} tickLine={false} tick={axisTick} />
                  <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="jumlah" name="Jumlah" radius={[6, 6, 0, 0]}>
                    {actionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={ACTION_COLORS[index % ACTION_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state h-full">
                <span className="text-3xl mb-2">📊</span>
                <p className="text-xs text-muted">Belum ada data aktivitas</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Per Video Chart ──────────────────────────────────── */}
      {perVideoData.length > 0 && (
        <div className="bento-card p-5 lg:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
            <div>
              <h2 className="text-sm font-semibold text-primary">Iklan Judi per Video</h2>
              <p className="text-xs text-secondary">Perbandingan komentar bersih dan iklan judi per video</p>
            </div>
            <div className="flex items-center gap-3 text-[10px]">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
                <span className="text-secondary">Iklan Judi</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                <span className="text-secondary">Normal</span>
              </div>
            </div>
          </div>
          <div className="h-[260px] lg:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perVideoData} barSize={16} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={axisTick}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={50}
                />
                <YAxis axisLine={false} tickLine={false} tick={axisTick} />
                <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="judol" name="Iklan Judi" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="normal" name="Normal" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Kualitas Komunitas ───────────────────────────────── */}
      <div className="bento-card p-5 lg:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="lg:w-1/3">
            <h2 className="text-base font-bold text-primary mb-1">Tanggapan &amp; Sikap Penonton</h2>
            <p className="text-xs text-secondary mb-4">
              Mendeteksi suasana hati penonton dari komentar yang masuk di kolom komentar.
              {chartVideoFilter !== 'all' && (
                <span className="block mt-1 text-amber-600 dark:text-amber-400 font-medium">Video terpilih saja</span>
              )}
            </p>

            <div className="grid grid-cols-1 gap-2.5">
              {[
                { emoji: '😊', label: 'Mendukung (Positif)', count: positiveCount, total: positiveCount + negativeCount + neutralCount, colorClass: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20', textColor: 'text-emerald-600 dark:text-emerald-400' },
                { emoji: '😠', label: 'Tidak Suka (Negatif)', count: negativeCount, total: positiveCount + negativeCount + neutralCount, colorClass: 'bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20', textColor: 'text-rose-600 dark:text-rose-400' },
                { emoji: '😐', label: 'Biasa Saja (Netral)', count: neutralCount, total: positiveCount + negativeCount + neutralCount, colorClass: 'bg-card-hover border-[var(--border-default)]', textColor: 'text-secondary' },
              ].map(item => (
                <div key={item.label} className={`flex items-center justify-between p-3 rounded-xl border ${item.colorClass}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{item.emoji}</span>
                    <span className={`text-xs font-medium ${item.textColor}`}>{item.label}</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-bold ${item.textColor}`}>{item.count}</span>
                    <p className={`text-[10px] ${item.textColor} opacity-70`}>
                      {Math.round((item.count / (item.total || 1)) * 100)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 h-[250px] lg:h-[300px] w-full">
            {filteredHistory.some(h => h.sentiment) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sentimentData.filter(d => d.value > 0)}
                    cx="50%" cy="50%"
                    innerRadius={60} outerRadius={90}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {sentimentData.filter(d => d.value > 0).map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={SENTIMENT_COLORS[sentimentData.findIndex(s => s.name === entry.name)]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                  <text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle"
                    style={{ fontSize: 22, fontWeight: 700, fill: theme === 'dark' ? '#f1f5f9' : '#0f172a' }}>
                    {Math.round((positiveCount / (positiveCount + negativeCount + neutralCount || 1)) * 100)}%
                  </text>
                  <text x="50%" y="57%" textAnchor="middle" dominantBaseline="middle"
                    style={{ fontSize: 10, fill: theme === 'dark' ? '#34d399' : '#059669' }}>
                    Sentimen Positif
                  </text>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state h-full">
                <span className="text-3xl mb-2">📊</span>
                <p className="text-xs text-muted">Belum ada data sentimen</p>
                <p className="text-[10px] text-secondary mt-1">Moderasi komentar normal untuk melihat hasil</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom: Tugas Cepat + Video Terbaru ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Tugas Cepat */}
        <div className="bento-card p-5 lg:p-6">
          <h2 className="text-sm font-semibold text-primary mb-1">Tugas Cepat</h2>
          <p className="text-xs text-secondary mb-4">Akses fitur utama dengan cepat</p>
          <div className="space-y-1">
            {[
              {
                href: '/comments',
                label: 'Tinjau Antrian Moderasi',
                icon: <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />,
              },
              {
                href: '/preferensi',
                label: 'Atur Kepekaan Pendeteksi AI',
                icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />,
              },
              {
                href: '/riwayat',
                label: 'Lihat Riwayat Moderasi',
                icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />,
              },
            ].map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-card-hover border border-transparent hover:border-[var(--border-default)] transition-all duration-150 group"
              >
                <svg className="w-5 h-5 text-muted group-hover:text-indigo-400 flex-shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  {item.icon}
                </svg>
                <span className="text-sm text-secondary group-hover:text-primary transition-colors">{item.label}</span>
                <svg className="w-4 h-4 text-muted group-hover:text-secondary ml-auto transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            ))}
          </div>
        </div>

        {/* Video Terbaru */}
        <div className="bento-card p-5 lg:p-6">
          <h2 className="text-sm font-semibold text-primary mb-1">Video Terbaru</h2>
          <p className="text-xs text-secondary mb-4">Video dari kanal Anda</p>

          {videos.length === 0 ? (
            <div className="empty-state py-8">
              <svg className="w-10 h-10 text-muted mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
              </svg>
              <p className="text-xs text-secondary">Belum ada video ditemukan</p>
              <Link href="/channel" className="text-xs text-indigo-400 hover:text-indigo-300 mt-1 inline-block">
                Pilih kanal terlebih dahulu →
              </Link>
            </div>
          ) : (
            <div className="space-y-1.5">
              {videos.slice(0, 5).map(video => {
                const spamInVideo = history.filter(
                  h => h.videoTitle === video.snippet.title && h.aiLabel === 'Spam'
                ).length;
                return (
                  <div
                    key={video.id.videoId}
                    onClick={() => {
                      localStorage.setItem('selectedVideoIds', JSON.stringify([video.id.videoId]));
                      router.push('/comments');
                    }}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-card-hover border border-transparent hover:border-[var(--border-default)] transition-all cursor-pointer group"
                  >
                    <div className="w-10 h-10 bg-card rounded-lg overflow-hidden flex-shrink-0 border border-[var(--border-default)]">
                      <img
                        src={video.snippet.thumbnails.default.url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-secondary truncate group-hover:text-primary transition-colors">
                        {video.snippet.title}
                      </p>
                      <p className="text-[11px] text-muted">
                        {new Date(video.snippet.publishedAt).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                    {spamInVideo > 0 && (
                      <span className="badge badge-danger flex-shrink-0">
                        {spamInVideo} judol
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
