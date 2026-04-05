'use client';

import { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';

export default function PreferensiPage() {
  const [bahasa, setBahasa] = useState('id');
  const [tema, setTema] = useState('terang');
  const [kepadatan, setKepadatan] = useState('standar');
  const [notifKomentar, setNotifKomentar] = useState(true);
  const [autoTahan, setAutoTahan] = useState(true);
  const [autoHapus, setAutoHapus] = useState(false);
  const [thresholdHold, setThresholdHold] = useState(70);
  const [thresholdReject, setThresholdReject] = useState(90);
  const [pollingInterval, setPollingInterval] = useState(120);
  const [batchModeration, setBatchModeration] = useState(true);
  const [saveStatus, setSaveStatus] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('userSettings');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.bahasa) setBahasa(parsed.bahasa);
      if (parsed.tema) setTema(parsed.tema);
      if (parsed.kepadatan) setKepadatan(parsed.kepadatan);
      if (parsed.notifKomentar !== undefined) setNotifKomentar(parsed.notifKomentar);
      if (parsed.autoTahan !== undefined) setAutoTahan(parsed.autoTahan);
      if (parsed.autoHapus !== undefined) setAutoHapus(parsed.autoHapus);
      if (parsed.thresholdHold !== undefined) setThresholdHold(parsed.thresholdHold);
      if (parsed.thresholdReject !== undefined) setThresholdReject(parsed.thresholdReject);
      if (parsed.pollingInterval !== undefined) setPollingInterval(parsed.pollingInterval);
      if (parsed.batchModeration !== undefined) setBatchModeration(parsed.batchModeration);
    }
  }, []);

  const handleSave = () => {
    const settings = { 
      bahasa, tema, kepadatan, notifKomentar, 
      autoTahan, autoHapus, 
      thresholdHold, thresholdReject,
      pollingInterval, batchModeration
    };
    localStorage.setItem('userSettings', JSON.stringify(settings));
    setSaveStatus('success');
    setTimeout(() => setSaveStatus(null), 3000);
  };


  const Toggle = ({ checked, onChange }) => (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-indigo-600' : 'bg-gray-200'}`}
    >
      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  );

  const Slider = ({ label, value, onChange, min = 50, max = 100, unit = '%' }) => (
    <div className="py-3">
      <div className="flex justify-between items-center mb-2">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
      />
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-gray-400">Sensitif (Rendah)</span>
        <span className="text-[10px] text-gray-400">Selektif (Tinggi)</span>
      </div>
    </div>
  );

  const SelectField = ({ label, desc, value, onChange, options }) => (
    <div className="py-4">
      <p className="text-sm font-medium text-gray-700 mb-1">{label}</p>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <svg className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </div>
      {desc && <p className="text-[11px] text-gray-400 mt-1">{desc}</p>}
    </div>
  );

  const AccordionItem = ({ icon, label }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50 -mx-1 px-1 rounded transition-colors">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-gray-700">{label}</span>
      </div>
      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
      </svg>
    </div>
  );

  return (
    <div className="animate-fade-in-up max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Preferensi & Pengaturan</h1>
        <p className="text-sm text-gray-400 mt-0.5">Sesuaikan pengalaman moderasi Anda</p>
      </div>

      {/* Status Koneksi */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-sm font-semibold text-gray-900">Status Koneksi</h2>
        </div>
        <p className="text-xs text-gray-400">Kelola koneksi dengan YouTube API</p>

        <div className="bg-green-50 border border-green-100 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-semibold text-green-700">Izin Aktif</span>
          </div>
          <p className="text-xs text-green-600 mt-1">Koneksi dengan YouTube berhasil. Semua fitur moderasi proaktif aktif.</p>
          <p className="text-[10px] text-green-500 mt-0.5">Terakhir diperbarui: {new Date().toLocaleDateString('id-ID')} {new Date().toLocaleTimeString('id-ID')}</p>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center justify-center gap-2 w-full py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
          </svg>
          Perbarui Izin
        </button>
      </div>

      {/* Tampilan */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-1">
          <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
          </svg>
          <h2 className="text-sm font-semibold text-gray-900">Tampilan</h2>
        </div>
        <p className="text-xs text-gray-400 mb-2">Sesuaikan tampilan antarmuka</p>

        <SelectField
          label="Bahasa Antarmuka"
          desc="Bahasa yang digunakan untuk antarmuka aplikasi"
          value={bahasa}
          onChange={setBahasa}
          options={[{ value: 'id', label: 'Bahasa Indonesia' }, { value: 'en', label: 'English' }]}
        />
        <SelectField
          label="Tema Warna"
          desc="Pilih tema terang atau gelap untuk kenyamanan mata"
          value={tema}
          onChange={setTema}
          options={[{ value: 'terang', label: 'Terang' }, { value: 'gelap', label: 'Gelap' }]}
        />
        <SelectField
          label="Kepadatan Tampilan"
          desc="Atur jarak dan ukuran elemen antarmuka"
          value={kepadatan}
          onChange={setKepadatan}
          options={[{ value: 'standar', label: 'Standar' }, { value: 'kompak', label: 'Kompak' }, { value: 'longgar', label: 'Longgar' }]}
        />
      </div>

      {/* Notifikasi & Otomasi */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-1">
          <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
          <h2 className="text-sm font-semibold text-gray-900">Notifikasi & Otomasi</h2>
        </div>
        <div className="space-y-6">
          {/* Notification settings */}
          <div className="flex items-center justify-between py-2 border-b border-gray-50">
            <div>
              <p className="text-sm font-medium text-gray-700">Notifikasi Komentar Baru</p>
              <p className="text-[11px] text-gray-400">Terima pemberitahuan saat ada komentar baru yang perlu ditinjau</p>
            </div>
            <Toggle checked={notifKomentar} onChange={setNotifKomentar} />
          </div>
          
          {/* Auto Moderation Toggle - Hold */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Karantina Otomatis (Mencurigakan)</p>
                <p className="text-[11px] text-gray-400">Tahan komentar jika skor AI melebihi ambang batas karantina.</p>
              </div>
              <Toggle checked={autoTahan} onChange={setAutoTahan} />
            </div>
            {autoTahan && (
              <Slider 
                label="Ambang Batas Karantina" 
                value={thresholdHold} 
                onChange={setThresholdHold}
                min={50}
                max={95}
              />
            )}
          </div>

          {/* Auto Moderation Toggle - Reject */}
          <div className="space-y-4 pt-2 border-t border-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Hapus Otomatis (Sangat Yakin)</p>
                <p className="text-[11px] text-gray-400">Langsung Reject komentar jika skor AI melebihi ambang batas hapus.</p>
              </div>
              <Toggle checked={autoHapus} onChange={setAutoHapus} />
            </div>
            {autoHapus && (
              <Slider 
                label="Ambang Batas Hapus (Reject)" 
                value={thresholdReject} 
                onChange={setThresholdReject}
                min={70}
                max={99}
              />
            )}
          </div>
        </div>
      </div>

      {/* Pengaturan Kuota & Polling */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-1">
          <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-sm font-semibold text-gray-900">Pengaturan Kuota & Polling</h2>
        </div>
        <p className="text-xs text-gray-400 mb-4">Optimalkan penggunaan kuota YouTube API harian Anda (10k unit/hari)</p>

        <div className="space-y-6">
          <SelectField
            label="Interval Polling Komentar"
            desc="Semakin lama intervalnya, semakin hemat kuota Anda. Direkomendasikan 2-5 menit."
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

          <div className="flex items-center justify-between py-2 border-t border-gray-50">
            <div>
              <p className="text-sm font-medium text-gray-700">Moderasi Massal (Batching)</p>
              <p className="text-[11px] text-gray-400">Kirim banyak perintah moderasi dalam 1 request. Menghemat 50x hingga 100x kuota.</p>
            </div>
            <Toggle checked={batchModeration} onChange={setBatchModeration} />
          </div>
        </div>

        {/* Quota Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-100 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
            <span className="text-xs font-semibold text-blue-700">Panduan Biaya Kuota</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-[10px] text-blue-700 font-medium uppercase">Ambil Data (List)</p>
              <p className="text-xs text-blue-600">1 Unit per request</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-blue-700 font-medium uppercase">Moderasi (Moderate)</p>
              <p className="text-xs text-blue-600">50 Unit per request (ID tunggal maupun massal)</p>
            </div>
          </div>
          <p className="text-[10px] text-blue-500 mt-3 italic">
            *Optimasi Antigravity: Kami mengganti fitur Search (100 unit) dengan PlaylistItems (1 unit) untuk efisiensi maksimal.
          </p>
        </div>

      </div>


      {/* Pusat Bantuan */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-1">
          <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
          </svg>
          <h2 className="text-sm font-semibold text-gray-900">Pusat Bantuan</h2>
        </div>
        <p className="text-xs text-gray-400 mb-3">Panduan dan informasi moderasi</p>

        <AccordionItem
          icon={<svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>}
          label="Pedoman Moderasi"
        />
        <AccordionItem
          icon={<svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>}
          label="Contoh Komentar Area Abu-abu"
        />
        <AccordionItem
          icon={<svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>}
          label="Kebijakan Privasi & Keamanan"
        />
        <AccordionItem
          icon={<svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>}
          label="Tips Moderasi Efisien"
        />
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-3 pb-4">
        {saveStatus === 'success' && (
          <span className="text-xs text-green-600 font-medium animate-fade-in">Tersimpan ke sistem!</span>
        )}
        <button className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-all">
          Reset ke Default
        </button>
        <button 
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-all active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Simpan Preferensi
        </button>
      </div>
    </div>
  );
}
