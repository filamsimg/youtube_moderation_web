-- === MIGRATION: ADD BILLING_CYCLE COLUMN TO PRICING_PACKAGES ===

-- 1. Tambah kolom billing_cycle ke tabel pricing_packages
ALTER TABLE public.pricing_packages 
ADD COLUMN IF NOT EXISTS billing_cycle TEXT CHECK (billing_cycle IN ('1M', '3M', '6M', '12M'));

-- 2. Migrasi data lama (mengisi kolom berdasarkan duration_days yang sudah ada)
UPDATE public.pricing_packages SET billing_cycle = '1M' WHERE duration_days = 30;
UPDATE public.pricing_packages SET billing_cycle = '3M' WHERE duration_days = 90;
UPDATE public.pricing_packages SET billing_cycle = '6M' WHERE duration_days = 180;
UPDATE public.pricing_packages SET billing_cycle = '12M' WHERE duration_days = 360;
