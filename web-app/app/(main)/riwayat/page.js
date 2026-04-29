'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { historyService } from '@/services/historyService';

export default function RiwayatPage() {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState('semua');
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.email) {
      loadHistory();
    }
  }, [session]);

  const loadHistory = async () => {
    setLoading(true);
    const data = await historyService.getHistory(session.user.email);
    // Map database fields to UI fields if necessary
    const mapped = data.map(item => ({
      ...item,
      commentText: item.comment_text, // Map snake_case to camelCase for UI compatibility
      videoTitle: item.video_title,
      aiLabel: item.ai_label,
      aiConfidence: item.ai_confidence,
      sentimentScore: item.sentiment_score,
      timestamp: item.created_at
    }));
    setActivities(mapped);
    setLoading(false);
  };

  const getActionLabel = (action) => {
    const map = { published: 'Diterbitkan', rejected: 'Ditolak', heldForReview: 'Ditahan' };
    return map[action] || action;
  };

  const getActionBadge = (action) => {
    const label = getActionLabel(action);
    const colorMap = { published: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700', heldForReview: 'bg-amber-100 text-amber-700' };
    const dotMap = { published: 'bg-green-500', rejected: 'bg-red-500', heldForReview: 'bg-amber-500' };
    return (
      <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full ${colorMap[action] || 'bg-gray-100 text-gray-700'}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dotMap[action] || 'bg-gray-500'}`}></span>
        {label}
      </span>
    );
  };

  const filtered = activities.filter(a => {
    const matchesSearch = searchQuery === '' ||
      (a.commentText || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.author || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterAction === 'semua' || getActionLabel(a.action).toLowerCase() === filterAction.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const totalDiterbitkan = activities.filter(a => a.action === 'published').length;
  const totalDitolak = activities.filter(a => a.action === 'rejected').length;
  const totalDitahan = activities.filter(a => a.action === 'heldForReview').length;

  return (
    <div className="animate-fade-in-up space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg lg:text-xl font-semibold text-gray-900">Riwayat Aktivitas</h1>
          <p className="text-sm text-gray-400 mt-0.5">Riwayat membantu meninjau konsistensi keputusan moderasi</p>
        </div>
        <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-all self-start sm:self-auto">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Ekspor
        </button>
      </div>
{/* Summary stats */}
      {activities.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
            </svg>
            <p className="text-xs font-semibold text-gray-700">Statistik Riwayat</p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-lg font-bold text-green-600">{totalDiterbitkan}</p>
              <p className="text-[10px] text-green-500 mt-0.5">Diterbitkan</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-3">
              <p className="text-lg font-bold text-amber-600">{totalDitahan}</p>
              <p className="text-[10px] text-amber-500 mt-0.5">Ditahan</p>
            </div>
            <div className="bg-red-50 rounded-lg p-3">
              <p className="text-lg font-bold text-red-600">{totalDitolak}</p>
              <p className="text-[10px] text-red-500 mt-0.5">Ditolak</p>
            </div>
          </div>
        </div>
      )}
      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="flex-1 relative">
          <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Cari komentar, pengguna..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="relative">
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="w-full sm:w-auto appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2.5 pr-8 text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="semua">Semua Tindakan</option>
            <option value="diterbitkan">Diterbitkan</option>
            <option value="ditolak">Ditolak</option>
            <option value="ditahan">Ditahan</option>
          </select>
          <svg className="w-3 h-3 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </div>

      {/* Count */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900">Daftar Riwayat</h2>
        <p className="text-xs text-gray-400">{filtered.length} aktivitas ditemukan</p>
      </div>

      {/* List / Loading / Empty */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-200">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3"></div>
          <p className="text-xs text-gray-400">Sinkronisasi data database...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm font-medium text-gray-500">Belum ada riwayat moderasi</p>
          <p className="text-xs text-gray-400 mt-1">Riwayat akan muncul saat Anda mulai memoderasi komentar</p>
        </div>
      ) : (
        <>
        
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Waktu</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Tindakan</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Komentar</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Hasil AI</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Pengguna</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Video</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((item, i) => (
                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                      {/* 1. Waktu */}
                      <td className="px-5 py-3 text-[11px] text-gray-500 whitespace-nowrap">
                        {new Date(item.timestamp).toLocaleString('id-ID')}
                      </td>
                      
                      {/* 2. Tindakan */}
                      <td className="px-5 py-3">{getActionBadge(item.action)}</td>
                      
                      {/* 3. Komentar */}
                      <td className="px-5 py-3">
                        <p className="text-xs text-gray-700 line-clamp-2 max-w-[250px]" title={item.commentText}>
                          {item.commentText || '-'}
                        </p>
                      </td>

                      {/* 4. Hasil AI */}
                      <td className="px-5 py-3">
                        <div className="flex flex-col gap-1">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full w-fit ${item.aiLabel?.toLowerCase() === 'spam' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {item.aiLabel === 'Spam' ? '🚨 Spam' : '✅ Normal'}
                          </span>
                          {item.aiLabel !== 'Spam' && item.sentiment && (
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full w-fit ${item.sentiment === 'positive' ? 'bg-emerald-100 text-emerald-700' : item.sentiment === 'negative' ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-700'}`}>
                              {item.sentiment === 'positive' ? '😊 Positif' : item.sentiment === 'negative' ? '😠 Negatif' : '😐 Netral'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 5. Pengguna (Penulis) */}
                      <td className="px-5 py-3 text-xs text-gray-600 whitespace-nowrap font-medium">{item.author || '-'}</td>
                      
                      {/* 6. Video */}
                      <td className="px-5 py-3 text-xs text-gray-600 max-w-[180px] truncate" title={item.videoTitle}>
                        {item.videoTitle || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((item, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  {getActionBadge(item.action)}
                  <span className="text-[10px] text-gray-400">{new Date(item.timestamp).toLocaleString('id-ID')}</span>
                </div>
                <p className="text-xs text-gray-700 line-clamp-2">{item.commentText || '-'}</p>
                <div className="flex items-center gap-2">
                   <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${item.aiLabel?.toLowerCase() === 'spam' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {item.aiLabel === 'Spam' ? '🚨 Spam' : '✅ Normal'}
                   </span>
                   {item.aiLabel !== 'Spam' && item.sentiment && (
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${item.sentiment === 'positive' ? 'bg-emerald-100 text-emerald-700' : item.sentiment === 'negative' ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-700'}`}>
                        {item.sentiment === 'positive' ? '😊 Positif' : item.sentiment === 'negative' ? '😠 Negatif' : '😐 Netral'}
                      </span>
                   )}
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-gray-50">
                  <span className="text-[11px] text-gray-500 font-medium">{item.author || '-'}</span>
                  <span className="text-[10px] text-gray-400 truncate max-w-[140px]">{item.videoTitle || '-'}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      
    </div>
  );
}
