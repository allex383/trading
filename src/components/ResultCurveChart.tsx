import React, { useState } from 'react';
import { CurvePoint } from '../utils/analytics';

interface ResultCurveChartProps {
  curve: CurvePoint[];
  totalR: number;
  netPnlUsd: number;
  initialBalance: number;
  riskPerOneR: number;
  isDark: boolean;
}

export const ResultCurveChart: React.FC<ResultCurveChartProps> = ({
  curve,
  totalR,
  netPnlUsd,
  initialBalance,
  riskPerOneR,
  isDark,
}) => {
  const [unit, setUnit] = useState<'R' | 'USD'>('R');
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  // Add starting point (0) before trade #1
  const points = [
    {
      index: 0,
      tradeId: 'start',
      date: 'Старт (01.10.26)',
      time: '',
      asset: '',
      direction: '',
      pnlUsd: 0,
      rrResult: 0,
      cumulativeR: 0,
      cumulativePnl: 0,
      balance: initialBalance,
    },
    ...curve,
  ];

  const values = points.map((p) => (unit === 'R' ? p.cumulativeR : p.cumulativePnl));
  const minVal = Math.min(0, ...values);
  const maxVal = Math.max(0.5, ...values);
  const spread = Math.max(1, maxVal - minVal);
  const yMin = minVal - spread * 0.18;
  const yMax = maxVal + spread * 0.18;

  const width = 920;
  const height = 250;
  const padLeft = 64;
  const padRight = 24;
  const padTop = 20;
  const padBottom = 28;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const getX = (i: number) => {
    if (points.length <= 1) return padLeft;
    return padLeft + (i / (points.length - 1)) * plotW;
  };

  const getY = (val: number) => {
    const ratio = (val - yMin) / (yMax - yMin || 1);
    return padTop + plotH - ratio * plotH;
  };

  const zeroY = getY(0);

  // Build SVG path
  const coords = points.map((p, i) => ({
    x: getX(i),
    y: getY(unit === 'R' ? p.cumulativeR : p.cumulativePnl),
    point: p,
  }));

  const linePath = coords
    .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(' ');

  const areaPath =
    coords.length > 1
      ? `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${(padTop + plotH).toFixed(1)} L ${coords[0].x.toFixed(1)} ${(padTop + plotH).toFixed(1)} Z`
      : '';

  // 4 horizontal grid steps like in Screenshot 1
  const gridTicks = [
    yMin + (yMax - yMin) * 0.1,
    yMin + (yMax - yMin) * 0.4,
    yMin + (yMax - yMin) * 0.7,
    yMin + (yMax - yMin) * 0.95,
  ];

  const activeCoord = hoverIdx !== null && coords[hoverIdx] ? coords[hoverIdx] : coords[coords.length - 1];

  const formatTick = (val: number) => {
    if (unit === 'R') {
      return `${val > 0 ? '+' : ''}${val.toFixed(1)}R`;
    }
    return `${val > 0 ? '+' : ''}${val.toFixed(0)}$`;
  };

  return (
    <div
      className={`rounded-2xl p-6 border transition-colors ${
        isDark
          ? 'bg-[#131B2E] border-slate-800/80 text-slate-100'
          : 'bg-white border-slate-200/80 text-slate-900 shadow-xs'
      }`}
    >
      {/* Top header row matching Screenshot 1 */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <span
            className={`text-xs font-semibold tracking-wider uppercase ${
              isDark ? 'text-slate-400' : 'text-slate-400'
            }`}
          >
            КРИВАЯ РЕЗУЛЬТАТА
          </span>
          <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>·</span>
          <span className={`text-xs font-mono tabular-nums ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            1 RR = ${riskPerOneR} (0.6% от ${initialBalance.toLocaleString('en-US')})
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Unit Switcher */}
          <div
            className={`inline-flex rounded-lg p-0.5 text-xs border ${
              isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-slate-100 border-slate-200/70'
            }`}
          >
            <button
              type="button"
              onClick={() => setUnit('R')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors whitespace-nowrap shrink-0 ${
                unit === 'R'
                  ? isDark
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-blue-600 shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              В единицах R
            </button>
            <button
              type="button"
              onClick={() => setUnit('USD')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors whitespace-nowrap shrink-0 ${
                unit === 'USD'
                  ? isDark
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-blue-600 shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              В долларах ($)
            </button>
          </div>

          {/* Right Badge matching Screenshot 1 (+113.73R style) */}
          <div
            className={`px-3.5 py-1.5 rounded-xl text-sm font-bold font-mono tabular-nums border ${
              isDark
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                : 'bg-blue-50/80 border-blue-200 text-blue-600'
            }`}
          >
            {unit === 'R'
              ? `${totalR > 0 ? '+' : ''}${totalR.toFixed(2)}R`
              : `${netPnlUsd > 0 ? '+' : ''}${netPnlUsd.toFixed(2)} $`}
          </div>
        </div>
      </div>

      {/* SVG Curve Canvas */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-56 select-none overflow-visible"
          onMouseLeave={() => setHoverIdx(null)}
        >
          <defs>
            <linearGradient id="rCurveGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563EB" stopOpacity={isDark ? '0.38' : '0.28'} />
              <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid Lines */}
          {gridTicks.map((tick, idx) => {
            const y = getY(tick);
            return (
              <g key={idx}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke={isDark ? '#1E293B' : '#F1F5F9'}
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 10}
                  y={y + 4}
                  textAnchor="end"
                  className={`text-[11px] font-mono tabular-nums ${
                    isDark ? 'fill-slate-500' : 'fill-slate-400'
                  }`}
                >
                  {formatTick(tick)}
                </text>
              </g>
            );
          })}

          {/* Zero Baseline (dashed like Screenshot 1) */}
          {zeroY >= padTop && zeroY <= padTop + plotH && (
            <g>
              <line
                x1={padLeft}
                y1={zeroY}
                x2={width - padRight}
                y2={zeroY}
                stroke={isDark ? '#334155' : '#CBD5E1'}
                strokeWidth="1.2"
                strokeDasharray="4 4"
              />
              <text
                x={padLeft - 10}
                y={zeroY + 4}
                textAnchor="end"
                className={`text-[10px] font-mono tabular-nums ${
                  isDark ? 'fill-slate-400' : 'fill-slate-500'
                }`}
              >
                0.0{unit === 'R' ? 'R' : '$'}
              </text>
            </g>
          )}

          {/* Area Fill */}
          {areaPath && <path d={areaPath} fill="url(#rCurveGrad)" />}

          {/* Main Line */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="#2563EB"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data Points & Hover Targets */}
          {coords.map((c, i) => {
            const isHovered = hoverIdx === i;
            const isLast = i === coords.length - 1;
            return (
              <g key={c.point.tradeId || i}>
                {(isLast || isHovered || i > 0) && (
                  <circle
                    cx={c.x}
                    cy={c.y}
                    r={isHovered ? 6 : isLast ? 5 : 3.5}
                    fill={
                      i === 0
                        ? '#64748B'
                        : c.point.pnlUsd >= 0
                        ? '#2563EB'
                        : isHovered
                        ? '#EF4444'
                        : '#2563EB'
                    }
                    stroke={isDark ? '#0F172A' : '#FFFFFF'}
                    strokeWidth="2"
                  />
                )}
                {/* Invisible wider hit column for smooth hover */}
                <rect
                  x={c.x - plotW / Math.max(2, points.length) / 2}
                  y={padTop}
                  width={plotW / Math.max(2, points.length)}
                  height={plotH}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoverIdx(i)}
                />
              </g>
            );
          })}
        </svg>

        {/* Bottom Info Strip showing hovered trade details */}
        {activeCoord && activeCoord.point.index > 0 && (
          <div
            className={`mt-2 pt-3 border-t flex flex-wrap items-center justify-between gap-3 text-xs ${
              isDark ? 'border-slate-800/80 text-slate-300' : 'border-slate-100 text-slate-600'
            }`}
          >
            <div className="flex items-center gap-2 font-mono tabular-nums">
              <span className="font-semibold">Сделка #{activeCoord.point.index}</span>
              <span>·</span>
              <span>
                {activeCoord.point.date} {activeCoord.point.time}
              </span>
              <span>·</span>
              <span className="font-semibold">{activeCoord.point.asset}</span>
              <span>·</span>
              <span
                className={
                  activeCoord.point.direction === 'LONG' ? 'text-emerald-500' : 'text-rose-500'
                }
              >
                {activeCoord.point.direction === 'LONG' ? '↗ лонг' : '↘ шорт'}
              </span>
            </div>
            <div className="flex items-center gap-4 font-mono tabular-nums">
              <span>
                Сделка:{' '}
                <strong
                  className={activeCoord.point.pnlUsd >= 0 ? 'text-emerald-500' : 'text-rose-500'}
                >
                  {activeCoord.point.rrResult > 0 ? '+' : ''}
                  {activeCoord.point.rrResult.toFixed(2)}R ({activeCoord.point.pnlUsd > 0 ? '+' : ''}
                  {activeCoord.point.pnlUsd.toFixed(2)} $)
                </strong>
              </span>
              <span>·</span>
              <span>
                Накопительно:{' '}
                <strong className="text-blue-500">
                  {activeCoord.point.cumulativeR > 0 ? '+' : ''}
                  {activeCoord.point.cumulativeR.toFixed(2)}R
                </strong>
              </span>
              <span>·</span>
              <span>
                Баланс: <strong>${activeCoord.point.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
