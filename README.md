# YouTube Moderation Web App (MKJD) - Moderasi Judol v1

Aplikasi Web Fullstack untuk moderasi komentar YouTube secara Proaktif menggunakan AI (IndoBERTweet dan Sentiment Analysis). Proyek ini dirancang untuk mendeteksi dan menindak komentar judi online secara real-time, serta menganalisis kualitas emosi komunitas di kanal YouTube.

## Fitur Utama

- **Proactive AI Moderation**: Sistem melakukan tindakan otomatis (Reject/Hold) pada komentar spam berdasarkan hasil analisis IndoBERTweet.
- **Sentiment Analysis Integration**: Menganalisis emosi penonton (Positif, Negatif, Netral) pada komentar normal untuk memantau kesehatan komunitas.
- **Supabase Cloud Database**: Integrasi database cloud untuk penyimpanan riwayat moderasi dan pengaturan pengguna yang persisten dan terisolasi antar akun.
- **Dynamic AI Thresholds**: Pengaturan ambang batas kepercayaan (confidence score) yang dapat disesuaikan untuk aksi otomatis.
- **Advanced Dashboard Analytics**:
  - **Konten Distribution**: Visualisasi distribusi Normal vs Spam.
  - **Aktivitas Moderasi**: Ringkasan akumulasi tindakan yang telah dilakukan.
  - **Kualitas Komunitas**: Donut chart untuk distribusi sentimen penonton.
- **Google OAuth Integration**: Login aman menggunakan akun Google dengan izin akses YouTube Data API v3.
- **Modern UI/UX**: Antarmuka dashboard yang responsif, minimalis, dan premium.

## Stack Teknologi

- **Frontend**: Next.js 14 (App Router), Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Visualisasi**: Recharts
- **Authentication**: NextAuth.js (Google Provider)
- **AI Backend**: Flask (Python) + Transformers (IndoBERTweet & Sentiment Model)

## Prasyarat

- Node.js 18.x atau lebih baru
- Akun Supabase (untuk database)
- Google Cloud Console Project (YouTube Data API v3 enabled)
- Model API server yang berjalan di port 5000

## Konfigurasi Environment

Buat file `.env` di root direktori `web-app/` dan tambahkan variabel berikut:

```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
MODEL_API_BASE=http://127.0.0.1:5000

NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Cara Menjalankan

1. Instal dependensi:
   ```bash
   npm install
   ```

2. Jalankan server pengembangan:
   ```bash
   npm run dev
   ```

3. Akses aplikasi:
   Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

## Struktur Proyek

- `app/`: Routing dan halaman utama aplikasi.
- `components/`: Komponen UI reusable dan visualisasi chart.
- `services/`: Logika integrasi API (YouTube, Supabase, AI API).
- `lib/`: Konfigurasi klien Supabase dan utilitas lainnya.
- `public/`: Aset statis aplikasi.

---
**Status Proyek**: Final Integration - Supabase & Sentiment Analysis.
*Dibuat untuk keperluan Skripsi - Moderasi Konten YouTube v1.*
