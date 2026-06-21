-- ============================================================
-- MIGRASI DATABASE: Penyederhanaan Logika Kuota (Hapus Top-up)
-- Jalankan skrip ini di SQL Editor Supabase
--
-- PERUBAHAN:
--   1. Fungsi deduct_quota diubah menjadi 2-tier: Subscription → Trial
--   2. Reset seluruh nilai kolom topup_credits di tabel user_profiles ke 0
-- ============================================================

-- ══════════════════════════════════════════════════════════════
-- LANGKAH 1: Reset topup_credits seluruh user ke 0
-- ══════════════════════════════════════════════════════════════
UPDATE public.user_profiles 
SET topup_credits = 0;

-- ══════════════════════════════════════════════════════════════
-- LANGKAH 2: Re-create fungsi deduct_quota (2-tier deduction)
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
  v_trial INTEGER;
  v_total_balance INTEGER;
  v_expiry TIMESTAMPTZ;
  v_tier TEXT;
  v_remaining INTEGER;
BEGIN
  -- Lock baris untuk mencegah race condition (dobel klik / konkurensi)
  SELECT subscription_quota, trial_quota, quota_expiry, tier
  INTO v_sub_quota, v_trial, v_expiry, v_tier
  FROM public.user_profiles
  WHERE email = p_email
  FOR UPDATE;

  -- Cek keberadaan pengguna
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'reason', 'user_not_found');
  END IF;

  -- Pengecekan kedaluwarsa dinamis: Auto-downgrade jika masa aktif habis
  -- Hanya subscription_quota yang HANGUS, trial_quota TETAP
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

  -- Hitung total balance dari subscription & trial saja
  v_total_balance := v_sub_quota + v_trial;

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

  -- Tahap 2: Potong trial_quota (jatah gratis, potong terakhir)
  IF v_remaining > 0 AND v_trial > 0 THEN
    IF v_trial >= v_remaining THEN
      v_trial := v_trial - v_remaining;
      v_remaining := 0;
    ELSE
      v_remaining := v_remaining - v_trial;
      v_trial := 0;
    END IF;
  END IF;

  -- Simpan perubahan saldo ke database (selalu paksa topup_credits ke 0)
  UPDATE public.user_profiles
  SET subscription_quota = v_sub_quota,
      trial_quota = v_trial,
      topup_credits = 0,
      updated_at = now()
  WHERE email = p_email;

  -- Catat riwayat audit log kuota
  INSERT INTO public.quota_usage_logs (user_email, action_name, units_spent, description)
  VALUES (p_email, p_action, p_units, p_description);

  RETURN json_build_object(
    'success', true,
    'balance', v_sub_quota + v_trial
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
