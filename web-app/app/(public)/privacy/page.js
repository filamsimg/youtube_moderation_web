'use client';

import Link from 'next/link';

const SECTIONS = [
  {
    id: '01',
    title: 'Pendahuluan',
    content: (
      <p className="text-sm text-secondary leading-relaxed">
        Selamat datang di <strong className="font-semibold text-primary">Athena Shield</strong>. Kami berkomitmen
        penuh untuk melindungi privasi dan data pribadi Anda. Kebijakan Privasi ini menjelaskan bagaimana
        kami mengumpulkan, menggunakan, menyimpan, dan melindungi informasi Anda saat menggunakan aplikasi
        moderasi komentar YouTube berbasis kecerdasan buatan (AI) kami.
      </p>
    ),
  },
  {
    id: '02',
    title: 'Informasi yang Kami Kumpulkan',
    content: (
      <div className="space-y-4">
        <p className="text-sm text-secondary leading-relaxed">
          Kami mengumpulkan informasi tertentu saat Anda masuk menggunakan akun Google dan memberikan
          otorisasi akses ke YouTube Data API:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              color: 'amber',
              title: 'Data Akun Google',
              subtitle: 'Google OAuth',
              items: [
                'Alamat email untuk identifikasi akun dan komunikasi penting.',
                'Nama lengkap dan foto profil untuk personalisasi antarmuka.',
                'Token otentikasi aman untuk memelihara sesi koneksi Anda.',
              ],
            },
            {
              color: 'violet',
              title: 'Data YouTube API',
              subtitle: 'YouTube Data v3',
              items: [
                'Metadata channel YouTube (nama, ID, dan foto profil channel).',
                'Daftar video publik agar Anda dapat memilih video untuk dimoderasi.',
                'Konten komentar dari video pilihan untuk dianalisis oleh AI.',
              ],
            },
          ].map((card) => (
            <div
              key={card.title}
              className="bg-card rounded-2xl border p-5 hover:border-[var(--border-hover)] transition-all"
              style={{ borderColor: 'var(--border-default)' }}
            >
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold mb-3 ${
                card.color === 'amber'
                  ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400'
                  : 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400'
              }`}>
                {card.subtitle}
              </div>
              <h3 className="text-sm font-semibold text-primary mb-3">{card.title}</h3>
              <ul className="space-y-2">
                {card.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs text-muted leading-relaxed">
                    <span className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${
                      card.color === 'amber' ? 'bg-amber-500' : 'bg-violet-500'
                    }`} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Data tambahan yang juga dikumpulkan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              color: 'rose',
              title: 'Data Transaksi & Pembayaran',
              subtitle: 'Midtrans Gateway',
              items: [
                'Nominal pembayaran dan paket langganan yang dipilih.',
                'Metode pembayaran (bank transfer, e-wallet, dll) — diproses oleh Midtrans.',
                'Status dan riwayat transaksi untuk keperluan pembukuan akun Anda.',
              ],
            },
            {
              color: 'emerald',
              title: 'Data Preferensi & Pengaturan',
              subtitle: 'User Settings',
              items: [
                'Preferensi tema (gelap/terang) yang Anda pilih.',
                'Konfigurasi moderasi: threshold AI, interval polling, dan mode batch.',
                'Pengaturan notifikasi dan tindakan otomatis (auto-tahan/auto-hapus).',
              ],
            },
          ].map((card) => (
            <div
              key={card.title}
              className="bg-card rounded-2xl border p-5 hover:border-[var(--border-hover)] transition-all"
              style={{ borderColor: 'var(--border-default)' }}
            >
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold mb-3 ${
                card.color === 'rose'
                  ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400'
                  : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
              }`}>
                {card.subtitle}
              </div>
              <h3 className="text-sm font-semibold text-primary mb-3">{card.title}</h3>
              <ul className="space-y-2">
                {card.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs text-muted leading-relaxed">
                    <span className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${
                      card.color === 'rose' ? 'bg-rose-500' : 'bg-emerald-500'
                    }`} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: '03',
    title: 'Bagaimana Kami Menggunakan Informasi Anda',
    content: (
      <div className="space-y-3">
        <p className="text-sm text-secondary leading-relaxed">
          Data Anda hanya diproses untuk tujuan yang spesifik dan terbatas:
        </p>
        {[
          {
            label: 'A',
            title: 'Penyediaan Layanan Moderasi',
            desc: 'Menganalisis komentar video Anda secara otomatis untuk mendeteksi dan menyaring komentar yang terindikasi promosi ilegal, spam, atau judi online.',
          },
          {
            label: 'B',
            title: 'Audit Log Tindakan Moderasi',
            desc: 'Menyimpan riwayat tindakan moderasi (teks komentar, label AI, dan aksi yang diambil) di database Anda pribadi agar Anda dapat meninjau dan menelusuri semua tindakan yang telah dilakukan sistem.',
          },
          {
            label: 'C',
            title: 'Pengelolaan Kuota & Langganan',
            desc: 'Melacak konsumsi kuota API dan mengelola status langganan (FREE/PRO/ENTERPRISE) termasuk pemrosesan pembayaran melalui penyedia layanan Midtrans.',
          },
          {
            label: 'D',
            title: 'Personalisasi Pengalaman Pengguna',
            desc: 'Menyimpan preferensi dan pengaturan moderasi Anda (threshold AI, interval polling, tema tampilan) agar pengalaman penggunaan tetap konsisten di setiap sesi.',
          },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-start gap-4 bg-card rounded-2xl border p-5 hover:border-[var(--border-hover)] transition-all"
            style={{ borderColor: 'var(--border-default)' }}
          >
            <div className="w-7 h-7 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400">{item.label}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-primary mb-1">{item.title}</p>
              <p className="text-xs text-muted leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: '04',
    title: 'Perlindungan & Penyimpanan Data',
    content: (
      <div className="space-y-3">
        {[
          {
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            ),
            color: 'emerald',
            title: 'Enkripsi & Keamanan Database',
            desc: 'Semua data akun, token, dan riwayat tindakan disimpan dalam database Supabase yang terenkripsi dengan mekanisme Row-Level Security (RLS) — setiap pengguna hanya dapat mengakses datanya sendiri.',
          },
          {
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
              </svg>
            ),
            color: 'amber',
            title: 'Penyimpanan Riwayat Moderasi',
            desc: 'Komentar yang Anda moderasi (tahan, hapus, atau setujui) disimpan sebagai audit log pribadi di akun Anda, mencakup teks komentar, label AI, dan skor kepercayaan. Komentar yang tidak dikenai tindakan tidak disimpan. Data riwayat tersimpan selama akun Anda aktif.',
          },
          {
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
              </svg>
            ),
            color: 'rose',
            title: 'Keamanan Data Pembayaran',
            desc: 'Kami tidak pernah menyimpan nomor kartu kredit atau data rekening bank Anda. Seluruh proses pembayaran dikelola sepenuhnya oleh Midtrans selaku penyedia payment gateway bersertifikat PCI-DSS.',
          },
        ].map((item) => (
          <div
            key={item.title}
            className="flex items-start gap-4 bg-card rounded-2xl border p-5 hover:border-[var(--border-hover)] transition-all"
            style={{ borderColor: 'var(--border-default)' }}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
              item.color === 'emerald'
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                : item.color === 'amber'
                ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400'
                : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400'
            }`}>
              {item.icon}
            </div>
            <div>
              <p className="text-sm font-semibold text-primary mb-1">{item.title}</p>
              <p className="text-xs text-muted leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: '05',
    title: 'Layanan Pihak Ketiga',
    content: (
      <div className="space-y-3">
        <p className="text-sm text-secondary leading-relaxed">
          Aplikasi ini mengintegrasikan layanan pihak ketiga terpercaya untuk operasional tertentu:
        </p>
        {[
          {
            color: 'indigo',
            name: 'Google OAuth & YouTube Data API',
            role: 'Autentikasi & Sumber Data',
            desc: 'Digunakan untuk login dan pengambilan data komentar YouTube. Tunduk pada Kebijakan Privasi Google.',
            link: 'https://policies.google.com/privacy',
            linkText: 'Kebijakan Privasi Google',
          },
          {
            color: 'violet',
            name: 'Supabase',
            role: 'Penyimpanan Database',
            desc: 'Infrastruktur database kami. Data disimpan di server Supabase dengan enkripsi dan RLS.',
            link: 'https://supabase.com/privacy',
            linkText: 'Kebijakan Privasi Supabase',
          },
          {
            color: 'rose',
            name: 'Midtrans',
            role: 'Pemroses Pembayaran',
            desc: 'Mengelola transaksi berlangganan. Midtrans bersertifikat PCI-DSS dan tidak berbagi data Anda dengan kami selain status pembayaran.',
            link: 'https://midtrans.com/id/privacy-policy',
            linkText: 'Kebijakan Privasi Midtrans',
          },
        ].map((item) => (
          <div
            key={item.name}
            className="flex items-start gap-4 bg-card rounded-2xl border p-5 hover:border-[var(--border-hover)] transition-all"
            style={{ borderColor: 'var(--border-default)' }}
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 text-xs font-black ${
              item.color === 'indigo'
                ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400'
                : item.color === 'violet'
                ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400'
                : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400'
            }`}>
              {item.name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <p className="text-sm font-semibold text-primary">{item.name}</p>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  item.color === 'indigo'
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400'
                    : item.color === 'violet'
                    ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400'
                    : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400'
                }`}>{item.role}</span>
              </div>
              <p className="text-xs text-muted leading-relaxed mb-2">{item.desc}</p>
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline"
              >
                {item.linkText} →
              </a>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: '06',
    title: 'Kebijakan Tanpa Berbagi Data',
    content: (
      <div className="space-y-3">
        <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-500/20 p-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-emerald-700 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">Jaminan Privasi</span>
          </div>
          <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200 leading-relaxed mb-2">
            Athena Shield tidak akan pernah menjual, menyewakan, membagikan, atau memperdagangkan data
            pribadi maupun data YouTube Anda kepada pihak ketiga mana pun untuk tujuan komersial.
          </p>
          <p className="text-xs text-emerald-700/80 dark:text-emerald-300/70 leading-relaxed">
            Data Anda tidak akan pernah digunakan untuk kepentingan penargetan iklan, riset komersial pihak
            ketiga, pemasaran, atau tujuan lain apa pun di luar fungsi inti moderasi komentar yang Anda
            aktifkan secara sadar. Integrasi dengan layanan pihak ketiga (Google, Supabase, Midtrans)
            hanya digunakan untuk operasional yang Anda otorisasi dan tunduk pada kebijakan privasi masing-masing.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: '07',
    title: 'Hak Anda & Penghapusan Data',
    content: (
      <div className="space-y-3">
        <p className="text-sm text-secondary leading-relaxed">
          Anda memiliki kendali penuh atas data dan otorisasi yang Anda berikan:
        </p>
        {[
          {
            title: 'Cabut Akses Kapan Saja',
            desc: (
              <>
                Anda dapat memutuskan hubungan akses YouTube API ke aplikasi kami kapan saja melalui{' '}
                <a
                  href="https://myaccount.google.com/permissions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                >
                  Google Security Settings
                </a>. Setelah dicabut, sistem tidak lagi dapat mengakses data YouTube Anda.
              </>
            ),
          },
          {
            title: 'Penghapusan Data Permanen',
            desc: (
              <>
                Untuk meminta penghapusan seluruh akun dan data terkait (riwayat moderasi, preferensi,
                dan data transaksi), kirimkan permintaan ke{' '}
                <a
                  href="mailto:filamsi.mghifary@gmail.com"
                  className="font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                >
                  filamsi.mghifary@gmail.com
                </a>
                {' '}dengan subjek <strong className="font-semibold text-primary">&quot;Hapus Data Akun&quot;</strong>.
                Data akan dihapus secara permanen dalam <strong className="font-semibold text-primary">2×24 jam</strong>.
              </>
            ),
          },
          {
            title: 'Retensi Data',
            desc: (
              <>
                Data riwayat moderasi, preferensi, dan log kuota disimpan selama akun Anda aktif. Setelah
                penghapusan akun dikonfirmasi, seluruh data dihapus permanen dari sistem kami dan tidak
                dapat dipulihkan.
              </>
            ),
          },
        ].map((item) => (
          <div
            key={item.title}
            className="bg-card rounded-2xl border p-5 hover:border-[var(--border-hover)] transition-all"
            style={{ borderColor: 'var(--border-default)' }}
          >
            <p className="text-sm font-semibold text-primary mb-1.5">{item.title}</p>
            <p className="text-xs text-muted leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    ),
  },
];

export default function PrivacyPolicy() {
  const lastUpdated = '24 Juni 2026';

  return (
    <div className="relative min-h-screen bg-page text-secondary overflow-hidden">

      {/* Background blobs — selaras dengan landing page */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-amber-100/50 dark:bg-amber-950/10 rounded-full blur-3xl" />
        <div className="absolute top-[40%] right-0 w-[350px] h-[350px] bg-indigo-100/30 dark:bg-indigo-950/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-16">

        {/* Tombol Kembali */}
        <div className="mb-10">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-primary transition-colors group"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Kembali ke Beranda
          </Link>
        </div>

        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-full text-xs font-medium text-amber-700 dark:text-amber-400 mb-5">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
            Dokumen Resmi
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-primary leading-tight mb-3">
            Kebijakan Privasi
          </h1>
          <p className="text-sm text-muted">
            Terakhir diperbarui:{' '}
            <span className="font-medium text-secondary">{lastUpdated}</span>
          </p>
        </div>

        {/* Kotak Kepatuhan Google API */}
        <div className="mb-10 bg-card rounded-2xl border p-6" style={{ borderColor: 'var(--border-default)' }}>
          <div className="flex items-start gap-4">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-primary uppercase tracking-wide">Kepatuhan Google API</span>
                <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 rounded-full text-[10px] font-semibold">Wajib</span>
              </div>
              <p className="text-xs text-muted leading-relaxed italic border-l-2 border-indigo-200 dark:border-indigo-500/30 pl-3">
                Athena Shield&apos;s use and transfer to any other app of information received from Google APIs
                will adhere to the{' '}
                <a
                  href="https://developers.google.com/terms/api-services-user-data-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline not-italic"
                >
                  Google API Services User Data Policy
                </a>
                , including the Limited Use requirements.
              </p>
              <p className="text-xs text-muted leading-relaxed">
                Penggunaan dan transfer informasi yang diterima dari Google API oleh Athena Shield ke aplikasi lain
                akan sepenuhnya mematuhi Kebijakan Data Pengguna Layanan API Google, termasuk persyaratan
                Penggunaan Terbatas (Limited Use).
              </p>
            </div>
          </div>
        </div>

        {/* Konten Utama Kebijakan */}
        <div className="space-y-10">
          {SECTIONS.map((section) => (
            <section key={section.id}>
              <div className="flex items-center gap-3 mb-5">
                <div className="text-4xl font-black text-amber-500/60 dark:text-amber-200 select-none">
                  {section.id}
                </div>
                <h2 className="text-lg font-bold text-primary">{section.title}</h2>
              </div>
              {section.content}
            </section>
          ))}
        </div>

        {/* Kontak Pengembang */}
        <div className="mt-12 bg-card rounded-2xl border p-6 hover:border-[var(--border-hover)] transition-all" style={{ borderColor: 'var(--border-default)' }}>
          <div className="flex items-start gap-4">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-amber-700 dark:text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold text-primary mb-1">Hubungi Pengembang</h2>
              <p className="text-xs text-muted mb-3 leading-relaxed">
                Jika Anda memiliki pertanyaan, saran, atau keluhan terkait Kebijakan Privasi ini, silakan
                hubungi kami:
              </p>
              <div className="space-y-1">
                <p className="text-xs text-secondary">
                  <span className="text-muted">Pengembang: </span>
                  <span className="font-medium">Filamsi M. Ghifary</span>
                </p>
                <p className="text-xs text-secondary">
                  <span className="text-muted">Email: </span>
                  <a href="mailto:filamsi.mghifary@gmail.com" className="font-medium text-amber-600 dark:text-amber-400 hover:underline">
                    filamsi.mghifary@gmail.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t text-center text-xs text-muted" style={{ borderColor: 'var(--border-default)' }}>
          <p>© 2026 Athena Shield. Seluruh hak cipta dilindungi. Kepatuhan dipelihara di bawah pedoman Google API Services.</p>
        </div>

      </div>
    </div>
  );
}
