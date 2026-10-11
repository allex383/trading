import React, { useState } from 'react';
import { Calculator, ShieldCheck } from 'lucide-react';
import { ASSET_META, AssetType, PropAccountConfig } from '../types/trading';
import { JournalStats } from '../utils/analytics';

interface AnalyticsAndPsychologyPanelProps {
  stats: JournalStats;
  config: PropAccountConfig;
  allTradesNetPnl: number;
  onUpdateConfig: (next: PropAccountConfig) => void;
  isDark: boolean;
}

export const AnalyticsAndPsychologyPanel: React.FC<
  AnalyticsAndPsychologyPanelProps
> = ({ stats, config, allTradesNetPnl, onUpdateConfig, isDark }) => {
  // Position Size Calculator State for $60 = 1R
  const [calcAsset, setCalcAsset] = useState<AssetType>('ETHUSD');
  const [calcEntry, setCalcEntry] = useState<string>('2510.00');
  const [calcStop, setCalcStop] = useState<string>('2490.00');
  const [calcLeverage, setCalcLeverage] = useState<number>(2);
  const [customRisk, setCustomRisk] = useState<string>(String(config.riskPerOneR));

  const entryNum = parseFloat(calcEntry) || 0;
  const stopNum = parseFloat(calcStop) || 0;
  const riskNum = parseFloat(customRisk) || config.riskPerOneR || 60;
  const priceDiff = Math.abs(entryNum - stopNum);
  const isLong = entryNum >= stopNum;

  const positionUnits = priceDiff > 0 ? riskNum / priceDiff : 0;
  const notionalUsd = positionUnits * entryNum;
  const requiredMarginUsd = calcLeverage > 0 ? notionalUsd / calcLeverage : notionalUsd;

  const tp1R = isLong ? entryNum + priceDiff : entryNum - priceDiff;
  const tp2R = isLong ? entryNum + priceDiff * 2 : entryNum - priceDiff * 2;
  const tp3R = isLong ? entryNum + priceDiff * 3 : entryNum - priceDiff * 3;

  const maxDrawdownUsd = (config.initialBalance * config.maxDrawdownLimitPct) / 100;
  const dailyDrawdownUsd = (config.initialBalance * config.dailyDrawdownLimitPct) / 100;
  const currentDrawdownUsd = Math.max(0, config.initialBalance - stats.currentBalance);
  const remainingDrawdownUsd = Math.max(0, maxDrawdownUsd - currentDrawdownUsd);
  const remainingStopsBuffer = Math.floor(remainingDrawdownUsd / config.riskPerOneR);

  const cardClass = `rounded-2xl p-6 border transition-colors ${
    isDark
      ? 'bg-[#131B2E] border-slate-800/80 text-slate-100'
      : 'bg-white border-slate-200/80 text-slate-900 shadow-xs'
  }`;

  return (
    <div className="space-y-6">
      {/* Row 1: Prop Firm Risk Comfort & Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 6 cols: Prop Firm $9,964.97 Status */}
        <div className={`${cardClass} lg:col-span-6 flex flex-col justify-between space-y-5`}>
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                КОНТРОЛЬ РИСКА ПРОП-СЧЕТА ($10,000)
              </span>
              <span className="text-xs font-mono font-semibold text-emerald-500 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" />1 RR = ${config.riskPerOneR} (0.60%)
              </span>
            </div>

            <h3 className="text-lg font-bold mb-2">
              Текущий баланс проп-счета:{' '}
              <span className="font-mono tabular-nums">
                ${stats.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>{' '}
              <span
                className={`text-sm font-mono ${
                  stats.accountDiffFrom10kUsd >= 0 ? 'text-emerald-500' : 'text-rose-500'
                }`}
              >
                ({stats.accountDiffFrom10kUsd > 0 ? '+' : ''}
                {stats.accountDiffFrom10kUsd.toFixed(2)}$ / {stats.returnPct > 0 ? '+' : ''}
                {stats.returnPct}% от $10,000)
              </span>
            </h3>

            <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Все {stats.stopsWithin60Count} из {stats.losses} убыточных сделок за октябрь (
              {stats.stopsWithin60Pct}%) закрыты строго в пределах лимита{' '}
              <strong>${config.riskPerOneR} (-1 RR)</strong>. Максимальный стоп составил{' '}
              <strong className="font-mono">
                {stats.maxLossUsd} $ ({stats.maxLossR}R)
              </strong>
              , а средний стоп — <strong className="font-mono">-{stats.avgLossR}R</strong>.
            </p>
          </div>

          {/* Prop Buffer Metrics */}
          <div
            className={`grid grid-cols-3 gap-3 p-4 rounded-xl border font-mono tabular-nums ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200/70'
            }`}
          >
            <div>
              <div className="text-[11px] font-sans text-slate-400">Соблюдение 1R ($60)</div>
              <div className="text-base font-bold text-emerald-500 mt-0.5">
                {stats.stopsWithin60Pct}% ({stats.stopsWithin60Count}/{stats.losses})
              </div>
              <div className="text-[11px] font-sans text-slate-400">средний стоп -{stats.avgLossR}R</div>
            </div>

            <div>
              <div className="text-[11px] font-sans text-slate-400">Дневной лимит (5%)</div>
              <div className="text-base font-bold mt-0.5">${dailyDrawdownUsd}</div>
              <div className="text-[11px] font-sans text-slate-400">
                запас ~{Math.floor(dailyDrawdownUsd / config.riskPerOneR)} стопов/день
              </div>
            </div>

            <div>
              <div className="text-[11px] font-sans text-slate-400">Запас до макс. просадки</div>
              <div className="text-base font-bold text-blue-500 mt-0.5">
                ${remainingDrawdownUsd.toFixed(2)}
              </div>
              <div className="text-[11px] font-sans text-slate-400">
                запас {remainingStopsBuffer} стопов по $60
              </div>
            </div>
          </div>

          {/* Editable Risk & Balance Config */}
          <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Текущий баланс ($):</span>
                <input
                  type="number"
                  step="0.01"
                  value={stats.currentBalance}
                  onChange={(e) => {
                    const targetBalance = parseFloat(e.target.value) || 9964.97;
                    const nextOctStart = Number((targetBalance - allTradesNetPnl).toFixed(2));
                    onUpdateConfig({
                      ...config,
                      octoberStartBalance: nextOctStart,
                      currentBalanceOverride: targetBalance,
                    });
                  }}
                  className={`w-28 px-2 py-1 rounded border font-mono font-semibold ${
                    isDark
                      ? 'bg-slate-900 border-slate-700 text-slate-100'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400">1 RR ($):</span>
                <input
                  type="number"
                  value={config.riskPerOneR}
                  onChange={(e) => {
                    const val = Math.max(1, parseFloat(e.target.value) || 60);
                    onUpdateConfig({ ...config, riskPerOneR: val });
                    setCustomRisk(String(val));
                  }}
                  className={`w-20 px-2 py-1 rounded border font-mono font-semibold ${
                    isDark
                      ? 'bg-slate-900 border-slate-700 text-slate-100'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right 6 cols: Live Position Calculator for $60 Stop Loss on XAU/USD & ETH/USD */}
        <div className={`${cardClass} lg:col-span-6 space-y-4`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-blue-500" />
              КАЛЬКУЛЯТОР ОБЪЕМА ПОД СТОП -1 RR (${riskNum})
            </span>
            <div className="flex items-center gap-1">
              {(['ETHUSD', 'XAUUSD'] as AssetType[]).map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => {
                    setCalcAsset(a);
                    if (a === 'XAUUSD') {
                      setCalcEntry('4150.00');
                      setCalcStop('4140.00');
                      setCalcLeverage(1);
                    } else {
                      setCalcEntry('2510.00');
                      setCalcStop('2495.00');
                      setCalcLeverage(2);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    calcAsset === a
                      ? 'bg-blue-600 text-white'
                      : isDark
                      ? 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {ASSET_META[a].symbol}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Цена входа ($)</label>
              <input
                type="number"
                step="any"
                value={calcEntry}
                onChange={(e) => setCalcEntry(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border text-sm font-mono ${
                  isDark
                    ? 'bg-slate-900 border-slate-800 text-slate-100'
                    : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Цена стоп-лосса ($)</label>
              <input
                type="number"
                step="any"
                value={calcStop}
                onChange={(e) => setCalcStop(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border text-sm font-mono ${
                  isDark
                    ? 'bg-slate-900 border-slate-800 text-slate-100'
                    : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Плечо в терминале</label>
              <select
                value={calcLeverage}
                onChange={(e) => setCalcLeverage(Number(e.target.value))}
                className={`w-full px-3 py-2 rounded-lg border text-sm font-mono ${
                  isDark
                    ? 'bg-slate-900 border-slate-800 text-slate-100'
                    : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              >
                <option value={1}>x1</option>
                <option value={1.5}>x1.5</option>
                <option value={2}>x2</option>
                <option value={3}>x3</option>
                <option value={5}>x5</option>
              </select>
            </div>
          </div>

          {/* Calculated Output */}
          <div
            className={`p-4 rounded-xl border grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono tabular-nums ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-blue-50/50 border-blue-100'
            }`}
          >
            <div>
              <div className="text-[11px] font-sans text-slate-400">Рекомендуемый объем</div>
              <div className="text-base font-bold text-blue-500 mt-0.5">
                {positionUnits.toFixed(4)} {ASSET_META[calcAsset].unit}
              </div>
              <div className="text-[11px] font-sans text-slate-400">
                Стоп: ${priceDiff.toFixed(2)} ({isLong ? 'Лонг' : 'Шорт'})
              </div>
            </div>
            <div>
              <div className="text-[11px] font-sans text-slate-400">
                Обеспечение (при x{calcLeverage})
              </div>
              <div className="text-base font-bold mt-0.5">
                ${requiredMarginUsd.toLocaleString('en-US', { maximumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] font-sans text-slate-400">
                Риск строго -${riskNum} (-1.00R)
              </div>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <div className="text-[11px] font-sans text-slate-400">Цели по тейку (RR)</div>
              <div className="text-xs space-y-0.5 mt-0.5">
                <div className="text-emerald-500">
                  +1R (+${riskNum}): <strong>${tp1R.toFixed(2)}</strong>
                </div>
                <div className="text-emerald-500">
                  +2R (+${riskNum * 2}): <strong>${tp2R.toFixed(2)}</strong>
                </div>
                <div className="text-emerald-500">
                  +3R (+${riskNum * 3}): <strong>${tp3R.toFixed(2)}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Strategy / Factor Breakdown Table */}
      <div className={cardClass}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            СТАТИСТИКА ПО ЗАПИСАННЫМ МОДЕЛЯМ И ФАКТОРАМ ВХОДА
          </span>
          <span className="text-xs text-slate-400">Сортировка по Сумме R</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr
                className={`border-b text-[11px] uppercase tracking-wider ${
                  isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-400'
                }`}
              >
                <th className="py-2.5 pr-3">Модель / Факторы входа</th>
                <th className="py-2.5 px-2 text-right">Сделок</th>
                <th className="py-2.5 px-2 text-right">Тейки / Стопы</th>
                <th className="py-2.5 px-2 text-right">Винрейт</th>
                <th className="py-2.5 px-2 text-right">Сумма R</th>
                <th className="py-2.5 pl-2 text-right">P&L ($)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/40 dark:divide-slate-800/60 font-mono tabular-nums text-xs">
              {stats.byStrategy.map((st) => (
                <tr key={st.strategy}>
                  <td className="py-3 pr-3 font-sans font-semibold">{st.strategy}</td>
                  <td className="py-3 px-2 text-right">{st.totalTrades}</td>
                  <td className="py-3 px-2 text-right">
                    <span className="text-emerald-500 font-semibold">{st.wins}</span>
                    {' / '}
                    <span className="text-rose-500 font-semibold">{st.losses}</span>
                  </td>
                  <td className="py-3 px-2 text-right">{st.winrate}%</td>
                  <td
                    className={`py-3 px-2 text-right font-bold ${
                      st.totalR >= 0 ? 'text-emerald-500' : 'text-rose-500'
                    }`}
                  >
                    {st.totalR > 0 ? '+' : ''}
                    {st.totalR.toFixed(2)}R
                  </td>
                  <td
                    className={`py-3 pl-2 text-right font-bold ${
                      st.netPnl >= 0 ? 'text-emerald-500' : 'text-rose-500'
                    }`}
                  >
                    {st.netPnl > 0 ? '+' : ''}
                    {st.netPnl.toFixed(2)} $
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
