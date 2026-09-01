'use client';

import { PieChart } from 'lucide-react';
import Link from 'next/link';

export default function UserTierDonutChart({ stats = {} }) {
  const totalUsersCount = Math.max(stats.totalUsers || 1, 1);
  const cntFree = stats.tierCounts?.FREE || 0;
  const cntPro = stats.tierCounts?.PRO || 0;
  const cntEnt = stats.tierCounts?.ENTERPRISE || 0;
  const pctFree = Math.round((cntFree / totalUsersCount) * 100);
  const pctPro = Math.round((cntPro / totalUsersCount) * 100);
  const pctEnt = 100 - pctFree - pctPro;

  // Donut SVG circumference (radius = 38)
  const donutR = 38;
  const donutCircumference = 2 * Math.PI * donutR; // ~238.76
  const strokeFree = (pctFree / 100) * donutCircumference;
  const strokePro = (pctPro / 100) * donutCircumference;
  const strokeEnt = (pctEnt / 100) * donutCircumference;

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
        {/* SVG Donut Chart */}
        <div className="relative flex items-center justify-center shrink-0">
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
                strokeWidth="14"
                strokeDasharray={`${strokeEnt} ${donutCircumference}`}
                strokeDashoffset={0}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-700"
              />
            )}
            {/* Pro Segment (Indigo) */}
            {strokePro > 0 && (
              <circle
                cx="50"
                cy="50"
                r={donutR}
                stroke="#6366f1"
                strokeWidth="14"
                strokeDasharray={`${strokePro} ${donutCircumference}`}
                strokeDashoffset={-strokeEnt}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-700"
              />
            )}
            {/* Free Segment (Slate) */}
            {strokeFree > 0 && (
              <circle
                cx="50"
                cy="50"
                r={donutR}
                stroke="#94a3b8"
                strokeWidth="14"
                strokeDasharray={`${strokeFree} ${donutCircumference}`}
                strokeDashoffset={-(strokeEnt + strokePro)}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-700"
              />
            )}
          </svg>
          {/* Donut Center Info */}
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-xl font-extrabold text-primary">{stats.totalUsers}</span>
            <span className="text-[10px] font-semibold text-muted">Total Akun</span>
          </div>
        </div>

        {/* Donut Legend & Stats Breakdown */}
        <div className="space-y-2.5 flex-1 w-full max-w-[240px]">
          <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-default)]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <span className="text-secondary font-medium">Free (Dasar)</span>
            </div>
            <div className="text-right">
              <strong className="text-primary font-bold">{cntFree}</strong>
              <span className="text-[10px] text-muted ml-1">({pctFree}%)</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-indigo-500/5 border border-indigo-500/15">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <span className="text-indigo-600 dark:text-indigo-300 font-medium">Paket PRO</span>
            </div>
            <div className="text-right">
              <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{cntPro}</strong>
              <span className="text-[10px] text-indigo-400 ml-1">({pctPro}%)</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-emerald-600 dark:text-emerald-300 font-medium">Paket ENTERPRISE</span>
            </div>
            <div className="text-right">
              <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{cntEnt}</strong>
              <span className="text-[10px] text-emerald-400 ml-1">({pctEnt}%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
