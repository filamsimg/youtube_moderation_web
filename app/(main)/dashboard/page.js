'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { youtubeService } from '@/services/youtubeService';
import Link from 'next/link';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  Sector
} from 'recharts';

export default function DashboardPage() {
  const { data: session } = useSession();
  const [channelInfo, setChannelInfo] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (session?.accessToken) {
      loadData(session.accessToken);
    } else {
      setLoading(false);
    }
  }, [session]);

  const loadData = async (token) => {
    try {
      setLoading(true);
      setError(null);
      // Fetch channel
      const channelData = await youtubeService.getUserChannel(token);
      const channel = channelData.items?.[0];
      setChannelInfo(channel);

      // Fetch videos if channel exists
      if (channel) {
        localStorage.setItem('selectedChannelId', channel.id);
        const videoData = await youtubeService.getVideosByChannel(channel.id, token);
        const videoItems = (videoData.items || []).filter(item => item.id?.videoId).slice(0, 5);
        setVideos(videoItems);
      }
    } catch (err) {
      console.error('Gagal memuat data dashboard:', err);
      setError(err.message || 'Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  };


  // Get moderation history from localStorage
  const getHistory = () => {
    try {
      return JSON.parse(localStorage.getItem('moderationHistory') || '[]');
    } catch {
      return [];
    }
  };

  const history = typeof window !== 'undefined' ? getHistory() : [];
  const totalPublished = history.filter(h => h.action === 'published').length;
  const totalRejected = history.filter(h => h.action === 'rejected').length;
  const totalHeld = history.filter(h => h.action === 'heldForReview').length;

  // Chart Data
  const normalCount = history.filter(h => h.aiLabel === 'Normal').length;
  const spamCount = history.filter(h => h.aiLabel === 'Spam').length;
  
  const contentData = [
    { name: 'Normal', value: normalCount || 0 },
    { name: 'Spam/Judol', value: spamCount || 0 },
  ];

  const actionData = [
    { name: 'Aman', jumlah: totalPublished },
    { name: 'Ditahan', jumlah: totalHeld },
    { name: 'Ditolak', jumlah: totalRejected },
  ];

  const COLORS = ['#10B981', '#EF4444'];
  const ACTION_COLORS = ['#3B82F6', '#F59E0B', '#EF4444'];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up space-y-6 pb-10">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Ringkasan Moderasi</h1>
        <p className="text-sm text-gray-400 mt-0.5">Pantau aktivitas komentar dan metrik moderasi Anda</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-red-500 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-red-800">Gagal Memuat Data YouTube</p>
            <p className="text-xs text-red-600 mt-0.5">{error}</p>
            <p className="text-[10px] text-red-400 mt-1 italic">
              Tips: Periksa koneksi internet atau apakah kuota API YouTube harian Anda telah habis.
            </p>
          </div>
        </div>
      )}


      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-500">Video Ditemukan</p>
            <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-gray-900">{videos.length}</p>
          <p className="text-[11px] text-gray-400 mt-1">dari kanal Anda</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-500">Aman (Diterbitkan)</p>
            <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalPublished}</p>
          <p className="text-[11px] text-gray-400 mt-1">komentar disetujui</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-500">Ditahan</p>
            <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalHeld}</p>
          <p className="text-[11px] text-gray-400 mt-1">menunggu tinjauan</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-500">Spam (Ditolak)</p>
            <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalRejected}</p>
          <p className="text-[11px] text-gray-400 mt-1">komentar spam</p>
        </div>
      </div>

      {/* Visual Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Analisis Sentimen Konten</h2>
              <p className="text-xs text-gray-400">Distribusi komentar Normal vs Spam</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-[10px] text-gray-500">Normal</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-[10px] text-gray-500">Spam</span>
              </div>
            </div>
          </div>
          <div className="h-[240px] w-full">
            {history.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={contentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {contentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-gray-900 font-bold text-lg">
                    {Math.round((spamCount / (normalCount + spamCount || 1)) * 100)}%
                  </text>
                  <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" className="fill-gray-400 text-[10px]">
                    Spam
                  </text>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-300">
                <p className="text-xs">Belum ada data analisis</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Aktivitas Moderasi</h2>
          <p className="text-xs text-gray-400 mb-6">Kumulatif aksi yang telah dilakukan</p>
          <div className="h-[240px] w-full">
            {history.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={actionData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#9CA3AF' }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#9CA3AF' }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#F9FAFB' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="jumlah" radius={[4, 4, 0, 0]}>
                    {actionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={ACTION_COLORS[index % ACTION_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-300">
                <p className="text-xs">Belum ada data aktivitas</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Tugas Cepat */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Tugas Cepat</h2>
          <p className="text-xs text-gray-400 mb-4">Akses fitur utama dengan cepat</p>
          <div className="space-y-2">
            <Link href="/comments" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group">
              <svg className="w-5 h-5 text-gray-400 group-hover:text-indigo-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <span className="text-sm text-gray-700 group-hover:text-gray-900">Tinjau Antrian Moderasi</span>
            </Link>
            <Link href="/preferensi" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group">
              <svg className="w-5 h-5 text-gray-400 group-hover:text-indigo-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
              </svg>
              <span className="text-sm text-gray-700 group-hover:text-gray-900">Kelola Filter</span>
            </Link>
            <Link href="/riwayat" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group">
              <svg className="w-5 h-5 text-gray-400 group-hover:text-indigo-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-gray-700 group-hover:text-gray-900">Lihat Riwayat</span>
            </Link>
          </div>
        </div>

        {/* Video Terbaru */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Video Terbaru</h2>
          <p className="text-xs text-gray-400 mb-4">Video dari kanal Anda</p>

          {videos.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
              </svg>
              <p className="text-xs text-gray-400">Belum ada video ditemukan</p>
              <Link href="/channel" className="text-xs text-indigo-600 hover:underline mt-1 inline-block">Pilih kanal terlebih dahulu →</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {videos.map((video) => (
                <div
                  key={video.id.videoId}
                  onClick={() => {
                    localStorage.setItem('selectedVideoId', video.id.videoId);
                    localStorage.setItem('selectedVideoTitle', video.snippet.title);
                    window.location.href = '/comments';
                  }}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={video.snippet.thumbnails.default.url} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">{video.snippet.title}</p>
                    <p className="text-[11px] text-gray-400">
                      {new Date(video.snippet.publishedAt).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
