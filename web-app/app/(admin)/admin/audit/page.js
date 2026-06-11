'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { Search, ShieldAlert, ArrowRight, Eye, EyeOff, Calendar } from 'lucide-react';

export default function AdminAuditPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, limit: 10 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [expandedLogId, setExpandedLogId] = useState(null);
  const toast = useToast();

  async function fetchAuditLogs() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        search,
      });

      const response = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      const json = await response.json();

      if (json.success) {
        setLogs(json.logs);
        setPagination(json.pagination);
      } else {
        toast.error(json.error || 'Gagal memuat log audit admin');
      }
    } catch (e) {
      console.error(e);
      toast.error('Kesalahan koneksi API');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAuditLogs();
  }, [page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchAuditLogs();
  };

  const toggleExpandLog = (id) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  // Translate action name to readable text
  const translateAction = (action) => {
    switch (action) {
      case 'SUSPEND_USER': return 'Menonaktifkan Akun (Suspend)';
      case 'UNSUSPEND_USER': return 'Mengaktifkan Kembali Akun';
      case 'CHANGE_USER_ROLE': return 'Mengubah Peran Akun (Role)';
      case 'CHANGE_USER_TIER': return 'Mengubah Tier Langganan';
      case 'ADJUST_USER_QUOTA': return 'Penyesuaian Saldo Kuota';
      case 'UPDATE_USER_PROFILE': return 'Memperbarui Profil User';
      default: return action;
    }
  };

  // Badge color for actions
  const getActionBadgeColor = (action) => {
    if (action.includes('SUSPEND')) return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20';
    if (action.includes('ROLE')) return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
    if (action.includes('TIER') || action.includes('QUOTA')) return 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300 border border-indigo-500/25';
    return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-primary flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-rose-500" />
          Log Audit Tindakan Admin
        </h1>
        <p className="text-xs text-muted mt-1">Rekam jejak seluruh aktivitas administratif dan perubahan pengaturan penting yang dilakukan oleh Admin atau Superadmin.</p>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl border bg-card border-[var(--border-default)] shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="Cari berdasarkan email admin pelaksana atau target user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-[var(--border-default)] bg-page focus:outline-none focus:ring-1 focus:ring-rose-500/50 focus:border-rose-500/50"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer"
          >
            Cari
          </button>
        </form>
      </div>

      {/* Audit Logs List */}
      <div className="rounded-2xl border bg-card border-[var(--border-default)] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--border-default)] bg-muted/30 text-muted font-bold">
                <th className="p-4">Admin Pelaksana</th>
                <th className="p-4">Tindakan</th>
                <th className="p-4">Target User</th>
                <th className="p-4">IP Address</th>
                <th className="p-4">Waktu</th>
                <th className="p-4 text-center">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-default)]">
              {logs.map((log) => (
                <optgroup key={log.id} label={log.id} className="p-0 m-0 border-none font-normal">
                  <tr className="hover:bg-muted/5 transition-colors">
                    <td className="p-4 font-bold text-primary">{log.admin_email}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase ${getActionBadgeColor(log.action)}`}>
                        {translateAction(log.action)}
                      </span>
                    </td>
                    <td className="p-4 text-secondary font-medium">{log.target_email || '-'}</td>
                    <td className="p-4 text-muted">{log.ip_address || '127.0.0.1'}</td>
                    <td className="p-4 text-muted">
                      {log.created_at ? new Date(log.created_at).toLocaleString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      }) : '-'}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => toggleExpandLog(log.id)}
                        className="p-1 rounded hover:bg-muted text-muted hover:text-rose-500 transition-colors cursor-pointer"
                        title="Lihat Perubahan"
                      >
                        {expandedLogId === log.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                  
                  {/* Expanded Detail Panel */}
                  {expandedLogId === log.id && (
                    <tr className="bg-muted/10">
                      <td colSpan="6" className="p-4">
                        <div className="p-4 rounded-xl border border-[var(--border-default)] bg-card text-xs space-y-3 shadow-inner">
                          <h4 className="font-bold text-primary border-b pb-1.5 border-[var(--border-default)]">Detail Perubahan Konfigurasi</h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Before State */}
                            <div className="space-y-1">
                              <p className="font-semibold text-rose-600 dark:text-rose-400">Sebelumnya (Sebelum Perubahan):</p>
                              <pre className="p-2.5 rounded-lg bg-page font-mono text-[10px] text-muted overflow-auto max-h-[150px]">
                                {log.details?.before ? JSON.stringify(log.details.before, null, 2) : 'Tidak ada data'}
                              </pre>
                            </div>

                            {/* After State */}
                            <div className="space-y-1">
                              <p className="font-semibold text-emerald-600 dark:text-emerald-400">Sesudahnya (Setelah Perubahan):</p>
                              <pre className="p-2.5 rounded-lg bg-page font-mono text-[10px] text-secondary overflow-auto max-h-[150px]">
                                {log.details?.after ? JSON.stringify(log.details.after, null, 2) : 'Tidak ada data'}
                              </pre>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </optgroup>
              ))}
              {logs.length === 0 && !loading && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-muted text-xs">
                    Log audit tidak ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-[var(--border-default)] flex items-center justify-between text-xs text-muted">
            <span>Halaman {pagination.page} dari {pagination.totalPages} (Total {pagination.totalItems} Log Tindakan)</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="px-2.5 py-1.5 rounded-lg border hover:bg-muted/30 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
              >
                Sebelumnya
              </button>
              <button
                onClick={() => setPage(p => Math.min(p + 1, pagination.totalPages))}
                disabled={page === pagination.totalPages}
                className="px-2.5 py-1.5 rounded-lg border hover:bg-muted/30 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
