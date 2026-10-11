import React from 'react';
import { Camera } from 'lucide-react';
import { ASSET_META, Trade } from '../types/trading';

interface OctoberCalendarSectionProps {
  trades: Trade[];
  riskPerOneR: number;
  onSelectTradeForScreenshot: (trade: Trade) => void;
  isDark: boolean;
}

export const OctoberCalendarSection: React.FC<OctoberCalendarSectionProps> = ({
  trades,
  riskPerOneR,
  onSelectTradeForScreenshot,
  isDark,
}) => {
  // October 2026 starts on Thursday (2026-10-01 is Thursday, index 3 in Mon-Sun week)
  const daysInOctober = 31;
  const startOffsetMon = 3; // Mon=0, Tue=1, Wed=2, Thu=3

  const dayCells: (number | null)[] = [
    ...Array(startOffsetMon).fill(null),
    ...Array.from({ length: daysInOctober }, (_, i) => i + 1),
  ];

  const tradesByDate = new Map<string, Trade[]>();
  trades.forEach((t) => {
    const arr = tradesByDate.get(t.date) || [];
    arr.push(t);
    tradesByDate.set(t.date, arr);
  });

  const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  return (
    <div
      className={`rounded-2xl p-6 border transition-colors ${
        isDark
          ? 'bg-[#131B2E] border-slate-800/80 text-slate-100'
          : 'bg-white border-slate-200/80 text-slate-900 shadow-xs'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            КАЛЕНДАРЬ СДЕЛОК И СКРИНШОТОВ · ОКТЯБРЬ 2026
          </span>
          <p className="text-xs text-slate-400 mt-0.5">
            Нажмите на любую сделку внутри даты, чтобы прикрепить или посмотреть скриншот графика
          </p>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-semibold text-slate-400">
        {weekdays.map((w) => (
          <div key={w} className="py-1">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {dayCells.map((day, idx) => {
          if (day === null) {
            return (
              <div
                key={`empty-${idx}`}
                className={`min-h-24 rounded-xl border border-transparent ${
                  isDark ? 'bg-slate-900/20' : 'bg-slate-50/50'
                }`}
              />
            );
          }

          const dateStr = `2026-10-${String(day).padStart(2, '0')}`;
          const dayTrades = tradesByDate.get(dateStr) || [];
          const dayPnl = dayTrades.reduce((acc, t) => acc + t.pnlUsd, 0);
          const dayR = dayPnl / (riskPerOneR || 60);

          return (
            <div
              key={dateStr}
              className={`min-h-24 rounded-xl p-2 border flex flex-col justify-between transition-colors ${
                dayTrades.length > 0
                  ? dayPnl >= 0
                    ? isDark
                      ? 'bg-emerald-950/25 border-emerald-800/50'
                      : 'bg-emerald-50/60 border-emerald-200'
                    : isDark
                    ? 'bg-rose-950/20 border-rose-800/40'
                    : 'bg-rose-50/50 border-rose-200'
                  : isDark
                  ? 'bg-slate-900/40 border-slate-800/60'
                  : 'bg-slate-50/70 border-slate-200/60'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-semibold text-slate-400">{String(day).padStart(2, '0')}.10</span>
                {dayTrades.length > 0 && (
                  <span
                    className={`font-bold text-[11px] ${
                      dayPnl >= 0 ? 'text-emerald-500' : 'text-rose-500'
                    }`}
                  >
                    {dayR > 0 ? '+' : ''}
                    {dayR.toFixed(2)}R
                  </span>
                )}
              </div>

              {dayTrades.length > 0 ? (
                <div className="mt-1.5 space-y-1">
                  {dayTrades.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => onSelectTradeForScreenshot(t)}
                      className={`w-full text-left px-1.5 py-1 rounded text-[11px] font-mono flex items-center justify-between gap-1 border transition-colors ${
                        isDark
                          ? 'bg-slate-900/90 border-slate-700 hover:border-blue-500'
                          : 'bg-white border-slate-200 hover:border-blue-500 shadow-2xs'
                      }`}
                    >
                      <span className="truncate">
                        {ASSET_META[t.asset].shortCode}{' '}
                        <span
                          className={
                            t.direction === 'LONG' ? 'text-emerald-500' : 'text-rose-500'
                          }
                        >
                          {t.direction === 'LONG' ? '↗' : '↘'}
                        </span>
                      </span>
                      <span className="flex items-center gap-1 shrink-0">
                        <span
                          className={
                            t.pnlUsd >= 0 ? 'text-emerald-500 font-semibold' : 'text-rose-500 font-semibold'
                          }
                        >
                          {t.pnlUsd > 0 ? '+' : ''}
                          {t.pnlUsd.toFixed(0)}$
                        </span>
                        <Camera
                          className={`w-3 h-3 ${
                            t.screenshots && t.screenshots.length > 0
                              ? 'text-blue-500'
                              : 'text-slate-400 opacity-60'
                          }`}
                        />
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-[10px] text-slate-400/50 text-center my-auto">—</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
