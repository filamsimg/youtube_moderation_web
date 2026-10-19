# Athena Shield - Platform Moderasi Komentar YouTube Berbasis AI

Aplikasi Web Fullstack untuk moderasi komentar YouTube secara proaktif menggunakan model AI (IndoBERTweet dan Analisis Sentimen). Dirancang untuk mendeteksi, menahan, dan membersihkan komentar promosi judi online secara otomatis serta memantau kualitas interaksi komunitas pada kanal YouTube secara *real-time*.

---

## Fitur Utama

- **Proactive AI Moderation**: Deteksi otomatis komentar promosi judi online/spam menggunakan model IndoBERTweet terlatih dengan opsi tindakan otomatis (*Auto-Tahan* dan *Auto-Hapus*).
- **Sentiment Analysis Integration**: Menganalisis sentimen komentar penonton (Positif, Negatif, Netral) untuk memantau respons dan kesehatan komunitas.
- **Neon Serverless PostgreSQL**: Penyimpanan cloud berbasis PostgreSQL serverless (Neon) berkecepatan tinggi dengan koneksi pooling untuk data profil pengguna, kuota, riwayat moderasi, preferensi, dan transaksi.
- **AI Prediction Cache**: Caching hasil inferensi AI per ID komentar YouTube (`comment_predictions`) untuk mencegah re-analisis berulang dan menghemat latensi.
- **Dynamic AI Thresholds & Presets**: Slider ambang batas keyakinan (*confidence score*) serta pilihan preset moderasi (*Santai*, *Seimbang*, *Ketat*).
- **Multi-Tier & Feature Gate**:
  - **FREE**: Akses moderasi dasar dengan jatah kuota trial awal.
  - **PRO**: Kuota bulanan besar, moderasi massal (*Bulk Moderation*), polling otomatis, dan ekspor CSV berformat UTF-8 BOM.
  - **ENTERPRISE**: Kuota volume tinggi dan opsi **BYOK (Bring Your Own Key)** menggunakan kunci API Google Cloud pribadi tanpa memotong kuota server.
- **Midtrans Payment Gateway**: Integrasi pembayaran otomatis (Snap Popup) untuk paket langganan Pro dan Enterprise.
- **Google OAuth (SSO) & YouTube Data API v3**: Otentikasi sesi aman menggunakan NextAuth.js dengan izin kelola komentar (`youtube.force-ssl`).
- **Admin & Superadmin Panel**: Dasbor audit komprehensif untuk pengawasan pengguna, riwayat transaksi, rekam jejak moderasi global, serta manajemen dinamis paket langganan.

---

## Stack Teknologi

- **Frontend & Server**: Next.js 14 (App Router), React 18, Tailwind CSS, Lucide Icons, Recharts
- **Database**: Neon Serverless PostgreSQL (`@neondatabase/serverless`)
- **Autentikasi**: NextAuth.js (Google Provider OAuth 2.0)
- **Payment Gateway**: Midtrans Snap API (Client & Server SDK)
- **AI Backend / Inference**: Hugging Face Spaces / Flask API (IndoBERTweet + Sentiment Analysis)

---

## Prasyarat

- Node.js 18.x atau lebih baru
- Proyek & Akun [Neon](https://neon.tech) (Database PostgreSQL Serverless)
- Google Cloud Console Project (Aktifkan YouTube Data API v3 & OAuth 2.0)
- Akun Merchant [Midtrans](https://midtrans.com) (Sandbox / Production)

---

## Konfigurasi Environment

Salin file `.env.example` menjadi `.env` di dalam folder `web-app/`:

```bash
cd web-app
cp .env.example .env
```

Isi variabel environment berikut:

```env
# GOOGLE OAUTH & YOUTUBE API
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# NEXTAUTH
NEXTAUTH_SECRET=rahasia-moderasi-judol
NEXTAUTH_URL=http://localhost:3000

# NEON SERVERLESS POSTGRESQL (https://neon.tech)
DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-sample-pooler.ap-southeast-1.aws.neon.tech/Athena%20Shield?sslmode=require"

# MIDTRANS CONFIGURATION
MIDTRANS_CLIENT_KEY=your_midtrans_client_key
MIDTRANS_SERVER_KEY=your_midtrans_server_key
MIDTRANS_IS_PRODUCTION=false

# ADMIN ROLES
ADMIN_EMAILS=admin@gmail.com,superadmin@gmail.com

# AI MODEL BACKEND / HUGGING FACE
MODEL_API_BASE=http://localhost:5000
HF_SPACE_ID=filamss/athena_shield_model
HF_ACCESS_TOKEN=
```

---

## Setup Database di Neon

1. Buka dashboard proyek Anda di [Neon](https://neon.tech).
2. Buat database baru bernama `Athena Shield` (atau gunakan database bawaan `neondb`).
3. Buka menu **SQL Editor** di sidebar kiri dashboard Neon.
4. Buka file `web-app/database/neon_schema.sql`, salin seluruh kodenya, tempel ke SQL Editor Neon, lalu klik **Run**.
5. Salin connection string dari tombol **Connect** Neon ke variabel `DATABASE_URL` pada `.env`.

---

## Cara Menjalankan Aplikasi

1. Masuk ke direktori web app:
   ```bash
   cd web-app
   ```

2. Instal dependensi:
   ```bash
   npm install
   ```

3. Jalankan server pengembangan (Development):
   ```bash
   npm run dev
   ```

4. Akses antarmuka aplikasi:
   Buka peramban di [http://localhost:3000](http://localhost:3000).

---

## Struktur Direktori Proyek

```text
├── web-app/
│   ├── app/                      # Next.js App Router (Halaman & API Routes)
│   │   ├── (admin)/admin/        # Halaman Admin Panel & Manajemen
│   │   ├── (main)/               # Dasbor Kreator, Moderasi, dan Pengaturan
│   │   ├── (public)/             # Halaman Landing, Pricing, dan Kebijakan Privasi
│   │   └── api/                  # RESTful API Endpoints (Quota, Payments, Moderasi, Admin)
│   ├── components/               # Komponen Antarmuka & Visualisasi Data (Charts)
│   ├── contexts/                 # React Contexts (YouTubeContext, QuotaContext, ThemeContext)
│   ├── database/
│   │   └── neon_schema.sql       # Skema DDL & Stored Procedure PostgreSQL Neon (8 Tabel Lengkap)
│   ├── lib/
│   │   ├── db.js                 # Neon Serverless Database Client & Query Builder
│   │   ├── auth.js               # Konfigurasi NextAuth Google & Refresh Token
│   │   └── adminAuth.js          # Middleware Otorisasi Hak Akses Admin
│   ├── services/                 # Logika Layanan (YouTube API, Kuota)
│   └── public/                   # Aset Gambar, Ikon, dan Media
└── model_judol_indobertweet/     # Model & Skrip Analisis AI IndoBERTweet
```

---

**Status Proyek**: Produksi & Skripsi — Integrasi Penuh Next.js 14, Neon PostgreSQL, dan AI IndoBERTweet.  
*Dikembangkan oleh Filamsi Mabda Ghifary.*
