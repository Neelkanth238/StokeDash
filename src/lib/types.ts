export interface StockData {
  ticker: string;
  companyName: string;
  sector: string;
  exchange: string;
  currentPrice: number;
  previousClose: number;
  change: number;
  changePercent: number;
  volume: number;
  avgVolume: number;
  marketCap: number;
  week52High: number;
  week52Low: number;
}

export interface TechnicalData {
  rsi14: number;
  macd: number;
  macdSignal: number;
  macdHistogram: number;
  sma20: number;
  sma50: number;
  sma200: number;
  trend: 'uptrend' | 'downtrend' | 'sideways';
  rsiSignal: 'overbought' | 'oversold' | 'neutral';
  macdSignalLabel: 'bullish' | 'bearish' | 'neutral';
  supportLevel: number;
  resistanceLevel: number;
  volumeRatio: number;
  chartPattern: string | null;
  priceVsSma20: 'above' | 'below';
  priceVsSma50: 'above' | 'below';
  priceVsSma200: 'above' | 'below';
}

export interface FundamentalData {
  businessSummary: string;
  peRatio: number | null;
  pbRatio: number | null;
  evEbitda: number | null;
  debtToEquity: number | null;
  currentRatio: number | null;
  roe: number | null;
  revenueGrowth: number | null;
  grossMargin: number | null;
  operatingMargin: number | null;
  netMargin: number | null;
  freeCashFlow: number | null;
  dividendYield: number | null;
  insiderOwnership: number | null;
  revenueHistory: { year: string; value: number }[];
  earningsHistory: { quarter: string; actual: number; estimate: number }[];
}

export interface NewsItem {
  title: string;
  source: string;
  publishedAt: string;
  url: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  sentimentScore: number;
}

export interface SentimentData {
  overallSentiment: 'bullish' | 'neutral' | 'bearish';
  sentimentScore: number;
  news: NewsItem[];
  analystRating: string;
  analystBuyCount: number;
  analystHoldCount: number;
  analystSellCount: number;
  priceTarget: number | null;
}

export interface MacroData {
  sectorPerformance: number;
  marketPerformance: number;
  fearGreedIndex: number;
  fearGreedLabel: string;
  interestRateImpact: string;
  inflationImpact: string;
  competitivePosition: string;
  keyMacroFactors: string[];
}

export interface DataQuality {
  sourcesAvailable: string[];
  sourcesMissing: string[];
  trustedSourcesEngine: string[];
  dataCompleteness: number; // 0–100
  dataFreshness: 'live' | 'delayed' | 'stale';
  anomaliesDetected: string[];
  crossValidationPassed: boolean;
  lastUpdated: string;
}

export interface CompositeScore {
  total: number;
  technical: number;
  fundamental: number;
  priceAction: number;
  sentiment: number;
  macro: number;
  tag: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Avoid';
  reason: string;
  confidence: number; // 0–100 based on data reliability
  conflictingSignals: string[];
}

export interface Recommendation {
  signal: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Avoid';
  buySignal: 'Yes' | 'No' | 'Wait';
  strengths: string[];
  weaknesses: string[];
  risks: string[];
  keyInsights: string[];
  shortTermView: 'Bullish' | 'Neutral' | 'Bearish';
  shortTermReason: string;
  longTermView: 'Bullish' | 'Neutral' | 'Bearish';
  longTermReason: string;
  entryPrice: number;
  entryRange: [number, number];
  stopLoss: number;
  targetShortTerm: number;
  targetLongTerm: number;
  confidence: 'High' | 'Medium' | 'Low';
  confidenceScore: number; // 0–100
  budgetQuantity: number | null;
  budget: number | null;
  summary: string;
  suggestedBuyPrice: number;
  suggestedSellPrice: number;
  optionsStrategy: OptionsStrategy;
}

export interface OptionsStrategy {
  callStrike: number;
  putStrike: number;
  impliedVolatility: number;
  recommendedOption: 'Buy Call' | 'Buy Put' | 'Hold / No Options';
  suggestedEntry: number;
}

export interface FullStockAnalysis {
  stock: StockData;
  technical: TechnicalData;
  fundamental: FundamentalData;
  sentiment: SentimentData;
  macro: MacroData;
  score: CompositeScore;
  recommendation: Recommendation;
  priceHistory: PricePoint[];
  dataQuality: DataQuality;
  analyzedAt: string;
  dataQualityNote?: string;
}

export interface PricePoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TopStock {
  ticker: string;
  companyName: string;
  sector: string;
  currentPrice: number;
  changePercent: number;
  score: CompositeScore;
  rank: number;
  marketCap: number;
}

export interface MarketOverview {
  index1Name: string;
  index1Change: number;
  index2Name: string;
  index2Change: number;
  index3Name: string;
  index3Change: number;
  vixName: string;
  vixLevel: number;
  fearGreedIndex: number;
  fearGreedLabel: string;
  breadthAdvancing: number;
  breadthDeclining: number;
  updatedAt: string;
}
