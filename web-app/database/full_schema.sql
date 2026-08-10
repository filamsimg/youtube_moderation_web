-- ============================================================
-- SKEMA DATABASE LENGKAP (FULL SCHEMA) - Athena Shield (V3 - Final)
-- Versi ini sudah diselaraskan penuh dengan kode aplikasi Next.js.
--
-- Perubahan dari V2:
-- [x] pricing_packages dibuat LEBIH AWAL (user_profiles merujuk ke sana via FK)
-- [x] Kolom `theme` dihapus dari user_settings (tema kini mengikuti OS secara otomatis)
-- [x] Kolom `active_package_id` ditambahkan di user_profiles (diperlukan webhook Midtrans)
-- [x] Kolom `color` dihapus dari pricing_packages (tidak digunakan oleh kode aplikasi)
-- [x] Kolom `quota_balance` TIDAK ada (dihitung dinamis di JS: subscription + trial)
-- [x] user_settings menggunakan user_email sebagai PK (konsisten dengan DB asli)
-- [x] Urutan CREATE TABLE diperbaiki agar FK references tidak menyebabkan error
--
-- CARA PAKAI:
-- 1. Buka Supabase Dashboard > SQL Editor > New Query
-- 2. Copy-paste seluruh isi file ini
-- 3. Klik Run
-- ============================================================

-- ══════════════════════════════════════════════════════════════
-- BAGIAN 1: PEMBUATAN TABEL
-- Urutan penting: pricing_packages harus dibuat duluan karena
-- user_profiles.active_package_id menggunakan FK ke pricing_packages.
-- ══════════════════════════════════════════════════════════════

-- ── A. Tabel Paket Langganan (Pricing Packages) ──────────────
-- Dibuat paling awal karena dirujuk oleh user_profiles
CREATE TABLE IF NOT EXISTS public.pricing_packages (
  id                     TEXT PRIMARY KEY,                  -- e.g. 'FREE', 'PRO_1M', 'ENTERPRISE_12M'
  name                   TEXT NOT NULL,
  type                   TEXT NOT NULL DEFAULT 'subscription'
                           CHECK (type IN ('subscription', 'topup')),
  tier                   TEXT NOT NULL DEFAULT 'FREE'
                           CHECK (tier IN ('FREE', 'PRO', 'ENTERPRISE')),
  price                  INTEGER NOT NULL,
  original_price         INTEGER,                           -- Nullable, harga sebelum diskon
  quota_units            INTEGER NOT NULL,
  duration_days          INTEGER NOT NULL,
  billing_cycle          TEXT CHECK (billing_cycle IN ('1M', '3M', '6M', '12M')),
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

-- ── B. Tabel Profil Pengguna (User Profiles) ─────────────────
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email              TEXT UNIQUE NOT NULL,
  tier               TEXT NOT NULL DEFAULT 'FREE'
                       CHECK (tier IN ('FREE', 'PRO', 'ENTERPRISE')),
  role               TEXT NOT NULL DEFAULT 'user'
                       CHECK (role IN ('user', 'admin', 'superadmin')),
  is_active          BOOLEAN NOT NULL DEFAULT true,

  -- Kuota dari pembelian paket PRO/ENTERPRISE (hangus saat expired)
  subscription_quota INTEGER NOT NULL DEFAULT 0,

  -- Kuota trial gratis awal (diberikan 1x saat registrasi, tidak hangus)
  trial_quota        INTEGER NOT NULL DEFAULT 1000,

  -- Batas kapasitas kuota berdasarkan tier (FREE=1000, PRO=50000, ENT=999999)
  quota_limit        INTEGER NOT NULL DEFAULT 1000,

  -- Tanggal kedaluwarsa subscription PRO/ENTERPRISE (NULL = tidak ada langganan aktif)
  quota_expiry       TIMESTAMPTZ DEFAULT NULL,

  -- ID paket yang sedang aktif (diperlukan oleh webhook pembayaran Midtrans)
  active_package_id  TEXT REFERENCES public.pricing_packages(id) ON DELETE SET NULL DEFAULT NULL,

  -- API Key pribadi pengguna Enterprise (BYOK / Bring Your Own Key)
  youtube_api_key    TEXT DEFAULT NULL,

  last_reset         TIMESTAMPTZ DEFAULT now(),
  created_at         TIMESTAMPTZ DEFAULT now(),
  updated_at         TIMESTAMPTZ DEFAULT now()
);

