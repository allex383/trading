import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  Check,
  ClipboardPaste,
  ExternalLink,
  ImagePlus,
  Trash2,
  X,
} from 'lucide-react';
import { ASSET_META, Trade } from '../types/trading';

interface ScreenshotModalProps {
  trade: Trade | null;
  onClose: () => void;
  onUpdateTrade: (updated: Trade) => void;
  isDark: boolean;
}

/**
 * Compresses an uploaded/pasted image file so that multiple chart screenshots
 * fit cleanly in browser localStorage without exceeding quota.
 */
async function compressImageFile(file: File, maxWidth = 1280): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(ev.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = reject;
      img.src = ev.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const ScreenshotModal: React.FC<ScreenshotModalProps> = ({
  trade,
  onClose,
  onUpdateTrade,
  isDark,
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [notes, setNotes] = useState('');
  const [strategy, setStrategy] = useState('');
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [savedToast, setSavedToast] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (trade) {
      setNotes(trade.notes || '');
      setStrategy(trade.strategy || '');
      setActiveImageIdx(0);
    }
  }, [trade]);

  // Listen for Ctrl+V clipboard image paste while modal is open
  useEffect(() => {
    if (!trade) return;
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            const compressed = await compressImageFile(file);
            const nextScreenshots = [...(trade.screenshots || []), compressed];
            onUpdateTrade({
              ...trade,
              notes,
              strategy,
              screenshots: nextScreenshots,
            });
            setActiveImageIdx(nextScreenshots.length - 1);
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [trade, notes, strategy, onUpdateTrade]);

  if (!trade) return null;

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const added: string[] = [];
    for (let i = 0; i < files.length; i++) {
      if (files[i].type.startsWith('image/')) {
        const dataUrl = await compressImageFile(files[i]);
        added.push(dataUrl);
      }
    }
    if (added.length > 0) {
      const nextScreenshots = [...(trade.screenshots || []), ...added];
      onUpdateTrade({
        ...trade,
        notes,
        strategy,
        screenshots: nextScreenshots,
      });
      setActiveImageIdx(nextScreenshots.length - 1);
    }
  };

  const handleAddUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    const nextScreenshots = [...(trade.screenshots || []), trimmed];
    onUpdateTrade({
      ...trade,
      notes,
      strategy,
      screenshots: nextScreenshots,
    });
    setUrlInput('');
    setActiveImageIdx(nextScreenshots.length - 1);
  };

  const handleRemoveScreenshot = (idx: number) => {
    const nextScreenshots = (trade.screenshots || []).filter((_, i) => i !== idx);
    onUpdateTrade({
      ...trade,
      notes,
      strategy,
      screenshots: nextScreenshots,
    });
    setActiveImageIdx(Math.max(0, nextScreenshots.length - 1));
  };

  const handleSaveDetails = () => {
    onUpdateTrade({
      ...trade,
      notes,
      strategy,
    });
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 1800);
  };

  const screenshots = trade.screenshots || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
      <div
        className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl ${
          isDark
            ? 'bg-[#111827] border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}
        >
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-base font-bold">
              Разбор сделки и скриншоты графика · {trade.date} ({trade.time})
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-sm font-mono font-semibold">
              {ASSET_META[trade.asset].symbol} ({trade.leverage})
            </span>
            <span
              className={`text-sm font-mono font-semibold ${
                trade.direction === 'LONG' ? 'text-emerald-500' : 'text-rose-500'
              }`}
            >
              {trade.direction === 'LONG' ? '↗ лонг' : '↘ шорт'}
            </span>
            <span
              className={`text-sm font-mono font-bold ${
                trade.pnlUsd >= 0 ? 'text-emerald-500' : 'text-rose-500'
              }`}
            >
              {trade.rrResult > 0 ? '+' : ''}
              {trade.rrResult.toFixed(2)}R ({trade.pnlUsd > 0 ? '+' : ''}
              {trade.pnlUsd.toFixed(2)} $)
            </span>
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

        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 7 cols: Chart Screenshot Viewer & Dropzone */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Скриншоты графика ({screenshots.length})
              </h4>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500 transition-colors whitespace-nowrap shrink-0"
              >
                <ImagePlus className="w-3.5 h-3.5" />
                Загрузить скриншот
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFilesSelected(e.target.files)}
              />
            </div>

            {screenshots.length > 0 ? (
              <div className="space-y-3">
                <div
                  className={`relative rounded-xl overflow-hidden border aspect-video flex items-center justify-center ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-900 border-slate-200'
                  }`}
                >
                  <img
                    src={screenshots[activeImageIdx]}
                    alt={`График сделки ${trade.date}`}
                    referrerPolicy="no-referrer"
                    className="max-h-full max-w-full object-contain"
                  />
                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    {screenshots[activeImageIdx].startsWith('http') && (
                      <a
                        href={screenshots[activeImageIdx]}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-lg bg-slate-900/80 text-white hover:bg-slate-900 transition-colors"
                        title="Открыть оригинал"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveScreenshot(activeImageIdx)}
                      className="p-2 rounded-lg bg-rose-600/90 text-white hover:bg-rose-600 transition-colors"
                      title="Удалить этот скриншот"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {screenshots.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {screenshots.map((src, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveImageIdx(idx)}
                        className={`relative w-20 h-14 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                          activeImageIdx === idx
                            ? 'border-blue-500 scale-105'
                            : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={src}
                          alt={`Миниатюра ${idx + 1}`}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleFilesSelected(e.dataTransfer.files);
                }}
                className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
                  isDark
                    ? 'border-slate-800 hover:border-blue-500/60 bg-slate-900/40'
                    : 'border-slate-300 hover:border-blue-500/60 bg-slate-50'
                }`}
              >
                <Camera className="w-10 h-10 mx-auto mb-3 text-blue-500 opacity-80" />
                <p className="text-sm font-semibold mb-1">
                  Нажмите для выбора скриншота или просто нажмите Ctrl + V
                </p>
                <p className="text-xs text-slate-400">
                  Вы можете скопировать график в TradingView и вставить его сюда из буфера обмена для даты {trade.date}
                </p>
              </div>
            )}

            {/* Paste from clipboard hint + URL input */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="Или вставьте ссылку на скриншот TradingView (https://...)"
                  className={`w-full px-3 py-2 text-xs rounded-lg border focus:outline-none focus:border-blue-500 ${
                    isDark
                      ? 'bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-500'
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
                  }`}
                />
              </div>
              <button
                type="button"
                onClick={handleAddUrl}
                className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap shrink-0 ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200'
                    : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-800'
                }`}
              >
                Прикрепить URL
              </button>
            </div>

            {/* Terminal Execution Summary */}
            <div
              className={`rounded-xl p-4 border grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono tabular-nums ${
                isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200/80'
              }`}
            >
              <div>
                <div className="text-slate-400 text-[11px] font-sans">Цена входа → выхода</div>
                <div className="font-semibold mt-0.5">
                  ${trade.entryPrice} → ${trade.exitPrice}
                </div>
              </div>
              <div>
                <div className="text-slate-400 text-[11px] font-sans">Объем / Плечо</div>
                <div className="font-semibold mt-0.5">
                  {trade.volume} {ASSET_META[trade.asset].unit} ({trade.leverage})
                </div>
              </div>
              <div>
                <div className="text-slate-400 text-[11px] font-sans">Обеспечение</div>
                <div className="font-semibold mt-0.5">
                  ${trade.marginUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <div className="text-slate-400 text-[11px] font-sans">Комиссия (Fee)</div>
                <div className="font-semibold mt-0.5">${trade.feeUsd.toFixed(4)}</div>
              </div>
            </div>
          </div>

          {/* Right 5 cols: Free-form Model / Factors & Notes */}
          <div className="lg:col-span-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Модель / Факторы входа (свободный ввод)
              </label>
              <textarea
                rows={3}
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
                placeholder="Опишите модель и совокупность факторов входа..."
                className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:border-blue-500 ${
                  isDark
                    ? 'bg-slate-900 border-slate-800 text-slate-100'
                    : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Заметка и выводы по сделке ({trade.date})
              </label>
              <textarea
                rows={5}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Подробный комментарий по сопровождению сделки и точке выхода..."
                className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:border-blue-500 ${
                  isDark
                    ? 'bg-slate-900 border-slate-800 text-slate-100'
                    : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
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
                Закрыть
              </button>
              <button
                type="button"
                onClick={handleSaveDetails}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500 transition-colors"
              >
                {savedToast ? (
                  <>
                    <Check className="w-4 h-4" />
                    Сохранено
                  </>
                ) : (
                  <>
                    <ClipboardPaste className="w-4 h-4" />
                    Сохранить разбор
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
