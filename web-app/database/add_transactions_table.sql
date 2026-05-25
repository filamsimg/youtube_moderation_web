-- ============================================================
-- TABEL TRANSAKSI PEMBAYARAN (Midtrans)
-- Jalankan skrip ini di SQL Editor Supabase Anda.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.transactions (
  id             TEXT PRIMARY KEY, -- Order ID dari Midtrans (contoh: ATHENA-TRX-12345)
  user_email     TEXT NOT NULL REFERENCES public.user_profiles(email) ON DELETE CASCADE,
  amount         INTEGER NOT NULL,
  quota_units    INTEGER NOT NULL,
  target_tier    TEXT NOT NULL DEFAULT 'FREE', -- 'FREE' | 'PRO' | 'ENTERPRISE'
  status         TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'settlement' | 'expire' | 'cancel'
  snap_token     TEXT,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

-- Indeks database untuk performa optimal
CREATE INDEX IF NOT EXISTS idx_transactions_email ON public.transactions(user_email);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);

-- Aktifkan Row Level Security (RLS)
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 1. Kebijakan Baca Mandiri (User hanya bisa membaca data transaksi mereka sendiri)
CREATE POLICY "Users can read own transactions" ON public.transactions FOR SELECT
  USING (user_email = current_setting('request.jwt.claims', true)::json->>'email');

-- 2. Kebijakan Admin/Server (Next.js server-side API memiliki akses penuh via service key)
CREATE POLICY "Service role can manage transactions" ON public.transactions FOR ALL 
  USING (current_setting('role') = 'service_role');
