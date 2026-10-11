import { EmotionalState, PropAccountConfig, Trade } from '../types/trading';

export interface CurvePoint {
  index: number;
  tradeId: string;
  date: string;
  time: string;
  asset: string;
  direction: string;
  pnlUsd: number;
  rrResult: number;
  cumulativeR: number;
  cumulativePnl: number;
  balance: number;
}

export interface StrategyStat {
  strategy: string;
  totalTrades: number;
  wins: number;
  losses: number;
  winrate: number;
  totalR: number;
  avgWinR: number;
  avgLossR: number;
  netPnl: number;
}

export interface EmotionStat {
  emotion: EmotionalState;
  totalTrades: number;
  wins: number;
  losses: number;
  winrate: number;
  totalR: number;
  netPnl: number;
}

export interface JournalStats {
  totalTrades: number;
  wins: number;
  losses: number;
  breakevens: number;
  winrate: number; // 0..100
  totalR: number; // Сумма R
  avgWinR: number; // Средний профит в R
  avgLossR: number; // Средний стоп в R (абсолютное значение)
  avgRrRatio: number; // СРЕДНИЙ RR (отношение среднего тейка к среднему стопу)
  netPnlUsd: number;
  totalFeeUsd: number;
  netPnlAfterFeeUsd: number;
  currentBalance: number; // Текущий баланс проп-счета (например, 9964.97)
  accountDiffFrom10kUsd: number; // Отклонение от изначальных $10,000 (например, -35.03$)
  returnPct: number; // % отклонения от $10,000 (например, -0.35%)
  profitFactor: number;
  maxLossUsd: number; // Самый большой стоп в $
  maxLossR: number; // Самый большой стоп в R
  stopsWithin60Count: number; // Сколько стопов уложились в <= $60 (1R)
  stopsWithin60Pct: number;
  curve: CurvePoint[];
  byStrategy: StrategyStat[];
  byEmotion: EmotionStat[];
}