-- ── C. Tabel Log Pemakaian Kuota (Quota Usage Logs) ──────────
CREATE TABLE IF NOT EXISTS public.quota_usage_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email  TEXT NOT NULL REFERENCES public.user_profiles(email) ON DELETE CASCADE,
  action_name TEXT NOT NULL,   -- 'FETCH_COMMENTS' | 'MODERATE_SINGLE' | 'MODERATE_BATCH' | 'SUBSCRIPTION'
  units_spent INTEGER NOT NULL, -- Positif = pemotongan kuota, Negatif = penambahan kuota
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ── D. Tabel Pengaturan Preferensi User (User Settings) ──────
-- CATATAN: Tidak ada kolom `theme`. Tema aplikasi mengikuti preferensi
-- sistem operasi (OS) pengguna secara otomatis via ThemeProvider.js.
-- user_email adalah Primary Key (konsisten dengan DB asli Supabase)
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_email       TEXT PRIMARY KEY REFERENCES public.user_profiles(email) ON DELETE CASCADE,
  auto_hapus       BOOLEAN NOT NULL DEFAULT false,
  auto_tahan       BOOLEAN NOT NULL DEFAULT true,
  threshold_reject INTEGER NOT NULL DEFAULT 90,
  threshold_hold   INTEGER NOT NULL DEFAULT 70,
  polling_interval INTEGER NOT NULL DEFAULT 120,
  batch_moderation BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- ── E. Tabel Riwayat Moderasi Komentar (Moderation History) ──
CREATE TABLE IF NOT EXISTS public.moderation_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email      TEXT NOT NULL REFERENCES public.user_profiles(email) ON DELETE CASCADE,
  channel_id      TEXT,
  comment_id      TEXT UNIQUE NOT NULL, -- ID unik komentar YouTube (mencegah duplikasi)
  action          TEXT NOT NULL,        -- 'published' | 'heldForReview' | 'rejected'
  comment_text    TEXT,
  author          TEXT,
  video_title     TEXT,
  ai_label        TEXT,                 -- 'Spam' | 'Normal'
  ai_confidence   DOUBLE PRECISION,     -- Skor kepercayaan AI (0.0 - 1.0)
  sentiment       TEXT,                 -- 'Positif' | 'Negatif' | 'Netral'
  sentiment_score DOUBLE PRECISION,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ── F. Tabel Transaksi Pembayaran (Transactions - Midtrans) ───
CREATE TABLE IF NOT EXISTS public.transactions (
  id                    TEXT PRIMARY KEY,  -- Order ID dari Midtrans (e.g. ATHENA-TRX-12345)
  user_email            TEXT NOT NULL REFERENCES public.user_profiles(email) ON DELETE CASCADE,
  package_id            TEXT NOT NULL REFERENCES public.pricing_packages(id) ON DELETE RESTRICT,
  transaction_type      TEXT NOT NULL DEFAULT 'subscription'
                          CHECK (transaction_type IN ('subscription', 'topup')),
  amount                INTEGER NOT NULL,   -- Nominal pembayaran (Rupiah)
  quota_units           INTEGER NOT NULL,   -- Jumlah kuota yang didapat
  target_tier           TEXT NOT NULL DEFAULT 'FREE'
                          CHECK (target_tier IN ('FREE', 'PRO', 'ENTERPRISE')),
  duration_days         INTEGER NOT NULL DEFAULT 30,
  status                TEXT NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending', 'settlement', 'cancelled', 'expired', 'failed')),

  -- Midtrans metadata
  snap_token            TEXT,
  snap_redirect_url     TEXT,
  midtrans_payment_type TEXT,              -- 'bank_transfer' | 'gopay' | 'credit_card' dll

  -- Event timestamps untuk audit trail
  paid_at               TIMESTAMPTZ DEFAULT NULL,
  cancelled_at          TIMESTAMPTZ DEFAULT NULL,
  expired_at            TIMESTAMPTZ DEFAULT NULL,

  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

-- ── G. Tabel Log Audit Admin (Admin Audit Logs) ───────────────
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email  TEXT NOT NULL REFERENCES public.user_profiles(email) ON DELETE CASCADE,
  action       TEXT NOT NULL,  -- 'CHANGE_TIER' | 'UPDATE_QUOTA' | 'SUSPEND_USER' | 'CHANGE_USER_ROLE'
  target_email TEXT,
  details      JSONB,           -- { before: {}, after: {} }
  ip_address   TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);


