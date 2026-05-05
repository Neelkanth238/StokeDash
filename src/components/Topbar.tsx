'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, Bell, RefreshCw, Command } from 'lucide-react';
import { getWatchlist } from '@/lib/data';
import { PageId } from '@/app/page';

const PAGE_TITLES: Record<PageId, { title: string; subtitle: string }> = {
  home: { title: 'Intelligence Dashboard', subtitle: 'Real-time market tracking & institutional feeds' },
  analyze: { title: 'Asset Deep-Dive', subtitle: 'Live analytical reporting & scoring' },
  watchlist: { title: 'Priority Assets', subtitle: 'Quantitatively tracked user selection' },
  markets: { title: 'Marketwide Intelligence', subtitle: 'Real-time indicators & aggregates' },
  news: { title: 'Global News Feed', subtitle: 'Real-time financial and market updates' },
};

interface Props {
  activePage: PageId;
  onNavigate: (ticker: string) => void;
  market: string;
  onMarketChange: (m: string) => void;
}

export default function Topbar({ activePage, onNavigate, market, onMarketChange }: Props) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [time, setTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  function handleSearch(val: string) {
    setQuery(val);
    if (val.length === 0) { setSuggestions([]); setShowSuggestions(false); return; }
    const upper = val.toUpperCase();
    const currentWatchlist = getWatchlist(market);
    const matches = Object.entries(currentWatchlist)
      .filter(([t, i]) => t.includes(upper) || i.name.toUpperCase().includes(upper))
      .slice(0, 6)
      .map(([t]) => t);
    setSuggestions(matches);
    setShowSuggestions(true);
  }

  function handleSelect(ticker: string) {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    onNavigate(ticker);
  }

  const { title, subtitle } = PAGE_TITLES[activePage];
  const marketTime = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  const currentWatchlist = getWatchlist(market);

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1 className="topbar-title">{title}</h1>
        <p className="topbar-subtitle">{subtitle}</p>
      </div>

      <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        
        {/* Market Switcher */}
        <div style={{ display: 'flex', background: 'var(--bg-tertiary)', padding: '3px', borderRadius: 'var(--radius-sm)' }}>
          <button 
            onClick={() => onMarketChange('IN')}
            className="btn"
            style={{ 
              padding: '6px 12px', 
              background: market === 'IN' ? 'var(--bg-card)' : 'transparent',
              boxShadow: market === 'IN' ? 'var(--shadow-sm)' : 'none',
              color: market === 'IN' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: '11px',
              fontWeight: 700
            }}>
            IND
          </button>
          <button 
            onClick={() => onMarketChange('US')}
            className="btn"
            style={{ 
              padding: '6px 12px', 
              background: market === 'US' ? 'var(--bg-card)' : 'transparent',
              boxShadow: market === 'US' ? 'var(--shadow-sm)' : 'none',
              color: market === 'US' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: '11px',
              fontWeight: 700
            }}>
            USA
          </button>
          <button 
            onClick={() => onMarketChange('EU')}
            className="btn"
            style={{ 
              padding: '6px 12px', 
              background: market === 'EU' ? 'var(--bg-card)' : 'transparent',
              boxShadow: market === 'EU' ? 'var(--shadow-sm)' : 'none',
              color: market === 'EU' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: '11px',
              fontWeight: 700
            }}>
            EUR
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-muted)', borderRight: '1px solid var(--border-subtle)', paddingRight: '24px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)' }} />
          <span className="mono" style={{ fontWeight: 600 }}>{mounted ? marketTime : '00:00:00'}</span>
        </div>

        <div style={{ position: 'relative' }}>
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-tertiary)', 
            padding: '0 12px', borderRadius: 'var(--radius-sm)', width: '280px', height: '36px',
            border: '1px solid transparent', transition: 'var(--transition)'
          }}
          className="search-box-container"
          >
            <Search size={14} color="var(--text-muted)" />
            <input
              ref={inputRef}
              placeholder="Quick search..."
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => query && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px', background: 'var(--bg-card)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', boxShadow: 'var(--shadow-sm)' }}>
              <Command size={10} />
              <span>K</span>
            </div>
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '8px',
              background: 'white', border: '1px solid var(--border-muted)',
              borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)',
              zIndex: 200, overflow: 'hidden', padding: '4px'
            }}>
              {suggestions.map((t) => (
                <div
                  key={t}
                  onClick={() => handleSelect(t)}
                  style={{
                    padding: '10px 12px', cursor: 'pointer', borderRadius: 'var(--radius-xs)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    transition: 'var(--transition)',
                  }}
                  className="search-suggestion-item"
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="mono" style={{ fontWeight: 700, color: 'var(--brand)', fontSize: '13px' }}>{t}</span>
                    <span style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500 }}>{currentWatchlist[t]?.name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '4px' }}>
          <button className="btn btn-secondary" style={{ width: '36px', height: '36px', padding: 0 }}><Bell size={18} /></button>
          <button onClick={() => window.location.reload()} className="btn btn-secondary" style={{ width: '36px', height: '36px', padding: 0 }}><RefreshCw size={18} /></button>
        </div>
      </div>
    </header>
  );
}
