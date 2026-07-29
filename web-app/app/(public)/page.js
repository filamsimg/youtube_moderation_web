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
    title: 'Deteksi AI Berbasis IndoBERT',
    desc: 'Model AI yang dilatih khusus pada bahasa Indonesia untuk mengenali pola komentar promosi judi online dengan akurasi tinggi.',
    color: 'amber',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    title: 'Moderasi Batch & Satu-Satu',
    desc: 'Pilih banyak komentar sekaligus atau tangani satu per satu untuk tahan, hapus, atau setujui dengan satu klik.',
    color: 'emerald',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
      </svg>
    ),
    title: 'Analitik & Grafik Interaktif',
    desc: 'Dashboard dengan grafik Pie dan Bar berbasis Recharts untuk lihat distribusi komentar spam, sentimen, dan tren per video.',
    color: 'amber',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Polling Otomatis Latar Belakang',
    desc: 'Komentar baru otomatis dianalisis secara berkala (kustom 30s–10m) tanpa perlu refresh sistem bekerja sendiri.',
    color: 'rose',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
      </svg>
    ),
    title: 'Threshold AI yang Dapat Disesuaikan',
    desc: 'Atur sensitivitas deteksi sesuai kebutuhan dengan menentukan batas persentase keyakinan AI untuk tindakan tahan atau hapus otomatis.',
    color: 'violet',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    title: 'Riwayat Tindakan Terfilter',
    desc: 'Lacak semua tindakan moderasi yang pernah dilakukan dengan filter berdasarkan aksi, cari komentar tertentu, dengan paginasi.',
    color: 'emerald',
  },
];

const STATS = [
  { value: '95%+', label: 'Akurasi Deteksi AI' },
  { value: '< 5s', label: 'Waktu Analisis per Komentar' },
  { value: '3', label: 'Sentimen Terklasifikasi' },
];


const colorMap = {
  amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400',
  emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  rose: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400',
  violet: 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400',
};

export default function LandingPage() {
  const { data: session } = useSession();
  const router = useRouter();

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* ── Background Effects ── */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-amber-100/60 dark:bg-amber-950/10 rounded-full blur-3xl" />
        <div className="absolute top-[35%] right-0 w-[400px] h-[400px] bg-purple-100/40 dark:bg-purple-950/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[20%] left-0 w-[500px] h-[500px] bg-indigo-100/30 dark:bg-indigo-950/5 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-mesh-dark opacity-[0.06] dark:opacity-30 dark:mix-blend-screen" />
        <KineticGrid />
      </div>

      <div className="relative z-10">

        {/* ── HERO SECTION ──────────────────────────────────────────── */}
        <section className="relative pt-20 pb-24 px-4 text-center">

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
              di kanal YouTube Anda cepat, akurat, dan tanpa batas manual.
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
        <section className="py-20 px-4 bg-transparent border-y" style={{ borderColor: 'var(--border-default)' }}>
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
              <p className="text-sm text-muted">Empat langkah sederhana dari login hingga komentar bersih</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { step: '01', title: 'Login dengan Google', desc: 'Hubungkan akun YouTube melalui OAuth Google. Aman, terenkripsi, dan tanpa menyimpan password.' },
                { step: '02', title: 'Pilih Video', desc: 'Pilih satu atau beberapa video dari kanal Anda. Sistem mengambil komentar secara otomatis.' },
                { step: '03', title: 'AI Menganalisis', desc: 'Model IndoBERT mengklasifikasi setiap komentar dengan deteksi spam judol sekaligus sentimen penonton.' },
                { step: '04', title: 'Ambil Tindakan', desc: 'Tahan, hapus, atau setujui komentar secara batch. Polling otomatis terus memantau komentar baru.' },
              ].map((item) => (
                <div key={item.step} className="relative">
                  <div className="text-5xl font-black mb-3 text-amber-500/60 dark:text-amber-200 select-none">{item.step}</div>
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
    </div>
  );
}
