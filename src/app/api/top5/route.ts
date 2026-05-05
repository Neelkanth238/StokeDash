import { NextResponse } from 'next/server';
import { getTopFiveStocks, getMarketOverview } from '@/lib/stockAnalyzer';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const market = searchParams.get('market') || 'IN';
    const topFive = await getTopFiveStocks(market);
    const marketInfo = await getMarketOverview(market);
    return NextResponse.json({ topFive, market: marketInfo, generatedAt: new Date().toISOString() });
  } catch (err: unknown) {
    console.error('Top5 API error:', err);
    return NextResponse.json({ error: 'Failed to fetch market data' }, { status: 500 });
  }
}
