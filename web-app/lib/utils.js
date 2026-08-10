import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Formatter Rupiah (IDR)
export function formatIDR(num) {
  if (num === null || num === undefined) return '-';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(num);
}

// Formatter Tanggal & Waktu Lokal (id-ID)
export function formatDateTime(dateString, options = {}) {
  if (!dateString) return '-';
  const defaultOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options
  };
  return new Date(dateString).toLocaleString('id-ID', defaultOptions);
}

// Cek apakah paket atau profil memiliki kuota unlimited / BYOK
export function isUnlimitedQuota(target) {
  if (!target) return false;
  const tier = typeof target === 'string' ? target : target.tier;
  return tier === 'ENTERPRISE';
}
