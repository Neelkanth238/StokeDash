'use client';

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { PricePoint } from '@/lib/types';
import { format } from 'date-fns';
import { formatCurrency, formatCurrencyPrecision } from '@/lib/formatters';

interface Props {
  data: PricePoint[];
  market?: string;
  height?: number;
  showGrid?: boolean;
  compact?: boolean;
  supportLevel?: number;
  resistanceLevel?: number;
}

function CustomTooltip({ active, payload, label, market = 'US' }: { active?: boolean; payload?: { value: number }[]; label?: string; market?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'white', border: '1px solid var(--border-muted)',
      borderRadius: 'var(--radius-sm)', padding: '6px 10px', fontSize: '11px',
      boxShadow: 'var(--shadow-md)'
    }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>{label}</div>
      <div className="mono" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
        {formatCurrencyPrecision(payload[0].value, market)}
      </div>
    </div>
  );
}

export default function PriceChart({ data, market = 'US', height = 220, showGrid = true, compact = false, supportLevel, resistanceLevel }: Props) {
  if (!data || data.length === 0) return null;

  const sliced = compact ? data.slice(-60) : data;
  const first = sliced[0].close;
  const last = sliced[sliced.length - 1].close;
  const isUp = last >= first;
  const color = isUp ? 'var(--success)' : 'var(--critical)';
  const gradId = isUp ? 'areaUp' : 'areaDown';

  const displayData = sliced.map((p) => ({
    date: compact
      ? format(new Date(p.date), 'MMM d')
      : format(new Date(p.date), 'MMM yy'),
    close: p.close,
    volume: p.volume,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={displayData} margin={{ top: 8, right: 8, bottom: 0, left: compact ? 0 : 4 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.15} />
            <stop offset="90%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        {showGrid && (
          <CartesianGrid strokeDasharray="4 4" stroke="var(--border-subtle)" vertical={false} />
        )}
        {!compact && (
          <XAxis
            dataKey="date"
            tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 500 }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            dy={10}
          />
        )}
        {!compact && (
          <YAxis
            domain={['auto', 'auto']}
            tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 500 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => formatCurrency(v, market, 0)}
            width={48}
          />
        )}
        <Tooltip content={<CustomTooltip market={market} />} />
        {supportLevel && (
          <ReferenceLine y={supportLevel} stroke="var(--success)" strokeDasharray="4 4" strokeOpacity={0.4} />
        )}
        {resistanceLevel && (
          <ReferenceLine y={resistanceLevel} stroke="var(--critical)" strokeDasharray="4 4" strokeOpacity={0.4} />
        )}
        <Area
          type="monotone"
          dataKey="close"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#${gradId})`}
          dot={false}
          activeDot={{ r: 4, fill: color, stroke: '#fff', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
