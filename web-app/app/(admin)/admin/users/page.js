'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { useSession } from 'next-auth/react';
import { Search, Filter, Edit3, ShieldAlert, CheckCircle, UserPlus, X, HelpCircle } from 'lucide-react';
import ConfirmModal from '@/components/ui/ConfirmModal';
import StatusBadge from '@/components/ui/StatusBadge';
import PaginationControls from '@/components/PaginationControls';

export default function AdminUsersPage() {
  const { data: session } = useSession();
  // PENTING: Ambil role dari database langsung, bukan dari JWT session.
  // JWT session bisa sudah kedaluwarsa jika role baru saja diubah di database.
  const [currentAdminRole, setCurrentAdminRole] = useState('user');

  useEffect(() => {
    if (!session?.user?.email) return;
    // Fetch profil admin aktual dari DB (bukan dari JWT token yang mungkin sudah usang)
    fetch('/api/quota/profile')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.role) setCurrentAdminRole(data.role); })
      .catch(() => {});
  }, [session?.user?.email]);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, limit: 10 });
  const [searchVal, setSearchVal] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ tier: '', role: '', status: '' });
  const [page, setPage] = useState(1);
  const toast = useToast();

  // Modal control states
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    tier: 'FREE',
    subscription_quota: 0,
    trial_quota: 1000,
    quota_limit: 1000,
    quota_expiry: '',
    role: 'user',
  });
  
  const [isUpdating, setIsUpdating] = useState(false);

  // Suspend action confirm state
  const [suspendingUser, setSuspendingUser] = useState(null);

  // Fetch users data
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        search: searchQuery,
        tier: filters.tier,
        role: filters.role,
        status: filters.status,
      });

      const response = await fetch(`/api/admin/users?${params.toString()}`);
      const json = await response.json();
      
      if (json.success) {
        setUsers(json.users);
        setPagination(json.pagination);
      } else {
        toast.error(json.error || 'Gagal memuat pengguna');
      }
    } catch (e) {
      console.error('Fetch users error:', e);
      toast.error('Gagal menghubungi API server');
    } finally {
      setLoading(false);
    }
  }, [page, pagination.limit, searchQuery, filters.tier, filters.role, filters.status, toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle Search Trigger on Enter or click
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setSearchQuery(searchVal);
  };

  // Open Edit Modal
  const openEditModal = (user) => {
    setEditingUser(user);
    setEditForm({
      tier: user.tier || 'FREE',
      subscription_quota: user.subscription_quota || 0,
      trial_quota: user.trial_quota || 0,
      quota_limit: user.quota_limit || 1000,
      quota_expiry: user.quota_expiry ? new Date(user.quota_expiry).toISOString().substring(0, 10) : '',
      role: user.role || 'user',
    });
  };

  // Close Edit Modal
  const closeEditModal = () => {
    setEditingUser(null);
  };

  // Handle Edit User Form Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    
    try {
      // Hanya kirim field yang memang ada di form (role hanya dikirim jika superadmin)
      const updates = {
        tier: editForm.tier,
        subscription_quota: editForm.subscription_quota,
        trial_quota: editForm.trial_quota,
        quota_limit: editForm.quota_limit,
        quota_expiry: editForm.quota_expiry,
      };

      // Role hanya boleh disertakan jika currentAdminRole adalah superadmin
      if (currentAdminRole === 'superadmin') {
        updates.role = editForm.role;
      }

      const response = await fetch('/api/admin/users/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_email: editingUser.email,
          updates,
        }),
      });
      const json = await response.json();

      if (json.success) {
        toast.success(`Akun ${editingUser.email} berhasil diperbarui`);
        setEditingUser(null);
        fetchUsers();
      } else {
        toast.error(json.error || 'Gagal memperbarui pengguna');
      }
    } catch (err) {
      console.error(err);
      toast.error('Kesalahan koneksi');
    } finally {
      setIsUpdating(false);
    }
  };

  // Toggle user active status (Suspend/Unsuspend)
  const handleToggleSuspend = async () => {
    const user = suspendingUser;
    if (!user) return;

    const action = !user.is_active ? 'unsuspend' : 'suspend';
    const actionText = action === 'suspend' ? 'dinonaktifkan' : 'diaktifkan kembali';
    
    try {
      const response = await fetch('/api/admin/users/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_email: user.email,
          updates: {
            is_active: action === 'unsuspend',
          },
        }),
      });
      const json = await response.json();

      if (json.success) {
        toast.success(`Akun ${user.email} berhasil ${actionText}`);
        fetchUsers();
      } else {
        toast.error(json.error || 'Gagal mengubah status akun');
      }
    } catch (err) {
      console.error(err);
      toast.error('Kesalahan koneksi');
    } finally {
      setSuspendingUser(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-primary">Manajemen Pengguna</h1>
        <p className="text-xs text-muted mt-1">Cari, pantau kuota, perbarui tier langganan, dan kelola peran/status user Athena Shield.</p>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl border bg-card border-[var(--border-default)] shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="Cari berdasarkan email..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-[var(--border-default)] bg-page focus:outline-none focus:ring-1 focus:ring-rose-500/50 focus:border-rose-500/50"
            />
          </div>

          {/* Tier Filter */}
          <select
            value={filters.tier}
            onChange={(e) => setFilters({ ...filters, tier: e.target.value })}
            className="px-3 py-2 text-xs rounded-xl border border-[var(--border-default)] bg-page focus:outline-none text-secondary"
          >
            <option value="">Semua Tier</option>
            <option value="FREE">FREE</option>
            <option value="PRO">PRO</option>
            <option value="ENTERPRISE">ENTERPRISE</option>
          </select>

          {/* Role Filter */}
          <select
            value={filters.role}
            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
            className="px-3 py-2 text-xs rounded-xl border border-[var(--border-default)] bg-page focus:outline-none text-secondary"
          >
            <option value="">Semua Peran</option>
            <option value="user">USER</option>
            <option value="admin">ADMIN</option>
            <option value="superadmin">SUPERADMIN</option>
          </select>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 text-xs rounded-xl border border-[var(--border-default)] bg-page focus:outline-none text-secondary"
          >
            <option value="">Semua Status</option>
            <option value="active">AKTIF</option>
            <option value="suspended">DITANGGUHKAN</option>
          </select>
        </form>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border bg-card border-[var(--border-default)] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--border-default)] bg-muted/30 text-muted font-bold">
                <th className="p-4">Email Pengguna</th>
                <th className="p-4">Role</th>
                <th className="p-4">Tier</th>
                <th className="p-4">Saldo Kuota (Langganan / Trial)</th>
                <th className="p-4">Masa Aktif</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-default)]">
              {users.map((user) => (
                <tr key={user.email} className={`hover:bg-muted/10 transition-colors ${!user.is_active ? 'opacity-60 bg-rose-500/5' : ''}`}>
                  <td className="p-4 font-bold text-primary">{user.email}</td>
                  <td className="p-4">
                    <StatusBadge type="role" value={user.role} />
                  </td>
                  <td className="p-4">
                    <StatusBadge type="tier" value={user.tier} />
                  </td>
                  <td className="p-4 text-secondary font-medium">
                    {user.has_byok ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20 text-[10px]">
                        BYOK Mandiri (GCP)
                      </span>
                    ) : (
                      `${user.subscription_quota.toLocaleString()} / ${user.trial_quota.toLocaleString()} u`
                    )}
                  </td>
                  <td className="p-4 text-muted">
                    {user.quota_expiry ? new Date(user.quota_expiry).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Tidak Ada'}
                  </td>
                  <td className="p-4">
                    {user.is_active ? (
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                        <CheckCircle className="w-3.5 h-3.5" />
                        AKTIF
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold text-[10px]">
                        <ShieldAlert className="w-3.5 h-3.5 animate-pulse" />
                        SUSPENDED
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      {/* Button Edit */}
                      <button
                        onClick={() => openEditModal(user)}
                        disabled={user.role === 'superadmin' && currentAdminRole !== 'superadmin'}
                        className="p-1.5 rounded-lg border border-[var(--border-default)] hover:bg-rose-500/5 hover:border-rose-500/30 text-rose-500 transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                        title="Edit Profil/Kuota"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {/* Button Suspend/Unsuspend */}
                      <button
                        onClick={() => setSuspendingUser(user)}
                        disabled={user.role === 'superadmin' && currentAdminRole !== 'superadmin'}
                        className={`p-1.5 rounded-lg border border-[var(--border-default)] transition-colors cursor-pointer disabled:opacity-30 disabled:pointer-events-none ${
                          user.is_active
                            ? 'hover:bg-rose-500/10 hover:border-rose-500/40 text-rose-600'
                            : 'hover:bg-emerald-500/10 hover:border-emerald-500/40 text-emerald-600'
                        }`}
                        title={user.is_active ? 'Suspend Akun' : 'Aktifkan Akun'}
                      >
                        {user.is_active ? <ShieldAlert className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && !loading && (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-muted text-xs">
                    Pengguna tidak ditemukan.
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

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={closeEditModal} />
          
          <div className="relative w-full max-w-md bg-card rounded-2xl border border-[var(--border-default)] shadow-2xl p-6 overflow-hidden animate-fade-in text-left">
            <button onClick={closeEditModal} className="absolute top-4 right-4 text-muted hover:text-primary">
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-sm font-bold text-primary flex items-center gap-1.5">
              <Edit3 className="w-4 h-4 text-rose-500" />
              Kelola Profil & Kuota
            </h3>
            <p className="text-[10px] text-muted mt-0.5 truncate">{editingUser.email}</p>

            {editingUser.has_byok && (
              <div className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs space-y-0.5">
                <p className="font-semibold flex items-center gap-1.5">
                  Fitur BYOK (API Key Pribadi) Aktif
                </p>
                <p className="text-[11px] opacity-80 leading-relaxed">
                  Pengguna ini mengaktifkan API Key GCP milik sendiri. Pemotongan kuota server di-bypass secara otomatis.
                </p>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4 mt-4 text-xs">
              {/* Tier Selection */}
              <div className="space-y-1">
                <label className="font-semibold text-secondary">Tier Langganan</label>
                <select
                  value={editForm.tier}
                  onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl bg-page focus:outline-none text-secondary"
                >
                  <option value="FREE">FREE</option>
                  <option value="PRO">PRO</option>
                  <option value="ENTERPRISE">ENTERPRISE</option>
                </select>
              </div>

              {/* Quota inputs */}
              <div className="space-y-1">
                <label className="font-semibold text-secondary">Kuota Langganan</label>
                <input
                  type="number"
                  value={editForm.subscription_quota}
                  onChange={(e) => setEditForm({ ...editForm, subscription_quota: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl bg-page focus:outline-none text-secondary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-secondary">Kuota Trial</label>
                  <input
                    type="number"
                    value={editForm.trial_quota}
                    onChange={(e) => setEditForm({ ...editForm, trial_quota: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl bg-page focus:outline-none text-secondary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-secondary">Batas Limit Tier</label>
                  <input
                    type="number"
                    value={editForm.quota_limit}
                    onChange={(e) => setEditForm({ ...editForm, quota_limit: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl bg-page focus:outline-none text-secondary"
                  />
                </div>
              </div>

              {/* Expiry Date */}
              <div className="space-y-1">
                <label className="font-semibold text-secondary">Tanggal Kedaluwarsa Langganan</label>
                <input
                  type="date"
                  value={editForm.quota_expiry}
                  onChange={(e) => setEditForm({ ...editForm, quota_expiry: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl bg-page focus:outline-none text-secondary"
                />
              </div>

              {/* Role Selection (Superadmin only check) */}
              {currentAdminRole === 'superadmin' ? (
                <div className="space-y-1">
                  <label className="font-semibold text-rose-500 font-bold">Peran Hak Akses (Role)</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl bg-page border-rose-500/25 focus:outline-none text-secondary font-semibold"
                  >
                    <option value="user">USER (Kreator Biasa)</option>
                    <option value="admin">ADMIN (Pemantau)</option>
                    <option value="superadmin">SUPERADMIN (Akses Penuh)</option>
                  </select>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/10 text-[10px] text-amber-600 dark:text-amber-400">
                  Hanya peran Superadmin yang diizinkan untuk memodifikasi hak akses peran (role) pengguna.
                </div>
              )}

              {/* Form buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-default)]">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-3 py-2 rounded-xl border hover:bg-muted/30 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-500 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isUpdating ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Suspend Confirmation Modal */}
      <ConfirmModal
        isOpen={!!suspendingUser}
        onClose={() => setSuspendingUser(null)}
        onConfirm={() => handleToggleSuspend(suspendingUser)}
        title={suspendingUser?.is_active ? 'Penangguhan Akun (Suspend)' : 'Pengaktifan Kembali Akun'}
        description={`Apakah Anda yakin ingin ${suspendingUser?.is_active ? 'menonaktifkan (suspend)' : 'mengaktifkan kembali'} akun ${suspendingUser?.email}? ${
          suspendingUser?.is_active ? 'User ini akan segera dikeluarkan dari sistem dan tidak dapat login lagi.' : 'User ini akan dapat kembali login dan mengakses dasbor moderasi komentar.'
        }`}
        confirmText={suspendingUser?.is_active ? 'Ya, Suspend' : 'Ya, Aktifkan'}
        variant={suspendingUser?.is_active ? 'danger' : 'success'}
      />
    </div>
  );
}
