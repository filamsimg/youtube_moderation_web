'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import KineticGrid from '@/components/KineticGrid';

const FEATURES = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
    title: 'Pendeteksi AI Pintar',
    desc: 'Sistem kecerdasan buatan (AI) yang dilatih khusus untuk mengenali bahasa iklan judi online di kolom komentar YouTube.',
    color: 'amber',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    title: 'Pembersihan Otomatis',
    desc: 'Hapus atau tahan komentar mencurigakan secara otomatis berdasarkan tingkat keyakinan AI tanpa repot memeriksa satu-satu.',
    color: 'emerald',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
      </svg>
    ),
    title: 'Deteksi Sikap Penonton',
    desc: 'Pahami emosi penonton—AI mendeteksi komentar yang mendukung (positif), tidak suka (negatif), atau biasa saja (netral).',
    color: 'amber',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Pemeriksaan Otomatis',
    desc: 'Pengecekan berjalan berkala di latar belakang untuk menyaring komentar baru tanpa perlu memuat ulang halaman.',
    color: 'amber',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: 'Jatah Kuota Harian Aman',
    desc: 'Pembagian jatah penggunaan harian dari YouTube diatur adil agar layanan tetap lancar untuk seluruh pengguna.',
    color: 'rose',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    title: 'Riwayat Tindakan',
    desc: 'Seluruh komentar yang disetujui atau dihapus tersimpan aman untuk memudahkan Anda melihat hasil penyaringan.',
    color: 'violet',
  },
];

const STATS = [
  { value: '95%+', label: 'Akurasi Deteksi Spam' },
  { value: '< 1s', label: 'Waktu Analisis AI' },
  { value: '100', label: 'Komentar per Fetch' },
];

const colorMap = {
  amber: 'bg-amber-50 text-amber-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  amber: 'bg-amber-50 text-amber-600',
  rose: 'bg-rose-50 text-rose-600',
  violet: 'bg-violet-50 text-violet-600',
};

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Jika sudah login, redirect ke dashboard
  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/dashboard');
    }
  }, [status, router]);

  // Tampilkan loading spinner saat mengecek sesi
  if (status === 'loading' || status === 'authenticated') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" />
      </div>
    );
  }

  return (
    <div className="overflow-x-hidden">

      {/* ── HERO SECTION ──────────────────────────────────────────── */}
      <section className="relative pt-20 pb-24 px-4 text-center overflow-hidden">
        {/* Background gradient blobs & Kinetic Grid */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-amber-100/60 dark:bg-amber-950/10 rounded-full blur-3xl" />
          <div className="absolute top-20 right-0 w-[300px] h-[300px] bg-purple-100/40 dark:bg-purple-950/10 rounded-full blur-3xl" />
          <KineticGrid />
        </div>

        {/* Hero Content Wrapper */}
        <div className="relative z-10 pointer-events-none">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-full text-xs font-medium text-amber-700 mb-6 pointer-events-auto">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
            Powered by IndoBERT AI
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-primary leading-tight mb-4 max-w-3xl mx-auto pointer-events-auto">
            Penyaringan Komentar{' '}
            <span className="text-amber-500">Judi Online</span>{' '}
            di YouTube secara Otomatis
          </h1>
          <p className="text-base text-secondary max-w-xl mx-auto mb-8 leading-relaxed pointer-events-auto">
            Sistem Kecerdasan Buatan (AI) untuk menyaring dan membersihkan komentar promosi judi
            di kanal YouTube Anda — cepat, akurat, dan tanpa batas manual.
          </p>

          {/* CTAs */}
          <div className="flex items-center justify-center gap-3 flex-wrap pointer-events-auto">
            <Link
              href={session ? '/dashboard' : '/login'}
              className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-amber-200 transition-all hover:shadow-lg hover:shadow-amber-200 active:scale-95 flex items-center gap-2"
            >
              {session ? 'Buka Dashboard' : 'Mulai Gratis'}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
            <Link
              href="/pricing"
              className="px-6 py-3 bg-card border hover:bg-card-hover text-primary text-sm font-semibold rounded-xl transition-all hover:shadow-sm active:scale-95"
              style={{ borderColor: 'var(--border-default)' }}
            >
              Lihat Harga
            </Link>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 mt-12 flex-wrap pointer-events-auto">
            {STATS.map(s => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-bold text-primary">{s.value}</p>
                <p className="text-xs text-muted mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES SECTION ──────────────────────────────────────── */}
      <section className="py-20 px-4 bg-page border-y" style={{ borderColor: 'var(--border-default)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-primary mb-2">Semua yang Anda Butuhkan</h2>
            <p className="text-sm text-muted">Fitur lengkap untuk menjaga komentar kanal Anda tetap bersih</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-card rounded-2xl border p-5 hover:border-[var(--border-hover)] transition-all group" style={{ borderColor: 'var(--border-default)' }}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${colorMap[f.color]}`}>
                  {f.icon}
                </div>
                <h3 className="text-sm font-semibold text-primary mb-1">{f.title}</h3>
                <p className="text-xs text-muted leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-primary mb-2">Cara Kerja Sistem</h2>
            <p className="text-sm text-muted">Tiga langkah sederhana untuk penyaringan otomatis</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '01', title: 'Login dengan Google', desc: 'Hubungkan akun YouTube Anda menggunakan OAuth Google. Aman dan tidak menyimpan password.' },
              { step: '02', title: 'Pilih Video', desc: 'Pilih satu atau beberapa video dari kanal Anda. Sistem akan mengambil semua komentar.' },
              { step: '03', title: 'AI Bekerja', desc: 'Sistem AI menganalisis setiap komentar. Iklan judi ditandai dan dapat disaring otomatis.' },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="text-5xl font-black mb-3" style={{ color: 'var(--border-default)' }}>{item.step}</div>
                <h3 className="text-sm font-semibold text-primary mb-1.5">{item.title}</h3>
                <p className="text-xs text-secondary leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BOTTOM ────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-amber-600">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Siap Membersihkan Komentar Anda?</h2>
          <p className="text-sm text-amber-100 mb-8">Mulai gratis sekarang. Tidak perlu kartu kredit.</p>
          <Link
            href={session ? '/dashboard' : '/login'}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-amber-700 text-sm font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 active:scale-95"
          >
            {session ? 'Buka Dashboard →' : 'Mulai Gratis — Login dengan Google'}
          </Link>
        </div>
      </section>

    </div>
  );
}
