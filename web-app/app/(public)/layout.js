'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';

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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <img src="/logo.webp" alt="Athena Shield" className="w-7 h-7 object-contain" />
            <span className="text-sm font-semibold text-primary">Athena Shield</span>
          </Link>

          {/* Nav Links */}
          <nav className="hidden sm:flex items-center gap-1">
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${pathname === '/' ? 'bg-card-hover text-primary' : 'text-secondary hover:text-primary hover:bg-card-hover'
                }`}
            >
              Beranda
            </Link>
            <Link
              href="/pricing"
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${pathname === '/pricing' ? 'bg-card-hover text-primary' : 'text-secondary hover:text-primary hover:bg-card-hover'
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
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
              >
                Dashboard
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-xs font-medium text-secondary hover:text-primary transition-colors"
                >
                  Masuk
                </Link>
                <Link
                  href="/login"
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  Mulai Gratis
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Page Content ──────────────────────────────────────── */}
      <main className="flex-1">
        {children}
      </main>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="border-t bg-card" style={{ borderColor: 'var(--border-default)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.webp" alt="Athena Shield" className="w-6 h-6 object-contain grayscale opacity-70" />
            <span className="text-xs font-semibold text-secondary">Athena Shield</span>
          </div>
          <p className="text-[11px] text-muted">
            © 2026 Athena Shield · Moderasi Komentar Judol berbasis AI
          </p>
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="text-[11px] text-muted hover:text-primary transition-colors">Harga</Link>
            <Link href="/login" className="text-[11px] text-muted hover:text-primary transition-colors">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
