'use client';

import { useState } from 'react';
import { TrendingUp, Calendar, ChevronDown } from 'lucide-react';

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

export default function UserGrowthSplineChart({ allUsers = [] }) {
  const [selectedPeriod, setSelectedPeriod] = useState('30'); // '7' | '14' | '30' | '90' | 'all'
  const [hoveredTrendIdx, setHoveredTrendIdx] = useState(null);

  // Kalkulasi Dinamis Tren Multi-Series (Free vs Berbayar)
  const dynamicRegistrationTrend = (() => {
    const trendObj = {};
    const now = new Date();
    
    let daysCount = 30;
    if (selectedPeriod === '7') daysCount = 7;
    else if (selectedPeriod === '14') daysCount = 14;
    else if (selectedPeriod === '30') daysCount = 30;
    else if (selectedPeriod === '90') daysCount = 90;
    else if (selectedPeriod === 'all') {
      let oldestDate = now;
      allUsers.forEach((u) => {
        if (u.created_at) {
          const d = new Date(u.created_at);
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
      trendObj[dateKey] = { date: dateKey, free: 0, paid: 0, total: 0 };
    }

    allUsers.forEach((u) => {
      if (!u.created_at) return;
      const userDate = new Date(u.created_at).toISOString().split('T')[0];
      if (trendObj[userDate]) {
        const isPaid = u.tier === 'PRO' || u.tier === 'ENTERPRISE';
        if (isPaid) {
          trendObj[userDate].paid += 1;
        } else {
          trendObj[userDate].free += 1;
        }
        trendObj[userDate].total += 1;
      }
    });

    return Object.values(trendObj);
  })();

  const totalRegisteredInPeriod = dynamicRegistrationTrend.reduce((acc, curr) => acc + curr.total, 0);

  // Scaling untuk grafik SVG multi-area spline
  const maxTrendVal = Math.max(...dynamicRegistrationTrend.map(t => Math.max(t.free, t.paid, t.total)), 2);
  const width = 640;
  const height = 190;
  const paddingLeft = 32;
  const paddingRight = 18;
  const paddingTop = 20;
  const paddingBottom = 26;
  const graphWidth = width - paddingLeft - paddingRight;
  const graphHeight = height - paddingTop - paddingBottom;
  
  const freePoints = [];
  const paidPoints = [];

  if (dynamicRegistrationTrend.length > 0) {
    dynamicRegistrationTrend.forEach((t, index) => {
      const x = dynamicRegistrationTrend.length === 1 
        ? paddingLeft + graphWidth / 2 
        : paddingLeft + (index / (dynamicRegistrationTrend.length - 1)) * graphWidth;
      const yFree = height - paddingBottom - (t.free / maxTrendVal) * graphHeight;
      const yPaid = height - paddingBottom - (t.paid / maxTrendVal) * graphHeight;

      freePoints.push({ x, y: yFree, count: t.free, total: t.total, date: t.date });
      paidPoints.push({ x, y: yPaid, count: t.paid, total: t.total, date: t.date });
    });
  }

  const freeSpline = getSvgSplinePath(freePoints);
  const paidSpline = getSvgSplinePath(paidPoints);

  const bottomY = height - paddingBottom;
  const startX = freePoints[0]?.x || paddingLeft;
  const endX = freePoints[freePoints.length - 1]?.x || (width - paddingRight);

  const freeAreaPath = freePoints.length > 0 ? `${freeSpline} L ${endX} ${bottomY} L ${startX} ${bottomY} Z` : '';
  const paidAreaPath = paidPoints.length > 0 ? `${paidSpline} L ${endX} ${bottomY} L ${startX} ${bottomY} Z` : '';

  return (
    <div className="p-5 rounded-2xl border bg-card border-[var(--border-default)] shadow-sm space-y-3 flex flex-col justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-primary flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Tren Pertumbuhan Kreator
            </h2>
          </div>
          {/* Legend Subtitle */}
          <div className="flex items-center gap-3 text-xs mt-1">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
              User Free (Dasar)
            </span>
            <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm" />
              User Berbayar (Pro/Ent)
            </span>
          </div>
        </div>

        {/* Clean Period Selector Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold whitespace-nowrap">
            +{totalRegisteredInPeriod} Total
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

      {/* SVG Smooth Multi-Series Area Chart */}
      <div className="w-full overflow-x-auto pt-1 relative">
        <div className="min-w-[480px] flex flex-col justify-center">
          <svg 
            className="w-full h-[180px]" 
            viewBox={`0 0 ${width} ${height}`}
            onMouseLeave={() => setHoveredTrendIdx(null)}
          >
            <defs>
              <linearGradient id="gradEmerald" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.38" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
              </linearGradient>
              <linearGradient id="gradBlue" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.03" />
              </linearGradient>
            </defs>

            {/* Y-Axis Gridlines */}
            {[
              { y: paddingTop, label: maxTrendVal },
              { y: paddingTop + graphHeight / 2, label: Math.round(maxTrendVal / 2) },
              { y: height - paddingBottom, label: 0 },
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

            {/* Free Area & Line */}
            {freeAreaPath && <path d={freeAreaPath} fill="url(#gradEmerald)" />}
            {paidAreaPath && <path d={paidAreaPath} fill="url(#gradBlue)" />}
            {freeSpline && (
              <path
                d={freeSpline}
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="drop-shadow-[0_2px_4px_rgba(16,185,129,0.3)]"
              />
            )}
            {paidSpline && (
              <path
                d={paidSpline}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="drop-shadow-[0_2px_4px_rgba(59,130,246,0.35)]"
              />
            )}

            {/* Interactive Points */}
            {freePoints.map((pt, idx) => {
              const paidPt = paidPoints[idx];
              const isHovered = hoveredTrendIdx === idx;
              return (
                <g key={idx} className="cursor-pointer" onMouseEnter={() => setHoveredTrendIdx(idx)}>
                  <rect x={pt.x - 12} y={paddingTop} width={24} height={graphHeight} fill="transparent" />
                  {isHovered && (
                    <line x1={pt.x} y1={paddingTop} x2={pt.x} y2={height - paddingBottom} stroke="var(--text-muted)" strokeWidth="1" strokeDasharray="2 2" />
                  )}
                  {(isHovered || pt.count > 0) && (
                    <circle cx={pt.x} cy={pt.y} r={isHovered ? 5.5 : 3} fill="#10b981" stroke="#ffffff" strokeWidth={isHovered ? 2 : 1} />
                  )}
                  {(isHovered || paidPt.count > 0) && (
                    <circle cx={paidPt.x} cy={paidPt.y} r={isHovered ? 5.5 : 3} fill="#3b82f6" stroke="#ffffff" strokeWidth={isHovered ? 2 : 1} />
                  )}
                </g>
              );
            })}

            {/* X-Axis Labels */}
            <text x={paddingLeft} y={height - 6} fill="var(--text-muted)" fontSize="9" fontWeight="600" textAnchor="start">
              {dynamicRegistrationTrend[0]?.date ? new Date(dynamicRegistrationTrend[0].date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'}) : ''}
            </text>
            {dynamicRegistrationTrend.length > 2 && (
              <text x={paddingLeft + graphWidth / 2} y={height - 6} fill="var(--text-muted)" fontSize="9" fontWeight="500" textAnchor="middle">
                {dynamicRegistrationTrend[Math.floor(dynamicRegistrationTrend.length / 2)]?.date ? new Date(dynamicRegistrationTrend[Math.floor(dynamicRegistrationTrend.length / 2)].date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'}) : ''}
              </text>
            )}
            <text x={width - paddingRight} y={height - 6} fill="var(--text-muted)" fontSize="9" fontWeight="600" textAnchor="end">
              {dynamicRegistrationTrend[dynamicRegistrationTrend.length-1]?.date ? new Date(dynamicRegistrationTrend[dynamicRegistrationTrend.length-1].date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'}) : ''}
            </text>
          </svg>

          {/* Floating Tooltip Card */}
          {hoveredTrendIdx !== null && dynamicRegistrationTrend[hoveredTrendIdx] && (
            <div 
              className="absolute z-20 top-2 pointer-events-none p-3 rounded-2xl bg-card/95 dark:bg-slate-900/95 backdrop-blur-md text-primary text-xs border border-[var(--border-default)] shadow-2xl space-y-1.5 transition-all duration-150"
              style={{
                left: `${Math.max(10, Math.min(80, (freePoints[hoveredTrendIdx]?.x / width) * 100))}%`,
                transform: 'translateX(-50%)'
              }}
            >
              <p className="text-[11px] font-bold text-muted border-b border-[var(--border-default)] pb-1">
                📅 {new Date(dynamicRegistrationTrend[hoveredTrendIdx].date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <div className="flex items-center justify-between gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Free:
                </span>
                <strong className="text-primary font-bold">{dynamicRegistrationTrend[hoveredTrendIdx].free} Akun</strong>
              </div>
              <div className="flex items-center justify-between gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  Berbayar:
                </span>
                <strong className="text-primary font-bold">{dynamicRegistrationTrend[hoveredTrendIdx].paid} Akun</strong>
              </div>
              <div className="border-t border-[var(--border-default)] pt-1 flex items-center justify-between font-bold text-xs">
                <span className="text-secondary">Total:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{dynamicRegistrationTrend[hoveredTrendIdx].total} Kreator</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
