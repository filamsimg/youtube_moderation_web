'use client';

import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="relative min-h-screen bg-page text-secondary overflow-hidden py-16 px-4 sm:px-6 lg:px-8">
      {/* Background radial glowing effects */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-500/10 dark:bg-indigo-950/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-amber-500/10 dark:bg-amber-950/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto space-y-10 animate-fade-in-up">
        {/* Tombol Kembali */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-primary transition-colors group"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Kembali ke Beranda
          </Link>
        </div>

        {/* ── Page Header ── */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-2 shadow-sm">
            Tentang Aplikasi
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-primary tracking-tight">
            Tentang Athena Shield
          </h1>
          <p className="text-sm text-secondary max-w-xl mx-auto leading-relaxed">
            Athena Shield adalah aplikasi moderasi komentar otomatis bertenaga AI yang dirancang untuk mendeteksi dan menyaring komentar bermuatan promosi judi online secara real-time pada platform YouTube.
          </p>
        </div>

        {/* ── Grid Informasi Utama ── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Card Kiri: Identitas Peneliti (5 cols) */}
          <div className="md:col-span-5 space-y-6">
            <div className="bg-card border border-[var(--border-default)] rounded-3xl p-6 relative overflow-hidden shadow-sm transition-all hover:border-[var(--border-hover)]">
              {/* Decorative badge */}
              <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-indigo-500/5 blur-xl pointer-events-none" />

              <h2 className="text-sm font-bold text-primary uppercase tracking-wider mb-4 border-b border-[var(--border-default)]/60 pb-2">
                Profil Pengembang
              </h2>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  {/* Mock profile photo placeholder using modern initials badge */}
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white text-lg font-black shadow-md shadow-indigo-500/20">
                    FMG
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-primary">Filamsi Mabda Ghifary</h3>
                    <p className="text-[11px] text-muted font-medium">Mahasiswa & Pengembang</p>
                  </div>
                </div>

                <div className="space-y-3 pt-2 divide-y divide-[var(--border-default)]/40 text-xs">
                  <div className="py-2.5 flex justify-between items-center">
                    <span className="text-muted">NIM / NPM</span>
                    <span className="font-semibold text-primary">22090002</span>
                  </div>
                  <div className="py-2.5 flex justify-between items-center">
                    <span className="text-muted">Program Studi</span>
                    <span className="font-semibold text-primary">Teknik Informatika</span>
                  </div>
                  <div className="py-2.5 flex justify-between items-center">
                    <span className="text-muted">Fakultas</span>
                    <span className="font-semibold text-primary">Sekolah Vokasi</span>
                  </div>
                  <div className="py-2.5 flex justify-between items-center">
                    <span className="text-muted">Universitas</span>
                    <span className="font-semibold text-primary">Universitas Harkat Negeri</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Mitra Akademik & Logo */}
            <div className="bg-card border border-[var(--border-default)] rounded-3xl p-6 flex flex-col items-center justify-center text-center gap-4 shadow-sm">
              <div className="bg-white p-4 rounded-2xl shadow-md border border-slate-100 flex items-center justify-center w-40 h-20 transition-transform hover:scale-105">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo-uhn.png"
                  alt="Logo Universitas Harkat Negeri"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h3 className="text-xs font-bold text-primary uppercase tracking-wider">Universitas Harkat Negeri</h3>
                <p className="text-[10px] text-muted mt-1 leading-relaxed">
                  Sekolah Vokasi, Program Studi Teknik Informatika
                </p>
              </div>
            </div>
          </div>

          {/* Card Kanan: Detail Tugas Akhir (7 cols) */}
          <div className="md:col-span-7 space-y-6">
            <div className="bg-card border border-[var(--border-default)] rounded-3xl p-6 relative overflow-hidden shadow-sm transition-all hover:border-[var(--border-hover)]">
              <h2 className="text-sm font-bold text-primary uppercase tracking-wider mb-4 border-b border-[var(--border-default)]/60 pb-2">
                Detail Riset & Skripsi
              </h2>

              <div className="space-y-4">
                <div>
                  <h4 className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1">Judul Penelitian</h4>
                  <p className="text-xs sm:text-sm font-bold text-primary leading-relaxed">
                    Athena Shield: Aplikasi Web Moderasi Otomatis Komentar Judi Online pada YouTube secara Real-time
                  </p>
                </div>

                <div className="pt-2 space-y-3">
                  <h4 className="text-[10px] text-muted font-bold uppercase tracking-wider">Metodologi & Teknologi Sistem</h4>
                  <div className="space-y-2.5">
                    {[
                      {
                        step: '1',
                        title: 'YouTube API Integration',
                        desc: 'Mengambil data komentar secara realtime dan mengirim status moderasi (tahan/hapus) ke server YouTube secara terenkripsi menggunakan YouTube Data API v3.'
                      },
                      {
                        step: '2',
                        title: 'Deep Learning Model (IndoBERT)',
                        desc: 'Model klasifikasi berbasis Transformer (IndoBERT) yang telah disesuaikan (fine-tuned) untuk mengenali pola kata, variasi teks manipulatif, dan tautan mengarah judi online.'
                      },
                      {
                        step: '3',
                        title: 'Sistem Kuota & Webhook Pembayaran',
                        desc: 'Pelacakan penggunaan token/unit YouTube API secara real-time yang terintegrasi dengan payment gateway Midtrans untuk simulasi langganan.'
                      }
                    ].map((item) => (
                      <div key={item.step} className="flex gap-3 items-start">
                        <div className="w-5 h-5 rounded-lg bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center shrink-0 text-[10px] font-bold text-indigo-500 mt-0.5">
                          {item.step}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-primary">{item.title}</p>
                          <p className="text-[10px] text-muted mt-0.5 leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer Akademik ── */}
        <div className="pt-8 border-t border-[var(--border-default)] text-center text-[10px] text-muted">
          <p>Athena Shield dikembangkan sebagai proyek Tugas Akhir oleh mahasiswa Universitas Harkat Negeri.</p>
          <p className="mt-1">© 2026 Filamsi Mabda Ghifary · Universitas Harkat Negeri · Seluruh Hak Cipta Dilindungi Undang-Undang.</p>
        </div>
      </div>
    </div>
  );
}
