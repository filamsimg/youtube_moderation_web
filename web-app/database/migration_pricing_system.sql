-- === MIGRATION: DYNAMIC PRICING AND PACKAGES SYSTEM ===

-- 1. Buat Tabel pricing_packages
CREATE TABLE IF NOT EXISTS public.pricing_packages (
  id                TEXT PRIMARY KEY, -- e.g. 'FREE', 'PRO_1M', 'topup-starter'
  name              TEXT NOT NULL,
  type              TEXT NOT NULL CHECK (type IN ('subscription', 'topup')),
  tier              TEXT NOT NULL DEFAULT 'FREE' CHECK (tier IN ('FREE', 'PRO', 'ENTERPRISE')),
  price             INTEGER NOT NULL,
  original_price    INTEGER, -- Nullable untuk harga sebelum diskon
  quota_units       INTEGER NOT NULL,
  duration_days     INTEGER NOT NULL, -- 0 untuk topup, >0 untuk subscription
  description       TEXT,
  features          TEXT[] DEFAULT '{}',
  disabled_features TEXT[] DEFAULT '{}',
  badge             TEXT,
  color             TEXT, -- For top-up styling (emerald, blue, violet)
  is_active         BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- Indexing untuk optimasi query pembacaan
CREATE INDEX IF NOT EXISTS idx_pricing_packages_active ON public.pricing_packages(is_active);
CREATE INDEX IF NOT EXISTS idx_pricing_packages_type ON public.pricing_packages(type);

-- 2. Aktifkan Row Level Security (RLS)
ALTER TABLE public.pricing_packages ENABLE ROW LEVEL SECURITY;

-- 3. Kebijakan RLS (Security Policies)
-- Kebijakan A: Semua orang (termasuk user anonim/biasa) dapat membaca paket yang aktif
CREATE POLICY "Allow public read active packages"
  ON public.pricing_packages FOR SELECT
  USING (is_active = true);

-- Kebijakan B: Admin/Superadmin dapat membaca semua paket (termasuk yang tidak aktif)
CREATE POLICY "Allow admins read all packages"
  ON public.pricing_packages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
        AND role IN ('admin', 'superadmin')
    )
  );

-- Kebijakan C: Hanya service_role (backend server-side) yang dapat melakukan modifikasi (ALL)
CREATE POLICY "Service role can manage pricing_packages"
  ON public.pricing_packages FOR ALL
  USING (current_setting('role') = 'service_role');

