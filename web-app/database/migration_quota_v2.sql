-- ============================================================
-- MIGRASI DATABASE: Upgrade Skema Kuota V1 → V2
-- Jalankan skrip ini di SQL Editor Supabase SEKALI SAJA
-- untuk migrasi data dari sistem kuota lama ke baru.
--
-- PERUBAHAN:
--   1. Kolom quota_balance → dipecah menjadi:
--      - subscription_quota (hangus saat expire)
--      - topup_credits (permanen)
--      - trial_quota (permanen, sekali pakai)
--   2. Tabel transactions ditambah kolom:
--      - package_id (ID paket dari SECURE_PACKAGES)
--      - duration_days (durasi masa aktif dalam hari)
-- ============================================================

-- ══════════════════════════════════════════════════════════════
-- LANGKAH 1: Tambah kolom baru ke user_profiles
-- ══════════════════════════════════════════════════════════════
ALTER TABLE public.user_profiles 
  ADD COLUMN IF NOT EXISTS subscription_quota INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.user_profiles 
  ADD COLUMN IF NOT EXISTS topup_credits INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.user_profiles 
  ADD COLUMN IF NOT EXISTS trial_quota INTEGER NOT NULL DEFAULT 1000;

-- ══════════════════════════════════════════════════════════════
-- LANGKAH 2: Migrasi data dari quota_balance lama
-- ══════════════════════════════════════════════════════════════

-- Untuk user FREE: balance awal <= 1000 → masuk trial_quota, sisanya → topup_credits
UPDATE public.user_profiles 
SET trial_quota = LEAST(quota_balance, 1000),
    topup_credits = GREATEST(quota_balance - 1000, 0),
    subscription_quota = 0
WHERE tier = 'FREE';

-- Untuk user PRO/ENTERPRISE: seluruh balance → subscription_quota
UPDATE public.user_profiles 
SET subscription_quota = quota_balance,
    trial_quota = 0,
    topup_credits = 0
WHERE tier IN ('PRO', 'ENTERPRISE');

-- ══════════════════════════════════════════════════════════════
-- LANGKAH 3: Tambah kolom baru ke transactions
-- ══════════════════════════════════════════════════════════════
ALTER TABLE public.transactions 
  ADD COLUMN IF NOT EXISTS package_id TEXT NOT NULL DEFAULT 'unknown';

ALTER TABLE public.transactions 
  ADD COLUMN IF NOT EXISTS duration_days INTEGER NOT NULL DEFAULT 0;

-- ══════════════════════════════════════════════════════════════
-- LANGKAH 4: Re-create fungsi deduct_quota (V2 dengan 3-tier deduction)
-- ══════════════════════════════════════════════════════════════
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
  -- Lock baris untuk mencegah race condition
  SELECT subscription_quota, topup_credits, trial_quota, quota_expiry, tier
  INTO v_sub_quota, v_topup, v_trial, v_expiry, v_tier
  FROM public.user_profiles
  WHERE email = p_email
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'reason', 'user_not_found');
  END IF;

  -- Auto-downgrade jika expired (hanya subscription_quota HANGUS)
  IF v_tier IN ('PRO', 'ENTERPRISE') AND v_expiry IS NOT NULL AND v_expiry < now() THEN
    v_tier := 'FREE';
    v_sub_quota := 0;
    UPDATE public.user_profiles
    SET tier = 'FREE', quota_limit = 1000,
        subscription_quota = 0, quota_expiry = NULL, updated_at = now()
    WHERE email = p_email;
  END IF;

  v_total_balance := v_sub_quota + v_topup + v_trial;

  IF v_total_balance < p_units THEN
    RETURN json_build_object('success', false, 'reason', 'insufficient_quota',
      'balance', v_total_balance, 'required', p_units);
  END IF;

  -- Pemotongan bertahap: subscription → topup → trial
  v_remaining := p_units;

  IF v_remaining > 0 AND v_sub_quota > 0 THEN
    IF v_sub_quota >= v_remaining THEN
      v_sub_quota := v_sub_quota - v_remaining; v_remaining := 0;
    ELSE
      v_remaining := v_remaining - v_sub_quota; v_sub_quota := 0;
    END IF;
  END IF;

  IF v_remaining > 0 AND v_topup > 0 THEN
    IF v_topup >= v_remaining THEN
      v_topup := v_topup - v_remaining; v_remaining := 0;
    ELSE
      v_remaining := v_remaining - v_topup; v_topup := 0;
    END IF;
  END IF;

  IF v_remaining > 0 AND v_trial > 0 THEN
    IF v_trial >= v_remaining THEN
      v_trial := v_trial - v_remaining; v_remaining := 0;
    ELSE
      v_remaining := v_remaining - v_trial; v_trial := 0;
    END IF;
  END IF;

  UPDATE public.user_profiles
  SET subscription_quota = v_sub_quota, topup_credits = v_topup, trial_quota = v_trial, updated_at = now()
  WHERE email = p_email;

  INSERT INTO public.quota_usage_logs (user_email, action_name, units_spent, description)
  VALUES (p_email, p_action, p_units, p_description);

  RETURN json_build_object('success', true, 'balance', v_sub_quota + v_topup + v_trial);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ══════════════════════════════════════════════════════════════
-- LANGKAH 5: Re-create fungsi ensure_user_profile (V2)
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.ensure_user_profile(p_email TEXT)
RETURNS public.user_profiles AS $$
DECLARE
  v_profile public.user_profiles;
BEGIN
  INSERT INTO public.user_profiles (email)
  VALUES (p_email)
  ON CONFLICT (email) DO NOTHING;

  -- Auto-downgrade: hanya subscription_quota HANGUS
  UPDATE public.user_profiles
  SET tier = 'FREE', quota_limit = 1000, subscription_quota = 0,
      quota_expiry = NULL, updated_at = now()
  WHERE email = p_email
    AND tier IN ('PRO', 'ENTERPRISE')
    AND quota_expiry IS NOT NULL
    AND quota_expiry < now();

  SELECT * INTO v_profile FROM public.user_profiles WHERE email = p_email;
  RETURN v_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ══════════════════════════════════════════════════════════════
-- SELESAI! Verifikasi migrasi:
-- ══════════════════════════════════════════════════════════════
-- SELECT email, tier, subscription_quota, topup_credits, trial_quota, 
--        (subscription_quota + topup_credits + trial_quota) AS total_balance,
--        quota_expiry
-- FROM public.user_profiles
-- LIMIT 10;
