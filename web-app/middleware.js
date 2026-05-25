import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * Middleware terpusat - berjalan di Edge Runtime sebelum halaman dimuat.
 * Melindungi semua route private agar tidak bisa diakses tanpa login.
 */

// Route yang MEMERLUKAN login (private)
const PRIVATE_PREFIXES = [
  '/dashboard',
  '/comments',
  '/riwayat',
  '/preferensi',
  '/channel',
  '/video',
  '/pricing',
  '/profile',
];

// Route yang BOLEH diakses tanpa login (public)
// Semua route yang tidak ada di PRIVATE_PREFIXES dianggap publik.
// API routes dihandle oleh masing-masing getServerSession() sendiri.

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Cek apakah path adalah private
  const isPrivate = PRIVATE_PREFIXES.some((prefix) =>
    pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (!isPrivate) {
    // Route publik → langsung lanjutkan
    return NextResponse.next();
  }

  // Route private → cek token session
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    // Tidak ada sesi → redirect ke login, simpan URL asal untuk redirect balik
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Jalankan middleware pada semua path KECUALI:
  // - file static (_next/static, _next/image, favicon)
  // - API routes (dihandle oleh getServerSession masing-masing)
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
