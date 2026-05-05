'use client';

import { useState, useEffect } from 'react';
import { FullStockAnalysis } from '@/lib/types';
import { getWatchlist } from '@/lib/data';
import { formatCompactCurrency, formatCurrency, formatCurrencyPrecision } from '@/lib/formatters';
import ScoreRing from '@/components/ScoreRing';
import PriceChart from '@/components/PriceChart';
import InvestorsTab, { InvestorData } from '@/components/InvestorsTab';
import {
  Search, BarChart2, FileText,
  MessageCircle, Globe, Target, AlertTriangle,
  CheckCircle, Layers, Zap, TrendingUp, DollarSign, Activity,
  Building2
} from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer
} from 'recharts';

interface Props {
  initialTicker?: string;
  market: string;
}

type Tab = 'overview' | 'technical' | 'fundamental' | 'sentiment' | 'macro' | 'recommendation' | 'investors';

export default function AnalyzePage({ initialTicker, market }: Props) {
  const [inputVal, setInputVal] = useState(initialTicker || '');
  const [budget, setBudget] = useState('');
  const [data, setData] = useState<FullStockAnalysis | null>(null);
  const [investors, setInvestors] = useState<InvestorData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const currentWatchlist = getWatchlist(market);

  async function fetchAnalysis(t: string, b?: string, m: string = market) {
    if (!t) return;
    setLoading(true);
    setError(null);
    setInvestors(null);
    try {
      const params = new URLSearchParams({ ticker: t, market: m });
      if (b) params.append('budget', b);
      const [res, invRes] = await Promise.allSettled([
        fetch(`/api/analyze?${params}`),
        fetch(`/api/investors?ticker=${t}`),
      ]);
      if (res.status === 'fulfilled') {
        const json = await res.value.json();
        if (!res.value.ok) throw new Error(json.error || 'Analysis failed');
        setData(json);
      } else {
        throw res.reason;
      }
      if (invRes.status === 'fulfilled') {
        const invJson = await invRes.value.json();
        if (invRes.value.ok && !invJson.error) setInvestors(invJson);
      }
      setActiveTab('overview');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialTicker) {
      setInputVal(initialTicker);
      fetchAnalysis(initialTicker, undefined, market);
    }
  }, [initialTicker, market]);

  function handleSearch() {
    const t = inputVal.trim().toUpperCase();
    if (!t) return;
    fetchAnalysis(t, budget || undefined, market);
  }

  function handleInputChange(val: string) {
    setInputVal(val);
    const upper = val.toUpperCase();
    if (val.length > 0) {
      const matches = Object.keys(currentWatchlist).filter(
        (t) => t.startsWith(upper) || currentWatchlist[t].name.toUpperCase().includes(upper)
      ).slice(0, 6);
      setSuggestions(matches);
    } else {
      setSuggestions([]);
    }
  }

  const TABS: { id: Tab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: Layers },
    { id: 'technical', label: 'Technical', icon: BarChart2 },
    { id: 'fundamental', label: 'Fundamental', icon: FileText },
    { id: 'sentiment', label: 'Sentiment', icon: MessageCircle },
    { id: 'macro', label: 'Macro', icon: Globe },
    { id: 'recommendation', label: 'Strategy', icon: Target },
    { id: 'investors', label: 'Investors', icon: Building2 },
  ];

  return (
    <div className="fade-in" style={{ padding: 'var(--space-2xl)' }}>
      {/* Search Console */}
      <div className="card" style={{ marginBottom: 'var(--space-xl)', background: 'var(--bg-secondary)', border: 'none' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px auto', gap: '12px', position: 'relative' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
              <Search size={18} />
            </div>
            <input
              placeholder="Enter Asset Ticker..."
              value={inputVal}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { setSuggestions([]); handleSearch(); } }}
              style={{ 
                paddingLeft: '48px', height: '52px', width: '100%', borderRadius: 'var(--radius-md)', 
                background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', 
                fontSize: '15px', fontWeight: 600, outline: 'none'
              }}
            />
            {suggestions.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '8px', background: 'white', border: '1px solid var(--border-muted)', borderRadius: 'var(--radius-md)', zIndex: 100, overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
                {suggestions.map((s) => (
                  <div key={s} style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
                    onClick={() => { setInputVal(s); setSuggestions([]); fetchAnalysis(s, budget || undefined); }}>
                    <span className="mono" style={{ fontWeight: 700, color: 'var(--brand)' }}>{s}</span>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>{currentWatchlist[s]?.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <input
            placeholder="Capital/Budget"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            style={{ 
              height: '52px', borderRadius: 'var(--radius-md)', background: 'var(--bg-card)', 
              border: '1px solid var(--border-subtle)', fontSize: '15px', fontWeight: 600, padding: '0 16px',
              outline: 'none'
            }}
            type="number"
          />
          <button className="btn btn-primary" onClick={handleSearch} style={{ height: '52px', padding: '0 28px', gap: '8px' }}>
             <Zap size={16} fill="white" />
             <span>ANALYZE</span>
          </button>
        </div>
      </div>

      {loading && (
        <div style={{ display: 'flex', height: '400px', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }}>
          <div style={{ width: '32px', height: '32px', border: '3px solid var(--border-subtle)', borderTopColor: 'var(--brand)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>PROCESSING QUANT PIPELINE...</div>
        </div>
      )}

      {error && (
        <div className="card" style={{ padding: 'var(--space-lg)', background: '#fef2f2', border: '1px solid #fee2e2', color: 'var(--critical)', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <AlertTriangle size={20} />
          <span style={{ fontWeight: 600 }}>{error}</span>
        </div>
      )}

      {!loading && data && (
        <div className="fade-in">
          {/* Header Stats */}
          <div className="card" style={{ padding: 'var(--space-xl)', marginBottom: 'var(--space-xl)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '48px', alignItems: 'center' }}>
               <ScoreRing score={data.score} size={100} />
               <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <h1 style={{ fontSize: '36px', fontWeight: 700, letterSpacing: '-0.04em' }}>{data.stock.ticker}</h1>
                    <span className="badge" style={{ padding: '4px 12px', background: data.score.tag === 'Strong Buy' || data.score.tag === 'Buy' ? 'var(--success)' : data.score.tag === 'Hold' ? 'var(--warning)' : 'var(--critical)', color: 'white' }}>{data.score.tag}</span>
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-secondary)' }}>{data.stock.companyName}</div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 500 }}>{data.stock.sector} • {data.stock.exchange}</p>
               </div>
               <div style={{ textAlign: 'right' }}>
                  <div className="mono" style={{ fontSize: '36px', fontWeight: 700, letterSpacing: '-0.03em' }}>{formatCurrencyPrecision(data.stock.currentPrice, market)}</div>
                  <div className={`change-pill ${data.stock.change >= 0 ? 'up' : 'down'}`} style={{ width: 'fit-content', marginLeft: 'auto', marginTop: '4px' }}>
                    {data.stock.changePercent.toFixed(2)}%
                  </div>
               </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginTop: '32px' }}>
               {[
                 { label: '52W High', val: formatCurrency(data.stock.week52High, market), icon: TrendingUp },
                 { label: '52W Low', val: formatCurrency(data.stock.week52Low, market), icon: TrendingUp },
                 { label: 'Market Cap', val: formatCompactCurrency(data.stock.marketCap / 1e9, market, 1, 'B'), icon: DollarSign },
                 { label: 'Volume', val: `${(data.stock.volume / 1e6).toFixed(1)}M`, icon: Activity },
               ].map(stat => (
                 <div key={stat.label} style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <stat.icon size={12} color="var(--text-muted)" />
                      <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{stat.label}</span>
                    </div>
                    <div className="mono" style={{ fontSize: '18px', fontWeight: 700 }}>{stat.val}</div>
                 </div>
               ))}
            </div>
          </div>

          {/* Nav Tabs */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: 'var(--space-xl)', background: 'var(--bg-tertiary)', padding: '4px', borderRadius: 'var(--radius-sm)', width: 'fit-content' }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="btn"
                style={{
                  padding: '8px 16px',
                  background: activeTab === tab.id ? 'var(--bg-card)' : 'transparent',
                  boxShadow: activeTab === tab.id ? 'var(--shadow-sm)' : 'none',
                  color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
                  gap: '8px'
                }}
              >
                <tab.icon size={14} />
                <span style={{ fontSize: '12px', fontWeight: 700 }}>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="fade-in">
            {activeTab === 'overview' && <OverviewTab data={data} market={market} />}
            {activeTab === 'technical' && <TechnicalTab data={data} market={market} />}
            {activeTab === 'fundamental' && <FundamentalTab data={data} />}
            {activeTab === 'sentiment' && <SentimentTab data={data} market={market} />}
            {activeTab === 'macro' && <MacroTab data={data} />}
            {activeTab === 'recommendation' && <RecommendationTab data={data} market={market} />}
            {activeTab === 'investors' && <InvestorsTab investors={investors} ticker={data.stock.ticker} />}
          </div>
        </div>
      )}
    </div>
  );
}

function OverviewTab({ data, market }: { data: FullStockAnalysis; market: string }) {
  const radarData = [
    { factor: 'Tech', score: data.score.technical },
    { factor: 'Fund', score: data.score.fundamental },
    { factor: 'Actn', score: data.score.priceAction },
    { factor: 'Sent', score: data.score.sentiment },
    { factor: 'Macr', score: data.score.macro },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 'var(--space-md)' }}>
      <div className="card" style={{ padding: 'var(--space-xl)' }}>
        <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '24px' }}>Price Evolution</h3>
        <PriceChart data={data.priceHistory} market={market} height={320} supportLevel={data.technical.supportLevel} resistanceLevel={data.technical.resistanceLevel} />
      </div>
      <div className="card" style={{ padding: 'var(--space-xl)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '24px', alignSelf: 'flex-start' }}>Factor Mix</h3>
        <ResponsiveContainer width="100%" height={280}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="var(--border-muted)" />
            <PolarAngleAxis dataKey="factor" tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 700 }} />
            <Radar name="Score" dataKey="score" stroke="var(--brand)" fill="var(--brand)" fillOpacity={0.08} strokeWidth={2} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <div className="card" style={{ gridColumn: 'span 2', padding: 'var(--space-xl)' }}>
         <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '16px' }}>Business Intelligence</h3>
         <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.7, fontWeight: 500 }}>{data.fundamental.businessSummary}</p>
      </div>
    </div>
  );
}

