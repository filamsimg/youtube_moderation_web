'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/contexts/ToastContext';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  CreditCard, 
  PlusCircle, 
  MinusCircle, 
  ShieldCheck, 
  AlertCircle 
} from 'lucide-react';

export default function AdminPlansPage() {
  const { data: session } = useSession();
  const toast = useToast();
  
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('subscription'); // 'subscription' | 'topup'
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // Selected package for edit/delete
  const [selectedId, setSelectedId] = useState(null);
  
  // Form states
  const [formValues, setFormValues] = useState({
    id: '',
    name: '',
    type: 'subscription',
    tier: 'FREE',
    price: 0,
    original_price: '',
    quota_units: 0,
    duration_days: 0,
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
    setFormValues({
      id: '',
      name: '',
      type: activeTab,
      tier: 'FREE',
      price: 0,
      original_price: '',
      quota_units: 0,
      duration_days: activeTab === 'subscription' ? 30 : 0,
      description: '',
      features: [''],
      disabled_features: activeTab === 'subscription' ? [''] : [],
      badge: '',
      color: activeTab === 'topup' ? 'blue' : '',
      is_active: true,
      allow_bulk_moderation: false,
      allow_export_csv: false,
      allow_auto_moderation: false
    });
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
            Manajemen Pricing & Paket
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

      {/* Tabs Selector */}
      <div className="flex border-b border-[var(--border-default)]">
        {[
          { key: 'subscription', label: 'Paket Langganan (Subscriptions)' },
          { key: 'topup', label: 'Paket Top-up Kredit' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === tab.key
                ? 'border-rose-500 text-rose-600 dark:text-rose-400 font-bold'
                : 'border-transparent text-secondary hover:text-primary hover:bg-card-hover/20'
            }`}
          >
            {tab.label}
          </button>
        ))}
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
            <p>Belum ada data paket {activeTab === 'subscription' ? 'langganan' : 'top-up'} di database.</p>
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
                  {activeTab === 'subscription' && (
                    <th className="p-4 font-bold text-secondary uppercase tracking-wider text-[10px]">Durasi</th>
                  )}
                  <th className="p-4 font-bold text-secondary uppercase tracking-wider text-[10px]">Badge</th>
                  <th className="p-4 font-bold text-secondary uppercase tracking-wider text-[10px] text-center">Status</th>
                  <th className="p-4 font-bold text-secondary uppercase tracking-wider text-[10px] text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-default)]/60">
                {filteredPackages.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-card-hover/20 transition-colors">
                    <td className="p-4 font-mono font-bold text-primary">{pkg.id}</td>
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
                      {pkg.quota_units.toLocaleString('id-ID')} unit
                    </td>
                    {activeTab === 'subscription' && (
                      <td className="p-4 text-secondary font-medium">
                        {pkg.duration_days} Hari
                      </td>
                    )}
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
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          
          {/* Modal Container */}
          <div className="bg-card border border-[var(--border-default)] rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-y-auto relative z-10 shadow-2xl flex flex-col p-6 space-y-6 animate-fade-in-up">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-4 border-[var(--border-default)]/60">
              <h2 className="text-base font-bold text-primary flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-rose-500" />
                {modalMode === 'create' ? 'Tambah Paket Pricing Baru' : 'Edit Detail Paket'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-secondary hover:text-primary hover:bg-card-hover transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              
              {/* ID & Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-secondary mb-1.5">ID Paket / Unique Key *</label>
                  <input
                    type="text"
                    required
                    disabled={modalMode === 'edit'}
                    placeholder="Contoh: PRO_3M, topup-extreme"
                    className="w-full px-3.5 py-2.5 rounded-xl border bg-card-hover/30 border-[var(--border-default)] text-primary font-mono focus:outline-none focus:ring-1 focus:ring-rose-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    value={formValues.id}
                    onChange={(e) => setFormValues({ ...formValues, id: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block font-semibold text-secondary mb-1.5">Nama Paket *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Pro, Enterprise, Starter"
                    className="w-full px-3.5 py-2.5 rounded-xl border bg-card-hover/30 border-[var(--border-default)] text-primary focus:outline-none focus:ring-1 focus:ring-rose-500"
                    value={formValues.name}
                    onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
                  />
                </div>
              </div>

              {/* Type, Tier & billing_cycle */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-secondary mb-1.5">Tipe Paket *</label>
                  <select
                    className="w-full px-3.5 py-2.5 rounded-xl border bg-card/50 border-[var(--border-default)] text-primary focus:outline-none focus:ring-1 focus:ring-rose-500"
                    value={formValues.type}
                    onChange={(e) => setFormValues({ ...formValues, type: e.target.value })}
                  >
                    <option value="subscription">Subscription (Langganan)</option>
                    <option value="topup">Top-Up Kredit</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-secondary mb-1.5">Tier Target *</label>
                  <select
                    className="w-full px-3.5 py-2.5 rounded-xl border bg-card/50 border-[var(--border-default)] text-primary focus:outline-none focus:ring-1 focus:ring-rose-500"
                    value={formValues.tier}
                    onChange={(e) => setFormValues({ ...formValues, tier: e.target.value })}
                  >
                    <option value="FREE">FREE</option>
                    <option value="PRO">PRO</option>
                    <option value="ENTERPRISE">ENTERPRISE</option>
                  </select>
                </div>
                {formValues.type === 'subscription' ? (
                  <div>
                    <label className="block font-semibold text-secondary mb-1.5">Siklus Tagihan *</label>
                    <select
                      className="w-full px-3.5 py-2.5 rounded-xl border bg-card/50 border-[var(--border-default)] text-primary focus:outline-none focus:ring-1 focus:ring-rose-500"
                      value={formValues.billing_cycle || '1M'}
                      onChange={(e) => setFormValues({ ...formValues, billing_cycle: e.target.value })}
                    >
                      <option value="1M">1 Bulan (1M)</option>
                      <option value="3M">3 Bulan (3M)</option>
                      <option value="6M">6 Bulan (6M)</option>
                      <option value="12M">1 Tahun (12M)</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block font-semibold text-secondary mb-1.5">Warna Top-up *</label>
                    <select
                      className="w-full px-3.5 py-2.5 rounded-xl border bg-card/50 border-[var(--border-default)] text-primary focus:outline-none focus:ring-1 focus:ring-rose-500"
                      value={formValues.color || 'blue'}
                      onChange={(e) => setFormValues({ ...formValues, color: e.target.value })}
                    >
                      <option value="emerald">Emerald (Green)</option>
                      <option value="blue">Blue (Indigo)</option>
                      <option value="violet">Violet (Purple)</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Price, Original Price, Quota & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block font-semibold text-secondary mb-1.5">Harga Rupiah *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    className="w-full px-3.5 py-2.5 rounded-xl border bg-card-hover/30 border-[var(--border-default)] text-primary focus:outline-none focus:ring-1 focus:ring-rose-500"
                    value={formValues.price}
                    onChange={(e) => setFormValues({ ...formValues, price: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block font-semibold text-secondary mb-1.5">Harga Sebelum Diskon</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="Kosongkan jika tak diskon"
                    className="w-full px-3.5 py-2.5 rounded-xl border bg-card-hover/30 border-[var(--border-default)] text-primary focus:outline-none focus:ring-1 focus:ring-rose-500"
                    value={formValues.original_price}
                    onChange={(e) => setFormValues({ ...formValues, original_price: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block font-semibold text-secondary mb-1.5">Volume Kuota (Unit) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    className="w-full px-3.5 py-2.5 rounded-xl border bg-card-hover/30 border-[var(--border-default)] text-primary focus:outline-none focus:ring-1 focus:ring-rose-500"
                    value={formValues.quota_units}
                    onChange={(e) => setFormValues({ ...formValues, quota_units: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block font-semibold text-secondary mb-1.5">Durasi Hari *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    disabled={formValues.type === 'topup'}
                    className="w-full px-3.5 py-2.5 rounded-xl border bg-card-hover/30 border-[var(--border-default)] text-primary focus:outline-none focus:ring-1 focus:ring-rose-500 disabled:opacity-50"
                    value={formValues.type === 'topup' ? 0 : formValues.duration_days}
                    onChange={(e) => setFormValues({ ...formValues, duration_days: e.target.value })}
                  />
                </div>
              </div>

              {/* Badge & Description */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <label className="block font-semibold text-secondary mb-1.5">Badge Promo</label>
                  <input
                    type="text"
                    placeholder="Misal: Terpopuler, Hemat 20%"
                    className="w-full px-3.5 py-2.5 rounded-xl border bg-card-hover/30 border-[var(--border-default)] text-primary focus:outline-none focus:ring-1 focus:ring-rose-500"
                    value={formValues.badge}
                    onChange={(e) => setFormValues({ ...formValues, badge: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-secondary mb-1.5">Deskripsi Paket</label>
                  <input
                    type="text"
                    placeholder="Keterangan singkat paket pricing"
                    className="w-full px-3.5 py-2.5 rounded-xl border bg-card-hover/30 border-[var(--border-default)] text-primary focus:outline-none focus:ring-1 focus:ring-rose-500"
                    value={formValues.description}
                    onChange={(e) => setFormValues({ ...formValues, description: e.target.value })}
                  />
                </div>
              </div>

              {/* Active Toggle Switch */}
              <div className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  id="is_active"
                  className="w-4 h-4 rounded text-rose-500 focus:ring-rose-500 cursor-pointer"
                  checked={formValues.is_active}
                  onChange={(e) => setFormValues({ ...formValues, is_active: e.target.checked })}
                />
                <label htmlFor="is_active" className="font-semibold text-primary cursor-pointer select-none">
                  Paket Pricing Aktif (Ditampilkan ke pengguna di halaman pricing)
                </label>
              </div>

              {/* Hak Akses Fitur Teknis (Aplikasi) */}
              <div className="border-t pt-4 border-[var(--border-default)]/60 space-y-3">
                <div>
                  <p className="font-bold text-primary">Konfigurasi Akses Fitur Teknis (Aplikasi)</p>
                  <p className="text-[10px] text-muted">Aktifkan atau matikan modul fitur aplikasi secara langsung (Best-Practice Gating).</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-1">
                  <label className="flex items-center gap-2.5 p-3 rounded-2xl border border-[var(--border-default)] hover:bg-card-hover/20 cursor-pointer transition-all">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded text-rose-500 focus:ring-rose-500 cursor-pointer"
                      checked={formValues.allow_bulk_moderation}
                      onChange={(e) => setFormValues({ ...formValues, allow_bulk_moderation: e.target.checked })}
                    />
                    <div className="leading-tight">
                      <p className="font-semibold text-primary">Bulk Moderasi</p>
                      <p className="text-[9px] text-muted">Moderasi massal</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-2xl border border-[var(--border-default)] hover:bg-card-hover/20 cursor-pointer transition-all">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded text-rose-500 focus:ring-rose-500 cursor-pointer"
                      checked={formValues.allow_export_csv}
                      onChange={(e) => setFormValues({ ...formValues, allow_export_csv: e.target.checked })}
                    />
                    <div className="leading-tight">
                      <p className="font-semibold text-primary">Ekspor CSV</p>
                      <p className="text-[9px] text-muted">Unduh laporan</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-2xl border border-[var(--border-default)] hover:bg-card-hover/20 cursor-pointer transition-all">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded text-rose-500 focus:ring-rose-500 cursor-pointer"
                      checked={formValues.allow_auto_moderation}
                      onChange={(e) => setFormValues({ ...formValues, allow_auto_moderation: e.target.checked })}
                    />
                    <div className="leading-tight">
                      <p className="font-semibold text-primary">Auto Moderasi</p>
                      <p className="text-[9px] text-muted">Siklus otomatisasi</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Feature checkmarks list */}
              <div className="border-t pt-4 border-[var(--border-default)]/60 space-y-4">
                <div>
                  <p className="font-bold text-primary">Daftar Fitur (Checkmark Hijau)</p>
                  <p className="text-[10px] text-muted">Daftar baris poin yang aktif/unlocked pada paket pricing ini.</p>
                </div>
                
                <div className="space-y-2">
                  {formValues.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Misal: Pemeriksaan otomatis tiap 2 menit"
                        className="flex-1 px-3.5 py-2 rounded-xl border bg-card-hover/30 border-[var(--border-default)] text-primary focus:outline-none"
                        value={feature}
                        onChange={(e) => handleArrayChange(idx, e.target.value, 'features')}
                      />
                      <button
                        type="button"
                        onClick={() => removeArrayField(idx, 'features')}
                        className="text-rose-500 hover:text-rose-700 cursor-pointer transition-colors p-1"
                      >
                        <MinusCircle className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    onClick={() => addArrayField('features')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-rose-600 dark:text-rose-400 font-bold transition-all hover:bg-slate-500/5 cursor-pointer mt-1"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Tambah Baris Fitur
                  </button>
                </div>
              </div>

              {/* Disabled features list (Crossmark grey) - Only relevant for subscription */}
              {formValues.type === 'subscription' && (
                <div className="border-t pt-4 border-[var(--border-default)]/60 space-y-4">
                  <div>
                    <p className="font-bold text-primary">Fitur Tidak Tersedia (Silang Abu-abu)</p>
                    <p className="text-[10px] text-muted">Fitur yang dicoret pada paket ini (misal di paket Free).</p>
                  </div>
                  
                  <div className="space-y-2">
                    {formValues.disabled_features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Misal: Penyaringan Otomatis"
                          className="flex-1 px-3.5 py-2 rounded-xl border bg-card-hover/30 border-[var(--border-default)] text-primary focus:outline-none"
                          value={feature}
                          onChange={(e) => handleArrayChange(idx, e.target.value, 'disabled_features')}
                        />
                        <button
                          type="button"
                          onClick={() => removeArrayField(idx, 'disabled_features')}
                          className="text-rose-500 hover:text-rose-700 cursor-pointer transition-colors p-1"
                        >
                          <MinusCircle className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                    
                    <button
                      type="button"
                      onClick={() => addArrayField('disabled_features')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-rose-600 dark:text-rose-400 font-bold transition-all hover:bg-slate-500/5 cursor-pointer mt-1"
                    >
                      <PlusCircle className="w-4 h-4" />
                      Tambah Baris Coretan
                    </button>
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="border-t pt-4 border-[var(--border-default)]/60 flex items-center justify-end gap-3.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[var(--border-default)] hover:bg-card-hover text-secondary font-bold cursor-pointer transition-all active:scale-95"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!isSuperAdmin}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-md cursor-pointer transition-all active:scale-95"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
              Apakah Anda yakin ingin menghapus paket dengan ID <strong className="font-mono text-rose-500">{selectedId}</strong> secara permanen dari database?
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
