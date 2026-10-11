import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import {
  ASSET_META,
  AssetType,
  MISTAKE_TAGS,
  Timeframe,
  Trade,
  TradeDirection,
  TradingSession,
} from '../types/trading';

interface TradeFormModalProps {
  isOpen: boolean;
  initialAsset: AssetType;
  riskPerOneR: number;
  editingTrade: Trade | null;
  onClose: () => void;
  onSave: (trade: Trade) => void;
  isDark: boolean;
}

export const TradeFormModal: React.FC<TradeFormModalProps> = ({
  isOpen,
  initialAsset,
  riskPerOneR,
  editingTrade,
  onClose,
  onSave,
  isDark,
}) => {
  const [date, setDate] = useState('2026-10-11');
  const [time, setTime] = useState('16:00:00');
  const [asset, setAsset] = useState<AssetType>(initialAsset);
  const [direction, setDirection] = useState<TradeDirection>('LONG');
  const [leverage, setLeverage] = useState('x2');
  const [volume, setVolume] = useState('2.5');
  const [marginUsd, setMarginUsd] = useState('3500');
  const [entryPrice, setEntryPrice] = useState('2510.00');
  const [exitPrice, setExitPrice] = useState('2535.00');
  const [pnlUsd, setPnlUsd] = useState('60.00');
  const [feeUsd, setFeeUsd] = useState('1.50');
  const [strategy, setStrategy] = useState('');
  const [timeframe, setTimeframe] = useState<Timeframe>('M15');
  const [session, setSession] = useState<TradingSession>('New York');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (editingTrade) {
      setDate(editingTrade.date);
      setTime(editingTrade.time);
      setAsset(editingTrade.asset);
      setDirection(editingTrade.direction);
      setLeverage(editingTrade.leverage || 'x1');
      setVolume(String(editingTrade.volume));
      setMarginUsd(String(editingTrade.marginUsd));
      setEntryPrice(String(editingTrade.entryPrice));
      setExitPrice(String(editingTrade.exitPrice));
      setPnlUsd(String(editingTrade.pnlUsd));
      setFeeUsd(String(editingTrade.feeUsd || 0));
      setStrategy(editingTrade.strategy || '');
      setTimeframe(editingTrade.timeframe || 'M15');
      setSession(editingTrade.session || 'New York');
      setNotes(editingTrade.notes || '');
    } else {
      setDate('2026-10-11');
      setTime(new Date().toTimeString().slice(0, 8));
      setAsset(initialAsset);
      setDirection('LONG');
      setLeverage(initialAsset === 'XAUUSD' ? 'x1' : 'x2');
      setVolume(initialAsset === 'XAUUSD' ? '1.20' : '3.00');
      setMarginUsd('5000');
      setEntryPrice(initialAsset === 'XAUUSD' ? '4150.00' : '2510.00');
      setExitPrice(initialAsset === 'XAUUSD' ? '4170.00' : '2530.00');
      setPnlUsd('60.00');
      setFeeUsd('1.20');
      setStrategy('');
      setNotes('');
    }
  }, [editingTrade, initialAsset, isOpen]);

  if (!isOpen) return null;

  const numericPnl = parseFloat(pnlUsd) || 0;
  const computedR = Number((numericPnl / (riskPerOneR || 60)).toFixed(2));

  const applyQuickR = (targetR: number) => {
    const val = Number((targetR * (riskPerOneR || 60)).toFixed(2));
    setPnlUsd(String(val));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const outcome = numericPnl > 0 ? 'WIN' : numericPnl < 0 ? 'LOSS' : 'BE';

    const newTrade: Trade = {
      id: editingTrade ? editingTrade.id : `trade-${Date.now()}`,
      date,
      time,
      asset,
      direction,
      leverage,
      volume: parseFloat(volume) || 1,
      marginUsd: parseFloat(marginUsd) || 0,
      entryPrice: parseFloat(entryPrice) || 0,
      exitPrice: parseFloat(exitPrice) || 0,
      strategy: strategy.trim(),
      timeframe,
      session,
      riskUsd: riskPerOneR || 60,
      rrResult: computedR,
      pnlUsd: numericPnl,
      feeUsd: parseFloat(feeUsd) || 0,
      outcome,
      emotion: editingTrade?.emotion || 'CALM',
      emotionIntensity: editingTrade?.emotionIntensity || 2,
      discipline: editingTrade?.discipline || 'STRICT',
      mistakeTag: editingTrade?.mistakeTag || MISTAKE_TAGS[0],
      notes,
      screenshots: editingTrade?.screenshots || [],
    };

    onSave(newTrade);
    onClose();
  };

  const inputClass = `w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:border-blue-500 ${
    isDark
      ? 'bg-slate-900 border-slate-800 text-slate-100'
      : 'bg-slate-50 border-slate-200 text-slate-900'
  }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
      <div
        className={`w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl border shadow-2xl ${
          isDark
            ? 'bg-[#111827] border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}
        >
          <div>
            <h3 className="text-base font-bold">
              {editingTrade ? 'Редактировать сделку' : 'Добавить сделку в дневник'}
            </h3>
            <p className="text-xs text-slate-400">
              Автоматический пересчет R из расчета 1 RR = ${riskPerOneR} (0.6% от $10,000)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Row 1: Asset, Direction, Leverage, Date, Time */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="col-span-1">
              <label className="block text-xs font-medium text-slate-400 mb-1">Раздел / Актив</label>
              <select
                value={asset}
                onChange={(e) => setAsset(e.target.value as AssetType)}
                className={inputClass}
              >
                <option value="XAUUSD">XAU/USD (Золото)</option>
                <option value="ETHUSD">ETH/USD (Эфир)</option>
              </select>
            </div>

            <div className="col-span-1">
              <label className="block text-xs font-medium text-slate-400 mb-1">Направление</label>
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value as TradeDirection)}
                className={inputClass}
              >
                <option value="LONG">↗ LONG (Лонг)</option>
                <option value="SHORT">↘ SHORT (Шорт)</option>
              </select>
            </div>

            <div className="col-span-1">
              <label className="block text-xs font-medium text-slate-400 mb-1">Плечо</label>
              <select
                value={leverage}
                onChange={(e) => setLeverage(e.target.value)}
                className={inputClass}
              >
                <option value="x1">x1</option>
                <option value="x1.5">x1.5</option>
                <option value="x2">x2</option>
                <option value="x3">x3</option>
                <option value="x5">x5</option>
                <option value="x10">x10</option>
              </select>
            </div>

            <div className="col-span-1">
              <label className="block text-xs font-medium text-slate-400 mb-1">Дата</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`${inputClass} font-mono`}
                required
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-slate-400 mb-1">Время</label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="14:30:00"
                className={`${inputClass} font-mono`}
              />
            </div>
          </div>

          {/* Row 2: Terminal Numbers (Entry, Exit, Volume, Margin) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Ср. цена входа ($)
              </label>
              <input
                type="number"
                step="any"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                className={`${inputClass} font-mono`}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Цена закрытия ($)
              </label>
              <input
                type="number"
                step="any"
                value={exitPrice}
                onChange={(e) => setExitPrice(e.target.value)}
                className={`${inputClass} font-mono`}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Объем ({ASSET_META[asset].unit})
              </label>
              <input
                type="number"
                step="any"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                className={`${inputClass} font-mono`}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Обеспечение (USD)
              </label>
              <input
                type="number"
                step="any"
                value={marginUsd}
                onChange={(e) => setMarginUsd(e.target.value)}
                className={`${inputClass} font-mono`}
              />
            </div>
          </div>

          {/* Row 3: Realized PnL ($), Auto-Calculated R, Fee, Quick RR Buttons */}
          <div
            className={`p-4 rounded-xl border ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-blue-50/50 border-blue-100'
            }`}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Реализованный P&L (USD)
                </label>
                <input
                  type="number"
                  step="any"
                  value={pnlUsd}
                  onChange={(e) => setPnlUsd(e.target.value)}
                  className={`${inputClass} font-mono font-bold`}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Комиссия Fee (USD)
                </label>
                <input
                  type="number"
                  step="any"
                  value={feeUsd}
                  onChange={(e) => setFeeUsd(e.target.value)}
                  className={`${inputClass} font-mono`}
                />
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-400 mb-1">
                  Авто-расчет R (1R = ${riskPerOneR})
                </div>
                <div
                  className={`px-3 py-2 rounded-lg font-mono text-sm font-bold border ${
                    computedR > 0
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                      : computedR < 0
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                      : 'bg-slate-500/10 border-slate-500/30 text-slate-400'
                  }`}
                >
                  {computedR > 0 ? '+' : ''}
                  {computedR.toFixed(2)}R ({computedR >= 0 ? 'WIN' : 'LOSS'})
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-slate-400 mr-1">Быстрый ввод по RR:</span>
              {[-1, -0.5, 0, 1, 1.5, 2, 2.5, 3].map((rVal) => (
                <button
                  key={rVal}
                  type="button"
                  onClick={() => applyQuickR(rVal)}
                  className={`px-2 py-1 rounded text-xs font-mono transition-colors border ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200'
                      : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  {rVal > 0 ? `+${rVal}R` : `${rVal}R`} (${rVal * riskPerOneR})
                </button>
              ))}
            </div>
          </div>

          {/* Row 4: Free-form Strategy / Factors Input */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Модель и факторы входа (свободный текст)
            </label>
            <input
              type="text"
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              placeholder="Опишите факторы, по которым приняли решение о входе..."
              className={inputClass}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Заметка по сделке
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Комментарий по сделке..."
              className={inputClass}
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                isDark
                  ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500 transition-colors"
            >
              {editingTrade ? 'Сохранить изменения' : 'Добавить сделку'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
