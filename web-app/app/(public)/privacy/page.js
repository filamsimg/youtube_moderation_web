'use client';

import Link from 'next/link';

export default function PrivacyPolicy() {
  const lastUpdated = '24 Juni 2026';

  return (
    <div className="min-h-screen bg-page text-secondary">
      {/* Efek pencahayaan latar belakang dekoratif */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[300px] bg-gradient-to-b from-indigo-900/10 via-transparent to-transparent pointer-events-none" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 relative z-10">
        
        {/* Tombol Kembali */}
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-xs text-muted hover:text-primary transition-colors group"
          >
            <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Kembali ke Beranda
          </Link>
        </div>

        {/* Header Halaman */}
        <div className="border-b pb-8 mb-10" style={{ borderColor: 'var(--border-default)' }}>
          <h1 className="text-3xl font-bold text-primary mb-3 tracking-tight">
            Kebijakan Privasi
          </h1>
          <p className="text-xs text-muted">
            Terakhir Diperbarui: <span className="font-semibold text-secondary">{lastUpdated}</span>
          </p>
        </div>

        {/* Kotak Sorotan Kepatuhan Google API (Sangat Penting untuk Verifikasi) */}
        <div className="mb-10 p-5 rounded-xl border bg-indigo-950/20 border-indigo-500/30">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            <div>
              <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2">
                Kepatuhan Kebijakan Data Pengguna Layanan Google API
              </h4>
              <p className="text-xs leading-relaxed text-indigo-200/90 mb-2 italic bg-indigo-950/40 p-3 rounded border border-indigo-500/10">
                Athena Shield&apos;s use and transfer to any other app of information received from Google APIs will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="underline hover:text-white transition-colors">Google API Services User Data Policy</a>, including the Limited Use requirements.
              </p>
              <p className="text-xs leading-relaxed text-indigo-200/80">
                Penggunaan dan transfer informasi yang diterima dari Google API oleh Athena Shield ke aplikasi lain akan sepenuhnya mematuhi Kebijakan Data Pengguna Layanan API Google, termasuk persyaratan Penggunaan Terbatas (Limited Use).
              </p>
            </div>
          </div>
        </div>

        {/* Konten Kebijakan Privasi */}
        <div className="space-y-8 text-sm leading-relaxed text-secondary">

          {/* Bagian 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
              <span className="text-indigo-400 text-xs font-semibold">01.</span>
              Pendahuluan
            </h2>
            <p>
              Selamat datang di <strong>Athena Shield</strong>. Kami berkomitmen penuh untuk melindungi privasi dan data pribadi Anda. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, menyimpan, dan melindungi informasi Anda saat Anda menggunakan aplikasi moderasi komentar YouTube berbasis kecerdasan buatan (AI) kami.
            </p>
          </section>

          {/* Bagian 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
              <span className="text-indigo-400 text-xs font-semibold">02.</span>
              Informasi yang Kami Kumpulkan
            </h2>
            <p>
              Kami mengumpulkan informasi tertentu ketika Anda masuk menggunakan akun Google Anda dan memberikan otorisasi akses ke YouTube Data API:
            </p>
            
            <div className="space-y-4 mt-2">
              <div className="p-4 rounded-lg bg-card border" style={{ borderColor: 'var(--border-default)' }}>
                <h3 className="font-semibold text-primary text-xs uppercase mb-2 text-indigo-400">1. Data Akun Google (Google OAuth)</h3>
                <ul className="list-disc list-inside space-y-1.5 text-xs text-secondary/90">
                  <li>Alamat email untuk identifikasi akun, otentikasi sesi masuk, dan komunikasi penting.</li>
                  <li>Nama lengkap dan foto profil untuk personalisasi tampilan antarmuka pengguna di dashboard.</li>
                  <li>Token otentikasi aman (access token & refresh token) untuk memelihara sesi koneksi Anda.</li>
                </ul>
              </div>
              
              <div className="p-4 rounded-lg bg-card border" style={{ borderColor: 'var(--border-default)' }}>
                <h3 className="font-semibold text-primary text-xs uppercase mb-2 text-indigo-400">2. Data YouTube API</h3>
                <ul className="list-disc list-inside space-y-1.5 text-xs text-secondary/90">
                  <li>Metadata channel YouTube Anda (seperti nama channel, ID channel, dan foto profil channel).</li>
                  <li>Daftar video publik pada channel Anda agar Anda dapat memilih video mana yang akan dimoderasi.</li>
                  <li>Konten komentar dari video yang Anda pilih untuk diproses oleh kecerdasan buatan (AI) kami.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Bagian 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
              <span className="text-indigo-400 text-xs font-semibold">03.</span>
              Bagaimana Kami Menggunakan Informasi Anda
            </h2>
            <p>
              Kami memproses data Anda dengan tujuan yang sangat spesifik, terbatas, dan hanya demi kepentingan penyediaan layanan kepada Anda:
            </p>
            <ul className="list-disc list-inside space-y-2 text-xs pl-2">
              <li><strong>Penyediaan Layanan Moderasi:</strong> Menganalisis konten komentar video Anda secara otomatis untuk mendeteksi dan menyaring komentar yang terindikasi promosi ilegal, spam, atau judi online.</li>
              <li><strong>Audit Tindakan Keamanan:</strong> Menyediakan riwayat log tindakan moderasi (audit log) di dashboard pribadi Anda agar Anda tetap memiliki kendali penuh atas apa yang dilakukan oleh sistem kami terhadap komentar di channel Anda.</li>
              <li><strong>Pengelolaan Limitasi Kuota:</strong> Melacak konsumsi kuota API demi menjaga stabilitas operasional aplikasi.</li>
            </ul>
          </section>

          {/* Bagian 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
              <span className="text-indigo-400 text-xs font-semibold">04.</span>
              Perlindungan & Penyimpanan Data
            </h2>
            <p>
              Kami menerapkan langkah-langkah keamanan tingkat tinggi untuk melindungi data Anda:
            </p>
            <ul className="list-disc list-inside space-y-2 text-xs pl-2">
              <li>Semua kredensial dan token akses dari Google disimpan dalam keadaan terenkripsi di database kami yang aman (didukung oleh infrastruktur aman dari Supabase).</li>
              <li>Kami **tidak menyimpan konten komentar YouTube Anda secara permanen**. Komentar dibaca secara *real-time* dari YouTube API hanya untuk dianalisis oleh AI kami, dan akan langsung dihapus dari memori server segera setelah proses klasifikasi selesai.</li>
            </ul>
          </section>

          {/* Bagian 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
              <span className="text-indigo-400 text-xs font-semibold">05.</span>
              Kebijakan Tanpa Berbagi Data
            </h2>
            <p className="font-semibold text-indigo-400">
              Athena Shield tidak akan pernah menjual, menyewakan, membagikan, atau memperdagangkan data pribadi maupun data YouTube Anda kepada pihak ketiga mana pun.
            </p>
            <p>
              Data Anda tidak akan pernah digunakan untuk kepentingan penargetan iklan, riset komersial pihak ketiga, pemasaran, atau tujuan lain apa pun di luar fungsi inti moderasi komentar yang Anda aktifkan secara sadar.
            </p>
          </section>

          {/* Bagian 6 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
              <span className="text-indigo-400 text-xs font-semibold">06.</span>
              Hak Anda & Penghapusan Data
            </h2>
            <p>
              Anda memiliki kendali penuh atas data dan otorisasi yang Anda berikan kepada aplikasi kami:
            </p>
            <ul className="list-disc list-inside space-y-2 text-xs pl-2">
              <li>Anda dapat memutuskan hubungan akses YouTube API ke aplikasi kami kapan saja melalui pengaturan keamanan akun Google Anda di [Google Security Settings](https://myaccount.google.com/permissions).</li>
              <li>Jika Anda ingin menghapus seluruh akun dan data terkait Anda secara permanen dari database Athena Shield, Anda dapat melakukannya melalui menu preferensi di dashboard Anda, atau mengirimkan permintaan penghapusan data secara manual ke email pengembang kami di **filamsi.mghifary@gmail.com**. Kami akan menghapus seluruh data Anda secara permanen dalam waktu 2x24 jam.</li>
            </ul>
          </section>

          {/* Bagian 7 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
              <span className="text-indigo-400 text-xs font-semibold">07.</span>
              Kontak Pengembang
            </h2>
            <p>
              Jika Anda memiliki pertanyaan, saran, atau keluhan terkait Kebijakan Privasi ini, silakan hubungi tim dukungan kami di:
            </p>
            <div className="mt-3 p-4 rounded-lg bg-card border max-w-md" style={{ borderColor: 'var(--border-default)' }}>
              <p className="font-semibold text-primary text-xs">Athena Shield Support Team</p>
              <p className="text-xs mt-1">Pengembang: Filamsi M. Ghifary</p>
              <p className="text-xs">Email: <a href="mailto:filamsi.mghifary@gmail.com" className="text-indigo-400 hover:underline">filamsi.mghifary@gmail.com</a></p>
            </div>
          </section>

        </div>

        {/* Footer Halaman */}
        <div className="mt-16 pt-6 border-t text-center text-xs text-muted" style={{ borderColor: 'var(--border-default)' }}>
          <p>© 2026 Athena Shield. Seluruh hak cipta dilindungi undang-undang. Kepatuhan dipelihara di bawah pedoman Google API Services.</p>
        </div>

      </div>
    </div>
  );
}
