'use client';

import Sidebar from '@/components/Sidebar';
import QuotaIndicator from '@/components/QuotaIndicator';
import ThemeToggle from '@/components/ThemeToggle';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function MainLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--bg-screen)' }}>
        <div className="flex flex-col items-center gap-4">
          {/* Animated logo */}
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-xl animate-pulse" />
            <div className="relative animate-float">
              <img src="/logo.webp" alt="Athena Shield" className="w-14 h-14 object-contain drop-shadow-2xl" />
            </div>
          </div>
          {/* Loading bar */}
          <div className="w-36 h-1 rounded-full overflow-hidden" style={{ background: 'var(--border-default)' }}>
            <div className="h-full w-3/5 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full animate-pulse" />
          </div>
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Memuat Athena Shield...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
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
          {/* Left: hamburger spacer on mobile / icon on desktop */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 lg:hidden" />
            <div className="hidden lg:flex items-center gap-2">
              <svg className="w-4 h-4" style={{ color: 'var(--text-dimmed)' }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
            </div>
          </div>

          {/* Right: quota + theme toggle + user info */}
          <div className="flex items-center gap-2 lg:gap-3">
            {/* Quota indicator (compact) */}
            <div className="hidden sm:block">
              <QuotaIndicator compact />
            </div>

            {/* Divider */}
            <div className="hidden sm:block w-px h-5" style={{ background: 'var(--border-default)' }} />

            {/* Theme Toggle */}
            <ThemeToggle />

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
    </div>
  );
}
