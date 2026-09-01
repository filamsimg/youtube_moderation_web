'use client';

import { useState } from 'react';
import { CreditCard, Calendar, ChevronDown } from 'lucide-react';
import { formatIDR } from '@/lib/utils';

// Algoritma Bézier Spline untuk Kurva Ombak Halus (AdminLTE / Smooth Wave Area)
function getSvgSplinePath(points) {
  if (!points || points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    // Catmull-Rom to Cubic Bézier conversion
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return path;
}

export default function RevenueStackedBarChart({ 
  recentTransactions = []
}) {
  // Cek apakah ada transaksi settlement dalam 30 hari terakhir. Jika transaksi terjadi lebih dari 30 hari lalu (cth: Juli), default otomatis ke 'all' agar datanya langsung muncul!
  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const hasRecent = recentTransactions.some(
      t => t.status === 'settlement' && t.created_at && new Date(t.created_at) >= thirtyDaysAgo
    );
    return hasRecent ? '30' : 'all';
  });
  const [hoveredRevenueIdx, setHoveredRevenueIdx] = useState(null);

  // Kalkulasi Dinamis Tren Omzet Finansial (PRO vs ENTERPRISE) per Periode Tanggal
  const dynamicRevenueTrend = (() => {
    const trendObj = {};
    const now = new Date();
    
    let daysCount = 30;
    if (selectedPeriod === '7') daysCount = 7;
    else if (selectedPeriod === '14') daysCount = 14;
    else if (selectedPeriod === '30') daysCount = 30;
    else if (selectedPeriod === '90') daysCount = 90;
    else if (selectedPeriod === 'all') {
      let oldestDate = new Date(now);
      recentTransactions.forEach((t) => {
        if (t.created_at && t.status === 'settlement') {
          const d = new Date(t.created_at);
          if (d < oldestDate) oldestDate = d;
        }
      });
      const diffTime = Math.abs(now - oldestDate);
      daysCount = Math.max(7, Math.min(365, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1));
    }

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      trendObj[dateKey] = { date: dateKey, pro: 0, enterprise: 0, total: 0, count: 0 };
    }

    recentTransactions.forEach((trx) => {
      if (trx.status === 'settlement' && trx.created_at) {
        const trxDate = new Date(trx.created_at).toISOString().split('T')[0];
        if (trendObj[trxDate]) {
          const amount = Number(trx.amount) || 0;
          const isPro = trx.target_tier === 'PRO' || (trx.package_id && trx.package_id.startsWith('PRO'));
          if (isPro) {
            trendObj[trxDate].pro += amount;
          } else {
            trendObj[trxDate].enterprise += amount;
          }
          trendObj[trxDate].total += amount;
          trendObj[trxDate].count += 1;
        }
      }
    });

    return Object.values(trendObj);
  })();

  const totalRevenueInPeriod = dynamicRevenueTrend.reduce((acc, curr) => acc + curr.total, 0);

  // Scaling untuk grafik SVG kurva omzet spline
  const maxRevenueVal = Math.max(...dynamicRevenueTrend.map(t => Math.max(t.pro, t.enterprise, t.total)), 100000);
  const width = 640;
  const height = 190;
  const paddingLeft = 45;
  const paddingRight = 18;
  const paddingTop = 20;
  const paddingBottom = 26;
  const graphWidth = width - paddingLeft - paddingRight;
  const graphHeight = height - paddingTop - paddingBottom;
  
  const proPoints = [];
  const entPoints = [];

  if (dynamicRevenueTrend.length > 0) {
    dynamicRevenueTrend.forEach((t, index) => {
      const x = dynamicRevenueTrend.length === 1 
        ? paddingLeft + graphWidth / 2 
        : paddingLeft + (index / (dynamicRevenueTrend.length - 1)) * graphWidth;
      const yPro = height - paddingBottom - (t.pro / maxRevenueVal) * graphHeight;
      const yEnt = height - paddingBottom - (t.enterprise / maxRevenueVal) * graphHeight;

      proPoints.push({ x, y: yPro, amount: t.pro, total: t.total, date: t.date });
      entPoints.push({ x, y: yEnt, amount: t.enterprise, total: t.total, date: t.date });
    });
  }

  const proSpline = getSvgSplinePath(proPoints);
  const entSpline = getSvgSplinePath(entPoints);

  const bottomY = height - paddingBottom;
  const startX = proPoints[0]?.x || paddingLeft;
  const endX = proPoints[proPoints.length - 1]?.x || (width - paddingRight);

  const proAreaPath = proPoints.length > 0 ? `${proSpline} L ${endX} ${bottomY} L ${startX} ${bottomY} Z` : '';
  const entAreaPath = entPoints.length > 0 ? `${entSpline} L ${endX} ${bottomY} L ${startX} ${bottomY} Z` : '';

  return (
    <div className="p-5 rounded-2xl border bg-card border-[var(--border-default)] shadow-sm space-y-3 flex flex-col justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-primary flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-emerald-500" />
              Tren Penjualan &amp; Omzet Midtrans
            </h2>
          </div>
          {/* Legend Subtitle */}
          <div className="flex items-center gap-3 text-xs mt-1">
            <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm" />
              Paket PRO
            </span>
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
              Paket ENTERPRISE
            </span>
          </div>
        </div>

        {/* Clean Period Selector Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold whitespace-nowrap">
            +{formatIDR(totalRevenueInPeriod)}
          </span>
          <div className="relative">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="appearance-none bg-[var(--bg-card-hover)] border border-[var(--border-default)] text-primary text-xs font-semibold rounded-xl pl-8 pr-8 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer shadow-sm hover:border-emerald-500/40 transition-colors"
            >
              <option value="7">7 Hari Terakhir</option>
              <option value="14">14 Hari Terakhir</option>
              <option value="30">30 Hari Terakhir</option>
              <option value="90">3 Bulan Terakhir</option>
              <option value="all">Semua Waktu</option>
            </select>
            <Calendar className="w-3.5 h-3.5 text-emerald-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <ChevronDown className="w-3.5 h-3.5 text-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* SVG Smooth Multi-Series Area Chart (Revenue Spline Wave) */}
      <div className="w-full overflow-x-auto pt-1 relative">
        <div className="min-w-[480px] flex flex-col justify-center">
          <svg 
            className="w-full h-[180px]" 
            viewBox={`0 0 ${width} ${height}`}
            onMouseLeave={() => setHoveredRevenueIdx(null)}
          >
            <defs>
              {/* Indigo Gradient for PRO Series */}
              <linearGradient id="gradPro" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
              </linearGradient>
              {/* Emerald Gradient for ENTERPRISE Series */}
              <linearGradient id="gradEnterprise" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.03" />
              </linearGradient>
            </defs>

            {/* Y-Axis Gridlines */}
            {[
              { y: paddingTop, label: maxRevenueVal >= 1000000 ? `${(maxRevenueVal / 1000000).toFixed(1)}jt` : `${Math.round(maxRevenueVal / 1000)}k` },
              { y: paddingTop + graphHeight / 2, label: maxRevenueVal >= 1000000 ? `${(maxRevenueVal / 2000000).toFixed(1)}jt` : `${Math.round(maxRevenueVal / 2000)}k` },
              { y: height - paddingBottom, label: 'Rp 0' },
            ].map((grid, idx) => (
              <g key={idx}>
                <line
                  x1={paddingLeft}
                  y1={grid.y}
                  x2={width - paddingRight}
                  y2={grid.y}
                  stroke="var(--border-default)"
                  strokeWidth={idx === 2 ? "1" : "0.5"}
                  strokeDasharray={idx === 2 ? undefined : "3 3"}
                />
                <text
                  x={paddingLeft - 6}
                  y={grid.y + 3}
                  fill="var(--text-muted)"
                  fontSize="9"
                  fontWeight="600"
                  textAnchor="end"
                >
                  {grid.label}
                </text>
              </g>
            ))}

            {/* Area Fills */}
            {proAreaPath && <path d={proAreaPath} fill="url(#gradPro)" />}
            {entAreaPath && <path d={entAreaPath} fill="url(#gradEnterprise)" />}

            {/* Smooth Spline Lines */}
            {proSpline && (
              <path
                d={proSpline}
                fill="none"
                stroke="#6366f1"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="drop-shadow-[0_2px_4px_rgba(99,102,241,0.35)]"
              />
            )}
            {entSpline && (
              <path
                d={entSpline}
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="drop-shadow-[0_2px_4px_rgba(16,185,129,0.35)]"
              />
            )}

            {/* Interactive Points */}
            {proPoints.map((pt, idx) => {
              const entPt = entPoints[idx];
              const isHovered = hoveredRevenueIdx === idx;
              return (
                <g key={idx} className="cursor-pointer" onMouseEnter={() => setHoveredRevenueIdx(idx)}>
                  <rect x={pt.x - 12} y={paddingTop} width={24} height={graphHeight} fill="transparent" />
                  {isHovered && (
                    <line x1={pt.x} y1={paddingTop} x2={pt.x} y2={height - paddingBottom} stroke="var(--text-muted)" strokeWidth="1" strokeDasharray="2 2" />
                  )}
                  {(isHovered || pt.amount > 0) && (
                    <circle cx={pt.x} cy={pt.y} r={isHovered ? 5.5 : 3} fill="#6366f1" stroke="#ffffff" strokeWidth={isHovered ? 2 : 1} />
                  )}
                  {(isHovered || entPt.amount > 0) && (
                    <circle cx={entPt.x} cy={entPt.y} r={isHovered ? 5.5 : 3} fill="#10b981" stroke="#ffffff" strokeWidth={isHovered ? 2 : 1} />
                  )}
                </g>
              );
            })}

            {/* X-Axis Labels */}
            <text x={paddingLeft} y={height - 6} fill="var(--text-muted)" fontSize="9" fontWeight="600" textAnchor="start">
              {dynamicRevenueTrend[0]?.date ? new Date(dynamicRevenueTrend[0].date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'}) : ''}
            </text>
            {dynamicRevenueTrend.length > 2 && (
              <text x={paddingLeft + graphWidth / 2} y={height - 6} fill="var(--text-muted)" fontSize="9" fontWeight="500" textAnchor="middle">
                {dynamicRevenueTrend[Math.floor(dynamicRevenueTrend.length / 2)]?.date ? new Date(dynamicRevenueTrend[Math.floor(dynamicRevenueTrend.length / 2)].date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'}) : ''}
              </text>
            )}
            <text x={width - paddingRight} y={height - 6} fill="var(--text-muted)" fontSize="9" fontWeight="600" textAnchor="end">
              {dynamicRevenueTrend[dynamicRevenueTrend.length-1]?.date ? new Date(dynamicRevenueTrend[dynamicRevenueTrend.length-1].date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'}) : ''}
            </text>
          </svg>

          {/* Floating Tooltip Card */}
          {hoveredRevenueIdx !== null && dynamicRevenueTrend[hoveredRevenueIdx] && (
            <div 
              className="absolute z-20 top-2 pointer-events-none p-3 rounded-2xl bg-card/95 dark:bg-slate-900/95 backdrop-blur-md text-primary text-xs border border-[var(--border-default)] shadow-2xl space-y-1.5 transition-all duration-150"
              style={{
                left: `${Math.max(10, Math.min(80, (proPoints[hoveredRevenueIdx]?.x / width) * 100))}%`,
                transform: 'translateX(-50%)'
              }}
            >
              <p className="text-[11px] font-bold text-muted border-b border-[var(--border-default)] pb-1">
                📅 {new Date(dynamicRevenueTrend[hoveredRevenueIdx].date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <div className="flex items-center justify-between gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  Paket PRO:
                </span>
                <strong className="text-primary font-bold">{formatIDR(dynamicRevenueTrend[hoveredRevenueIdx].pro)}</strong>
              </div>
              <div className="flex items-center justify-between gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Paket ENTERPRISE:
                </span>
                <strong className="text-primary font-bold">{formatIDR(dynamicRevenueTrend[hoveredRevenueIdx].enterprise)}</strong>
              </div>
              <div className="border-t border-[var(--border-default)] pt-1 flex items-center justify-between font-bold text-xs">
                <span className="text-secondary">Total Omzet:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{formatIDR(dynamicRevenueTrend[hoveredRevenueIdx].total)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
