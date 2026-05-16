import { createClient } from '@supabase/supabase-js';

/**
 * Supabase client dengan Service Role Key.
 * HANYA digunakan di server-side (API Route).
 * JANGAN impor file ini di komponen client-side.
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
