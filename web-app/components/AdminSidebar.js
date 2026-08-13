'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useSidebar } from '@/contexts/SidebarContext';
import { 
  LayoutDashboard, 
  Users, 
  History, 
  ShieldAlert, 
  ChevronLeft, 
  Menu, 
  Settings,
  HelpCircle,
  LogOut,
  CreditCard
} from 'lucide-react';

export default function AdminSidebar() {
  const pathname = usePathname();
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

  // Handle clicking outside control panel
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

  const navLinks = [
    {
      name: 'Ikhtisar',
      href: '/admin',
      icon: <LayoutDashboard className="w-5 h-5 flex-shrink-0" />,
    },
    {
      name: 'Manajemen Pengguna',
      href: '/admin/users',
      icon: <Users className="w-5 h-5 flex-shrink-0" />,
    },
    {
      name: 'Moderasi Global',
      href: '/admin/moderation',
      icon: <History className="w-5 h-5 flex-shrink-0" />,
    },
    {
      name: 'Paket dan Harga',
      href: '/admin/plans',
      icon: <CreditCard className="w-5 h-5 flex-shrink-0" />,
    },
    {
      name: 'Log Audit Admin',
      href: '/admin/audit',
      icon: <ShieldAlert className="w-5 h-5 flex-shrink-0" />,
    },
  ];

  const AdminSidebarContent = ({ isMobile = false }) => {
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
        {/* Logo & Brand */}
        <div className={`py-5 flex items-center transition-all duration-300 ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-5'}`}>
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 rounded-full bg-rose-500/25 blur-md" />
            <div className="w-9 h-9 rounded-xl bg-rose-600 dark:bg-rose-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
              A
            </div>
          </div>
          <div className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto ml-1'}`}>
            <p className="text-sm font-semibold leading-none tracking-tight text-rose-600 dark:text-rose-400">
              Athena Shield
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Admin Panel Dashboard</p>
          </div>
        </div>

        {/* Divider */}
        <div className={`h-px transition-all duration-300 ${isCollapsed ? 'mx-3' : 'mx-5'}`} style={{ background: 'var(--border-default)' }} />

        {/* Section Label */}
        <p className={`px-5 pt-4 pb-1.5 text-[10px] font-semibold uppercase tracking-widest transition-all duration-300 overflow-hidden whitespace-nowrap ${isCollapsed ? 'opacity-0 h-0 py-0 overflow-hidden' : 'opacity-100'}`} style={{ color: 'var(--text-muted)' }}>
          ADMIN MENU
        </p>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 space-y-0.5">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center rounded-xl text-[13px] font-medium transition-all duration-200 group relative border ${isCollapsed ? 'justify-center p-2.5 mx-2 w-10 h-10' : 'gap-3 px-3 py-2.5 mx-0'
                  } ${isActive
                    ? 'bg-rose-50 border-rose-100 text-rose-600 dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-300'
                    : 'border-transparent hover:bg-rose-50/50 hover:border-rose-100/50 dark:hover:bg-rose-500/5 dark:hover:border-rose-500/10'
                  }`}
                style={!isActive ? { color: 'var(--text-secondary)' } : {}}
              >
                <span
                  className={`flex-shrink-0 flex items-center justify-center ${isActive ? 'text-rose-600 dark:text-rose-400' : ''}`}
                  style={!isActive ? { color: 'var(--text-muted)' } : {}}
                >
                  {link.icon}
                </span>
                <span className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto ml-1'}`}>
                  {link.name}
                </span>
                {isActive && !isCollapsed && (
                  <span className="absolute right-3 w-1 h-1 rounded-full bg-rose-600 dark:bg-rose-400" />
                )}
                {isCollapsed && (
                  <div className="absolute left-16 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 z-50 bg-slate-900 dark:bg-slate-800 text-slate-100 text-xs rounded-lg py-1.5 px-3 shadow-xl whitespace-nowrap border border-slate-700/50 pointer-events-none">
                    {link.name}
                  </div>
                )}
              </Link>
            );
          })}

          <div className="py-2">
            <div className="h-px bg-[var(--border-default)] my-2" />
          </div>

          {/* Return button */}
          <Link
            href="/dashboard"
            className={`flex items-center rounded-xl text-[13px] font-medium transition-all duration-200 group relative border border-transparent hover:bg-indigo-50/50 hover:border-indigo-100/50 dark:hover:bg-indigo-500/5 dark:hover:border-indigo-500/10 ${isCollapsed ? 'justify-center p-2.5 mx-2 w-10 h-10' : 'gap-3 px-3 py-2.5 mx-0'}`}
            style={{ color: 'var(--text-secondary)' }}
          >
            <span className="flex-shrink-0 flex items-center justify-center text-indigo-500 dark:text-indigo-400">
              <LogOut className="w-5 h-5 rotate-180" />
            </span>
            <span className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto ml-1'}`}>
              Kembali Ke User Panel
            </span>
            {isCollapsed && (
              <div className="absolute left-16 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 z-50 bg-slate-900 dark:bg-slate-800 text-slate-100 text-xs rounded-lg py-1.5 px-3 shadow-xl whitespace-nowrap border border-slate-700/50 pointer-events-none">
                Kembali Ke User Panel
              </div>
            )}
          </Link>
        </nav>

        {/* Bottom Section */}
        <div className="px-3 pb-5 mt-auto space-y-2.5">
          <div className="mx-2 h-px" style={{ background: 'var(--border-default)' }} />

          {/* Sidebar Control Popover and Trigger */}
          <div className="relative" ref={popoverRef}>
            <button
              onClick={() => setShowControlPanel(!showControlPanel)}
              className={`flex items-center gap-3 p-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 border cursor-pointer group relative ${showControlPanel
                ? 'bg-rose-50 border-rose-100 text-rose-600 dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-300'
                : 'border-transparent hover:bg-rose-50/50 hover:border-rose-100/50 dark:hover:bg-rose-500/5 dark:hover:bg-rose-500/10'
                } ${isCollapsed ? 'justify-center w-10 h-10 mx-2' : 'w-full'}`}
              style={{ color: 'var(--text-secondary)' }}
              aria-label="Kontrol Sidebar Admin"
            >
              <span className="flex-shrink-0 flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
                <Settings className="w-5 h-5" />
              </span>
              {!isCollapsed && <span>Kontrol Sidebar</span>}
              {isCollapsed && !showControlPanel && (
                <div className="absolute left-16 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 z-50 bg-slate-900 dark:bg-slate-800 text-slate-100 text-xs rounded-lg py-1.5 px-3 shadow-xl whitespace-nowrap border border-slate-700/50 pointer-events-none">
                  Kontrol Sidebar
                </div>
              )}
            </button>

            {showControlPanel && (
              <div
                className={`absolute bottom-12 rounded-xl border p-2 shadow-2xl backdrop-blur-xl animate-fade-in z-50 flex flex-col gap-0.5 w-[200px] ${isCollapsed ? 'left-14' : 'left-0 right-0'
                  } bg-white/95 border-slate-200 text-slate-800 dark:bg-slate-950/95 dark:border-slate-800 dark:text-slate-100`}
              >
                <div className="px-3 py-1.5 border-b mb-1 border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-500">
                    Sidebar control
                  </p>
                </div>

                <button
                  onClick={() => {
                    setSidebarMode('expanded');
                    setShowControlPanel(false);
                  }}
                  className="flex items-center justify-between w-full px-3 py-1.5 text-[12px] rounded-lg transition-colors cursor-pointer text-left hover:bg-slate-100 dark:hover:bg-slate-800/60"
                >
                  <span className={sidebarMode === 'expanded' ? 'text-rose-600 dark:text-rose-400 font-medium' : 'text-slate-600 dark:text-slate-400'}>
                    Expanded
                  </span>
                  {sidebarMode === 'expanded' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600 dark:bg-rose-400" />
                  )}
                </button>

                <button
                  onClick={() => {
                    setSidebarMode('collapsed');
                    setShowControlPanel(false);
                  }}
                  className="flex items-center justify-between w-full px-3 py-1.5 text-[12px] rounded-lg transition-colors cursor-pointer text-left hover:bg-slate-100 dark:hover:bg-slate-800/60"
                >
                  <span className={sidebarMode === 'collapsed' ? 'text-rose-600 dark:text-rose-400 font-medium' : 'text-slate-600 dark:text-slate-400'}>
                    Collapsed
                  </span>
                  {sidebarMode === 'collapsed' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600 dark:bg-rose-400" />
                  )}
                </button>

                <button
                  onClick={() => {
                    setSidebarMode('hover');
                    setShowControlPanel(false);
                  }}
                  className="flex items-center justify-between w-full px-3 py-1.5 text-[12px] rounded-lg transition-colors cursor-pointer text-left hover:bg-slate-100 dark:hover:bg-slate-800/60"
                >
                  <span className={sidebarMode === 'hover' ? 'text-rose-600 dark:text-rose-400 font-medium' : 'text-slate-600 dark:text-slate-400'}>
                    Expand on hover
                  </span>
                  {sidebarMode === 'hover' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600 dark:bg-rose-400" />
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
      <div
        className={desktopWrapperClass}
        onMouseEnter={() => { if (sidebarMode === 'hover') setIsHovered(true); }}
        onMouseLeave={() => { if (sidebarMode === 'hover') setIsHovered(false); }}
      >
        <AdminSidebarContent />
      </div>

      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-3.5 left-4 z-40 p-2 rounded-xl transition-all border"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
        aria-label="Buka menu admin"
      >
        <Menu className="w-5 h-5 text-muted" />
      </button>

      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex"
          onClick={() => setIsOpen(false)}
        >
          <div className="fixed inset-0 bg-black/50 dark:bg-black/60 backdrop-blur-sm" />

          <div
            className="relative z-50 flex flex-col h-full shadow-2xl animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-end px-4 pt-4 pb-2 border-b"
              style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--border-default)' }}>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-card-hover)] text-secondary"
                aria-label="Tutup menu admin"
              >
                ✕
              </button>
            </div>
            <AdminSidebarContent isMobile={true} />
          </div>
        </div>
      )}
    </>
  );
}
