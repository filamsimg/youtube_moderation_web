'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/contexts/ToastContext';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  CreditCard, 
  AlertCircle 
} from 'lucide-react';
import PlanFormModal from './PlanFormModal';
import { formatIDR, isUnlimitedQuota } from '@/lib/utils';

export default function AdminPlansPage() {
  const { data: session } = useSession();
  const toast = useToast();
  
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const activeTab = 'subscription';
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // Selected package for edit/delete
  const [selectedId, setSelectedId] = useState(null);
  
  // Form values (passed to modal as initial values)
  const [formValues, setFormValues] = useState({
    id: '',
    name: '',
    type: 'subscription',
    tier: 'FREE',
    billing_cycle: '1M',
    price: 0,
    original_price: '',
    quota_units: 0,
    duration_days: 30,
    description: '',
    features: [''],
    disabled_features: [''],
    badge: '',
    color: 'blue',
    is_active: true,
    allow_bulk_moderation: false,
    allow_export_csv: false,
    allow_auto_moderation: false
  });

  const defaultFormValues = {
    id: '',
    name: '',
    type: 'subscription',
    tier: 'FREE',
    billing_cycle: '1M',
    price: 0,
    original_price: '',
    quota_units: 0,
    duration_days: 30,
    description: '',
    features: [''],
    disabled_features: [''],
    badge: '',
    color: 'blue',
    is_active: true,
    allow_bulk_moderation: false,
    allow_export_csv: false,
    allow_auto_moderation: false
  };

  const currentAdminRole = session?.user?.role || 'user';
  const isSuperAdmin = currentAdminRole === 'superadmin';

  const fetchPackages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/plans');
      const data = await res.json();
      if (data.success) {
        setPackages(data.packages);
      } else {
        toast.error(data.error || 'Gagal mengambil data paket');
      }
    } catch (e) {
      console.error(e);
      toast.error('Koneksi internet bermasalah');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  // Handle opening creation modal
  const handleOpenCreate = () => {
    setModalMode('create');
    setFormValues(defaultFormValues);
    setIsModalOpen(true);
  };

  // Handle opening edit modal
  const handleOpenEdit = (pkg) => {
    setModalMode('edit');
    setSelectedId(pkg.id);
    setFormValues({
      id: pkg.id,
      name: pkg.name,
      type: pkg.type,
      tier: pkg.tier,
      price: pkg.price,
      original_price: pkg.original_price !== null ? pkg.original_price : '',
      quota_units: pkg.quota_units,
      duration_days: pkg.duration_days,
      billing_cycle: pkg.billing_cycle || '1M',
      description: pkg.description || '',
      features: pkg.features && pkg.features.length > 0 ? [...pkg.features] : [''],
      disabled_features: pkg.disabled_features && pkg.disabled_features.length > 0 ? [...pkg.disabled_features] : [],
      badge: pkg.badge || '',
      color: pkg.color || 'blue',
      is_active: pkg.is_active,
      allow_bulk_moderation: pkg.allow_bulk_moderation ?? false,
      allow_export_csv: pkg.allow_export_csv ?? false,
      allow_auto_moderation: pkg.allow_auto_moderation ?? false
    });
    setIsModalOpen(true);
  };

  // Handle opening delete modal
  const handleOpenDelete = (pkg) => {
    setSelectedId(pkg.id);
    setIsDeleteModalOpen(true);
  };

  // Dynamic Array Fields logic
  const handleArrayChange = (index, value, field) => {
    const newArr = [...formValues[field]];
    newArr[index] = value;
    setFormValues({ ...formValues, [field]: newArr });
  };

  const addArrayField = (field) => {
    setFormValues({ ...formValues, [field]: [...formValues[field], ''] });
  };

  const removeArrayField = (index, field) => {
    const newArr = [...formValues[field]];
    newArr.splice(index, 1);
    setFormValues({ ...formValues, [field]: newArr.length > 0 ? newArr : [''] });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      toast.error('Hanya tingkat Superadmin yang memiliki izin memodifikasi paket pricing.');
      return;
    }

    // Filter out empty lines from array features
    const cleanFeatures = formValues.features.filter(f => f.trim() !== '');
    const cleanDisabled = formValues.disabled_features.filter(f => f.trim() !== '');

    const payload = {
      ...formValues,
      price: Number(formValues.price),
      original_price: formValues.original_price !== '' ? Number(formValues.original_price) : null,
      quota_units: Number(formValues.quota_units),
      duration_days: Number(formValues.duration_days),
      features: cleanFeatures,
      disabled_features: cleanDisabled
    };

    try {
      const url = modalMode === 'create' ? '/api/admin/plans' : `/api/admin/plans/${selectedId}`;
      const method = modalMode === 'create' ? 'POST' : 'PATCH';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        toast.success(modalMode === 'create' ? 'Paket pricing berhasil dibuat' : 'Detail paket berhasil diperbarui');
        setIsModalOpen(false);
        fetchPackages();
      } else {
        toast.error(data.error || 'Gagal menyimpan perubahan');
      }
    } catch (error) {
      console.error(error);
      toast.error('Gagal memproses request');
    }
  };

  // Handle delete action
  const handleDelete = async () => {
    if (!isSuperAdmin) {
      toast.error('Hanya tingkat Superadmin yang memiliki izin menghapus paket pricing.');
      return;
    }

    try {
      const response = await fetch(`/api/admin/plans/${selectedId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Paket pricing berhasil dihapus permanen');
        setIsDeleteModalOpen(false);
        fetchPackages();
      } else {
        toast.error(data.error || 'Gagal menghapus paket');
      }
    } catch (error) {
      console.error(error);
      toast.error('Gagal memproses request penghapusan');
    }
  };

  // Filter packages based on activeTab
  const filteredPackages = packages.filter(pkg => pkg.type === activeTab);

  const formatIDR = (num) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-primary flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-rose-500" />
            Manajemen Paket dan Harga
          </h1>
          <p className="text-xs text-muted mt-1">
            Konfigurasi tier akun, harga berlangganan, paket top-up, jatah kuota unit API, dan fitur ter-unlock.
          </p>
        </div>

        {isSuperAdmin ? (
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-rose-600 to-orange-600 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer hover:-translate-y-0.5 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Tambah Paket Baru
          </button>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-muted text-[11px] font-medium border border-dashed border-slate-200 dark:border-slate-700">
            <AlertCircle className="w-4 h-4 text-slate-400" />
            Admin Read-Only Mode
          </div>
        )}
      </div>


      {/* Main Table Content */}
      <div className="bg-card border border-[var(--border-default)] rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="w-10 h-10 border-4 border-rose-500/30 border-t-rose-600 rounded-full animate-spin" />
            <p className="text-xs text-muted">Mengambil database paket pricing...</p>
          </div>
        ) : filteredPackages.length === 0 ? (
          <div className="text-center py-16 text-muted text-xs space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
            <p>Belum ada data paket langganan di database.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b bg-slate-500/5" style={{ borderColor: 'var(--border-default)' }}>
                  <th className="p-4 font-bold text-secondary uppercase tracking-wider text-[10px]">ID Paket / Key</th>
                  <th className="p-4 font-bold text-secondary uppercase tracking-wider text-[10px]">Nama</th>
                  <th className="p-4 font-bold text-secondary uppercase tracking-wider text-[10px]">Tier</th>
                  <th className="p-4 font-bold text-secondary uppercase tracking-wider text-[10px]">Harga</th>
                  <th className="p-4 font-bold text-secondary uppercase tracking-wider text-[10px]">Jatah Kuota</th>
                  <th className="p-4 font-bold text-secondary uppercase tracking-wider text-[10px]">Durasi</th>
                  <th className="p-4 font-bold text-secondary uppercase tracking-wider text-[10px]">Badge</th>
                  <th className="p-4 font-bold text-secondary uppercase tracking-wider text-[10px] text-center">Status</th>
                  <th className="p-4 font-bold text-secondary uppercase tracking-wider text-[10px] text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-default)]/60">
                {filteredPackages.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-card-hover/20 transition-colors">
                    <td className="p-4 font-semibold text-primary">{pkg.id}</td>
                    <td className="p-4 font-semibold text-primary">{pkg.name}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[9px] ${
                        pkg.tier === 'FREE' ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' :
                        pkg.tier === 'PRO' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300 border border-indigo-500/10' :
                        'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-300 border border-purple-500/10'
                      }`}>
                        {pkg.tier}
                      </span>
                    </td>
                    <td className="p-4 text-primary font-bold">
                      {pkg.price === 0 ? 'Gratis' : formatIDR(pkg.price)}
                      {pkg.original_price && (
                        <div className="text-[10px] text-dimmed line-through font-normal">
                           {formatIDR(pkg.original_price)}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-secondary font-medium">
                      {pkg.tier === 'ENTERPRISE' ? (
                        <div className="flex flex-col">
                          <span className="text-primary font-bold">
                            {pkg.quota_units.toLocaleString('id-ID')} unit
                          </span>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                            + BYOK Opsional
                          </span>
                        </div>
                      ) : (
                        `${pkg.quota_units.toLocaleString('id-ID')} unit`
                      )}
                    </td>
                    <td className="p-4 text-secondary font-medium">
                      {pkg.duration_days} Hari
                    </td>
                    <td className="p-4 text-secondary font-medium">
                      {pkg.badge ? (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-semibold border border-slate-200 dark:border-slate-700 text-[10px]">
                          {pkg.badge}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        pkg.is_active
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                      }`}>
                        {pkg.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() => handleOpenEdit(pkg)}
                          className="p-1.5 rounded-lg border border-[var(--border-default)] hover:bg-slate-100 dark:hover:bg-slate-800 text-secondary hover:text-primary transition-all cursor-pointer"
                          title="Edit Paket"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {isSuperAdmin && (
                          <button
                            onClick={() => handleOpenDelete(pkg)}
                            className="p-1.5 rounded-lg border border-rose-500/20 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 transition-all cursor-pointer"
                            title="Hapus Paket"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* === MODAL TAMBAH/EDIT PAKET === */}
      <PlanFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={modalMode}
        selectedId={selectedId}
        initialValues={formValues}
        isSuperAdmin={isSuperAdmin}
        onSuccess={fetchPackages}
      />

      {/* === MODAL CONFIRM DELETE === */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)} />
          <div className="bg-card border border-[var(--border-default)] rounded-3xl w-full max-w-sm p-6 relative z-10 shadow-2xl space-y-5 animate-fade-in-up text-xs">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-primary text-sm">Hapus Paket Permanen?</h3>
                <p className="text-secondary mt-0.5 text-[10px]">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>

            <p className="text-secondary leading-relaxed">
              Apakah Anda yakin ingin menghapus paket dengan ID <strong className="font-semibold text-rose-500">{selectedId}</strong> secara permanen dari database?
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-[var(--border-default)] hover:bg-card-hover text-secondary font-bold cursor-pointer transition-all active:scale-95"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-md cursor-pointer transition-all active:scale-95"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
