'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { signOut } from 'next-auth/react';
import { useTheme } from '@/components/ThemeProvider';
import { useSettings } from '@/contexts/SettingsContext';
import { useToast } from '@/contexts/ToastContext';
import ConfirmModal from '@/components/ui/ConfirmModal';

export default function PreferensiPage() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const { settings, updateSettings, loading } = useSettings();
  const toast = useToast();
  const [showRenewConfirm, setShowRenewConfirm] = useState(false);

  const [notifKomentar, setNotifKomentar] = useState(true);
  const [autoTahan, setAutoTahan] = useState(true);
  const [autoHapus, setAutoHapus] = useState(false);
  const [thresholdHold, setThresholdHold] = useState(70);
  const [thresholdReject, setThresholdReject] = useState(90);
  const [pollingInterval, setPollingInterval] = useState(120);
  const [batchModeration, setBatchModeration] = useState(true);

  // Sync local state with context when settings are loaded
  useEffect(() => {
    if (!loading && settings) {
      setNotifKomentar(settings.notifKomentar ?? true);
      setAutoTahan(settings.autoTahan ?? true);
      setAutoHapus(settings.autoHapus ?? false);
      setThresholdHold(settings.thresholdHold ?? 70);
      setThresholdReject(settings.thresholdReject ?? 90);
      setPollingInterval(settings.pollingInterval ?? 120);
      setBatchModeration(settings.batchModeration ?? true);
    }
  }, [loading, settings]);

  const handleSave = async () => {
    await updateSettings({
      theme,
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
  const Toggle = ({ checked, onChange }) => (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-indigo-500' : ''}`}
      style={!checked ? { background: 'var(--border-hover)' } : {}}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'left-[22px]' : 'left-0.5'
          }`}
      />
    </button>
  );

  const Slider = ({ label, value, onChange, min = 50, max = 100, unit = '%' }) => (
    <div className="py-3">
      <div className="flex justify-between items-center mb-2">
        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</p>
        <span className="badge badge-amber text-xs font-bold px-2 py-0.5">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-indigo-500"
        style={{ background: 'var(--border-default)' }}
      />
      <div className="flex justify-between mt-1">
        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Sensitif (Rendah)</span>
        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Selektif (Tinggi)</span>
      </div>
    </div>
  );

  const SelectField = ({ label, desc, value, onChange, options }) => (
    <div className="py-4">
      <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>{label}</p>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input-dark w-full appearance-none pr-8"
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
      <div className="bento-card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <svg className="w-5 h-5" style={{ color: 'var(--color-success-text)' }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Status Koneksi</h2>
        </div>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Kelola koneksi dengan YouTube API</p>

        <div
          className="rounded-xl p-4 border"
          style={{ background: 'var(--color-success-bg)', borderColor: 'var(--color-success-border)' }}
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" style={{ color: 'var(--color-success-text)' }} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-semibold" style={{ color: 'var(--color-success-text)' }}>Izin Aktif</span>
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--color-success-text)', opacity: 0.8 }}>
            Koneksi dengan YouTube berhasil. Semua fitur moderasi proaktif aktif.
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-success-text)', opacity: 0.6 }}>
            Terakhir diperbarui: {new Date().toLocaleDateString('id-ID')} {new Date().toLocaleTimeString('id-ID')}
          </p>
        </div>

        <button
          onClick={() => setShowRenewConfirm(true)}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm border transition-all bento-card"
          style={{ color: 'var(--text-secondary)' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
          </svg>
          Perbarui Izin
        </button>
      </div>

      {/* ── Notifikasi & Otomasi ──────────────────────────────── */}
      <div className="bento-card p-6">
        <div className="flex items-center gap-2 mb-1">
          <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Notifikasi &amp; Otomasi</h2>
        </div>
        <div className="space-y-6">
          <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'var(--border-default)' }}>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Notifikasi Komentar Baru</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Terima pemberitahuan saat ada komentar baru yang perlu ditinjau
              </p>
            </div>
            <Toggle checked={notifKomentar} onChange={setNotifKomentar} />
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Penahanan Otomatis</p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Amankan komentar ke folder tinjauan jika tingkat kecurigaan AI melewati batas kepekaan.
                </p>
              </div>
              <Toggle checked={autoTahan} onChange={setAutoTahan} />
            </div>
            {autoTahan && (
              <Slider label="Sensitivitas Penahanan Komentar (Mencurigakan)" value={thresholdHold} onChange={setThresholdHold} min={50} max={95} />
            )}
          </div>

          <div className="space-y-4 pt-2 border-t" style={{ borderColor: 'var(--border-default)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Penghapusan Otomatis</p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Langsung hapus komentar dari YouTube jika AI sangat yakin komentar tersebut berisi iklan judi.
                </p>
              </div>
              <Toggle checked={autoHapus} onChange={setAutoHapus} />
            </div>
            {autoHapus && (
              <Slider label="Sensitivitas Penghapusan Otomatis (Sangat Yakin)" value={thresholdReject} onChange={setThresholdReject} min={70} max={99} />
            )}
          </div>
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
          Optimalkan jatah harian akun Anda yang dibatasi oleh pihak YouTube (10.000 poin/hari)
        </p>

        <div className="space-y-6">
          <SelectField
            label="Jeda Pemeriksaan Otomatis"
            desc="Semakin lama jeda pemeriksaan, jatah poin harian YouTube Anda akan semakin hemat. (Disarankan 2-5 menit)."
            value={pollingInterval}
            onChange={(val) => setPollingInterval(parseInt(val))}
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
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Pembersihan Massal Sekaligus</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Kirim instruksi penghapusan untuk banyak komentar sekaligus agar sangat menghemat jatah kuota YouTube.
              </p>
            </div>
            <Toggle checked={batchModeration} onChange={setBatchModeration} />
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
            content: <><p>Beberapa komentar menggunakan teknik kamuflase:</p><ul className="list-disc ml-4 space-y-1 mt-2 font-mono text-[10px]"><li>&quot;M.A.I.N di sini dijamin JP&quot;</li><li>&quot;Info slot gacor klik bit.ly/xxxx&quot;</li><li>&quot;Video bagus gan, izin share http://...&quot;</li></ul></>,
          },
          {
            label: 'Tips Moderasi Efisien',
            icon: <svg className="w-4 h-4" style={iconStyle} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>,
            content: <ul className="list-decimal ml-4 space-y-1"><li><strong>Optimasi Kuota:</strong> Gunakan interval polling 2-5 menit.</li><li><strong>Batching:</strong> Aktifkan &quot;Moderasi Massal&quot; untuk hemat kuota.</li><li><strong>Auto-Moderasi:</strong> Mulai dengan Ambang Batas tinggi (90%+) untuk Hapus Otomatis.</li></ul>,
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
    </div>
  );
}
