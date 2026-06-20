-- === MIGRATION: BOOLEAN FEATURE FLAGS FOR FEATURE GATING ===

-- 1. Tambah kolom baru ke tabel pricing_packages
ALTER TABLE public.pricing_packages 
ADD COLUMN IF NOT EXISTS allow_bulk_moderation BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS allow_export_csv BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS allow_auto_moderation BOOLEAN NOT NULL DEFAULT false;

-- 2. Perbarui paket bawaan (Seeding)
-- Paket FREE tidak mendapatkan ketiganya (statis false)
UPDATE public.pricing_packages 
SET allow_bulk_moderation = false, allow_export_csv = false, allow_auto_moderation = false 
WHERE tier = 'FREE';

-- Paket PRO mendapatkan semua fitur
UPDATE public.pricing_packages 
SET allow_bulk_moderation = true, allow_export_csv = true, allow_auto_moderation = true 
WHERE tier = 'PRO';

-- Paket ENTERPRISE mendapatkan semua fitur
UPDATE public.pricing_packages 
SET allow_bulk_moderation = true, allow_export_csv = true, allow_auto_moderation = true 
WHERE tier = 'ENTERPRISE';
