import { AssetType, PropAccountConfig, SectionProfile, Trade } from '../types/trading';

// Сумма P&L 11 октябрьских сделок = -76.91$.
// Текущий реальный баланс проп-счета пользователя = $9,964.97 (от изначальных $10,000).
// Следовательно, точка отсчета для динамического баланса = 9964.97 - (-76.91) = 10041.88.
export const DEFAULT_PROP_CONFIG: PropAccountConfig = {
  firmName: 'Prop Firm Demo $10,000',
  initialBalance: 10000,
  octoberStartBalance: 10041.88,
  currentBalanceOverride: 9964.97,
  riskPerOneR: 60, // $60 = 0.60% от $10,000 = 1 RR
  dailyDrawdownLimitPct: 5, // $500 дневной лимит просадки
  maxDrawdownLimitPct: 10, // $1,000 максимальный лимит просадки
  profitTargetPct: 8, // $800 цель проп-фазы
};

export const DEFAULT_SECTION_PROFILES: Record<'ALL' | AssetType, SectionProfile> = {
  ALL: {
    title: 'Дневник Трейдера — Все сделки (XAU & ETH)',
    subtitle: 'Проп-счет: $9,964.97 (старт $10,000) · Риск на сделку 1 RR = $60',
    author: 'Трейдер',
    description:
      'Общая статистика по двум инструментам: Золото (XAU/USD) и Эфир (ETH/USD). Текущий баланс счета составляет $9,964.97 от первоначальных $10,000. Базовый риск на стоп-лосс: $60 (-1.00R).',
  },
  XAUUSD: {
    title: 'XAUUSD',
    subtitle: 'Раздел Золото · Торговая статистика и факторы входа',
    author: 'Трейдер',
    description:
      'Торговля золотом (XAU/USD). Контроль риска: 1R = $60 от первоначальных $10,000.',
  },
  ETHUSD: {
    title: 'ETHUSD',
    subtitle: 'Раздел Эфир · Торговая статистика и факторы входа',
    author: 'Трейдер',
    description:
      'Торговля эфиром (ETH/USD). Контроль риска: 1R = $60 от первоначальных $10,000.',
  },
};

/**
 * Точные сделки пользователя за октябрь 2026 из приложенных скриншотов терминала
 * (9 сделок по ETH/USD и 2 сделки по XAU/USD).
 * Поле strategy оставлено пустым для самостоятельного заполнения факторов входа.
 */
