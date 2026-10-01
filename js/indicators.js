/**
 * Technical Indicators - pure JS (no external libs)
 * Compatible with Binance kline format
 */

function ema(values, period) {
  const k = 2 / (period + 1);
  const out = new Array(values.length).fill(null);
  let prev = null;
  for (let i = 0; i < values.length; i++) {
    if (values[i] == null || isNaN(values[i])) continue;
    if (prev === null) {
      // SMA seed
      if (i >= period - 1) {
        let sum = 0;
        for (let j = i - period + 1; j <= i; j++) sum += values[j];
        prev = sum / period;
        out[i] = prev;
      }
    } else {
      prev = values[i] * k + prev * (1 - k);
      out[i] = prev;
    }
  }
  return out;
}

function rsi(closes, period = 14) {
  const out = new Array(closes.length).fill(null);
  if (closes.length < period + 1) return out;

  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  out[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return out;
}

function macd(closes, fast = 12, slow = 26, signal = 9) {
  const emaFast = ema(closes, fast);
  const emaSlow = ema(closes, slow);
  const macdLine = closes.map((_, i) =>
    emaFast[i] != null && emaSlow[i] != null ? emaFast[i] - emaSlow[i] : null
  );
  const signalLine = ema(macdLine.map(v => v == null ? 0 : v), signal);
  // Fix signal for nulls
  const hist = macdLine.map((v, i) =>
    v != null && signalLine[i] != null ? v - signalLine[i] : null
  );
  return { macd: macdLine, signal: signalLine, hist };
}

function atr(highs, lows, closes, period = 14) {
  const tr = new Array(closes.length).fill(null);
  tr[0] = highs[0] - lows[0];
  for (let i = 1; i < closes.length; i++) {
    tr[i] = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    );
  }
  const out = new Array(closes.length).fill(null);
  let sum = 0;
  for (let i = 0; i < period; i++) sum += tr[i];
  out[period - 1] = sum / period;
  for (let i = period; i < closes.length; i++) {
    out[i] = (out[i - 1] * (period - 1) + tr[i]) / period;
  }
  return out;
}

function adx(highs, lows, closes, period = 14) {
  const len = closes.length;
  const plusDM = new Array(len).fill(0);
  const minusDM = new Array(len).fill(0);
  const tr = new Array(len).fill(0);

  for (let i = 1; i < len; i++) {
    const up = highs[i] - highs[i - 1];
    const down = lows[i - 1] - lows[i];
    plusDM[i] = up > down && up > 0 ? up : 0;
    minusDM[i] = down > up && down > 0 ? down : 0;
    tr[i] = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    );
  }

  const smooth = (arr) => {
    const out = new Array(len).fill(null);
    let sum = 0;
    for (let i = 1; i <= period; i++) sum += arr[i];
    out[period] = sum;
    for (let i = period + 1; i < len; i++) {
      out[i] = out[i - 1] - out[i - 1] / period + arr[i];
    }
    return out;
  };

  const str = smooth(tr);
  const sPlus = smooth(plusDM);
  const sMinus = smooth(minusDM);

  const dx = new Array(len).fill(null);
  for (let i = period; i < len; i++) {
    if (!str[i]) continue;
    const pdi = 100 * (sPlus[i] / str[i]);
    const mdi = 100 * (sMinus[i] / str[i]);
    const sum = pdi + mdi;
    dx[i] = sum === 0 ? 0 : 100 * Math.abs(pdi - mdi) / sum;
  }

  const out = new Array(len).fill(null);
  let sumDx = 0;
  let count = 0;
  for (let i = period; i < period * 2 && i < len; i++) {
    if (dx[i] != null) { sumDx += dx[i]; count++; }
  }
  if (count > 0) out[period * 2 - 1] = sumDx / count;
  for (let i = period * 2; i < len; i++) {
    if (out[i - 1] != null && dx[i] != null) {
      out[i] = (out[i - 1] * (period - 1) + dx[i]) / period;
    }
  }
  return out;
}

function sma(values, period) {
  const out = new Array(values.length).fill(null);
  for (let i = period - 1; i < values.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += values[j];
    out[i] = sum / period;
  }
  return out;
}

function addIndicators(candles) {
  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const volumes = candles.map(c => c.volume);

  const ema20 = ema(closes, 20);
  const ema50 = ema(closes, 50);
  const ema200 = ema(closes, 200);
  const rsi14 = rsi(closes, 14);
  const macdData = macd(closes);
  const atr14 = atr(highs, lows, closes, 14);
  const adx14 = adx(highs, lows, closes, 14);
  const volMa20 = sma(volumes, 20);

  return candles.map((c, i) => ({
    ...c,
    ema20: ema20[i],
    ema50: ema50[i],
    ema200: ema200[i],
    rsi: rsi14[i],
    macd: macdData.macd[i],
    macd_signal: macdData.signal[i],
    macd_hist: macdData.hist[i],
    atr: atr14[i],
    adx: adx14[i],
    volume_ma20: volMa20[i],
  })).filter(r =>
    r.ema20 != null && r.ema50 != null && r.rsi != null &&
    r.atr != null && r.adx != null && r.macd_hist != null
  );
}
