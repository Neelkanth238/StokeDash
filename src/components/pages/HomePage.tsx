'use client';

import { useEffect, useState } from 'react';
import { TopStock, MarketOverview } from '@/lib/types';
import { formatCurrency } from '@/lib/formatters';
import ScoreRing from '@/components/ScoreRing';
import ScoreBreakdown from '@/components/ScoreBreakdown';
import { RefreshCw, ArrowUpRight, ArrowDownRight, Zap } from 'lucide-react';

interface HomeData {
  topFive: TopStock[];
  market: MarketOverview;
  generatedAt: string;
}

function MarketCard({ label, value, ticker }: { label: string; value: number; ticker: string }) {
  const isPositive = value >= 0;
  return (
    <div className="card fade-in" style={{ padding: 'var(--space-md)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span className="mono" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>{ticker}</span>
        {isPositive ? <ArrowUpRight size={14} color="var(--success)" /> : <ArrowDownRight size={14} color="var(--critical)" />}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <span style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em' }}>{isPositive ? '+' : ''}{value.toFixed(2)}%</span>
      </div>
      <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</p>
    </div>
  );
}

function FearGreedMeter({ value, label }: { value: number; label: string }) {
  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
        <div>
          <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Sentiment Index</p>
          <div style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.04em' }}>{value}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span className="badge" style={{ padding: '4px 12px' }}>{label}</span>
        </div>
      </div>
      
      <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden', position: 'relative' }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, height: '100%',
          width: '100%', background: 'linear-gradient(to right, var(--critical), var(--warning), var(--success))',
          opacity: 0.2
        }} />
        <div style={{
          position: 'absolute', top: 0, left: `${value}%`, transform: 'translateX(-50%)',
          height: '100%', width: '4px', background: 'var(--brand)', borderRadius: '2px', zIndex: 2
        }} />
      </div>
    </div>
  );
}

function StockCard({ stock, onAnalyze, market }: { stock: TopStock; onAnalyze: (ticker: string) => void; market: string }) {
  return (
    <div className="card fade-in" onClick={() => onAnalyze(stock.ticker)} style={{ cursor: 'pointer', padding: 'var(--space-lg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <ScoreRing score={stock.score} size={56} />
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.03em' }}>{stock.ticker}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>{stock.companyName}</div>
          </div>
        </div>
        <div className="badge">#{stock.rank}</div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <div className="mono" style={{ fontSize: '24px', fontWeight: 700 }}>{formatCurrency(stock.currentPrice, market)}</div>
        <div className={`change-pill ${stock.changePercent >= 0 ? 'up' : 'down'}`} style={{ width: 'fit-content', marginTop: '4px' }}>
          {stock.changePercent >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {stock.changePercent.toFixed(2)}%
        </div>
      </div>

      <ScoreBreakdown score={stock.score} />
    </div>
  );
}

interface Props {
  onAnalyze: (ticker: string) => void;
  market: string;
}

export default function HomePage({ onAnalyze, market }: Props) {
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/top5?market=${market}`).then(r => r.json()).then(d => {
      setData(d);
      setLoading(false);
    });
  }, [market]);

  if (loading) return (
    <div style={{ display: 'flex', height: '60vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-subtle)', borderTopColor: 'var(--brand)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span className="mono" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>SYNCHRONIZING...</span>
    </div>
  );

  if (!data || !data.market || !data.topFive) return null;

  return (
    <div className="fade-in" style={{ padding: 'var(--space-2xl)' }}>
      {/* Market Overview Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-md)', marginBottom: 'var(--space-2xl)' }}>
        <MarketCard ticker={data.market.index1Name} label="Primary Index" value={data.market.index1Change} />
        <MarketCard ticker={data.market.index2Name} label="Secondary Index" value={data.market.index2Change} />
        <MarketCard ticker={data.market.index3Name} label="Tertiary Index" value={data.market.index3Change} />
        <div className="card" style={{ background: 'var(--brand)', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Zap size={14} fill="white" />
            <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>Risk State</span>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700 }}>Neutral Positive</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 'var(--space-md)', marginBottom: 'var(--space-2xl)' }}>
        <div className="card" style={{ padding: 'var(--space-xl)' }}>
          <FearGreedMeter value={data.market.fearGreedIndex} label={data.market.fearGreedLabel} />
        </div>
        <div className="card" style={{ padding: 'var(--space-xl)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Volatility (VIX)</p>
            <div className="mono" style={{ fontSize: '32px', fontWeight: 700 }}>{data.market.vixLevel.toFixed(2)}</div>
          </div>
          <div style={{ height: '4px', background: 'var(--bg-tertiary)', borderRadius: '2px', overflow: 'hidden', marginTop: '12px' }}>
            <div style={{ height: '100%', width: `${Math.min(data.market.vixLevel * 3, 100)}%`, background: data.market.vixLevel > 20 ? 'var(--critical)' : 'var(--success)' }} />
          </div>
        </div>
      </div>

      {/* Market Leaders */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--space-xl)' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.03em' }}>Institutional Favorites</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Top 5 assets with highest composite intelligence scores</p>
        </div>
        <button onClick={() => window.location.reload()} className="btn btn-secondary" style={{ gap: '8px' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-md)' }}>
        {data.topFive.map((stock) => (
          <StockCard key={stock.ticker} stock={stock} onAnalyze={onAnalyze} market={market} />
        ))}
      </div>

      {/* Legend / Info */}
      <div style={{ marginTop: 'var(--space-2xl)', padding: 'var(--space-xl)', borderTop: '1px solid var(--border-subtle)', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '24px' }}>
        {[
          { label: 'Technicals', val: '25%' },
          { label: 'Fundamentals', val: '25%' },
          { label: 'Momentum', val: '20%' },
          { label: 'Sentiment', val: '15%' },
          { label: 'Macro', val: '15%' },
        ].map((item) => (
          <div key={item.label}>
            <div className="mono" style={{ fontSize: '16px', fontWeight: 700 }}>{item.val}</div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
