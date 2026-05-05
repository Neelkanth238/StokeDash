'use client';

import { PageId } from '@/app/page';
import {
  LayoutDashboard,
  LineChart,
  BookMarked,
  TrendingUp,
  Settings,
  HelpCircle,
  Zap,
  Newspaper
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'home', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'analyze', label: 'Analysis', icon: LineChart },
  { id: 'watchlist', label: 'Watchlist', icon: BookMarked },
  { id: 'markets', label: 'Marketwide', icon: TrendingUp },
  { id: 'news', label: 'Global News', icon: Newspaper },
] as const;

interface Props {
  activePage: PageId;
  onNavigate: (page: any) => void;
}

export default function Sidebar({ activePage, onNavigate }: Props) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '32px', 
            height: '32px', 
            background: 'var(--brand)', 
            borderRadius: 'var(--radius-sm)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center'
          }}>
            <Zap size={18} color="white" fill="white" />
          </div>
          <div>
            <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '16px', letterSpacing: '-0.04em', lineHeight: 1 }}>STOKE</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '1px' }}>Intelligence</div>
          </div>
        </div>
      </div>

      <nav className="nav-group">
        <div className="nav-label">Main Menu</div>
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`nav-item ${activePage === id ? 'active' : ''}`}
            onClick={() => onNavigate(id)}
          >
            <Icon size={18} strokeWidth={activePage === id ? 2.5 : 2} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div style={{ marginTop: 'auto' }}>
        <nav className="nav-group">
          <div className="nav-label">Systems</div>
          <button className="nav-item">
            <Settings size={18} />
            <span>Settings</span>
          </button>
          <button className="nav-item">
            <HelpCircle size={18} />
            <span>Support</span>
          </button>
        </nav>
      </div>
    </aside>
  );
}
