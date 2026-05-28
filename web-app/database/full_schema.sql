-- ============================================================
-- SKEMA DATABASE LENGKAP (FULL SCHEMA) - Moderasi Judol V1
-- Jalankan skrip ini di SQL Editor Supabase untuk membangun
-- seluruh infrastruktur tabel, RLS, indeks, dan fungsi dari nol.
-- ============================================================

-- 1. TABEL PROFIL PENGGUNA (Saldo Kuota Terpisah)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email              TEXT UNIQUE NOT NULL,
  tier               TEXT NOT NULL DEFAULT 'FREE',   -- 'FREE' | 'PRO' | 'ENTERPRISE'

  -- === KUOTA LANGGANAN (Subscription Quota) ===
  -- Didapat dari pembelian paket PRO/ENTERPRISE
  -- HANGUS saat masa aktif habis (auto-downgrade ke FREE)
  subscription_quota INTEGER NOT NULL DEFAULT 0,

  -- === KREDIT TOP-UP (Purchased Credits) ===
  -- Didapat dari pembelian paket top-up (sekali bayar)
  -- TIDAK PERNAH HANGUS, bertahan selamanya
  topup_credits      INTEGER NOT NULL DEFAULT 0,

  -- === KUOTA TRIAL AWAL (One-Time Trial) ===
  -- Diberikan 1x saat pertama kali registrasi
  -- Tidak bisa diisi ulang, bertahan selamanya
  trial_quota        INTEGER NOT NULL DEFAULT 1000,

  -- === BATAS KUOTA MAKSIMAL (Derived dari tier) ===
  quota_limit        INTEGER NOT NULL DEFAULT 1000,  -- FREE=1000 | PRO=50000 | ENT=999999

  -- === MASA AKTIF LANGGANAN ===
  -- NULL = tidak ada langganan aktif (tier FREE / trial)
  -- Timestamp = tanggal kedaluwarsa subscription PRO/ENTERPRISE
  quota_expiry       TIMESTAMPTZ DEFAULT NULL,

  last_reset         TIMESTAMPTZ DEFAULT now(),
  created_at         TIMESTAMPTZ DEFAULT now(),
  updated_at         TIMESTAMPTZ DEFAULT now()
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

-- ──────────────────────────────────────────────────────────────
-- Fungsi 1: Pengurangan Kuota secara Atomic (Thread-Safe)
-- 
-- Urutan Pemotongan Kuota:
--   1. subscription_quota (paling rentan hangus, potong dulu)
--   2. topup_credits      (dibeli user, potong kedua)
--   3. trial_quota        (jatah gratis awal, potong terakhir)
--
-- Strategi ini memaksimalkan value top-up credits user.
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.deduct_quota(
  p_email TEXT,
  p_units INTEGER,
  p_action TEXT,
  p_description TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_sub_quota INTEGER;
  v_topup INTEGER;
  v_trial INTEGER;
  v_total_balance INTEGER;
  v_expiry TIMESTAMPTZ;
  v_tier TEXT;
  v_remaining INTEGER;
BEGIN
  -- Lock baris untuk mencegah race condition (dobel klik / konkurensi)
  SELECT subscription_quota, topup_credits, trial_quota, quota_expiry, tier
  INTO v_sub_quota, v_topup, v_trial, v_expiry, v_tier
  FROM public.user_profiles
  WHERE email = p_email
  FOR UPDATE;

  -- Cek keberadaan pengguna
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'reason', 'user_not_found');
  END IF;

  -- Pengecekan kedaluwarsa dinamis: Auto-downgrade jika masa aktif habis
  -- Hanya subscription_quota yang HANGUS, topup_credits & trial_quota TETAP
  IF v_tier IN ('PRO', 'ENTERPRISE') AND v_expiry IS NOT NULL AND v_expiry < now() THEN
    v_tier := 'FREE';
    v_sub_quota := 0;

    UPDATE public.user_profiles
    SET tier = 'FREE',
        quota_limit = 1000,
        subscription_quota = 0,
        quota_expiry = NULL,
        updated_at = now()
    WHERE email = p_email;
  END IF;

  -- Hitung total balance dari ketiga sumber kuota
  v_total_balance := v_sub_quota + v_topup + v_trial;

  -- Cek apakah total kuota mencukupi
  IF v_total_balance < p_units THEN
    RETURN json_build_object(
      'success', false,
      'reason', 'insufficient_quota',
      'balance', v_total_balance,
      'required', p_units
    );
  END IF;

  -- === Pemotongan Kuota Bertahap ===
  v_remaining := p_units;

  -- Tahap 1: Potong subscription_quota dulu (paling rentan hangus)
  IF v_remaining > 0 AND v_sub_quota > 0 THEN
    IF v_sub_quota >= v_remaining THEN
      v_sub_quota := v_sub_quota - v_remaining;
      v_remaining := 0;
    ELSE
      v_remaining := v_remaining - v_sub_quota;
      v_sub_quota := 0;
    END IF;
  END IF;

  -- Tahap 2: Potong topup_credits (dibeli user, potong kedua)
  IF v_remaining > 0 AND v_topup > 0 THEN
    IF v_topup >= v_remaining THEN
      v_topup := v_topup - v_remaining;
      v_remaining := 0;
    ELSE
      v_remaining := v_remaining - v_topup;
      v_topup := 0;
    END IF;
  END IF;

  -- Tahap 3: Potong trial_quota (jatah gratis, potong terakhir)
  IF v_remaining > 0 AND v_trial > 0 THEN
    IF v_trial >= v_remaining THEN
      v_trial := v_trial - v_remaining;
      v_remaining := 0;
    ELSE
      v_remaining := v_remaining - v_trial;
      v_trial := 0;
    END IF;
  END IF;

  -- Simpan perubahan saldo ke database
  UPDATE public.user_profiles
  SET subscription_quota = v_sub_quota,
      topup_credits = v_topup,
      trial_quota = v_trial,
      updated_at = now()
  WHERE email = p_email;

  -- Catat riwayat audit log kuota
  INSERT INTO public.quota_usage_logs (user_email, action_name, units_spent, description)
  VALUES (p_email, p_action, p_units, p_description);

  RETURN json_build_object(
    'success', true,
    'balance', v_sub_quota + v_topup + v_trial
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ──────────────────────────────────────────────────────────────
-- Fungsi 2: Pembuatan Profil User Otomatis saat pertama login
-- 
-- Logika Auto-Downgrade:
--   - Jika PRO/ENTERPRISE dan masa aktif habis → downgrade ke FREE
--   - subscription_quota di-reset ke 0 (HANGUS)
--   - topup_credits & trial_quota TIDAK diubah (BERTAHAN)
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.ensure_user_profile(p_email TEXT)
RETURNS public.user_profiles AS $$
DECLARE
  v_profile public.user_profiles;
BEGIN
  -- Auto-create profil jika user pertama kali login
  INSERT INTO public.user_profiles (email)
  VALUES (p_email)
  ON CONFLICT (email) DO NOTHING;

  -- Auto-downgrade ke FREE jika masa aktif habis
  -- Hanya subscription_quota yang HANGUS, kredit lainnya TETAP
  UPDATE public.user_profiles
  SET tier = 'FREE',
      quota_limit = 1000,
      subscription_quota = 0,
      quota_expiry = NULL,
      updated_at = now()
  WHERE email = p_email
    AND tier IN ('PRO', 'ENTERPRISE')
    AND quota_expiry IS NOT NULL
    AND quota_expiry < now();

  -- Kembalikan profil terupdate
  SELECT * INTO v_profile FROM public.user_profiles WHERE email = p_email;
  RETURN v_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
