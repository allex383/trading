import React, { useEffect, useMemo, useState } from 'react';
import {
  Camera,
  ChevronDown,
  ChevronUp,
  Download,
  Edit3,
  Moon,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Sun,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  ASSET_META,
  AssetType,
  PropAccountConfig,
  SectionProfile,
  Trade,
} from './types/trading';
import {
  DEFAULT_PROP_CONFIG,
  DEFAULT_SECTION_PROFILES,
  INITIAL_OCTOBER_TRADES,
} from './data/octoberTrades';
import { calculateJournalStats } from './utils/analytics';
import { ResultCurveChart } from './components/ResultCurveChart';
import { ScreenshotModal } from './components/ScreenshotModal';
import { TradeFormModal } from './components/TradeFormModal';
import { AnalyticsAndPsychologyPanel } from './components/AnalyticsAndPsychologyPanel';
import { OctoberCalendarSection } from './components/OctoberCalendarSection';

const STORAGE_KEY_TRADES = 'r_journal_october_trades_v3';
const STORAGE_KEY_CONFIG = 'r_journal_prop_config_v3';
const STORAGE_KEY_PROFILES = 'r_journal_section_profiles_v3';
const STORAGE_KEY_THEME = 'r_journal_theme_v2';

type ActiveSection = 'ALL' | 'XAUUSD' | 'ETHUSD';
type WorkspaceTab = 'JOURNAL' | 'ANALYTICS' | 'CALENDAR';