-- ══════════════════════════════════════════════════════════════
-- BAGIAN 2: INDEKS DATABASE (Optimasi Kecepatan Query)
-- ══════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_user_profiles_role     ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_active   ON public.user_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_user_profiles_tier     ON public.user_profiles(tier);
CREATE INDEX IF NOT EXISTS idx_quota_logs_email       ON public.quota_usage_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_quota_logs_created     ON public.quota_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mod_history_email      ON public.moderation_history(user_email);
CREATE INDEX IF NOT EXISTS idx_mod_history_created    ON public.moderation_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pricing_active         ON public.pricing_packages(is_active);
CREATE INDEX IF NOT EXISTS idx_transactions_email     ON public.transactions(user_email);
CREATE INDEX IF NOT EXISTS idx_transactions_status    ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin       ON public.admin_audit_logs(admin_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target      ON public.admin_audit_logs(target_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created     ON public.admin_audit_logs(created_at DESC);


-- ══════════════════════════════════════════════════════════════
-- BAGIAN 3: ROW LEVEL SECURITY (RLS)
-- DROP terlebih dahulu agar skrip bisa dijalankan ulang (idempotent)
-- ══════════════════════════════════════════════════════════════
ALTER TABLE public.user_profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quota_usage_logs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_packages   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs   ENABLE ROW LEVEL SECURITY;

-- Hapus policies lama agar tidak error jika sudah pernah dibuat sebelumnya
DROP POLICY IF EXISTS "Users can read own profile"           ON public.user_profiles;
DROP POLICY IF EXISTS "Users can read own quota logs"        ON public.quota_usage_logs;
DROP POLICY IF EXISTS "Users can read own settings"          ON public.user_settings;
DROP POLICY IF EXISTS "Users can read own history"           ON public.moderation_history;
DROP POLICY IF EXISTS "Users can read own transactions"      ON public.transactions;
DROP POLICY IF EXISTS "Public can read active packages"      ON public.pricing_packages;
DROP POLICY IF EXISTS "Admins can read all profiles"         ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can read all histories"        ON public.moderation_history;
DROP POLICY IF EXISTS "Admins can read all transactions"     ON public.transactions;
DROP POLICY IF EXISTS "Admins can read all packages"         ON public.pricing_packages;
DROP POLICY IF EXISTS "Service role full access profiles"    ON public.user_profiles;
DROP POLICY IF EXISTS "Service role full access quota_logs"  ON public.quota_usage_logs;
DROP POLICY IF EXISTS "Service role full access settings"    ON public.user_settings;
DROP POLICY IF EXISTS "Service role full access history"     ON public.moderation_history;
DROP POLICY IF EXISTS "Service role full access packages"    ON public.pricing_packages;
DROP POLICY IF EXISTS "Service role full access transactions" ON public.transactions;
DROP POLICY IF EXISTS "Service role full access audit_logs"  ON public.admin_audit_logs;
-- Hapus juga nama-nama lama dari full_schema V2 (jika pernah dijalankan)
DROP POLICY IF EXISTS "Users can read own profile"                     ON public.user_profiles;
DROP POLICY IF EXISTS "Users can read own logs"                        ON public.quota_usage_logs;
DROP POLICY IF EXISTS "Users can read own settings"                    ON public.user_settings;
DROP POLICY IF EXISTS "Users can read own history"                     ON public.moderation_history;
DROP POLICY IF EXISTS "Users can read own transactions"                ON public.transactions;
DROP POLICY IF EXISTS "Allow public read active packages"              ON public.pricing_packages;
DROP POLICY IF EXISTS "Admins can read all user profiles"              ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can read all moderation histories"       ON public.moderation_history;
DROP POLICY IF EXISTS "Admins can read all transactions"               ON public.transactions;
DROP POLICY IF EXISTS "Admins can read all packages"                   ON public.pricing_packages;
DROP POLICY IF EXISTS "Service role can manage profiles"               ON public.user_profiles;
DROP POLICY IF EXISTS "Service role can manage logs"                   ON public.quota_usage_logs;
DROP POLICY IF EXISTS "Service role can manage settings"               ON public.user_settings;
DROP POLICY IF EXISTS "Service role can manage history"                ON public.moderation_history;
DROP POLICY IF EXISTS "Service role can manage pricing_packages"       ON public.pricing_packages;
DROP POLICY IF EXISTS "Service role can manage transactions"           ON public.transactions;
DROP POLICY IF EXISTS "Service role can manage audit logs"             ON public.admin_audit_logs;

-- A. User hanya bisa membaca data miliknya sendiri (isolasi antar akun)
CREATE POLICY "Users can read own profile"
  ON public.user_profiles FOR SELECT
  USING (email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Users can read own quota logs"
  ON public.quota_usage_logs FOR SELECT
  USING (user_email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Users can read own settings"
  ON public.user_settings FOR SELECT
  USING (user_email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Users can read own history"
  ON public.moderation_history FOR SELECT
  USING (user_email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Users can read own transactions"
  ON public.transactions FOR SELECT
  USING (user_email = current_setting('request.jwt.claims', true)::json->>'email');

-- B. Paket langganan aktif dapat dibaca publik (untuk halaman pricing)
CREATE POLICY "Public can read active packages"
  ON public.pricing_packages FOR SELECT
  USING (is_active = true);

-- C. Admin & Superadmin dapat membaca data semua pengguna (untuk dashboard admin)
CREATE POLICY "Admins can read all profiles"
  ON public.user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
        AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Admins can read all histories"
  ON public.moderation_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
        AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Admins can read all transactions"
  ON public.transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
        AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Admins can read all packages"
  ON public.pricing_packages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
        AND role IN ('admin', 'superadmin')
    )
  );

-- D. Service Role (API Route Next.js dengan Supabase Service Key) punya akses penuh
CREATE POLICY "Service role full access profiles"
  ON public.user_profiles      FOR ALL USING (current_setting('role') = 'service_role');
CREATE POLICY "Service role full access quota_logs"
  ON public.quota_usage_logs   FOR ALL USING (current_setting('role') = 'service_role');
CREATE POLICY "Service role full access settings"
  ON public.user_settings      FOR ALL USING (current_setting('role') = 'service_role');
CREATE POLICY "Service role full access history"
  ON public.moderation_history FOR ALL USING (current_setting('role') = 'service_role');
CREATE POLICY "Service role full access packages"
  ON public.pricing_packages   FOR ALL USING (current_setting('role') = 'service_role');
CREATE POLICY "Service role full access transactions"
  ON public.transactions       FOR ALL USING (current_setting('role') = 'service_role');
CREATE POLICY "Service role full access audit_logs"
  ON public.admin_audit_logs   FOR ALL USING (current_setting('role') = 'service_role');


-- ══════════════════════════════════════════════════════════════
-- BAGIAN 4: FUNGSI DATABASE (PL/pgSQL)
-- ══════════════════════════════════════════════════════════════

-- ── A. Fungsi deduct_quota ────────────────────────────────────
-- Memotong kuota pengguna secara thread-safe dengan urutan:
-- 1. Potong subscription_quota dulu (rentan hangus saat expired)
-- 2. Jika tidak cukup, lanjut potong trial_quota
-- Dipanggil dari: quotaService.deduct() → supabase.rpc('deduct_quota', ...)
CREATE OR REPLACE FUNCTION public.deduct_quota(
  p_email       TEXT,
  p_units       INTEGER,
  p_action      TEXT,
  p_description TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_sub_quota INTEGER;
  v_trial     INTEGER;
  v_total     INTEGER;
  v_expiry    TIMESTAMPTZ;
  v_tier      TEXT;
  v_remaining INTEGER;
BEGIN
  -- Lock baris agar tidak terjadi race condition (concurrent requests)
  SELECT subscription_quota, trial_quota, quota_expiry, tier
  INTO   v_sub_quota, v_trial, v_expiry, v_tier
  FROM   public.user_profiles
  WHERE  email = p_email
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'reason', 'user_not_found');
  END IF;

  -- Auto-downgrade jika langganan PRO/ENTERPRISE sudah kedaluwarsa
  IF v_tier IN ('PRO', 'ENTERPRISE') AND v_expiry IS NOT NULL AND v_expiry < now() THEN
    v_tier      := 'FREE';
    v_sub_quota := 0;

    UPDATE public.user_profiles
    SET    tier = 'FREE', quota_limit = 1000, subscription_quota = 0,
           quota_expiry = NULL, active_package_id = NULL, updated_at = now()
    WHERE  email = p_email;
  END IF;

  v_total := v_sub_quota + v_trial;

  IF v_total < p_units THEN
    RETURN json_build_object(
      'success',  false,
      'reason',   'insufficient_quota',
      'balance',  v_total,
      'required', p_units
    );
  END IF;

  -- Pemotongan bertahap: subscription_quota dulu, baru trial_quota
  v_remaining := p_units;

  IF v_remaining > 0 AND v_sub_quota > 0 THEN
    IF v_sub_quota >= v_remaining THEN
      v_sub_quota := v_sub_quota - v_remaining;
      v_remaining := 0;
    ELSE
      v_remaining := v_remaining - v_sub_quota;
      v_sub_quota := 0;
    END IF;
  END IF;

  IF v_remaining > 0 AND v_trial > 0 THEN
    IF v_trial >= v_remaining THEN
      v_trial     := v_trial - v_remaining;
      v_remaining := 0;
    ELSE
      v_remaining := v_remaining - v_trial;
      v_trial     := 0;
    END IF;
  END IF;

  UPDATE public.user_profiles
  SET    subscription_quota = v_sub_quota,
         trial_quota        = v_trial,
         updated_at         = now()
  WHERE  email = p_email;

  INSERT INTO public.quota_usage_logs (user_email, action_name, units_spent, description)
  VALUES (p_email, p_action, p_units, p_description);

  RETURN json_build_object(
    'success', true,
    'balance', v_sub_quota + v_trial
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── B. Fungsi ensure_user_profile ────────────────────────────
-- Auto-create profil baru jika user pertama kali login.
-- Auto-downgrade ke FREE jika langganan sudah kedaluwarsa.
-- Dipanggil dari: quotaService.getProfile() → supabase.rpc('ensure_user_profile', ...)
CREATE OR REPLACE FUNCTION public.ensure_user_profile(p_email TEXT)
RETURNS public.user_profiles AS $$
DECLARE
  v_profile public.user_profiles;
BEGIN
  -- Buat profil baru jika belum ada (idempotent)
  INSERT INTO public.user_profiles (email)
  VALUES (p_email)
  ON CONFLICT (email) DO NOTHING;

  -- Auto-downgrade ke FREE jika masa aktif langganan sudah habis
  UPDATE public.user_profiles
  SET    tier              = 'FREE',
         quota_limit       = 1000,
         subscription_quota = 0,
         quota_expiry      = NULL,
         active_package_id = NULL,
         updated_at        = now()
  WHERE  email    = p_email
    AND  tier     IN ('PRO', 'ENTERPRISE')
    AND  quota_expiry IS NOT NULL
    AND  quota_expiry < now();

  SELECT * INTO v_profile FROM public.user_profiles WHERE email = p_email;
  RETURN v_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ══════════════════════════════════════════════════════════════
-- BAGIAN 5: SEED DATA (Data Paket Langganan Default)
-- ON CONFLICT DO UPDATE memastikan data selalu terupdate
-- meskipun skrip dijalankan ulang.
-- ══════════════════════════════════════════════════════════════
INSERT INTO public.pricing_packages (
  id, name, type, tier, price, original_price, quota_units, duration_days,
  billing_cycle, description, features, disabled_features, badge,
  allow_bulk_moderation, allow_export_csv, allow_auto_moderation, is_active
) VALUES

  -- FREE TRIAL
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

  -- PRO BULANAN
  ('PRO_1M', 'Pro', 'subscription', 'PRO', 49000, NULL, 50000, 30, '1M',
   'Untuk content creator aktif dengan video yang sering ramai komentar.',
   ARRAY[
     'Jatah 50.000 poin untuk 1 bulan',
     'Semua fitur Free',
     'Penyaringan Otomatis (Tahan & Hapus)',
     'Pemeriksaan otomatis tiap 2 menit',
     'Pilih banyak video & hapus massal sekaligus'
   ],
   ARRAY[]::TEXT[], '🔥 Paling Populer', true, true, true, true),

  -- PRO 3 BULAN
  ('PRO_3M', 'Pro', 'subscription', 'PRO', 139000, 147000, 150000, 90, '3M',
   'Untuk content creator aktif dengan video yang sering ramai komentar.',
   ARRAY[
     'Jatah 150.000 poin untuk 3 bulan',
     'Semua fitur Free',
     'Penyaringan Otomatis (Tahan & Hapus)',
     'Pemeriksaan otomatis tiap 2 menit',
     'Pilih banyak video & hapus massal sekaligus'
   ],
   ARRAY[]::TEXT[], '🔥 Paling Populer', true, true, true, true),

  -- PRO 6 BULAN
  ('PRO_6M', 'Pro', 'subscription', 'PRO', 264000, 294000, 300000, 180, '6M',
   'Untuk content creator aktif dengan video yang sering ramai komentar.',
   ARRAY[
     'Jatah 300.000 poin untuk 6 bulan',
     'Semua fitur Free',
     'Penyaringan Otomatis (Tahan & Hapus)',
     'Pemeriksaan otomatis tiap 2 menit',
     'Pilih banyak video & hapus massal sekaligus'
   ],
   ARRAY[]::TEXT[], '🔥 Paling Populer', true, true, true, true),

  -- PRO 1 TAHUN
  ('PRO_12M', 'Pro', 'subscription', 'PRO', 470000, 588000, 600000, 360, '12M',
   'Untuk content creator aktif dengan video yang sering ramai komentar.',
   ARRAY[
     'Jatah 600.000 poin untuk 1 tahun',
     'Semua fitur Free',
     'Penyaringan Otomatis (Tahan & Hapus)',
     'Pemeriksaan otomatis tiap 2 menit',
     'Pilih banyak video & hapus massal sekaligus'
   ],
   ARRAY[]::TEXT[], '🔥 Paling Populer', true, true, true, true),

  -- ENTERPRISE BULANAN (200k + BYOK Opsional)
  ('ENTERPRISE_1M', 'Enterprise', 'subscription', 'ENTERPRISE', 149000, NULL, 200000, 30, '1M',
   'Untuk agency atau channel dengan volume komentar sangat tinggi.',
   ARRAY[
     'Jatah 200.000 poin kuota server per bulan',
     'Fitur BYOK Opsional (Kunci API GCP Mandiri untuk Bebas Limit Server)',
     'Semua fitur Pro'
   ],
   ARRAY[]::TEXT[], '⭐ Terlengkap', true, true, true, true),

  -- ENTERPRISE 3 BULAN (600k + BYOK Opsional)
  ('ENTERPRISE_3M', 'Enterprise', 'subscription', 'ENTERPRISE', 424000, 447000, 600000, 90, '3M',
   'Untuk agency atau channel dengan volume komentar sangat tinggi.',
   ARRAY[
     'Jatah 600.000 poin kuota server per 3 bulan',
     'Fitur BYOK Opsional (Kunci API GCP Mandiri untuk Bebas Limit Server)',
     'Semua fitur Pro'
   ],
   ARRAY[]::TEXT[], '⭐ Terlengkap', true, true, true, true),

  -- ENTERPRISE 6 BULAN (1.2M + BYOK Opsional)
  ('ENTERPRISE_6M', 'Enterprise', 'subscription', 'ENTERPRISE', 804000, 894000, 1200000, 180, '6M',
   'Untuk agency atau channel dengan volume komentar sangat tinggi.',
   ARRAY[
     'Jatah 1.200.000 poin kuota server per 6 bulan',
     'Fitur BYOK Opsional (Kunci API GCP Mandiri untuk Bebas Limit Server)',
     'Semua fitur Pro'
   ],
   ARRAY[]::TEXT[], '⭐ Terlengkap', true, true, true, true),

  -- ENTERPRISE 1 TAHUN (2.4M + BYOK Opsional)
  ('ENTERPRISE_12M', 'Enterprise', 'subscription', 'ENTERPRISE', 1430000, 1788000, 2400000, 360, '12M',
   'Untuk agency atau channel dengan volume komentar sangat tinggi.',
   ARRAY[
     'Jatah 2.400.000 poin kuota server per tahun',
     'Fitur BYOK Opsional (Kunci API GCP Mandiri untuk Bebas Limit Server)',
     'Semua fitur Pro'
   ],
   ARRAY[]::TEXT[], '⭐ Terlengkap', true, true, true, true)

ON CONFLICT (id) DO UPDATE SET
  name                  = EXCLUDED.name,
  type                  = EXCLUDED.type,
  tier                  = EXCLUDED.tier,
  price                 = EXCLUDED.price,
  original_price        = EXCLUDED.original_price,
  quota_units           = EXCLUDED.quota_units,
  duration_days         = EXCLUDED.duration_days,
  billing_cycle         = EXCLUDED.billing_cycle,
  description           = EXCLUDED.description,
  features              = EXCLUDED.features,
  disabled_features     = EXCLUDED.disabled_features,
  badge                 = EXCLUDED.badge,
  allow_bulk_moderation = EXCLUDED.allow_bulk_moderation,
  allow_export_csv      = EXCLUDED.allow_export_csv,
  allow_auto_moderation = EXCLUDED.allow_auto_moderation,
  is_active             = EXCLUDED.is_active,
  updated_at            = now();
