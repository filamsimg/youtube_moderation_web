import React from 'react';

export default function StatusBadge({ type, value, label, className = '' }) {
  let badgeClass = '';
  let displayLabel = label || value || '';

  if (type === 'role') {
    const valLower = String(value).toLowerCase();
    if (valLower === 'superadmin') {
      badgeClass = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20';
    } else if (valLower === 'admin') {
      badgeClass = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
    } else {
      badgeClass = 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-[var(--border-default)]';
    }
  } else if (type === 'tier') {
    const valUpper = String(value).toUpperCase();
    if (valUpper === 'PRO') {
      badgeClass = 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300';
    } else if (valUpper === 'ENTERPRISE') {
      badgeClass = 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300';
    } else {
      badgeClass = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  } else if (type === 'audit_action') {
    const valUpper = String(value).toUpperCase();
    if (valUpper.includes('SUSPEND')) {
      badgeClass = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20';
    } else if (valUpper.includes('ROLE')) {
      badgeClass = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
    } else if (valUpper.includes('TIER') || valUpper.includes('QUOTA') || valUpper.includes('ADJUST')) {
      badgeClass = 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300 border border-indigo-500/25';
    } else {
      badgeClass = 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border';
    }
  } else if (type === 'moderation_status' || type === 'status') {
    const valLower = String(value).toLowerCase();
    if (valLower === 'published') {
      badgeClass = 'badge badge-success';
      displayLabel = label || 'Aman';
    } else if (valLower === 'heldforreview') {
      badgeClass = 'badge badge-warning';
      displayLabel = label || 'Ditahan';
    } else if (valLower === 'rejected') {
      badgeClass = 'badge badge-danger';
      displayLabel = label || 'Ditolak';
    } else {
      badgeClass = 'badge badge-muted';
    }
  } else if (type === 'ai_label') {
    const valLower = String(value).toLowerCase();
    if (valLower === 'spam') {
      badgeClass = 'badge badge-danger';
      displayLabel = label || 'Spam Judol';
    } else if (valLower === 'normal') {
      badgeClass = 'badge badge-success';
      displayLabel = label || 'Normal';
    } else {
      badgeClass = 'badge badge-muted';
    }
  } else if (type === 'sentiment') {
    const valLower = String(value).toLowerCase();
    if (valLower === 'positive') {
      badgeClass = 'badge badge-success';
      displayLabel = label || 'Positif';
    } else if (valLower === 'negative') {
      badgeClass = 'badge badge-danger';
      displayLabel = label || 'Negatif';
    } else if (valLower === 'neutral') {
      badgeClass = 'badge badge-muted';
      displayLabel = label || 'Netral';
    } else {
      badgeClass = 'badge badge-muted';
    }
  }

  // Support circle indicator in moderation/status types
  const showDot = (type === 'moderation_status' || type === 'status');
  const dotColor = showDot ? {
    published: 'bg-emerald-500',
    heldforreview: 'bg-amber-500',
    rejected: 'bg-rose-500'
  }[String(value).toLowerCase()] || 'bg-slate-500' : '';

  return (
    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase inline-flex items-center gap-1 ${badgeClass} ${className}`}>
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />}
      {displayLabel}
    </span>
  );
}
