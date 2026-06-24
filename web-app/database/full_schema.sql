-- ============================================================
-- SKEMA DATABASE LENGKAP (FULL SCHEMA) - Athena Guard (V2)
-- Jalankan skrip ini di SQL Editor Supabase untuk membangun
-- seluruh infrastruktur tabel, RLS, indeks, fungsi, dan seed dari nol.
-- ============================================================

-- ══════════════════════════════════════════════════════════════
-- 1. PEMBUATAN TABEL-TABEL UTAMA
-- ══════════════════════════════════════════════════════════════

-- A. Tabel Profil Pengguna (User Profiles)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email              TEXT UNIQUE NOT NULL,
  tier               TEXT NOT NULL DEFAULT 'FREE',   -- 'FREE' | 'PRO' | 'ENTERPRISE'
  role               TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superadmin')),
  is_active          BOOLEAN NOT NULL DEFAULT true,

  -- === KUOTA LANGGANAN (Subscription Quota) ===
  -- Didapat dari pembelian paket subskripsi PRO/ENTERPRISE
  -- HANGUS saat masa aktif habis (auto-downgrade ke FREE)
  subscription_quota INTEGER NOT NULL DEFAULT 0,

  -- === KUOTA TRIAL AWAL (One-Time Trial) ===
  -- Diberikan 1x saat pertama kali registrasi
  -- Tidak bisa diisi ulang, bertahan selamanya (selama berstatus FREE)
  trial_quota        INTEGER NOT NULL DEFAULT 1000,

  -- === BATAS KUOTA MAKSIMAL (Derived dari tier) ===
  quota_limit        INTEGER NOT NULL DEFAULT 1000,  -- FREE=1000 | PRO=50000 | ENT=999999

  -- === MASA AKTIF LANGGANAN ===
  -- NULL = tidak ada langganan aktif (tier FREE / trial)
  -- Timestamp = tanggal kedaluwarsa subscription PRO/ENTERPRISE
  quota_expiry       TIMESTAMPTZ DEFAULT NULL,

  -- === ID PAKET AKTIF ===
  active_package_id  TEXT REFERENCES public.pricing_packages(id) ON DELETE SET NULL DEFAULT NULL,

  last_reset         TIMESTAMPTZ DEFAULT now(),
  created_at         TIMESTAMPTZ DEFAULT now(),
  updated_at         TIMESTAMPTZ DEFAULT now()
);

-- B. Tabel Log Pemakaian Kuota (Quota Usage Logs)
CREATE TABLE IF NOT EXISTS public.quota_usage_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email  TEXT NOT NULL REFERENCES public.user_profiles(email) ON DELETE CASCADE,
  action_name TEXT NOT NULL,    -- 'FETCH_COMMENTS' | 'MODERATE_SINGLE' | 'MODERATE_BATCH' | 'SUBSCRIPTION'
  units_spent INTEGER NOT NULL, -- Jumlah kuota yang dipotong (negatif untuk penambahan/top-up)
  description TEXT,             -- Keterangan audit
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- C. Tabel Pengaturan Preferensi User (User Settings)
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

-- D. Tabel Riwayat Moderasi Komentar (Moderation History)
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
  ai_confidence   DOUBLE PRECISION,     -- Skor kepastian AI
  sentiment       TEXT,                 -- Sentimen ('Positif' | 'Negatif' | 'Netral')
  sentiment_score DOUBLE PRECISION,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- E. Tabel Paket Langganan (Pricing Packages)
CREATE TABLE IF NOT EXISTS public.pricing_packages (
  id                     TEXT PRIMARY KEY, -- e.g. 'FREE', 'PRO_1M', 'ENTERPRISE_12M'
  name                   TEXT NOT NULL,
  type                   TEXT NOT NULL DEFAULT 'subscription' CHECK (type IN ('subscription')),
  tier                   TEXT NOT NULL DEFAULT 'FREE' CHECK (tier IN ('FREE', 'PRO', 'ENTERPRISE')),
  price                  INTEGER NOT NULL,
  original_price         INTEGER, -- Nullable untuk harga sebelum diskon
  quota_units            INTEGER NOT NULL,
  duration_days          INTEGER NOT NULL, -- Durasi masa aktif dalam hari
  billing_cycle          TEXT NOT NULL CHECK (billing_cycle IN ('1M', '3M', '6M', '12M')), -- Siklus penagihan paket
  description            TEXT,
  features               TEXT[] DEFAULT '{}',
  disabled_features      TEXT[] DEFAULT '{}',
  badge                  TEXT,
  allow_bulk_moderation  BOOLEAN NOT NULL DEFAULT false,
  allow_export_csv       BOOLEAN NOT NULL DEFAULT false,
  allow_auto_moderation  BOOLEAN NOT NULL DEFAULT false,
  is_active              BOOLEAN NOT NULL DEFAULT true,
  created_at             TIMESTAMPTZ DEFAULT now(),
  updated_at             TIMESTAMPTZ DEFAULT now()
);

