'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import KineticGrid from '@/components/KineticGrid';

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-screen">
        <div className="flex flex-col items-center gap-4 animate-pulse-glow p-8 rounded-full">
          <Image src="/logo.webp" alt="Loading" width={48} height={48} className="w-12 h-12 animate-spin-slow" />
          <p className="text-secondary text-sm">Memuat...</p>
        </div>
      </div>
    );
  }

  const handleSignIn = async () => {
    setIsSigningIn(true);
    await signIn('google', { callbackUrl: '/dashboard' });
  };

  const stats = [
    { value: '99%', label: 'Akurasi Deteksi' },
    { value: '<5s', label: 'Waktu Analisis' },
    { value: 'AI', label: 'IndoBERTweet' },
  ];

  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-screen">
      {/* ── Background Effects ── */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-mesh-dark opacity-40 mix-blend-screen" />
        <KineticGrid />
      </div>

      {/* ── Back Button ── */}
      <Link
        href="/"
        className="absolute top-6 left-6 z-50 flex items-center gap-2 text-secondary hover:text-primary transition-colors text-sm font-medium bg-card/50 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-[var(--border-default)] hover:bg-card-hover"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Kembali
      </Link>

      {/* ── Main Container ── */}
      <div className="relative z-10 w-full max-w-xl mx-auto px-6 py-12 flex flex-col items-center">

        {/* ── Content: Branding & Login ── */}
        <div className="w-full text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-6 animate-fade-in-up">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            Athena Shield v2.0 is Live
          </div>

          <h1 className="text-4xl lg:text-5xl font-bold text-primary tracking-tight mb-4">
            Moderasi Komentar <span className="text-indigo-600 dark:text-indigo-400">Cerdas</span>
          </h1>
          <p className="text-base text-secondary mb-8 max-w-md mx-auto">
            Otomatisasi filter komentar YouTube Anda menggunakan kecerdasan buatan berbasis IndoBERTweet.
          </p>

          {/* ── Feature Mini-Cards ── */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            {[
              { icon: '🔒', label: 'OAuth 2.0', desc: 'Login Aman' },
              { icon: '⚡', label: 'YouTube API', desc: 'Akses Resmi' },
            ].map(item => (
              <div key={item.label} className="p-3 rounded-xl bg-card-hover border border-border-default flex flex-col items-center justify-center text-center">
                <span className="text-xl mb-1">{item.icon}</span>
                <p className="text-[11px] font-semibold text-primary mt-1.5">{item.label}</p>
                <p className="text-[10px] text-muted mt-0.5">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* ── CTA Button ────────────────────────────────── */}
          <button
            onClick={handleSignIn}
            disabled={isSigningIn}
            className="relative w-full max-w-sm mx-auto overflow-hidden py-3 px-8 rounded-xl text-sm font-semibold text-white transition-all duration-300 group disabled:opacity-70 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)',
              boxShadow: '0 0 24px rgba(99, 102, 241, 0.35)',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <span className="relative flex items-center justify-center gap-2.5">
              {isSigningIn ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Menghubungkan...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#fff" fillOpacity=".9" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff" fillOpacity=".8" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fff" fillOpacity=".7" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff" fillOpacity=".9" />
                  </svg>
                  Masuk dengan Google
                </>
              )}
            </span>
          </button>

          {/* ── Stats row ── */}
          <div className="mt-8 pt-6 border-t border-border-default flex items-center justify-center gap-4">
            {stats.map((s, i) => (
              <div key={s.label} className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-sm font-bold text-primary">{s.value}</p>
                  <p className="text-[10px] text-muted">{s.label}</p>
                </div>
                {i < stats.length - 1 && <div className="w-px h-6 bg-border-default" />}
              </div>
            ))}
          </div>

          {/* ── Consent Text ── */}
          <div className="mt-6 flex items-start gap-2 text-left bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-lg">
            <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
            <p className="text-[11px] text-secondary leading-relaxed">
              Kami meminta izin baca dan kelola (edit, hapus) komentar YouTube Anda melalui <span className="font-semibold text-primary">YouTube Data API v3</span> untuk dapat melakukan moderasi otomatis.
            </p>
          </div>

          {/* ── Footer ────────────────────────────────────── */}
          <p className="text-[10px] text-dimmed mt-5">
            &copy; {new Date().getFullYear()} Athena Shield by Filamss.
          </p>
        </div>

        {/* ── Version badge ────────────────────────────────── */}
        <div className="flex justify-center mt-4">
          <span className="badge badge-ai text-[10px]">
            v1.0 · IndoBERTweet + Sentiment Analysis
          </span>
        </div>
      </div>
    </div>
  );
}