function TechnicalTab({ data, market }: { data: FullStockAnalysis; market: string }) {
  const { technical: tech } = data;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-md)' }}>
      {[
        { label: 'RSI(14)', val: tech.rsi14.toFixed(1), sig: tech.rsiSignal },
        { label: 'MACD (Pulse)', val: tech.macd.toFixed(2), sig: tech.macdSignalLabel },
        { label: 'SMA 20', val: formatCurrency(tech.sma20, market), sig: 'Short term' },
        { label: 'SMA 50', val: formatCurrency(tech.sma50, market), sig: 'Intermediate' },
        { label: 'SMA 200', val: formatCurrency(tech.sma200, market), sig: 'Long term' },
        { label: 'Vol Weight', val: `${tech.volumeRatio.toFixed(1)}x`, sig: 'Rel Volume' },
        { label: 'Trend Phase', val: tech.trend, sig: 'Market Cycle' },
        { label: 'Support', val: formatCurrency(tech.supportLevel, market), sig: 'Floor Level' }
      ].map(t => (
        <div key={t.label} className="card" style={{ padding: 'var(--space-lg)' }}>
           <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>{t.label}</div>
           <div className="mono" style={{ fontSize: '20px', fontWeight: 700 }}>{t.val}</div>
           <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: 600 }}>{t.sig}</div>
        </div>
      ))}
    </div>
  );
}

