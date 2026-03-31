# YouTube Moderation Web App (MKJD)

Aplikasi Web Fullstack untuk moderasi komentar YouTube menggunakan AI (IndoBERTweet). Proyek ini dirancang untuk membantu pembuat konten mengelola komentar di kanal mereka secara efisien, mendeteksi spam/komentar negatif, dan mempermudah proses peninjauan.

## 🚀 Fitur Utama

- **Google OAuth Integration**: Login aman menggunakan akun Google dengan izin akses YouTube.
- **YouTube Data API v3**: Mengambil komentar video secara real-time langsung dari kanal Anda.
- **AI-Powered Moderation**: Klasifikasi komentar menggunakan model IndoBERT untuk mendeteksi spam (Judi Online, dll).
- **Dashboard Analytics**: Visualisasi data statistik moderasi dan volume komentar.
- **Multi-step Moderation Queue**: Proses peninjauan komentar dengan status (Terbitkan, Tahan, Tolak).
- **Riwayat Aktivitas**: Melacak semua tindakan moderasi yang telah dilakukan.
- **Modern UI/UX**: Desain premium menggunakan Next.js, Tailwind CSS, dan Framer Motion.

## 🛠️ Stack Teknologi

- **Frontend**: [Next.js 14](https://nextjs.org/) (App Router), [Tailwind CSS](https://tailwindcss.com/)
- **Backend API**: Next.js Route Handlers
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **AI Model Interface**: Flask/Python Proxy (IndoBERT)
- **Icons**: SVG kustom & Lucide Icons

## 📋 Prasyarat

- Node.js 18.x atau lebih baru
- Google Cloud Console Project (YouTube Data API v3 enabled)
- Model API server yang berjalan di port 5000 (IndoBERT)

## ⚙️ Konfigurasi Environment

Buat file `.env` di root direktori dan tambahkan variabel berikut:

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

3. Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

## 📁 Struktur Proyek

- `app/`: Routing dan halaman (App Router)
- `components/`: Komponen UI yang dapat digunakan kembali
- `services/`: Logika integrasi API YouTube
- `lib/`: Utilitas dan konfigurasi (Auth, DB, dll)
- `public/`: Aset statis

---
Dibuat untuk keperluan Skripsi - Moderasi Konten YouTube v1.
