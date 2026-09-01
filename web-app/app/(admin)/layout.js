'use client';

import AdminSidebar from '@/components/AdminSidebar';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { SidebarProvider } from '@/contexts/SidebarContext';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';
import { User, LogOut, ArrowLeftRight } from 'lucide-react';
import Footer from '@/components/Footer';

export default function AdminLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Protect client side
  useEffect(() => {
    if (status === 'unauthenticated' || session?.error === 'RefreshAccessTokenError') {
      router.replace('/login');
    } else if (status === 'authenticated') {
      const role = session?.user?.role || 'user';
      if (role !== 'admin' && role !== 'superadmin') {
        router.replace('/dashboard?error=unauthorized');
      }
      if (session?.user?.isActive === false) {
        router.replace('/login?error=suspended');
      }
    }
  }, [status, session, router]);

  // If unauthenticated or unauthorized role after verification
  const role = session?.user?.role || 'user';
  if (status === 'unauthenticated' || (status === 'authenticated' && role !== 'admin' && role !== 'superadmin')) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-page)' }}>
        <AdminSidebar />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top Header Bar */}
          <header
            className="h-14 backdrop-blur-xl flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30 border-b"
            style={{
              background: 'var(--bg-header)',
              borderColor: 'var(--border-default)',
            }}
          >
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 lg:hidden" />
              <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                Mode Administrator ({session?.user?.role ? session.user.role.toUpperCase() : 'ADMIN'})
              </div>
            </div>

            <div className="flex items-center gap-2 lg:gap-3">
              {/* Return to user mode */}
              <Link
                href="/dashboard"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors text-secondary"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>Panel Kreator</span>
              </Link>

              <div className="hidden sm:block w-px h-5" style={{ background: 'var(--border-default)' }} />

              {/* User Name */}
              <div className="text-right hidden sm:block">
                <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {session?.user?.name || 'Administrator'}
                </p>
                <p className="text-[10px] text-rose-500 capitalize">{session?.user?.role || 'Admin'}</p>
              </div>

              {/* Avatar Dropdown Wrapper */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center focus:outline-none cursor-pointer"
                  aria-label="Menu Profil Admin"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      session?.user?.image ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(session?.user?.name || 'Admin')}&background=f43f5e&color=fff&size=32`
                    }
                    alt="avatar"
                    className="w-8 h-8 rounded-full flex-shrink-0 ring-2 hover:opacity-95 transition-opacity ring-rose-500/50"
                    loading="lazy"
                  />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 top-9 mt-1 w-64 bg-card rounded-xl border border-[var(--border-default)] shadow-2xl p-4 z-50 animate-fade-in text-left">
                    <div className="flex items-center gap-3 pb-3 border-b border-[var(--border-default)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={
                          session?.user?.image ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(session?.user?.name || 'Admin')}&background=f43f5e&color=fff&size=32`
                        }
                        alt="avatar"
                        className="w-10 h-10 rounded-full border border-rose-500/20 object-cover flex-shrink-0"
                        loading="lazy"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-primary truncate">
                          {session?.user?.name || 'Administrator'}
                        </p>
                        <p className="text-[10px] text-muted truncate">{session?.user?.email}</p>
                      </div>
                    </div>

                    <div className="py-2 space-y-1">
                      <Link
                        href="/dashboard"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-secondary hover:text-primary hover:bg-rose-500/5 transition-all"
                      >
                        <ArrowLeftRight className="w-4 h-4 text-muted flex-shrink-0" />
                        <span>Panel Kreator</span>
                      </Link>

                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          setShowLogoutConfirm(true);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/5 transition-all text-left cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-rose-500 flex-shrink-0" />
                        <span>Keluar</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 p-4 lg:p-6 overflow-y-auto flex flex-col" style={{ background: 'var(--bg-page)' }}>
            <div className="flex-1">
              {children}
            </div>
            <Footer variant="dashboard" />
          </main>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          toast.success('Berhasil keluar. Mengalihkan ke halaman login...');
          setTimeout(() => {
            signOut({ callbackUrl: '/login' });
          }, 1200);
        }}
        title="Keluar Sesi Admin"
        description="Apakah Anda yakin ingin keluar dari Athena Shield? Anda perlu masuk kembali sebagai admin untuk mengakses panel kendali ini."
        confirmText="Keluar"
        variant="danger"
      />
    </SidebarProvider>
  );
}
