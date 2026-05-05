'use client';

import { CompositeScore } from '@/lib/types';

interface Props {
  score: CompositeScore;
  size?: number;
}

export default function ScoreRing({ score, size = 80 }: Props) {
  const strokeWidth = size * 0.06;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const fill = (score.total / 100) * circumference;
  
  const color =
    score.total >= 75 ? 'var(--success)' : 
    score.total >= 65 ? '#22c55e' :
    score.total >= 45 ? 'var(--warning)' : 
    score.total >= 30 ? '#f97316' :
    'var(--critical)';

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
        <circle 
          cx={size / 2} 
          cy={size / 2} 
          r={radius} 
          fill="none" 
          stroke="var(--bg-tertiary)" 
          strokeWidth={strokeWidth} 
        />
        
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - fill}
          style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.165, 0.84, 0.44, 1)' }}
        />
      </svg>
      
      <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span className="mono" style={{ 
          fontSize: size * 0.25, 
          fontWeight: 700, 
          color: 'var(--text-primary)', 
          lineHeight: 1, 
        }}>
          {score.total}
        </span>
      </div>
    </div>
  );
}
