'use client';

import Link from 'next/link';
import Image from 'next/image';

/**
 * Komponen Footer Akademik & Aplikasi
 * @param {string} variant - Varian tampilan: 'public' (landing page) atau 'dashboard' (halaman dalam/sidebar)
 */
export default function Footer({ variant = 'public' }) {
  const currentYear = new Date().getFullYear();

  if (variant === 'dashboard') {
    return (
      <footer className="mt-auto pt-8 pb-4 border-t border-[var(--border-default)] transition-colors">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-[var(--text-muted)] font-medium">
          {/* Left Side: App copyright */}
          <div>
            <span>© {currentYear} </span>
            <span className="font-bold text-[var(--text-secondary)]">Athena Shield</span>
            <span> · Perlindungan Komentar YouTube</span>
          </div>

          {/* Right Side: Skripsi credits & UHN Logo */}
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <span className="h-4 w-px bg-[var(--border-default)] hidden md:block" />
            <span>Dibuat Oleh:</span>
            <span className="font-semibold text-[var(--text-primary)]">Filamsi Mabda Ghifary</span>
            <span>•</span>
            <span className="font-semibold text-[var(--text-primary)]">Universitas Harkat Negeri</span>
            
            {/* Logo wrapper to handle dark/light contrast gracefully */}
            <div className="bg-white p-1 rounded-md shadow-sm border border-slate-100 flex items-center justify-center h-6 w-14 transition-all hover:scale-105">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-uhn.png"
                alt="Logo Universitas Harkat Negeri"
                className="h-full object-contain"
              />
            </div>
          </div>
        </div>
      </footer>
    );
  }

  // Default: Public / Landing Page Footer
  return (
    <footer className="border-t bg-[var(--bg-card)] border-[var(--border-default)] transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* Top Section: Minimalist Branding & Academic Badge */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-[var(--border-default)]">
          {/* Left: Brand Info */}
          <div className="space-y-3 max-w-md">
            <div className="flex items-center gap-2.5">
              <div className="relative w-7 h-7">
                <Image
                  src="/logo.webp"
                  alt="Athena Shield Logo"
                  fill
                  sizes="28px"
                  className="object-contain"
                />
              </div>
              <span className="text-sm font-bold text-[var(--text-primary)] tracking-wide">
                Athena Shield
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Sistem moderasi komentar otomatis berbasis Kecerdasan Buatan (AI) IndoBERT 
              untuk memproteksi kanal YouTube dari serbuan spam promosi judi online.
            </p>
            <div className="flex items-center gap-2 pt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">
                Proyek Tugas Akhir / Skripsi
              </span>
            </div>
          </div>

          {/* Right: Clean University Partner logo */}
          <div className="flex items-center gap-3 bg-[var(--bg-page)] border border-[var(--border-default)]/60 px-4 py-2.5 rounded-2xl shadow-sm transition-all hover:border-[var(--border-hover)]">
            <div className="text-left">
              <p className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider">Dikembangkan di</p>
              <p className="text-xs font-extrabold text-[var(--text-primary)]">Universitas Harkat Negeri</p>
            </div>
            <div className="bg-white p-1 rounded-lg border border-slate-100 flex items-center justify-center h-7 w-12 transition-transform hover:scale-105">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-uhn.png"
                alt="Logo Universitas Harkat Negeri"
                className="h-full object-contain"
              />
            </div>
          </div>
        </div>

        {/* Bottom Section: Links & Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-[var(--text-muted)]">
            © {currentYear} Athena Shield. Hak Cipta Dilindungi Undang-Undang.
          </p>

          <div className="flex items-center gap-6 text-[11px] font-medium text-[var(--text-muted)]">
            <Link href="/" className="hover:text-[var(--text-primary)] transition-colors">
              Beranda
            </Link>
            <Link href="/pricing" className="hover:text-[var(--text-primary)] transition-colors">
              Harga
            </Link>
            <Link href="/about" className="hover:text-[var(--text-primary)] transition-colors">
              Tentang Kami
            </Link>
            <Link href="/privacy" className="hover:text-[var(--text-primary)] transition-colors">
              Kebijakan Privasi
            </Link>
            <Link href="/terms" className="hover:text-[var(--text-primary)] transition-colors">
              Syarat & Ketentuan
            </Link>
            <Link href="/login" className="hover:text-[var(--text-primary)] transition-colors">
              Akses Panel
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
