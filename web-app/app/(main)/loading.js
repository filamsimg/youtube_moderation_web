'use client';

import React from 'react';

export default function MainLoading() {
  return (
    <div className="w-full space-y-6 animate-pulse select-none">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-6 w-48 bg-slate-200/70 dark:bg-slate-800/50 rounded-lg" />
        <div className="h-3 w-80 bg-slate-200/50 dark:bg-slate-800/30 rounded-lg" />
      </div>

      {/* Stats Cards Row Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bento-card p-5 space-y-4 border border-[var(--border-default)]"
            style={{ background: 'var(--bg-card-hover)' }}
          >
            <div className="flex justify-between items-start">
              <div className="space-y-2.5">
                <div className="h-3.5 w-24 bg-slate-200/70 dark:bg-slate-800/50 rounded-md" />
                <div className="h-7 w-16 bg-slate-200/90 dark:bg-slate-800/70 rounded-lg" />
              </div>
              <div className="w-8 h-8 rounded-xl bg-slate-200/60 dark:bg-slate-800/40" />
            </div>
            <div className="h-3 w-40 bg-slate-200/50 dark:bg-slate-800/30 rounded-md" />
          </div>
        ))}
      </div>

      {/* Main Content Area Skeleton (Bento Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Table Skeleton */}
        <div
          className="lg:col-span-2 bento-card p-5 space-y-5 border border-[var(--border-default)]"
          style={{ background: 'var(--bg-card-hover)' }}
        >
          <div className="flex justify-between items-center pb-2">
            <div className="space-y-2">
              <div className="h-4.5 w-32 bg-slate-200/80 dark:bg-slate-800/60 rounded-md" />
              <div className="h-3 w-48 bg-slate-200/50 dark:bg-slate-800/30 rounded-md" />
            </div>
            <div className="w-20 h-7 bg-slate-200/60 dark:bg-slate-800/40 rounded-lg" />
          </div>

          <div className="space-y-3.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between py-2.5 border-b border-[var(--border-default)]/60 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200/70 dark:bg-slate-800/50" />
                  <div className="space-y-2">
                    <div className="h-3 w-28 bg-slate-200/80 dark:bg-slate-800/60 rounded-md" />
                    <div className="h-2.5 w-44 bg-slate-200/50 dark:bg-slate-800/30 rounded-md" />
                  </div>
                </div>
                <div className="w-14 h-5 bg-slate-200/60 dark:bg-slate-800/40 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Mini List / Chart Area Skeleton */}
        <div
          className="bento-card p-5 space-y-5 border border-[var(--border-default)]"
          style={{ background: 'var(--bg-card-hover)' }}
        >
          <div className="space-y-2 pb-2">
            <div className="h-4.5 w-36 bg-slate-200/80 dark:bg-slate-800/60 rounded-md" />
            <div className="h-3 w-24 bg-slate-200/50 dark:bg-slate-800/30 rounded-md" />
          </div>

          <div className="flex flex-col items-center justify-center py-6">
            {/* Circle Skeleton for Pie Chart */}
            <div className="w-28 h-28 rounded-full border-[10px] border-slate-200/30 dark:border-slate-800/30 border-t-slate-200/60 dark:border-t-slate-800/50 animate-spin" style={{ animationDuration: '3s' }} />
          </div>

          <div className="space-y-2.5">
            <div className="flex justify-between">
              <div className="h-3 w-16 bg-slate-200/70 dark:bg-slate-800/50 rounded-md" />
              <div className="h-3 w-8 bg-slate-200/70 dark:bg-slate-800/50 rounded-md" />
            </div>
            <div className="flex justify-between">
              <div className="h-3 w-20 bg-slate-200/70 dark:bg-slate-800/50 rounded-md" />
              <div className="h-3 w-10 bg-slate-200/70 dark:bg-slate-800/50 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
