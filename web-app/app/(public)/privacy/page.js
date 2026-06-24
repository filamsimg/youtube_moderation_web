'use client';

import Link from 'next/link';

export default function PrivacyPolicy() {
  const lastUpdated = '24 Juni 2026';

  return (
    <div className="min-h-screen bg-page text-secondary">
      {/* Decorative background light */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[300px] bg-gradient-to-b from-indigo-900/10 via-transparent to-transparent pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 relative z-10">
        
        {/* Back Button */}
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-xs text-muted hover:text-primary transition-colors group"
          >
            <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Kembali ke Beranda / Back to Home
          </Link>
        </div>

        {/* Header */}
        <div className="border-b pb-8 mb-10" style={{ borderColor: 'var(--border-default)' }}>
          <h1 className="text-3xl font-bold text-primary mb-3 tracking-tight">
            Kebijakan Privasi · <span className="text-indigo-400 font-medium">Privacy Policy</span>
          </h1>
          <p className="text-xs text-muted">
            Terakhir Diperbarui / Last Updated: <span className="font-semibold text-secondary">{lastUpdated}</span>
          </p>
        </div>

        {/* Critical Google Compliance Callout */}
        <div className="mb-10 p-5 rounded-xl border bg-indigo-950/20 border-indigo-500/30">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            <div>
              <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-1">
                Google API Services User Data Policy Compliance
              </h4>
              <p className="text-xs leading-relaxed text-indigo-200/90">
                <strong>ID:</strong> Athena Shield&apos;s use and transfer to any other app of information received from Google APIs will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="underline hover:text-white transition-colors">Google API Services User Data Policy</a>, including the Limited Use requirements.
              </p>
              <p className="text-xs leading-relaxed text-indigo-200/90 mt-2">
                <strong>IDN:</strong> Penggunaan dan transfer informasi yang diterima dari Google API oleh Athena Shield ke aplikasi lain akan sepenuhnya mematuhi <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="underline hover:text-white transition-colors">Kebijakan Data Pengguna Layanan API Google</a>, termasuk persyaratan Penggunaan Terbatas (Limited Use).
              </p>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-10 text-sm leading-relaxed text-secondary">

          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
              <span className="text-indigo-400 text-xs font-mono">01.</span>
              Pendahuluan / Introduction
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
              <div>
                <p className="mb-3">
                  Selamat datang di <strong>Athena Shield</strong>. Kami berkomitmen untuk melindungi privasi dan data pribadi Anda. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, menyimpan, dan melindungi informasi Anda saat Anda menggunakan aplikasi moderasi komentar YouTube berbasis kecerdasan buatan (AI) kami.
                </p>
              </div>
              <div className="border-l pl-6" style={{ borderColor: 'var(--border-default)' }}>
                <p className="text-muted italic">
                  Welcome to <strong>Athena Shield</strong>. We are committed to protecting your privacy and personal data. This Privacy Policy explains how we collect, use, store, and protect your information when you use our artificial intelligence (AI) powered YouTube comment moderation application.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
              <span className="text-indigo-400 text-xs font-mono">02.</span>
              Informasi yang Kami Kumpulkan / Information We Collect
            </h2>
            <p className="text-xs text-muted mb-2">
              Kami mengumpulkan informasi dari Anda ketika Anda masuk menggunakan akun Google Anda dan memberikan otorisasi untuk mengakses YouTube API.
              / We collect information from you when you log in using your Google account and authorize access to the YouTube API.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-card border" style={{ borderColor: 'var(--border-default)' }}>
                  <h3 className="font-semibold text-primary text-xs uppercase mb-2 text-indigo-400">Data Akun Google (Google OAuth)</h3>
                  <ul className="list-disc list-inside space-y-1.5 text-xs">
                    <li>Alamat email untuk identifikasi dan komunikasi penting.</li>
                    <li>Nama lengkap dan foto profil untuk personalisasi antarmuka pengguna.</li>
                    <li>Token otentikasi aman untuk memelihara sesi masuk Anda.</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg bg-card border" style={{ borderColor: 'var(--border-default)' }}>
                  <h3 className="font-semibold text-primary text-xs uppercase mb-2 text-indigo-400">Data YouTube API</h3>
                  <ul className="list-disc list-inside space-y-1.5 text-xs">
                    <li>Metadata channel YouTube Anda (nama channel, ID channel, foto profil channel).</li>
                    <li>Daftar video publik Anda untuk dipilih dalam moderasi.</li>
                    <li>Komentar video untuk dianalisis oleh sistem klasifikasi kecerdasan buatan (AI) kami.</li>
                  </ul>
                </div>
              </div>

              <div className="border-l pl-6 space-y-4 text-muted italic" style={{ borderColor: 'var(--border-default)' }}>
                <div className="p-4 rounded-lg bg-card/50 border border-dashed" style={{ borderColor: 'var(--border-default)' }}>
                  <h3 className="font-semibold text-secondary text-xs uppercase mb-2">Google Account Data (Google OAuth)</h3>
                  <ul className="list-disc list-inside space-y-1.5 text-xs">
                    <li>Email address for identification and critical communications.</li>
                    <li>Full name and profile picture for UI personalization.</li>
                    <li>Secure authentication tokens to maintain your login session.</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg bg-card/50 border border-dashed" style={{ borderColor: 'var(--border-default)' }}>
                  <h3 className="font-semibold text-secondary text-xs uppercase mb-2">YouTube API Data</h3>
                  <ul className="list-disc list-inside space-y-1.5 text-xs">
                    <li>YouTube channel metadata (channel name, channel ID, profile picture).</li>
                    <li>List of public videos for moderation selection.</li>
                    <li>Video comments to be analyzed by our AI classification system.</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
              <span className="text-indigo-400 text-xs font-mono">03.</span>
              Bagaimana Kami Menggunakan Informasi Anda / How We Use Your Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
              <div>
                <p className="mb-2">Kami memproses data Anda dengan tujuan yang sangat spesifik dan terbatas:</p>
                <ul className="list-disc list-inside space-y-2 text-xs">
                  <li><strong>Penyediaan Layanan:</strong> Menganalisis komentar video Anda untuk menyaring komentar yang terindikasi promosi ilegal, spam, atau judi online.</li>
                  <li><strong>Audit Keamanan:</strong> Menyediakan riwayat tindakan moderasi (audit log) di dashboard Anda sendiri agar Anda dapat mengontrol tindakan sistem kami.</li>
                  <li><strong>Pengelolaan Kuota:</strong> Melacak konsumsi kuota API demi kestabilan operasional aplikasi.</li>
                </ul>
              </div>
              <div className="border-l pl-6 text-muted italic" style={{ borderColor: 'var(--border-default)' }}>
                <p className="mb-2">We process your data for very specific and limited purposes:</p>
                <ul className="list-disc list-inside space-y-2 text-xs">
                  <li><strong>Service Provision:</strong> Analyzing video comments to filter promotions of illegal activities, spam, or online gambling using AI.</li>
                  <li><strong>Security Auditing:</strong> Providing a history of moderation actions (audit logs) on your own dashboard so you retain control.</li>
                  <li><strong>Quota Management:</strong> Tracking API quota consumption to maintain application stability.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
              <span className="text-indigo-400 text-xs font-mono">04.</span>
              Perlindungan & Penyimpanan Data / Data Protection & Storage
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
              <div>
                <p className="mb-3">
                  Kami berkomitmen tinggi terhadap keamanan data Anda. Semua token otentikasi dan data kredensial disimpan menggunakan enkripsi tingkat tinggi di database kami yang aman (didukung oleh infrastruktur Supabase). 
                </p>
                <p>
                  Kami tidak menyimpan konten komentar YouTube Anda secara permanen. Komentar hanya dibaca secara *real-time* untuk dianalisis oleh AI kami dan segera dibuang dari memori server setelah proses klasifikasi selesai.
                </p>
              </div>
              <div className="border-l pl-6 text-muted italic" style={{ borderColor: 'var(--border-default)' }}>
                <p className="mb-3">
                  We are highly committed to data security. All authentication tokens and credentials are encrypted and stored securely within our database infrastructure (powered by Supabase).
                </p>
                <p>
                  We do not permanently store your YouTube comment content. Comments are processed in real-time by our AI models and are immediately discarded from memory once classification is completed.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
              <span className="text-indigo-400 text-xs font-mono">05.</span>
              Kebijakan Tanpa Berbagi / No Data Sharing Policy
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
              <div>
                <p className="mb-3 font-semibold text-indigo-400">
                  Athena Shield tidak akan pernah menjual, menyewakan, membagikan, atau memperdagangkan data pribadi Anda atau data YouTube Anda dengan pihak ketiga mana pun.
                </p>
                <p>
                  Data Anda tidak akan pernah digunakan untuk kepentingan periklanan, pemasaran, profil komersial, atau tujuan lain di luar fungsi moderasi konten yang Anda instruksikan secara sadar.
                </p>
              </div>
              <div className="border-l pl-6 text-muted italic" style={{ borderColor: 'var(--border-default)' }}>
                <p className="mb-3 font-semibold text-indigo-300">
                  Athena Shield will never sell, rent, share, or trade your personal data or YouTube data with any third party.
                </p>
                <p>
                  Your data will never be used for advertising, marketing, commercial profiling, or any purpose other than the content moderation functions you explicitly instruct.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
              <span className="text-indigo-400 text-xs font-mono">06.</span>
              Hak Anda & Penghapusan Data / Your Rights & Data Deletion
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
              <div>
                <p className="mb-3">
                  Anda memegang kendali penuh atas data Anda. Anda dapat memutuskan hubungan otorisasi YouTube API kapan saja melalui halaman pengaturan akun Google Anda.
                </p>
                <p>
                  Jika Anda ingin menghapus seluruh akun dan data terkait Anda secara permanen dari basis data Athena Shield, Anda dapat melakukannya melalui menu preferensi di dashboard Anda, atau mengirimkan permintaan penghapusan data secara manual melalui email ke <strong>filamsi.mghifary@gmail.com</strong>. Kami akan memproses penghapusan seluruh data Anda dalam waktu 2x24 jam.
                </p>
              </div>
              <div className="border-l pl-6 text-muted italic" style={{ borderColor: 'var(--border-default)' }}>
                <p className="mb-3">
                  You retain full control over your data. You can revoke our application&apos;s access to your YouTube channel at any time via your Google Account security settings page.
                </p>
                <p>
                  To permanently delete your account and all associated data from Athena Shield database, you can use the deletion feature inside your dashboard profile settings, or send a manual deletion request to <strong>filamsi.mghifary@gmail.com</strong>. We will purge your data within 48 hours.
                </p>
              </div>
            </div>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
              <span className="text-indigo-400 text-xs font-mono">07.</span>
              Kontak Kami / Contact Us
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
              <div>
                <p>
                  Jika Anda memiliki pertanyaan, saran, atau keluhan terkait Kebijakan Privasi ini, silakan hubungi pengembang kami di:
                </p>
                <div className="mt-3 p-4 rounded-lg bg-card border" style={{ borderColor: 'var(--border-default)' }}>
                  <p className="font-semibold text-primary text-xs">Athena Shield Support Team</p>
                  <p className="text-xs mt-1">Developer: Filamsi M. Ghifary</p>
                  <p className="text-xs">Email: <a href="mailto:filamsi.mghifary@gmail.com" className="text-indigo-400 hover:underline">filamsi.mghifary@gmail.com</a></p>
                </div>
              </div>
              <div className="border-l pl-6 text-muted italic" style={{ borderColor: 'var(--border-default)' }}>
                <p>
                  If you have any questions, suggestions, or concerns regarding this Privacy Policy, please contact our developer at:
                </p>
                <div className="mt-3 p-4 rounded-lg bg-card/50 border border-dashed" style={{ borderColor: 'var(--border-default)' }}>
                  <p className="font-semibold text-secondary text-xs">Athena Shield Support Team</p>
                  <p className="text-xs mt-1">Developer: Filamsi M. Ghifary</p>
                  <p className="text-xs">Email: <a href="mailto:filamsi.mghifary@gmail.com" className="text-indigo-300 hover:underline">filamsi.mghifary@gmail.com</a></p>
                </div>
              </div>
            </div>
          </section>

        </div>

        {/* Footer Accent */}
        <div className="mt-16 pt-6 border-t text-center text-xs text-muted" style={{ borderColor: 'var(--border-default)' }}>
          <p>© 2026 Athena Shield. All Rights Reserved. Protected under Google API Services Compliance guidelines.</p>
        </div>

      </div>
    </div>
  );
}