-- 4. Seed Data: Masukkan paket default awal
INSERT INTO public.pricing_packages (
  id, name, type, tier, price, original_price, quota_units, duration_days, description, features, disabled_features, badge, color, is_active
) VALUES 
  -- === PAKET LANGGANAN ===
  -- FREE TRIAL
  ('FREE', 'Free Trial', 'subscription', 'FREE', 0, NULL, 1000, 30, 
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
   NULL, NULL, true),

  -- PRO BULANAN (1M)
  ('PRO_1M', 'Pro', 'subscription', 'PRO', 49000, NULL, 50000, 30, 
   'Untuk content creator aktif dengan video yang sering ramai komentar.',
   ARRAY[
     'Jatah 50.000 poin untuk bulan',
     'Semua fitur Free',
     'Penyaringan Otomatis (Tahan & Hapus)',
     'Pemeriksaan otomatis tiap 2 menit',
     'Pilih banyak video & hapus massal sekaligus',
     'Layanan bantuan prioritas'
   ],
   ARRAY[]::TEXT[],
   '🔥 Paling Populer', NULL, true),

  -- PRO 3 BULAN (3M)
  ('PRO_3M', 'Pro', 'subscription', 'PRO', 139000, 147000, 150000, 90, 
   'Untuk content creator aktif dengan video yang sering ramai komentar.',
   ARRAY[
     'Jatah 150.000 poin untuk 3 bulan',
     'Semua fitur Free',
     'Penyaringan Otomatis (Tahan & Hapus)',
     'Pemeriksaan otomatis tiap 2 menit',
     'Pilih banyak video & hapus massal sekaligus',
     'Layanan bantuan prioritas'
   ],
   ARRAY[]::TEXT[],
   '🔥 Paling Populer', NULL, true),

  -- PRO 6 BULAN (6M)
  ('PRO_6M', 'Pro', 'subscription', 'PRO', 264000, 294000, 300000, 180, 
   'Untuk content creator aktif dengan video yang sering ramai komentar.',
   ARRAY[
     'Jatah 300.000 poin untuk 6 bulan',
     'Semua fitur Free',
     'Penyaringan Otomatis (Tahan & Hapus)',
     'Pemeriksaan otomatis tiap 2 menit',
     'Pilih banyak video & hapus massal sekaligus',
     'Layanan bantuan prioritas'
   ],
   ARRAY[]::TEXT[],
   '🔥 Paling Populer', NULL, true),

  -- PRO 1 TAHUN (12M)
  ('PRO_12M', 'Pro', 'subscription', 'PRO', 470000, 588000, 600000, 360, 
   'Untuk content creator aktif dengan video yang sering ramai komentar.',
   ARRAY[
     'Jatah 600.000 poin untuk tahun',
     'Semua fitur Free',
     'Penyaringan Otomatis (Tahan & Hapus)',
     'Pemeriksaan otomatis tiap 2 menit',
     'Pilih banyak video & hapus massal sekaligus',
     'Layanan bantuan prioritas'
   ],
   ARRAY[]::TEXT[],
   '🔥 Paling Populer', NULL, true),

  -- ENTERPRISE BULANAN (1M)
  ('ENTERPRISE_1M', 'Enterprise', 'subscription', 'ENTERPRISE', 149000, NULL, 999999, 30, 
   'Untuk agency atau channel dengan volume komentar sangat tinggi.',
   ARRAY[
     'Bebas dari batasan kuota YouTube*',
     'Semua fitur Pro',
     'Gunakan Kunci Akses YouTube Sendiri (Gratis)',
     'Grafik laporan statistik lengkap',
     'Unduh laporan ke Excel (CSV)',
     'Layanan bantuan khusus'
   ],
   ARRAY[]::TEXT[],
   '⭐ Terlengkap', NULL, true),

  -- ENTERPRISE 3 BULAN (3M)
  ('ENTERPRISE_3M', 'Enterprise', 'subscription', 'ENTERPRISE', 424000, 447000, 999999, 90, 
   'Untuk agency atau channel dengan volume komentar sangat tinggi.',
   ARRAY[
     'Bebas dari batasan kuota YouTube*',
     'Semua fitur Pro',
     'Gunakan Kunci Akses YouTube Sendiri (Gratis)',
     'Grafik laporan statistik lengkap',
     'Unduh laporan ke Excel (CSV)',
     'Layanan bantuan khusus'
   ],
   ARRAY[]::TEXT[],
   '⭐ Terlengkap', NULL, true),

  -- ENTERPRISE 6 BULAN (6M)
  ('ENTERPRISE_6M', 'Enterprise', 'subscription', 'ENTERPRISE', 804000, 894000, 999999, 180, 
   'Untuk agency atau channel dengan volume komentar sangat tinggi.',
   ARRAY[
     'Bebas dari batasan kuota YouTube*',
     'Semua fitur Pro',
     'Gunakan Kunci Akses YouTube Sendiri (Gratis)',
     'Grafik laporan statistik lengkap',
     'Unduh laporan ke Excel (CSV)',
     'Layanan bantuan khusus'
   ],
   ARRAY[]::TEXT[],
   '⭐ Terlengkap', NULL, true),

  -- ENTERPRISE 1 TAHUN (12M)
  ('ENTERPRISE_12M', 'Enterprise', 'subscription', 'ENTERPRISE', 1430000, 1788000, 999999, 360, 
   'Untuk agency atau channel dengan volume komentar sangat tinggi.',
   ARRAY[
     'Bebas dari batasan kuota YouTube*',
     'Semua fitur Pro',
     'Gunakan Kunci Akses YouTube Sendiri (Gratis)',
     'Grafik laporan statistik lengkap',
     'Unduh laporan ke Excel (CSV)',
     'Layanan bantuan khusus'
   ],
   ARRAY[]::TEXT[],
   '⭐ Terlengkap', NULL, true),

  -- === PAKET TOP-UP ===
  -- STARTER TOPUP
  ('topup-starter', 'Starter', 'topup', 'FREE', 15000, NULL, 5000, 0, 
   'Beli paket kredit sekali bayar.', 
   ARRAY[]::TEXT[], ARRAY[]::TEXT[], NULL, 'emerald', true),

  -- STANDARD TOPUP
  ('topup-standard', 'Standard', 'topup', 'FREE', 50000, NULL, 20000, 0, 
   'Beli paket kredit sekali bayar.', 
   ARRAY[]::TEXT[], ARRAY[]::TEXT[], 'Terlaris', 'blue', true),

  -- POWER TOPUP
  ('topup-power', 'Power', 'topup', 'FREE', 120000, NULL, 60000, 0, 
   'Beli paket kredit sekali bayar.', 
   ARRAY[]::TEXT[], ARRAY[]::TEXT[], NULL, 'violet', true)

ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  tier = EXCLUDED.tier,
  price = EXCLUDED.price,
  original_price = EXCLUDED.original_price,
  quota_units = EXCLUDED.quota_units,
  duration_days = EXCLUDED.duration_days,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  disabled_features = EXCLUDED.disabled_features,
  badge = EXCLUDED.badge,
  color = EXCLUDED.color,
  is_active = EXCLUDED.is_active,
  updated_at = now();
