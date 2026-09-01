import React from 'react';

/**
 * Base Skeleton Element (Shimmering Box)
 */
export function Skeleton({ className = '', style = {} }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-slate-200/70 dark:bg-slate-800/80 ${className}`}
      style={style}
    />
  );
}

/**
 * Stat Card Skeleton Placeholder (4 Grid)
 */
export function StatCardsSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="p-5 rounded-2xl border border-[var(--border-default)] bg-card shadow-sm space-y-3"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-3.5 w-24 rounded-md" />
            <Skeleton className="w-8 h-8 rounded-xl" />
          </div>
          <Skeleton className="h-7 w-32 rounded-lg" />
          <div className="pt-2 border-t border-[var(--border-default)] flex justify-between">
            <Skeleton className="h-3 w-16 rounded-md" />
            <Skeleton className="h-3 w-16 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Admin Dashboard Overview Skeleton
 */
export function AdminOverviewSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-64 rounded-lg" />
        <Skeleton className="h-3.5 w-96 rounded-md" />
      </div>

      {/* 4 Stat Cards */}
      <StatCardsSkeleton count={4} />

      {/* Grid: Graph (2 cols) & Users List (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Graph Skeleton */}
        <div className="lg:col-span-2 p-5 rounded-2xl border border-[var(--border-default)] bg-card shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-48 rounded-md" />
            <Skeleton className="h-4 w-16 rounded-full" />
          </div>
          <Skeleton className="w-full h-[180px] rounded-xl" />
        </div>

        {/* Newest Users Skeleton */}
        <div className="p-5 rounded-2xl border border-[var(--border-default)] bg-card shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-36 rounded-md" />
            <Skeleton className="h-3 w-16 rounded-md" />
          </div>
          <div className="divide-y divide-[var(--border-default)]">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                <div className="space-y-1.5 flex-1 pr-4">
                  <Skeleton className="h-3.5 w-40 rounded-md" />
                  <Skeleton className="h-2.5 w-24 rounded-md" />
                </div>
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Creator Dashboard Overview Skeleton
 */
export function CreatorDashboardSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-56 rounded-lg" />
          <Skeleton className="h-3.5 w-80 rounded-md" />
        </div>
        <Skeleton className="h-9 w-32 rounded-xl" />
      </div>

      {/* 4 Stat Cards */}
      <StatCardsSkeleton count={4} />

      {/* 2 Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl border border-[var(--border-default)] bg-card shadow-sm space-y-4">
          <Skeleton className="h-4 w-40 rounded-md" />
          <Skeleton className="w-full h-64 rounded-xl" />
        </div>
        <div className="p-5 rounded-2xl border border-[var(--border-default)] bg-card shadow-sm space-y-4">
          <Skeleton className="h-4 w-40 rounded-md" />
          <Skeleton className="w-full h-64 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/**
 * Table Rows Skeleton (untuk Riwayat & Komentar)
 */
export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="w-full border border-[var(--border-default)] rounded-2xl overflow-hidden bg-card divide-y divide-[var(--border-default)] animate-fade-in">
      {/* Table Header */}
      <div className="p-4 bg-[var(--bg-card-hover)] flex items-center justify-between gap-4">
        {Array.from({ length: cols }).map((_, idx) => (
          <Skeleton key={idx} className="h-3.5 w-24 rounded-md" />
        ))}
      </div>
      {/* Table Rows */}
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} className="p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
            <div className="space-y-1.5 flex-1 max-w-md">
              <Skeleton className="h-3.5 w-3/4 rounded-md" />
              <Skeleton className="h-2.5 w-1/2 rounded-md" />
            </div>
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-3.5 w-20 rounded-md" />
          <Skeleton className="h-7 w-20 rounded-xl" />
        </div>
      ))}
    </div>
  );
}
