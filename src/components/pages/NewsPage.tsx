'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Newspaper, ExternalLink, RefreshCw, AlertTriangle, Clock,
  TrendingUp, TrendingDown, Minus, Radio, Filter, Globe, Zap,
  BarChart2, Activity, Bot, X, CheckCircle2
} from 'lucide-react';

interface Props {
  market: string;
}

interface NewsArticle {
  id: string;
  title: string;
  publisher: string;
  link: string;
  publishedAt: string;
  source: 'yahoo' | 'cnbc' | string;
  category: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  description?: string;
}

interface NewsSummary {
  total: number;
  positive: number;
  negative: number;
  neutral: number;
  overallSentiment: 'bullish' | 'neutral' | 'bearish';
  sources: { yahoo: number; cnbc: number };
  analyzedAt: string;
}

interface AIAnalysis {
  impact: string;
  impactColor: string;
  keyTakeaways: string[];
  analysis: string;
  metrics: {
    confidenceScore: string;
    processingTime: string;
    model: string;
  };
}

const CATEGORY_LABELS: Record<string, string> = {
  all: 'All News',
  markets: 'Markets',
  finance: 'Finance',
  economy: 'Economy',
  investing: 'Investing',
  technology: 'Technology',
};

const SENTIMENT_CONFIG = {
  positive: { color: 'var(--success)', icon: TrendingUp, label: 'Bullish' },
  negative: { color: 'var(--critical)', icon: TrendingDown, label: 'Bearish' },
  neutral:  { color: 'var(--text-muted)', icon: Minus, label: 'Neutral' },
};

