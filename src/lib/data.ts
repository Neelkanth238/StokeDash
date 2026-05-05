// ─── WATCHLIST of US stocks ───────────────────────────────────────────────────
export const WATCHLIST_US: Record<string, { name: string; sector: string; exchange: string }> = {
  AAPL: { name: 'Apple Inc.', sector: 'Technology', exchange: 'NASDAQ' },
  MSFT: { name: 'Microsoft Corp.', sector: 'Technology', exchange: 'NASDAQ' },
  NVDA: { name: 'NVIDIA Corp.', sector: 'Semiconductors', exchange: 'NASDAQ' },
  GOOGL: { name: 'Alphabet Inc.', sector: 'Technology', exchange: 'NASDAQ' },
  AMZN: { name: 'Amazon.com Inc.', sector: 'Consumer Discretionary', exchange: 'NASDAQ' },
  META: { name: 'Meta Platforms', sector: 'Technology', exchange: 'NASDAQ' },
  TSLA: { name: 'Tesla Inc.', sector: 'Automotive', exchange: 'NASDAQ' },
  JPM: { name: 'JPMorgan Chase', sector: 'Financials', exchange: 'NYSE' },
  UNH: { name: 'UnitedHealth Group', sector: 'Healthcare', exchange: 'NYSE' },
  V: { name: 'Visa Inc.', sector: 'Financials', exchange: 'NYSE' },
  XOM: { name: 'ExxonMobil Corp.', sector: 'Energy', exchange: 'NYSE' },
  LLY: { name: 'Eli Lilly & Co.', sector: 'Pharmaceuticals', exchange: 'NYSE' },
  AVGO: { name: 'Broadcom Inc.', sector: 'Semiconductors', exchange: 'NASDAQ' },
  HD: { name: 'Home Depot Inc.', sector: 'Consumer Discretionary', exchange: 'NYSE' },
  MA: { name: 'Mastercard Inc.', sector: 'Financials', exchange: 'NYSE' },
  COST: { name: 'Costco Wholesale', sector: 'Consumer Staples', exchange: 'NASDAQ' },
  PG: { name: 'Procter & Gamble', sector: 'Consumer Staples', exchange: 'NYSE' },
  AMD: { name: 'Advanced Micro Devices', sector: 'Semiconductors', exchange: 'NASDAQ' },
  ABBV: { name: 'AbbVie Inc.', sector: 'Healthcare', exchange: 'NYSE' },
  CRM: { name: 'Salesforce Inc.', sector: 'Technology', exchange: 'NYSE' },
};

// ─── WATCHLIST of IN stocks ───────────────────────────────────────────────────
export const WATCHLIST_IN: Record<string, { name: string; sector: string; exchange: string }> = {
  'RELIANCE.NS': { name: 'Reliance Industries', sector: 'Energy', exchange: 'NSE' },
  'TCS.NS': { name: 'Tata Consultancy Services', sector: 'Technology', exchange: 'NSE' },
  'HDFCBANK.NS': { name: 'HDFC Bank', sector: 'Financials', exchange: 'NSE' },
  'ICICIBANK.NS': { name: 'ICICI Bank', sector: 'Financials', exchange: 'NSE' },
  'INFY.NS': { name: 'Infosys', sector: 'Technology', exchange: 'NSE' },
  'ITC.NS': { name: 'ITC Limited', sector: 'Consumer Staples', exchange: 'NSE' },
  'SBIN.NS': { name: 'State Bank of India', sector: 'Financials', exchange: 'NSE' },
  'BHARTIARTL.NS': { name: 'Bharti Airtel', sector: 'Communication Services', exchange: 'NSE' },
  'HINDUNILVR.NS': { name: 'Hindustan Unilever', sector: 'Consumer Staples', exchange: 'NSE' },
  'L&T.NS': { name: 'Larsen & Toubro', sector: 'Industrials', exchange: 'NSE' },
  'BAJFINANCE.NS': { name: 'Bajaj Finance', sector: 'Financials', exchange: 'NSE' },
  'HCLTECH.NS': { name: 'HCL Technologies', sector: 'Technology', exchange: 'NSE' },
  'MARUTI.NS': { name: 'Maruti Suzuki', sector: 'Automotive', exchange: 'NSE' },
  'SUNPHARMA.NS': { name: 'Sun Pharma', sector: 'Pharmaceuticals', exchange: 'NSE' },
  'TATAMOTORS.NS': { name: 'Tata Motors', sector: 'Automotive', exchange: 'NSE' },
  'ASIANPAINT.NS': { name: 'Asian Paints', sector: 'Materials', exchange: 'NSE' },
  'ULTRACEMCO.NS': { name: 'UltraTech Cement', sector: 'Materials', exchange: 'NSE' },
  'NTPC.NS': { name: 'NTPC Limited', sector: 'Utilities', exchange: 'NSE' },
  'KOTAKBANK.NS': { name: 'Kotak Mahindra Bank', sector: 'Financials', exchange: 'NSE' },
  'AXISBANK.NS': { name: 'Axis Bank', sector: 'Financials', exchange: 'NSE' },
};

