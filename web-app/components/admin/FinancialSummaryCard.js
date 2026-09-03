'use client';

import { DollarSign, CheckCircle2, AlertCircle, XCircle, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { formatIDR } from '@/lib/utils';

export default function FinancialSummaryCard({ stats = {} }) {
  const cntSettled = stats.trxStatusCounts?.settlement || 0;
  const cntExpired = stats.trxStatusCounts?.expired || 0;
  const cntCancelled = stats.trxStatusCounts?.cancelled || 0;
  const totalInvoices = cntSettled + cntExpired + cntCancelled;
  const conversionRate = totalInvoices > 0 ? Math.round((cntSettled / totalInvoices) * 100) : 0;

  return (
    <div className="p-5 rounded-2xl border bg-card border-[var(--border-default)] shadow-sm space-y-4 flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-primary flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-emerald-500" />
            Status Tagihan &amp; Konversi Midtrans
          </h2>
          <p className="text-xs text-muted mt-0.5">Efektivitas alur checkout pembayaran sandbox</p>
        </div>
        <Link href="/admin/transactions" className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline">
          Manajemen Transaksi →
        </Link>
      </div>

      {/* 3 Status Bento Cards */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-center">
          <div className="flex items-center justify-center gap-1 text-[11px] text-muted font-medium">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            Settlement
          </div>
          <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {formatIDR(stats.totalRevenue || 0)}
          </p>
          <p className="text-[10px] text-muted mt-0.5">{cntSettled} Transaksi</p>
        </div>

        <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/15 text-center">
          <div className="flex items-center justify-center gap-1 text-[11px] text-muted font-medium">
            <AlertCircle className="w-3 h-3 text-amber-500" />
            Expired
          </div>
          <p className="text-sm font-extrabold text-amber-500 mt-1">{cntExpired} Tagihan</p>
          <p className="text-[10px] text-muted mt-0.5">Batas bayar habis</p>
        </div>

        <div className="p-3 rounded-xl bg-slate-500/5 border border-slate-500/15 text-center">
          <div className="flex items-center justify-center gap-1 text-[11px] text-muted font-medium">
            <XCircle className="w-3 h-3 text-slate-400" />
            Dibatalkan
          </div>
          <p className="text-sm font-extrabold text-slate-500 dark:text-slate-300 mt-1">{cntCancelled} Tagihan</p>
          <p className="text-[10px] text-muted mt-0.5">Dibatalkan user</p>
        </div>
      </div>

      {/* Conversion Rate Segmented Progress Bar */}
      <div className="space-y-2 p-3 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-default)]">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-secondary flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            Tingkat Sukses Pembayaran
          </span>
          <strong className="text-emerald-500 font-bold">{conversionRate}% Sukses</strong>
        </div>

        <div className="h-2 rounded-full overflow-hidden flex bg-slate-200 dark:bg-slate-800">
          <div
            style={{ width: totalInvoices > 0 ? `${(cntSettled / totalInvoices) * 100}%` : '0%' }}
            className="bg-emerald-500 transition-all duration-500"
            title={`Settlement: ${cntSettled}`}
          />
          <div
            style={{ width: totalInvoices > 0 ? `${(cntExpired / totalInvoices) * 100}%` : '0%' }}
            className="bg-amber-500 transition-all duration-500"
            title={`Expired: ${cntExpired}`}
          />
          <div
            style={{ width: totalInvoices > 0 ? `${(cntCancelled / totalInvoices) * 100}%` : '0%' }}
            className="bg-slate-400 transition-all duration-500"
            title={`Cancelled: ${cntCancelled}`}
          />
        </div>
      </div>
    </div>
  );
}
