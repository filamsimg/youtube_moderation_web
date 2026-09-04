'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Footer from '@/components/Footer';

/**
 * Layout untuk halaman PUBLIK.
 * Berisi Navbar sederhana + Footer. Tidak ada auth requirement.
 */
export default function PublicLayout({ children }) {
  const { data: session } = useSession();
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex flex-col bg-page">
      {/* ── Public Navbar ─────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-header backdrop-blur-md border-b" style={{ borderColor: 'var(--border-default)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <Image src="/logo.webp" alt="Athena Shield" width={28} height={28} className="w-7 h-7 object-contain" />
            <span className="text-sm font-semibold text-primary">Athena Shield</span>
          </Link>

          {/* Nav Links */}
          <nav className="hidden sm:flex items-center gap-1">
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${pathname === '/' ? 'bg-card-hover text-primary' : 'text-secondary hover:text-primary hover:bg-card-hover'
                }`}
            >
              Beranda
            </Link>
            <Link
              href="/pricing"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${pathname === '/pricing' ? 'bg-card-hover text-primary' : 'text-secondary hover:text-primary hover:bg-card-hover'
                }`}
            >
              Harga
            </Link>
          </nav>

          {/* CTA */}
          <div className="flex items-center gap-2">
            {session ? (
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm hover:-translate-y-0.5 active:scale-95 cursor-pointer"
              >
                <span>Buka Dashboard</span>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white text-sm sm:text-sm font-bold rounded-xl transition-all shadow-sm hover:-translate-y-0.5 active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <span>Mulai Gratis</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ── Page Content ──────────────────────────────────────── */}
      <main className="flex-1">
        {children}
      </main>

      {/* ── Footer ────────────────────────────────────────────── */}
      <Footer variant="public" />
    </div>
  );
}
