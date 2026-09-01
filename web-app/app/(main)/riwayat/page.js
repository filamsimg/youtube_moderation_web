'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { historyService } from '@/services/historyService';
import PaginationControls from '@/components/PaginationControls';
import { useToast } from '@/contexts/ToastContext';
import { useQuota } from '@/contexts/QuotaContext';
import Link from 'next/link';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { formatDateTime } from '@/lib/utils';

export default function RiwayatPage() {
  const { data: session } = useSession();
  const toast = useToast();
  const { isFeatureDisabled } = useQuota();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState('semua');
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Reset page to 1 when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterAction]);

  const loadHistory = useCallback(async () => {
    if (!session?.user?.email) return;
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
  }, [session?.user?.email]);

  useEffect(() => {
    if (session?.user?.email) loadHistory();
    else setLoading(false);
  }, [session?.user?.email, loadHistory]);

  const handleExportCSV = () => {
    if (isFeatureDisabled('export_csv')) {
      toast.error('Fitur Ekspor CSV terkunci untuk paket langganan Anda. Silakan upgrade!');
      return;
    }
    if (filtered.length === 0) {
      toast.error('Tidak ada data riwayat yang dapat diekspor!');
      return;
    }

    // Define CSV Headers
    const headers = ['Waktu', 'Tindakan', 'Isi Komentar', 'AI Analisis', 'Sentimen', 'Pengguna', 'Judul Video'];

    // Map activities to CSV Row Arrays
    const rows = filtered.map(item => [
      `"${new Date(item.timestamp).toLocaleString('id-ID').replace(/"/g, '""')}"`,
      getActionLabel(item.action),
      `"${(item.commentText || '').replace(/"/g, '""')}"`,
      item.aiLabel === 'Spam' ? 'Spam Judol' : 'Normal',
      item.aiLabel !== 'Spam' && item.sentiment === 'positive' ? 'Positif' :
      item.aiLabel !== 'Spam' && item.sentiment === 'negative' ? 'Negatif' :
      item.aiLabel !== 'Spam' && item.sentiment === 'neutral' ? 'Netral' : '-',
      `"${(item.author || '').replace(/"/g, '""')}"`,
      `"${(item.videoTitle || '').replace(/"/g, '""')}"`
    ]);

    // Construct CSV String with UTF-8 BOM
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create a Blob and trigger download
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `riwayat_moderasi_athena_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Berhasil mengekspor ${filtered.length} riwayat komentar ke berkas CSV!`);
  };

  const getActionLabel = (action) => {
    const map = { published: 'Aman', rejected: 'Ditolak', heldForReview: 'Ditahan' };
    return map[action] || action;
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

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedActivities = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
            Riwayat membantu Anda meninjau kembali tindakan penyaringan komentar yang telah diambil
          </p>
        </div>
        {isFeatureDisabled('export_csv') ? (
          <Link
            href="/pricing"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all self-start sm:self-auto bento-card cursor-pointer hover:border-amber-500/40 hover:bg-amber-500/5 select-none"
            style={{ color: 'var(--text-secondary)' }}
          >
            <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            <span className="text-amber-500 font-semibold">Ekspor Upgrade →</span>
          </Link>
        ) : (
          <button
            onClick={handleExportCSV}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all self-start sm:self-auto bento-card disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer"
            style={{ color: 'var(--text-secondary)' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Ekspor
          </button>
        )}
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
            className="input-dark w-full"
            style={{ paddingLeft: '2.5rem' }}
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
        <TableSkeleton rows={6} cols={4} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          title="Belum ada tindakan penyaringan"
          description="Riwayat tindakan Anda akan otomatis muncul di sini setelah Anda memeriksa komentar."
        />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bento-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--border-default)' }}>
                    {['Waktu', 'Tindakan', 'Komentar', 'Hasil AI', 'Pengguna', 'Video'].map(h => (
                      <th key={h} className="px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody style={{ '--divide-color': 'var(--border-default)' }}>
                  {paginatedActivities.map((item, i) => (
                    <tr
                      key={i}
                      className="border-b transition-colors hover:bg-[var(--bg-card-hover)]"
                      style={{ borderColor: 'var(--border-default)' }}
                    >
                      {/* Waktu */}
                      <td className="px-5 py-3 text-[11px] whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                        {formatDateTime(item.timestamp)}
                      </td>
                      {/* Tindakan */}
                      <td className="px-5 py-3">
                        <StatusBadge type="status" value={item.action} />
                      </td>
                      {/* Komentar */}
                      <td className="px-5 py-3">
                        <p className="text-xs line-clamp-2 max-w-[250px]" style={{ color: 'var(--text-secondary)' }} title={item.commentText}>
                          {item.commentText || '-'}
                        </p>
                      </td>
                      {/* Hasil AI */}
                      <td className="px-5 py-3">
                        <div className="flex flex-col gap-1 justify-center items-center">
                          <StatusBadge type="ai_label" value={item.aiLabel || 'normal'} />
                          {item.aiLabel !== 'Spam' && item.sentiment && (
                            <StatusBadge type="sentiment" value={item.sentiment} />
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
            {paginatedActivities.map((item, i) => (
              <div key={i} className="bento-card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <StatusBadge type="status" value={item.action} />
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    {formatDateTime(item.timestamp)}
                  </span>
                </div>
                <p className="text-xs line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                  {item.commentText || '-'}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge type="ai_label" value={item.aiLabel || 'normal'} />
                  {item.aiLabel !== 'Spam' && item.sentiment && (
                    <StatusBadge type="sentiment" value={item.sentiment} />
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

          {/* Pagination Controls */}
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
  );
}
