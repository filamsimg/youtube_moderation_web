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
    if (session?.user?.email) loadHistory();
    else setLoading(false);
  }, [session?.user?.email]);

  const loadHistory = async () => {
    setLoading(true);
    const data = await historyService.getHistory(session.user.email);
    const mapped = data.map(item => ({
      ...item,
      commentText: item.comment_text,
      videoTitle:  item.video_title,
      aiLabel:     item.ai_label,
      aiConfidence: item.ai_confidence,
      sentimentScore: item.sentiment_score,
      timestamp:   item.created_at,
    }));
    setActivities(mapped);
    setLoading(false);
  };

  const getActionLabel = (action) => {
    const map = { published: 'Aman', rejected: 'Ditolak', heldForReview: 'Ditahan' };
    return map[action] || action;
  };

  const getActionBadge = (action) => {
    const label = getActionLabel(action);
    const cls = {
      published:     'badge badge-success',
      rejected:      'badge badge-danger',
      heldForReview: 'badge badge-warning',
    }[action] || 'badge badge-muted';
    return (
      <span className={cls}>
        <span className={`w-1.5 h-1.5 rounded-full ${
          action === 'published' ? 'bg-emerald-500' :
          action === 'rejected'  ? 'bg-rose-500' :
          'bg-amber-500'
        }`} />
        {label}
      </span>
    );
  };

  const filtered = activities.filter(a => {
    const matchesSearch = searchQuery === '' ||
      (a.commentText || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.author || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterAction === 'semua' ||
      getActionLabel(a.action).toLowerCase() === filterAction.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const totalAman    = activities.filter(a => a.action === 'published').length;
  const totalDitolak = activities.filter(a => a.action === 'rejected').length;
  const totalDitahan = activities.filter(a => a.action === 'heldForReview').length;

  return (
    <div className="animate-fade-in-up space-y-5 pb-10">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg lg:text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Riwayat Aktivitas
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Riwayat membantu meninjau konsistensi keputusan moderasi
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all self-start sm:self-auto bento-card"
          style={{ color: 'var(--text-secondary)' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Ekspor
        </button>
      </div>

      {/* ── Summary Stats ────────────────────────────────────── */}
      {activities.length > 0 && (
        <div className="bento-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
            </svg>
            <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Statistik Riwayat</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-xl" style={{ background: 'var(--color-success-bg)', border: '1px solid var(--color-success-border)' }}>
              <p className="text-lg font-bold" style={{ color: 'var(--color-success-text)' }}>{totalAman}</p>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-success-text)' }}>Aman</p>
            </div>
            <div className="p-3 rounded-xl" style={{ background: 'var(--color-warning-bg)', border: '1px solid var(--color-warning-border)' }}>
              <p className="text-lg font-bold" style={{ color: 'var(--color-warning-text)' }}>{totalDitahan}</p>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-warning-text)' }}>Ditahan</p>
            </div>
            <div className="p-3 rounded-xl" style={{ background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)' }}>
              <p className="text-lg font-bold" style={{ color: 'var(--color-danger-text)' }}>{totalDitolak}</p>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-danger-text)' }}>Ditolak</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Search + Filters ──────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="flex-1 relative">
          <svg
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-muted)' }}
            fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Cari komentar, pengguna..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-dark w-full pl-10"
          />
        </div>
        <div className="relative">
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="input-dark w-full sm:w-auto appearance-none pr-8"
          >
            <option value="semua">Semua Tindakan</option>
            <option value="aman">Aman</option>
            <option value="ditolak">Ditolak</option>
            <option value="ditahan">Ditahan</option>
          </select>
          <svg
            className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--text-muted)' }}
            fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </div>

      {/* ── Count ─────────────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Daftar Riwayat</h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{filtered.length} aktivitas ditemukan</p>
      </div>

      {/* ── List / Loading / Empty ────────────────────────────── */}
      {loading ? (
        <div className="bento-card flex flex-col items-center justify-center py-20">
          <div className="relative mb-3">
            <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-lg animate-pulse" />
            <img src="/logo.webp" className="relative w-10 h-10 animate-float" />
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Sinkronisasi data database...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state py-16">
          <svg className="w-12 h-12 mb-3" style={{ color: 'var(--border-hover)' }} fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Belum ada riwayat moderasi</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Riwayat akan muncul saat Anda mulai memoderasi komentar
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bento-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--border-default)' }}>
                    {['Waktu', 'Tindakan', 'Komentar', 'Hasil AI', 'Pengguna', 'Video'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody style={{ '--divide-color': 'var(--border-default)' }}>
                  {filtered.map((item, i) => (
                    <tr
                      key={i}
                      className="border-b transition-colors hover:bg-[var(--bg-card-hover)]"
                      style={{ borderColor: 'var(--border-default)' }}
                    >
                      {/* Waktu */}
                      <td className="px-5 py-3 text-[11px] whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                        {new Date(item.timestamp).toLocaleString('id-ID')}
                      </td>
                      {/* Tindakan */}
                      <td className="px-5 py-3">{getActionBadge(item.action)}</td>
                      {/* Komentar */}
                      <td className="px-5 py-3">
                        <p className="text-xs line-clamp-2 max-w-[250px]" style={{ color: 'var(--text-secondary)' }} title={item.commentText}>
                          {item.commentText || '-'}
                        </p>
                      </td>
                      {/* Hasil AI */}
                      <td className="px-5 py-3">
                        <div className="flex flex-col gap-1">
                          <span className={`badge ${item.aiLabel?.toLowerCase() === 'spam' ? 'badge-danger' : 'badge-success'}`}>
                            {item.aiLabel === 'Spam' ? '🚨 Spam Judol' : '✅ Normal'}
                          </span>
                          {item.aiLabel !== 'Spam' && item.sentiment && (
                            <span className={`badge ${
                              item.sentiment === 'positive' ? 'badge-success' :
                              item.sentiment === 'negative' ? 'badge-danger' :
                              'badge-muted'
                            }`}>
                              {item.sentiment === 'positive' ? '😊 Positif' :
                               item.sentiment === 'negative' ? '😠 Negatif' : '😐 Netral'}
                            </span>
                          )}
                        </div>
                      </td>
                      {/* Pengguna */}
                      <td className="px-5 py-3 text-xs font-medium whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                        {item.author || '-'}
                      </td>
                      {/* Video */}
                      <td className="px-5 py-3 text-xs max-w-[180px] truncate" style={{ color: 'var(--text-muted)' }} title={item.videoTitle}>
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
              <div key={i} className="bento-card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  {getActionBadge(item.action)}
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    {new Date(item.timestamp).toLocaleString('id-ID')}
                  </span>
                </div>
                <p className="text-xs line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                  {item.commentText || '-'}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`badge ${item.aiLabel?.toLowerCase() === 'spam' ? 'badge-danger' : 'badge-success'}`}>
                    {item.aiLabel === 'Spam' ? '🚨 Spam Judol' : '✅ Normal'}
                  </span>
                  {item.aiLabel !== 'Spam' && item.sentiment && (
                    <span className={`badge ${
                      item.sentiment === 'positive' ? 'badge-success' :
                      item.sentiment === 'negative' ? 'badge-danger' : 'badge-muted'
                    }`}>
                      {item.sentiment === 'positive' ? '😊 Positif' :
                       item.sentiment === 'negative' ? '😠 Negatif' : '😐 Netral'}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--border-default)' }}>
                  <span className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {item.author || '-'}
                  </span>
                  <span className="text-[10px] truncate max-w-[140px]" style={{ color: 'var(--text-muted)' }}>
                    {item.videoTitle || '-'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