function FundamentalTab({ data }: { data: FullStockAnalysis }) {
  const { fundamental: fund } = data;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-md)' }}>
        {[
          { label: 'P/E Ratio', val: fund.peRatio?.toFixed(1) || 'N/A' },
          { label: 'Revenue Growth', val: (fund.revenueGrowth !== null) ? `${fund.revenueGrowth.toFixed(1)}%` : 'N/A' },
          { label: 'OP Margin', val: (fund.operatingMargin !== null) ? `${fund.operatingMargin.toFixed(1)}%` : 'N/A' },
          { label: 'Debt/Equity', val: fund.debtToEquity?.toFixed(1) || 'N/A' },
        ].map(f => (
          <div key={f.label} className="card" style={{ padding: 'var(--space-lg)' }}>
             <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>{f.label}</div>
             <div className="mono" style={{ fontSize: '24px', fontWeight: 700 }}>{f.val}</div>
          </div>
        ))}
      </div>
      <div className="card" style={{ padding: 'var(--space-xl)' }}>
         <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '16px' }}>Stability Scores</h3>
         <div style={{ display: 'flex', gap: '48px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>ROE</div>
              <div className="mono" style={{ fontSize: '18px', fontWeight: 700 }}>{fund.roe !== null ? fund.roe.toFixed(2) + '%' : 'N/A'}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>NET MARGIN</div>
              <div className="mono" style={{ fontSize: '18px', fontWeight: 700 }}>{fund.netMargin !== null ? fund.netMargin.toFixed(2) + '%' : 'N/A'}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>DIV YIELD</div>
              <div className="mono" style={{ fontSize: '18px', fontWeight: 700 }}>{fund.dividendYield ? fund.dividendYield.toFixed(2) + '%' : '0.00%'}</div>
            </div>
         </div>
      </div>
    </div>
  );
}

