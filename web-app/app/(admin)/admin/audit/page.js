'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { Search, ShieldAlert, ArrowRight, Eye, EyeOff, Calendar } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import PaginationControls from '@/components/PaginationControls';
import { formatDateTime } from '@/lib/utils';

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
                <React.Fragment key={log.id}>
                  <tr className="hover:bg-muted/5 transition-colors">
                    <td className="p-4 font-bold text-primary">{log.admin_email}</td>
                    <td className="p-4">
                      <StatusBadge type="audit_action" value={log.action} label={translateAction(log.action)} />
                    </td>
                    <td className="p-4 text-secondary font-medium">{log.target_email || '-'}</td>
                    <td className="p-4 text-muted">{log.ip_address || '127.0.0.1'}</td>
                    <td className="p-4 text-muted">
                      {formatDateTime(log.created_at)}
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
                          <h4 className="font-bold text-primary border-b pb-1.5 border-[var(--border-default)]">
                            Detail Perubahan Konfigurasi {log.details?.package_id ? `(Package ID: ${log.details.package_id})` : ''}
                          </h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Before State */}
                            <div className="space-y-1">
                              <p className="font-semibold text-rose-600 dark:text-rose-400">Sebelumnya (Sebelum Perubahan):</p>
                              <pre className="p-2.5 rounded-lg bg-page font-mono text-[10px] text-muted overflow-auto max-h-[150px]">
                                {log.details?.changes?.before 
                                  ? JSON.stringify(log.details.changes.before, null, 2) 
                                  : log.details?.before 
                                    ? JSON.stringify(log.details.before, null, 2) 
                                    : 'Tidak ada data'}
                              </pre>
                            </div>

                            {/* After State */}
                            <div className="space-y-1">
                              <p className="font-semibold text-emerald-600 dark:text-emerald-400">Sesudahnya (Setelah Perubahan):</p>
                              <pre className="p-2.5 rounded-lg bg-page font-mono text-[10px] text-secondary overflow-auto max-h-[150px]">
                                {log.details?.changes?.after 
                                  ? JSON.stringify(log.details.changes.after, null, 2) 
                                  : log.details?.after 
                                    ? JSON.stringify(log.details.after, null, 2) 
                                    : 'Tidak ada data'}
                              </pre>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {logs.length === 0 && !loading && (
                <tr>
                  <td colSpan="6">
                    <EmptyState
                      icon={<ShieldAlert className="w-12 h-12 text-muted" />}
                      title="Log audit tidak ditemukan"
                      description="Tidak ada rekam jejak aktivitas admin yang cocok dengan kriteria pencarian Anda."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <PaginationControls
          currentPage={page}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
