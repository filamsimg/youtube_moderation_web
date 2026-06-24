import React from 'react';

export default function UserAvatar({ name, src, className = 'w-7 h-7' }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        className={`rounded-full flex-shrink-0 object-cover ${className}`}
      />
    );
  }

  const initial = name ? name.charAt(0).toUpperCase() : '?';
  const charCode = initial.charCodeAt(0);
  const hue = (charCode * 35) % 360;

  return (
    <div
      className={`rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 ${className}`}
      style={{ backgroundColor: `hsl(${hue}, 60%, 40%)` }}
    >
      {initial}
    </div>
  );
}
