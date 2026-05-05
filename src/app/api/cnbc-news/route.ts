import { NextResponse } from 'next/server';

// CNBC public RSS feeds organized by category
const CNBC_FEEDS: Record<string, string> = {
  markets:    'https://www.cnbc.com/id/20910258/device/rss/rss.html',
  finance:    'https://www.cnbc.com/id/10000664/device/rss/rss.html',
  economy:    'https://www.cnbc.com/id/20910274/device/rss/rss.html',
  investing:  'https://www.cnbc.com/id/15839135/device/rss/rss.html',
  world:      'https://www.cnbc.com/id/100727362/device/rss/rss.html',
  technology: 'https://www.cnbc.com/id/19854910/device/rss/rss.html',
};

function parseRSS(xml: string, category: string) {
  const items: any[] = [];
  // Extract <item> blocks
  const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];
  for (const block of itemMatches) {
    const get = (tag: string) => {
      // Handle CDATA
      const cdataMatch = block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[(.*?)\\]\\]></${tag}>`, 's'));
      if (cdataMatch) return cdataMatch[1].trim();
      const plainMatch = block.match(new RegExp(`<${tag}[^>]*>(.*?)</${tag}>`, 's'));
      return plainMatch ? plainMatch[1].replace(/<[^>]+>/g, '').trim() : '';
    };

    const title = get('title');
    const link  = get('link') || '';
    const pubDate = get('pubDate') || get('dc:date') || '';
    const description = get('description');

    if (!title || !link) continue;

    // Basic sentiment heuristic
    const lower = (title + ' ' + description).toLowerCase();
    const bullWords = ['surge', 'rally', 'gain', 'rise', 'jump', 'beat', 'record', 'bull', 'soar', 'boost', 'profit', 'growth', 'recover'];
    const bearWords = ['fall', 'drop', 'plunge', 'crash', 'loss', 'decline', 'warn', 'risk', 'sell-off', 'bear', 'cut', 'recession', 'fear'];
    const bullScore = bullWords.filter(w => lower.includes(w)).length;
    const bearScore = bearWords.filter(w => lower.includes(w)).length;
    const sentiment: 'positive' | 'neutral' | 'negative' =
      bullScore > bearScore ? 'positive' : bearScore > bullScore ? 'negative' : 'neutral';

    items.push({
      id: `cnbc-${Buffer.from(link).toString('base64').slice(0, 16)}`,
      title,
      link,
      description: description.slice(0, 200),
      publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      source: 'CNBC',
      category,
      sentiment,
      sentimentScore: bullScore - bearScore,
    });
  }
  return items;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'all';

  const feedsToFetch = category === 'all'
    ? Object.entries(CNBC_FEEDS)
    : Object.entries(CNBC_FEEDS).filter(([k]) => k === category);

  const results = await Promise.allSettled(
    feedsToFetch.map(async ([cat, url]) => {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; StokeDash/1.0)' },
        next: { revalidate: 300 }, // cache 5 mins
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const xml = await res.text();
      return parseRSS(xml, cat);
    })
  );

  const articles: any[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      articles.push(...result.value);
    }
  }

  // Sort by date descending, deduplicate by link
  const seen = new Set<string>();
  const unique = articles
    .filter(a => { if (seen.has(a.link)) return false; seen.add(a.link); return true; })
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 60);

  return NextResponse.json(unique);
}
