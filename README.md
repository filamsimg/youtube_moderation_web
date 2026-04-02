# YouTube Moderation Web App (MKJD) - Moderasi Judol v1

Aplikasi Web Fullstack untuk moderasi komentar YouTube secara **Proaktif** menggunakan AI (**IndoBERTweet**). Proyek ini dirancang untuk mendeteksi dan menindak komentar judi online secara real-time, mendukung penelitian skripsi mengenai integrasi NLP dengan YouTube Data API v3.

## 🚀 Fitur Utama

- **Proactive AI Moderation**: Sistem tidak hanya mendeteksi, tapi langsung menindak komentar (Reject/Hold) secara otomatis berdasarkan hasil analisis AI.
- **Dynamic AI Thresholds**: Slider sensitivitas yang memungkinkan Admin mengatur ambang batas kepercayaan (*confidence score*) untuk aksi **Auto-Reject** (>90%) dan **Auto-Karantina** (>70%).
- **Advanced Dashboard Analytics**:
  - **Pie Chart**: Visualisasi distribusi konten (Normal vs Spam).
  - **Bar Chart**: Ringkasan akumulasi tindakan moderasi (Aman, Ditahan, Ditolak).
  - Menggunakan library **Recharts** untuk visualisasi yang interaktif.
- **Google OAuth Integration**: Login aman menggunakan akun Google dengan izin akses YouTube.
- **YouTube Data API v3**: Sinkronisasi komentar video secara real-time.
- **Moderation History & Logs**: Pencatatan detail setiap aksi AI termasuk label prediksi dan skor kepercayaan untuk keperluan audit/penelitian.
- **Modern UI/UX**: Desain premium dan responsif menggunakan Next.js dan Tailwind CSS.

## 🛠️ Stack Teknologi

- **Frontend**: [Next.js 14](https://nextjs.org/) (App Router), [Tailwind CSS](https://tailwindcss.com/)
- **Visualisasi**: [Recharts](https://recharts.org/)
- **Backend API**: Next.js Route Handlers
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **AI Model Interface**: Flask/Python Proxy (IndoBERTweet)
- **Icons**: SVG kustom & Lucide Icons

## 📋 Prasyarat

- Node.js 18.x atau lebih baru
- Google Cloud Console Project (YouTube Data API v3 enabled)
- Model API server yang berjalan di port 5000 (IndoBERTweet)

## ⚙️ Konfigurasi Environment

Buat file `.env` di root direktori `web-app/` dan tambahkan variabel berikut:

```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
MODEL_API_BASE=http://127.0.0.1:5000
```

## 🏃 Cara Menjalankan

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

## 📁 Struktur Proyek (Web App)

- `app/`: Routing dan halaman (App Router)
- `components/`: Komponen UI dan Visualisasi (Charts)
- `services/`: Logika integrasi API YouTube & AI Predict
- `lib/`: Utilitas dan konfigurasi (Auth, DB, dll)
- `public/`: Aset statis

---
**Status Proyek**: Implementasi Sesuai Proposal REVISI - Integrasi IndoBERTweet & Moderasi Proaktif.
*Dibuat untuk keperluan Skripsi - Moderasi Konten YouTube v1.*
