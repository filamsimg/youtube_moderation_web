'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import QuotaIndicator from '@/components/QuotaIndicator';
import { useSidebar } from '@/contexts/SidebarContext';
import { useSession } from 'next-auth/react';

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'admin' || session?.user?.role === 'superadmin';
  const [isOpen, setIsOpen] = useState(false);
  const { sidebarMode, setSidebarMode, isHovered, setIsHovered } = useSidebar();
  const [showControlPanel, setShowControlPanel] = useState(false);
  const popoverRef = useRef(null);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Handle clicking outside the Sidebar Control popover to close it
  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setShowControlPanel(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const SidebarControlIcon = () => (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeDasharray="3 3" d="M9 3v18" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  const navLinks = [
    {
      name: 'Beranda',
      href: '/dashboard',
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      ),
    },
    {
      name: 'Moderasi Komentar',
      href: '/comments',
      id: 'onboarding-nav-comments',
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      ),
    },
    {
      name: 'Riwayat',
      href: '/riwayat',
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      name: 'Preferensi',
      href: '/preferensi',
      id: 'onboarding-nav-preferensi',
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },

    {
      name: 'Paket & Kuota',
      href: '/pricing',
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
        </svg>
      ),
    },
  ];

  const SidebarContent = ({ isMobile = false }) => {
    // Determine collapsed state for this sidebar content instance
    const isCollapsed = !isMobile && (sidebarMode === 'collapsed' || (sidebarMode === 'hover' && !isHovered));

    const drawerClass = `
      flex flex-col h-full border-r transition-all duration-300 ease-in-out select-none
      bg-[var(--bg-sidebar)] border-[var(--border-default)]
      ${sidebarMode === 'expanded' || isMobile ? 'w-[240px] relative overflow-y-auto overflow-x-hidden' : ''}
      ${sidebarMode === 'collapsed' && !isMobile ? 'w-[72px] relative overflow-visible' : ''}
      ${sidebarMode === 'hover' && !isMobile ? `absolute left-0 top-0 h-screen ${isHovered ? 'w-[240px] shadow-2xl z-50 backdrop-blur-md overflow-y-auto overflow-x-hidden' : 'w-[72px] overflow-visible'}` : ''}
    `;

    return (
      <aside className={drawerClass}>

        {/* ── Logo & Brand ─────────────────────────────────────── */}
        <div className={`py-5 flex items-center transition-all duration-300 ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-5'}`}>
          <div className="relative flex-shrink-0">
            {/* Glow behind logo */}
            <div className="absolute inset-0 rounded-full bg-indigo-500/25 blur-md" />
            <img
              src="/logo.webp"
              alt="Athena Shield"
              className="relative w-9 h-9 object-contain drop-shadow-lg"
            />
          </div>
          <div className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto ml-1'}`}>
            <p className="text-sm font-semibold leading-none tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Athena Shield
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Perlindungan Komentar</p>
          </div>
        </div>

        {/* ── Divider ──────────────────────────────────────────── */}
        <div className={`h-px transition-all duration-300 ${isCollapsed ? 'mx-3' : 'mx-5'}`} style={{ background: 'var(--border-default)' }} />

        {/* ── Section label ────────────────────────────────────── */}
        <p className={`px-5 pt-4 pb-1.5 text-[10px] font-semibold uppercase tracking-widest transition-all duration-300 overflow-hidden whitespace-nowrap ${isCollapsed ? 'opacity-0 h-0 py-0 overflow-hidden' : 'opacity-100'}`} style={{ color: 'var(--text-muted)' }}>
          Navigasi
        </p>

        {/* ── Navigation Links ─────────────────────────────────── */}
        <nav id="onboarding-sidebar" className="flex-1 px-3 space-y-0.5">
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href ||
              (pathname === '/' && link.href === '/dashboard');
            return (
              <Link
                id={link.id || undefined}
                key={link.name}
                href={link.href}
                className={`flex items-center rounded-xl text-[13px] font-medium transition-all duration-200 group relative border ${isCollapsed ? 'justify-center p-2.5 mx-2 w-10 h-10' : 'gap-3 px-3 py-2.5 mx-0'
                  } ${isActive
                    ? 'bg-indigo-50 border-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:border-indigo-500/30 dark:text-indigo-300'
                    : 'border-transparent hover:bg-indigo-50/50 hover:border-indigo-100/50 dark:hover:bg-indigo-500/5 dark:hover:border-indigo-500/10'
                  }`}
                style={!isActive ? { color: 'var(--text-secondary)' } : {}}
              >
                <span
                  className={`flex-shrink-0 flex items-center justify-center ${isActive ? 'text-indigo-600 dark:text-indigo-400' : ''}`}
                  style={!isActive ? { color: 'var(--text-muted)' } : {}}
                >
                  {link.icon}
                </span>
                <span className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto ml-1'}`}>
                  {link.name}
                </span>
                {link.badge && !isCollapsed && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-amber-500 badge-pulse shadow-[0_0_6px_rgba(245,158,11,0.7)]" />
                )}
                {/* Active indicator line */}
                {isActive && !isCollapsed && (
                  <span className="absolute right-3 w-1 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                )}
                {/* Floating Tooltip for collapsed view */}
                {isCollapsed && (
                  <div className="absolute left-16 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 z-50 bg-slate-900 dark:bg-slate-800 text-slate-100 text-xs rounded-lg py-1.5 px-3 shadow-xl whitespace-nowrap border border-slate-700/50 pointer-events-none">
                    {link.name}
                  </div>
                )}
              </Link>
            );
          })}
          
          {isAdmin && (
            <Link
              href="/admin"
              className={`flex items-center rounded-xl text-[13px] font-medium transition-all duration-200 group relative border ${isCollapsed ? 'justify-center p-2.5 mx-2 w-10 h-10' : 'gap-3 px-3 py-2.5 mx-0 mt-3'
                } bg-rose-50/40 border-rose-500/20 text-rose-600 dark:bg-rose-500/10 dark:border-rose-500/25 dark:text-rose-300 hover:bg-rose-50 hover:border-rose-300 dark:hover:bg-rose-500/15`}
            >
              <span className="flex-shrink-0 flex items-center justify-center text-rose-500 dark:text-rose-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </span>
              <span className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto ml-1'}`}>
                Panel Admin
              </span>
              {isCollapsed && (
                <div className="absolute left-16 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 z-50 bg-slate-900 dark:bg-slate-800 text-slate-100 text-xs rounded-lg py-1.5 px-3 shadow-xl whitespace-nowrap border border-slate-700/50 pointer-events-none">
                  Panel Admin
                </div>
              )}
            </Link>
          )}
        </nav>

        {/* ── Bottom Section ───────────────────────────────────── */}
        <div className="px-3 pb-5 mt-auto space-y-2.5">
          <div className="mx-2 h-px" style={{ background: 'var(--border-default)' }} />

          {/* Quota Indicator */}
          {!isCollapsed && <div id="onboarding-quota"><QuotaIndicator /></div>}

          {/* Online Status */}
          {isCollapsed ? (
            <div className="flex justify-center group relative py-1">
              <span className="dot-online animate-pulse" />
              <div className="absolute left-16 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 z-50 bg-slate-900 dark:bg-slate-800 text-slate-100 text-xs rounded-lg py-1.5 px-3 shadow-xl whitespace-nowrap border border-slate-700/50 pointer-events-none">
                Sistem AI Aktif
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3">
              <span className="dot-online animate-pulse" />
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Sistem AI Aktif</span>
            </div>
          )}

          {/* Sidebar Control Popover and Trigger */}
          <div className="relative" ref={popoverRef}>
            <button
              onClick={() => setShowControlPanel(!showControlPanel)}
              className={`flex items-center gap-3 p-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 border cursor-pointer group relative ${showControlPanel
                ? 'bg-indigo-50 border-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:border-indigo-500/30 dark:text-indigo-300'
                : 'border-transparent hover:bg-indigo-50/50 hover:border-indigo-100/50 dark:hover:bg-indigo-500/5 dark:hover:border-indigo-500/10'
                } ${isCollapsed ? 'justify-center w-10 h-10 mx-2' : 'w-full'}`}
              style={{ color: 'var(--text-secondary)' }}
              aria-label="Kontrol Sidebar"
            >
              <span className="flex-shrink-0 flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
                <SidebarControlIcon />
              </span>
              {!isCollapsed && <span>Kontrol Sidebar</span>}
              {isCollapsed && !showControlPanel && (
                <div className="absolute left-16 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 z-50 bg-slate-900 dark:bg-slate-800 text-slate-100 text-xs rounded-lg py-1.5 px-3 shadow-xl whitespace-nowrap border border-slate-700/50 pointer-events-none">
                  Kontrol Sidebar
                </div>
              )}
            </button>

            {/* Floating Popover Panel - Responsive Dual Mode */}
            {showControlPanel && (
              <div
                className={`absolute bottom-12 rounded-xl border p-2 shadow-2xl backdrop-blur-xl animate-fade-in z-50 flex flex-col gap-0.5 w-[200px] ${isCollapsed ? 'left-14' : 'left-0 right-0'
                  } bg-white/95 border-slate-200 text-slate-800 dark:bg-slate-950/95 dark:border-slate-800 dark:text-slate-100`}
              >
                {/* Header */}
                <div className="px-3 py-1.5 border-b mb-1 border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-500">
                    Sidebar control
                  </p>
                </div>

                {/* Expanded Option */}
                <button
                  onClick={() => {
                    setSidebarMode('expanded');
                    setShowControlPanel(false);
                  }}
                  className="flex items-center justify-between w-full px-3 py-1.5 text-[12px] rounded-lg transition-colors cursor-pointer text-left hover:bg-slate-100 dark:hover:bg-slate-800/60"
                >
                  <span className={sidebarMode === 'expanded' ? 'text-indigo-600 dark:text-indigo-400 font-medium' : 'text-slate-600 dark:text-slate-400'}>
                    Expanded
                  </span>
                  {sidebarMode === 'expanded' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                  )}
                </button>

                {/* Collapsed Option */}
                <button
                  onClick={() => {
                    setSidebarMode('collapsed');
                    setShowControlPanel(false);
                  }}
                  className="flex items-center justify-between w-full px-3 py-1.5 text-[12px] rounded-lg transition-colors cursor-pointer text-left hover:bg-slate-100 dark:hover:bg-slate-800/60"
                >
                  <span className={sidebarMode === 'collapsed' ? 'text-indigo-600 dark:text-indigo-400 font-medium' : 'text-slate-600 dark:text-slate-400'}>
                    Collapsed
                  </span>
                  {sidebarMode === 'collapsed' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                  )}
                </button>

                {/* Expand on hover Option */}
                <button
                  onClick={() => {
                    setSidebarMode('hover');
                    setShowControlPanel(false);
                  }}
                  className="flex items-center justify-between w-full px-3 py-1.5 text-[12px] rounded-lg transition-colors cursor-pointer text-left hover:bg-slate-100 dark:hover:bg-slate-800/60"
                >
                  <span className={sidebarMode === 'hover' ? 'text-indigo-600 dark:text-indigo-400 font-medium' : 'text-slate-600 dark:text-slate-400'}>
                    Expand on hover
                  </span>
                  {sidebarMode === 'hover' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                  )}
                </button>
              </div>
            )}
          </div>

        </div>
      </aside>
    );
  };

  const desktopWrapperClass = `
    hidden lg:flex lg:flex-col lg:h-screen lg:sticky lg:top-0 transition-all duration-300 relative z-30
    ${sidebarMode === 'expanded' ? 'lg:w-[240px]' : 'lg:w-[72px]'}
  `;

  return (
    <>
      {/* Desktop Sidebar — always visible */}
      <div
        className={desktopWrapperClass}
        onMouseEnter={() => { if (sidebarMode === 'hover') setIsHovered(true); }}
        onMouseLeave={() => { if (sidebarMode === 'hover') setIsHovered(false); }}
      >
        <SidebarContent />
      </div>

      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-3.5 left-4 z-40 p-2 rounded-xl transition-all border"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
        aria-label="Buka menu"
      >
        <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      {/* Mobile Drawer */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex"
          onClick={() => setIsOpen(false)}
        >
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/50 dark:bg-black/60 backdrop-blur-sm" />

          {/* Drawer */}
          <div
            className="relative z-50 flex flex-col h-full shadow-2xl animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <div className="flex items-center justify-end px-4 pt-4 pb-2 border-b"
              style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--border-default)' }}>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-card-hover)]"
                aria-label="Tutup menu"
              >
                <svg className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <SidebarContent isMobile={true} />
          </div>
        </div>
      )}
    </>
  );
}
