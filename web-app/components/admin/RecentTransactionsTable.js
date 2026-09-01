'use client';

import { CreditCard } from 'lucide-react';
import { formatIDR } from '@/lib/utils';

export default function RecentTransactionsTable({ 
  recentTransactions = [], 
  stats = {} 
}) {
  return (
    <div className="p-5 rounded-2xl border bg-card border-[var(--border-default)] shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-primary flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-emerald-500" />
            Log Transaksi Pembayaran Terbaru
          </h2>
          <p className="text-xs text-muted mt-0.5">Status tagihan Midtrans Sandbox terkini</p>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">
          {stats.trxStatusCounts?.settlement || 0} Settlement
        </span>
      </div>

      <div className="divide-y divide-[var(--border-default)] overflow-y-auto max-h-[280px]">
        {recentTransactions.slice(0, 6).map((trx, idx) => {
          const isSettled = trx.status === 'settlement';
          const isExpired = trx.status === 'expired';
          return (
            <div key={trx.id || idx} className="py-3 flex items-center justify-between first:pt-0 last:pb-0 text-xs">
              <div className="min-w-0 pr-3">
                <p className="font-semibold text-primary truncate">{trx.user_email}</p>
                <p className="text-xs text-muted mt-0.5">
                  {trx.id.substring(0, 24)}... • {trx.created_at ? new Date(trx.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'}
                </p>
              </div>
              <div className="text-right flex-shrink-0 space-y-0.5">
                <p className={`font-bold ${isSettled ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted'}`}>
                  {formatIDR(trx.amount || 0)}
                </p>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block ${
                  isSettled ? 'bg-emerald-500/10 text-emerald-500' :
                  isExpired ? 'bg-amber-500/10 text-amber-500' :
                  'bg-slate-500/10 text-slate-400'
                }`}>
                  {isSettled ? 'Settlement' : isExpired ? 'Expired' : trx.status}
                </span>
              </div>
            </div>
          );
        })}
        {recentTransactions.length === 0 && (
          <p className="text-xs text-muted text-center py-6">Belum ada transaksi tercatat.</p>
        )}
      </div>
    </div>
  );
}
