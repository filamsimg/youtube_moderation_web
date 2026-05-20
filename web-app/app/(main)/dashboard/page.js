'use client';

import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { youtubeService } from '@/services/youtubeService';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import { historyService } from '@/services/historyService';

// Variabel global sementara untuk mencegah alert bertumpuk
let isSessionExpiredAlertShown = false;

// ── Custom Tooltip untuk Pie Chart ───────────────────────────
const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-3 py-2">
        <p className="text-xs font-semibold text-gray-700">{payload[0].name}</p>
        <p className="text-xs text-gray-500">{payload[0].value} komentar</p>
      </div>
    );
  }
  return null;
};

// ── Custom Tooltip untuk Bar Chart ───────────────────────────
const CustomBarTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-3 py-2 max-w-[200px]">
        <p className="text-[11px] font-semibold text-gray-700 mb-1 line-clamp-2">{label}</p>
        {payload.map((p) => (
          <p key={p.dataKey} className="text-xs" style={{ color: p.color }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [channelInfo, setChannelInfo] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);

  // ── Grafik: mode tampilan ─────────────────────────────────
  // 'all' = semua video, atau videoId tertentu
  const [chartVideoFilter, setChartVideoFilter] = useState('all');

  // Helper untuk menangani sesi habis
  const handleApiError = (err) => {
    if (err.isExpired) {
      if (!isSessionExpiredAlertShown) {
        isSessionExpiredAlertShown = true;
        alert('Sesi Google Anda telah berakhir. Silakan Login kembali.');
        signOut({ callbackUrl: '/login' });
        setTimeout(() => { isSessionExpiredAlertShown = false; }, 5000);
      }
      return true;
    }
    return false;
  };

  // ── Cegah loadData dipanggil ulang saat session object refresh
  // NextAuth bisa membuat object session baru tanpa token berubah (window focus dll)
  const loadedTokenRef = useRef(null);
  useEffect(() => {
    if (session?.accessToken && session.accessToken !== loadedTokenRef.current) {
      loadedTokenRef.current = session.accessToken;
      loadData(session.accessToken);
    } else if (!session && !loading) {
      setLoading(false);
    }
  }, [session]);

  const loadData = async (token) => {
    try {
      setLoading(true);
      setError(null);
      const channelData = await youtubeService.getUserChannel(token);
      const channel = channelData.items?.[0];
      setChannelInfo(channel);

      if (channel) {
        localStorage.setItem('selectedChannelId', channel.id);
        const videoData = await youtubeService.getVideosByChannel(channel.id, token);
        const videoItems = (videoData.items || []).filter(item => item.id?.videoId).slice(0, 10);
        setVideos(videoItems);

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
      }
    } catch (err) {
      if (handleApiError(err)) return;
      console.error('Gagal memuat data dashboard:', err);
      setError(err.message || 'Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  };

  // ── Data yang difilter berdasarkan chartVideoFilter ───────
  const filteredHistory = useMemo(() => {
    if (chartVideoFilter === 'all') return history;
    return history.filter(h => h.videoTitle === chartVideoFilter);
  }, [history, chartVideoFilter]);

  // ── Metrik global (selalu dari semua data) ────────────────
  const totalPublished = history.filter(h => h.action === 'published').length;
  const totalRejected  = history.filter(h => h.action === 'rejected').length;
  const totalHeld      = history.filter(h => h.action === 'heldForReview').length;

  // ── Metrik terfilter (untuk grafik) ──────────────────────
  const normalCount   = filteredHistory.filter(h => h.aiLabel === 'Normal').length;
  const spamCount     = filteredHistory.filter(h => h.aiLabel === 'Spam').length;
  const positiveCount = filteredHistory.filter(h => h.sentiment === 'positive').length;
  const negativeCount = filteredHistory.filter(h => h.sentiment === 'negative').length;
  const neutralCount  = filteredHistory.filter(h => h.sentiment === 'neutral').length;

  const contentData = [
    { name: 'Normal', value: normalCount },
    { name: 'Spam Judol', value: spamCount },
  ];

  const actionData = [
    { name: 'Aman',    jumlah: history.filter(h => h.action === 'published').length },
    { name: 'Ditahan', jumlah: history.filter(h => h.action === 'heldForReview').length },
    { name: 'Ditolak', jumlah: history.filter(h => h.action === 'rejected').length },
  ];

  const sentimentData = [
    { name: 'Positif', value: positiveCount },
    { name: 'Negatif', value: negativeCount },
    { name: 'Netral',  value: neutralCount },
  ];

  // ── Grafik per video: jumlah spam judol & normal ──────────
  const perVideoData = useMemo(() => {
    const map = {};
    history.forEach(h => {
      // Lewati record tanpa video title (data lama/tidak lengkap)
      if (!h.videoTitle || h.videoTitle.trim() === '') return;
      const title = h.videoTitle;
      if (!map[title]) map[title] = { video: title, judol: 0, normal: 0 };
      if (h.aiLabel === 'Spam') map[title].judol += 1;
      else map[title].normal += 1;
    });
    // Sort by total descending, ambil top 8
    return Object.values(map)
      .sort((a, b) => (b.judol + b.normal) - (a.judol + a.normal))
      .slice(0, 8)
      .map(item => ({
        ...item,
        // Potong judul agar tidak terlalu panjang di sumbu X
        label: item.video.length > 20 ? `${item.video.slice(0, 20)}…` : item.video,
      }));
  }, [history]);

  // Daftar video unik dari history (untuk dropdown filter grafik)
  const uniqueVideosInHistory = useMemo(() => {
    const titles = [...new Set(history.map(h => h.videoTitle).filter(Boolean))];
    return titles;
  }, [history]);

  const COLORS           = ['#10B981', '#EF4444'];
  const ACTION_COLORS    = ['#3B82F6', '#F59E0B', '#EF4444'];
  const SENTIMENT_COLORS = ['#10B981', '#EF4444', '#9CA3AF'];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up space-y-5 pb-10">
      {/* Page header */}
      <div>
        <h1 className="text-lg lg:text-xl font-semibold text-gray-900">Ringkasan Moderasi</h1>
        <p className="text-sm text-gray-400 mt-0.5">Pantau aktivitas komentar dan metrik moderasi Anda</p>
        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 text-amber-700 text-[10px] rounded-md font-medium border border-amber-100">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
          Data di bawah didasarkan pada riwayat kumulatif pemindaian AI, bukan sekadar antrian real-time.
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-red-800">Gagal Memuat Data YouTube</p>
            <p className="text-xs text-red-600 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-5 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-500">Video</p>
            <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-gray-900">{videos.length}</p>
          <p className="text-[11px] text-gray-400 mt-1">dari kanal Anda</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-5 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-500">Aman</p>
            <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalPublished}</p>
          <p className="text-[11px] text-gray-400 mt-1">komentar disetujui</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-5 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-500">Ditahan</p>
            <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalHeld}</p>
          <p className="text-[11px] text-gray-400 mt-1">menunggu tinjauan</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-5 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-500">Ditolak</p>
            <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalRejected}</p>
          <p className="text-[11px] text-gray-400 mt-1">komentar dihapus</p>
        </div>
      </div>

      {/* ── Filter Video untuk Grafik Analisis ─────────────────── */}
      {uniqueVideosInHistory.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-700">Tampilkan Grafik Untuk:</p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Filter grafik di bawah berdasarkan video tertentu atau lihat semua sekaligus
            </p>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
            </svg>
            <select
              value={chartVideoFilter}
              onChange={e => setChartVideoFilter(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-300 cursor-pointer min-w-[180px]"
            >
              <option value="all">Semua Video ({history.length} data)</option>
              {uniqueVideosInHistory.map(title => {
                const count = history.filter(h => h.videoTitle === title).length;
                const short = title.length > 35 ? `${title.slice(0, 35)}…` : title;
                return (
                  <option key={title} value={title}>{short} ({count})</option>
                );
              })}
            </select>
            {chartVideoFilter !== 'all' && (
              <button
                onClick={() => setChartVideoFilter('all')}
                className="text-[11px] text-amber-600 hover:text-amber-700 font-medium whitespace-nowrap"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Grafik Baris 1: Distribusi AI + Aktivitas ──────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Pie: Normal vs Spam Judol */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 lg:p-6">
          <div className="flex items-center justify-between mb-4 lg:mb-5">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Distribusi Konten</h2>
              <p className="text-xs text-gray-400">
                {chartVideoFilter === 'all' ? 'Semua video' : 'Video terpilih'} — Normal vs Spam Judi Online
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] text-gray-500">Normal</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="text-[10px] text-gray-500">Spam Judol</span>
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
                  <text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 20, fontWeight: 700, fill: '#111827' }}>
                    {Math.round((spamCount / (normalCount + spamCount || 1)) * 100)}%
                  </text>
                  <text x="50%" y="57%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 10, fill: '#EF4444' }}>
                    Spam Judol
                  </text>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full border-2 border-dashed border-gray-100 rounded-2xl text-gray-300">
                <span className="text-2xl mb-2">📊</span>
                <p className="text-xs">Belum ada data untuk video ini</p>
              </div>
            )}
          </div>

          {/* Ringkasan angka */}
          {filteredHistory.length > 0 && (
            <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-50">
              <div className="text-center">
                <p className="text-lg font-bold text-emerald-600">{normalCount}</p>
                <p className="text-[10px] text-gray-400">Normal</p>
              </div>
              <div className="w-px h-8 bg-gray-100" />
              <div className="text-center">
                <p className="text-lg font-bold text-red-500">{spamCount}</p>
                <p className="text-[10px] text-gray-400">Spam Judol</p>
              </div>
              <div className="w-px h-8 bg-gray-100" />
              <div className="text-center">
                <p className="text-lg font-bold text-gray-700">{normalCount + spamCount}</p>
                <p className="text-[10px] text-gray-400">Total</p>
              </div>
            </div>
          )}
        </div>

        {/* Bar: Aktivitas Moderasi */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 lg:p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Aktivitas Moderasi</h2>
          <p className="text-xs text-gray-400 mb-4 lg:mb-5">Kumulatif aksi yang telah dilakukan (semua video)</p>
          <div className="h-[200px] lg:h-[240px] w-full">
            {history.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={actionData} barSize={36}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                  <Tooltip content={<CustomBarTooltip />} cursor={{ fill: '#F9FAFB' }} />
                  <Bar dataKey="jumlah" name="Jumlah" radius={[6, 6, 0, 0]}>
                    {actionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={ACTION_COLORS[index % ACTION_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full border-2 border-dashed border-gray-100 rounded-2xl text-gray-300">
                <span className="text-2xl mb-2">📊</span>
                <p className="text-xs">Belum ada data aktivitas</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Grafik per Video: Spam Judol vs Normal ─────────────── */}
      {perVideoData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 lg:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Spam Judol per Video</h2>
              <p className="text-xs text-gray-400">Perbandingan komentar normal dan spam judi online dari setiap video yang dimoderasi</p>
            </div>
            <div className="flex items-center gap-3 text-[10px]">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-red-400" />
                <span className="text-gray-500">Spam Judol</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                <span className="text-gray-500">Normal</span>
              </div>
            </div>
          </div>
          <div className="h-[260px] lg:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perVideoData} barSize={16} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#9CA3AF' }}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={50}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                <Tooltip content={<CustomBarTooltip />} cursor={{ fill: '#F9FAFB' }} />
                <Bar dataKey="judol" name="Spam Judol" fill="#EF4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="normal" name="Normal"     fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Kualitas Komunitas: Sentimen ────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 lg:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="lg:w-1/3">
            <h2 className="text-base font-bold text-gray-900 mb-1">Kualitas Komunitas</h2>
            <p className="text-xs text-gray-500 mb-4">
              Analisis emosi penonton dari komentar yang bukan spam.
              {chartVideoFilter !== 'all' && (
                <span className="block mt-1 text-amber-500 font-medium">Video terpilih saja</span>
              )}
            </p>

            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-lg">😊</span>
                  <span className="text-xs font-medium text-emerald-700">Positif</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-emerald-700">{positiveCount}</span>
                  <p className="text-[10px] text-emerald-500">
                    {Math.round((positiveCount / (positiveCount + negativeCount + neutralCount || 1)) * 100)}%
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-rose-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-lg">😠</span>
                  <span className="text-xs font-medium text-rose-700">Negatif</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-rose-700">{negativeCount}</span>
                  <p className="text-[10px] text-rose-500">
                    {Math.round((negativeCount / (positiveCount + negativeCount + neutralCount || 1)) * 100)}%
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-lg">😐</span>
                  <span className="text-xs font-medium text-gray-600">Netral</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-gray-700">{neutralCount}</span>
                  <p className="text-[10px] text-gray-400">
                    {Math.round((neutralCount / (positiveCount + negativeCount + neutralCount || 1)) * 100)}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 h-[250px] lg:h-[300px] w-full">
            {filteredHistory.some(h => h.sentiment) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sentimentData.filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
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
                  <text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 22, fontWeight: 700, fill: '#111827' }}>
                    {Math.round((positiveCount / (positiveCount + negativeCount + neutralCount || 1)) * 100)}%
                  </text>
                  <text x="50%" y="57%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 10, fill: '#10B981' }}>
                    Sentimen Positif
                  </text>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-300 border-2 border-dashed border-gray-100 rounded-2xl">
                <span className="text-2xl mb-2">📊</span>
                <p className="text-xs">Belum ada data sentimen untuk dianalisis</p>
                <p className="text-[10px] mt-1 text-gray-400">Moderasi komentar normal untuk melihat hasil</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom section ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Tugas Cepat */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 lg:p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Tugas Cepat</h2>
          <p className="text-xs text-gray-400 mb-4">Akses fitur utama dengan cepat</p>
          <div className="space-y-1">
            <Link href="/comments" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group">
              <svg className="w-5 h-5 text-gray-400 group-hover:text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <span className="text-sm text-gray-700 group-hover:text-gray-900">Tinjau Antrian Moderasi</span>
            </Link>
            <Link href="/preferensi" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group">
              <svg className="w-5 h-5 text-gray-400 group-hover:text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
              </svg>
              <span className="text-sm text-gray-700 group-hover:text-gray-900">Kelola Filter</span>
            </Link>
            <Link href="/riwayat" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group">
              <svg className="w-5 h-5 text-gray-400 group-hover:text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-gray-700 group-hover:text-gray-900">Lihat Riwayat</span>
            </Link>
          </div>
        </div>

        {/* Video Terbaru */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 lg:p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Video Terbaru</h2>
          <p className="text-xs text-gray-400 mb-4">Video dari kanal Anda</p>

          {videos.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
              </svg>
              <p className="text-xs text-gray-400">Belum ada video ditemukan</p>
              <Link href="/channel" className="text-xs text-amber-600 hover:underline mt-1 inline-block">
                Pilih kanal terlebih dahulu →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
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
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
                  >
                    <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={video.snippet.thumbnails.default.url} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate group-hover:text-gray-900">{video.snippet.title}</p>
                      <p className="text-[11px] text-gray-400">
                        {new Date(video.snippet.publishedAt).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                    {/* Badge spam judol jika ada */}
                    {spamInVideo > 0 && (
                      <span className="flex-shrink-0 text-[10px] font-semibold bg-red-50 text-red-500 px-2 py-0.5 rounded-full border border-red-100">
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