-- F. Tabel Transaksi Pembayaran (Transactions - Midtrans)
CREATE TABLE IF NOT EXISTS public.transactions (
  id                    TEXT PRIMARY KEY,                        -- Order ID dari Midtrans (contoh: ATHENA-TRX-12345)
  user_email            TEXT NOT NULL REFERENCES public.user_profiles(email) ON DELETE CASCADE,
  package_id            TEXT NOT NULL REFERENCES public.pricing_packages(id) ON DELETE RESTRICT,
  transaction_type      TEXT NOT NULL DEFAULT 'subscription' CHECK (transaction_type IN ('subscription')),
  amount                INTEGER NOT NULL,                        -- Nominal pembayaran (Rupiah)
  quota_units           INTEGER NOT NULL,                        -- Jumlah kuota yang didapat
  target_tier           TEXT NOT NULL DEFAULT 'FREE' CHECK (target_tier IN ('FREE', 'PRO', 'ENTERPRISE')),
  duration_days         INTEGER NOT NULL DEFAULT 30,             -- Durasi langganan dalam hari
  status                TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'settlement', 'cancelled', 'expired', 'failed')),

  -- === METADATA MIDTRANS ===
  snap_token            TEXT,                                    -- Token Snap untuk membuka popup pembayaran
  snap_redirect_url     TEXT,                                    -- URL redirect fallback
  midtrans_payment_type TEXT,                                    -- Metode bayar: 'bank_transfer', 'gopay', 'credit_card', dll

  -- === EVENT TIMESTAMPS (Audit Trail) ===
  paid_at               TIMESTAMPTZ DEFAULT NULL,                -- Waktu pembayaran berhasil
  cancelled_at          TIMESTAMPTZ DEFAULT NULL,                -- Waktu dibatalkan
  expired_at            TIMESTAMPTZ DEFAULT NULL,                -- Waktu kedaluwarsa pembayaran

  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