function formatTime(iso: string) {
  if (!iso) return 'Recent';
  const date = new Date(iso);
  if (isNaN(date.getTime())) return 'Recent';
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function SentimentBar({ positive, negative, neutral, total }: { positive: number; negative: number; neutral: number; total: number }) {
  if (total === 0) return null;
  const pct = (n: number) => `${Math.round((n / total) * 100)}%`;
  return (
    <div style={{ display: 'flex', gap: '4px', height: '6px', borderRadius: '3px', overflow: 'hidden', marginTop: '12px' }}>
      <div style={{ width: pct(positive), background: 'var(--success)', transition: 'width 0.8s ease' }} />
      <div style={{ width: pct(neutral), background: 'var(--border-muted)', transition: 'width 0.8s ease' }} />
      <div style={{ width: pct(negative), background: 'var(--critical)', transition: 'width 0.8s ease' }} />
    </div>
  );
}

function MarketPulseCard({ summary }: { summary: NewsSummary }) {
  const cfg = summary.overallSentiment === 'bullish'
    ? { color: 'var(--success)', label: 'BULLISH BIAS', Icon: TrendingUp }
    : summary.overallSentiment === 'bearish'
    ? { color: 'var(--critical)', label: 'BEARISH BIAS', Icon: TrendingDown }
    : { color: 'var(--warning)', label: 'NEUTRAL / MIXED', Icon: Minus };

  return (
    <div className="card" style={{ padding: 'var(--space-xl)', marginBottom: 'var(--space-xl)', background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-card) 100%)', border: '1px solid var(--border-muted)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr repeat(3,auto)', gap: '32px', alignItems: 'center' }}>
        {/* Sentiment orb */}
        <div style={{
          width: '56px', height: '56px', borderRadius: '50%',
          background: `${cfg.color}22`, border: `2px solid ${cfg.color}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <cfg.Icon size={24} color={cfg.color} />
        </div>

        <div>
          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '4px' }}>
            Macro News Sentiment
          </div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: cfg.color, letterSpacing: '-0.02em' }}>{cfg.label}</div>
          <SentimentBar positive={summary.positive} negative={summary.negative} neutral={summary.neutral} total={summary.total} />
          <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--success)' }}>▲ {summary.positive} Bullish</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>— {summary.neutral} Neutral</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--critical)' }}>▼ {summary.negative} Bearish</span>
          </div>
        </div>

        {/* Stats */}
        {[
          { label: 'Total Articles', val: summary.total, icon: Newspaper },
          { label: 'From Yahoo', val: summary.sources.yahoo, icon: BarChart2 },
          { label: 'From CNBC', val: summary.sources.cnbc, icon: Radio },
        ].map(s => (
          <div key={s.label} style={{ textAlign: 'center' }}>
            <s.icon size={14} color="var(--text-muted)" style={{ marginBottom: '4px' }} />
            <div className="mono" style={{ fontSize: '24px', fontWeight: 700 }}>{s.val}</div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NewsCard({ item, onClick }: { item: NewsArticle; onClick: () => void }) {
  const sentCfg = SENTIMENT_CONFIG[item.sentiment] || SENTIMENT_CONFIG.neutral;
  const isCNBC = item.source === 'cnbc';

  return (
    <div
      onClick={onClick}
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: 'var(--space-lg)',
        cursor: 'pointer',
        color: 'var(--text-primary)',
        transition: 'all 0.2s ease',
        border: `1px solid var(--border-subtle)`,
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseOver={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = 'var(--brand)';
        el.style.transform = 'translateY(-2px)';
        el.style.boxShadow = 'var(--shadow-md)';
      }}
      onMouseOut={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = 'var(--border-subtle)';
        el.style.transform = 'none';
        el.style.boxShadow = 'var(--shadow-sm)';
      }}
    >
      {/* Sentiment stripe */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '3px', height: '100%', background: sentCfg.color }} />

      <div style={{ paddingLeft: '8px', display: 'flex', flexDirection: 'column', height: '100%', gap: '12px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, lineHeight: 1.45, letterSpacing: '-0.01em', flex: 1 }}>
            {item.title}
          </h3>
          <Bot size={16} color="var(--brand)" style={{ flexShrink: 0, marginTop: '3px' }} />
        </div>

        {/* Description */}
        {item.description && (
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6, fontWeight: 500 }}>
            {item.description}
          </p>
        )}

        {/* Footer */}
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Source badge */}
            <span style={{
              fontSize: '9px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
              padding: '2px 7px', borderRadius: '3px',
              background: isCNBC ? '#CC0000' : '#6001D2',
              color: 'white',
            }}>
              {isCNBC ? 'CNBC' : 'Yahoo'}
            </span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {item.publisher || item.source}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Action text */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--brand)' }}>
              <Zap size={11} fill="var(--brand)" />
              <span style={{ fontSize: '10px', fontWeight: 700 }}>AI ANALYZE</span>
            </div>
            {/* Time */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: 600 }}>
              <Clock size={10} />
              {formatTime(item.publishedAt)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AIAnalysisModal({ article, onClose }: { article: NewsArticle, onClose: () => void }) {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalysis() {
      try {
        const res = await fetch('/api/analyze-news', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: article.title, description: article.description })
        });
        if (!res.ok) throw new Error('Failed to generate AI analysis');
        const data = await res.json();
        setAnalysis(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalysis();
  }, [article]);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: 'var(--space-xl)'
    }}>
      <div className="card fade-in" style={{
        width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto',
        background: 'var(--bg-primary)', padding: '0',
        display: 'flex', flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{ padding: 'var(--space-lg)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--bg-primary)', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bot size={20} color="var(--brand)" />
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>AI Market Analysis</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {/* Article Context */}
          <div style={{ padding: 'var(--space-md)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Source Article</div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, lineHeight: 1.4, marginBottom: '8px' }}>{article.title}</h3>
            {article.description && <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{article.description}</p>}
            <div style={{ marginTop: '12px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>
              Published by {article.publisher || article.source} • {formatTime(article.publishedAt)}
            </div>
          </div>

          {loading && (
            <div style={{ padding: 'var(--space-2xl)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '32px', height: '32px', border: '3px solid var(--border-subtle)', borderTopColor: 'var(--brand)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--brand)', letterSpacing: '0.05em' }}>AI IS ANALYZING MARKET IMPACT...</div>
            </div>
          )}

          {error && (
            <div style={{ padding: 'var(--space-lg)', background: '#fef2f2', border: '1px solid #fee2e2', color: 'var(--critical)', borderRadius: 'var(--radius-md)' }}>
              <AlertTriangle size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
              <span style={{ fontWeight: 600 }}>{error}</span>
            </div>
          )}

          {analysis && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
              {/* Impact Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Predicted Impact:</div>
                <div style={{
                  padding: '6px 14px', borderRadius: '20px', fontSize: '14px', fontWeight: 800,
                  background: `${analysis.impactColor}15`, color: analysis.impactColor, border: `1px solid ${analysis.impactColor}40`
                }}>
                  {analysis.impact}
                </div>
              </div>

              {/* Analysis Text */}
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', marginBottom: '8px' }}>Executive Summary</div>
                <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.6, fontWeight: 500 }}>
                  {analysis.analysis}
                </p>
              </div>

              {/* Key Takeaways */}
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', marginBottom: '12px' }}>Key Takeaways</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {analysis.keyTakeaways.map((point, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <CheckCircle2 size={16} color="var(--brand)" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500, lineHeight: 1.5 }}>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* AI Metrics */}
              <div style={{ display: 'flex', gap: '24px', padding: 'var(--space-md)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border-muted)' }}>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>AI Confidence</div>
                  <div className="mono" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--success)', marginTop: '4px' }}>{analysis.metrics.confidenceScore}</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Processing Time</div>
                  <div className="mono" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>{analysis.metrics.processingTime}</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Model</div>
                  <div className="mono" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>{analysis.metrics.model}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NewsPage({ market }: Props) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [summary, setSummary]   = useState<NewsSummary | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [category, setCategory] = useState('all');
  const [source, setSource]     = useState<'all' | 'cnbc' | 'yahoo'>('all');
  
  // State for AI Analysis Modal
  const [analyzingArticle, setAnalyzingArticle] = useState<NewsArticle | null>(null);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/news?market=${market}`);
      if (!res.ok) throw new Error('Failed to fetch news');
      const data = await res.json();
      if (Array.isArray(data)) {
        setArticles(data);
        setSummary(null);
      } else {
        setArticles(data.articles || []);
        setSummary(data.summary || null);
      }
    } catch (e: any) {
      setError(e?.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [market]);

  useEffect(() => { fetchNews(); }, [fetchNews]);

  const displayed = articles.filter(a => {
    if (source !== 'all' && a.source !== source) return false;
    if (category !== 'all' && a.category !== category) return false;
    return true;
  });

  return (
    <div className="fade-in" style={{ padding: 'var(--space-2xl)', position: 'relative' }}>
      
      {/* AI Analysis Overlay Modal */}
      {analyzingArticle && (
        <AIAnalysisModal article={analyzingArticle} onClose={() => setAnalyzingArticle(null)} />
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--space-xl)' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.04em', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Radio size={28} color="var(--brand)" />
            Live Market Intelligence
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '14px', fontWeight: 500 }}>
            Real-time financial news from <span style={{ color: '#CC0000', fontWeight: 700 }}>CNBC</span> + <span style={{ color: '#6001D2', fontWeight: 700 }}>Yahoo Finance</span> analyzed by AI
          </p>
        </div>
        <button className="btn" onClick={fetchNews} style={{ padding: '10px 16px', gap: '8px', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Market Pulse Card */}
      {summary && <MarketPulseCard summary={summary} />}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: 'var(--space-xl)', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
          <Filter size={14} />
          <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>Filter:</span>
        </div>
        {/* Source */}
        <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-tertiary)', padding: '3px', borderRadius: 'var(--radius-sm)' }}>
          {(['all', 'cnbc', 'yahoo'] as const).map(s => (
            <button key={s} onClick={() => setSource(s)} className="btn" style={{
              padding: '5px 14px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
              background: source === s ? 'var(--bg-card)' : 'transparent',
              boxShadow: source === s ? 'var(--shadow-sm)' : 'none',
              color: source === s
                ? (s === 'cnbc' ? '#CC0000' : s === 'yahoo' ? '#6001D2' : 'var(--text-primary)')
                : 'var(--text-muted)',
            }}>
              {s === 'all' ? 'All Sources' : s.toUpperCase()}
            </button>
          ))}
        </div>
        {/* Category */}
        <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-tertiary)', padding: '3px', borderRadius: 'var(--radius-sm)', flexWrap: 'wrap' }}>
          {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
            <button key={k} onClick={() => setCategory(k)} className="btn" style={{
              padding: '5px 12px', fontSize: '11px', fontWeight: 700,
              background: category === k ? 'var(--bg-card)' : 'transparent',
              boxShadow: category === k ? 'var(--shadow-sm)' : 'none',
              color: category === k ? 'var(--brand)' : 'var(--text-muted)',
            }}>
              {v}
            </button>
          ))}
        </div>
        {displayed.length > 0 && (
          <span style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
            {displayed.length} articles
          </span>
        )}
      </div>

      {/* Loading */}
      {loading && !articles.length && (
        <div style={{ display: 'flex', height: '400px', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }}>
          <div style={{ width: '32px', height: '32px', border: '3px solid var(--border-subtle)', borderTopColor: 'var(--brand)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>AGGREGATING FEEDS...</div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="card" style={{ padding: 'var(--space-lg)', background: '#fef2f2', border: '1px solid #fee2e2', color: 'var(--critical)', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <AlertTriangle size={20} />
          <span style={{ fontWeight: 600 }}>{error}</span>
        </div>
      )}

      {/* Empty */}
      {!loading && displayed.length === 0 && !error && (
        <div className="card" style={{ padding: 'var(--space-2xl)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <Globe size={48} color="var(--border-strong)" />
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>No Articles Match</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Try changing the filters or refreshing.</p>
          </div>
        </div>
      )}

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 'var(--space-lg)' }}>
        {displayed.map(item => (
          <NewsCard key={item.id} item={item} onClick={() => setAnalyzingArticle(item)} />
        ))}
      </div>

      {/* Footer attribution */}
      {!loading && displayed.length > 0 && (
        <div style={{ marginTop: 'var(--space-2xl)', textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
          Data sourced from <a href="https://www.cnbc.com/markets/" target="_blank" rel="noopener noreferrer" style={{ color: '#CC0000', textDecoration: 'none' }}>CNBC Markets</a> &amp; Yahoo Finance · Analyzed by AI models
        </div>
      )}
    </div>
  );
}