export const INITIAL_OCTOBER_TRADES: Trade[] = [
  // 1. 01.10.26 20:17:05 — ETH/USD SHORT x1.5 (Скриншот 4)
  {
    id: 'oct-eth-1',
    date: '2026-10-01',
    time: '20:17:05',
    asset: 'ETHUSD',
    direction: 'SHORT',
    leverage: 'x1.5',
    volume: 4.2144,
    marginUsd: 7544.09,
    entryPrice: 2685.11,
    exitPrice: 2693.54,
    strategy: '',
    timeframe: 'M15',
    session: 'New York',
    riskUsd: 60,
    pnlUsd: -35.51,
    feeUsd: 1.81342,
    rrResult: Number((-35.51 / 60).toFixed(2)), // -0.59R
    outcome: 'LOSS',
    emotion: 'CALM',
    emotionIntensity: 2,
    discipline: 'STRICT',
    mistakeTag: 'Без ошибок (Риск в пределах 1R)',
    notes: 'Шорт ETH/USD с плечом x1.5 от $2,685.11, закрытие по стопу на $2,693.54. Убыток -35.51$ (-0.59R).',
    screenshots: [],
  },

  // 2. 02.10.26 13:34:15 — XAU/USD SHORT x3 (Скриншот 5)
  {
    id: 'oct-xau-1',
    date: '2026-10-02',
    time: '13:34:15',
    asset: 'XAUUSD',
    direction: 'SHORT',
    leverage: 'x3',
    volume: 1.79912,
    marginUsd: 2505.46,
    entryPrice: 4177.81,
    exitPrice: 4176.79,
    strategy: '',
    timeframe: 'M3',
    session: 'London',
    riskUsd: 60,
    pnlUsd: 1.83,
    feeUsd: 0.526082,
    rrResult: Number((1.83 / 60).toFixed(2)), // +0.03R
    outcome: 'WIN',
    emotion: 'FEAR_SL',
    emotionIntensity: 2,
    discipline: 'PARTIAL',
    mistakeTag: 'Ранний выход до стопа / БУ',
    notes: 'Шорт золота XAU/USD x3 от $4,177.81, закрытие в небольшой плюс на $4,176.79 (+1.83$).',
    screenshots: [],
  },

  // 3. 02.10.26 17:34:18 — ETH/USD LONG x1 (Скриншот 3)
  {
    id: 'oct-eth-2',
    date: '2026-10-02',
    time: '17:34:18',
    asset: 'ETHUSD',
    direction: 'LONG',
    leverage: 'x1',
    volume: 1.82262,
    marginUsd: 5010.9,
    entryPrice: 2749.28,
    exitPrice: 2722.7,
    strategy: '',
    timeframe: 'M15',
    session: 'New York',
    riskUsd: 60,
    pnlUsd: -48.45,
    feeUsd: 0.797868,
    rrResult: Number((-48.45 / 60).toFixed(2)), // -0.81R
    outcome: 'LOSS',
    emotion: 'CALM',
    emotionIntensity: 2,
    discipline: 'STRICT',
    mistakeTag: 'Без ошибок (Риск в пределах 1R)',
    notes: 'Лонг ETH/USD x1 от $2,749.28, выход на $2,722.70. Стоп -48.45$ (-0.81R).',
    screenshots: [],
  },

  // 4. 03.10.26 16:21:30 — ETH/USD LONG x2 (Скриншот 3)
  {
    id: 'oct-eth-3',
    date: '2026-10-03',
    time: '16:21:30',
    asset: 'ETHUSD',
    direction: 'LONG',
    leverage: 'x2',
    volume: 7.43775,
    marginUsd: 9973.19,
    entryPrice: 2681.78,
    exitPrice: 2677.84,
    strategy: '',
    timeframe: 'M5',
    session: 'New York',
    riskUsd: 60,
    pnlUsd: -29.29,
    feeUsd: 3.18908,
    rrResult: Number((-29.29 / 60).toFixed(2)), // -0.49R
    outcome: 'LOSS',
    emotion: 'CALM',
    emotionIntensity: 2,
    discipline: 'STRICT',
    mistakeTag: 'Без ошибок (Риск в пределах 1R)',
    notes: 'Лонг ETH/USD x2 от $2,681.78, короткий стоп на $2,677.84 (-29.29$ / -0.49R).',
    screenshots: [],
  },

  // 5. 06.10.26 18:54:38 — ETH/USD LONG x1 (Скриншот 3)
  {
    id: 'oct-eth-4',
    date: '2026-10-06',
    time: '18:54:38',
    asset: 'ETHUSD',
    direction: 'LONG',
    leverage: 'x1',
    volume: 2.73889,
    marginUsd: 7456.13,
    entryPrice: 2722.32,
    exitPrice: 2705.36,
    strategy: '',
    timeframe: 'M15',
    session: 'New York',
    riskUsd: 60,
    pnlUsd: -46.45,
    feeUsd: 1.18927,
    rrResult: Number((-46.45 / 60).toFixed(2)), // -0.77R
    outcome: 'LOSS',
    emotion: 'CALM',
    emotionIntensity: 2,
    discipline: 'STRICT',
    mistakeTag: 'Без ошибок (Риск в пределах 1R)',
    notes: 'Лонг ETH/USD x1 от $2,722.32, закрытие на $2,705.36 (-46.45$ / -0.77R).',
    screenshots: [],
  },

  // 6. 06.10.26 21:50:34 — ETH/USD SHORT x1 (Скриншот 3)
  {
    id: 'oct-eth-5',
    date: '2026-10-06',
    time: '21:50:34',
    asset: 'ETHUSD',
    direction: 'SHORT',
    leverage: 'x1',
    volume: 2.74572,
    marginUsd: 7419.29,
    entryPrice: 2702.54,
    exitPrice: 2691.32,
    strategy: '',
    timeframe: 'M15',
    session: 'New York',
    riskUsd: 60,
    pnlUsd: 29.68,
    feeUsd: 1.1848,
    rrResult: Number((29.68 / 60).toFixed(2)), // +0.49R
    outcome: 'WIN',
    emotion: 'CONFIDENT',
    emotionIntensity: 2,
    discipline: 'STRICT',
    mistakeTag: 'Без ошибок (Риск в пределах 1R)',
    notes: 'Шорт ETH/USD x1 от $2,702.54, фиксация на $2,691.32 (+29.68$ / +0.49R).',
    screenshots: [],
  },

  // 7. 07.10.26 20:40:57 — ETH/USD LONG x2 (Скриншот 2)
  {
    id: 'oct-eth-6',
    date: '2026-10-07',
    time: '20:40:57',
    asset: 'ETHUSD',
    direction: 'LONG',
    leverage: 'x2',
    volume: 3.86757,
    marginUsd: 4960.79,
    entryPrice: 2565.32,
    exitPrice: 2552.18,
    strategy: '',
    timeframe: 'M15',
    session: 'New York',
    riskUsd: 60,
    pnlUsd: -50.82,
    feeUsd: 1.58339,
    rrResult: Number((-50.82 / 60).toFixed(2)), // -0.85R
    outcome: 'LOSS',
    emotion: 'CALM',
    emotionIntensity: 2,
    discipline: 'STRICT',
    mistakeTag: 'Без ошибок (Риск в пределах 1R)',
    notes: 'Лонг ETH/USD x2 от $2,565.32, закрытие по стопу на $2,552.18 (-50.82$ / -0.85R).',
    screenshots: [],
  },

  // 8. 08.10.26 09:40:37 — ETH/USD LONG x2 (Скриншот 2)
  {
    id: 'oct-eth-7',
    date: '2026-10-08',
    time: '09:40:37',
    asset: 'ETHUSD',
    direction: 'LONG',
    leverage: 'x2',
    volume: 1.07259,
    marginUsd: 1369.86,
    entryPrice: 2555.07,
    exitPrice: 2558.53,
    strategy: '',
    timeframe: 'M15',
    session: 'London',
    riskUsd: 60,
    pnlUsd: 68.05,
    feeUsd: 1.58463,
    rrResult: Number((68.05 / 60).toFixed(2)), // +1.13R
    outcome: 'WIN',
    emotion: 'CONFIDENT',
    emotionIntensity: 1,
    discipline: 'STRICT',
    mistakeTag: 'Без ошибок (Риск в пределах 1R)',
    notes: 'Утренний лонг ETH/USD x2 от $2,555.07, закрытие в профит +68.05$ (+1.13R).',
    screenshots: [],
  },

  // 9. 08.10.26 22:44:11 — XAU/USD SHORT x1 (Скриншот 5)
  {
    id: 'oct-xau-2',
    date: '2026-10-08',
    time: '22:44:11',
    asset: 'XAUUSD',
    direction: 'SHORT',
    leverage: 'x1',
    volume: 1.20535,
    marginUsd: 4968.44,
    entryPrice: 4121.99,
    exitPrice: 4131.25,
    strategy: '',
    timeframe: 'M15',
    session: 'New York',
    riskUsd: 60,
    pnlUsd: -11.16,
    feeUsd: 0.348181,
    rrResult: Number((-11.16 / 60).toFixed(2)), // -0.19R
    outcome: 'LOSS',
    emotion: 'CALM',
    emotionIntensity: 1,
    discipline: 'STRICT',
    mistakeTag: 'Без ошибок (Риск в пределах 1R)',
    notes: 'Шорт XAU/USD x1 от $4,121.99, выход на $4,131.25 (-11.16$ / -0.19R).',
    screenshots: [],
  },

  // 10. 10.10.26 14:57:28 — ETH/USD SHORT x1 (Скриншот 2)
  {
    id: 'oct-eth-8',
    date: '2026-10-10',
    time: '14:57:28',
    asset: 'ETHUSD',
    direction: 'SHORT',
    leverage: 'x1',
    volume: 2.99184,
    marginUsd: 7440.33,
    entryPrice: 2487.99,
    exitPrice: 2495.79,
    strategy: '',
    timeframe: 'M15',
    session: 'New York',
    riskUsd: 60,
    pnlUsd: -26.67,
    feeUsd: 1.19286,
    rrResult: Number((-26.67 / 60).toFixed(2)), // -0.44R
    outcome: 'LOSS',
    emotion: 'CALM',
    emotionIntensity: 2,
    discipline: 'STRICT',
    mistakeTag: 'Без ошибок (Риск в пределах 1R)',
    notes: 'Дневной шорт ETH/USD x1 от $2,487.99, выход на $2,495.79 (-26.67$ / -0.44R).',
    screenshots: [],
  },

  // 11. 10.10.26 22:40:21 — ETH/USD LONG x3 (Скриншот 2)
  {
    id: 'oct-eth-9',
    date: '2026-10-10',
    time: '22:40:21',
    asset: 'ETHUSD',
    direction: 'LONG',
    leverage: 'x3',
    volume: 11.8283,
    marginUsd: 9895.48,
    entryPrice: 2509.78,
    exitPrice: 2515.86,
    strategy: '',
    timeframe: 'M5',
    session: 'New York',
    riskUsd: 60,
    pnlUsd: 71.88,
    feeUsd: 4.75558,
    rrResult: Number((71.88 / 60).toFixed(2)), // +1.20R
    outcome: 'WIN',
    emotion: 'CONFIDENT',
    emotionIntensity: 1,
    discipline: 'STRICT',
    mistakeTag: 'Без ошибок (Риск в пределах 1R)',
    notes: 'Вечерний лонг ETH/USD x3 от $2,509.78, закрытие на $2,515.86 (+71.88$ / +1.20R).',
    screenshots: [],
  },
];
