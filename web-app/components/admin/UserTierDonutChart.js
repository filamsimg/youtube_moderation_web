'use client';

import { useState } from 'react';
import { PieChart } from 'lucide-react';
import Link from 'next/link';

export default function UserTierDonutChart({ stats = {} }) {
  const [hoveredTier, setHoveredTier] = useState(null); // 'FREE' | 'PRO' | 'ENTERPRISE' | null

  const totalUsersCount = Math.max(stats.totalUsers || 1, 1);
  const cntFree = stats.tierCounts?.FREE || 0;
  const cntPro = stats.tierCounts?.PRO || 0;
  const cntEnt = stats.tierCounts?.ENTERPRISE || 0;
  const pctFree = Math.round((cntFree / totalUsersCount) * 100);
  const pctPro = Math.round((cntPro / totalUsersCount) * 100);
  const pctEnt = Math.max(0, 100 - pctFree - pctPro);

  // Donut SVG circumference (radius = 38)
  const donutR = 38;
  const donutCircumference = 2 * Math.PI * donutR; // ~238.76
  const strokeFree = (pctFree / 100) * donutCircumference;
  const strokePro = (pctPro / 100) * donutCircumference;
  const strokeEnt = (pctEnt / 100) * donutCircumference;

  // Active hover data calculation
  const getCenterContent = () => {
    if (hoveredTier === 'FREE') {
      return {
        value: cntFree,
        label: `${pctFree}% Free`,
        subColor: 'text-slate-500 dark:text-slate-400',
        valColor: 'text-slate-700 dark:text-slate-200',
      };
    }
    if (hoveredTier === 'PRO') {
      return {
        value: cntPro,
        label: `${pctPro}% Paket PRO`,
        subColor: 'text-indigo-500 dark:text-indigo-400',
        valColor: 'text-indigo-600 dark:text-indigo-400',
      };
    }
    if (hoveredTier === 'ENTERPRISE') {
      return {
        value: cntEnt,
        label: `${pctEnt}% Enterprise`,
        subColor: 'text-emerald-500 dark:text-emerald-400',
        valColor: 'text-emerald-600 dark:text-emerald-400',
      };
    }
    return {
      value: stats.totalUsers || 0,
      label: 'Total Akun',
      subColor: 'text-muted',
      valColor: 'text-primary',
    };
  };

  const centerInfo = getCenterContent();

  return (
    <div className="p-5 rounded-2xl border bg-card border-[var(--border-default)] shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-primary flex items-center gap-1.5">
            <PieChart className="w-4 h-4 text-indigo-500" />
            Distribusi Paket &amp; Status Pengguna
          </h2>
          <p className="text-xs text-muted mt-0.5">Proporsi akun kreator dan keaktifan langganan</p>
        </div>
        <Link href="/admin/users" className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
          Kelola Pengguna →
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-around gap-6 pt-1">
        {/* SVG Donut Chart with Interactive Segments */}
        <div 
          className="relative flex items-center justify-center shrink-0 group"
          onMouseLeave={() => setHoveredTier(null)}
        >
          <svg className="w-36 h-36 -rotate-90 transform" viewBox="0 0 100 100">
            {/* Background Ring */}
            <circle
              cx="50"
              cy="50"
              r={donutR}
              className="text-slate-200 dark:text-slate-800"
              strokeWidth="14"
              stroke="currentColor"
              fill="transparent"
            />
            {/* Enterprise Segment (Emerald) */}
            {strokeEnt > 0 && (
              <circle
                cx="50"
                cy="50"
                r={donutR}
                stroke="#10b981"
                strokeWidth={hoveredTier === 'ENTERPRISE' ? '18' : '14'}
                strokeDasharray={`${strokeEnt} ${donutCircumference}`}
                strokeDashoffset={0}
                strokeLinecap="round"
                fill="transparent"
                onMouseEnter={() => setHoveredTier('ENTERPRISE')}
                className={`transition-all duration-300 cursor-pointer ${
                  hoveredTier && hoveredTier !== 'ENTERPRISE' ? 'opacity-40' : 'opacity-100'
                }`}
              />
            )}
            {/* Pro Segment (Indigo) */}
            {strokePro > 0 && (
              <circle
                cx="50"
                cy="50"
                r={donutR}
                stroke="#6366f1"
                strokeWidth={hoveredTier === 'PRO' ? '18' : '14'}
                strokeDasharray={`${strokePro} ${donutCircumference}`}
                strokeDashoffset={-strokeEnt}
                strokeLinecap="round"
                fill="transparent"
                onMouseEnter={() => setHoveredTier('PRO')}
                className={`transition-all duration-300 cursor-pointer ${
                  hoveredTier && hoveredTier !== 'PRO' ? 'opacity-40' : 'opacity-100'
                }`}
              />
            )}
            {/* Free Segment (Slate) */}
            {strokeFree > 0 && (
              <circle
                cx="50"
                cy="50"
                r={donutR}
                stroke="#94a3b8"
                strokeWidth={hoveredTier === 'FREE' ? '18' : '14'}
                strokeDasharray={`${strokeFree} ${donutCircumference}`}
                strokeDashoffset={-(strokeEnt + strokePro)}
                strokeLinecap="round"
                fill="transparent"
                onMouseEnter={() => setHoveredTier('FREE')}
                className={`transition-all duration-300 cursor-pointer ${
                  hoveredTier && hoveredTier !== 'FREE' ? 'opacity-40' : 'opacity-100'
                }`}
              />
            )}
          </svg>

          {/* Dynamic Donut Center Info */}
          <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none transition-all duration-200">
            <span className={`text-2xl font-extrabold tracking-tight transition-all duration-200 ${centerInfo.valColor}`}>
              {centerInfo.value}
            </span>
            <span className={`text-[10px] font-bold tracking-wide transition-all duration-200 ${centerInfo.subColor}`}>
              {centerInfo.label}
            </span>
          </div>
        </div>

        {/* Donut Legend & Interactive Stats Breakdown */}
        <div className="space-y-2 flex-1 w-full max-w-[250px]">
          {/* Free Card */}
          <div
            onMouseEnter={() => setHoveredTier('FREE')}
            onMouseLeave={() => setHoveredTier(null)}
            className={`flex items-center justify-between text-xs p-2.5 rounded-xl border transition-all cursor-pointer ${
              hoveredTier === 'FREE'
                ? 'bg-slate-500/15 border-slate-500/40 shadow-sm scale-[1.02]'
                : 'bg-[var(--bg-card-hover)] border-[var(--border-default)] hover:bg-[var(--bg-card-hover)]'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <span className="text-secondary font-semibold">Free (Dasar)</span>
            </div>
            <div className="text-right">
              <strong className="text-primary font-bold">{cntFree}</strong>
              <span className="text-[10px] text-muted ml-1 font-semibold">({pctFree}%)</span>
            </div>
          </div>

          {/* Pro Card */}
          <div
            onMouseEnter={() => setHoveredTier('PRO')}
            onMouseLeave={() => setHoveredTier(null)}
            className={`flex items-center justify-between text-xs p-2.5 rounded-xl border transition-all cursor-pointer ${
              hoveredTier === 'PRO'
                ? 'bg-indigo-500/15 border-indigo-500/40 shadow-sm scale-[1.02]'
                : 'bg-indigo-500/5 border-indigo-500/15 hover:bg-indigo-500/10'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <span className="text-indigo-600 dark:text-indigo-300 font-semibold">Paket PRO</span>
            </div>
            <div className="text-right">
              <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{cntPro}</strong>
              <span className="text-[10px] text-indigo-400 ml-1 font-semibold">({pctPro}%)</span>
            </div>
          </div>

          {/* Enterprise Card */}
          <div
            onMouseEnter={() => setHoveredTier('ENTERPRISE')}
            onMouseLeave={() => setHoveredTier(null)}
            className={`flex items-center justify-between text-xs p-2.5 rounded-xl border transition-all cursor-pointer ${
              hoveredTier === 'ENTERPRISE'
                ? 'bg-emerald-500/15 border-emerald-500/40 shadow-sm scale-[1.02]'
                : 'bg-emerald-500/5 border-emerald-500/15 hover:bg-emerald-500/10'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-emerald-600 dark:text-emerald-300 font-semibold">Paket ENTERPRISE</span>
            </div>
            <div className="text-right">
              <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{cntEnt}</strong>
              <span className="text-[10px] text-emerald-400 ml-1 font-semibold">({pctEnt}%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

