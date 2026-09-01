'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { Search, Filter, ShieldAlert, CheckCircle, Clock } from 'lucide-react';
import PaginationControls from '@/components/PaginationControls';

export default function AdminModerationPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, limit: 10 });
  const [searchVal, setSearchVal] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ label: '', action: '' });
  const [page, setPage] = useState(1);
  const toast = useToast();

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        search: searchQuery,
        label: filters.label,
        action: filters.action,
      });

      const response = await fetch(`/api/admin/moderation?${params.toString()}`);
      const json = await response.json();

      if (json.success) {
        setHistory(json.history);
        setPagination(json.pagination);
      } else {
        toast.error(json.error || 'Gagal memuat log moderasi global');
      }
    } catch (e) {
      console.error(e);
      toast.error('Kesalahan koneksi API');
    } finally {
      setLoading(false);
    }
  }, [page, pagination.limit, searchQuery, filters.label, filters.action, toast]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setSearchQuery(searchVal);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-primary">Log Moderasi Global</h1>
        <p className="text-xs text-muted mt-1">Pantau seluruh riwayat komentar YouTube milik pengguna yang telah dipindai dan diklasifikasikan oleh sistem kecerdasan buatan.</p>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl border bg-card border-[var(--border-default)] shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="Cari berdasarkan teks, author, email user, atau video..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-[var(--border-default)] bg-page focus:outline-none focus:ring-1 focus:ring-rose-500/50 focus:border-rose-500/50"
            />
          </div>

          {/* Label Filter */}
          <select
            value={filters.label}
            onChange={(e) => setFilters({ ...filters, label: e.target.value })}
            className="px-3 py-2 text-xs rounded-xl border border-[var(--border-default)] bg-page focus:outline-none text-secondary"
          >
            <option value="">Semua Label AI</option>
            <option value="Spam">Spam Judol</option>
            <option value="Normal">Normal</option>
          </select>

          {/* Action Filter */}
          <select
            value={filters.action}
            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
            className="px-3 py-2 text-xs rounded-xl border border-[var(--border-default)] bg-page focus:outline-none text-secondary"
          >
            <option value="">Semua Tindakan YouTube</option>
            <option value="published">Dipublikasikan (Published)</option>
            <option value="heldForReview">Ditahan (Held For Review)</option>
            <option value="rejected">Ditolak / Dihapus (Rejected)</option>
          </select>
        </form>
      </div>

      {/* Moderation History Table */}
      <div className="rounded-2xl border bg-card border-[var(--border-default)] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--border-default)] bg-muted/30 text-muted font-bold">
                <th className="p-4">Kreator (User Email)</th>
                <th className="p-4">Penulis & Komentar</th>
                <th className="p-4">Judul Video</th>
                <th className="p-4">Label AI (Confidence)</th>
                <th className="p-4">Sentimen</th>
                <th className="p-4">Tindakan YouTube</th>
                <th className="p-4">Waktu Moderasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-default)]">
              {loading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="p-4"><div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded-md" /></td>
                    <td className="p-4 space-y-1">
                      <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded-md" />
                      <div className="h-3 w-48 bg-slate-200 dark:bg-slate-800 rounded-md" />
                    </td>
                    <td className="p-4"><div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded-md" /></td>
                    <td className="p-4"><div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded-full" /></td>
                    <td className="p-4"><div className="h-4 w-12 bg-slate-200 dark:bg-slate-800 rounded-md" /></td>
                    <td className="p-4"><div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded-full" /></td>
                    <td className="p-4"><div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded-md" /></td>
                  </tr>
                ))
              ) : (
                history.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/10 transition-colors">
                    <td className="p-4 font-semibold text-secondary truncate max-w-[150px]" title={log.user_email}>
                      {log.user_email}
                    </td>
                    <td className="p-4 space-y-1">
                      <p className="font-bold text-primary">{log.author}</p>
                      <p className="text-secondary whitespace-normal break-all line-clamp-3 leading-relaxed" title={log.comment_text}>
                        {log.comment_text}
                      </p>
                    </td>
                    <td className="p-4 text-muted truncate max-w-[150px]" title={log.video_title}>
                      {log.video_title || '-'}
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase ${
                          log.ai_label === 'Spam' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 animate-pulse' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300'
                        }`}>
                          {log.ai_label === 'Spam' ? 'Spam Judol' : 'Normal'}
                        </span>
                        <p className="text-[10px] text-muted">
                          {(log.ai_confidence * 100).toFixed(1)}% yakin
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      {log.sentiment ? (
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                          log.sentiment === 'Positif' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                          log.sentiment === 'Negatif' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' :
                          'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {log.sentiment}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase ${
                        log.action === 'published' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                        log.action === 'heldForReview' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                        'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}>
                        {log.action === 'published' ? 'Published' :
                         log.action === 'heldForReview' ? 'Held Review' : 'Deleted/Rejected'}
                      </span>
                    </td>
                    <td className="p-4 text-muted whitespace-nowrap">
                      {log.created_at ? new Date(log.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                  </tr>
                ))
              )}
              {history.length === 0 && !loading && (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-muted text-xs">
                    Tidak ada riwayat moderasi komentar yang cocok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <PaginationControls
          currentPage={page}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