export function calculateJournalStats(
  sectionTrades: Trade[],
  config: PropAccountConfig,
  allTradesForBalance?: Trade[]
): JournalStats {
  const oneR = config.riskPerOneR || 60;
  const startOctBalance = config.octoberStartBalance ?? 10041.88;

  // Sort chronologically by date + time for the equity curve
  const sorted = [...sectionTrades].sort((a, b) => {
    const dtA = `${a.date}T${a.time || '00:00:00'}`;
    const dtB = `${b.date}T${b.time || '00:00:00'}`;
    return dtA.localeCompare(dtB);
  });

  let wins = 0;
  let losses = 0;
  let breakevens = 0;
  let totalR = 0;
  let netPnlUsd = 0;
  let totalFeeUsd = 0;

  let grossWinPnl = 0;
  let grossLossPnl = 0;
  let sumWinR = 0;
  let sumLossR = 0;

  let maxLossUsd = 0;
  let stopsWithin60Count = 0;

  const curve: CurvePoint[] = [];
  let runningR = 0;
  let runningPnl = 0;

  sorted.forEach((t, idx) => {
    const r = Number((t.pnlUsd / oneR).toFixed(2));
    runningR = Number((runningR + r).toFixed(2));
    runningPnl = Number((runningPnl + t.pnlUsd).toFixed(2));

    netPnlUsd += t.pnlUsd;
    totalFeeUsd += t.feeUsd || 0;
    totalR += r;

    if (t.pnlUsd > 0) {
      wins++;
      grossWinPnl += t.pnlUsd;
      sumWinR += r;
    } else if (t.pnlUsd < 0) {
      losses++;
      grossLossPnl += Math.abs(t.pnlUsd);
      sumLossR += Math.abs(r);
      if (t.pnlUsd < maxLossUsd) {
        maxLossUsd = t.pnlUsd;
      }
      if (Math.abs(t.pnlUsd) <= oneR + 0.01) {
        stopsWithin60Count++;
      }
    } else {
      breakevens++;
    }

    curve.push({
      index: idx + 1,
      tradeId: t.id,
      date: t.date,
      time: t.time,
      asset: t.asset,
      direction: t.direction,
      pnlUsd: t.pnlUsd,
      rrResult: r,
      cumulativeR: runningR,
      cumulativePnl: runningPnl,
      balance: Number((startOctBalance + runningPnl).toFixed(2)),
    });
  });

  // Compute actual prop account balance across all trades (so filtering doesn't distort total account balance)
  const allList = allTradesForBalance || sectionTrades;
  const totalAccountPnl = allList.reduce((acc, t) => acc + t.pnlUsd, 0);
  const currentBalance = Number((startOctBalance + totalAccountPnl).toFixed(2));
  const accountDiffFrom10kUsd = Number((currentBalance - config.initialBalance).toFixed(2));
  const returnPct = Number(((accountDiffFrom10kUsd / config.initialBalance) * 100).toFixed(2));

  const totalTrades = sorted.length;
  const decidedTrades = wins + losses;
  const winrate = decidedTrades > 0 ? Math.round((wins / decidedTrades) * 100) : 0;

  const avgWinR = wins > 0 ? Number((sumWinR / wins).toFixed(2)) : 0;
  const avgLossR = losses > 0 ? Number((sumLossR / losses).toFixed(2)) : 0;
  const avgRrRatio =
    avgLossR > 0
      ? Number((avgWinR / avgLossR).toFixed(2))
      : avgWinR > 0
      ? avgWinR
      : 0;

  const profitFactor =
    grossLossPnl > 0
      ? Number((grossWinPnl / grossLossPnl).toFixed(2))
      : grossWinPnl > 0
      ? 99.9
      : 0;

  const stopsWithin60Pct =
    losses > 0 ? Math.round((stopsWithin60Count / losses) * 100) : 100;

  // Group by Strategy / Factors
  const stratMap = new Map<string, Trade[]>();
  sorted.forEach((t) => {
    const key = t.strategy.trim() || 'Не указана (впишите факторы в таблице)';
    const arr = stratMap.get(key) || [];
    arr.push(t);
    stratMap.set(key, arr);
  });

  const byStrategy: StrategyStat[] = Array.from(stratMap.entries())
    .map(([strategy, list]) => {
      const w = list.filter((x) => x.pnlUsd > 0);
      const l = list.filter((x) => x.pnlUsd < 0);
      const totR = list.reduce((acc, x) => acc + x.pnlUsd / oneR, 0);
      const net = list.reduce((acc, x) => acc + x.pnlUsd, 0);
      const aWinR =
        w.length > 0
          ? w.reduce((acc, x) => acc + x.pnlUsd / oneR, 0) / w.length
          : 0;
      const aLossR =
        l.length > 0
          ? l.reduce((acc, x) => acc + Math.abs(x.pnlUsd) / oneR, 0) / l.length
          : 0;
      return {
        strategy,
        totalTrades: list.length,
        wins: w.length,
        losses: l.length,
        winrate: w.length + l.length > 0 ? Math.round((w.length / (w.length + l.length)) * 100) : 0,
        totalR: Number(totR.toFixed(2)),
        avgWinR: Number(aWinR.toFixed(2)),
        avgLossR: Number(aLossR.toFixed(2)),
        netPnl: Number(net.toFixed(2)),
      };
    })
    .sort((a, b) => b.totalR - a.totalR);

  // Group by Emotion
  const emoMap = new Map<EmotionalState, Trade[]>();
  sorted.forEach((t) => {
    const arr = emoMap.get(t.emotion) || [];
    arr.push(t);
    emoMap.set(t.emotion, arr);
  });

  const byEmotion: EmotionStat[] = Array.from(emoMap.entries()).map(
    ([emotion, list]) => {
      const w = list.filter((x) => x.pnlUsd > 0).length;
      const l = list.filter((x) => x.pnlUsd < 0).length;
      const totR = list.reduce((acc, x) => acc + x.pnlUsd / oneR, 0);
      const net = list.reduce((acc, x) => acc + x.pnlUsd, 0);
      return {
        emotion,
        totalTrades: list.length,
        wins: w,
        losses: l,
        winrate: w + l > 0 ? Math.round((w / (w + l)) * 100) : 0,
        totalR: Number(totR.toFixed(2)),
        netPnl: Number(net.toFixed(2)),
      };
    }
  );

  return {
    totalTrades,
    wins,
    losses,
    breakevens,
    winrate,
    totalR: Number(totalR.toFixed(2)),
    avgWinR,
    avgLossR,
    avgRrRatio,
    netPnlUsd: Number(netPnlUsd.toFixed(2)),
    totalFeeUsd: Number(totalFeeUsd.toFixed(2)),
    netPnlAfterFeeUsd: Number((netPnlUsd - totalFeeUsd).toFixed(2)),
    currentBalance,
    accountDiffFrom10kUsd,
    returnPct,
    profitFactor,
    maxLossUsd: Number(maxLossUsd.toFixed(2)),
    maxLossR: Number((maxLossUsd / oneR).toFixed(2)),
    stopsWithin60Count,
    stopsWithin60Pct,
    curve,
    byStrategy,
    byEmotion,
  };
}
