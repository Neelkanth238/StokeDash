import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

let yfInstance = (yahooFinance as any).default || yahooFinance;
if (typeof yfInstance === 'function') {
  yfInstance = new yfInstance();
} else if (yfInstance.YahooFinance && !yfInstance.quote) {
  yfInstance = new yfInstance.YahooFinance();
}
const yf: any = yfInstance;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const market = searchParams.get('market') || 'US';
  
  try {
    // We query the major indices/ETFs roughly corresponding to the markets 
    // to pull generalized market news from Yahoo Finance
    const query = market === 'IN' ? '^BSESN' : market === 'EU' ? '^GDAXI' : 'SPY';
    const result = await yf.search(query, { newsCount: 20 });
    
    // Some news objects might not be perfectly formed, so we sanitize
    const filteredNews = (result.news || []).filter((n: any) => n.title && n.link);

    // If Yahoo search returns nothing for some reason, we can fetch another major general token
    if (filteredNews.length === 0) {
      const backup = await yf.search('AAPL', { newsCount: 20 });
      return NextResponse.json(backup.news || []);
    }

    return NextResponse.json(filteredNews);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
