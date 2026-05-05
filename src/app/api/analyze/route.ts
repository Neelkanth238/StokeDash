import { NextResponse } from 'next/server';
import { analyzeStock } from '@/lib/stockAnalyzer';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get('ticker')?.toUpperCase();
  const market = searchParams.get('market') || 'IN';
  const budget = searchParams.get('budget') ? Number(searchParams.get('budget')) : undefined;

  if (!ticker) {
    return NextResponse.json({ error: 'Missing ticker parameter' }, { status: 400 });
  }
  
  // Note: We'll allow searching tickers outside the watchlist now since we have real data!
  
  try {
    const analysis = await analyzeStock(ticker, budget, market);
    return NextResponse.json(analysis);
  } catch (err: unknown) {
    console.error('Analysis error:', err);
    const msg = err instanceof Error ? err.message : 'Analysis failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
