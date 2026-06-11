import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * Memverifikasi bahwa request dikirim oleh pengguna dengan role admin/superadmin.
 * Melakukan double-check ke database langsung untuk mencegah token JWT usang yang dimanipulasi.
 * 
 * @param {string} requiredRole - Role minimal yang dibutuhkan ('admin' | 'superadmin')
 * @returns {Promise<{ session: object, profile: object } | { error: string, status: number }>}
 */
export async function requireAdmin(requiredRole = 'admin') {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return { error: 'Unauthorized', status: 401 };
  }

  // Verifikasi langsung ke database menggunakan supabaseAdmin (service_role)
  const { data: profile, error: dbErr } = await supabaseAdmin
    .from('user_profiles')
    .select('email, role, is_active, tier')
    .eq('email', session.user.email)
    .single();

  if (dbErr || !profile) {
    return { error: 'User profile not found', status: 404 };
  }

  if (!profile.is_active) {
    return { error: 'Account suspended', status: 403 };
  }

  const roleHierarchy = { user: 0, admin: 1, superadmin: 2 };
  const userLevel = roleHierarchy[profile.role] || 0;
  const requiredLevel = roleHierarchy[requiredRole] || 1;

  if (userLevel < requiredLevel) {
    return { error: 'Forbidden: Insufficient permissions', status: 403 };
  }

  return { session, profile };
}
