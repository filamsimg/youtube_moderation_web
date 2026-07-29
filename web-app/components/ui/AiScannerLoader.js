'use client';

import { useState, useEffect } from 'react';

const AI_SCAN_PHASES = [
  { text: 'Mengekstrak komentar dari YouTube API...', icon: 'fetch', pct: 20 },
  { text: 'Menyiapkan pipeline NLP Athena Shield...', icon: 'prepare', pct: 40 },
  { text: 'Model AI menganalisis pola teks spam...', icon: 'analyze', pct: 65 },
  { text: 'Menyaring indikator judi online...', icon: 'filter', pct: 82 },
  { text: 'Memverifikasi threshold kepercayaan AI...', icon: 'verify', pct: 95 },
];

function PhaseIcon({ type }) {
  if (type === 'fetch') return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  );
  if (type === 'prepare') return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
  if (type === 'analyze') return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  );
  if (type === 'filter') return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
    </svg>
  );
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

export default function AiScannerLoader({ videoCount = 1 }) {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [smoothPct, setSmoothPct] = useState(0);
  const [dots, setDots] = useState('');

  // Advance phase every 1.1s
  useEffect(() => {
    const interval = setInterval(() => {
      setPhaseIndex(prev => (prev + 1) % AI_SCAN_PHASES.length);
    }, 1100);
    return () => clearInterval(interval);
  }, []);

  // Smooth progress bar toward target pct
  useEffect(() => {
    const target = AI_SCAN_PHASES[phaseIndex].pct;
    const step = setInterval(() => {
      setSmoothPct(prev => {
        const diff = target - prev;
        if (Math.abs(diff) < 0.5) return target;
        return prev + diff * 0.12;
      });
    }, 16);
    return () => clearInterval(step);
  }, [phaseIndex]);

  // Animated ellipsis dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 420);
    return () => clearInterval(interval);
  }, []);

  const phase = AI_SCAN_PHASES[phaseIndex];

  return (
    <div className="flex flex-col items-center justify-center h-full py-16 px-6 select-none">
      {/* ── Central Glow Orb ─────────────────────────── */}
      <div className="relative w-24 h-24 mb-8">
        {/* Outer rotating ring */}
        <div
          className="absolute inset-0 rounded-full border-2 border-transparent animate-spin"
          style={{
            borderTopColor: 'rgba(99, 102, 241, 0.6)',
            borderRightColor: 'rgba(16, 185, 129, 0.4)',
            animationDuration: '2s',
          }}
        />
        {/* Inner counter-rotating ring */}
        <div
          className="absolute inset-2 rounded-full border border-transparent animate-spin"
          style={{
            borderTopColor: 'rgba(16, 185, 129, 0.5)',
            borderLeftColor: 'rgba(99, 102, 241, 0.3)',
            animationDuration: '1.5s',
            animationDirection: 'reverse',
          }}
        />
        {/* Core icon */}
        <div className="absolute inset-4 rounded-full flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(16,185,129,0.15) 100%)' }}>
          <div className="text-indigo-400">
            <PhaseIcon type={phase.icon} />
          </div>
        </div>
        {/* Radial glow pulse */}
        <div
          className="absolute inset-0 rounded-full animate-ping"
          style={{
            background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
            animationDuration: '2.2s',
          }}
        />
      </div>

      {/* ── Badge Status ─────────────────────────────── */}
      <div
        className="flex items-center gap-1.5 px-3 py-1 rounded-full mb-4 border text-[10px] font-semibold"
        style={{
          background: 'rgba(99,102,241,0.08)',
          borderColor: 'rgba(99,102,241,0.2)',
          color: 'var(--text-muted)',
        }}
      >
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500" />
        </span>
        Athena Shield AI Scanner
      </div>

      {/* ── Phase Text ───────────────────────────────── */}
      <p
        key={phaseIndex}
        className="text-sm font-medium text-center mb-1 max-w-xs transition-all duration-300"
        style={{ color: 'var(--text-secondary)' }}
      >
        {phase.text}
        <span className="text-indigo-400">{dots}</span>
      </p>
      <p className="text-[11px] mb-6" style={{ color: 'var(--text-muted)' }}>
        {videoCount > 1 ? `Memproses ${videoCount} video sekaligus` : 'Memproses video pilihan Anda'}
      </p>

      {/* ── Smooth Neon Progress Bar ─────────────────── */}
      <div className="w-full max-w-xs">
        <div
          className="h-1.5 rounded-full overflow-hidden mb-2"
          style={{ background: 'var(--border-default)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${smoothPct}%`,
              background: 'linear-gradient(90deg, #6366f1 0%, #10b981 100%)',
              boxShadow: '0 0 10px rgba(99,102,241,0.5)',
            }}
          />
        </div>

        {/* ── Skeleton Comment Cards ─────────────────── */}
        <div className="space-y-2.5 mt-5">
          {[0.9, 0.75, 0.6].map((opacity, i) => (
            <div
              key={i}
              className="rounded-xl p-3 border animate-pulse"
              style={{
                opacity,
                background: 'var(--bg-card)',
                borderColor: 'var(--border-default)',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full" style={{ background: 'var(--border-default)' }} />
                <div className="h-2 rounded-full w-24" style={{ background: 'var(--border-default)' }} />
                <div className="h-2 rounded-full w-12 ml-auto" style={{ background: 'var(--border-default)' }} />
              </div>
              <div className="space-y-1.5">
                <div className="h-2 rounded-full" style={{ background: 'var(--border-default)', width: `${75 + i * 8}%` }} />
                <div className="h-2 rounded-full" style={{ background: 'var(--border-default)', width: `${55 + i * 5}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
