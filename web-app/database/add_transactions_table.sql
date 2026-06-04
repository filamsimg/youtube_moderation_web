-- ============================================================
-- TABEL TRANSAKSI PEMBAYARAN (Midtrans) — V2
-- Jalankan skrip ini di SQL Editor Supabase Anda.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.transactions (
  id                    TEXT PRIMARY KEY,                        -- Order ID dari Midtrans (contoh: ATHENA-TRX-12345)
  user_email            TEXT NOT NULL REFERENCES public.user_profiles(email) ON DELETE CASCADE,
  package_id            TEXT NOT NULL,                           -- ID paket dari SECURE_PACKAGES (e.g. 'PRO_3M', 'topup-starter')
  transaction_type      TEXT NOT NULL DEFAULT 'subscription'     -- 'subscription' | 'topup'
                        CHECK (transaction_type IN ('subscription', 'topup')),
  amount                INTEGER NOT NULL,                        -- Nominal pembayaran (Rupiah)
  quota_units           INTEGER NOT NULL,                        -- Jumlah kuota yang ditambahkan
  target_tier           TEXT NOT NULL DEFAULT 'FREE',            -- 'FREE' | 'PRO' | 'ENTERPRISE'
  duration_days         INTEGER NOT NULL DEFAULT 0,              -- Durasi masa aktif (0 = top-up tanpa expiry)
  status                TEXT NOT NULL DEFAULT 'pending'          -- Status lifecycle transaksi
                        CHECK (status IN ('pending', 'settlement', 'cancelled', 'expired', 'failed')),

  -- === METADATA MIDTRANS ===
  snap_token            TEXT,                                    -- Token Snap untuk membuka/resume popup pembayaran
  snap_redirect_url     TEXT,                                    -- URL redirect fallback jika popup Snap gagal
  midtrans_payment_type TEXT,                                    -- Metode bayar: 'bank_transfer', 'gopay', 'credit_card', dll

  -- === EVENT TIMESTAMPS (Audit Trail) ===
  paid_at               TIMESTAMPTZ DEFAULT NULL,                -- Waktu pembayaran berhasil (settlement)
  cancelled_at          TIMESTAMPTZ DEFAULT NULL,                -- Waktu user membatalkan transaksi
  expired_at            TIMESTAMPTZ DEFAULT NULL,                -- Waktu transaksi kedaluwarsa otomatis

  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

-- Indeks database untuk performa optimal
CREATE INDEX IF NOT EXISTS idx_transactions_email ON public.transactions(user_email);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(transaction_type);

-- Aktifkan Row Level Security (RLS)
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 1. Kebijakan Baca Mandiri (User hanya bisa membaca data transaksi mereka sendiri)
CREATE POLICY "Users can read own transactions" ON public.transactions FOR SELECT
  USING (user_email = current_setting('request.jwt.claims', true)::json->>'email');

-- 2. Kebijakan Admin/Server (Next.js server-side API memiliki akses penuh via service key)
CREATE POLICY "Service role can manage transactions" ON public.transactions FOR ALL 
  USING (current_setting('role') = 'service_role');
