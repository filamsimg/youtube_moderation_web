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
  '/profile',
  '/admin',
];

// Route yang MEMERLUKAN role admin/superadmin
const ADMIN_PREFIXES = ['/admin'];

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

  // Cek status aktif (suspend) untuk rute privat apapun
  if (token.isActive === false) {
    const loginUrl = new URL('/login?error=suspended', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Cek otorisasi khusus untuk halaman admin
  const isAdminRoute = ADMIN_PREFIXES.some((prefix) =>
    pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isAdminRoute) {
    const role = token.role || 'user';
    if (role !== 'admin' && role !== 'superadmin') {
      return NextResponse.redirect(new URL('/dashboard?error=unauthorized', request.url));
    }
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
