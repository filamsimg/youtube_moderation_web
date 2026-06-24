import React from 'react';

export default function EmptyState({ icon, title, description, actionButton }) {
  return (
    <div className="empty-state py-16 flex flex-col items-center justify-center text-center max-w-md mx-auto animate-fade-in">
      {icon && (
        <div className="mb-3 flex-shrink-0 text-[var(--border-hover)]" style={{ color: 'var(--border-hover)' }}>
          {icon}
        </div>
      )}
      <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{title}</p>
      {description && (
        <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          {description}
        </p>
      )}
      {actionButton && (
        <div className="mt-4">
          {actionButton}
        </div>
      )}
    </div>
  );
}
