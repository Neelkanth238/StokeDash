'use client';

import { useState, useEffect } from 'react';
import { Newspaper, ExternalLink, RefreshCw, AlertTriangle, Clock } from 'lucide-react';

interface Props {
  market: string;
}

interface NewsArticle {
  uuid: string;
  title: string;
  publisher: string;
  link: string;
  providerPublishTime: number;
  type: string;
}

export default function NewsPage({ market }: Props) {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchNews() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/news?market=${market}`);
      if (!res.ok) throw new Error('Failed to fetch news');
      const data = await res.json();
      setNews(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNews();
  }, [market]);

  function formatTime(timestamp: number | string) {
    let date: Date;
    if (typeof timestamp === 'number') {
      date = new Date(timestamp * 1000);
    } else {
      date = new Date(timestamp);
    }
    
    if (isNaN(date.getTime())) return 'Recent';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  }

  return (
    <div className="fade-in" style={{ padding: 'var(--space-2xl)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--space-xl)' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.04em', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Newspaper size={28} color="var(--brand)" /> 
            Global Market News
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '15px', fontWeight: 500 }}>Live financial updates and press releases</p>
        </div>
        <button className="btn" onClick={fetchNews} style={{ padding: '10px 16px', gap: '8px', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {loading && !news.length && (
        <div style={{ display: 'flex', height: '400px', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }}>
          <div style={{ width: '32px', height: '32px', border: '3px solid var(--border-subtle)', borderTopColor: 'var(--brand)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>AGGREGATING FEEDS...</div>
        </div>
      )}

      {error && (
        <div className="card" style={{ padding: 'var(--space-lg)', background: '#fef2f2', border: '1px solid #fee2e2', color: 'var(--critical)', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <AlertTriangle size={20} />
          <span style={{ fontWeight: 600 }}>{error}</span>
        </div>
      )}

      {!loading && news.length === 0 && !error && (
        <div className="card" style={{ padding: 'var(--space-2xl)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <Newspaper size={48} color="var(--border-strong)" />
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>No News Available</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Could not fetch the latest news at this moment. Try refreshing.</p>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 'var(--space-lg)' }}>
        {news.map((item) => (
          <a
            key={item.uuid}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="card"
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              padding: 'var(--space-lg)', 
              textDecoration: 'none', 
              color: 'var(--text-primary)',
              transition: 'all 0.2s ease',
              border: '1px solid var(--border-subtle)'
            }}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--brand)';
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
              (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)';
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)';
              (e.currentTarget as HTMLElement).style.transform = 'none';
              (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, lineHeight: 1.5, letterSpacing: '-0.01em', flex: 1 }}>{item.title}</h3>
              <ExternalLink size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
            </div>
            
            <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '4px', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  {item.publisher ? item.publisher.substring(0, 1) : 'N'}
                </div>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>{item.publisher || 'Unknown'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: 600 }}>
                <Clock size={12} />
                {item.providerPublishTime ? formatTime(item.providerPublishTime) : 'Recent'}
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
