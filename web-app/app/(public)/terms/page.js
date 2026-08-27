'use client';

import Link from 'next/link';

const SECTIONS = [
  {
    id: '01',
    title: 'Pernyataan Kepatuhan Layanan YouTube (YouTube Terms of Service)',
    content: (
      <div className="space-y-4">
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/30 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200 mb-2 flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            Kepatuhan Wajib Syarat Layanan YouTube (YouTube ToS Compliance)
          </h3>
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 leading-relaxed mb-3">
            Dengan mengakses atau menggunakan aplikasi Athena Shield (Klien API / API Client), Anda secara eksplisit menyatakan menyetujui dan terikat secara hukum oleh Syarat Layanan YouTube (YouTube Terms of Service).
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
            By using Athena Shield (the API Client), users are agreeing to be bound by the YouTube Terms of Service at{' '}
            <a
              href="https://www.youtube.com/t/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold underline text-amber-900 dark:text-amber-200 hover:text-amber-600"
            >
              https://www.youtube.com/t/terms
            </a>.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: '02',
    title: 'Deskripsi Layanan & Lisensi Penggunaan',
    content: (
      <p className="text-sm text-secondary leading-relaxed">
        Athena Shield menyediakan platform otomatisasi moderasi komentar YouTube berbasis kecerdasan buatan (IndoBERT NLP). Pengguna diberikan lisensi non-eksklusif, terbatas, dan dapat dicabut kembali untuk mengelola komentar pada kanal YouTube milik pribadi atau kanal yang diotorisasi secara sah via Google OAuth.
      </p>
    ),
  },
  {
    id: '03',
    title: 'Penggunaan API YouTube & Kunci API Mandiri (BYOK)',
    content: (
      <div className="space-y-3 text-sm text-secondary leading-relaxed">
        <p>
          Layanan Athena Shield memanfaatkan YouTube API Services untuk mengambil daftar komentar dan mengeksekusi tindakan moderasi (menahan/menghapus komentar spam judi online).
        </p>
        <ul className="list-disc ml-5 space-y-1 text-xs text-muted">
          <li>Pengguna dilarang menyalahgunakan API untuk tindakan spam, pemindaian ilegal, atau manipulasi data YouTube.</li>
          <li>Untuk pengguna Paket Enterprise yang memanfaatkan Kunci API GCP Mandiri (BYOK), pengguna bertanggung jawab penuh atas keamanan dan kepatuhan penggunaan Kunci API pribadi masing-masing pada Google Cloud Platform.</li>
        </ul>
      </div>
    ),
  },
  {
    id: '04',
    title: 'Batasan Tanggung Jawab & Penolakan Garansi',
    content: (
      <p className="text-sm text-secondary leading-relaxed">
        Layanan ini disediakan &quot;sebagaimana adanya&quot; (AS IS) untuk membantu kreator memoderasi komentar. Pengembang Athena Shield tidak bertanggung jawab atas kerugian tidak langsung, kesalahan klasifikasi AI yang terjadi pada tingkat kepercayaan rendah, atau tindakan penangguhan dari pihak pihak ketiga.
      </p>
    ),
  },
];

export default function TermsOfService() {
  const lastUpdated = '26 Agustus 2026';

  return (
    <div className="relative min-h-screen bg-page text-secondary overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-indigo-100/40 dark:bg-indigo-950/10 rounded-full blur-3xl" />
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
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-full text-xs font-medium text-indigo-700 dark:text-indigo-400 mb-5">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
            Ketentuan Penggunaan Resmi
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-primary leading-tight mb-3">
            Syarat & Ketentuan Layanan
          </h1>
          <p className="text-sm text-muted">
            Terakhir diperbarui:{' '}
            <span className="font-medium text-secondary">{lastUpdated}</span>
          </p>
        </div>

        {/* Konten Utama */}
        <div className="space-y-10">
          {SECTIONS.map((section) => (
            <section key={section.id}>
              <div className="flex items-center gap-3 mb-5">
                <div className="text-4xl font-black text-indigo-500/50 dark:text-indigo-400/40 select-none">
                  {section.id}
                </div>
                <h2 className="text-lg font-bold text-primary">{section.title}</h2>
              </div>
              {section.content}
            </section>
          ))}
        </div>

        {/* Kontak */}
        <div className="mt-12 bg-card rounded-2xl border p-6" style={{ borderColor: 'var(--border-default)' }}>
          <h2 className="text-sm font-bold text-primary mb-1">Pertanyaan Mengenai Ketentuan Layanan</h2>
          <p className="text-xs text-muted mb-2">
            Jika ada pertanyaan terkait syarat dan ketentuan ini, hubungi kami di:
          </p>
          <a href="mailto:filamsi.mghifary@gmail.com" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
            filamsi.mghifary@gmail.com
          </a>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t text-center text-xs text-muted" style={{ borderColor: 'var(--border-default)' }}>
          <p>© 2026 Athena Shield. Mematuhi YouTube API Services Developer Policies.</p>
        </div>
      </div>
    </div>
  );
}
