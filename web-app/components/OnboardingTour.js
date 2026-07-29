'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';

/**
 * OnboardingTour
 * 
 * Komponen panduan interaktif langkah-demi-langkah untuk pengguna baru.
 * Menampilkan spotlight pada elemen target dan tooltip penjelasan.
 * Status penyelesaian disimpan di localStorage (scoped per email).
 */

const STEPS = [
  {
    id: 'welcome',
    title: 'Selamat Datang di Athena Shield!',
    description: 'Athena Shield adalah perisai AI untuk membersihkan komentar spam judi online (judol) dari kanal YouTube Anda secara otomatis menggunakan kecerdasan buatan IndoBERT.',
    targetId: null, // Overlay tengah layar
    icon: (
      <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
  {
    id: 'sidebar',
    title: 'Menu Navigasi Utama',
    description: 'Ini adalah pusat navigasi Anda. Dari sini, Anda bisa mengakses seluruh fitur: melihat laporan, memeriksa komentar, mengatur preferensi, dan melihat profil Anda.',
    targetId: 'onboarding-sidebar',
    icon: (
      <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" />
      </svg>
    ),
  },
  {
    id: 'quota',
    title: 'Kuota Pemindaian AI',
    description: 'Setiap pemindaian dan tindakan AI menggunakan kuota. Sebagai pengguna baru, Anda mendapatkan 1.000 unit kuota gratis (Trial) untuk memulai. Kuota ini tidak pernah kedaluwarsa!',
    targetId: 'onboarding-quota',
    icon: (
      <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
  {
    id: 'comments',
    title: 'Moderasi Komentar',
    description: 'Ini adalah "ruang operasi" utama Anda. Di sini, AI IndoBERT akan memindai dan menganalisis setiap komentar dari video YouTube Anda, lalu menandai mana yang Normal dan mana yang Spam Judol.',
    targetId: 'onboarding-nav-comments',
    icon: (
      <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 18.09a5.967 5.967 0 01-.707-1.85 7.93 7.93 0 002.24-.132A7.982 7.982 0 0012 15.75c4.97 0 9-3.694 9-8.25M12 3.75c-4.97 0-9 3.694-9 8.25 0 1.625.518 3.12 1.4 4.417" />
      </svg>
    ),
  },
  {
    id: 'preferensi',
    title: 'Pengaturan Sensitivitas AI',
    description: 'Atur seberapa ketat AI bertindak! Tentukan batas kepercayaan (threshold) kapan komentar harus ditahan otomatis atau langsung dihapus, sehingga Anda tidak perlu meninjau setiap komentar secara manual.',
    targetId: 'onboarding-nav-preferensi',
    icon: (
      <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
      </svg>
    ),
  },
  {
    id: 'complete',
    title: 'Siap Melindungi Kanal Anda!',
    description: 'Panduan selesai! Athena Shield siap menjaga kebersihan kolom komentar YouTube Anda dari serbuan iklan judi online. Mulai dengan memilih video dan menjalankan pemindaian pertama Anda.',
    targetId: null, // Overlay tengah layar
    icon: (
      <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.63 1.5 14.962 14.962 0 001.5 9.63c0 3.32 1.08 6.4 2.91 8.91l2.62-2.63a8.97 8.97 0 012.27-2.27l2.63-2.62c2.51 1.83 5.59 2.91 8.91 2.91v-.38z" />
      </svg>
    ),
  },
];

const STORAGE_KEY_PREFIX = 'athena_onboarding_';

export default function OnboardingTour() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPos, setTooltipPos] = useState(null);
  const [targetRect, setTargetRect] = useState(null);
  const [isReady, setIsReady] = useState(false);

  const spotlightRef = useRef(null);
  const prevTargetRef = useRef(null);

  const email = session?.user?.email;

  // Cek apakah user sudah pernah menyelesaikan onboarding
  useEffect(() => {
    if (status !== 'authenticated' || !email) return;

    // Tunda sedikit agar layout & sidebar selesai render
    const timer = setTimeout(() => {
      try {
        const isDone = localStorage.getItem(`${STORAGE_KEY_PREFIX}${email}`) === 'true';
        if (!isDone) {
          setIsActive(true);
          setIsReady(true);

          // Redirect ke dashboard agar panduan berjalan di konteks yang tepat (Beranda)
          if (pathname !== '/dashboard' && pathname !== '/') {
            router.push('/dashboard');
          }
        }
      } catch {
        // LocalStorage tidak tersedia (incognito dll)
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [status, email, pathname, router]);

  // Hitung posisi tooltip relatif terhadap elemen target
  const calculatePosition = useCallback(() => {
    const step = STEPS[currentStep];
    if (!step?.targetId) {
      setTooltipPos(null); // Akan dirender sebagai modal tengah
      setTargetRect(null);
      return;
    }

    const el = document.getElementById(step.targetId);
    if (!el) {
      setTooltipPos(null);
      setTargetRect(null);
      return;
    }

    const rect = el.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    setTargetRect({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    });

    // Tooltip default: di sebelah kanan elemen target
    let top = rect.top;
    let left = rect.right + 16;

    // Jika tooltip akan keluar layar kanan, pindahkan ke bawah elemen
    if (left + 340 > viewportWidth) {
      left = Math.max(16, rect.left);
      top = rect.bottom + 12;
    }

    // Jika tooltip akan keluar layar bawah, geser ke atas
    if (top + 200 > viewportHeight) {
      top = Math.max(16, viewportHeight - 260);
    }

    setTooltipPos({ top, left });
  }, [currentStep]);

  // Kelola spotlight class pada elemen target
  useEffect(() => {
    if (!isActive || !isReady) return;

    // Hapus spotlight dari elemen sebelumnya
    if (prevTargetRef.current) {
      const prevEl = document.getElementById(prevTargetRef.current);
      if (prevEl) prevEl.classList.remove('onboarding-spotlight');
    }

    const step = STEPS[currentStep];
    if (step?.targetId) {
      const el = document.getElementById(step.targetId);
      if (el) {
        el.classList.add('onboarding-spotlight');
        spotlightRef.current = el;
        prevTargetRef.current = step.targetId;
      }
    } else {
      prevTargetRef.current = null;
    }

    calculatePosition();

    // Recalculate position on resize/scroll
    window.addEventListener('resize', calculatePosition);
    window.addEventListener('scroll', calculatePosition, { passive: true });
    return () => {
      window.removeEventListener('resize', calculatePosition);
      window.removeEventListener('scroll', calculatePosition);
    };
  }, [currentStep, isActive, isReady, calculatePosition]);

  // Prevent background scrolling saat tour aktif
  useEffect(() => {
    if (isActive) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isActive]);

  const cleanupSpotlight = () => {
    if (prevTargetRef.current) {
      const el = document.getElementById(prevTargetRef.current);
      if (el) el.classList.remove('onboarding-spotlight');
      prevTargetRef.current = null;
    }
  };

  const handleComplete = () => {
    cleanupSpotlight();
    setIsActive(false);

    if (email) {
      try {
        localStorage.setItem(`${STORAGE_KEY_PREFIX}${email}`, 'true');
      } catch { /* ignore */ }
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
      router.push('/comments');
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  if (!isActive || !isReady) return null;

  const step = STEPS[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === STEPS.length - 1;
  const isCenterModal = !step.targetId;
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div className="fixed inset-0 z-[200]">
      {/* ── Backdrop Overlay ───────────────────────────────── */}
      {!targetRect ? (
        <div
          className="fixed inset-0 bg-black/60 dark:bg-black/75 transition-opacity z-[201]"
          onClick={handleSkip}
        />
      ) : (
        <>
          {/* Invisible backdrop to capture clicks to skip */}
          <div
            className="fixed inset-0 z-[201]"
            onClick={handleSkip}
          />
          {/* Spotlight highlight */}
          <div
            className="fixed rounded-xl pointer-events-none transition-all duration-300 border-2 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)] z-[202]"
            style={{
              top: targetRect.top - 6,
              left: targetRect.left - 6,
              width: targetRect.width + 12,
              height: targetRect.height + 12,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75)',
            }}
          />
        </>
      )}

      {/* ── Tooltip / Modal Card ──────────────────────────── */}
      <div
        key={currentStep}
        style={
          isCenterModal
            ? {
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 210,
            }
            : {
              position: 'fixed',
              top: tooltipPos?.top ?? '50%',
              left: tooltipPos?.left ?? '50%',
              transform: tooltipPos ? 'none' : 'translate(-50%, -50%)',
              zIndex: 210,
            }
        }
      >
        <div
          className={`w-[340px] max-w-[90vw] rounded-2xl border p-5 shadow-2xl
            bg-white/95 border-slate-200 text-slate-800
            dark:bg-slate-950/95 dark:border-slate-800 dark:text-slate-100
            backdrop-blur-xl animate-onboarding-in`}
        >
          {/* Ikon & Judul */}
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg bg-indigo-500/10 dark:bg-indigo-500/20">
              {step.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold tracking-tight leading-tight">
                {step.title}
              </h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                Langkah {currentStep + 1} dari {STEPS.length}
              </p>
            </div>
          </div>

          {/* Deskripsi */}
          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400 mb-4">
            {step.description}
          </p>

          {/* Progress Bar */}
          <div className="w-full h-1 rounded-full overflow-hidden mb-4" style={{ background: 'var(--border-default)' }}>
            <div
              className="h-full rounded-full bg-indigo-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Step Dots */}
          <div className="flex items-center justify-center gap-1.5 mb-4">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 ${i === currentStep
                    ? 'w-5 h-1.5 bg-indigo-500'
                    : i < currentStep
                      ? 'w-1.5 h-1.5 bg-indigo-400/50'
                      : 'w-1.5 h-1.5 bg-slate-300 dark:bg-slate-700'
                  }`}
              />
            ))}
          </div>

          {/* Tombol Navigasi */}
          <div className="flex items-center gap-2">
            {/* Tombol Lewati */}
            {!isLastStep && (
              <button
                onClick={handleSkip}
                className="text-[11px] font-medium text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors px-2 py-1.5 cursor-pointer"
              >
                Lewati
              </button>
            )}

            <div className="flex-1" />

            {/* Tombol Kembali */}
            {!isFirstStep && (
              <button
                onClick={handlePrev}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-[12px] font-semibold rounded-xl transition-all active:scale-95 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-800/50 cursor-pointer"
              >
                Kembali
              </button>
            )}

            {/* Tombol Lanjut / Selesai */}
            <button
              onClick={handleNext}
              className="px-5 py-2 text-[12px] font-semibold rounded-xl transition-all active:scale-95 text-white cursor-pointer bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-900/20"
            >
              {isLastStep ? 'Mulai Moderasi!' : 'Lanjut'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
