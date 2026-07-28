'use client';

import React from 'react';
import { ExternalLink, CheckCircle2, KeyRound, ArrowRight, ShieldCheck, X } from 'lucide-react';

export default function ByokGuideModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-100">Panduan Membuat YouTube API Key</h3>
              <p className="text-xs text-slate-400 mt-0.5">Ikuti 5 langkah mudah ini di Google Cloud Console (100% Gratis)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm text-slate-300">
          {/* Step 1 */}
          <div className="flex gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
              1
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-slate-100">Buka Google Cloud Console</h4>
              <p className="text-xs text-slate-400">
                Buka portal konsol Google Cloud dan login menggunakan akun Google / Gmail Anda.
              </p>
              <a
                href="https://console.cloud.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium mt-1 transition-colors"
              >
                Buka Google Cloud Console <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
              2
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-slate-100">Buat Proyek Baru</h4>
              <p className="text-xs text-slate-400">
                Klik menu dropdown proyek di bagian atas konsol $\rightarrow$ Klik <strong className="text-slate-200">"New Project"</strong> $\rightarrow$ Beri nama proyek (contoh: <span className="text-indigo-300 font-mono text-xs">Moderasi YouTube Saya</span>) $\rightarrow$ Klik <strong className="text-slate-200">"Create"</strong>.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
              3
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-slate-100">Aktifkan YouTube Data API v3</h4>
              <p className="text-xs text-slate-400">
                Cari <strong className="text-slate-200">"YouTube Data API v3"</strong> pada kolom pencarian di bagian atas konsol $\rightarrow$ Klik hasilnya $\rightarrow$ Klik tombol biru <strong className="text-emerald-400">"Enable"</strong> (Aktifkan).
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
              4
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-slate-100">Buat Kredensial API Key</h4>
              <p className="text-xs text-slate-400">
                Buka menu <strong className="text-slate-200">"Credentials"</strong> (Kredensial) di bilah kiri $\rightarrow$ Klik <strong className="text-slate-200">"+ Create Credentials"</strong> $\rightarrow$ Pilih <strong className="text-slate-200">"API key"</strong>.
              </p>
            </div>
          </div>

          {/* Step 5 */}
          <div className="flex gap-4 p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
              5
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-emerald-200">Salin & Tempelkan API Key</h4>
              <p className="text-xs text-slate-300">
                Salin kode Kunci API yang muncul (berawalan <code className="px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-300 font-mono">AIzaSy...</code>) dan tempelkan di form aplikasi ini!
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Kunci disimpan dengan aman & hanya digunakan untuk channel Anda.</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-lg shadow-indigo-600/20"
          >
            Mengerti & Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
