'use client';

import { Users } from 'lucide-react';
import Link from 'next/link';

export default function NewUsersTable({ newestUsers = [] }) {
  return (
    <div className="p-5 rounded-2xl border bg-card border-[var(--border-default)] shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-primary flex items-center gap-1.5">
            <Users className="w-4 h-4 text-indigo-500" />
            Kreator Baru Bergabung
          </h2>
          <p className="text-xs text-muted mt-0.5">Daftar pengguna terbaru yang terdaftar di sistem</p>
        </div>
        <Link href="/admin/users" className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
          Kelola Pengguna →
        </Link>
      </div>

      <div className="divide-y divide-[var(--border-default)] overflow-y-auto max-h-[280px]">
        {newestUsers.map((user, idx) => (
          <div key={user.email || idx} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
            <div className="min-w-0 pr-3">
              <p className="text-xs font-bold text-primary truncate" title={user.email}>
                {user.email}
              </p>
              <p className="text-xs text-muted mt-0.5">
                {user.created_at ? new Date(user.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                user.tier === 'FREE' ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' :
                user.tier === 'PRO' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300' :
                'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300'
              }`}>
                {user.tier}
              </span>
            </div>
          </div>
        ))}
        {newestUsers.length === 0 && (
          <p className="text-xs text-muted text-center py-6">Belum ada user terdaftar.</p>
        )}
      </div>
    </div>
  );
}