function SentimentTab({ data, market }: { data: FullStockAnalysis; market: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 'var(--space-md)' }}>
       <div className="card" style={{ padding: 'var(--space-xl)' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '16px' }}>Wall St. Consensus</h3>
          <div style={{ fontSize: '28px', fontWeight: 700, marginBottom: '16px' }}>{data.sentiment.analystRating}</div>
          <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
             <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>TGT PRICE: </span>
             <span className="mono" style={{ fontWeight: 700 }}>{data.sentiment.priceTarget !== null ? formatCurrency(data.sentiment.priceTarget, market, 0) : 'N/A'}</span>
          </div>
       </div>
       <div className="card" style={{ padding: 'var(--space-xl)' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '16px' }}>Technical Model Notes</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500, lineHeight: 1.6 }}>{data.dataQualityNote}</p>
       </div>
    </div>
  );
}

function MacroTab({ data }: { data: FullStockAnalysis }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-md)' }}>
       <div className="card" style={{ padding: 'var(--space-xl)' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>Sensitivity Analysis</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, fontWeight: 500 }}>{data.macro.interestRateImpact}</p>
       </div>
       <div className="card" style={{ padding: 'var(--space-xl)' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '16px' }}>Core Catalysts</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
             {data.macro.keyMacroFactors.map(f => (
               <span key={f} className="badge" style={{ padding: '6px 14px' }}>{f}</span>
             ))}
          </div>
       </div>
    </div>
  );
}

