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
  const ticker = searchParams.get('ticker')?.toUpperCase();

  if (!ticker) {
    return NextResponse.json({ error: 'Missing ticker' }, { status: 400 });
  }

  try {
    const [holders, summary] = await Promise.allSettled([
      yf.quoteSummary(ticker, { modules: ['institutionOwnership', 'majorHoldersBreakdown', 'insiderHolders', 'fundOwnership'] }),
      yf.quoteSummary(ticker, { modules: ['summaryDetail'] }),
    ]);

    let institutionalData: any = null;
    let summaryData: any = null;

    if (holders.status === 'fulfilled') {
      institutionalData = holders.value;
    }
    if (summary.status === 'fulfilled') {
      summaryData = summary.value;
    }

    const majorBreakdown = institutionalData?.majorHoldersBreakdown || {};
    const institutionList = (institutionalData?.institutionOwnership?.ownershipList || [])
      .slice(0, 10)
      .map((inst: any) => ({
        organization: inst.organization || 'Unknown',
        pctHeld: inst.pctHeld != null ? +(inst.pctHeld * 100).toFixed(2) : null,
        shares: inst.position || inst.shares || null,
        value: inst.value || null,
        reportDate: inst.reportDate || null,
      }));

    const fundList = (institutionalData?.fundOwnership?.ownershipList || [])
      .slice(0, 5)
      .map((f: any) => ({
        organization: f.organization || 'Unknown',
        pctHeld: f.pctHeld != null ? +(f.pctHeld * 100).toFixed(2) : null,
        shares: f.position || f.shares || null,
        reportDate: f.reportDate || null,
      }));

    const insiders = (institutionalData?.insiderHolders?.holders || [])
      .slice(0, 5)
      .map((ins: any) => ({
        name: ins.name || 'Unknown',
        relation: ins.relation || 'N/A',
        shares: ins.positionDirect || null,
        latestTransType: ins.latestTransType || null,
        transactionDate: ins.transactionDate || null,
      }));

    return NextResponse.json({
      ticker,
      breakdown: {
        insiderPct: majorBreakdown.insidersPercentHeld != null ? +(majorBreakdown.insidersPercentHeld * 100).toFixed(2) : null,
        institutionPct: majorBreakdown.institutionsPercentHeld != null ? +(majorBreakdown.institutionsPercentHeld * 100).toFixed(2) : null,
        floatPct: majorBreakdown.institutionsFloatPercentHeld != null ? +(majorBreakdown.institutionsFloatPercentHeld * 100).toFixed(2) : null,
        institutionCount: majorBreakdown.numberOfInstitutions || null,
      },
      institutions: institutionList,
      funds: fundList,
      insiders,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
