'use client';

import React from 'react';
import { ExternalLink, KeyRound, ShieldCheck, X } from 'lucide-react';

export default function ByokGuideModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white border-slate-200 text-slate-900 dark:bg-slate-900/95 dark:border-slate-700/80 dark:text-slate-100 border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">Panduan Membuat YouTube API Key</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Ikuti 5 langkah mudah ini di Google Cloud Console (100% Gratis)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-sm text-slate-700 dark:text-slate-300">
          {/* Step 1 */}
          <div className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80 dark:bg-slate-800/50 dark:border-slate-700/50">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
              1
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100">Buka Google Cloud Console & Login</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Buka portal konsol Google Cloud dan login menggunakan akun Google / Gmail Anda (100% Gratis, tanpa kartu kredit).
              </p>
              <a
                href="https://console.cloud.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-semibold mt-1 transition-colors"
              >
                Buka Google Cloud Console <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80 dark:bg-slate-800/50 dark:border-slate-700/50">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
              2
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100">Buat Proyek Google Cloud Baru</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Di bagian paling atas header console (sebelah logo Google Cloud), klik dropdown pemilih proyek &rarr; Klik tombol <strong className="text-slate-800 dark:text-slate-200">&quot;New Project&quot;</strong> di pojok kanan atas &rarr; Beri nama proyek (contoh: <span className="text-indigo-600 dark:text-indigo-300 font-semibold text-xs">Moderasi YouTube Saya</span>) &rarr; Klik tombol biru <strong className="text-slate-800 dark:text-slate-200">&quot;Create&quot;</strong>.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80 dark:bg-slate-800/50 dark:border-slate-700/50">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
              3
            </div>
            <div className="space-y-1.5">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100">Aktifkan YouTube Data API v3</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Ketik <strong className="text-slate-800 dark:text-slate-200">&quot;YouTube Data API v3&quot;</strong> pada kolom pencarian utama paling atas &rarr; Klik hasil pencariannya &rarr; Klik tombol biru <strong className="text-emerald-600 dark:text-emerald-400 font-bold">&quot;Enable&quot;</strong> (Aktifkan).
              </p>
              <div className="p-2.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 dark:bg-indigo-950/40 dark:border-indigo-500/20 dark:text-indigo-300 text-[11px]">
                <strong>Catatan Penting:</strong> Jika muncul peringatan kuning <em>&quot;Remember to configure the OAuth consent screen...&quot;</em>, Anda <strong>ABAIKAN SAJA</strong> (tidak perlu diklik). Peringatan itu hanya untuk pembuatan login OAuth, bukan untuk API Key.
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80 dark:bg-slate-800/50 dark:border-slate-700/50">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
              4
            </div>
            <div className="space-y-1.5">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100">Buat & Konfigurasi API Key</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Langsung klik tombol <strong className="text-slate-800 dark:text-slate-200">&quot;+ Create Credentials&quot;</strong> di pojok kanan atas <span className="text-slate-500 font-normal">(tanpa mengklik tombol Configure consent screen)</span> &rarr; Pilih <strong className="text-slate-800 dark:text-slate-200">&quot;API key&quot;</strong>.
              </p>
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 dark:bg-slate-900/90 dark:border-amber-500/30 dark:text-slate-300 text-xs space-y-1.5">
                <p className="font-semibold text-amber-900 dark:text-amber-300">
                  Pengisian Panel Samping &quot;Create API key&quot;:
                </p>
                <ul className="list-disc ml-4 space-y-1 text-[11px] text-slate-700 dark:text-slate-300">
                  <li>
                    <strong>Name (Nama):</strong> Ketik nama pengenal, contoh: <code className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-950 dark:bg-slate-800 dark:text-amber-300 font-semibold">API key contoh</code>.
                  </li>
                  <li>
                    <strong>Select API restrictions *:</strong> Klik dropdown lalu pilih <strong className="text-amber-900 dark:text-amber-300">&quot;YouTube Data API v3&quot;</strong>.
                  </li>
                  <li>
                    Klik tombol biru <strong className="text-emerald-700 dark:text-emerald-400 font-bold">&quot;Save&quot;</strong> di bagian bawah panel.
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Step 5 */}
          <div className="flex gap-4 p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-500/30">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
              5
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-emerald-900 dark:text-emerald-200">Salin Kunci & Tempel di Aplikasi</h4>
              <p className="text-xs text-emerald-800 dark:text-slate-300 leading-relaxed">
                Salin kode Kunci API yang muncul (berawalan <code className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-950 dark:bg-emerald-900/60 dark:text-emerald-300 font-semibold">AIzaSy...</code>) dan tempelkan pada kolom form input di aplikasi ini, lalu klik <strong className="text-emerald-900 dark:text-emerald-300">&quot;Simpan &amp; Verifikasi&quot;</strong>!
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Kunci disimpan dengan aman & hanya digunakan untuk channel Anda.</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-lg shadow-indigo-600/20 active:scale-95 cursor-pointer"
          >
            Mengerti & Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