export default function App() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_THEME);
    return saved ? saved === 'dark' : false;
  });

  const [activeSection, setActiveSection] = useState<ActiveSection>('ALL');
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>('JOURNAL');

  const [trades, setTrades] = useState<Trade[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TRADES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return INITIAL_OCTOBER_TRADES;
  });

  const [config, setConfig] = useState<PropAccountConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_PROP_CONFIG;
  });

  const [profiles, setProfiles] = useState<Record<ActiveSection, SectionProfile>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROFILES);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_SECTION_PROFILES;
  });

  // UI states
  const [showDescription, setShowDescription] = useState<boolean>(false);
  const [editingTitle, setEditingTitle] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Filters
  const [filterDirection, setFilterDirection] = useState<'ALL' | 'LONG' | 'SHORT'>('ALL');
  const [filterOutcome, setFilterOutcome] = useState<'ALL' | 'WIN' | 'LOSS'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [screenshotModalTradeId, setScreenshotModalTradeId] = useState<string | null>(null);
  const [isTradeFormOpen, setIsTradeFormOpen] = useState<boolean>(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TRADES, JSON.stringify(trades));
    } catch (e) {
      console.error('Storage quota exceeded or unavailable', e);
    }
  }, [trades]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(profiles));
  }, [profiles]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_THEME, isDark ? 'dark' : 'light');
  }, [isDark]);

  // Filter trades by Active Section (ALL, XAUUSD, ETHUSD) and active filters
  const sectionTrades = useMemo(() => {
    return trades.filter((t) => {
      if (activeSection !== 'ALL' && t.asset !== activeSection) return false;
      if (filterDirection !== 'ALL' && t.direction !== filterDirection) return false;
      if (filterOutcome !== 'ALL' && t.outcome !== filterOutcome) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchDate = t.date.toLowerCase().includes(q);
        const matchNote = (t.notes || '').toLowerCase().includes(q);
        const matchStrat = (t.strategy || '').toLowerCase().includes(q);
        if (!matchDate && !matchNote && !matchStrat) return false;
      }
      return true;
    });
  }, [trades, activeSection, filterDirection, filterOutcome, searchQuery]);

  // Sort chronologically for table display (#1 = earliest in October, or latest)
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const sortedTableTrades = useMemo(() => {
    const copy = [...sectionTrades].sort((a, b) => {
      const dtA = `${a.date}T${a.time || '00:00:00'}`;
      const dtB = `${b.date}T${b.time || '00:00:00'}`;
      return sortAsc ? dtA.localeCompare(dtB) : dtB.localeCompare(dtA);
    });
    return copy;
  }, [sectionTrades, sortAsc]);

  const stats = useMemo(
    () => calculateJournalStats(sectionTrades, config, trades),
    [sectionTrades, config, trades]
  );

  const allTradesNetPnl = useMemo(
    () => Number(trades.reduce((acc, t) => acc + t.pnlUsd, 0).toFixed(2)),
    [trades]
  );

  // Counts per section for section tabs
  const xauCount = useMemo(() => trades.filter((t) => t.asset === 'XAUUSD').length, [trades]);
  const ethCount = useMemo(() => trades.filter((t) => t.asset === 'ETHUSD').length, [trades]);

  const handleUpdateTrade = (updated: Trade) => {
    const oneR = config.riskPerOneR || 60;
    const recomputedR = Number((updated.pnlUsd / oneR).toFixed(2));
    const outcome = updated.pnlUsd > 0 ? 'WIN' : updated.pnlUsd < 0 ? 'LOSS' : 'BE';
    const normalized: Trade = {
      ...updated,
      rrResult: recomputedR,
      outcome,
    };
    setTrades((prev) => prev.map((t) => (t.id === normalized.id ? normalized : t)));
  };

  const handleSaveNewOrEditedTrade = (trade: Trade) => {
    setTrades((prev) => {
      const exists = prev.some((t) => t.id === trade.id);
      if (exists) {
        return prev.map((t) => (t.id === trade.id ? trade : t));
      }
      return [...prev, trade];
    });
  };

  const handleDeleteTrade = (id: string) => {
    setTrades((prev) => prev.filter((t) => t.id !== id));
  };

  const handleResetToOctoberDefault = () => {
    setTrades(INITIAL_OCTOBER_TRADES);
    setConfig(DEFAULT_PROP_CONFIG);
  };

  const handleExportJson = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      config,
      profiles,
      trades,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trader-journal-october-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (Array.isArray(parsed.trades)) {
          setTrades(parsed.trades);
        } else if (Array.isArray(parsed)) {
          setTrades(parsed);
        }
        if (parsed.config) setConfig(parsed.config);
        if (parsed.profiles) setProfiles(parsed.profiles);
      } catch (err) {
        console.error('Invalid JSON file', err);
      }
    };
    reader.readAsText(file);
  };

  const activeScreenshotTrade = useMemo(
    () => trades.find((t) => t.id === screenshotModalTradeId) || null,
    [trades, screenshotModalTradeId]
  );

  const currentProfile = profiles[activeSection];

  // Winrate circular gauge math
  const circleRadius = 42;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const winrateOffset =
    circleCircumference - (Math.min(100, Math.max(0, stats.winrate)) / 100) * circleCircumference;

  return (
    <div
      className={`min-h-screen transition-colors ${
        isDark ? 'bg-[#0B0F17] text-slate-100' : 'bg-[#EBF1F8] text-slate-900'
      }`}
    >
      {/* Top Bar Contract: 3 Zones separated by gap-8 */}
      <header
        className={`sticky top-0 z-30 border-b backdrop-blur-md transition-colors ${
          isDark
            ? 'bg-[#0B0F17]/90 border-slate-800/80'
            : 'bg-white/90 border-slate-200/80'
        }`}
      >
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('ALL');
              setWorkspaceTab('JOURNAL');
            }}
            className="text-lg font-bold tracking-tight whitespace-nowrap shrink-0"
          >
            R-Journal · $10K Prop
          </a>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <button
              type="button"
              onClick={() => {
                setActiveSection('ALL');
                setWorkspaceTab('JOURNAL');
              }}
              className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                activeSection === 'ALL' && workspaceTab === 'JOURNAL'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : isDark
                  ? 'border-transparent text-slate-400 hover:text-slate-100'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Все сделки ({trades.length})
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveSection('XAUUSD');
                setWorkspaceTab('JOURNAL');
              }}
              className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                activeSection === 'XAUUSD' && workspaceTab === 'JOURNAL'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : isDark
                  ? 'border-transparent text-slate-400 hover:text-slate-100'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Золото XAU/USD ({xauCount})
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveSection('ETHUSD');
                setWorkspaceTab('JOURNAL');
              }}
              className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                activeSection === 'ETHUSD' && workspaceTab === 'JOURNAL'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : isDark
                  ? 'border-transparent text-slate-400 hover:text-slate-100'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Эфир ETH/USD ({ethCount})
            </button>

            <button
              type="button"
              onClick={() =>
                setWorkspaceTab(workspaceTab === 'ANALYTICS' ? 'JOURNAL' : 'ANALYTICS')
              }
              className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                workspaceTab === 'ANALYTICS'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : isDark
                  ? 'border-transparent text-slate-400 hover:text-slate-100'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Риск и Калькулятор (-1R = $60)
            </button>

            <button
              type="button"
              onClick={() =>
                setWorkspaceTab(workspaceTab === 'CALENDAR' ? 'JOURNAL' : 'CALENDAR')
              }
              className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                workspaceTab === 'CALENDAR'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : isDark
                  ? 'border-transparent text-slate-400 hover:text-slate-100'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Календарь октября
            </button>
          </nav>

          {/* Zone 3: Primary Action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                setEditingTrade(null);
                setIsTradeFormOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500 transition-colors whitespace-nowrap shrink-0 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Новая сделка
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-[1360px] mx-auto px-4 sm:px-6 py-6 space-y-4">
        {/* Mobile Section Switcher */}
        <div className="flex md:hidden items-center gap-1.5 overflow-x-auto pb-1">
          {(['ALL', 'XAUUSD', 'ETHUSD'] as ActiveSection[]).map((sec) => (
            <button
              key={sec}
              type="button"
              onClick={() => setActiveSection(sec)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 ${
                activeSection === sec
                  ? 'bg-blue-600 text-white'
                  : isDark
                  ? 'bg-[#131B2E] text-slate-300'
                  : 'bg-white text-slate-700'
              }`}
            >
              {sec === 'ALL'
                ? `Все (${trades.length})`
                : sec === 'XAUUSD'
                ? `XAU/USD (${xauCount})`
                : `ETH/USD (${ethCount})`}
            </button>
          ))}
          <button
            type="button"
            onClick={() =>
              setWorkspaceTab(workspaceTab === 'ANALYTICS' ? 'JOURNAL' : 'ANALYTICS')
            }
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 ${
              workspaceTab === 'ANALYTICS'
                ? 'bg-blue-600 text-white'
                : isDark
                ? 'bg-[#131B2E] text-slate-300'
                : 'bg-white text-slate-700'
            }`}
          >
            Риск и Калькулятор
          </button>
        </div>

        {/* MINIMALIST FULL-WIDTH HEADER BANNER (Removed schematic graphic box per point 1) */}
        <div
          className={`w-full rounded-2xl px-6 py-5 border transition-colors ${
            isDark
              ? 'bg-[#131B2E] border-slate-800/80'
              : 'bg-white border-slate-200/80 shadow-xs'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              {editingTitle ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={currentProfile.title}
                    onChange={(e) =>
                      setProfiles((prev) => ({
                        ...prev,
                        [activeSection]: {
                          ...prev[activeSection],
                          title: e.target.value,
                        },
                      }))
                    }
                    onBlur={() => setEditingTitle(false)}
                    onKeyDown={(e) => e.key === 'Enter' && setEditingTitle(false)}
                    autoFocus
                    className={`px-3 py-1 rounded-lg border text-xl font-bold ${
                      isDark
                        ? 'bg-slate-900 border-slate-700 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                    {currentProfile.title}
                  </h1>
                  <button
                    type="button"
                    onClick={() => setEditingTitle(true)}
                    className="p-1 rounded-md text-slate-400 hover:text-blue-500 transition-colors"
                    title="Переименовать заголовок раздела"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">
                  Текущий баланс проп-счета: $
                  {stats.currentBalance.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span>·</span>
                <span className="font-mono">
                  Изначальный: $10,000 ({stats.accountDiffFrom10kUsd > 0 ? '+' : ''}
                  {stats.accountDiffFrom10kUsd.toFixed(2)}$ / {stats.returnPct > 0 ? '+' : ''}
                  {stats.returnPct}%)
                </span>
                <span>·</span>
                <span className="font-mono">1 RR = ${config.riskPerOneR}</span>
              </div>
            </div>

            {/* Right Controls: Section Switcher + Theme + Описание button */}
            <div className="flex flex-wrap items-center gap-2">
              <div
                className={`inline-flex rounded-xl p-1 border text-xs ${
                  isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-100 border-slate-200/70'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setActiveSection('ALL')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    activeSection === 'ALL'
                      ? isDark
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Все ({trades.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection('XAUUSD')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    activeSection === 'XAUUSD'
                      ? isDark
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-white text-amber-600 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Золото XAU ({xauCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection('ETHUSD')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    activeSection === 'ETHUSD'
                      ? isDark
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-indigo-600 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Эфир ETH ({ethCount})
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsDark(!isDark)}
                className={`p-2 rounded-xl border transition-colors ${
                  isDark
                    ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
                title={isDark ? 'Светлый режим' : 'Темный режим'}
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => setShowDescription(!showDescription)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 ${
                  isDark
                    ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20'
                    : 'bg-blue-50/80 border-blue-200 text-blue-600 hover:bg-blue-100/80'
                }`}
              >
                Описание
                {showDescription ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {showDescription && (
            <div
              className={`mt-4 pt-4 border-t text-xs space-y-3 ${
                isDark ? 'border-slate-800 text-slate-300' : 'border-slate-100 text-slate-600'
              }`}
            >
              <textarea
                rows={2}
                value={currentProfile.description}
                onChange={(e) =>
                  setProfiles((prev) => ({
                    ...prev,
                    [activeSection]: {
                      ...prev[activeSection],
                      description: e.target.value,
                    },
                  }))
                }
                className={`w-full p-2.5 rounded-xl border text-xs leading-relaxed ${
                  isDark
                    ? 'bg-slate-900/70 border-slate-800 text-slate-200'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              />

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="text-[11px] text-slate-400 font-mono">
                  Текущий баланс: <strong>${stats.currentBalance.toFixed(2)}</strong> · 1 стоп ={' '}
                  <strong>${config.riskPerOneR} (-1.00 RR)</strong> · Комиссии за октябрь:{' '}
                  <strong>${stats.totalFeeUsd.toFixed(2)}</strong>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportJson}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border font-medium transition-colors ${
                      isDark
                        ? 'border-slate-700 hover:bg-slate-800 text-slate-300'
                        : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <Download className="w-3.5 h-3.5" />
                    Экспорт JSON
                  </button>

                  <label
                    className={`cursor-pointer inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border font-medium transition-colors ${
                      isDark
                        ? 'border-slate-700 hover:bg-slate-800 text-slate-300'
                        : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Импорт JSON
                    <input
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={handleImportJson}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleResetToOctoberDefault}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border font-medium transition-colors ${
                      isDark
                        ? 'border-slate-700 hover:bg-slate-800 text-slate-400'
                        : 'border-slate-200 hover:bg-slate-100 text-slate-500'
                    }`}
                    title="Восстановить исходные 11 сделок со скриншотов за октябрь"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Сброс к сделкам октября
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 5 KPI SUMMARY CARDS ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card 1: ВСЕГО СДЕЛОК */}
          <div
            className={`rounded-2xl p-6 border flex flex-col justify-between min-h-[156px] ${
              isDark
                ? 'bg-[#131B2E] border-slate-800/80'
                : 'bg-white border-slate-200/80 shadow-xs'
            }`}
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              ВСЕГО СДЕЛОК
            </span>
            <div className="my-1">
              <div className="text-4xl font-bold font-mono tabular-nums tracking-tight">
                {stats.totalTrades}
              </div>
              <div
                className={`text-sm font-mono tabular-nums font-bold mt-1.5 ${
                  stats.accountDiffFrom10kUsd >= 0 ? 'text-emerald-500' : 'text-rose-500'
                }`}
              >
                {stats.accountDiffFrom10kUsd > 0 ? '+' : ''}
                {stats.accountDiffFrom10kUsd.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                $ ({stats.returnPct > 0 ? '+' : ''}
                {stats.returnPct.toFixed(2)}%)
              </div>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                {stats.currentBalance.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                USD
              </span>
            </div>
          </div>

          {/* Card 2: ТЕЙКИ И СТОПЫ */}
          <div
            className={`rounded-2xl p-6 border flex flex-col justify-between min-h-[156px] ${
              isDark
                ? 'bg-[#131B2E] border-slate-800/80'
                : 'bg-white border-slate-200/80 shadow-xs'
            }`}
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              ТЕЙКИ И СТОПЫ
            </span>
            <div className="my-1 text-4xl font-bold font-mono tabular-nums tracking-tight">
              <span className="text-emerald-500">{stats.wins}</span>
              <span className="text-slate-300 dark:text-slate-600 mx-1.5 font-normal">/</span>
              <span className="text-rose-500">{stats.losses}</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Стопы ≤ $60: {stats.stopsWithin60Count} из {stats.losses} ({stats.stopsWithin60Pct}%)
            </div>
          </div>

          {/* Card 3: ВИНРЕЙТ */}
          <div
            className={`rounded-2xl p-4 border flex items-center justify-center min-h-[156px] ${
              isDark
                ? 'bg-[#131B2E] border-slate-800/80'
                : 'bg-white border-slate-200/80 shadow-xs'
            }`}
          >
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r={circleRadius}
                  fill="none"
                  stroke={isDark ? '#1E293B' : '#E2E8F0'}
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r={circleRadius}
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circleCircumference}
                  strokeDashoffset={winrateOffset}
                  className="transition-all duration-300"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-bold font-mono tabular-nums leading-none">
                  {stats.winrate}%
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mt-1">
                  ВИНРЕЙТ
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: СУММА R */}
          <div
            className={`rounded-2xl p-6 border flex flex-col justify-between min-h-[156px] ${
              isDark
                ? 'bg-[#131B2E] border-slate-800/80'
                : 'bg-white border-slate-200/80 shadow-xs'
            }`}
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              СУММА R
            </span>
            <div
              className={`my-1 text-4xl font-bold font-mono tabular-nums tracking-tight ${
                stats.totalR >= 0 ? 'text-emerald-500' : 'text-rose-500'
              }`}
            >
              {stats.totalR > 0 ? '+' : ''}
              {stats.totalR.toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              1 RR = ${config.riskPerOneR} (0.6% от $10K)
            </div>
          </div>

          {/* Card 5: СРЕДНИЙ RR */}
          <div
            className={`rounded-2xl p-6 border flex flex-col justify-between min-h-[156px] ${
              isDark
                ? 'bg-[#131B2E] border-slate-800/80'
                : 'bg-white border-slate-200/80 shadow-xs'
            }`}
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              СРЕДНИЙ RR
            </span>
            <div className="my-1 text-4xl font-bold font-mono tabular-nums tracking-tight text-blue-600 dark:text-blue-400">
              {stats.avgRrRatio.toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Ср. тейк: +{stats.avgWinR}R · Ср. стоп: -{stats.avgLossR}R
            </div>
          </div>
        </div>

        {/* Workspace Tab Content */}
        {workspaceTab === 'ANALYTICS' && (
          <AnalyticsAndPsychologyPanel
            stats={stats}
            config={config}
            allTradesNetPnl={allTradesNetPnl}
            onUpdateConfig={setConfig}
            isDark={isDark}
          />
        )}

        {workspaceTab === 'CALENDAR' && (
          <OctoberCalendarSection
            trades={sectionTrades}
            riskPerOneR={config.riskPerOneR}
            onSelectTradeForScreenshot={(t) => setScreenshotModalTradeId(t.id)}
            isDark={isDark}
          />
        )}

        {workspaceTab === 'JOURNAL' && (
          <>
            {/* КРИВАЯ РЕЗУЛЬТАТА */}
            <ResultCurveChart
              curve={stats.curve}
              totalR={stats.totalR}
              netPnlUsd={stats.accountDiffFrom10kUsd}
              initialBalance={config.initialBalance}
              riskPerOneR={config.riskPerOneR}
              isDark={isDark}
            />

            {/* COLLAPSIBLE FILTERS BAR */}
            <div
              className={`rounded-2xl border transition-colors ${
                isDark
                  ? 'bg-[#131B2E] border-slate-800/80'
                  : 'bg-white border-slate-200/80 shadow-xs'
              }`}
            >
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="w-full px-6 py-3.5 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-300"
              >
                <span className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-slate-400" />
                  <span>Фильтры</span>
                  {(filterDirection !== 'ALL' || filterOutcome !== 'ALL' || searchQuery) && (
                    <span className="text-blue-500 font-mono">
                      · активно ({sectionTrades.length} сделок)
                    </span>
                  )}
                </span>
                {showFilters ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {showFilters && (
                <div
                  className={`px-6 pb-4 pt-2 border-t grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs ${
                    isDark ? 'border-slate-800' : 'border-slate-100'
                  }`}
                >
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Направление</label>
                    <select
                      value={filterDirection}
                      onChange={(e) =>
                        setFilterDirection(e.target.value as 'ALL' | 'LONG' | 'SHORT')
                      }
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDark
                          ? 'bg-slate-900 border-slate-800 text-slate-200'
                          : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <option value="ALL">Все направления</option>
                      <option value="LONG">↗ Только Лонг</option>
                      <option value="SHORT">↘ Только Шорт</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Итог сделки</label>
                    <select
                      value={filterOutcome}
                      onChange={(e) => setFilterOutcome(e.target.value as 'ALL' | 'WIN' | 'LOSS')}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDark
                          ? 'bg-slate-900 border-slate-800 text-slate-200'
                          : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <option value="ALL">Все итоги (WIN + LOSS)</option>
                      <option value="WIN">Только тейки (WIN)</option>
                      <option value="LOSS">Только стопы (LOSS)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Поиск по дате, модели или факторам
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Например: 2026-10-08 или фактор входа..."
                        className={`w-full px-3 py-2 rounded-lg border ${
                          isDark
                            ? 'bg-slate-900 border-slate-800 text-slate-200'
                            : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      />
                      {(filterDirection !== 'ALL' || filterOutcome !== 'ALL' || searchQuery) && (
                        <button
                          type="button"
                          onClick={() => {
                            setFilterDirection('ALL');
                            setFilterOutcome('ALL');
                            setSearchQuery('');
                          }}
                          className="px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white shrink-0"
                          title="Сбросить фильтры"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* СДЕЛКИ TABLE (Removed ЭМОЦИИ column, widened МОДЕЛЬ column with free-form input) */}
            <div
              className={`rounded-2xl border overflow-hidden transition-colors ${
                isDark
                  ? 'bg-[#131B2E] border-slate-800/80'
                  : 'bg-white border-slate-200/80 shadow-xs'
              }`}
            >
              {/* Table Header Bar */}
              <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-base font-bold">Сделки</h2>
                  <span className="text-xs text-slate-400">·</span>
                  <button
                    type="button"
                    onClick={() => setSortAsc(!sortAsc)}
                    className="text-xs text-blue-500 hover:underline font-medium"
                  >
                    {sortAsc ? 'Сначала старые (01.10 → 10.10)' : 'Сначала новые (10.10 → 01.10)'}
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setWorkspaceTab('ANALYTICS')}
                    className="text-xs font-medium text-blue-500 hover:underline hidden sm:inline"
                  >
                    Калькулятор 1R = $60 и статистика моделей →
                  </button>
                  <span className="text-sm font-mono tabular-nums text-slate-400 font-semibold">
                    {sortedTableTrades.length}
                  </span>
                </div>
              </div>

              {/* Responsive Data Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr
                      className={`border-y text-[11px] font-semibold uppercase tracking-wider ${
                        isDark
                          ? 'border-slate-800/80 text-slate-400 bg-slate-900/30'
                          : 'border-slate-100 text-slate-400 bg-slate-50/50'
                      }`}
                    >
                      <th className="py-3.5 pl-6 pr-2 w-10">#</th>
                      <th className="py-3.5 px-3">ДАТА</th>
                      <th className="py-3.5 px-3">АКТИВ</th>
                      <th className="py-3.5 px-3">НАПР.</th>
                      <th className="py-3.5 px-3 min-w-[320px] w-[36%]">
                        МОДЕЛЬ / ФАКТОРЫ ВХОДА
                      </th>
                      <th className="py-3.5 px-3">ЦЕНА / ОБЪЕМ</th>
                      <th className="py-3.5 px-3">ГРАФИК</th>
                      <th className="py-3.5 px-3">ИТОГ</th>
                      <th className="py-3.5 px-3 text-right">R</th>
                      <th className="py-3.5 px-3 text-right">PNL</th>
                      <th className="py-3.5 pl-2 pr-6 text-right">ДЕЙСТВИЯ</th>
                    </tr>
                  </thead>
                  <tbody
                    className={`divide-y text-sm ${
                      isDark ? 'divide-slate-800/60' : 'divide-slate-100'
                    }`}
                  >
                    {sortedTableTrades.map((trade, idx) => {
                      const displayNum = sortAsc
                        ? idx + 1
                        : sortedTableTrades.length - idx;
                      const isWin = trade.pnlUsd > 0;
                      const isLoss = trade.pnlUsd < 0;
                      const rVal = Number(
                        (trade.pnlUsd / (config.riskPerOneR || 60)).toFixed(2)
                      );
                      const hasScreenshots =
                        trade.screenshots && trade.screenshots.length > 0;

                      return (
                        <tr
                          key={trade.id}
                          className={`transition-colors ${
                            isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50/80'
                          }`}
                        >
                          {/* # */}
                          <td className="py-3.5 pl-6 pr-2 font-mono tabular-nums text-xs text-slate-400">
                            {displayNum}
                          </td>

                          {/* ДАТА */}
                          <td className="py-3.5 px-3 font-mono tabular-nums whitespace-nowrap">
                            <div className="text-xs font-medium">{trade.date}</div>
                            <div className="text-[11px] text-slate-400">{trade.time}</div>
                          </td>

                          {/* АКТИВ */}
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <div className="text-xs font-semibold">
                              {ASSET_META[trade.asset].shortCode}
                            </div>
                            <div className="text-[11px] font-mono text-slate-400">
                              {ASSET_META[trade.asset].symbol} · {trade.leverage}
                            </div>
                          </td>

                          {/* НАПР. */}
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <span
                              className={`text-xs font-medium ${
                                trade.direction === 'LONG'
                                  ? 'text-emerald-500'
                                  : 'text-rose-500'
                              }`}
                            >
                              {trade.direction === 'LONG' ? '↗ лонг' : '↘ шорт'}
                            </span>
                          </td>

                          {/* МОДЕЛЬ (Wide free-form input field without preset options) */}
                          <td className="py-2.5 px-3 min-w-[320px] w-[36%]">
                            <input
                              type="text"
                              value={trade.strategy}
                              onChange={(e) =>
                                handleUpdateTrade({ ...trade, strategy: e.target.value })
                              }
                              placeholder="Впишите модель и факторы входа..."
                              aria-label="Модель и факторы входа"
                              className={`w-full text-xs font-medium rounded-lg px-3 py-2 border transition-colors focus:outline-none focus:border-blue-500 ${
                                isDark
                                  ? 'bg-slate-900/60 border-slate-800 text-slate-100 placeholder:text-slate-500 hover:border-slate-700'
                                  : 'bg-slate-50/80 border-slate-200/80 text-slate-900 placeholder:text-slate-400 hover:border-slate-300'
                              }`}
                            />
                          </td>

                          {/* ЦЕНА / ОБЪЕМ */}
                          <td className="py-3.5 px-3 font-mono tabular-nums whitespace-nowrap">
                            <div className="text-xs">
                              ${trade.entryPrice.toLocaleString('en-US')} → $
                              {trade.exitPrice.toLocaleString('en-US')}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {trade.volume} {ASSET_META[trade.asset].unit} · маржа $
                              {trade.marginUsd.toLocaleString('en-US', {
                                maximumFractionDigits: 0,
                              })}
                            </div>
                          </td>

                          {/* ГРАФИК / СКРИНШОТ ПО ДАТЕ */}
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setScreenshotModalTradeId(trade.id)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                                hasScreenshots
                                  ? 'bg-blue-600/10 border-blue-500/30 text-blue-600 dark:text-blue-400'
                                  : isDark
                                  ? 'border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                                  : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              <Camera className="w-3.5 h-3.5" />
                              {hasScreenshots
                                ? `График (${trade.screenshots.length})`
                                : '+ Скриншот'}
                            </button>
                          </td>

                          {/* ИТОГ */}
                          <td className="py-3.5 px-3 font-mono text-xs font-bold whitespace-nowrap">
                            <span
                              className={
                                isWin
                                  ? 'text-emerald-500'
                                  : isLoss
                                  ? 'text-rose-500'
                                  : 'text-slate-400'
                              }
                            >
                              {trade.outcome}
                            </span>
                          </td>

                          {/* R */}
                          <td className="py-3.5 px-3 font-mono tabular-nums text-xs font-bold text-right whitespace-nowrap">
                            <span
                              className={
                                rVal > 0
                                  ? 'text-emerald-500'
                                  : rVal < 0
                                  ? 'text-rose-500'
                                  : 'text-slate-400'
                              }
                            >
                              {rVal > 0 ? '+' : ''}
                              {rVal.toFixed(2)}R
                            </span>
                          </td>

                          {/* PNL */}
                          <td className="py-3.5 px-3 font-mono tabular-nums text-right whitespace-nowrap">
                            <div
                              className={`text-xs font-bold ${
                                isWin
                                  ? 'text-emerald-500'
                                  : isLoss
                                  ? 'text-rose-500'
                                  : 'text-slate-400'
                              }`}
                            >
                              {trade.pnlUsd > 0 ? '+' : ''}
                              {trade.pnlUsd.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}{' '}
                              $
                            </div>
                            {trade.feeUsd > 0 && (
                              <div className="text-[10px] text-slate-400">
                                Fee: ${trade.feeUsd.toFixed(2)}
                              </div>
                            )}
                          </td>

                          {/* ДЕЙСТВИЯ */}
                          <td className="py-3.5 pl-2 pr-6 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingTrade(trade);
                                  setIsTradeFormOpen(true);
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 transition-colors"
                                title="Редактировать параметры сделки"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteTrade(trade.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                                title="Удалить сделку"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {sortedTableTrades.length === 0 && (
                      <tr>
                        <td colSpan={11} className="py-12 text-center text-sm text-slate-400">
                          Нет сделок по выбранным фильтрам.{' '}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTrade(null);
                              setIsTradeFormOpen(true);
                            }}
                            className="text-blue-500 font-semibold hover:underline"
                          >
                            Добавить сделку
                          </button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Modal 1: Screenshot & Post-Trade Analysis per Date */}
      <ScreenshotModal
        trade={activeScreenshotTrade}
        onClose={() => setScreenshotModalTradeId(null)}
        onUpdateTrade={handleUpdateTrade}
        isDark={isDark}
      />

      {/* Modal 2: Add / Edit Trade */}
      <TradeFormModal
        isOpen={isTradeFormOpen}
        initialAsset={activeSection === 'XAUUSD' ? 'XAUUSD' : 'ETHUSD'}
        riskPerOneR={config.riskPerOneR}
        editingTrade={editingTrade}
        onClose={() => {
          setIsTradeFormOpen(false);
          setEditingTrade(null);
        }}
        onSave={handleSaveNewOrEditedTrade}
        isDark={isDark}
      />
    </div>
  );
}