-- G. Tabel Log Audit Admin (Admin Audit Logs)
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email  TEXT NOT NULL REFERENCES public.user_profiles(email) ON DELETE CASCADE,
  action       TEXT NOT NULL,        -- 'CHANGE_TIER', 'UPDATE_QUOTA', 'SUSPEND_USER', 'CHANGE_ROLE'
  target_email TEXT,                 -- Email user yang dikenai tindakan
  details      JSONB,                -- Detail data sebelum & sesudah perubahan
  ip_address   TEXT,                 -- IP address pelaksana tindakan
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════════════════════
-- 2. INDEKS DATABASE (Untuk Optimasi Kecepatan Query)
-- ══════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_active ON public.user_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_quota_usage_logs_email ON public.quota_usage_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_quota_usage_logs_created ON public.quota_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_history_email ON public.moderation_history(user_email);
CREATE INDEX IF NOT EXISTS idx_moderation_history_created ON public.moderation_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pricing_packages_active ON public.pricing_packages(is_active);
CREATE INDEX IF NOT EXISTS idx_transactions_email ON public.transactions(user_email);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin ON public.admin_audit_logs(admin_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON public.admin_audit_logs(target_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.admin_audit_logs(created_at DESC);

-- ══════════════════════════════════════════════════════════════
-- 3. KEBIJAKAN KEAMANAN (Row Level Security - RLS)
-- ══════════════════════════════════════════════════════════════
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quota_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- A. Kebijakan Baca Mandiri (User mengakses data miliknya sendiri)
CREATE POLICY "Users can read own profile" ON public.user_profiles FOR SELECT
  USING (email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Users can read own logs" ON public.quota_usage_logs FOR SELECT
  USING (user_email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Users can read own settings" ON public.user_settings FOR SELECT
  USING (user_email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Users can read own history" ON public.moderation_history FOR SELECT
  USING (user_email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Users can read own transactions" ON public.transactions FOR SELECT
  USING (user_email = current_setting('request.jwt.claims', true)::json->>'email');

-- B. Kebijakan Publik (Siapa saja bisa membaca paket aktif)
CREATE POLICY "Allow public read active packages" ON public.pricing_packages FOR SELECT
  USING (is_active = true);

-- C. Kebijakan Administrator (Admin/Superadmin bisa membaca data dashboard)
CREATE POLICY "Admins can read all user profiles" ON public.user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
        AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Admins can read all moderation histories" ON public.moderation_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
        AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Admins can read all transactions" ON public.transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
        AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Admins can read all packages" ON public.pricing_packages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
        AND role IN ('admin', 'superadmin')
    )
  );

-- D. Kebijakan Service Role (API Route server-side Next.js dengan Service Key memiliki akses penuh)
CREATE POLICY "Service role can manage profiles" ON public.user_profiles FOR ALL USING (current_setting('role') = 'service_role');
CREATE POLICY "Service role can manage logs" ON public.quota_usage_logs FOR ALL USING (current_setting('role') = 'service_role');
CREATE POLICY "Service role can manage settings" ON public.user_settings FOR ALL USING (current_setting('role') = 'service_role');
CREATE POLICY "Service role can manage history" ON public.moderation_history FOR ALL USING (current_setting('role') = 'service_role');
CREATE POLICY "Service role can manage pricing_packages" ON public.pricing_packages FOR ALL USING (current_setting('role') = 'service_role');
CREATE POLICY "Service role can manage transactions" ON public.transactions FOR ALL USING (current_setting('role') = 'service_role');
CREATE POLICY "Service role can manage audit logs" ON public.admin_audit_logs FOR ALL USING (current_setting('role') = 'service_role');


-- ══════════════════════════════════════════════════════════════
-- 4. FUNGSI & TRIGGER DATABASE (PL/pgSQL)
-- ══════════════════════════════════════════════════════════════

-- A. Fungsi deduct_quota: Pemotongan kuota secara aman (thread-safe) 2-tier (Subscription -> Trial)
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

  -- Hitung total balance dari subscription & trial saja (top-up diabaikan)
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

  -- Simpan perubahan saldo ke database
  UPDATE public.user_profiles
  SET subscription_quota = v_sub_quota,
      trial_quota = v_trial,
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


-- B. Fungsi ensure_user_profile: Pembuatan profil otomatis dan pemeriksaan auto-downgrade
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
  -- Hanya subscription_quota yang HANGUS
  UPDATE public.user_profiles
  SET tier = 'FREE',
      quota_limit = 1000,
      subscription_quota = 0,
      quota_expiry = NULL,
      active_package_id = NULL,
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


-- ══════════════════════════════════════════════════════════════
-- 5. SEED DATA (Paket Default Langganan Aktif)
-- ══════════════════════════════════════════════════════════════
INSERT INTO public.pricing_packages (
  id, name, type, tier, price, original_price, quota_units, duration_days, billing_cycle, description, features, disabled_features, badge, allow_bulk_moderation, allow_export_csv, allow_auto_moderation, is_active
) VALUES 
  -- === PAKET LANGGANAN ===
  -- FREE TRIAL (30 Hari)
  ('FREE', 'Free Trial', 'subscription', 'FREE', 0, NULL, 1000, 30, '1M',
   'Untuk percobaan & penggunaan pribadi ringan awal.', 
   ARRAY[
     'Jatah 1.000 poin trial awal (sekali pakai saat pertama kali daftar)',
     'Penyaringan komentar manual',
     'Analisis AI (Iklan Judi & Emosi Penonton)',
     'Riwayat tindakan penyaringan'
   ],
   ARRAY[
     'Penyaringan Otomatis',
     'Pengecekan berkala otomatis',
     'Pilihan banyak video sekaligus'
   ],
   NULL, false, false, false, true),

  -- PRO BULANAN (1M)
  ('PRO_1M', 'Pro', 'subscription', 'PRO', 49000, NULL, 50000, 30, '1M',
   'Untuk content creator aktif dengan video yang sering ramai komentar.',
   ARRAY[
     'Jatah 50.000 poin untuk 1 bulan',
     'Semua fitur Free',
     'Penyaringan Otomatis (Tahan & Hapus)',
     'Pemeriksaan otomatis tiap 2 menit',
     'Pilih banyak video & hapus massal sekaligus',
     
   ],
   ARRAY[]::TEXT[],
   '🔥 Paling Populer', true, true, true, true),

  -- PRO 3 BULAN (3M)
  ('PRO_3M', 'Pro', 'subscription', 'PRO', 139000, 147000, 150000, 90, '3M',
   'Untuk content creator aktif dengan video yang sering ramai komentar.',
   ARRAY[
     'Jatah 150.000 poin untuk 3 bulan',
     'Semua fitur Free',
     'Penyaringan Otomatis (Tahan & Hapus)',
     'Pemeriksaan otomatis tiap 2 menit',
     'Pilih banyak video & hapus massal sekaligus',
     
   ],
   ARRAY[]::TEXT[],
   '🔥 Paling Populer', true, true, true, true),

  -- PRO 6 BULAN (6M)
  ('PRO_6M', 'Pro', 'subscription', 'PRO', 264000, 294000, 300000, 180, '6M',
   'Untuk content creator aktif dengan video yang sering ramai komentar.',
   ARRAY[
     'Jatah 300.000 poin untuk 6 bulan',
     'Semua fitur Free',
     'Penyaringan Otomatis (Tahan & Hapus)',
     'Pemeriksaan otomatis tiap 2 menit',
     'Pilih banyak video & hapus massal sekaligus',
     
   ],
   ARRAY[]::TEXT[],
   '🔥 Paling Populer', true, true, true, true),

  -- PRO 1 TAHUN (12M)
  ('PRO_12M', 'Pro', 'subscription', 'PRO', 470000, 588000, 600000, 360, '12M',
   'Untuk content creator aktif dengan video yang sering ramai komentar.',
   ARRAY[
     'Jatah 600.000 poin untuk 1 tahun',
     'Semua fitur Free',
     'Penyaringan Otomatis (Tahan & Hapus)',
     'Pemeriksaan otomatis tiap 2 menit',
     'Pilih banyak video & hapus massal sekaligus',
     
   ],
   ARRAY[]::TEXT[],
   '🔥 Paling Populer', true, true, true, true),

  -- ENTERPRISE BULANAN (1M)
  ('ENTERPRISE_1M', 'Enterprise', 'subscription', 'ENTERPRISE', 149000, NULL, 999999, 30, '1M',
   'Untuk agency atau channel dengan volume komentar sangat tinggi.',
   ARRAY[
     'Bebas dari batasan kuota YouTube*',
     'Semua fitur Pro',
     'Gunakan Kunci Akses YouTube Sendiri (Gratis)',
     
   ],
   ARRAY[]::TEXT[],
   '⭐ Terlengkap', true, true, true, true),

  -- ENTERPRISE 3 BULAN (3M)
  ('ENTERPRISE_3M', 'Enterprise', 'subscription', 'ENTERPRISE', 424000, 447000, 999999, 90, '3M',
   'Untuk agency atau channel dengan volume komentar sangat tinggi.',
   ARRAY[
     'Bebas dari batasan kuota YouTube*',
     'Semua fitur Pro',
     'Gunakan Kunci Akses YouTube Sendiri (Gratis)',
     
   ],
   ARRAY[]::TEXT[],
   '⭐ Terlengkap', true, true, true, true),

  -- ENTERPRISE 6 BULAN (6M)
  ('ENTERPRISE_6M', 'Enterprise', 'subscription', 'ENTERPRISE', 804000, 894000, 999999, 180, '6M',
   'Untuk agency atau channel dengan volume komentar sangat tinggi.',
   ARRAY[
     'Bebas dari batasan kuota YouTube*',
     'Semua fitur Pro',
     'Gunakan Kunci Akses YouTube Sendiri (Gratis)',
     
   ],
   ARRAY[]::TEXT[],
   '⭐ Terlengkap', true, true, true, true),

  -- ENTERPRISE 1 TAHUN (12M)
  ('ENTERPRISE_12M', 'Enterprise', 'subscription', 'ENTERPRISE', 1430000, 1788000, 999999, 360, '12M',
   'Untuk agency atau channel dengan volume komentar sangat tinggi.',
   ARRAY[
     'Bebas dari batasan kuota YouTube*',
     'Semua fitur Pro',
     'Gunakan Kunci Akses YouTube Sendiri (Gratis)',
     
   ],
   ARRAY[]::TEXT[],
   '⭐ Terlengkap', true, true, true, true)

ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  tier = EXCLUDED.tier,
  price = EXCLUDED.price,
  original_price = EXCLUDED.original_price,
  quota_units = EXCLUDED.quota_units,
  duration_days = EXCLUDED.duration_days,
  billing_cycle = EXCLUDED.billing_cycle,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  disabled_features = EXCLUDED.disabled_features,
  badge = EXCLUDED.badge,
  allow_bulk_moderation = EXCLUDED.allow_bulk_moderation,
  allow_export_csv = EXCLUDED.allow_export_csv,
  allow_auto_moderation = EXCLUDED.allow_auto_moderation,
  is_active = EXCLUDED.is_active,
  updated_at = now();
