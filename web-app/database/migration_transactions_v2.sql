-- ============================================================
-- MIGRASI TABEL TRANSAKSI V2 — Moderasi Judol V1
-- Jalankan skrip ini di SQL Editor Supabase untuk memperbarui
-- tabel transactions yang sudah ada ke skema V2.
-- ============================================================

-- ── LANGKAH 1: Tambah Kolom Baru ──────────────────────────────

-- Kolom tipe transaksi eksplisit (subscription vs topup)
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS transaction_type TEXT NOT NULL DEFAULT 'subscription';

-- URL redirect fallback Snap
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS snap_redirect_url TEXT;

-- Metode pembayaran Midtrans (gopay, bank_transfer, dll)
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS midtrans_payment_type TEXT;

-- Timestamp event penting (audit trail)
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS expired_at TIMESTAMPTZ DEFAULT NULL;

-- ── LANGKAH 2: Migrasi Data Lama ─────────────────────────────

-- 2a. Isi transaction_type berdasarkan duration_days dan target_tier
UPDATE public.transactions
SET transaction_type = CASE
  WHEN duration_days > 0 AND target_tier IN ('PRO', 'ENTERPRISE') THEN 'subscription'
  WHEN duration_days = 0 AND target_tier = 'FREE' THEN 'topup'
  ELSE 'subscription'
END
WHERE transaction_type = 'subscription'; -- Default, update semua

-- 2b. Normalisasi status lama ke format baru
-- 'expire' → 'expired'
UPDATE public.transactions
SET status = 'expired'
WHERE status = 'expire';

-- 'cancel' → 'cancelled'
UPDATE public.transactions
SET status = 'cancelled'
WHERE status = 'cancel';

-- 'deny' → 'failed' (jika ada)
UPDATE public.transactions
SET status = 'failed'
WHERE status = 'deny';

-- 'failure' → 'failed' (jika ada)
UPDATE public.transactions
SET status = 'failed'
WHERE status = 'failure';

-- 2c. Backfill paid_at untuk transaksi yang sudah settlement
UPDATE public.transactions
SET paid_at = updated_at
WHERE status = 'settlement'
  AND paid_at IS NULL;

-- 2d. Backfill expired_at untuk transaksi yang sudah expired
UPDATE public.transactions
SET expired_at = updated_at
WHERE status = 'expired'
  AND expired_at IS NULL;

-- 2e. Backfill cancelled_at untuk transaksi yang sudah cancelled
UPDATE public.transactions
SET cancelled_at = updated_at
WHERE status = 'cancelled'
  AND cancelled_at IS NULL;

-- ── LANGKAH 3: Auto-expire transaksi pending > 24 jam ────────
-- (Opsional tapi direkomendasikan untuk membersihkan data)

UPDATE public.transactions
SET status = 'expired',
    expired_at = now(),
    updated_at = now()
WHERE status = 'pending'
  AND created_at < now() - INTERVAL '24 hours';

-- ── LANGKAH 4: Tambah CHECK Constraint (jika belum ada) ──────
-- Pastikan status hanya bisa berisi nilai yang valid

DO $$
BEGIN
  -- Cek apakah constraint sudah ada
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'transactions_status_check'
      AND conrelid = 'public.transactions'::regclass
  ) THEN
    ALTER TABLE public.transactions
      ADD CONSTRAINT transactions_status_check
      CHECK (status IN ('pending', 'settlement', 'cancelled', 'expired', 'failed'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'transactions_type_check'
      AND conrelid = 'public.transactions'::regclass
  ) THEN
    ALTER TABLE public.transactions
      ADD CONSTRAINT transactions_type_check
      CHECK (transaction_type IN ('subscription', 'topup'));
  END IF;
END $$;

-- ── LANGKAH 5: Tambah Indeks Baru ────────────────────────────

CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(transaction_type);

-- ── SELESAI ──────────────────────────────────────────────────
-- Verifikasi hasil migrasi:
-- SELECT id, package_id, transaction_type, status, paid_at, cancelled_at, expired_at
-- FROM public.transactions ORDER BY created_at DESC;
