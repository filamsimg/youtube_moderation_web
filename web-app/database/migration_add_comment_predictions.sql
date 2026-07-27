-- ============================================================
-- MIGRATION: Tambah Tabel comment_predictions
-- Tujuan: Cache hasil prediksi AI agar komentar yang sama
--         tidak dianalisis ulang setiap kali halaman di-refresh.
-- ============================================================

-- Tabel cache prediksi AI per komentar
CREATE TABLE IF NOT EXISTS public.comment_predictions (
  comment_id        TEXT PRIMARY KEY,          -- ID unik komentar YouTube
  label             TEXT NOT NULL,             -- 'Cyberbullying' | 'Normal'
  confidence        FLOAT NOT NULL,            -- Skor keyakinan model (0.0 - 1.0)
  sentiment         TEXT,                      -- 'positive' | 'negative' | 'neutral'
  sentiment_score   FLOAT,                     -- Skor sentimen (0.0 - 1.0)
  created_at        TIMESTAMPTZ DEFAULT NOW()  -- Kapan prediksi pertama kali dibuat
);

-- Index untuk mempercepat lookup batch by comment_id (sudah PK tapi eksplisit)
CREATE INDEX IF NOT EXISTS idx_comment_predictions_comment_id
  ON public.comment_predictions (comment_id);

-- Aktifkan RLS (Row Level Security) — namun API menggunakan supabaseAdmin (service_role)
-- sehingga RLS tidak berlaku untuk server-side queries
ALTER TABLE public.comment_predictions ENABLE ROW LEVEL SECURITY;

-- Policy: Tidak ada akses langsung dari client-side (semua via API Route)
-- Server-side (service_role key) bypass RLS secara otomatis
CREATE POLICY "No direct client access to predictions"
  ON public.comment_predictions
  FOR ALL
  USING (false);

-- Komentar dokumentasi tabel
COMMENT ON TABLE public.comment_predictions IS
  'Cache hasil prediksi AI per komentar YouTube. Mencegah re-analisis berulang saat refresh halaman (Revisi 4 Skripsi).';

COMMENT ON COLUMN public.comment_predictions.comment_id IS 'YouTube Comment ID — primary key unik';
COMMENT ON COLUMN public.comment_predictions.label IS 'Label klasifikasi: Cyberbullying | Normal';
COMMENT ON COLUMN public.comment_predictions.confidence IS 'Skor kepercayaan model ML (0.0 - 1.0)';
COMMENT ON COLUMN public.comment_predictions.sentiment IS 'Label sentimen: positive | negative | neutral';
COMMENT ON COLUMN public.comment_predictions.sentiment_score IS 'Skor sentimen (0.0 - 1.0)';
