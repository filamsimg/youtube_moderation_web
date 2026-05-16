-- ============================================================
-- QUOTA SYSTEM SCHEMA - Moderasi Judol V1
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- 1. Tabel profil user (menyimpan saldo kuota)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT UNIQUE NOT NULL,
  tier        TEXT NOT NULL DEFAULT 'FREE',   -- 'FREE' | 'PRO' | 'ENTERPRISE'
  quota_balance INTEGER NOT NULL DEFAULT 1000, -- Saldo awal user baru
  quota_limit   INTEGER NOT NULL DEFAULT 1000, -- Batas maksimal sesuai tier
  last_reset  TIMESTAMPTZ DEFAULT now(),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabel log pemakaian kuota (audit trail)
CREATE TABLE IF NOT EXISTS public.quota_usage_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email  TEXT NOT NULL REFERENCES public.user_profiles(email) ON DELETE CASCADE,
  action_name TEXT NOT NULL,    -- 'FETCH_COMMENTS' | 'MODERATE_SINGLE' | 'MODERATE_BATCH' | 'FETCH_VIDEOS'
  units_spent INTEGER NOT NULL, -- Jumlah unit yang dipotong
  description TEXT,             -- Keterangan tambahan (judul video, dll)
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 3. Index untuk query yang cepat
CREATE INDEX IF NOT EXISTS idx_quota_usage_logs_email ON public.quota_usage_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_quota_usage_logs_created ON public.quota_usage_logs(created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quota_usage_logs ENABLE ROW LEVEL SECURITY;

-- User hanya bisa READ profil mereka sendiri
CREATE POLICY "Users can read own profile"
  ON public.user_profiles FOR SELECT
  USING (email = current_setting('request.jwt.claims', true)::json->>'email');

-- User hanya bisa READ log mereka sendiri
CREATE POLICY "Users can read own logs"
  ON public.quota_usage_logs FOR SELECT
  USING (user_email = current_setting('request.jwt.claims', true)::json->>'email');

-- HANYA Service Role yang bisa INSERT/UPDATE (dari API Route server-side)
CREATE POLICY "Service role can manage profiles"
  ON public.user_profiles FOR ALL
  USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role can manage logs"
  ON public.quota_usage_logs FOR ALL
  USING (current_setting('role') = 'service_role');

-- ============================================================
-- FUNGSI: Kurangi saldo kuota secara atomic (thread-safe)
-- ============================================================
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
  -- Lock baris untuk mencegah race condition
  SELECT quota_balance INTO v_current_balance
  FROM public.user_profiles
  WHERE email = p_email
  FOR UPDATE;

  -- Cek apakah user ada
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'reason', 'user_not_found');
  END IF;

  -- Cek apakah saldo cukup
  IF v_current_balance < p_units THEN
    RETURN json_build_object(
      'success', false,
      'reason', 'insufficient_quota',
      'balance', v_current_balance,
      'required', p_units
    );
  END IF;

  -- Kurangi saldo
  v_new_balance := v_current_balance - p_units;
  UPDATE public.user_profiles
  SET quota_balance = v_new_balance, updated_at = now()
  WHERE email = p_email;

  -- Catat di log
  INSERT INTO public.quota_usage_logs (user_email, action_name, units_spent, description)
  VALUES (p_email, p_action, p_units, p_description);

  RETURN json_build_object('success', true, 'balance', v_new_balance);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNGSI: Buat profil user baru otomatis saat pertama login
-- ============================================================
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
