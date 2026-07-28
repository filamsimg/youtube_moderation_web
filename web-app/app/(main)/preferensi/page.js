'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { signOut } from 'next-auth/react';
import { useTheme } from '@/components/ThemeProvider';
import { useSettings } from '@/contexts/SettingsContext';
import { useToast } from '@/contexts/ToastContext';
import { useQuota } from '@/contexts/QuotaContext';
import ConfirmModal from '@/components/ui/ConfirmModal';
import ByokGuideModal from '@/components/ByokGuideModal';
import Link from 'next/link';

export default function PreferensiPage() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const { settings, updateSettings, loading } = useSettings();
  const { isFeatureDisabled } = useQuota();
  const toast = useToast();
  const [showRenewConfirm, setShowRenewConfirm] = useState(false);

  // State BYOK (Bring Your Own Key)
  const [byokStatus, setByokStatus] = useState({ isEnterprise: false, hasKey: false, maskedKey: null });
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [byokLoading, setByokLoading] = useState(true);
  const [byokSaving, setByokSaving] = useState(false);
  const [showByokGuide, setShowByokGuide] = useState(false);

  const [notifKomentar, setNotifKomentar] = useState(true);
  const [autoTahan, setAutoTahan] = useState(true);
  const [autoHapus, setAutoHapus] = useState(false);
  const [thresholdHold, setThresholdHold] = useState(70);
  const [thresholdReject, setThresholdReject] = useState(90);
  const [pollingInterval, setPollingInterval] = useState(120);
  const [batchModeration, setBatchModeration] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const fetchByokStatus = async () => {
    try {
      setByokLoading(true);
      const res = await fetch('/api/user/byok');
      const data = await res.json();
      if (data.success) {
        setByokStatus({
          isEnterprise: data.isEnterprise ?? false,
          hasKey: data.hasKey ?? false,
          maskedKey: data.maskedKey ?? null,
        });
      }
    } catch (err) {
      console.error('Error fetching BYOK status:', err);
    } finally {
      setByokLoading(false);
    }
  };

  useEffect(() => {
    fetchByokStatus();
  }, []);

  // Sync local state with context when settings are loaded
  useEffect(() => {
    if (!loading && settings) {
      const isNotifSupported = typeof window !== 'undefined' && 'Notification' in window;
      const isNotifBlocked = isNotifSupported && Notification.permission === 'denied';
      setNotifKomentar(isNotifBlocked ? false : (settings.notifKomentar ?? true));
      setAutoTahan(settings.autoTahan ?? true);
      setAutoHapus(settings.autoHapus ?? false);
      setThresholdHold(settings.thresholdHold ?? 70);
      setThresholdReject(settings.thresholdReject ?? 90);
      setPollingInterval(settings.pollingInterval ?? 120);
      setBatchModeration(settings.batchModeration ?? true);
    }
  }, [loading, settings]);

  const handleSaveByok = async () => {
    if (!apiKeyInput.trim()) {
      toast.warning('Silakan masukkan Google YouTube API Key terlebih dahulu.');
      return;
    }

    try {
      setByokSaving(true);
      const res = await fetch('/api/user/byok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKeyInput.trim() }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.error || 'Gagal menyambungkan API Key.');
        return;
      }

      toast.success(data.message || 'API Key berhasil diverifikasi dan disimpan!');
      setApiKeyInput('');
      fetchByokStatus();
    } catch (err) {
      console.error('Error saving BYOK:', err);
      toast.error('Terjadi kesalahan koneksi saat menyimpan API Key.');
    } finally {
      setByokSaving(false);
    }
  };

  const handleDeleteByok = async () => {
    try {
      setByokSaving(true);
      const res = await fetch('/api/user/byok', { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || 'Gagal menghapus API Key.');
        return;
      }
      toast.success(data.message || 'API Key pribadi berhasil dihapus.');
      fetchByokStatus();
    } catch (err) {
      console.error('Error deleting BYOK:', err);
      toast.error('Terjadi kesalahan koneksi saat menghapus API Key.');
    } finally {
      setByokSaving(false);
    }
  };

  const handleToggleNotif = async (checked) => {
    if (checked) {
      if (typeof window === 'undefined' || !('Notification' in window)) {
        toast.error('Browser Anda tidak mendukung notifikasi desktop.');
        setNotifKomentar(false);
        return;
      }
      
      if (Notification.permission === 'denied') {
        toast.warning('Izin notifikasi diblokir oleh browser. Silakan aktifkan di pengaturan browser Anda.');
        setNotifKomentar(false);
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast.warning('Izin notifikasi ditolak. Aktifkan izin notifikasi untuk menerima pemberitahuan.');
        setNotifKomentar(false);
        return;
      }
    }
    setNotifKomentar(checked);
  };

  const handleSave = async () => {
    await updateSettings({
      notifKomentar,
      autoTahan,
      autoHapus,
      thresholdHold,
      thresholdReject,
      pollingInterval,
      batchModeration,
    });
  };

  // ── Sub-components ─────────────────────────────────────────────
  const Toggle = ({ checked, onChange, disabled }) => (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-indigo-500' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      style={!checked ? { background: 'var(--border-hover)' } : {}}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'left-[22px]' : 'left-0.5'
          }`}
      />
    </button>
  );

  const Slider = ({ label, value, onChange, min = 50, max = 100, unit = '%', disabled }) => (
    <div className={`py-3 ${disabled ? 'opacity-50' : ''}`}>
      <div className="flex justify-between items-center mb-2">
        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</p>
        <span className="badge badge-amber text-xs font-bold px-2 py-0.5">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        disabled={disabled}
        onChange={(e) => !disabled && onChange(parseInt(e.target.value))}
        className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:cursor-not-allowed"
        style={{ background: 'var(--border-default)' }}
      />
      <div className="flex justify-between mt-1">
        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Sensitif (Rendah)</span>
        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Selektif (Tinggi)</span>
      </div>
    </div>
  );

  const SelectField = ({ label, desc, value, onChange, options, disabled }) => (
    <div className={`py-4 ${disabled ? 'opacity-50' : ''}`}>
      <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>{label}</p>
      <div className="relative">
        <select
          value={value}
          disabled={disabled}
          onChange={(e) => !disabled && onChange(e.target.value)}
          className="input-dark w-full appearance-none pr-8 disabled:cursor-not-allowed"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <svg
          className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'var(--text-muted)' }}
          fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </div>
      {desc && <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>{desc}</p>}
    </div>
  );

  const AccordionItem = ({ icon, label, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <div className="border-b" style={{ borderColor: 'var(--border-default)' }}>
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between py-3 cursor-pointer -mx-1 px-1 rounded transition-colors hover:bg-[var(--bg-card-hover)]"
        >
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</span>
          </div>
          <svg
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            style={{ color: 'var(--text-muted)' }}
            fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
        {isOpen && (
          <div className="pb-4 px-7 animate-fade-in">
            <div className="text-xs leading-relaxed space-y-2" style={{ color: 'var(--text-muted)' }}>
              {children}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Ikon kecil yang dipakai berulang
  const iconStyle = { color: 'var(--text-muted)' };

  return (
    <div className="animate-fade-in-up w-full space-y-5 lg:space-y-6 pb-10">

      {/* ── Header ────────────────────────────────────────────── */}
      <div>
        <h1 className="text-lg lg:text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Pengaturan Penyaringan AI
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Sesuaikan kepekaan pendeteksi AI dan aturan otomatisasi
        </p>
      </div>

      {/* ── Status Koneksi ────────────────────────────────────── */}
      <div className="bento-card p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" style={{ color: 'var(--color-success-text)' }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Status Koneksi YouTube API</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Status otentikasi Google OAuth &amp; ketersediaan layanan</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Terhubung
          </span>
        </div>

        <div
          className="rounded-xl p-4 border"
          style={{ background: 'var(--color-success-bg)', borderColor: 'var(--color-success-border)' }}
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" style={{ color: 'var(--color-success-text)' }} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-semibold" style={{ color: 'var(--color-success-text)' }}>Akses YouTube Proaktif Aktif</span>
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--color-success-text)', opacity: 0.8 }}>
            Sistem terhubung aman dengan akun Google OAuth Anda. Fitur pemeriksaan dan moderasi otomatis berjalan proaktif.
          </p>
        </div>
      </div>

      {/* ── Notifikasi & Mode Penyaringan AI ───────────────────── */}
      <div className="bento-card p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            <div>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Notifikasi &amp; Mode Otomasi AI</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Pilih tingkat kepekaan AI untuk melindungi kolom komentar Anda</p>
            </div>
          </div>
        </div>

        {/* Toggle Notifikasi */}
        <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: 'var(--border-default)' }}>
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Notifikasi Komentar Baru</p>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Terima pemberitahuan browser saat ada komentar baru yang masuk
            </p>
          </div>
          <Toggle checked={notifKomentar} onChange={handleToggleNotif} />
        </div>

        {/* ── MODE UTAMA (3 KARTU SEDERHANA) ───────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Pilih Mode Penyaringan Otomatis
            </label>
            {isFeatureDisabled('auto_moderation') && (
              <Link href="/pricing" className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 hover:bg-amber-500/20 transition-colors">
                Upgrade untuk Aktifkan Otomasi →
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                id: 'santai',
                name: 'Mode Santai',
                badge: 'Aman & Hati-hati',
                desc: 'Hanya menghapus komentar yang sangat jelas spam. Komentar mencurigakan ditahan di folder tinjauan.',
                hold: 80,
                reject: 95,
                colorBorder: 'hover:border-emerald-500/40',
                activeBg: 'bg-emerald-500/10 border-emerald-500/50 ring-1 ring-emerald-500/30'
              },
              {
                id: 'seimbang',
                name: 'Mode Seimbang',
                badge: 'Rekomendasi Best Choice',
                desc: 'Keseimbangan terbaik untuk menjaga kolom komentar bersih tanpa risiko salah hapus komentar penonton asli.',
                hold: 70,
                reject: 90,
                colorBorder: 'hover:border-amber-500/40',
                activeBg: 'bg-amber-500/10 border-amber-500/50 ring-1 ring-amber-500/30'
              },
              {
                id: 'ketat',
                name: 'Mode Ketat',
                badge: 'Proteksi Maksimal',
                desc: 'Paling cepat & agresif membersihkan spam judol. Sangat cocok jika video Anda sedang diserang spam massal.',
                hold: 60,
                reject: 85,
                colorBorder: 'hover:border-rose-500/40',
                activeBg: 'bg-rose-500/10 border-rose-500/50 ring-1 ring-rose-500/30'
              },
            ].map((mode) => {
              const isSelected = autoTahan && autoHapus && thresholdHold === mode.hold && thresholdReject === mode.reject;
              const disabled = isFeatureDisabled('auto_moderation');

              return (
                <button
                  key={mode.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    if (disabled) return;
                    setAutoTahan(true);
                    setAutoHapus(true);
                    setThresholdHold(mode.hold);
                    setThresholdReject(mode.reject);
                  }}
                  className={`p-4 rounded-2xl text-left border transition-all relative flex flex-col justify-between cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''
                    } ${isSelected
                      ? mode.activeBg
                      : `bg-[var(--bg-card-hover)] border-transparent ${mode.colorBorder}`
                    }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-primary">{mode.name}</span>
                      {isSelected && (
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse" />
                      )}
                    </div>
                    <span className="text-[9px] font-semibold px-2 py-0.5 rounded bg-slate-500/15 text-secondary border border-slate-500/20 inline-block mb-2">
                      {mode.badge}
                    </span>
                    <p className="text-xs text-muted leading-relaxed">{mode.desc}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[var(--border-default)]/60 flex items-center justify-between text-[11px] font-medium text-secondary">
                    <span>{isSelected ? '✓ Mode Aktif Saat Ini' : 'Klik untuk Pilih'}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── ACCORDION MODE LANJUTAN (KUSTOM / UNTUK DOSEN) ────────── */}
        <div className="pt-2 border-t" style={{ borderColor: 'var(--border-default)' }}>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between w-full py-2.5 px-3 rounded-xl text-xs font-semibold text-secondary hover:text-primary hover:bg-[var(--bg-card-hover)] transition-colors border border-dashed border-[var(--border-default)] cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 18H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 12h11.25" />
              </svg>
              Pengaturan Lanjutan (Kustom Nilai &amp; Visualisasi Threshold)
            </span>
            <span className="text-xs text-indigo-400 flex items-center gap-1 font-medium">
              {showAdvanced ? 'Sembunyikan ▲' : 'Buka & Atur Manual ▼'}
            </span>
          </button>

          {showAdvanced && (
            <div className="mt-4 p-5 rounded-2xl border bg-card/60 space-y-6 animate-fade-in" style={{ borderColor: 'var(--border-default)' }}>
              <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-default)' }}>
                <div>
                  <h3 className="text-xs font-bold text-primary uppercase tracking-wider">Kustom Ambang Batas Otomatis (Persentase AI)</h3>
                  <p className="text-[11px] text-muted mt-0.5">Penyesuaian manual nilai ambang batas probabilitas model ML</p>
                </div>
              </div>

              {/* Toggle Penahanan Otomatis */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-secondary">Penahanan Otomatis ke Folder Tinjauan</p>
                    <p className="text-[11px] text-muted">Amankan komentar ke folder tinjauan jika kecurigaan AI mencapai batas ini</p>
                  </div>
                  <Toggle checked={isFeatureDisabled('auto_moderation') ? false : autoTahan} onChange={setAutoTahan} disabled={isFeatureDisabled('auto_moderation')} />
                </div>

                {autoTahan && !isFeatureDisabled('auto_moderation') && (
                  <div className="bg-[var(--bg-card-hover)] p-3 rounded-xl border border-[var(--border-default)]">
                    <Slider
                      label="Batas Minimal Tahan Komentar (Mencurigakan)"
                      value={thresholdHold}
                      onChange={(val) => {
                        setThresholdHold(val);
                        if (val >= thresholdReject) setThresholdReject(Math.min(99, val + 5));
                      }}
                      min={50}
                      max={95}
                      unit="%"
                      disabled={isFeatureDisabled('auto_moderation')}
                    />
                  </div>
                )}
              </div>

              {/* Toggle Penghapusan Otomatis */}
              <div className="space-y-3 pt-3 border-t" style={{ borderColor: 'var(--border-default)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-secondary">Penghapusan Otomatis Permanen</p>
                    <p className="text-[11px] text-muted">Langsung hapus dari YouTube jika tingkat keyakinan AI sangat tinggi</p>
                  </div>
                  <Toggle checked={isFeatureDisabled('auto_moderation') ? false : autoHapus} onChange={setAutoHapus} disabled={isFeatureDisabled('auto_moderation')} />
                </div>

                {autoHapus && !isFeatureDisabled('auto_moderation') && (
                  <div className="bg-[var(--bg-card-hover)] p-3 rounded-xl border border-[var(--border-default)]">
                    <Slider
                      label="Batas Minimal Hapus Otomatis (Sangat Yakin)"
                      value={thresholdReject}
                      onChange={(val) => {
                        setThresholdReject(val);
                        if (val <= thresholdHold) setThresholdHold(Math.max(50, val - 5));
                      }}
                      min={70}
                      max={99}
                      unit="%"
                      disabled={isFeatureDisabled('auto_moderation')}
                    />
                  </div>
                )}
              </div>

              {/* Visual Bar Peta Zona Moderasi */}
              {!isFeatureDisabled('auto_moderation') && (autoTahan || autoHapus) && (
                <div className="p-3.5 rounded-xl border bg-card/80 space-y-2" style={{ borderColor: 'var(--border-default)' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-primary">Visualisasi Keputusan AI (0% - 100%)</span>
                    <span className="text-xs font-semibold text-indigo-400">Hold: {thresholdHold}% | Reject: {thresholdReject}%</span>
                  </div>

                  <div className="relative h-6 w-full rounded-lg overflow-hidden flex border border-slate-700/50 text-[10px] font-bold select-none">
                    <div
                      style={{ width: `${autoTahan ? thresholdHold : autoHapus ? thresholdReject : 100}%` }}
                      className="bg-emerald-500/20 text-emerald-400 flex items-center justify-center border-r border-emerald-500/30 transition-all duration-300"
                    >
                      <span className="truncate px-1">🟢 Dipublikasi (&lt;{autoTahan ? thresholdHold : thresholdReject}%)</span>
                    </div>

                    {autoTahan && (
                      <div
                        style={{ width: `${autoHapus ? Math.max(0, thresholdReject - thresholdHold) : (100 - thresholdHold)}%` }}
                        className="bg-amber-500/25 text-amber-300 flex items-center justify-center border-r border-amber-500/30 transition-all duration-300"
                      >
                        <span className="truncate px-1">🟡 Ditahan ({thresholdHold}% - {autoHapus ? thresholdReject : 100}%)</span>
                      </div>
                    )}

                    {autoHapus && (
                      <div
                        style={{ width: `${100 - thresholdReject}%` }}
                        className="bg-rose-500/30 text-rose-300 flex items-center justify-center transition-all duration-300"
                      >
                        <span className="truncate px-1">🔴 Dihapus (≥{thresholdReject}%)</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Pengaturan Kuota & Polling ────────────────────────── */}
      <div className="bento-card p-6">
        <div className="flex items-center gap-2 mb-1">
          <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Hemat Jatah Poin YouTube</h2>
        </div>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          Optimalkan jatah quota Anda
        </p>

        <div className="space-y-6">
          <SelectField
            label="Jeda Pemeriksaan Otomatis"
            desc="Semakin lama jeda pemeriksaan, jatah poin harian YouTube Anda akan semakin hemat. (Disarankan 2-5 menit)."
            value={pollingInterval}
            onChange={(val) => setPollingInterval(parseInt(val))}
            disabled={isFeatureDisabled('auto_moderation')}
            options={[
              { value: 30, label: '30 Detik (Boros Kuota)' },
              { value: 60, label: '1 Menit' },
              { value: 120, label: '2 Menit (Rekomendasi)' },
              { value: 300, label: '5 Menit (Sangat Hemat)' },
              { value: 600, label: '10 Menit' },
            ]}
          />
          <div className="flex items-center justify-between py-2 border-t" style={{ borderColor: 'var(--border-default)' }}>
            <div>
              <p className="text-sm font-medium flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                Pembersihan Massal Sekaligus
                {isFeatureDisabled('bulk_moderation') && (
                  <Link href="/pricing" className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 hover:bg-amber-500/20 transition-colors cursor-pointer">PRO / ENT 🔒 Upgrade →</Link>
                )}
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Kirim instruksi penghapusan untuk banyak komentar sekaligus agar sangat menghemat jatah kuota YouTube.
              </p>
            </div>
            <Toggle checked={isFeatureDisabled('bulk_moderation') ? false : batchModeration} onChange={setBatchModeration} disabled={isFeatureDisabled('bulk_moderation')} />
          </div>
        </div>

        {/* Quota Info Box */}
        <div
          className="mt-6 rounded-xl p-4 border"
          style={{ background: 'var(--color-info-bg)', borderColor: 'var(--color-info-border)' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4" style={{ color: 'var(--color-info-text)' }} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
            <span className="text-xs font-semibold" style={{ color: 'var(--color-info-text)' }}>Panduan Konsumsi Jatah Poin</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase" style={{ color: 'var(--color-info-text)' }}>Ambil Data (List)</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-info-text)', opacity: 0.8 }}>1 Unit per request</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase" style={{ color: 'var(--color-info-text)' }}>Moderasi (Moderate)</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-info-text)', opacity: 0.8 }}>50 Unit per request</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Integrasi Kunci API Mandiri (BYOK - Enterprise) ────── */}
      <div className="bento-card p-6 relative overflow-hidden">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121 8.25z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                Kunci Akses Mandiri (BYOK)
                {!byokStatus.isEnterprise && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                    🔒 Khusus Enterprise
                  </span>
                )}
              </h2>
            </div>
          </div>
          <button
            onClick={() => setShowByokGuide(true)}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors"
          >
            📖 Panduan Cara Buat Key
          </button>
        </div>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          Gunakan Google YouTube API Key milik Anda sendiri untuk memindahkan beban kuota harian dari server ke akun GCP Anda (Bebas Batas Kuota).
        </p>

        {byokLoading ? (
          <div className="py-6 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
            Memuat status kunci API...
          </div>
        ) : !byokStatus.isEnterprise ? (
          /* Locked State for FREE / PRO */
          <div className="p-4 rounded-xl border border-dashed border-slate-700 bg-slate-900/40 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔒</span>
              <div>
                <p className="text-xs font-semibold text-slate-200">Fitur Terkunci untuk Paket Enterprise</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Tingkatkan ke Paket Enterprise untuk mengaktifkan pembersihan otomatis bebas limit menggunakan API Key pribadi.</p>
              </div>
            </div>
            <Link
              href="/pricing"
              className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-amber-500 to-indigo-600 rounded-xl hover:opacity-90 transition-all flex-shrink-0 shadow-md shadow-amber-500/10"
            >
              Upgrade Paket Enterprise →
            </Link>
          </div>
        ) : (
          /* Enterprise Unlocked State */
          <div className="space-y-4">
            {byokStatus.hasKey ? (
              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                  <div>
                    <p className="text-xs font-semibold text-emerald-300 flex items-center gap-2">
                      API Key Pribadi Aktif
                      <code className="px-2 py-0.5 bg-emerald-900/60 rounded text-[11px] font-mono text-emerald-200">{byokStatus.maskedKey}</code>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Seluruh request YouTube API akun Anda kini menggunakan kuota proyek Google Cloud Anda sendiri.</p>
                  </div>
                </div>
                <button
                  onClick={handleDeleteByok}
                  disabled={byokSaving}
                  className="px-3.5 py-1.5 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/30 rounded-lg transition-colors flex-shrink-0"
                >
                  {byokSaving ? 'Memproses...' : 'Hapus Key'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                  <span>⚠️</span>
                  <span><strong>API Key Belum Dipasang:</strong> Akun Anda ber-tier Enterprise tetapi saat ini masih memotong jatah kuota server. Tempelkan kunci Anda di bawah ini:</span>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <input
                    type="password"
                    placeholder="Tempelkan Google YouTube API Key (AIzaSyD...)"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border bg-slate-900/80 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                    style={{ borderColor: 'var(--border-default)' }}
                  />
                  <button
                    onClick={handleSaveByok}
                    disabled={byokSaving}
                    className="w-full sm:w-auto px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all flex-shrink-0 shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                  >
                    {byokSaving ? 'Memverifikasi...' : 'Simpan & Verifikasi'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Pusat Bantuan ─────────────────────────────────────── */}
      <div className="bento-card p-6">
        <div className="flex items-center gap-2 mb-1">
          <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
          </svg>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Pusat Bantuan</h2>
        </div>
        <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Panduan dan informasi moderasi</p>

        {[
          {
            label: 'Pedoman Moderasi',
            icon: <svg className="w-4 h-4" style={iconStyle} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>,
            content: <><p>Moderasi proaktif bertujuan untuk menjaga ekosistem kanal Anda tetap bersih dari promosi ilegal.</p><ul className="list-disc ml-4 space-y-1 mt-2"><li><strong>Reject:</strong> Untuk komentar yang mengandung link langsung ke situs judi.</li><li><strong>Hold:</strong> Untuk komentar mencurigakan agar bisa ditinjau manual.</li></ul></>,
          },
          {
            label: 'Contoh Komentar Area Abu-abu',
            icon: <svg className="w-4 h-4" style={iconStyle} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>,
            content: <><p>Beberapa komentar menggunakan teknik kamuflase:</p><ul className="list-disc ml-4 space-y-1 mt-2 text-xs"><li>&quot;M.A.I.N di sini dijamin JP&quot;</li><li>&quot;Info slot gacor klik bit.ly/xxxx&quot;</li><li>&quot;Video bagus gan, izin share http://...&quot;</li></ul></>,
          },
          {
            label: 'Tips Moderasi Efisien',
            icon: <svg className="w-4 h-4" style={iconStyle} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>,
            content: <ul className="list-decimal ml-4 space-y-1"><li><strong>Optimasi Kuota:</strong> Gunakan jeda pemeriksaan otomatis 2-5 menit.</li><li><strong>Batching:</strong> Aktifkan &quot;Moderasi Massal&quot; untuk hemat kuota.</li><li><strong>Auto-Moderasi:</strong> Mulai dengan Ambang Batas tinggi (90%+) untuk Hapus Otomatis.</li></ul>,
          },
        ].map(item => (
          <AccordionItem key={item.label} icon={item.icon} label={item.label}>
            {item.content}
          </AccordionItem>
        ))}
      </div>

      {/* ── Action Buttons ────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3 pb-4">
        <button
          className="px-4 py-2.5 rounded-xl text-sm border transition-all bento-card"
          style={{ color: 'var(--text-secondary)' }}
        >
          Reset ke Default
        </button>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all active:scale-95 btn-primary"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Simpan Preferensi
        </button>
      </div>

      {/* Renew Permissions Confirmation Modal */}
      <ConfirmModal
        isOpen={showRenewConfirm}
        onClose={() => setShowRenewConfirm(false)}
        onConfirm={() => {
          toast.success('Mengalihkan untuk pembaruan izin...');
          setTimeout(() => {
            signOut({ callbackUrl: '/login' });
          }, 1200);
        }}
        title="Perbarui Izin YouTube"
        description="Apakah Anda yakin ingin memperbarui izin YouTube? Anda akan dikeluarkan dari sesi saat ini dan diarahkan ke halaman login untuk memberikan otentikasi YouTube API yang baru."
        confirmText="Perbarui"
        variant="info"
      />

      {/* Modal Tutorial Pembuatan YouTube API Key */}
      <ByokGuideModal
        isOpen={showByokGuide}
        onClose={() => setShowByokGuide(false)}
      />
    </div>
  );
}