function RecommendationTab({ data, market }: { data: FullStockAnalysis; market: string }) {
  const { recommendation: rec } = data;
  const isPositive = rec.signal === 'Strong Buy' || rec.signal === 'Buy';
  const isNeutral = rec.signal === 'Hold';
  const verdictColor = isPositive ? 'var(--success)' : isNeutral ? 'var(--warning)' : 'var(--critical)';
  const verdictLabel = isPositive ? 'STRATEGIC BUY' : isNeutral ? 'HOLD POSITION' : 'DEFER ENTRY';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
       <div className="card" style={{ padding: 'var(--space-xl)', display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '40px', alignItems: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: verdictColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             {isPositive ? <CheckCircle size={32} color="white" /> : <AlertTriangle size={32} color="white" />}
          </div>
          <div>
             <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Execution Verdict</div>
             <div style={{ fontSize: '32px', fontWeight: 700, color: verdictColor, letterSpacing: '-0.02em' }}>
               {verdictLabel}
             </div>
             <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '4px' }}>{rec.signal}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
             <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Confidence Score</div>
             <div className="mono" style={{ fontSize: '28px', fontWeight: 700 }}>{rec.confidenceScore}%</div>
             <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>{rec.confidence}</div>
          </div>
       </div>

       {/* Summary */}
       <div className="card" style={{ padding: 'var(--space-lg)', background: 'var(--bg-secondary)', border: 'none' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500, lineHeight: 1.7 }}>{rec.summary}</div>
       </div>

       {/* Key Insights */}
       {rec.keyInsights.length > 0 && (
         <div className="card" style={{ padding: 'var(--space-xl)' }}>
            <h3 style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase', marginBottom: '16px' }}>Key Insights</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {rec.keyInsights.map((insight, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <Zap size={14} color="var(--brand)" style={{ marginTop: '3px', flexShrink: 0 }} />
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 600 }}>{insight}</p>
                </div>
              ))}
            </div>
         </div>
       )}

       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
         <div className="card" style={{ padding: 'var(--space-xl)' }}>
            <h3 style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase', marginBottom: '20px' }}>Price Suggestions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
               <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                 <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>If you want to BUY</div>
                 <div className="mono" style={{ fontSize: '24px', fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(rec.suggestedBuyPrice, market)}</div>
                 <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: 500 }}>Optimal entry based on technical support</div>
               </div>
               <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                 <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>If you want to SELL</div>
                 <div className="mono" style={{ fontSize: '24px', fontWeight: 700, color: 'var(--critical)' }}>{formatCurrency(rec.suggestedSellPrice, market)}</div>
                 <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: 500 }}>Short-term target / resistance level</div>
               </div>
            </div>
         </div>

         <div className="card" style={{ padding: 'var(--space-xl)', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase', marginBottom: '20px' }}>Options Chain Strategy</h3>
            <div style={{ background: 'var(--bg-secondary)', padding: '24px', borderRadius: 'var(--radius-md)', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
               <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Action Signal</div>
               <div style={{ fontSize: '28px', fontWeight: 700, color: rec.optionsStrategy.recommendedOption.includes('Call') ? 'var(--success)' : rec.optionsStrategy.recommendedOption.includes('Put') ? 'var(--critical)' : 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                 {rec.optionsStrategy.recommendedOption.toUpperCase()}
               </div>
               
               <div style={{ position: 'relative', margin: '20px 0' }}>
                 <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'var(--border-muted)' }} />
               </div>

               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                 <div>
                   <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Invest at Strike</div>
                   <div className="mono" style={{ fontSize: '20px', fontWeight: 700 }}>
                     {rec.optionsStrategy.recommendedOption === 'Hold / No Options' 
                        ? 'N/A' 
                        : formatCurrency(rec.optionsStrategy.recommendedOption.includes('Call') ? rec.optionsStrategy.callStrike : rec.optionsStrategy.putStrike, market)}
                   </div>
                 </div>
                 <div>
                   <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Target Premium</div>
                   <div className="mono" style={{ fontSize: '20px', fontWeight: 700 }}>
                     {rec.optionsStrategy.recommendedOption === 'Hold / No Options' 
                        ? 'N/A' 
                        : `< ${formatCurrency(rec.optionsStrategy.suggestedEntry, market)}`}
                   </div>
                 </div>
               </div>
            </div>
         </div>
       </div>

       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-md)' }}>
          {[
            { label: 'Pivot Entry', val: formatCurrency(rec.entryPrice, market) },
            { label: 'Risk Stop', val: formatCurrency(rec.stopLoss, market) },
            { label: 'Target (S)', val: formatCurrency(rec.targetShortTerm, market) },
            { label: 'Target (L)', val: formatCurrency(rec.targetLongTerm, market) },
          ].map(p => (
            <div key={p.label} className="card" style={{ padding: 'var(--space-lg)', background: 'var(--bg-secondary)', border: 'none' }}>
               <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>{p.label}</div>
               <div className="mono" style={{ fontSize: '20px', fontWeight: 700 }}>{p.val}</div>
            </div>
          ))}
       </div>

       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
          <div className="card" style={{ padding: 'var(--space-xl)' }}>
             <h3 style={{ fontSize: '11px', fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase', marginBottom: '20px' }}>Bull Case Factors</h3>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {rec.strengths.map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <CheckCircle size={14} color="var(--success)" style={{ marginTop: '3px' }} />
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 600 }}>{s}</p>
                  </div>
                ))}
             </div>
          </div>
          <div className="card" style={{ padding: 'var(--space-xl)' }}>
             <h3 style={{ fontSize: '11px', fontWeight: 700, color: 'var(--critical)', textTransform: 'uppercase', marginBottom: '20px' }}>Risk Assessment</h3>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {rec.risks.map((w, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <AlertTriangle size={14} color="var(--critical)" style={{ marginTop: '3px' }} />
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 600 }}>{w}</p>
                  </div>
                ))}
             </div>
          </div>
       </div>

       {/* Data Quality Indicator */}
       {data.dataQuality && (
         <div className="card" style={{ padding: 'var(--space-lg)', background: 'var(--bg-secondary)', border: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Data Quality</h3>
              <span className="mono" style={{ fontSize: '12px', fontWeight: 700, color: data.dataQuality.dataCompleteness >= 80 ? 'var(--success)' : data.dataQuality.dataCompleteness >= 50 ? 'var(--warning)' : 'var(--critical)' }}>
                {data.dataQuality.dataCompleteness}% Complete
              </span>
            </div>
            <div style={{ height: '4px', background: 'var(--bg-tertiary)', borderRadius: '2px', overflow: 'hidden', marginBottom: '16px' }}>
              <div style={{ height: '100%', width: `${data.dataQuality.dataCompleteness}%`, background: data.dataQuality.dataCompleteness >= 80 ? 'var(--success)' : data.dataQuality.dataCompleteness >= 50 ? 'var(--warning)' : 'var(--critical)', transition: 'width 1s ease-out' }} />
            </div>

            {data.dataQuality.trustedSourcesEngine && data.dataQuality.trustedSourcesEngine.length > 0 && (
              <div style={{ padding: '12px', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginBottom: '12px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <Globe size={12} /> Trusted Institutional Sources
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, lineHeight: 1.5 }}>
                  {data.dataQuality.trustedSourcesEngine.join(' • ')}
                </div>
              </div>
            )}

            {data.dataQuality.anomaliesDetected.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {data.dataQuality.anomaliesDetected.map((a, i) => (
                  <div key={i} style={{ fontSize: '12px', color: 'var(--warning)', fontWeight: 600, display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <AlertTriangle size={12} /> {a}
                  </div>
                ))}
              </div>
            )}
            {data.score.conflictingSignals.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Conflicting Signals</div>
                {data.score.conflictingSignals.map((s, i) => (
                  <div key={i} style={{ fontSize: '12px', color: 'var(--warning)', fontWeight: 600 }}>{s}</div>
                ))}
              </div>
            )}
         </div>
       )}
    </div>
  );
}
