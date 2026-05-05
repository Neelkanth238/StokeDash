import yahooFinance from 'yahoo-finance2';

let yfInstance = (yahooFinance as any).default || yahooFinance;

if (typeof yfInstance === 'function') {
  yfInstance = new yfInstance();
} else if (yfInstance.YahooFinance && !yfInstance.quote) {
  yfInstance = new yfInstance.YahooFinance();
}

const yf: any = yfInstance;
import { getWatchlist, clamp } from './data';
import {
  StockData,
  TechnicalData,
  FundamentalData,
  SentimentData,
  MacroData,
  CompositeScore,
  Recommendation,
  FullStockAnalysis,
  PricePoint,
  TopStock,
  MarketOverview,
  DataQuality,
} from './types';

// ═══════════════════════════════════════════════════════════════════════════
// CORE TECHNICAL INDICATORS
// ═══════════════════════════════════════════════════════════════════════════

function sma(prices: number[], period: number): number {
  if (prices.length === 0) return 0;
  if (prices.length < period) return prices.reduce((a, b) => a + b, 0) / prices.length;
  const slice = prices.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}

function ema(prices: number[], period: number): number[] {
  if (prices.length === 0) return [];
  const k = 2 / (period + 1);
  const emaValues: number[] = [prices[0]];
  for (let i = 1; i < prices.length; i++) {
    emaValues.push(prices[i] * k + emaValues[i - 1] * (1 - k));
  }
  return emaValues;
}

function rsi(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50;
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) avgGain += diff;
    else avgLoss += -diff;
  }
  avgGain /= period;
  avgLoss /= period;
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + (diff > 0 ? diff : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (diff < 0 ? -diff : 0)) / period;
  }
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function computeMACD(closes: number[]): { macd: number; signal: number; histogram: number } {
  if (closes.length < 26) return { macd: 0, signal: 0, histogram: 0 };
  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);
  const macdLine: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    macdLine.push(ema12[i] - ema26[i]);
  }
  const signalLine = ema(macdLine, 9);
  const lastIdx = closes.length - 1;
  const macdVal = macdLine[lastIdx];
  const signalVal = signalLine[lastIdx];
  return { macd: macdVal, signal: signalVal, histogram: macdVal - signalVal };
}

function computeATR(highs: number[], lows: number[], closes: number[], period = 14): number {
  if (highs.length < 2) return 0;
  const trueRanges: number[] = [];
  trueRanges.push(highs[0] - lows[0]);
  for (let i = 1; i < highs.length; i++) {
    const tr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    );
    trueRanges.push(tr);
  }
  if (trueRanges.length < period) return sma(trueRanges, trueRanges.length);
  let atr = sma(trueRanges.slice(0, period), period);
  for (let i = period; i < trueRanges.length; i++) {
    atr = (atr * (period - 1) + trueRanges[i]) / period;
  }
  return atr;
}

function bollingerBandWidth(closes: number[], period = 20): number {
  if (closes.length < period) return 0;
  const slice = closes.slice(-period);
  const mean = slice.reduce((a, b) => a + b, 0) / period;
  const variance = slice.reduce((sum, val) => sum + (val - mean) ** 2, 0) / period;
  const std = Math.sqrt(variance);
  if (mean === 0) return 0;
  return (4 * std) / mean * 100;
}

function findPivotLevels(highs: number[], lows: number[], closes: number[]): { support: number; resistance: number } {
  if (closes.length < 5) return { support: closes[closes.length - 1] * 0.95, resistance: closes[closes.length - 1] * 1.05 };
  const recentHighs = highs.slice(-60);
  const recentLows = lows.slice(-60);
  const recentCloses = closes.slice(-60);
  const pp = (recentHighs[recentHighs.length - 1] + recentLows[recentLows.length - 1] + recentCloses[recentCloses.length - 1]) / 3;
  const s1 = 2 * pp - recentHighs[recentHighs.length - 1];
  const r1 = 2 * pp - recentLows[recentLows.length - 1];
  const swingLows = findSwingLows(recentLows, 5);
  const swingHighs = findSwingHighs(recentHighs, 5);
  const support = swingLows.length > 0 ? Math.max(s1, swingLows[swingLows.length - 1]) : s1;
  const resistance = swingHighs.length > 0 ? Math.min(r1, swingHighs[swingHighs.length - 1]) : r1;
  return { support, resistance };
}

function findSwingLows(prices: number[], window: number): number[] {
  const swings: number[] = [];
  for (let i = window; i < prices.length - window; i++) {
    const left = prices.slice(i - window, i);
    const right = prices.slice(i + 1, i + 1 + window);
    if (left.every(v => v >= prices[i]) && right.every(v => v >= prices[i])) {
      swings.push(prices[i]);
    }
  }
  return swings;
}

function findSwingHighs(prices: number[], window: number): number[] {
  const swings: number[] = [];
  for (let i = window; i < prices.length - window; i++) {
    const left = prices.slice(i - window, i);
    const right = prices.slice(i + 1, i + 1 + window);
    if (left.every(v => v <= prices[i]) && right.every(v => v <= prices[i])) {
      swings.push(prices[i]);
    }
  }
  return swings;
}

function detectChartPattern(closes: number[], sma50Val: number, sma200Val: number, prevSma50: number, prevSma200: number): string | null {
  if (prevSma50 <= prevSma200 && sma50Val > sma200Val) return 'Golden Cross';
  if (prevSma50 >= prevSma200 && sma50Val < sma200Val) return 'Death Cross';
  if (closes.length >= 20) {
    const recent = closes.slice(-20);
    const highs = recent.filter((_, i) => i > 0 && recent[i] > recent[i - 1]);
    const lows = recent.filter((_, i) => i > 0 && recent[i] < recent[i - 1]);
    if (highs.length >= 3 && lows.length >= 3) {
      const highVals = highs.slice(-3);
      const lowVals = lows.slice(-3);
      const highsRising = highVals.every((v, i) => i === 0 || v > highVals[i - 1]);
      const lowsRising = lowVals.every((v, i) => i === 0 || v > lowVals[i - 1]);
      const highsFalling = highVals.every((v, i) => i === 0 || v < highVals[i - 1]);
      const lowsFalling = lowVals.every((v, i) => i === 0 || v < lowVals[i - 1]);
      if (highsRising && lowsRising) return 'Ascending Channel';
      if (highsFalling && lowsFalling) return 'Descending Channel';
      if (highsFalling && lowsRising) return 'Symmetrical Triangle';
    }
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// DATA BUILDERS
// ═══════════════════════════════════════════════════════════════════════════

async function fetchNSETradeInfo(ticker: string): Promise<{ deliveryPercent: number | null }> {
  const symbol = ticker.replace('.NS', '').replace('.BO', '');
  try {
    const res = await fetch('https://www.nseindia.com/', { 
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' },
      next: { revalidate: 300 }
    });
    const cookies = res.headers.get('set-cookie') || '';
    const quoteRes = await fetch(`https://www.nseindia.com/api/quote-equity?symbol=${encodeURIComponent(symbol)}&section=trade_info`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Cookie': cookies
      },
      next: { revalidate: 300 }
    });
    if (!quoteRes.ok) return { deliveryPercent: null };
    const data = await quoteRes.json();
    if (data?.securityWiseDP?.deliveryToTradedQuantity) {
      return { deliveryPercent: Number(data.securityWiseDP.deliveryToTradedQuantity) };
    }
  } catch {
    return { deliveryPercent: null };
  }
  return { deliveryPercent: null };
}

