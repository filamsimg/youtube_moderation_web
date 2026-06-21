-- === MIGRATION: REMOVE TOP-UP CREDIT PACKAGES ===

-- Hapus semua paket bertipe 'topup' dari tabel pricing_packages
DELETE FROM public.pricing_packages 
WHERE type = 'topup';
