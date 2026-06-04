'use client';

import Sidebar from '@/components/Sidebar';
import QuotaIndicator from '@/components/QuotaIndicator';
import OnboardingTour from '@/components/OnboardingTour';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { SidebarProvider } from '@/contexts/SidebarContext';

export default function MainLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated' || session?.error === 'RefreshAccessTokenError') {
      router.replace('/login');
    }
  }, [status, session?.error, router]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center transition-colors duration-300" style={{ background: 'var(--bg-page)' }}>
        {/* Background radial glow */}
        <div className="absolute w-[300px] h-[300px] rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 blur-[80px]" />

        <div className="relative flex flex-col items-center max-w-xs text-center space-y-6">
          {/* Glowing Pulsing Logo Container */}
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-indigo-500/25 blur-xl animate-pulse" />
            <div className="relative animate-float">
              <img
                src="/logo.webp"
                alt="Athena Shield Logo"
                className="w-16 h-16 object-contain drop-shadow-2xl"
              />
            </div>
          </div>

          {/* Text Details */}
          <div className="space-y-1 z-10">
            <h2 className="text-sm font-bold tracking-widest" style={{ color: 'var(--text-primary)' }}>
              ATHENA SHIELD
            </h2>
            <p className="text-[10px] uppercase font-bold tracking-widest text-indigo-600 dark:text-indigo-400">
              Perisai Moderasi AI YouTube
            </p>
          </div>

          {/* Loading Indicator Progress Bar */}
          <div className="w-40 h-1 rounded-full overflow-hidden relative" style={{ background: 'var(--border-default)' }}>
            <div className="absolute top-0 bottom-0 left-0 bg-indigo-600 dark:bg-indigo-500 rounded-full w-1/3 animate-[loading_1.5s_infinite_ease-in-out]" />
          </div>
          
          {/* Status Text */}
          <p className="text-[10px] animate-pulse" style={{ color: 'var(--text-muted)' }}>
            Menginisialisasi sistem moderasi spam judol...
          </p>
        </div>

        {/* CSS keyframe for smooth infinite slide loader */}
        <style jsx global>{`
          @keyframes loading {
            0% { left: -30%; width: 30%; }
            50% { width: 40%; }
            100% { left: 100%; width: 30%; }
          }
        `}</style>
      </div>
    );
  }

  if (!session) return null;

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-page)' }}>
        <Sidebar />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* ── Top Header Bar ──────────────────────────────────── */}
          <header
            className="h-14 backdrop-blur-xl flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30 border-b"
            style={{
              background: 'var(--bg-header)',
              borderColor: 'var(--border-default)',
            }}
          >
            {/* Left: hamburger spacer on mobile */}
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 lg:hidden" />
            </div>

            {/* Right: quota + theme toggle + user info */}
            <div className="flex items-center gap-2 lg:gap-3">
              {/* Quota indicator (compact) */}
              <div className="hidden sm:block">
                <QuotaIndicator compact />
              </div>

              {/* Divider */}
              <div className="hidden sm:block w-px h-5" style={{ background: 'var(--border-default)' }} />

              {/* User Name */}
              <div className="text-right hidden sm:block">
                <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {session?.user?.name || 'Kanal YouTube Saya'}
                </p>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>YouTube Content Creator</p>
              </div>

              {/* Avatar */}
              <img
                src={
                  session?.user?.image ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(session?.user?.name || 'User')}&background=6366f1&color=fff&size=32`
                }
                alt="avatar"
                className="w-8 h-8 rounded-full flex-shrink-0 ring-2"
                style={{ borderColor: 'var(--border-accent)', outlineColor: 'var(--accent-ai-soft)' }}
              />
            </div>
          </header>

          {/* ── Page Content ──────────────────────────────────── */}
          <main className="flex-1 p-4 lg:p-6 overflow-y-auto" style={{ background: 'var(--bg-page)' }}>
            {children}
          </main>
        </div>

        {/* ── Onboarding Tour ──────────────────────────────── */}
        <OnboardingTour />
      </div>
    </SidebarProvider>
  );
}

