'use client';

import {
  Building2, UserCheck, Users, PieChart, AlertTriangle
} from 'lucide-react';
import {
  ResponsiveContainer, PieChart as RPieChart, Pie, Cell, Tooltip
} from 'recharts';

export interface InvestorData {
  ticker: string;
  breakdown: {
    insiderPct: number | null;
    institutionPct: number | null;
    floatPct: number | null;
    institutionCount: number | null;
  };
  institutions: {
    organization: string;
    pctHeld: number | null;
    shares: number | null;
    value: number | null;
    reportDate: any;
  }[];
  funds: {
    organization: string;
    pctHeld: number | null;
    shares: number | null;
    reportDate: any;
  }[];
  insiders: {
    name: string;
    relation: string;
    shares: number | null;
    latestTransType: string | null;
    transactionDate: any;
  }[];
  fetchedAt: string;
}

interface Props {
  investors: InvestorData | null;
  ticker: string;
}

function formatShares(n: number | null): string {
  if (n == null) return 'N/A';
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return String(n);
}

export default function InvestorsTab({ investors, ticker }: Props) {
  if (!investors) {
    return (
      <div className="card" style={{ padding: 'var(--space-2xl)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' }}>
        <Building2 size={48} color="var(--border-strong)" />
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Ownership Data Unavailable</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Institutional ownership data could not be fetched for <strong>{ticker}</strong>. This is common for non-US listed stocks.
          </p>
        </div>
      </div>
    );
  }

  const { breakdown, institutions, funds, insiders } = investors;

  const pieData = [
    { name: 'Institutions', value: breakdown.institutionPct ?? 0, color: 'var(--brand)' },
    { name: 'Insiders',     value: breakdown.insiderPct ?? 0,     color: 'var(--warning)' },
    { name: 'Public Float', value: Math.max(0, 100 - (breakdown.institutionPct ?? 0) - (breakdown.insiderPct ?? 0)), color: 'var(--border-muted)' },
  ].filter(d => d.value > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>

      {/* Ownership Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 'var(--space-md)' }}>

        {/* Donut Pie */}
        <div className="card" style={{ padding: 'var(--space-xl)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '16px', alignSelf: 'flex-start' }}>
            Ownership Split
          </h3>
          <ResponsiveContainer width="100%" height={140}>
            <RPieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" strokeWidth={0}>
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v: any) => [`${Number(v).toFixed(1)}%`, '']} />
            </RPieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', marginTop: '8px' }}>
            {pieData.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: d.color }} />
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>{d.name}</span>
                </div>
                <span className="mono" style={{ fontSize: '12px', fontWeight: 700 }}>{d.value.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Summary Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-md)' }}>
          {([
            { label: 'Institutional Holdings', val: breakdown.institutionPct != null ? `${breakdown.institutionPct}%` : 'N/A', Icon: Building2, sub: 'Of total shares' },
            { label: 'Insider Holdings',       val: breakdown.insiderPct != null ? `${breakdown.insiderPct}%` : 'N/A',     Icon: UserCheck, sub: 'Directors & Officers' },
            { label: 'Float Ownership',        val: breakdown.floatPct != null ? `${breakdown.floatPct}%` : 'N/A',         Icon: PieChart,  sub: 'Inst. % of float' },
            { label: 'Institution Count',      val: breakdown.institutionCount != null ? breakdown.institutionCount.toLocaleString() : 'N/A', Icon: Users, sub: 'Reporting institutions' },
          ] as const).map(s => (
            <div key={s.label} className="card" style={{ padding: 'var(--space-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <s.Icon size={12} color="var(--text-muted)" />
                <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{s.label}</span>
              </div>
              <div className="mono" style={{ fontSize: '28px', fontWeight: 700 }}>{s.val}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: 500 }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Institutional Holders */}
      {institutions.length > 0 && (
        <div className="card" style={{ padding: 'var(--space-xl)' }}>
          <h3 style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={13} /> Top Institutional Holders
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-subtle)' }}>
                  {['Institution', '% Held', 'Shares', 'Value (USD)', 'Report Date'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: h === 'Institution' ? 'left' : 'right', fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {institutions.map((inst, i) => (
                  <tr
                    key={i}
                    style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s', cursor: 'default' }}
                    onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-secondary)'; }}
                    onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{inst.organization}</td>
                    <td className="mono" style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--brand)' }}>
                      {inst.pctHeld != null ? `${inst.pctHeld}%` : 'N/A'}
                    </td>
                    <td className="mono" style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                      {formatShares(inst.shares)}
                    </td>
                    <td className="mono" style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                      {inst.value != null ? `$${formatShares(inst.value)}` : 'N/A'}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-muted)', fontSize: '12px' }}>
                      {inst.reportDate
                        ? new Date(inst.reportDate * 1000).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                        : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Fund Ownership + Insider Transactions side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>

        {funds.length > 0 && (
          <div className="card" style={{ padding: 'var(--space-xl)' }}>
            <h3 style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PieChart size={13} /> Fund Ownership
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {funds.map((f, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>{f.organization}</span>
                  <div style={{ textAlign: 'right' }}>
                    <div className="mono" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--brand)' }}>
                      {f.pctHeld != null ? `${f.pctHeld}%` : 'N/A'}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {formatShares(f.shares)} shares
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {insiders.length > 0 && (
          <div className="card" style={{ padding: 'var(--space-xl)' }}>
            <h3 style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserCheck size={13} /> Recent Insider Transactions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {insiders.map((ins, i) => {
                const lower = (ins.latestTransType || '').toLowerCase();
                const isBuy  = lower.includes('buy') || lower.includes('purchase');
                const isSell = lower.includes('sell') || lower.includes('sale');
                const badgeBg = isBuy ? 'var(--success)' : isSell ? 'var(--critical)' : 'var(--border-muted)';
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700 }}>{ins.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>{ins.relation}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {ins.latestTransType && (
                        <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 8px', borderRadius: '3px', textTransform: 'uppercase', background: badgeBg, color: 'white' }}>
                          {ins.latestTransType}
                        </span>
                      )}
                      <div className="mono" style={{ fontSize: '12px', fontWeight: 700, marginTop: '4px' }}>
                        {formatShares(ins.shares)} shares
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {funds.length === 0 && insiders.length === 0 && (
          <div className="card" style={{ gridColumn: 'span 2', padding: 'var(--space-xl)', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Users size={32} style={{ margin: '0 auto 12px', display: 'block' }} />
            <p style={{ fontSize: '14px', fontWeight: 600 }}>Fund and insider data not available for this security.</p>
          </div>
        )}
      </div>
    </div>
  );
}
