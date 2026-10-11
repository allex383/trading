import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardPaste,
  ExternalLink,
  ImagePlus,
  Maximize2,
  RotateCcw,
  Trash2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { ASSET_META, Trade } from '../types/trading';

interface ScreenshotModalProps {
  trade: Trade | null;
  onClose: () => void;
  onUpdateTrade: (updated: Trade) => void;
  isDark: boolean;
}

/**
 * Compresses an uploaded/pasted image file at Full HD (1920px, 0.90 quality)
 * so candlesticks and price labels remain sharp when zoomed in.
 */
async function compressImageFile(file: File, maxWidth = 1920): Promise<string> {
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
        resolve(canvas.toDataURL('image/jpeg', 0.9));
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

  // Fullscreen Lightbox & Zoom/Pan states
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  useEffect(() => {
    if (trade) {
      setNotes(trade.notes || '');
      setStrategy(trade.strategy || '');
      setActiveImageIdx(0);
      setIsLightboxOpen(false);
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  }, [trade?.id]);

  // Reset zoom/pan when switching active screenshot or opening lightbox
  const resetZoomAndPan = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Close lightbox on Escape key
  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setIsLightboxOpen(false);
        resetZoomAndPan();
      } else if (e.key === '+' || e.key === '=') {
        setZoom((z) => Math.min(5, Number((z + 0.35).toFixed(2))));
      } else if (e.key === '-') {
        setZoom((z) => {
          const next = Math.max(1, Number((z - 0.35).toFixed(2)));
          if (next === 1) setPan({ x: 0, y: 0 });
          return next;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen]);

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
  const currentSrc = screenshots[activeImageIdx];

  const handleWheelZoom = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.25 : -0.25;
    setZoom((prev) => {
      const next = Math.min(5, Math.max(1, Number((prev + delta).toFixed(2))));
      if (next === 1) {
        setPan({ x: 0, y: 0 });
      }
      return next;
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: dragStartRef.current.panX + dx,
      y: dragStartRef.current.panY + dy,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDoubleClickImage = () => {
    if (zoom > 1) {
      resetZoomAndPan();
    } else {
      setZoom(2.5);
    }
  };

  return (
    <>
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
                    className={`group relative rounded-xl overflow-hidden border aspect-video flex items-center justify-center ${
                      isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-900 border-slate-200'
                    }`}
                  >
                    <img
                      src={currentSrc}
                      alt={`График сделки ${trade.date}`}
                      referrerPolicy="no-referrer"
                      onClick={() => {
                        resetZoomAndPan();
                        setIsLightboxOpen(true);
                      }}
                      className="max-h-full max-w-full object-contain cursor-zoom-in transition-transform duration-150 group-hover:scale-[1.01]"
                      title="Нажмите, чтобы развернуть график на весь экран и увеличить"
                    />

                    {/* Bottom-left prompt to click to zoom */}
                    <button
                      type="button"
                      onClick={() => {
                        resetZoomAndPan();
                        setIsLightboxOpen(true);
                      }}
                      className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/85 hover:bg-blue-600 text-white text-xs font-medium backdrop-blur-xs transition-colors shadow-md"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      Открыть и увеличить график
                    </button>

                    {/* Top-right action buttons */}
                    <div className="absolute top-3 right-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          resetZoomAndPan();
                          setIsLightboxOpen(true);
                        }}
                        className="p-2 rounded-lg bg-slate-900/85 text-white hover:bg-blue-600 transition-colors"
                        title="Увеличить и рассмотреть график"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>

                      {currentSrc?.startsWith('http') && (
                        <a
                          href={currentSrc}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-lg bg-slate-900/85 text-white hover:bg-slate-900 transition-colors"
                          title="Открыть оригинал в новой вкладке"
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
                          onClick={() => {
                            setActiveImageIdx(idx);
                            resetZoomAndPan();
                          }}
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

      {/* FULLSCREEN LIGHTBOX ZOOM & PAN VIEWER */}
      {isLightboxOpen && currentSrc && (
        <div className="fixed inset-0 z-[60] bg-slate-950/95 backdrop-blur-md flex flex-col select-none">
          {/* Top Zoom Control Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-3.5 bg-slate-900/90 border-b border-slate-800 text-slate-100 z-10">
            <div className="flex items-center gap-3 text-xs sm:text-sm">
              <span className="font-bold">
                {ASSET_META[trade.asset].symbol} · {trade.date} ({trade.time})
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-400 hidden sm:inline">
                Колесико мыши или кнопки для зума · Зажмите левую кнопку мыши для перемещения по графику
              </span>
            </div>

            <div className="flex items-center gap-2">
              {screenshots.length > 1 && (
                <div className="flex items-center gap-1 mr-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveImageIdx((i) => (i > 0 ? i - 1 : screenshots.length - 1));
                      resetZoomAndPan();
                    }}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                    title="Предыдущий скриншот"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-mono px-2">
                    {activeImageIdx + 1} / {screenshots.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveImageIdx((i) => (i < screenshots.length - 1 ? i + 1 : 0));
                      resetZoomAndPan();
                    }}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                    title="Следующий скриншот"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setZoom((z) => {
                    const next = Math.max(1, Number((z - 0.5).toFixed(2)));
                    if (next === 1) setPan({ x: 0, y: 0 });
                    return next;
                  });
                }}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                title="Уменьшить (-)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <span className="w-16 text-center font-mono text-xs font-bold text-blue-400">
                {Math.round(zoom * 100)}%
              </span>

              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(5, Number((z + 0.5).toFixed(2))))}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                title="Увеличить (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={resetZoomAndPan}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
                title="Сбросить масштаб (100%)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                100%
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsLightboxOpen(false);
                  resetZoomAndPan();
                }}
                className="ml-2 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white transition-colors"
              >
                <X className="w-4 h-4" />
                Закрыть
              </button>
            </div>
          </div>

          {/* Interactive Zoom & Pan Canvas */}
          <div
            onWheel={handleWheelZoom}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDoubleClick={handleDoubleClickImage}
            className={`flex-1 overflow-hidden flex items-center justify-center relative ${
              zoom > 1
                ? isDragging
                  ? 'cursor-grabbing'
                  : 'cursor-grab'
                : 'cursor-zoom-in'
            }`}
          >
            <img
              src={currentSrc}
              alt={`График сделки ${trade.date}`}
              referrerPolicy="no-referrer"
              draggable={false}
              style={{
                transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
                transition: isDragging ? 'none' : 'transform 120ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              className="max-h-[86vh] max-w-[94vw] object-contain pointer-events-none"
            />
          </div>

          {/* Bottom Caption Bar showing Strategy & Notes while inspecting chart */}
          {(strategy || notes) && (
            <div className="px-6 py-3 bg-slate-900/90 border-t border-slate-800 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-4">
              {strategy && (
                <div>
                  <span className="text-slate-400 font-semibold mr-1.5">Модель / Факторы:</span>
                  <span>{strategy}</span>
                </div>
              )}
              {notes && (
                <div>
                  <span className="text-slate-400 font-semibold mr-1.5">Заметка:</span>
                  <span>{notes}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
};
