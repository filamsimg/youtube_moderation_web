  -- === MIGRATION: SUPERADMIN / ADMIN SYSTEM ===
  -- Jalankan skrip ini di SQL Editor Supabase untuk membangun infrastruktur database.

  -- 1. Tambah kolom role ke user_profiles jika belum ada
  ALTER TABLE public.user_profiles
    ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
    CHECK (role IN ('user', 'admin', 'superadmin'));

  -- 2. Tambah kolom status aktif ke user_profiles untuk fitur suspend
  ALTER TABLE public.user_profiles
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

  -- Buat indeks untuk pencarian berdasarkan role dan status aktif
  CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
  CREATE INDEX IF NOT EXISTS idx_user_profiles_active ON public.user_profiles(is_active);

  -- 3. Pembuatan Tabel Audit Log Admin
  CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_email  TEXT NOT NULL REFERENCES public.user_profiles(email) ON DELETE CASCADE,
    action       TEXT NOT NULL,        -- 'CHANGE_TIER', 'UPDATE_QUOTA', 'SUSPEND_USER', 'CHANGE_ROLE'
    target_email TEXT,                 -- Email user yang dikenai tindakan (NULL jika tindakan global)
    details      JSONB,                -- Menyimpan detail data sebelum dan sesudah perubahan
    ip_address   TEXT,                 -- IP address pelaksana tindakan
    created_at   TIMESTAMPTZ DEFAULT now()
  );

  -- Indeks untuk efisiensi paginasi audit logs
  CREATE INDEX IF NOT EXISTS idx_audit_logs_admin ON public.admin_audit_logs(admin_email);
  CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON public.admin_audit_logs(target_email);
  CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.admin_audit_logs(created_at DESC);

  -- Aktifkan Row Level Security (RLS) pada audit logs
  ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

  -- Hanya service_role (server-side Next.js dengan service role key) yang bisa menulis dan membaca audit logs secara langsung
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'admin_audit_logs' AND policyname = 'Service role can manage audit logs'
    ) THEN
      CREATE POLICY "Service role can manage audit logs"
        ON public.admin_audit_logs FOR ALL
        USING (current_setting('role') = 'service_role');
    END IF;
  END $$;

  -- 4. Tambahkan RLS Policy Baru agar Admin/Superadmin bisa membaca data seluruh tabel untuk monitoring
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'user_profiles' AND policyname = 'Admins can read all user profiles'
    ) THEN
      CREATE POLICY "Admins can read all user profiles" ON public.user_profiles FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
              AND role IN ('admin', 'superadmin')
          )
        );
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'moderation_history' AND policyname = 'Admins can read all moderation histories'
    ) THEN
      CREATE POLICY "Admins can read all moderation histories" ON public.moderation_history FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
              AND role IN ('admin', 'superadmin')
          )
        );
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'transactions' AND policyname = 'Admins can read all transactions'
    ) THEN
      CREATE POLICY "Admins can read all transactions" ON public.transactions FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
              AND role IN ('admin', 'superadmin')
          )
        );
    END IF;
  END $$;
