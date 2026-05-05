'use client';

import { useEffect, useState } from 'react';
import { StockData, TechnicalData, CompositeScore } from '@/lib/types';
import { formatCurrencyPrecision } from '@/lib/formatters';
import { Activity, Disc, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts';

interface MarketItem {
  ticker: string;
  stock: StockData;
  tech: TechnicalData;
  score: CompositeScore;
}

function SectorCard({ sector, items }: { sector: string; items: MarketItem[] }) {
  const avgChange = items.reduce((a, b) => a + b.stock.changePercent, 0) / items.length;
  const isUp = avgChange >= 0;
  return (
    <div className="card" style={{ padding: 'var(--space-md)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{sector}</span>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isUp ? 'var(--success)' : 'var(--critical)' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
        <span className="mono" style={{ fontSize: '20px', fontWeight: 700, color: isUp ? 'var(--success)' : 'var(--critical)' }}>
          {isUp ? '+' : ''}{avgChange.toFixed(2)}%
        </span>
      </div>
      <p style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '2px' }}>{items.length} Tracked</p>
    </div>
  );
}

interface Props {
  onAnalyze: (ticker: string) => void;
  market: string;
}

export default function MarketsPage({ onAnalyze, market }: Props) {
  const [items, setItems] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const tickers = market === 'IN' 
          ? ['RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'ICICIBANK.NS', 'SBIN.NS', 'BHARTIARTL.NS', 'ITC.NS', 'LT.NS']
          : market === 'EU'
          ? ['ASML.AS', 'SAP.DE', 'SIE.DE', 'MC.PA', 'TTE.PA', 'AIR.PA', 'AZN.L', 'NOVN.SW', 'NESN.SW']
          : ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'TSLA', 'JPM', 'UNH', 'V'];
        const built: MarketItem[] = [];
        
        for (const t of tickers) {
          const r = await fetch(`/api/analyze?ticker=${t}&market=${market}`);
          const d = await r.json();
          if (!d.error) {
            built.push({ ticker: t, stock: d.stock, tech: d.technical, score: d.score });
          }
        }
        setItems(built.sort((a, b) => b.score.total - a.score.total));
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }
    loadData();
  }, [market]);

  if (loading) return (
    <div style={{ display: 'flex', height: '60vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }}>
      <div style={{ width: '32px', height: '32px', border: '3px solid var(--border-subtle)', borderTopColor: 'var(--brand)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span className="mono" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>MAPPING ECOSYSTEM...</span>
    </div>
  );

  const sectorMap: Record<string, MarketItem[]> = {};
  items.forEach((i) => {
    if (!sectorMap[i.stock.sector]) sectorMap[i.stock.sector] = [];
    sectorMap[i.stock.sector].push(i);
  });

  const barData = items.map((i) => ({
    ticker: i.ticker,
    score: i.score.total,
    fill: i.score.total >= 70 ? 'var(--success)' : i.score.total >= 55 ? 'var(--warning)' : 'var(--critical)',
  }));

  const radarData = [
    { factor: 'Tech', avg: items.length > 0 ? +(items.reduce((a, b) => a + b.score.technical, 0) / items.length).toFixed(1) : 50 },
    { factor: 'Fund', avg: items.length > 0 ? +(items.reduce((a, b) => a + b.score.fundamental, 0) / items.length).toFixed(1) : 50 },
    { factor: 'Action', avg: items.length > 0 ? +(items.reduce((a, b) => a + b.score.priceAction, 0) / items.length).toFixed(1) : 50 },
    { factor: 'Sent', avg: items.length > 0 ? +(items.reduce((a, b) => a + b.score.sentiment, 0) / items.length).toFixed(1) : 50 },
    { factor: 'Macro', avg: items.length > 0 ? +(items.reduce((a, b) => a + b.score.macro, 0) / items.length).toFixed(1) : 50 },
  ];

  return (
    <div className="fade-in" style={{ padding: 'var(--space-2xl)' }}>
      <div style={{ marginBottom: 'var(--space-2xl)' }}>
         <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.03em' }}>Ecosystem Mapping</h1>
         <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Real-time cross-asset intelligence and sector distribution</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 'var(--space-md)', marginBottom: 'var(--space-2xl)' }}>
         <div className="card" style={{ padding: 'var(--space-xl)' }}>
            <h3 style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '32px' }}>Composite Score Distribution</h3>
            <ResponsiveContainer width="100%" height={240}>
               <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="4 4" stroke="var(--border-subtle)" vertical={false} />
                  <XAxis dataKey="ticker" tick={{ fill: 'var(--text-muted)', fontSize: 9, fontWeight: 700 }} />
                  <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 500 }} />
                  <Tooltip cursor={{ fill: 'var(--bg-secondary)' }} contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-muted)', boxShadow: 'var(--shadow-md)', fontSize: '11px' }} />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                     {barData.map((e, i) => <Cell key={i} fill={e.fill} fillOpacity={0.6} />)}
                  </Bar>
               </BarChart>
            </ResponsiveContainer>
         </div>
         <div className="card" style={{ padding: 'var(--space-xl)' }}>
            <h3 style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '32px' }}>Tactical Breadth</h3>
            <ResponsiveContainer width="100%" height={240}>
               <RadarChart data={radarData}>
                  <PolarGrid stroke="var(--border-muted)" />
                  <PolarAngleAxis dataKey="factor" tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 700 }} />
                  <Radar name="Market Avg" dataKey="avg" stroke="var(--brand)" fill="var(--brand)" fillOpacity={0.06} strokeWidth={1.5} />
               </RadarChart>
            </ResponsiveContainer>
         </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-md)', marginBottom: 'var(--space-2xl)' }}>
         {Object.entries(sectorMap).map(([sector, secItems]) => (
            <SectorCard key={sector} sector={sector} items={secItems} />
         ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
         <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Activity size={16} color="var(--brand)" />
            <h3 style={{ fontSize: '14px', fontWeight: 700 }}>Tactical Asset Ranking</h3>
         </div>
         <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
               <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Rank</th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Asset</th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Price</th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Change</th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Intelligence</th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Trend</th>
                  <th style={{ padding: '12px 24px', textAlign: 'right', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Action</th>
               </tr>
            </thead>
            <tbody>
               {items.map((item, idx) => (
                  <tr key={item.ticker} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                     <td style={{ padding: '14px 24px' }}><span className="mono" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>{String(idx + 1).padStart(2, '0')}</span></td>
                     <td style={{ padding: '14px 24px' }}>
                        <div>
                           <div className="mono" style={{ fontWeight: 700, fontSize: '13px', color: 'var(--brand)' }}>{item.ticker}</div>
                           <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500 }}>{item.stock.companyName}</div>
                        </div>
                     </td>
                     <td style={{ padding: '14px 24px' }}><span className="mono" style={{ fontWeight: 700, fontSize: '13px' }}>{formatCurrencyPrecision(item.stock.currentPrice, market)}</span></td>
                     <td style={{ padding: '14px 24px' }}>
                        <div className={`change-pill ${item.stock.change >= 0 ? 'up' : 'down'}`} style={{ width: 'fit-content' }}>
                           {item.stock.changePercent.toFixed(2)}%
                        </div>
                     </td>
                     <td style={{ padding: '14px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                           <div style={{ width: '32px', height: '3px', background: 'var(--bg-tertiary)', borderRadius: '2px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${item.score.total}%`, background: 'var(--brand)', opacity: 0.5 }} />
                           </div>
                           <span className="mono" style={{ fontWeight: 700, fontSize: '12px' }}>{item.score.total}</span>
                        </div>
                     </td>
                     <td style={{ padding: '14px 24px' }}>
                        <span className="badge" style={{ fontSize: '9px', textTransform: 'uppercase' }}>{item.tech.trend}</span>
                     </td>
                     <td style={{ padding: '14px 24px', textAlign: 'right' }}>
                        <button className="btn btn-secondary" onClick={() => onAnalyze(item.ticker)} style={{ fontSize: '11px', padding: '4px 10px' }}>Analyze</button>
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>
    </div>
  );
}
