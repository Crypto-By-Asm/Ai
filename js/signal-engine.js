/**
 * Signal Engine - client-side port of the Python strategy
 */

function buildTradePlan(side, price, atr) {
  const slDistance = Math.max(atr * 1.5, price * 0.003);
  const tp1 = slDistance * 1.0;
  const tp2 = slDistance * 1.8;
  const tp3 = slDistance * 2.6;

  if (side === "LONG") {
    return {
      entry: +price.toFixed(8),
      stop_loss: +(price - slDistance).toFixed(8),
      tp1: +(price + tp1).toFixed(8),
      tp2: +(price + tp2).toFixed(8),
      tp3: +(price + tp3).toFixed(8),
      risk_reward_tp1: +(tp1 / slDistance).toFixed(2),
      risk_reward_tp2: +(tp2 / slDistance).toFixed(2),
      risk_reward_tp3: +(tp3 / slDistance).toFixed(2),
      sl_distance_pct: +((slDistance / price) * 100).toFixed(3),
    };
  }
  return {
    entry: +price.toFixed(8),
    stop_loss: +(price + slDistance).toFixed(8),
    tp1: +(price - tp1).toFixed(8),
    tp2: +(price - tp2).toFixed(8),
    tp3: +(price - tp3).toFixed(8),
    risk_reward_tp1: +(tp1 / slDistance).toFixed(2),
    risk_reward_tp2: +(tp2 / slDistance).toFixed(2),
    risk_reward_tp3: +(tp3 / slDistance).toFixed(2),
    sl_distance_pct: +((slDistance / price) * 100).toFixed(3),
  };
}

function estimateDuration(adx, atrPct, strength) {
  if (adx >= 30 && strength >= 0.75) return 20;
  if (adx >= 25 && strength >= 0.65) return 15;
  if (atrPct >= 0.01) return 12;
  if (strength >= 0.60) return 10;
  return 6;
}

function generateSignal(candles) {
  const data = addIndicators(candles);
  if (!data.length) {
    return {
      signal: "WAIT",
      score: 0,
      score_is_not_a_guaranteed_probability: true,
      duration_minutes: 0,
      price: 0,
      indicators: {},
      plan: {},
      reasons: ["Insufficient data for analysis."],
    };
  }

  const row = data[data.length - 1];
  let longScore = 0;
  let shortScore = 0;
  const reasons = [];

  if (row.close > row.ema20 && row.ema20 > row.ema50) {
    longScore += 0.22;
    reasons.push("Price is above EMA20 and EMA50 (bullish structure).");
  }
  if (row.close < row.ema20 && row.ema20 < row.ema50) {
    shortScore += 0.22;
    reasons.push("Price is below EMA20 and EMA50 (bearish structure).");
  }

  if (row.rsi > 52 && row.rsi < 70) {
    longScore += 0.16;
    reasons.push("RSI supports bullish momentum without being deeply overbought.");
  }
  if (row.rsi < 48 && row.rsi > 30) {
    shortScore += 0.16;
    reasons.push("RSI supports bearish momentum without being deeply oversold.");
  }

  if (row.macd_hist > 0) {
    longScore += 0.16;
    reasons.push("MACD histogram is positive.");
  } else if (row.macd_hist < 0) {
    shortScore += 0.16;
    reasons.push("MACD histogram is negative.");
  }

  if (row.adx >= 20) {
    if (longScore > shortScore) longScore += 0.16;
    else if (shortScore > longScore) shortScore += 0.16;
    reasons.push(`ADX (${row.adx.toFixed(1)}) indicates a measurable trend.`);
  }

  if (row.volume > row.volume_ma20) {
    if (longScore > shortScore) longScore += 0.10;
    else if (shortScore > longScore) shortScore += 0.10;
    reasons.push("Current volume is above its 20-period average.");
  }

  if (row.close > row.ema200) {
    longScore += 0.08;
    reasons.push("Price is above EMA200 (higher-timeframe bullish bias).");
  } else {
    shortScore += 0.08;
    reasons.push("Price is below EMA200 (higher-timeframe bearish bias).");
  }

  longScore = Math.min(longScore, 1);
  shortScore = Math.min(shortScore, 1);

  let side, strength, plan;
  if (Math.max(longScore, shortScore) < 0.55 || Math.abs(longScore - shortScore) < 0.12) {
    side = "WAIT";
    strength = Math.max(longScore, shortScore);
    plan = {};
  } else {
    side = longScore > shortScore ? "LONG" : "SHORT";
    strength = Math.max(longScore, shortScore);
    plan = buildTradePlan(side, row.close, row.atr);
  }

  const atrPct = row.close ? row.atr / row.close : 0;
  const duration = estimateDuration(row.adx, atrPct, strength);

  return {
    signal: side,
    score: +strength.toFixed(3),
    score_is_not_a_guaranteed_probability: true,
    duration_minutes: duration,
    price: row.close,
    indicators: {
      rsi: +row.rsi.toFixed(2),
      adx: +row.adx.toFixed(2),
      ema20: +row.ema20.toFixed(6),
      ema50: +row.ema50.toFixed(6),
      ema200: +row.ema200.toFixed(6),
      macd_hist: +row.macd_hist.toFixed(6),
      atr: +row.atr.toFixed(6),
    },
    plan,
    reasons: reasons.slice(-6),
  };
}
