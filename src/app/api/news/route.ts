import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

let yfInstance = (yahooFinance as any).default || yahooFinance;
if (typeof yfInstance === 'function') {
  yfInstance = new yfInstance();
} else if (yfInstance.YahooFinance && !yfInstance.quote) {
  yfInstance = new yfInstance.YahooFinance();
}
const yf: any = yfInstance;

const CNBC_FEEDS: Record<string, string> = {
  markets:    'https://www.cnbc.com/id/20910258/device/rss/rss.html',
  finance:    'https://www.cnbc.com/id/10000664/device/rss/rss.html',
  economy:    'https://www.cnbc.com/id/20910274/device/rss/rss.html',
  investing:  'https://www.cnbc.com/id/15839135/device/rss/rss.html',
  technology: 'https://www.cnbc.com/id/19854910/device/rss/rss.html',
};

function parseCNBCRSS(xml: string, category: string) {
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
    const bullWords = ['surge', 'rally', 'gain', 'rise', 'jump', 'beat', 'record', 'bull', 'soar', 'boost', 'profit', 'growth', 'recover'];
    const bearWords = ['fall', 'drop', 'plunge', 'crash', 'loss', 'decline', 'warn', 'risk', 'sell-off', 'bear', 'cut', 'recession', 'fear'];
    const bullScore = bullWords.filter(w => lower.includes(w)).length;
    const bearScore = bearWords.filter(w => lower.includes(w)).length;
    const sentiment = bullScore > bearScore ? 'positive' : bearScore > bullScore ? 'negative' : 'neutral';

    items.push({
      id: `cnbc-${Buffer.from(link).toString('base64').slice(0, 16)}`,
      title,
      link,
      description: description.slice(0, 200),
      publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      publisher: 'CNBC',
      source: 'cnbc',
      category,
      sentiment,
    });
  }
  return items;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const market = searchParams.get('market') || 'US';
  const ticker = searchParams.get('ticker') || '';

  // 1. Yahoo Finance news
  let yahooNews: any[] = [];
  try {
    const query = ticker || (market === 'IN' ? '^BSESN' : market === 'EU' ? '^GDAXI' : 'SPY');
    const result = await yf.search(query, { newsCount: 20 });
    yahooNews = (result.news || [])
      .filter((n: any) => n.title && n.link)
      .map((n: any) => ({
        id: n.uuid || `yf-${Math.random()}`,
        title: n.title,
        link: n.link,
        publishedAt: n.providerPublishTime
          ? new Date(n.providerPublishTime * 1000).toISOString()
          : new Date().toISOString(),
        publisher: n.publisher || 'Yahoo Finance',
        source: 'yahoo',
        category: 'markets',
        sentiment: 'neutral',
        description: '',
      }));
  } catch { /* ignore */ }

  // 2. CNBC RSS feeds
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
        return parseCNBCRSS(xml, cat);
      })
    );
    for (const r of cnbcResults) {
      if (r.status === 'fulfilled') cnbcNews.push(...r.value);
    }
  } catch { /* ignore */ }

  // 3. Merge, deduplicate, and sort
  const all = [...yahooNews, ...cnbcNews];
  const seen = new Set<string>();
  const merged = all
    .filter(a => {
      const key = a.title.slice(0, 60);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 50);

  // 4. Market analysis summary from the news
  const sentiments = merged.map(a => a.sentiment);
  const pos = sentiments.filter(s => s === 'positive').length;
  const neg = sentiments.filter(s => s === 'negative').length;
  const overallSentiment = pos > neg + 3 ? 'bullish' : neg > pos + 3 ? 'bearish' : 'neutral';
  const summary = {
    total: merged.length,
    positive: pos,
    negative: neg,
    neutral: sentiments.length - pos - neg,
    overallSentiment,
    sources: { yahoo: yahooNews.length, cnbc: cnbcNews.length },
    analyzedAt: new Date().toISOString(),
  };

  return NextResponse.json({ articles: merged, summary });
}
