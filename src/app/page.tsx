'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import HomePage from '@/components/pages/HomePage';
import AnalyzePage from '@/components/pages/AnalyzePage';
import WatchlistPage from '@/components/pages/WatchlistPage';
import MarketsPage from '@/components/pages/MarketsPage';
import NewsPage from '@/components/pages/NewsPage';

export type PageId = 'home' | 'analyze' | 'watchlist' | 'markets' | 'news';

export default function App() {
  const [page, setPage] = useState<PageId>('home');
  const [analyzeTicker, setAnalyzeTicker] = useState<string>('');
  const [market, setMarket] = useState<string>('IN');

  function navigateToAnalyze(ticker: string) {
    setAnalyzeTicker(ticker);
    setPage('analyze');
  }

  return (
    <div className="app-root">
      <Sidebar activePage={page} onNavigate={(p) => setPage(p as PageId)} />
      <div className="main-content">
        <Topbar
          activePage={page}
          onNavigate={navigateToAnalyze}
          market={market}
          onMarketChange={setMarket}
        />
        {page === 'home' && <HomePage onAnalyze={navigateToAnalyze} market={market} />}
        {page === 'analyze' && <AnalyzePage initialTicker={analyzeTicker} market={market} />}
        {page === 'watchlist' && <WatchlistPage onAnalyze={navigateToAnalyze} market={market} />}
        {page === 'markets' && <MarketsPage onAnalyze={navigateToAnalyze} market={market} />}
        {page === 'news' && <NewsPage market={market} />}
      </div>
    </div>
  );
}
