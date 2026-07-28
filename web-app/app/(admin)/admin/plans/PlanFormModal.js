'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { 
  X, 
  Check, 
  PlusCircle, 
  MinusCircle, 
  ShieldCheck, 
  AlertCircle,
  FileText,
  Coins,
  Sliders,
  Layers,
  Download,
  Clock
} from 'lucide-react';

export default function PlanFormModal({
  isOpen,
  onClose,
  mode,
  selectedId,
  initialValues,
  isSuperAdmin,
  onSuccess
}) {
  const toast = useToast();

  // Form states
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

  const [activeFormTab, setActiveFormTab] = useState('basic'); // 'basic' | 'pricing' | 'features'
  const [isIdManuallyEdited, setIsIdManuallyEdited] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state when modal opens or initial values change
  useEffect(() => {
    if (isOpen && initialValues) {
      setFormValues({
        id: initialValues.id || '',
        name: initialValues.name || '',
        type: initialValues.type || 'subscription',
        tier: initialValues.tier || 'FREE',
        billing_cycle: initialValues.billing_cycle || '1M',
        price: initialValues.price !== undefined ? initialValues.price : 0,
        original_price: initialValues.original_price !== null && initialValues.original_price !== undefined ? initialValues.original_price : '',
        quota_units: initialValues.quota_units !== undefined ? initialValues.quota_units : 0,
        duration_days: initialValues.duration_days !== undefined ? initialValues.duration_days : 30,
        description: initialValues.description || '',
        features: initialValues.features && initialValues.features.length > 0 ? [...initialValues.features] : [''],
        disabled_features: initialValues.disabled_features && initialValues.disabled_features.length > 0 ? [...initialValues.disabled_features] : [],
        badge: initialValues.badge || '',
        color: initialValues.color || 'blue',
        is_active: initialValues.is_active !== undefined ? initialValues.is_active : true,
        allow_bulk_moderation: initialValues.allow_bulk_moderation ?? false,
        allow_export_csv: initialValues.allow_export_csv ?? false,
        allow_auto_moderation: initialValues.allow_auto_moderation ?? false
      });
      setActiveFormTab('basic');
      setIsIdManuallyEdited(mode === 'edit');
    }
  }, [isOpen, initialValues, mode]);

  if (!isOpen) return null;

  // Slugify helper
  const slugifyName = (name) => {
    return name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '');
  };

  // Handle Name Input Change (with Auto-Slugify ID)
  const handleNameChange = (nameVal) => {
    const updatedValues = { ...formValues, name: nameVal };
    if (mode === 'create' && !isIdManuallyEdited) {
      const slug = slugifyName(nameVal);
      const cycle = formValues.billing_cycle || '1M';
      updatedValues.id = slug ? `${slug}_${cycle}` : '';
    }
    setFormValues(updatedValues);
  };

  // Handle Billing Cycle Change (adjusts duration and updates auto ID)
  const handleBillingCycleChange = (cycle) => {
    let days = 30;
    if (cycle === '3M') days = 90;
    else if (cycle === '6M') days = 180;
    else if (cycle === '12M') days = 360;

    const updatedValues = { 
      ...formValues, 
      billing_cycle: cycle, 
      duration_days: days 
    };

    if (mode === 'create' && !isIdManuallyEdited && formValues.name) {
      const slug = slugifyName(formValues.name);
      updatedValues.id = slug ? `${slug}_${cycle}` : '';
    }
    setFormValues(updatedValues);
  };

  // Handle ID Input Change
  const handleIdChange = (idVal) => {
    if (mode === 'create') {
      setIsIdManuallyEdited(true);
    }
    setFormValues({ ...formValues, id: idVal });
  };

  // Calculate Discount percentage dynamically
  const calculateDiscount = () => {
    const price = Number(formValues.price);
    const originalPrice = Number(formValues.original_price);
    if (originalPrice && originalPrice > price) {
      const pct = Math.round(((originalPrice - price) / originalPrice) * 100);
      return pct > 0 ? pct : null;
    }
    return null;
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

    setIsSubmitting(true);

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
      const url = mode === 'create' ? '/api/admin/plans' : `/api/admin/plans/${selectedId}`;
      const method = mode === 'create' ? 'POST' : 'PATCH';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        toast.success(mode === 'create' ? 'Paket pricing berhasil dibuat' : 'Detail paket berhasil diperbarui');
        onSuccess();
        onClose();
      } else {
        toast.error(data.error || 'Gagal menyimpan perubahan');
      }
    } catch (error) {
      console.error(error);
      toast.error('Gagal memproses request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal Container */}
      <div className="bg-card border border-[var(--border-default)] rounded-3xl w-full max-w-3xl max-h-[85vh] overflow-y-auto relative z-10 shadow-2xl flex flex-col p-6 space-y-6 animate-fade-in-up">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b pb-4 border-[var(--border-default)]/60">
          <h2 className="text-base font-bold text-primary flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-rose-500" />
            {mode === 'create' ? 'Tambah Paket Pricing Baru' : 'Edit Detail Paket'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-secondary hover:text-primary hover:bg-card-hover transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          
          {/* Tab Navigation */}
          <div className="flex border-b border-[var(--border-default)]/60 text-xs gap-1 pb-1">
            <button
              type="button"
              onClick={() => setActiveFormTab('basic')}
              className={`flex-1 py-2.5 text-center font-bold border-b-2 transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeFormTab === 'basic'
                  ? 'border-rose-500 text-rose-500'
                  : 'border-transparent text-secondary hover:text-primary hover:bg-card-hover/10'
              }`}
            >
              <FileText className={`w-4 h-4 ${activeFormTab === 'basic' ? 'text-rose-500' : 'text-slate-400'}`} />
              Info Dasar
            </button>
            <button
              type="button"
              onClick={() => setActiveFormTab('pricing')}
              className={`flex-1 py-2.5 text-center font-bold border-b-2 transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeFormTab === 'pricing'
                  ? 'border-rose-500 text-rose-500'
                  : 'border-transparent text-secondary hover:text-primary hover:bg-card-hover/10'
              }`}
            >
              <Coins className={`w-4 h-4 ${activeFormTab === 'pricing' ? 'text-rose-500' : 'text-slate-400'}`} />
              Harga & Kuota
            </button>
            <button
              type="button"
              onClick={() => setActiveFormTab('features')}
              className={`flex-1 py-2.5 text-center font-bold border-b-2 transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeFormTab === 'features'
                  ? 'border-rose-500 text-rose-500'
                  : 'border-transparent text-secondary hover:text-primary hover:bg-card-hover/10'
              }`}
            >
              <Sliders className={`w-4 h-4 ${activeFormTab === 'features' ? 'text-rose-500' : 'text-slate-400'}`} />
              Fitur & Akses
            </button>
          </div>

          {/* Tab 1: Informasi Dasar */}
          {activeFormTab === 'basic' && (
            <div className="space-y-4 animate-fade-in">
              {/* ID & Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-secondary mb-1.5 flex items-center gap-1.5 justify-between">
                    <span>ID Paket / Unique Key *</span>
                    {mode === 'create' && !isIdManuallyEdited && (
                      <span className="text-[8px] tracking-wider text-rose-500 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20 animate-pulse">Auto-slug</span>
                    )}
                  </label>
                  <input
                    type="text"
                    required
                    disabled={mode === 'edit'}
                    placeholder="Contoh: PRO_3M, FREE_1M"
                    className="input-dark font-semibold disabled:opacity-60 disabled:cursor-not-allowed focus:border-rose-500"
                    value={formValues.id}
                    onChange={(e) => handleIdChange(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block font-semibold text-secondary mb-1.5">Nama Paket *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Pro, Enterprise, Starter"
                    className="input-dark focus:border-rose-500"
                    value={formValues.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                  />
                </div>
              </div>

              {/* Tier & billing_cycle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-secondary mb-1.5">Tier Target *</label>
                  <select
                    className="input-dark focus:border-rose-500"
                    value={formValues.tier}
                    onChange={(e) => setFormValues({ ...formValues, tier: e.target.value })}
                  >
                    <option value="FREE">FREE</option>
                    <option value="PRO">PRO</option>
                    <option value="ENTERPRISE">ENTERPRISE</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-secondary mb-1.5">Siklus Tagihan *</label>
                  <select
                    className="input-dark focus:border-rose-500"
                    value={formValues.billing_cycle || '1M'}
                    onChange={(e) => handleBillingCycleChange(e.target.value)}
                  >
                    <option value="1M">1 Bulan (1M)</option>
                    <option value="3M">3 Bulan (3M)</option>
                    <option value="6M">6 Bulan (6M)</option>
                    <option value="12M">1 Tahun (12M)</option>
                  </select>
                </div>
              </div>

              {/* Badge & Description */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <label className="block font-semibold text-secondary mb-1.5">Badge Promo</label>
                  <input
                    type="text"
                    placeholder="Misal: Terpopuler, Hemat 20%"
                    className="input-dark focus:border-rose-500"
                    value={formValues.badge}
                    onChange={(e) => setFormValues({ ...formValues, badge: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-secondary mb-1.5">Deskripsi Paket</label>
                  <input
                    type="text"
                    placeholder="Keterangan singkat paket pricing"
                    className="input-dark focus:border-rose-500"
                    value={formValues.description}
                    onChange={(e) => setFormValues({ ...formValues, description: e.target.value })}
                  />
                </div>
              </div>

              {/* Active Switcher */}
              <div className="flex items-center justify-between p-4 rounded-2xl border border-[var(--border-default)]/60 bg-slate-500/5 mt-2">
                <div className="space-y-0.5">
                  <span className="font-bold text-primary block">Paket Pricing Aktif</span>
                  <span className="text-[10px] text-muted block font-medium">Paket akan langsung ditampilkan kepada pengguna di halaman pricing jika diaktifkan.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormValues({ ...formValues, is_active: !formValues.is_active })}
                  className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    formValues.is_active ? 'bg-emerald-500 shadow-md shadow-emerald-500/20' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      formValues.is_active ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: Harga & Kuota */}
          {activeFormTab === 'pricing' && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Harga Rupiah */}
                <div>
                  <label className="block font-semibold text-secondary mb-1.5">Harga Rupiah *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-muted pointer-events-none">Rp</span>
                    <input
                      type="number"
                      required
                      min={0}
                      className="input-dark !pl-9 focus:border-rose-500 w-full"
                      value={formValues.price}
                      onChange={(e) => setFormValues({ ...formValues, price: e.target.value })}
                    />
                  </div>
                </div>

                {/* Harga Sebelum Diskon */}
                <div>
                  <label className="block font-semibold text-secondary mb-1.5 flex items-center justify-between">
                    <span>Harga Sebelum Diskon</span>
                    {calculateDiscount() && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold border border-emerald-500/20 animate-fade-in">
                        Hemat {calculateDiscount()}%!
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-muted pointer-events-none">Rp</span>
                    <input
                      type="number"
                      min={0}
                      placeholder="Kosongkan jika tak diskon"
                      className="input-dark !pl-9 focus:border-rose-500 w-full"
                      value={formValues.original_price}
                      onChange={(e) => setFormValues({ ...formValues, original_price: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Volume Kuota */}
                <div>
                  <label className="block font-semibold text-secondary mb-1.5">Volume Kuota *</label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={0}
                      className="input-dark !pr-20 focus:border-rose-500 w-full"
                      value={formValues.quota_units}
                      onChange={(e) => setFormValues({ ...formValues, quota_units: e.target.value })}
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted pointer-events-none bg-slate-500/5 dark:bg-slate-500/10 px-2 py-0.5 rounded border border-[var(--border-default)]/40">
                      Unit API
                    </span>
                  </div>
                </div>

                {/* Durasi Hari */}
                <div>
                  <label className="block font-semibold text-secondary mb-1.5">Durasi Hari *</label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={0}
                      className="input-dark !pr-14 focus:border-rose-500 w-full"
                      value={formValues.duration_days}
                      onChange={(e) => setFormValues({ ...formValues, duration_days: e.target.value })}
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted pointer-events-none bg-slate-500/5 dark:bg-slate-500/10 px-2 py-0.5 rounded border border-[var(--border-default)]/40">
                      Hari
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="p-3 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 text-[10px] text-muted flex gap-2.5 items-start leading-relaxed">
                <AlertCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <strong>Informasi Teknis:</strong> Jatah volume kuota merupakan jumlah poin kuota API YouTube yang langsung didapatkan pengguna setelah berlangganan. Masa kedaluwarsa kuota akan disinkronisasikan otomatis dengan Durasi Hari.
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Fitur & Akses */}
          {activeFormTab === 'features' && (
            <div className="space-y-4 animate-fade-in">
              {/* Akses Fitur Teknis */}
              <div className="space-y-2.5">
                <label className="block font-bold text-primary">Akses Modul Fitur Aplikasi</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormValues({ ...formValues, allow_bulk_moderation: !formValues.allow_bulk_moderation })}
                    className={`flex items-center gap-3.5 p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                      formValues.allow_bulk_moderation
                        ? 'border-rose-500/40 bg-rose-500/5 shadow-md shadow-rose-500/5'
                        : 'border-[var(--border-default)] hover:bg-card-hover/20 bg-slate-500/5'
                    }`}
                  >
                    <div className={`p-2 rounded-xl transition-colors ${
                      formValues.allow_bulk_moderation ? 'bg-rose-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-muted'
                    }`}>
                      <Layers className="w-4 h-4" />
                    </div>
                    <div className="leading-tight">
                      <p className="font-bold text-primary text-[11px]">Bulk Moderasi</p>
                      <p className="text-[9px] text-muted font-medium">Moderasi massal</p>
                    </div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setFormValues({ ...formValues, allow_export_csv: !formValues.allow_export_csv })}
                    className={`flex items-center gap-3.5 p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                      formValues.allow_export_csv
                        ? 'border-rose-500/40 bg-rose-500/5 shadow-md shadow-rose-500/5'
                        : 'border-[var(--border-default)] hover:bg-card-hover/20 bg-slate-500/5'
                    }`}
                  >
                    <div className={`p-2 rounded-xl transition-colors ${
                      formValues.allow_export_csv ? 'bg-rose-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-muted'
                    }`}>
                      <Download className="w-4 h-4" />
                    </div>
                    <div className="leading-tight">
                      <p className="font-bold text-primary text-[11px]">Ekspor CSV</p>
                      <p className="text-[9px] text-muted font-medium">Unduh laporan</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormValues({ ...formValues, allow_auto_moderation: !formValues.allow_auto_moderation })}
                    className={`flex items-center gap-3.5 p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                      formValues.allow_auto_moderation
                        ? 'border-rose-500/40 bg-rose-500/5 shadow-md shadow-rose-500/5'
                        : 'border-[var(--border-default)] hover:bg-card-hover/20 bg-slate-500/5'
                    }`}
                  >
                    <div className={`p-2 rounded-xl transition-colors ${
                      formValues.allow_auto_moderation ? 'bg-rose-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-muted'
                    }`}>
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="leading-tight">
                      <p className="font-bold text-primary text-[11px]">Auto Moderasi</p>
                      <p className="text-[9px] text-muted font-medium">Siklus otomatis</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Feature checkmarks list */}
              <div className="border-t pt-4 border-[var(--border-default)]/60 space-y-3">
                <div>
                  <p className="font-bold text-primary">Daftar Fitur (Checkmark Hijau)</p>
                  <p className="text-[10px] text-muted">Poin fitur aktif yang di-render dengan ikon checklist hijau pada halaman pricing.</p>
                </div>
                
                <div className="space-y-2.5">
                  {formValues.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 animate-fade-in-up">
                      <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                      <input
                        type="text"
                        placeholder="Contoh: Pemeriksaan otomatis tiap 2 menit"
                        className="flex-1 input-dark focus:border-rose-500"
                        value={feature}
                        onChange={(e) => handleArrayChange(idx, e.target.value, 'features')}
                      />
                      <button
                        type="button"
                        onClick={() => removeArrayField(idx, 'features')}
                        className="text-rose-500 hover:text-rose-700 cursor-pointer hover:bg-rose-500/10 p-1.5 rounded-lg transition-colors"
                      >
                        <MinusCircle className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    onClick={() => addArrayField('features')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-rose-500/20 text-rose-500 font-bold transition-all hover:bg-rose-500/5 cursor-pointer mt-1 text-[10px]"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Tambah Baris Fitur
                  </button>
                </div>
              </div>

              {/* Disabled features list */}
              <div className="border-t pt-4 border-[var(--border-default)]/60 space-y-3">
                <div>
                  <p className="font-bold text-primary">Fitur Tidak Tersedia (Silang Abu-abu)</p>
                  <p className="text-[10px] text-muted">Fitur yang tidak aktif/tidak di-unlock pada paket ini (di-render abu-abu dan dicoret).</p>
                </div>
                
                <div className="space-y-2.5">
                  {formValues.disabled_features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 animate-fade-in-up">
                      <span className="p-1.5 rounded-lg bg-slate-500/5 text-slate-400 border border-slate-500/10">
                        <X className="w-3.5 h-3.5" />
                      </span>
                      <input
                        type="text"
                        placeholder="Contoh: Ekspor laporan data (CSV)"
                        className="flex-1 input-dark focus:border-rose-500"
                        value={feature}
                        onChange={(e) => handleArrayChange(idx, e.target.value, 'disabled_features')}
                      />
                      <button
                        type="button"
                        onClick={() => removeArrayField(idx, 'disabled_features')}
                        className="text-rose-500 hover:text-rose-700 cursor-pointer hover:bg-rose-500/10 p-1.5 rounded-lg transition-colors"
                      >
                        <MinusCircle className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    onClick={() => addArrayField('disabled_features')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-rose-500/20 text-rose-500 font-bold transition-all hover:bg-rose-500/5 cursor-pointer mt-1 text-[10px]"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Tambah Baris Coretan
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="border-t pt-4 border-[var(--border-default)]/60 flex items-center justify-between gap-3.5 mt-2">
            <div className="text-[10px] text-muted font-medium">
              * Menandakan kolom wajib diisi.
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-[var(--border-default)] hover:bg-card-hover text-secondary font-bold cursor-pointer transition-all active:scale-95 text-[11px]"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !isSuperAdmin}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-md cursor-pointer transition-all active:scale-95 text-[11px]"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
