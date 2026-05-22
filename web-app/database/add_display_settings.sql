-- ============================================================
-- ADD DISPLAY COLUMNS TO USER_SETTINGS TABLE
-- Jalankan query ini di Supabase SQL Editor untuk menyinkronkan
-- pengaturan bahasa (language) dan tema (theme) antar perangkat.
-- ============================================================

ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'dark';

-- Berikan deskripsi singkat untuk dokumentasi
COMMENT ON COLUMN public.user_settings.theme IS 'Color theme for web app (light / dark)';