// ─── WATCHLIST of EU stocks ───────────────────────────────────────────────────
export const WATCHLIST_EU: Record<string, { name: string; sector: string; exchange: string }> = {
  'ASML.AS':  { name: 'ASML Holding',          sector: 'Semiconductors',        exchange: 'Euronext Amsterdam' },
  'SAP.DE':   { name: 'SAP SE',                sector: 'Technology',            exchange: 'Xetra' },
  'SIE.DE':   { name: 'Siemens AG',            sector: 'Industrials',           exchange: 'Xetra' },
  'BAYN.DE':  { name: 'Bayer AG',              sector: 'Pharmaceuticals',       exchange: 'Xetra' },
  'ALV.DE':   { name: 'Allianz SE',            sector: 'Financials',            exchange: 'Xetra' },
  'BMW.DE':   { name: 'BMW AG',                sector: 'Automotive',            exchange: 'Xetra' },
  'MC.PA':    { name: 'LVMH',                  sector: 'Consumer Discretionary',exchange: 'Euronext Paris' },
  'TTE.PA':   { name: 'TotalEnergies SE',      sector: 'Energy',                exchange: 'Euronext Paris' },
  'AIR.PA':   { name: 'Airbus SE',             sector: 'Industrials',           exchange: 'Euronext Paris' },
  'OR.PA':    { name: "L'Oréal SA",            sector: 'Consumer Staples',      exchange: 'Euronext Paris' },
  'BNP.PA':   { name: 'BNP Paribas',           sector: 'Financials',            exchange: 'Euronext Paris' },
  'SAN.PA':   { name: 'Sanofi',               sector: 'Pharmaceuticals',       exchange: 'Euronext Paris' },
  'SHEL.L':   { name: 'Shell plc',             sector: 'Energy',                exchange: 'London' },
  'AZN.L':    { name: 'AstraZeneca',           sector: 'Pharmaceuticals',       exchange: 'London' },
  'HSBA.L':   { name: 'HSBC Holdings',         sector: 'Financials',            exchange: 'London' },
  'ULVR.L':   { name: 'Unilever',              sector: 'Consumer Staples',      exchange: 'London' },
  'NOVN.SW':  { name: 'Novartis AG',           sector: 'Pharmaceuticals',       exchange: 'SIX Swiss' },
  'NESN.SW':  { name: 'Nestlé SA',             sector: 'Consumer Staples',      exchange: 'SIX Swiss' },
  'ROG.SW':   { name: 'Roche Holding AG',      sector: 'Pharmaceuticals',       exchange: 'SIX Swiss' },
  'INGA.AS':  { name: 'ING Groep',             sector: 'Financials',            exchange: 'Euronext Amsterdam' },
};

export const getWatchlist = (market: string) => {
  if (market === 'IN') return WATCHLIST_IN;
  if (market === 'EU') return WATCHLIST_EU;
  return WATCHLIST_US;
};

export function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}
