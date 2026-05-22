-- ============================================================
-- SKEMA DATABASE LENGKAP (FULL SCHEMA) - Moderasi Judol V1
-- Jalankan skrip ini di SQL Editor Supabase untuk membangun
-- seluruh infrastruktur tabel, RLS, indeks, dan fungsi dari nol.
-- ============================================================

-- 1. TABEL PROFIL PENGGUNA (Saldo Kuota)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  tier          TEXT NOT NULL DEFAULT 'FREE',   -- 'FREE' | 'PRO' | 'ENTERPRISE'
  quota_balance INTEGER NOT NULL DEFAULT 1000, -- Saldo kuota awal
  quota_limit   INTEGER NOT NULL DEFAULT 1000, -- Batas maksimal kuota
  last_reset    TIMESTAMPTZ DEFAULT now(),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- 2. TABEL LOG PEMAKAIAN KUOTA
CREATE TABLE IF NOT EXISTS public.quota_usage_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email  TEXT NOT NULL REFERENCES public.user_profiles(email) ON DELETE CASCADE,
  action_name TEXT NOT NULL,    -- 'FETCH_COMMENTS' | 'MODERATE_SINGLE' | 'MODERATE_BATCH' | 'FETCH_VIDEOS'
  units_spent INTEGER NOT NULL, -- Jumlah kuota yang dipotong
  description TEXT,             -- Keterangan (misal: judul video / aksi)
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 3. TABEL PENGATURAN PREFERENSI USER
CREATE TABLE IF NOT EXISTS public.user_settings (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email         TEXT UNIQUE NOT NULL REFERENCES public.user_profiles(email) ON DELETE CASCADE,
  theme              TEXT NOT NULL DEFAULT 'dark', -- Preferensi tema ('dark' | 'light')
  auto_hapus         BOOLEAN NOT NULL DEFAULT false,
  auto_tahan         BOOLEAN NOT NULL DEFAULT true,
  threshold_reject   INTEGER NOT NULL DEFAULT 90,
  threshold_hold     INTEGER NOT NULL DEFAULT 70,
  polling_interval   INTEGER NOT NULL DEFAULT 120,
  batch_moderation   BOOLEAN NOT NULL DEFAULT true,
  created_at         TIMESTAMPTZ DEFAULT now(),
  updated_at         TIMESTAMPTZ DEFAULT now()
);

-- 4. TABEL RIWAYAT MODERASI KOMENTAR (History)
CREATE TABLE IF NOT EXISTS public.moderation_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email      TEXT NOT NULL REFERENCES public.user_profiles(email) ON DELETE CASCADE,
  channel_id      TEXT,
  comment_id      TEXT UNIQUE NOT NULL, -- Mencegah duplikasi komentar yang sama
  action          TEXT NOT NULL,        -- 'published' | 'heldForReview' | 'rejected'
  comment_text    TEXT,
  author          TEXT,
  video_title     TEXT,
  ai_label        TEXT,                 -- 'Spam' / 'Normal'
  ai_confidence   DOUBLE PRECISION,     -- Skor kepastian AI (IndoBERT)
  sentiment       TEXT,                 -- Sentimen ('Positif' | 'Negatif' | 'Netral')
  sentiment_score DOUBLE PRECISION,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- INDEKS DATABASE (Untuk Optimasi Kecepatan Query)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_quota_usage_logs_email ON public.quota_usage_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_quota_usage_logs_created ON public.quota_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_history_email ON public.moderation_history(user_email);
CREATE INDEX IF NOT EXISTS idx_moderation_history_created ON public.moderation_history(created_at DESC);

-- ============================================================
-- KEBIJAKAN KEAMANAN (Row Level Security - RLS)
-- ============================================================
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quota_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_history ENABLE ROW LEVEL SECURITY;

-- A. Kebijakan Baca Mandiri (User hanya bisa membaca datanya sendiri)
CREATE POLICY "Users can read own profile" ON public.user_profiles FOR SELECT
  USING (email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Users can read own logs" ON public.quota_usage_logs FOR SELECT
  USING (user_email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Users can read own settings" ON public.user_settings FOR SELECT
  USING (user_email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Users can read own history" ON public.moderation_history FOR SELECT
  USING (user_email = current_setting('request.jwt.claims', true)::json->>'email');

-- B. Kebijakan Service Role (API Route server-side Next.js dengan Service Key memiliki akses penuh)
CREATE POLICY "Service role can manage profiles" ON public.user_profiles FOR ALL USING (current_setting('role') = 'service_role');
CREATE POLICY "Service role can manage logs" ON public.quota_usage_logs FOR ALL USING (current_setting('role') = 'service_role');
CREATE POLICY "Service role can manage settings" ON public.user_settings FOR ALL USING (current_setting('role') = 'service_role');
CREATE POLICY "Service role can manage history" ON public.moderation_history FOR ALL USING (current_setting('role') = 'service_role');

-- ============================================================
-- FUNGSI & TRIGGER DATABASE (PL/pgSQL)
-- ============================================================

-- Fungsi 1: Pengurangan Kuota secara Atomic (Thread-Safe)
CREATE OR REPLACE FUNCTION public.deduct_quota(
  p_email TEXT,
  p_units INTEGER,
  p_action TEXT,
  p_description TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Lock baris untuk mencegah race condition (dobel klik / konkurensi)
  SELECT quota_balance INTO v_current_balance
  FROM public.user_profiles
  WHERE email = p_email
  FOR UPDATE;

  -- Cek kecukupan pengguna
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'reason', 'user_not_found');
  END IF;

  -- Cek apakah kuota mencukupi
  IF v_current_balance < p_units THEN
    RETURN json_build_object(
      'success', false,
      'reason', 'insufficient_quota',
      'balance', v_current_balance,
      'required', p_units
    );
  END IF;

  -- Pengurangan Saldo
  v_new_balance := v_current_balance - p_units;
  UPDATE public.user_profiles
  SET quota_balance = v_new_balance, updated_at = now()
  WHERE email = p_email;

  -- Catat riwayat audit log kuota
  INSERT INTO public.quota_usage_logs (user_email, action_name, units_spent, description)
  VALUES (p_email, p_action, p_units, p_description);

  RETURN json_build_object('success', true, 'balance', v_new_balance);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fungsi 2: Pembuatan Profil User Otomatis saat pertama login
CREATE OR REPLACE FUNCTION public.ensure_user_profile(p_email TEXT)
RETURNS public.user_profiles AS $$
DECLARE
  v_profile public.user_profiles;
BEGIN
  INSERT INTO public.user_profiles (email)
  VALUES (p_email)
  ON CONFLICT (email) DO NOTHING;

  SELECT * INTO v_profile FROM public.user_profiles WHERE email = p_email;
  RETURN v_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