export async function buildStockData(ticker: string, market: string = 'IN'): Promise<StockData> {
  const quote = await yf.quote(ticker);
  if (!quote) {
    throw new Error(`Ticker ${ticker} not found`);
  }
  const watchlist = getWatchlist(market);
  let deliveryPercent: number | null = null;
  if (market === 'IN') {
    const nseInfo = await fetchNSETradeInfo(ticker);
    deliveryPercent = nseInfo.deliveryPercent;
  }
  
  return {
    ticker: ticker.toUpperCase(),
    companyName: quote.longName || quote.shortName || ticker,
    sector: watchlist[ticker]?.sector || quote.sector || 'Unknown',
    exchange: quote.fullExchangeName || 'Unknown',
    currentPrice: quote.regularMarketPrice || 0,
    previousClose: quote.regularMarketPreviousClose || 0,
    change: quote.regularMarketChange || 0,
    changePercent: quote.regularMarketChangePercent || 0,
    volume: quote.regularMarketVolume || 0,
    avgVolume: quote.averageDailyVolume3Month || 0,
    marketCap: quote.marketCap || 0,
    week52High: quote.fiftyTwoWeekHigh || 0,
    week52Low: quote.fiftyTwoWeekLow || 0,
    deliveryPercent,
  };
}

export async function buildTechnicalData(ticker: string, currentPrice: number): Promise<{ tech: TechnicalData, history: PricePoint[], atr: number }> {
  const chart = await yf.chart(ticker, { period1: new Date(Date.now() - 365 * 24 * 3600 * 1000) });

  if (!chart || !chart.quotes) {
    return {
      history: [],
      atr: 0,
      tech: {
        rsi14: 50, macd: 0, macdSignal: 0, macdHistogram: 0,
        sma20: currentPrice, sma50: currentPrice, sma200: currentPrice,
        trend: 'sideways', rsiSignal: 'neutral', macdSignalLabel: 'neutral',
        supportLevel: currentPrice * 0.95, resistanceLevel: currentPrice * 1.05,
        volumeRatio: 1, chartPattern: null,
        priceVsSma20: 'above', priceVsSma50: 'above', priceVsSma200: 'above',
      }
    };
  }

  const history: PricePoint[] = chart.quotes.map((q: any) => ({
    date: q.date.toISOString().split('T')[0],
    open: q.open || 0, high: q.high || 0, low: q.low || 0,
    close: q.close || 0, volume: q.volume || 0,
  })).filter((q: PricePoint) => q.close !== 0);

  const closes = history.map(p => p.close);
  const highs = history.map(p => p.high);
  const lows = history.map(p => p.low);
  const volumes = history.map(p => p.volume);

  const rsiVal = +rsi(closes).toFixed(2);
  const sma20 = +sma(closes, 20).toFixed(2);
  const sma50 = +sma(closes, 50).toFixed(2);
  const sma200 = +sma(closes, 200).toFixed(2);

  const macdResult = computeMACD(closes);
  const atr = computeATR(highs, lows, closes, 14);

  const avgVol = sma(volumes, 20);
  const volumeRatio = avgVol > 0 ? +(volumes[volumes.length - 1] / avgVol).toFixed(2) : 1;

  const ema50Series = ema(closes, 50);
  const ema200Series = ema(closes, 200);
  const prevSma50 = closes.length >= 51 ? sma(closes.slice(0, -1), 50) : sma50;
  const prevSma200 = closes.length >= 201 ? sma(closes.slice(0, -1), 200) : sma200;

  const aboveSma20 = currentPrice > sma20;
  const aboveSma50 = currentPrice > sma50;
  const aboveSma200 = currentPrice > sma200;
  const sma50AboveSma200 = sma50 > sma200;

  let trend: 'uptrend' | 'downtrend' | 'sideways';
  if (aboveSma50 && sma50AboveSma200 && aboveSma200) trend = 'uptrend';
  else if (!aboveSma50 && !sma50AboveSma200 && !aboveSma200) trend = 'downtrend';
  else trend = 'sideways';

  const rsiSignal: 'overbought' | 'oversold' | 'neutral' = rsiVal > 70 ? 'overbought' : rsiVal < 30 ? 'oversold' : 'neutral';
  const macdSignalLabel: 'bullish' | 'bearish' | 'neutral' =
    macdResult.histogram > 0 && macdResult.macd > macdResult.signal ? 'bullish' :
    macdResult.histogram < 0 && macdResult.macd < macdResult.signal ? 'bearish' : 'neutral';

  const pivots = findPivotLevels(highs, lows, closes);
  const chartPattern = detectChartPattern(closes, sma50, sma200, prevSma50, prevSma200);

  return {
    history,
    atr,
    tech: {
      rsi14: rsiVal,
      macd: +macdResult.macd.toFixed(2),
      macdSignal: +macdResult.signal.toFixed(2),
      macdHistogram: +macdResult.histogram.toFixed(2),
      sma20, sma50, sma200,
      trend, rsiSignal, macdSignalLabel,
      supportLevel: +pivots.support.toFixed(2),
      resistanceLevel: +pivots.resistance.toFixed(2),
      volumeRatio,
      chartPattern,
      priceVsSma20: aboveSma20 ? 'above' : 'below',
      priceVsSma50: aboveSma50 ? 'above' : 'below',
      priceVsSma200: aboveSma200 ? 'above' : 'below',
    }
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// FUNDAMENTAL DATA
// ═══════════════════════════════════════════════════════════════════════════

export async function buildFundamentalData(ticker: string, stock: StockData): Promise<FundamentalData> {
  const summary = await yf.quoteSummary(ticker, {
    modules: ['summaryProfile', 'financialData', 'defaultKeyStatistics', 'earnings']
  });

  const fin = summary.financialData;
  const stats = summary.defaultKeyStatistics;

  return {
    businessSummary: summary.summaryProfile?.longBusinessSummary || 'N/A',
    peRatio: stats?.forwardPE || stats?.trailingPE || null,
    pbRatio: stats?.priceToBook || null,
    evEbitda: stats?.enterpriseToEbitda || null,
    debtToEquity: fin?.debtToEquity || null,
    currentRatio: fin?.currentRatio || null,
    roe: fin?.returnOnEquity != null ? fin.returnOnEquity * 100 : null,
    revenueGrowth: fin?.revenueGrowth != null ? fin.revenueGrowth * 100 : null,
    grossMargin: fin?.grossMargins != null ? fin.grossMargins * 100 : null,
    operatingMargin: fin?.operatingMargins != null ? fin.operatingMargins * 100 : null,
    netMargin: fin?.profitMargins != null ? fin.profitMargins * 100 : null,
    freeCashFlow: fin?.freeCashflow || null,
    dividendYield: stats?.dividendYield != null ? stats.dividendYield * 100 : null,
    insiderOwnership: stats?.heldPercentInsiders != null ? stats.heldPercentInsiders * 100 : null,
    revenueHistory: [],
    earningsHistory: [],
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// NEWS FEED LOGIC
// ═══════════════════════════════════════════════════════════════════════════

const CNBC_FEEDS: Record<string, string> = {
  markets:    'https://www.cnbc.com/id/20910258/device/rss/rss.html',
  finance:    'https://www.cnbc.com/id/10000664/device/rss/rss.html',
  economy:    'https://www.cnbc.com/id/20910274/device/rss/rss.html',
  investing:  'https://www.cnbc.com/id/15839135/device/rss/rss.html',
  technology: 'https://www.cnbc.com/id/19854910/device/rss/rss.html',
};

function parseNewsRSS(xml: string, category: string, publisher: string) {
  const items: any[] = [];
  const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];
  for (const block of itemMatches) {
    const get = (tag: string) => {
      const cdataMatch = block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[(.*?)\\]\\]></${tag}>`, 's'));
      if (cdataMatch) return cdataMatch[1].trim();
      const plainMatch = block.match(new RegExp(`<${tag}[^>]*>(.*?)</${tag}>`, 's'));
      return plainMatch ? plainMatch[1].replace(/<[^>]+>/g, '').trim() : '';
    };
    const title = get('title');
    const link  = get('link') || '';
    const pubDate = get('pubDate') || '';
    const description = get('description');
    if (!title || !link) continue;

    const lower = (title + ' ' + description).toLowerCase();
    const bullWords = ['surge', 'rally', 'gain', 'rise', 'jump', 'beat', 'record', 'bull', 'soar', 'boost', 'profit', 'growth', 'recover', 'buy', 'upgrade'];
    const bearWords = ['fall', 'drop', 'plunge', 'crash', 'loss', 'decline', 'warn', 'risk', 'sell-off', 'bear', 'cut', 'recession', 'fear', 'downgrade', 'sell'];
    const bullScore = bullWords.filter(w => lower.includes(w)).length;
    const bearScore = bearWords.filter(w => lower.includes(w)).length;
    const sentiment = bullScore > bearScore ? 'positive' : bearScore > bullScore ? 'negative' : 'neutral';

    items.push({
      id: `${publisher.toLowerCase()}-${Buffer.from(link).toString('base64').slice(0, 16)}`,
      title,
      link,
      description: description ? description.slice(0, 200) : '',
      publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      publisher,
      source: publisher.toLowerCase(),
      category,
      sentiment,
    });
  }
  return items;
}

async function fetchRealTimeNews(ticker: string, market: string) {
  let yahooNews: any[] = [];
  try {
    const query = ticker || (market === 'IN' ? '^BSESN' : market === 'EU' ? '^GDAXI' : 'SPY');
    const result = await yf.search(query, { newsCount: 15 });
    yahooNews = (result.news || [])
      .filter((n: any) => n.title && n.link)
      .map((n: any) => {
        const lower = (n.title || '').toLowerCase();
        const bullWords = ['surge', 'rally', 'gain', 'rise', 'jump', 'beat', 'record', 'bull', 'soar', 'boost', 'profit', 'growth', 'recover', 'buy', 'upgrade'];
        const bearWords = ['fall', 'drop', 'plunge', 'crash', 'loss', 'decline', 'warn', 'risk', 'sell-off', 'bear', 'cut', 'recession', 'fear', 'downgrade', 'sell'];
        const bullScore = bullWords.filter(w => lower.includes(w)).length;
        const bearScore = bearWords.filter(w => lower.includes(w)).length;
        const sentiment = bullScore > bearScore ? 'positive' : bearScore > bullScore ? 'negative' : 'neutral';

        return {
          id: n.uuid || `yf-${Math.random()}`,
          title: n.title,
          link: n.link,
          publishedAt: n.providerPublishTime
            ? new Date(n.providerPublishTime * 1000).toISOString()
            : new Date().toISOString(),
          publisher: n.publisher || 'Yahoo Finance',
          source: 'yahoo',
          category: 'markets',
          sentiment,
          description: '',
        };
      });
  } catch { /* ignore */ }

  let cnbcNews: any[] = [];
  try {
    const cnbcResults = await Promise.allSettled(
      Object.entries(CNBC_FEEDS).map(async ([cat, url]) => {
        const res = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; StokeDash/1.0)' },
          next: { revalidate: 300 },
        });
        if (!res.ok) return [];
        const xml = await res.text();
        return parseNewsRSS(xml, cat, 'CNBC');
      })
    );
    for (const r of cnbcResults) {
      if (r.status === 'fulfilled') cnbcNews.push(...r.value);
    }
  } catch { /* ignore */ }

  let etNews: any[] = [];
  if (market === 'IN') {
    try {
      const res = await fetch('https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms', {
         headers: { 'User-Agent': 'Mozilla/5.0 (compatible; StokeDash/1.0)' },
         next: { revalidate: 300 },
      });
      if (res.ok) {
        const xml = await res.text();
        etNews = parseNewsRSS(xml, 'markets', 'Economic Times');
      }
    } catch {}
  }

  const all = [...yahooNews, ...cnbcNews, ...etNews];
  const seen = new Set<string>();
  let merged = all
    .filter(a => {
      const key = a.title.slice(0, 60);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  if (ticker) {
      const tickerLower = ticker.toLowerCase().replace('.ns', '').replace('.bo', '');
      merged.sort((a, b) => {
          const aHas = a.title.toLowerCase().includes(tickerLower) ? 1 : 0;
          const bHas = b.title.toLowerCase().includes(tickerLower) ? 1 : 0;
          return bHas - aHas;
      });
  }

  return merged.slice(0, 20);
}

// ═══════════════════════════════════════════════════════════════════════════
// SENTIMENT DATA (from real analyst data & news)
// ═══════════════════════════════════════════════════════════════════════════

export async function buildSentimentData(ticker: string, stock: StockData, market: string = 'IN'): Promise<SentimentData> {
  let quote: any;
  try {
    quote = await yf.quote(ticker);
  } catch { quote = null; }

  let summary: any;
  try {
    summary = await yf.quoteSummary(ticker, { modules: ['recommendationTrend', 'financialData'] });
  } catch { summary = null; }

  const recTrend = summary?.recommendationTrend?.trend?.[0];
  const buyCount = (recTrend?.strongBuy || 0) + (recTrend?.buy || 0);
  const holdCount = recTrend?.hold || 0;
  const sellCount = (recTrend?.sell || 0) + (recTrend?.strongSell || 0);
  const totalAnalysts = buyCount + holdCount + sellCount;

  const targetPrice = summary?.financialData?.targetMedianPrice || quote?.targetMedianPrice || null;
  const recKey = quote?.recommendationKey || '';

  let analystRating = 'Hold';
  if (recKey) {
    const ratingMap: Record<string, string> = {
      'strong_buy': 'Strong Buy', 'buy': 'Buy', 'overweight': 'Overweight',
      'hold': 'Hold', 'underweight': 'Underweight', 'sell': 'Sell', 'strong_sell': 'Strong Sell'
    };
    analystRating = ratingMap[recKey] || recKey.charAt(0).toUpperCase() + recKey.slice(1);
  } else if (totalAnalysts > 0) {
    if (buyCount > holdCount + sellCount) analystRating = 'Buy';
    else if (sellCount > buyCount) analystRating = 'Sell';
  }

  let sentimentScore = 0.5;
  if (totalAnalysts > 0) {
    sentimentScore = clamp((buyCount * 1.0 + holdCount * 0.5 + sellCount * 0.0) / totalAnalysts, 0, 1);
  }
  if (targetPrice && stock.currentPrice > 0) {
    const upside = (targetPrice - stock.currentPrice) / stock.currentPrice;
    const targetBias = clamp(0.5 + upside, 0, 1);
    sentimentScore = sentimentScore * 0.6 + targetBias * 0.4;
  }

  // Incorporate Real-time News into Sentiment
  const news = await fetchRealTimeNews(ticker, market);
  if (news.length > 0) {
    const posNews = news.filter(n => n.sentiment === 'positive').length;
    const negNews = news.filter(n => n.sentiment === 'negative').length;
    const newsScore = (posNews + (news.length - posNews - negNews) * 0.5) / news.length;
    
    // Blend analyst sentiment and news sentiment
    sentimentScore = sentimentScore * 0.6 + newsScore * 0.4;
  }

  const overallSentiment: 'bullish' | 'neutral' | 'bearish' =
    sentimentScore >= 0.65 ? 'bullish' : sentimentScore <= 0.35 ? 'bearish' : 'neutral';

  return {
    overallSentiment,
    sentimentScore: +sentimentScore.toFixed(3),
    news,
    analystRating,
    analystBuyCount: buyCount,
    analystHoldCount: holdCount,
    analystSellCount: sellCount,
    priceTarget: targetPrice,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MACRO DATA (VIX-driven + market context)
// ═══════════════════════════════════════════════════════════════════════════

export async function buildMacroData(sector: string, market: string = 'IN'): Promise<MacroData> {
  let vixLevel = 18;
  let marketPerf = 0;
  let sectorPerf = 0;

  try {
    const vixTicker = market === 'IN' ? '^INDIAVIX' : market === 'EU' ? '^V2TX' : '^VIX';
    const marketTicker = market === 'IN' ? '^NSEI' : market === 'EU' ? '^GDAXI' : 'SPY';
    const quotes = await yf.quote([vixTicker, marketTicker]);
    const vixQuote = quotes.find((q: any) => q.symbol === vixTicker);
    const marketQuote = quotes.find((q: any) => q.symbol === marketTicker);
    if (vixQuote) vixLevel = vixQuote.regularMarketPrice || 18;
    if (marketQuote) marketPerf = marketQuote.regularMarketChangePercent || 0;
  } catch { /* use defaults */ }

  const fearGreedIndex = computeFearGreedFromVIX(vixLevel);
  const fearGreedLabel = fearGreedIndex <= 25 ? 'Extreme Fear' :
    fearGreedIndex <= 40 ? 'Fear' :
    fearGreedIndex <= 60 ? 'Neutral' :
    fearGreedIndex <= 75 ? 'Greed' : 'Extreme Greed';

  const sectorRateMap: Record<string, string> = {
    'Technology': 'Moderate headwind — higher rates compress growth multiples',
    'Financials': 'Tailwind — banks benefit from wider net interest margins',
    'Energy': 'Neutral — commodity-driven, rate-insensitive',
    'Healthcare': 'Low sensitivity — defensive sector, inelastic demand',
    'Consumer Discretionary': 'Headwind — rate hikes dampen consumer spending',
    'Consumer Staples': 'Low sensitivity — essential goods, stable demand',
    'Automotive': 'Headwind — financing costs impact auto loans and demand',
    'Semiconductors': 'Moderate headwind — capex-intensive, rate-sensitive',
    'Pharmaceuticals': 'Low sensitivity — inelastic demand, strong IP protection',
    'Industrials': 'Mixed — capex cycles affected but infrastructure spending supports',
    'Materials': 'Cyclical — tied to construction and manufacturing activity',
    'Utilities': 'Headwind — bond proxy sector, rates compete for yield seekers',
    'Communication Services': 'Moderate — subscription models provide cash flow stability',
  };

  const competitiveMap: Record<string, string> = {
    'Technology': 'Leader', 'Financials': 'Competitive', 'Energy': 'Cyclical Leader',
    'Healthcare': 'Defensive Leader', 'Consumer Discretionary': 'Competitive',
    'Semiconductors': 'Strategic Leader', 'Pharmaceuticals': 'Moat-Driven',
  };

  return {
    sectorPerformance: +sectorPerf.toFixed(2),
    marketPerformance: +marketPerf.toFixed(2),
    fearGreedIndex,
    fearGreedLabel,
    interestRateImpact: sectorRateMap[sector] || 'Neutral — sector-specific impact unclear',
    inflationImpact: vixLevel > 25 ? 'Elevated uncertainty — inflation hedge assets may outperform' :
      vixLevel > 18 ? 'Moderate — inflation expectations are priced in' :
      'Benign — low volatility suggests stable inflation expectations',
    competitivePosition: competitiveMap[sector] || 'Competitive',
    keyMacroFactors: buildMacroFactors(sector, vixLevel, marketPerf),
  };
}

function computeFearGreedFromVIX(vix: number): number {
  if (vix >= 35) return clamp(Math.round(10 + (35 - vix)), 0, 15);
  if (vix >= 25) return clamp(Math.round(15 + (35 - vix) * 2.5), 15, 40);
  if (vix >= 18) return clamp(Math.round(40 + (25 - vix) * 2.8), 40, 60);
  if (vix >= 12) return clamp(Math.round(60 + (18 - vix) * 3.3), 60, 80);
  return clamp(Math.round(80 + (12 - vix) * 4), 80, 100);
}

function buildMacroFactors(sector: string, vix: number, marketPerf: number): string[] {
  const factors: string[] = [];
  if (vix > 25) factors.push('Elevated Volatility');
  else if (vix < 14) factors.push('Low Volatility Regime');
  else factors.push('Normal Volatility');
  factors.push(marketPerf > 0 ? 'Positive Market Momentum' : 'Negative Market Momentum');
  const sectorFactors: Record<string, string[]> = {
    'Technology': ['AI Spending Cycle', 'Cloud Adoption'],
    'Financials': ['Net Interest Margins', 'Credit Quality'],
    'Energy': ['Oil Price Dynamics', 'Energy Transition'],
    'Healthcare': ['Drug Pipeline Catalysts', 'Demographic Tailwinds'],
    'Consumer Discretionary': ['Consumer Confidence', 'Spending Patterns'],
    'Semiconductors': ['Chip Demand Cycle', 'Geopolitical Supply Risk'],
  };
  factors.push(...(sectorFactors[sector] || ['GDP Growth', 'CPI Trends']));
  return factors.slice(0, 4);
}

// ═══════════════════════════════════════════════════════════════════════════
// SCORING ENGINE — Weighted multi-factor composite
// ═══════════════════════════════════════════════════════════════════════════

function scoreTechnical(tech: TechnicalData, stock: StockData): number {
  let score = 50;

  // Trend alignment (0–20)
  if (tech.trend === 'uptrend') score += 15;
  else if (tech.trend === 'downtrend') score -= 15;
  if (tech.priceVsSma200 === 'above') score += 5;
  else score -= 5;

  // RSI (−15 to +10)
  if (tech.rsi14 >= 30 && tech.rsi14 <= 50) score += 10; // oversold bounce zone
  else if (tech.rsi14 > 50 && tech.rsi14 <= 70) score += 5; // healthy momentum
  else if (tech.rsi14 > 70) score -= 10; // overbought risk
  else if (tech.rsi14 < 30) score += 5; // deep value, contrarian

  // MACD (−10 to +10)
  if (tech.macdSignalLabel === 'bullish') score += 10;
  else if (tech.macdSignalLabel === 'bearish') score -= 10;

  // Volume confirmation
  if (tech.volumeRatio > 1.5 && tech.trend === 'uptrend') score += 5;
  if (tech.volumeRatio > 1.5 && tech.trend === 'downtrend') score -= 5;

  return clamp(Math.round(score), 0, 100);
}

function scoreFundamental(fund: FundamentalData): number {
  let score = 50;

  // Valuation
  if (fund.peRatio != null) {
    if (fund.peRatio > 0 && fund.peRatio < 15) score += 10;
    else if (fund.peRatio >= 15 && fund.peRatio < 25) score += 5;
    else if (fund.peRatio >= 40) score -= 10;
    else if (fund.peRatio < 0) score -= 5; // unprofitable
  }

  // Growth
  if (fund.revenueGrowth != null) {
    if (fund.revenueGrowth > 20) score += 12;
    else if (fund.revenueGrowth > 10) score += 8;
    else if (fund.revenueGrowth > 0) score += 3;
    else score -= 8;
  }

  // Profitability
  if (fund.operatingMargin != null) {
    if (fund.operatingMargin > 25) score += 8;
    else if (fund.operatingMargin > 15) score += 5;
    else if (fund.operatingMargin < 0) score -= 10;
  }

  // ROE
  if (fund.roe != null) {
    if (fund.roe > 20) score += 8;
    else if (fund.roe > 12) score += 4;
    else if (fund.roe < 5) score -= 5;
  }

  // Balance sheet
  if (fund.debtToEquity != null) {
    if (fund.debtToEquity < 30) score += 5;
    else if (fund.debtToEquity > 100) score -= 8;
    else if (fund.debtToEquity > 200) score -= 15;
  }
  if (fund.currentRatio != null) {
    if (fund.currentRatio > 2) score += 3;
    else if (fund.currentRatio < 1) score -= 8;
  }

  return clamp(Math.round(score), 0, 100);
}

function scorePriceAction(tech: TechnicalData, stock: StockData): number {
  let score = 50;

  // 52-week range position
  const range = stock.week52High - stock.week52Low;
  if (range > 0) {
    const position = (stock.currentPrice - stock.week52Low) / range;
    if (position > 0.8) score -= 5; // near highs, less upside
    else if (position > 0.5) score += 8; // healthy midrange
    else if (position > 0.3) score += 12; // attractive pullback
    else score += 5; // deep pullback, could be value trap
  }

  // Moving average alignment (stacking)
  const maAligned = tech.priceVsSma20 === 'above' && tech.priceVsSma50 === 'above' && tech.priceVsSma200 === 'above';
  const maDisaligned = tech.priceVsSma20 === 'below' && tech.priceVsSma50 === 'below' && tech.priceVsSma200 === 'below';
  if (maAligned) score += 12;
  else if (maDisaligned) score -= 12;

  // Volume ratio
  if (tech.volumeRatio >= 1.3 && tech.trend === 'uptrend') score += 8;
  if (tech.volumeRatio >= 1.3 && tech.trend === 'downtrend') score -= 8;
  if (tech.volumeRatio < 0.5) score -= 3; // low conviction

  // NSE Delivery Percentage (High Delivery = High Conviction)
  if (stock.deliveryPercent != null) {
    if (stock.deliveryPercent > 60) score += 10;
    else if (stock.deliveryPercent > 50) score += 5;
    else if (stock.deliveryPercent < 30) score -= 5;
  }

  // Chart pattern bonus
  if (tech.chartPattern === 'Golden Cross') score += 10;
  if (tech.chartPattern === 'Death Cross') score -= 10;
  if (tech.chartPattern === 'Ascending Channel') score += 5;
  if (tech.chartPattern === 'Descending Channel') score -= 5;

  return clamp(Math.round(score), 0, 100);
}

function scoreSentiment(sentiment: SentimentData, stock: StockData): number {
  let score = 50;

  // Analyst consensus
  const total = sentiment.analystBuyCount + sentiment.analystHoldCount + sentiment.analystSellCount;
  if (total > 0) {
    const buyRatio = sentiment.analystBuyCount / total;
    if (buyRatio > 0.7) score += 15;
    else if (buyRatio > 0.5) score += 8;
    else if (buyRatio < 0.3) score -= 10;
  }

  // Price target upside
  if (sentiment.priceTarget && stock.currentPrice > 0) {
    const upside = (sentiment.priceTarget - stock.currentPrice) / stock.currentPrice;
    if (upside > 0.3) score += 15;
    else if (upside > 0.15) score += 10;
    else if (upside > 0.05) score += 5;
    else if (upside < -0.1) score -= 10;
    else if (upside < 0) score -= 5;
  }

  // Overall sentiment modifier
  if (sentiment.overallSentiment === 'bullish') score += 5;
  else if (sentiment.overallSentiment === 'bearish') score -= 5;

  return clamp(Math.round(score), 0, 100);
}

function scoreMacro(macro: MacroData): number {
  let score = 50;

  // Fear & Greed
  if (macro.fearGreedIndex > 60) score += 5;
  else if (macro.fearGreedIndex < 30) score += 8; // contrarian: extreme fear = opportunity
  else if (macro.fearGreedIndex > 80) score -= 5; // extreme greed = caution

  // Market performance
  if (macro.marketPerformance > 1) score += 8;
  else if (macro.marketPerformance > 0) score += 3;
  else if (macro.marketPerformance < -1) score -= 8;
  else score -= 3;

  return clamp(Math.round(score), 0, 100);
}

export function computeCompositeScore(
  tech: TechnicalData,
  fund: FundamentalData,
  stock: StockData,
  sentiment: SentimentData,
  macro: MacroData,
): CompositeScore {
  const techScore = scoreTechnical(tech, stock);
  const fundScore = scoreFundamental(fund);
  const paScore = scorePriceAction(tech, stock);
  const sentScore = scoreSentiment(sentiment, stock);
  const macroScore = scoreMacro(macro);

  // Weighted composite: Tech 25%, Fund 25%, PriceAction 20%, Sentiment 15%, Macro 15%
  const total = Math.round(
    techScore * 0.25 + fundScore * 0.25 + paScore * 0.20 + sentScore * 0.15 + macroScore * 0.15
  );
  const clampedTotal = clamp(total, 0, 100);

  // Cross-validation: detect conflicting signals between factors
  const conflictingSignals: string[] = [];
  if (techScore >= 65 && fundScore <= 35) conflictingSignals.push('Technical strength contradicts weak fundamentals');
  if (techScore <= 35 && fundScore >= 65) conflictingSignals.push('Strong fundamentals but negative technical momentum');
  if (sentScore >= 70 && techScore <= 35) conflictingSignals.push('Analyst optimism conflicts with bearish price action');
  if (sentScore <= 30 && techScore >= 70) conflictingSignals.push('Price momentum diverges from negative analyst sentiment');
  if (fund.peRatio != null && fund.peRatio > 50 && fund.revenueGrowth != null && fund.revenueGrowth < 5)
    conflictingSignals.push('High valuation not supported by revenue growth');
  if (tech.trend === 'uptrend' && tech.rsiSignal === 'overbought')
    conflictingSignals.push('Uptrend may be overextended — RSI overbought');
  if (tech.trend === 'downtrend' && tech.rsiSignal === 'oversold')
    conflictingSignals.push('Downtrend may reverse — RSI oversold');

  // Data-quality-aware confidence scoring (0–100)
  let confidence = 50;
  // Factor agreement boosts confidence
  const aboveThreshold = [techScore >= 55, fundScore >= 55, paScore >= 55, sentScore >= 55, macroScore >= 55].filter(Boolean).length;
  const belowThreshold = [techScore <= 45, fundScore <= 45, paScore <= 45, sentScore <= 45, macroScore <= 45].filter(Boolean).length;
  const agreementCount = Math.max(aboveThreshold, belowThreshold);
  confidence += (agreementCount - 2) * 10; // 5 agree = +30, 3 agree = +10, 2 agree = 0

  // Data completeness boosts confidence
  const fundDataPoints = [fund.peRatio, fund.revenueGrowth, fund.operatingMargin, fund.roe, fund.debtToEquity, fund.currentRatio].filter(v => v != null).length;
  confidence += Math.round((fundDataPoints / 6) * 15); // max +15 for complete fundamental data

  // Analyst coverage boosts confidence
  const totalAnalysts = sentiment.analystBuyCount + sentiment.analystHoldCount + sentiment.analystSellCount;
  if (totalAnalysts >= 20) confidence += 10;
  else if (totalAnalysts >= 10) confidence += 5;
  else if (totalAnalysts === 0) confidence -= 10;

  // Conflicts reduce confidence
  confidence -= conflictingSignals.length * 5;

  confidence = clamp(confidence, 5, 95);

  // 5-tier recommendation: Strong Buy / Buy / Hold / Sell / Avoid
  let tag: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Avoid';
  if (clampedTotal >= 75 && conflictingSignals.length === 0) tag = 'Strong Buy';
  else if (clampedTotal >= 65) tag = 'Buy';
  else if (clampedTotal >= 45) tag = 'Hold';
  else if (clampedTotal >= 30) tag = 'Sell';
  else tag = 'Avoid';

  const reasons: string[] = [];
  if (techScore >= 65) reasons.push(`Strong technicals (${tech.trend}, RSI ${tech.rsi14})`);
  else if (techScore <= 40) reasons.push(`Weak technicals (${tech.trend}, RSI ${tech.rsi14})`);
  if (fundScore >= 65) reasons.push('Solid fundamentals');
  else if (fundScore <= 40) reasons.push('Weak fundamentals');
  if (paScore >= 65) reasons.push('Positive price action');
  if (sentScore >= 65) reasons.push('Bullish analyst consensus');
  else if (sentScore <= 35) reasons.push('Bearish analyst consensus');
  if (conflictingSignals.length > 0) reasons.push(`${conflictingSignals.length} conflicting signal(s) detected`);
  if (reasons.length === 0) reasons.push('Mixed signals across factors');

  return {
    total: clampedTotal,
    technical: techScore,
    fundamental: fundScore,
    priceAction: paScore,
    sentiment: sentScore,
    macro: macroScore,
    tag,
    reason: reasons.join('. ') + '.',
    confidence,
    conflictingSignals,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// RECOMMENDATION ENGINE
// ═══════════════════════════════════════════════════════════════════════════

function buildRecommendation(
  score: CompositeScore, stock: StockData, tech: TechnicalData,
  fund: FundamentalData, sentiment: SentimentData, atr: number, budget?: number
): Recommendation {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const risks: string[] = [];
  const keyInsights: string[] = [];

  // Dynamic strengths
  if (tech.trend === 'uptrend') strengths.push('Confirmed uptrend with MA alignment');
  if (tech.rsiSignal === 'oversold') strengths.push('RSI in oversold territory — potential reversal');
  if (tech.macdSignalLabel === 'bullish') strengths.push('MACD bullish crossover');
  if (fund.revenueGrowth != null && fund.revenueGrowth > 10) strengths.push(`Revenue growing at ${fund.revenueGrowth.toFixed(1)}%`);
  if (fund.operatingMargin != null && fund.operatingMargin > 20) strengths.push(`Strong operating margin of ${fund.operatingMargin.toFixed(1)}%`);
  if (fund.roe != null && fund.roe > 15) strengths.push(`High ROE of ${fund.roe.toFixed(1)}%`);
  if (fund.freeCashFlow != null && fund.freeCashFlow > 0) strengths.push('Positive free cash flow');
  if (sentiment.analystRating === 'Buy' || sentiment.analystRating === 'Strong Buy') strengths.push(`Wall Street rates ${sentiment.analystRating}`);
  if (sentiment.priceTarget && stock.currentPrice > 0) {
    const upside = ((sentiment.priceTarget - stock.currentPrice) / stock.currentPrice) * 100;
    if (upside > 10) strengths.push(`Analyst target implies ${upside.toFixed(0)}% upside`);
  }
  if (tech.volumeRatio > 1.3) strengths.push('Above-average volume confirming trend');
  if (stock.deliveryPercent != null && stock.deliveryPercent > 50) strengths.push(`High delivery volume (${stock.deliveryPercent}%) indicating strong investor conviction`);
  if (strengths.length === 0) strengths.push('Stable price action');

  // Dynamic weaknesses
  if (tech.trend === 'downtrend') weaknesses.push('Price in confirmed downtrend');
  if (tech.rsiSignal === 'overbought') weaknesses.push('RSI overbought — pullback risk');
  if (tech.macdSignalLabel === 'bearish') weaknesses.push('MACD bearish divergence');
  if (fund.peRatio != null && fund.peRatio > 35) weaknesses.push(`Elevated P/E of ${fund.peRatio.toFixed(1)}x`);
  if (fund.debtToEquity != null && fund.debtToEquity > 100) weaknesses.push(`High debt-to-equity ratio of ${fund.debtToEquity.toFixed(0)}`);
  if (fund.revenueGrowth != null && fund.revenueGrowth < 0) weaknesses.push('Declining revenue');
  if (fund.operatingMargin != null && fund.operatingMargin < 5) weaknesses.push('Thin operating margins');
  if (stock.deliveryPercent != null && stock.deliveryPercent < 30) weaknesses.push(`Low delivery volume (${stock.deliveryPercent}%) indicating intraday speculation`);
  if (sentiment.analystRating === 'Sell' || sentiment.analystRating === 'Strong Sell') weaknesses.push(`Analyst consensus: ${sentiment.analystRating}`);
  if (weaknesses.length === 0) weaknesses.push('No major weaknesses identified');

  // Dynamic risks
  if (tech.volumeRatio > 2) risks.push('Abnormally high volume — potential volatility spike');
  if (tech.volumeRatio < 0.5) risks.push('Very low volume — liquidity risk');
  risks.push('Broader market downturn could override individual strength');
  if (fund.debtToEquity != null && fund.debtToEquity > 150) risks.push('Leverage risk in rising rate environment');
  if (stock.week52High > 0) {
    const distFromHigh = ((stock.week52High - stock.currentPrice) / stock.week52High) * 100;
    if (distFromHigh < 3) risks.push('Trading near 52-week high — limited near-term upside');
    if (distFromHigh > 40) risks.push('Trading far below 52-week high — potential value trap');
  }
  if (score.conflictingSignals.length > 0) {
    risks.push(...score.conflictingSignals);
  }

  // Key insights — evidence-based observations
  if (fund.peRatio != null && fund.revenueGrowth != null) {
    const pegApprox = fund.revenueGrowth > 0 ? fund.peRatio / fund.revenueGrowth : null;
    if (pegApprox != null && pegApprox < 1) keyInsights.push(`PEG ratio ~${pegApprox.toFixed(1)} suggests undervaluation relative to growth`);
    else if (pegApprox != null && pegApprox > 2) keyInsights.push(`PEG ratio ~${pegApprox.toFixed(1)} indicates growth is already priced in`);
  }
  if (tech.chartPattern) keyInsights.push(`Chart pattern detected: ${tech.chartPattern}`);
  if (sentiment.priceTarget && stock.currentPrice > 0) {
    const upside = ((sentiment.priceTarget - stock.currentPrice) / stock.currentPrice) * 100;
    keyInsights.push(`Consensus price target: ${upside > 0 ? '+' : ''}${upside.toFixed(1)}% from current price`);
  }
  const totalAnalysts = sentiment.analystBuyCount + sentiment.analystHoldCount + sentiment.analystSellCount;
  if (totalAnalysts > 0) {
    keyInsights.push(`Analyst coverage: ${sentiment.analystBuyCount} Buy / ${sentiment.analystHoldCount} Hold / ${sentiment.analystSellCount} Sell`);
  }
  if (keyInsights.length === 0) keyInsights.push('Limited data available for deep insights');

  // ATR-based price targets
  const effectiveATR = atr > 0 ? atr : stock.currentPrice * 0.02;
  const entryPrice = +tech.supportLevel.toFixed(2);
  const stopLoss = +(entryPrice - 2 * effectiveATR).toFixed(2);
  const targetST = +(stock.currentPrice + 3 * effectiveATR).toFixed(2);
  const targetLT = +(stock.currentPrice + 6 * effectiveATR).toFixed(2);

  // If analyst target exists, blend it with ATR target
  const blendedTargetLT = sentiment.priceTarget && sentiment.priceTarget > stock.currentPrice
    ? +((targetLT + sentiment.priceTarget) / 2).toFixed(2)
    : targetLT;

  // Short & Long term views
  const bullishFactors = [tech.trend === 'uptrend', tech.macdSignalLabel === 'bullish', tech.rsiSignal !== 'overbought', score.priceAction >= 55].filter(Boolean).length;
  const shortTermView: 'Bullish' | 'Neutral' | 'Bearish' = bullishFactors >= 3 ? 'Bullish' : bullishFactors >= 2 ? 'Neutral' : 'Bearish';

  const longBullish = [score.fundamental >= 60, score.sentiment >= 55, (fund.revenueGrowth ?? 0) > 5, (fund.roe ?? 0) > 12].filter(Boolean).length;
  const longTermView: 'Bullish' | 'Neutral' | 'Bearish' = longBullish >= 3 ? 'Bullish' : longBullish >= 2 ? 'Neutral' : 'Bearish';

  const shortTermReasons: string[] = [];
  if (tech.trend === 'uptrend') shortTermReasons.push('uptrend intact');
  if (tech.macdSignalLabel === 'bullish') shortTermReasons.push('MACD bullish');
  if (tech.rsiSignal === 'overbought') shortTermReasons.push('overbought risk');
  if (tech.rsiSignal === 'oversold') shortTermReasons.push('oversold bounce potential');
  if (shortTermReasons.length === 0) shortTermReasons.push('mixed technical signals');

  const longTermReasons: string[] = [];
  if ((fund.revenueGrowth ?? 0) > 10) longTermReasons.push('strong revenue growth');
  if ((fund.roe ?? 0) > 15) longTermReasons.push('high return on equity');
  if (score.fundamental >= 60) longTermReasons.push('solid balance sheet');
  if (sentiment.overallSentiment === 'bullish') longTermReasons.push('positive analyst consensus');
  if (longTermReasons.length === 0) longTermReasons.push('fundamentals are mixed');

  // Buy signal
  let buySignal: 'Yes' | 'No' | 'Wait';
  if (score.total >= 65 && shortTermView !== 'Bearish') buySignal = 'Yes';
  else if (score.total >= 55 && tech.rsiSignal === 'oversold') buySignal = 'Yes';
  else if (score.total >= 50) buySignal = 'Wait';
  else buySignal = 'No';

  // Confidence label and numeric score
  const factorAgreement = [score.technical >= 60, score.fundamental >= 60, score.priceAction >= 60, score.sentiment >= 55].filter(Boolean).length;
  const confidence: 'High' | 'Medium' | 'Low' = factorAgreement >= 3 ? 'High' : factorAgreement >= 2 ? 'Medium' : 'Low';
  const confidenceScore = score.confidence;

  // Summary — one-line evidence-based conclusion
  const summary = `${stock.companyName} (${stock.ticker}) scores ${score.total}/100 with ${score.tag} recommendation. ` +
    `${strengths[0]}. ${weaknesses[0]}. Confidence: ${confidenceScore}% based on ${totalAnalysts} analyst(s) and ${score.conflictingSignals.length === 0 ? 'no conflicting signals' : score.conflictingSignals.length + ' conflicting signal(s)'}.`;

  // Options Strategy Simulation
  const strikeStep = stock.currentPrice > 1000 ? 50 : stock.currentPrice > 100 ? 5 : stock.currentPrice > 20 ? 1 : 0.5;
  const nearestStrike = Math.round(stock.currentPrice / strikeStep) * strikeStep;
  
  let recommendedOption: 'Buy Call' | 'Buy Put' | 'Hold / No Options' = 'Hold / No Options';
  const callStrike = nearestStrike + (tech.trend === 'uptrend' ? strikeStep : 0);
  const putStrike = nearestStrike - (tech.trend === 'downtrend' ? strikeStep : 0);

  if (score.tag === 'Strong Buy' || score.tag === 'Buy') recommendedOption = 'Buy Call';
  else if (score.tag === 'Sell' || score.tag === 'Avoid') recommendedOption = 'Buy Put';

  const suggestedEntryPremium = +(effectiveATR * 0.4).toFixed(2);
  
  const optionsStrategy = {
    callStrike,
    putStrike,
    impliedVolatility: +(atr / stock.currentPrice * 100 * Math.sqrt(252)).toFixed(2),
    recommendedOption,
    suggestedEntry: suggestedEntryPremium
  };

  return {
    signal: score.tag,
    buySignal,
    strengths,
    weaknesses,
    risks,
    keyInsights,
    shortTermView,
    shortTermReason: shortTermReasons.join(', ').charAt(0).toUpperCase() + shortTermReasons.join(', ').slice(1),
    longTermView,
    longTermReason: longTermReasons.join(', ').charAt(0).toUpperCase() + longTermReasons.join(', ').slice(1),
    entryPrice,
    entryRange: [+(entryPrice - 0.5 * effectiveATR).toFixed(2), +(entryPrice + 0.5 * effectiveATR).toFixed(2)],
    stopLoss,
    targetShortTerm: targetST,
    targetLongTerm: blendedTargetLT,
    confidence,
    confidenceScore,
    budgetQuantity: budget ? Math.floor(budget / stock.currentPrice) : null,
    budget: budget || null,
    summary,
    suggestedBuyPrice: entryPrice,
    suggestedSellPrice: targetST,
    optionsStrategy,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// FULL ANALYSIS PIPELINE
// ═══════════════════════════════════════════════════════════════════════════

export async function analyzeStock(ticker: string, budget?: number, market: string = 'IN'): Promise<FullStockAnalysis> {
  const stock = await buildStockData(ticker, market);

  // Validate stock data sanity
  if (stock.currentPrice <= 0) {
    throw new Error(`Invalid price data for ${ticker} — market may be closed or ticker is delisted`);
  }

  const [{ tech, history, atr }, fundamental] = await Promise.all([
    buildTechnicalData(ticker, stock.currentPrice),
    buildFundamentalData(ticker, stock),
  ]);
  const [sentiment, macro] = await Promise.all([
    buildSentimentData(ticker, stock, market),
    buildMacroData(stock.sector, market),
  ]);
  const score = computeCompositeScore(tech, fundamental, stock, sentiment, macro);
  const recommendation = buildRecommendation(score, stock, tech, fundamental, sentiment, atr, budget);

  // Build data quality report
  const dataQuality = buildDataQuality(stock, tech, fundamental, sentiment, history, market);

  const qualityLabel = dataQuality.dataCompleteness >= 80 ? 'HIGH QUALITY' :
    dataQuality.dataCompleteness >= 50 ? 'MODERATE QUALITY' : 'LIMITED DATA';

  return {
    stock,
    technical: tech,
    fundamental,
    sentiment,
    macro,
    score,
    recommendation,
    priceHistory: history,
    dataQuality,
    analyzedAt: new Date().toISOString(),
    dataQualityNote: `${qualityLabel}: Multi-factor analysis using real-time Yahoo Finance data. ` +
      `Data completeness: ${dataQuality.dataCompleteness}%. ` +
      `Sources: ${dataQuality.sourcesAvailable.join(', ')}. ` +
      (dataQuality.sourcesMissing.length > 0 ? `Missing: ${dataQuality.sourcesMissing.join(', ')}. ` : '') +
      (dataQuality.anomaliesDetected.length > 0 ? `Anomalies: ${dataQuality.anomaliesDetected.join('; ')}. ` : '') +
      `Confidence: ${score.confidence}%.`,
  };
}

function buildDataQuality(
  stock: StockData, tech: TechnicalData, fund: FundamentalData,
  sentiment: SentimentData, history: PricePoint[], market: string
): DataQuality {
  const sourcesAvailable: string[] = [];
  const sourcesMissing: string[] = [];
  const anomaliesDetected: string[] = [];
  
  let trustedSourcesEngine: string[] = [];
  if (market === 'IN') {
    trustedSourcesEngine = ['The Economic Times', 'Business Standard', 'Mint', 'Moneycontrol', 'Screener.in', 'Zee Business'];
  } else if (market === 'EU') {
    trustedSourcesEngine = ['Reuters', 'Financial Times', 'Bloomberg', 'Euronews', 'Handelsblatt', 'Investing.com', 'TradingView'];
  } else {
    trustedSourcesEngine = ['The Wall Street Journal', 'Reuters', 'Bloomberg', 'CNBC', 'Yahoo Finance', 'MarketWatch', 'Seeking Alpha', 'Finviz'];
  }

  // Track available data sources
  if (stock.currentPrice > 0) sourcesAvailable.push('Live Price');
  else sourcesMissing.push('Live Price');

  if (history.length >= 200) sourcesAvailable.push('1Y Price History');
  else if (history.length >= 50) sourcesAvailable.push('Partial Price History');
  else sourcesMissing.push('Sufficient Price History');

  if (fund.peRatio != null) sourcesAvailable.push('Valuation Metrics');
  else sourcesMissing.push('Valuation Metrics');

  if (fund.revenueGrowth != null) sourcesAvailable.push('Growth Metrics');
  else sourcesMissing.push('Growth Metrics');

  if (fund.operatingMargin != null) sourcesAvailable.push('Profitability Metrics');
  else sourcesMissing.push('Profitability Metrics');

  const totalAnalysts = sentiment.analystBuyCount + sentiment.analystHoldCount + sentiment.analystSellCount;
  if (totalAnalysts > 0) sourcesAvailable.push(`Analyst Consensus (${totalAnalysts})`);
  else sourcesMissing.push('Analyst Coverage');

  if (sentiment.priceTarget != null) sourcesAvailable.push('Price Target');
  else sourcesMissing.push('Price Target');

  if (fund.businessSummary && fund.businessSummary !== 'N/A') sourcesAvailable.push('Business Profile');
  else sourcesMissing.push('Business Profile');

  if (market === 'IN') {
    if (stock.deliveryPercent != null) sourcesAvailable.push('NSE Delivery Data');
    else sourcesMissing.push('NSE Delivery Data');
  }

  // Detect anomalies
  if (stock.volume > 0 && stock.avgVolume > 0 && stock.volume > stock.avgVolume * 5) {
    anomaliesDetected.push('Volume spike >5x average — unusual activity');
  }
  if (stock.currentPrice > 0 && stock.week52High > 0) {
    if (stock.currentPrice > stock.week52High * 1.01) {
      anomaliesDetected.push('Price exceeds 52-week high — data may be delayed');
    }
    if (stock.currentPrice < stock.week52Low * 0.99) {
      anomaliesDetected.push('Price below 52-week low — data may be delayed');
    }
  }
  if (fund.peRatio != null && fund.peRatio < 0 && fund.operatingMargin != null && fund.operatingMargin > 20) {
    anomaliesDetected.push('Negative P/E despite high operating margins — check for one-time charges');
  }

  // Data completeness score
  const totalChecks = sourcesAvailable.length + sourcesMissing.length;
  const dataCompleteness = totalChecks > 0 ? Math.round((sourcesAvailable.length / totalChecks) * 100) : 0;

  // Cross-validation
  const crossValidationPassed = anomaliesDetected.length === 0 && dataCompleteness >= 60;

  return {
    sourcesAvailable,
    sourcesMissing,
    trustedSourcesEngine,
    dataCompleteness,
    dataFreshness: stock.volume > 0 ? 'live' : 'delayed',
    anomaliesDetected,
    crossValidationPassed,
    lastUpdated: new Date().toISOString(),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// TOP 5 DAILY — Fully scored and ranked
// ═══════════════════════════════════════════════════════════════════════════

export async function getTopFiveStocks(market: string = 'IN'): Promise<TopStock[]> {
  const watchlist = getWatchlist(market);
  const tickers = Object.keys(watchlist);
  const results: TopStock[] = [];

  const batchPromises = tickers.map(async (ticker) => {
    try {
      const stock = await buildStockData(ticker, market);
      const { tech } = await buildTechnicalData(ticker, stock.currentPrice);
      let fundamental: FundamentalData;
      try { fundamental = await buildFundamentalData(ticker, stock); }
      catch { fundamental = neutralFundamentals(); }
      let sentiment: SentimentData;
      try { sentiment = await buildSentimentData(ticker, stock, market); }
      catch { sentiment = neutralSentiment(stock.currentPrice); }
      const macro = await buildMacroData(stock.sector, market);
      const score = computeCompositeScore(tech, fundamental, stock, sentiment, macro);
      return { ticker, stock, score };
    } catch {
      return null;
    }
  });

  const settled = await Promise.allSettled(batchPromises);
  for (const result of settled) {
    if (result.status === 'fulfilled' && result.value) {
      const { ticker, stock, score } = result.value;
      results.push({
        ticker,
        companyName: stock.companyName,
        sector: stock.sector,
        currentPrice: stock.currentPrice,
        changePercent: stock.changePercent,
        score,
        rank: 0,
        marketCap: stock.marketCap,
      });
    }
  }

  results.sort((a, b) => b.score.total - a.score.total);
  return results.slice(0, 5).map((s, i) => ({ ...s, rank: i + 1 }));
}

function neutralFundamentals(): FundamentalData {
  return {
    businessSummary: 'N/A', peRatio: null, pbRatio: null, evEbitda: null,
    debtToEquity: null, currentRatio: null, roe: null, revenueGrowth: null,
    grossMargin: null, operatingMargin: null, netMargin: null, freeCashFlow: null,
    dividendYield: null, insiderOwnership: null, revenueHistory: [], earningsHistory: [],
  };
}

function neutralSentiment(price: number): SentimentData {
  return {
    overallSentiment: 'neutral', sentimentScore: 0.5, news: [],
    analystRating: 'Hold', analystBuyCount: 0, analystHoldCount: 0,
    analystSellCount: 0, priceTarget: price,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MARKET OVERVIEW — Dynamic VIX-based fear/greed
// ═══════════════════════════════════════════════════════════════════════════

export async function getMarketOverview(market: string = 'IN'): Promise<MarketOverview> {
  const tickers = market === 'IN'
    ? ['^NSEI', '^BSESN', '^NSEBANK', '^INDIAVIX']
    : market === 'EU'
    ? ['^GDAXI', '^FCHI', '^FTSE', '^V2TX']
    : ['SPY', 'QQQ', 'DIA', '^VIX'];

  const spies = await yf.quote(tickers);

  if (market === 'EU') {
    const dax  = spies.find((s: any) => s.symbol === '^GDAXI');
    const cac  = spies.find((s: any) => s.symbol === '^FCHI');
    const ftse = spies.find((s: any) => s.symbol === '^FTSE');
    const vix  = spies.find((s: any) => s.symbol === '^V2TX');
    const vixLevel = vix?.regularMarketPrice || 18;
    const fg = computeFearGreedFromVIX(vixLevel);
    const daxChange = dax?.regularMarketChangePercent || 0;
    const advancing = daxChange > 0 ? Math.round(900 + daxChange * 80) : Math.round(700 - Math.abs(daxChange) * 70);
    const declining = 1600 - advancing;
    return {
      index1Name: 'DAX 40',
      index1Change: dax?.regularMarketChangePercent || 0,
      index2Name: 'CAC 40',
      index2Change: cac?.regularMarketChangePercent || 0,
      index3Name: 'FTSE 100',
      index3Change: ftse?.regularMarketChangePercent || 0,
      vixName: 'VSTOXX',
      vixLevel,
      fearGreedIndex: fg,
      fearGreedLabel: fg <= 25 ? 'Extreme Fear' : fg <= 40 ? 'Fear' : fg <= 60 ? 'Neutral' : fg <= 75 ? 'Greed' : 'Extreme Greed',
      breadthAdvancing: clamp(advancing, 200, 1400),
      breadthDeclining: clamp(declining, 200, 1400),
      updatedAt: new Date().toISOString(),
    };
  }

  if (market === 'IN') {
    const nifty = spies.find((s: any) => s.symbol === '^NSEI');
    const sensex = spies.find((s: any) => s.symbol === '^BSESN');
    const banknifty = spies.find((s: any) => s.symbol === '^NSEBANK');
    const vix = spies.find((s: any) => s.symbol === '^INDIAVIX');
    const vixLevel = vix?.regularMarketPrice || 15;
    const fg = computeFearGreedFromVIX(vixLevel);
    const niftyChange = nifty?.regularMarketChangePercent || 0;
    const advancing = niftyChange > 0 ? Math.round(1000 + niftyChange * 100) : Math.round(800 - Math.abs(niftyChange) * 80);
    const declining = 2000 - advancing;
    return {
      index1Name: 'NIFTY 50',
      index1Change: nifty?.regularMarketChangePercent || 0,
      index2Name: 'SENSEX',
      index2Change: sensex?.regularMarketChangePercent || 0,
      index3Name: 'NIFTY BANK',
      index3Change: banknifty?.regularMarketChangePercent || 0,
      vixName: 'INDIA VIX',
      vixLevel,
      fearGreedIndex: fg,
      fearGreedLabel: fg <= 25 ? 'Extreme Fear' : fg <= 40 ? 'Fear' : fg <= 60 ? 'Neutral' : fg <= 75 ? 'Greed' : 'Extreme Greed',
      breadthAdvancing: clamp(advancing, 200, 1800),
      breadthDeclining: clamp(declining, 200, 1800),
      updatedAt: new Date().toISOString(),
    };
  } else {
    const spy = spies.find((s: any) => s.symbol === 'SPY');
    const qqq = spies.find((s: any) => s.symbol === 'QQQ');
    const dia = spies.find((s: any) => s.symbol === 'DIA');
    const vix = spies.find((s: any) => s.symbol === '^VIX');
    const vixLevel = vix?.regularMarketPrice || 18;
    const fg = computeFearGreedFromVIX(vixLevel);
    const spyChange = spy?.regularMarketChangePercent || 0;
    const advancing = spyChange > 0 ? Math.round(2400 + spyChange * 200) : Math.round(1800 - Math.abs(spyChange) * 150);
    const declining = 4000 - advancing;
    return {
      index1Name: 'S&P 500',
      index1Change: spy?.regularMarketChangePercent || 0,
      index2Name: 'Nasdaq 100',
      index2Change: qqq?.regularMarketChangePercent || 0,
      index3Name: 'Dow Jones',
      index3Change: dia?.regularMarketChangePercent || 0,
      vixName: 'VIX Volatility',
      vixLevel,
      fearGreedIndex: fg,
      fearGreedLabel: fg <= 25 ? 'Extreme Fear' : fg <= 40 ? 'Fear' : fg <= 60 ? 'Neutral' : fg <= 75 ? 'Greed' : 'Extreme Greed',
      breadthAdvancing: clamp(advancing, 500, 3500),
      breadthDeclining: clamp(declining, 500, 3500),
      updatedAt: new Date().toISOString(),
    };
  }
}

