import React from 'react';

export default function StatCard({ label, value, sub, icon, color = 'indigo', delay = 0 }) {
  const glowColor = {
    blue: 'rgba(59, 130, 246, 0.10)',
    emerald: 'rgba(16, 185, 129, 0.10)',
    amber: 'rgba(245, 158, 11, 0.10)',
    rose: 'rgba(244, 63, 94, 0.10)',
    violet: 'rgba(139, 92, 246, 0.10)',
    indigo: 'rgba(99, 102, 241, 0.10)',
  }[color] || 'rgba(99, 102, 241, 0.10)';

  const iconBg = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400',
    amber: 'bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400',
    rose: 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400',
    violet: 'bg-violet-50 border-violet-200 text-violet-600 dark:bg-violet-500/10 dark:border-violet-500/20 dark:text-violet-400',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-500/10 dark:border-indigo-500/20 dark:text-indigo-400',
  }[color] || 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-500/10 dark:border-indigo-500/20 dark:text-indigo-400';

  return (
    <div
      className="bento-card bento-card-glow p-4 group relative overflow-hidden animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Corner glow */}
      <div
        className="absolute -right-8 -top-8 w-24 h-24 rounded-full blur-2xl transition-all duration-500 group-hover:scale-125"
        style={{ background: glowColor }}
      />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-bold text-secondary uppercase tracking-wider">{label}</p>
          <div className={`p-1.5 rounded-lg border ${iconBg}`}>
            {icon}
          </div>
        </div>
        <p className="text-xl font-extrabold tracking-tight text-primary">{value}</p>
        {sub && <div className="text-[11px] text-muted mt-1">{sub}</div>}
      </div>
    </div>
  );
}
