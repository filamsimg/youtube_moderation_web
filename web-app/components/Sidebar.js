'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import QuotaIndicator from '@/components/QuotaIndicator';
import { useSidebar } from '@/contexts/SidebarContext';

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { sidebarMode, setSidebarMode, isHovered, setIsHovered } = useSidebar();

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

  const navLinks = [
    {
      name: 'Beranda',
      href: '/dashboard',
      icon: (
        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      ),
    },
    {
      name: 'Antrian Moderasi',
      href: '/comments',
      icon: (
        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      ),
    },
    {
      name: 'Riwayat',
      href: '/riwayat',
      icon: (
        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      name: 'Preferensi',
      href: '/preferensi',
      icon: (
        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      name: 'Paket & Kuota',
      href: '/pricing',
      icon: (
        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
        </svg>
      ),
    },
  ];

  const SidebarContent = ({ isMobile = false }) => {
    const isSidebarCollapsed = !isMobile && (sidebarMode === 'collapsed' || (sidebarMode === 'hover' && !isHovered));

    // Dynamic width class and hover events
    let widthClass = 'w-[240px]';
    let hoverProps = {};

    if (!isMobile) {
      if (sidebarMode === 'collapsed') {
        widthClass = 'w-[72px]';
      } else if (sidebarMode === 'hover') {
        widthClass = isHovered ? 'w-[240px] shadow-2xl z-50' : 'w-[72px]';
        hoverProps = {
          onMouseEnter: () => setIsHovered(true),
          onMouseLeave: () => {
            setIsHovered(false);
            setIsDropdownOpen(false); // Close dropdown if kursor leaves sidebar
          },
        };
      }
    }

    return (
      <aside
        className={`flex flex-col h-full overflow-y-auto overflow-x-hidden border-r transition-all duration-300 ease-in-out ${widthClass} ${!isMobile ? 'absolute left-0 top-0 z-30' : 'relative'}`}
        style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--border-default)' }}
        {...hoverProps}
      >
        {/* ── Logo & Brand ─────────────────────────────────────── */}
        <div className={`py-5 flex items-center transition-all duration-300 ${isSidebarCollapsed ? 'px-4 justify-center' : 'px-5 gap-3'}`}>
          <div className="relative flex-shrink-0">
            {/* Glow behind logo */}
            <div className="absolute inset-0 rounded-full bg-indigo-500/25 blur-md" />
            <img
              src="/logo.webp"
              alt="Athena Shield"
              className="relative w-9 h-9 object-contain drop-shadow-lg"
            />
          </div>
          {!isSidebarCollapsed && (
            <div className="animate-fade-in whitespace-nowrap">
              <p className="text-sm font-semibold leading-none tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Athena Shield
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Moderasi AI</p>
            </div>
          )}
        </div>

        {/* ── Divider ──────────────────────────────────────────── */}
        <div className={`${isSidebarCollapsed ? 'mx-3' : 'mx-5'} h-px transition-all duration-300`} style={{ background: 'var(--border-default)' }} />

        {/* ── Section label ────────────────────────────────────── */}
        <p className={`pt-4 pb-1.5 text-[10px] font-semibold uppercase tracking-widest transition-all duration-300 ${
          isSidebarCollapsed ? 'opacity-0 overflow-hidden h-0 pt-0 pb-0' : 'px-5'
        }`} style={{ color: 'var(--text-muted)' }}>
          Navigasi
        </p>

        {/* ── Navigation Links ─────────────────────────────────── */}
        <nav className="flex-1 px-3 space-y-0.5">
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href ||
              (pathname === '/' && link.href === '/dashboard');
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 group relative border ${
                  isActive
                    ? 'bg-indigo-50 border-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:border-indigo-500/30 dark:text-indigo-300'
                    : 'border-transparent hover:bg-indigo-50/50 hover:border-indigo-100/50 dark:hover:bg-indigo-500/5 dark:hover:border-indigo-500/10'
                }`}
                style={!isActive ? { color: 'var(--text-secondary)' } : {}}
              >
                <span
                  className={isActive ? 'text-indigo-600 dark:text-indigo-400 flex-shrink-0' : 'flex-shrink-0'}
                  style={!isActive ? { color: 'var(--text-muted)' } : {}}
                >
                  {link.icon}
                </span>
                
                {!isSidebarCollapsed && (
                  <span className="whitespace-nowrap animate-fade-in">{link.name}</span>
                )}

                {link.badge && !isSidebarCollapsed && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-amber-500 badge-pulse shadow-[0_0_6px_rgba(245,158,11,0.7)]" />
                )}

                {/* Active indicator line */}
                {isActive && !isSidebarCollapsed && (
                  <span className="absolute right-3 w-1 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                )}

                {/* CSS Tooltip when collapsed */}
                {isSidebarCollapsed && (
                  <div className="absolute left-16 z-50 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0 bg-neutral-900 border border-neutral-800 text-neutral-100 text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap pointer-events-none shadow-xl">
                    {link.name}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* ── Bottom Section ───────────────────────────────────── */}
        <div className="px-3 pb-5 mt-4 space-y-3 relative">
          <div className={`${isSidebarCollapsed ? 'mx-1' : 'mx-2'} h-px transition-all duration-300`} style={{ background: 'var(--border-default)' }} />

          {/* Quota Indicator */}
          {!isSidebarCollapsed && (
            <div className="animate-fade-in">
              <QuotaIndicator />
            </div>
          )}

          {/* Online Status */}
          <div className={`flex items-center gap-2 group/online relative ${isSidebarCollapsed ? 'px-0 justify-center' : 'px-3'}`}>
            <span className="dot-online" />
            {!isSidebarCollapsed && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium whitespace-nowrap animate-fade-in">Model API Terhubung</span>
            )}
            
            {isSidebarCollapsed && (
              <div className="absolute left-16 z-50 invisible group-hover/online:visible opacity-0 group-hover/online:opacity-100 transition-all duration-200 translate-x-2 group-hover/online:translate-x-0 bg-neutral-900 border border-neutral-800 text-neutral-100 text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap pointer-events-none shadow-xl">
                Model API Terhubung
              </div>
            )}
          </div>

          {/* Sidebar Control Popover (Supabase Inspired) */}
          <div className="relative group/control">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`flex items-center justify-center rounded-xl transition-all border ${
                isDropdownOpen 
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-500/20 dark:border-indigo-500/40 dark:text-indigo-300' 
                  : 'border-transparent hover:bg-indigo-50/50 hover:border-indigo-100/50 dark:hover:bg-indigo-500/5 dark:hover:border-indigo-500/10'
              } ${isSidebarCollapsed ? 'w-10 h-10 mx-auto' : 'w-full gap-2 px-3 py-2'}`}
              style={{ color: 'var(--text-secondary)' }}
            >
              {/* Layout Split Icon */}
              <svg className="w-4.5 h-4.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-12-3h18M3 5.25h18A2.25 2.25 0 0121.75 7.5v9a2.25 2.25 0 01-2.25 2.25H4.25A2.25 2.25 0 012 16.5v-9a2.25 2.25 0 012.25-2.25z" />
              </svg>
              {!isSidebarCollapsed && <span className="text-[13px] font-medium whitespace-nowrap animate-fade-in">Kontrol Sidebar</span>}
              
              {isSidebarCollapsed && (
                <div className="absolute left-16 z-50 invisible group-hover/control:visible opacity-0 group-hover/control:opacity-100 transition-all duration-200 translate-x-2 group-hover/control:translate-x-0 bg-neutral-900 border border-neutral-800 text-neutral-100 text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap pointer-events-none shadow-xl">
                  Kontrol Sidebar
                </div>
              )}
            </button>

            {/* Float Dropdown Popover */}
            {isDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsDropdownOpen(false)} />
                <div className="absolute bottom-12 left-0 z-50 w-56 rounded-xl border p-2 shadow-2xl backdrop-blur-xl animate-fade-in bg-slate-950/90 dark:bg-slate-950/95 border-neutral-800 text-left">
                  <div className="px-3 py-1.5 border-b border-neutral-800/60 mb-1">
                    <p className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase">
                      Sidebar control
                    </p>
                  </div>
                  {[
                    { id: 'expanded', label: 'Expanded' },
                    { id: 'collapsed', label: 'Collapsed' },
                    { id: 'hover', label: 'Expand on hover' }
                  ].map((option) => {
                    const isSelected = sidebarMode === option.id;
                    return (
                      <button
                        key={option.id}
                        onClick={() => {
                          setSidebarMode(option.id);
                          setIsDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all text-neutral-300 hover:text-white hover:bg-neutral-800/60"
                      >
                        <span className="w-3.5 h-3.5 flex items-center justify-center flex-shrink-0">
                          {isSelected && (
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          )}
                        </span>
                        <span>{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* User Info */}
          {session?.user && (
            <div
              className={`flex items-center rounded-xl transition-colors cursor-default hover:bg-[var(--bg-card-hover)] group/user relative ${
                isSidebarCollapsed ? 'p-1.5 justify-center' : 'gap-2.5 px-3 py-2'
              }`}
            >
              <img
                src={session.user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user.name || 'User')}&background=6366f1&color=fff&size=32`}
                alt="avatar"
                className="w-7 h-7 rounded-full border border-indigo-500/40 flex-shrink-0"
              />
              {!isSidebarCollapsed && (
                <div className="min-w-0 animate-fade-in">
                  <p className="text-[12px] truncate font-medium leading-tight" style={{ color: 'var(--text-secondary)' }}>
                    {session.user.name}
                  </p>
                  <p className="text-[10px] truncate leading-tight" style={{ color: 'var(--text-muted)' }}>
                    {session.user.email}
                  </p>
                </div>
              )}
              
              {isSidebarCollapsed && (
                <div className="absolute left-16 z-50 invisible group-hover/user:visible opacity-0 group-hover/user:opacity-100 transition-all duration-200 translate-x-2 group-hover/user:translate-x-0 bg-neutral-900 border border-neutral-800 text-neutral-100 text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap pointer-events-none shadow-xl">
                  <p className="font-semibold text-white">{session.user.name}</p>
                  <p className="text-[10px] text-neutral-400">{session.user.email}</p>
                </div>
              )}
            </div>
          )}

          {/* Sign Out */}
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className={`btn-danger w-full text-[13px] flex items-center justify-center group relative ${isSidebarCollapsed ? 'px-0 h-10' : 'gap-2 px-3 py-2'}`}
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
            {!isSidebarCollapsed && <span className="whitespace-nowrap animate-fade-in">Keluar</span>}
            
            {isSidebarCollapsed && (
              <div className="absolute left-16 z-50 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0 bg-neutral-900 border border-neutral-800 text-neutral-100 text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap pointer-events-none shadow-xl">
                Keluar
              </div>
            )}
          </button>
        </div>
      </aside>
    );
  };

  const desktopWidthClass = sidebarMode === 'expanded' ? 'lg:w-[240px]' : 'lg:w-[72px]';

  return (
    <>
      {/* Desktop Sidebar — always visible */}
      <div className={`hidden lg:block lg:h-screen lg:sticky lg:top-0 transition-all duration-300 ${desktopWidthClass} relative z-30`}>
        <SidebarContent isMobile={false} />
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
