export type AssetType = 'XAUUSD' | 'ETHUSD';

export type TradeDirection = 'LONG' | 'SHORT';

export type TradeOutcome = 'WIN' | 'LOSS' | 'BE';

export type TradingSession = 'Asia' | 'London' | 'New York';

export type Timeframe = 'M1' | 'M3' | 'M5' | 'M15' | 'H1' | 'H4';

export type EmotionalState =
  | 'CALM'
  | 'CONFIDENT'
  | 'FEAR_SL'
  | 'FOMO'
  | 'IMPATIENT'
  | 'REVENGE';

export type DisciplineState = 'STRICT' | 'PARTIAL' | 'VIOLATED';

export interface Trade {
  id: string;
  date: string; // YYYY-MM-DD (e.g. '2026-10-10')
  time: string; // HH:mm:ss (e.g. '22:40:21')
  asset: AssetType;
  direction: TradeDirection;
  leverage: string; // e.g. 'x1', 'x1.5', 'x2', 'x3'
  volume: number; // e.g. 11.8283 ETH or 1.20535 XAU
  marginUsd: number; // Обеспечение, e.g. 9895.48
  entryPrice: number; // ср. цена входа
  exitPrice: number; // цена закрытия
  stopLossPrice?: number;
  takeProfitPrice?: number;
  strategy: string; // Свободное текстовое описание модели и факторов входа
  timeframe: Timeframe;
  session: TradingSession;
  riskUsd: number; // 60 ($60 = 1 RR)
  rrResult: number; // Pnl / 60 (e.g. +1.20, -0.44)
  pnlUsd: number; // Реализованный P&L (например, 71.88, -26.67)
  feeUsd: number; // Комиссия (например, 4.75558)
  outcome: TradeOutcome; // WIN | LOSS | BE
  emotion: EmotionalState;
  emotionIntensity: number; // 1 to 5
  discipline: DisciplineState;
  mistakeTag: string;
  notes: string;
  screenshots: string[]; // Array of data URLs or image URLs attached for this trade/date
}

export interface SectionProfile {
  title: string;
  subtitle: string;
  author: string;
  description: string;
}

export interface PropAccountConfig {
  firmName: string;
  initialBalance: number; // Номинальный стартовый баланс проп-счета: 10000
  octoberStartBalance: number; // Баланс к началу октябрьской выборки, чтобы текущий баланс равнялся 9964.97
  currentBalanceOverride?: number; // Точный текущий баланс проп-счета: 9964.97
  riskPerOneR: number; // 60 ($60 = 0.60% от $10,000 = 1 RR)
  dailyDrawdownLimitPct: number; // 5% ($500)
  maxDrawdownLimitPct: number; // 10% ($1,000)
  profitTargetPct: number; // 8% ($800)
}

export const ASSET_META: Record<
  AssetType,
  {
    symbol: string;
    shortCode: string;
    name: string;
    shortName: string;
    unit: string;
    defaultSectionTitle: string;
  }
> = {
  XAUUSD: {
    symbol: 'XAU/USD',
    shortCode: 'GOLD',
    name: 'Золото (XAU/USD)',
    shortName: 'Золото',
    unit: 'XAU',
    defaultSectionTitle: 'XAUUSD',
  },
  ETHUSD: {
    symbol: 'ETH/USD',
    shortCode: 'ETH',
    name: 'Эфириум (ETH/USD)',
    shortName: 'Эфир',
    unit: 'ETH',
    defaultSectionTitle: 'ETHUSD',
  },
};

export const EMOTION_META: Record<
  EmotionalState,
  {
    label: string;
    shortLabel: string;
    description: string;
    category: 'positive' | 'neutral' | 'negative';
  }
> = {
  CALM: {
    label: 'Спокойствие (Стоп ≤ $60 комфортен)',
    shortLabel: 'Спокойствие',
    description: 'Полное принятие риска $60 (-1 RR = 0.6%). Никакого давления при просадке.',
    category: 'positive',
  },
  CONFIDENT: {
    label: 'Уверенность в сетапе',
    shortLabel: 'Уверенность',
    description: 'Понятная структура и точка входа, спокойное сопровождение сделки.',
    category: 'positive',
  },
  FEAR_SL: {
    label: 'Страх стопа / Ранний выход',
    shortLabel: 'Страх стопа',
    description: 'Желание прикрыть сделку раньше времени или перевести в БУ при малейшем откате.',
    category: 'neutral',
  },
  IMPATIENT: {
    label: 'Нетерпение / Поспешный вход',
    shortLabel: 'Нетерпение',
    description: 'Вход до формирования полного подтверждения на младшем таймфрейме.',
    category: 'neutral',
  },
  FOMO: {
    label: 'FOMO (Боязнь упустить движение)',
    shortLabel: 'FOMO',
    description: 'Вход вдогонку за свечой с ухудшенным соотношением риск/прибыль.',
    category: 'negative',
  },
  REVENGE: {
    label: 'Тильт / Желание отыграться',
    shortLabel: 'Тильт',
    description: 'Попытка быстро отбить предыдущий минус без системного сетапа.',
    category: 'negative',
  },
};

export const DISCIPLINE_META: Record<
  DisciplineState,
  {
    label: string;
    shortLabel: string;
  }
> = {
  STRICT: {
    label: 'По плану (100%)',
    shortLabel: 'По плану',
  },
  PARTIAL: {
    label: 'Частичное отклонение',
    shortLabel: 'Частично',
  },
  VIOLATED: {
    label: 'Нарушение правил',
    shortLabel: 'Нарушение',
  },
};

export const MISTAKE_TAGS: string[] = [
  'Без ошибок (Риск в пределах 1R)',
  'Раннее закрытие профита',
  'Ранний выход до стопа / БУ',
  'Вход без подтверждения M3/M5',
  'Вход против старшего ТФ (H4)',
  'Завышенное плечо / обеспечение',
];
