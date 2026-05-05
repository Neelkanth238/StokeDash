'use client';

import { CompositeScore } from '@/lib/types';

interface Props {
  score: CompositeScore;
}

const FACTORS = [
  { key: 'technical', label: 'Tech' },
  { key: 'fundamental', label: 'Fund' },
  { key: 'priceAction', label: 'Actn' },
  { key: 'sentiment', label: 'Sent' },
  { key: 'macro', label: 'Macr' },
] as const;

export default function ScoreBreakdown({ score }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {FACTORS.map(({ key, label }) => {
        const val = score[key as keyof CompositeScore] as number;
        return (
          <div key={key} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 24px', gap: '12px', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)' }}>{label}</span>
            <div style={{ height: '3px', background: 'var(--bg-tertiary)', borderRadius: '2px', overflow: 'hidden' }}>
              <div
                style={{ 
                  height: '100%', 
                  width: `${val}%`, 
                  background: 'var(--brand)',
                  opacity: 0.4,
                  transition: 'width 1s ease-out'
                }}
              />
            </div>
            <span className="mono" style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>{val}</span>
          </div>
        );
      })}
    </div>
  );
}
