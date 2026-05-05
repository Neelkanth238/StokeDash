'use client';

import { useState, useEffect } from 'react';
import { StockData, TechnicalData, PricePoint } from '@/lib/types';
import { formatCurrencyPrecision } from '@/lib/formatters';
import { TrendingUp, TrendingDown, Plus, Trash2, Search, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import PriceChart from '@/components/PriceChart';

import { getWatchlist } from '@/lib/data';

interface WatchItem {
  ticker: string;
  stock: StockData;
  tech: TechnicalData;
  history: PricePoint[];
}

interface Props {
  onAnalyze: (ticker: string) => void;
  market: string;
}

export default function WatchlistPage({ onAnalyze, market }: Props) {
  const [items, setItems] = useState<WatchItem[]>([]);
  const [tickers, setTickers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [addInput, setAddInput] = useState('');

  useEffect(() => {
    const currentWatchlist = getWatchlist(market);
    const defaults = Object.keys(currentWatchlist).slice(0, 6);
    setTickers(defaults);
  }, [market]);

  useEffect(() => {
    async function loadData() {
      if (tickers.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const built: WatchItem[] = [];
      for (const t of tickers) {
        try {
          const params = new URLSearchParams({ ticker: t, market });
          const res = await fetch(`/api/analyze?${params}`);
          const data = await res.json();
          if (!data.error) {
            built.push({ 
              ticker: t, 
              stock: data.stock, 
              tech: data.technical, 
              history: data.priceHistory.slice(-60) 
            });
          }
        } catch (e) {
          console.error(`Failed to fetch ${t}`, e);
        }
      }
      setItems(built);
      setLoading(false);
    }
    loadData();
  }, [tickers, market]);

  function addTicker() {
    const t = addInput.trim().toUpperCase();
    if (!t || tickers.includes(t)) return;
    setTickers((prev) => [...prev, t]);
    setAddInput('');
  }

  function removeTicker(t: string) {
    setTickers((prev) => prev.filter((x) => x !== t));
  }

  return (
    <div className="fade-in" style={{ padding: 'var(--space-2xl)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2xl)' }}>
         <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.03em' }}>Institutional Vault</h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Proprietary tracking of {tickers.length} high-conviction assets</p>
         </div>
         
         <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ position: 'relative' }}>
               <input
                 placeholder="Quick add ticker..."
                 value={addInput}
                 onChange={(e) => setAddInput(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && addTicker()}
                 style={{ 
                   width: '200px', height: '40px', borderRadius: 'var(--radius-sm)', 
                   background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', 
                   paddingLeft: '32px', fontSize: '12px', fontWeight: 600, outline: 'none'
                 }}
               />
               <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '13px' }} />
            </div>
            <button className="btn btn-primary" onClick={addTicker} style={{ height: '40px', padding: '0 16px', gap: '6px' }}>
               <Plus size={14} /> <span>Add</span>
            </button>
         </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '100px', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '32px', height: '32px', border: '3px solid var(--border-subtle)', borderTopColor: 'var(--brand)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <span className="mono" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>QUERING ASSETS...</span>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Asset</th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Price</th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Change</th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Trend</th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>RSI</th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Sparkline</th>
                <th style={{ padding: '12px 24px', textAlign: 'right', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(({ ticker, stock, tech, history }) => (
                <tr key={ticker} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '16px 24px' }}>
                    <div>
                      <div className="mono" style={{ fontWeight: 700, fontSize: '14px', color: 'var(--brand)' }}>{ticker}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>{stock.companyName}</div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span className="mono" style={{ fontWeight: 700, fontSize: '14px' }}>{formatCurrencyPrecision(stock.currentPrice, market)}</span>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div className={`change-pill ${stock.change >= 0 ? 'up' : 'down'}`} style={{ width: 'fit-content' }}>
                      {stock.change >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                      {stock.changePercent.toFixed(2)}%
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span className="badge" style={{ 
                      color: tech.trend === 'uptrend' ? 'var(--success)' : tech.trend === 'downtrend' ? 'var(--critical)' : 'var(--warning)',
                      textTransform: 'uppercase', fontSize: '9px'
                    }}>
                      {tech.trend}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div className="mono" style={{ fontWeight: 700, fontSize: '12px' }}>{tech.rsi14.toFixed(1)}</div>
                  </td>
                  <td style={{ padding: '16px 24px', width: '120px' }}>
                    <PriceChart data={history} market={market} height={24} compact showGrid={false} />
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                      <button className="btn btn-secondary" onClick={() => onAnalyze(ticker)} style={{ fontSize: '11px', padding: '4px 10px' }}>Analyze</button>
                      <button onClick={() => removeTicker(ticker)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-md)', marginTop: 'var(--space-2xl)' }}>
          {[
            { label: 'Bullish Phase', val: items.filter((i) => i.tech.trend === 'uptrend').length },
            { label: 'Exhaustion', val: items.filter((i) => i.tech.rsi14 > 65).length },
            { label: 'Advancing', val: items.filter((i) => i.stock.changePercent > 0).length },
            { label: 'Group Alpha', val: `${(items.reduce((a, b) => a + b.stock.changePercent, 0) / items.length).toFixed(2)}%` },
          ].map(stat => (
            <div key={stat.label} className="card" style={{ padding: 'var(--space-lg)' }}>
               <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>{stat.label}</div>
               <div className="mono" style={{ fontSize: '20px', fontWeight: 700 }}>{stat.val}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
