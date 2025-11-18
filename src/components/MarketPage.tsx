import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from './Layout';

interface Stock {
  ticker: string;
  name: string;
  volume: number;
  price: number;
  change: number;
  changePercent: number;
}

interface NSEData {
  nasi: {
    value: number;
    change: number;
    changePercent: string;
    ytdChange: number;
    ytdChangePercent: number;
  };
  marketCap: string;
  marketCapValue: number;
  topGainers: Array<{ticker: string; name: string; price: number; changePercent: number}>;
  topLosers: Array<{ticker: string; name: string; price: number; changePercent: number}>;
  stocks: Stock[];
  lastUpdated: string;
}

const MarketPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [nseData, setNseData] = useState<NSEData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'gainers' | 'losers'>('all');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/market/nse');
        if (response.ok) {
          const result = await response.json();
          setNseData(result.data);
        }
      } catch (error) {
        console.error('Error fetching market data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMarketData();
    const interval = setInterval(fetchMarketData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (!user) {
    return <div>Loading...</div>;
  }

  const filteredStocks = nseData?.stocks?.filter(stock => {
    const matchesSearch = stock.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         stock.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (filterType === 'gainers') return stock.changePercent > 0;
    if (filterType === 'losers') return stock.changePercent < 0;
    return true;
  }) || [];

  return (
    <Layout>
      <div className="dashboard-wrapper">
        {/* Sidebar Navigation */}
        <aside className="dashboard-sidebar">
          <nav className="sidebar-nav">
            <div className="nav-section">
              <button className="nav-item" onClick={() => navigate('/dashboard')}>
                <span className="nav-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                  </svg>
                </span>
                <span className="nav-label">Overview</span>
              </button>
              <button className="nav-item" onClick={() => navigate('/portfolio')}>
                <span className="nav-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    <polyline points="7.5 4.21 12 6.81 16.5 4.21"></polyline>
                    <polyline points="7.5 19.79 7.5 14.6 3 12"></polyline>
                    <polyline points="21 12 16.5 14.6 16.5 19.79"></polyline>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                    <line x1="12" y1="22.08" x2="12" y2="12"></line>
                  </svg>
                </span>
                <span className="nav-label">Portfolio</span>
              </button>
              <button className="nav-item" onClick={() => navigate('/performance')}>
                <span className="nav-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                  </svg>
                </span>
                <span className="nav-label">Performance</span>
              </button>
              <button className="nav-item">
                <span className="nav-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M9 12l2 2 4-4"></path>
                  </svg>
                </span>
                <span className="nav-label">Recommendations</span>
              </button>
            </div>
            
            <div className="nav-section">
              <div className="nav-section-title">Markets</div>
              <button className="nav-item active">
                <span className="nav-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="1" x2="12" y2="23"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                </span>
                <span className="nav-label">Live Markets</span>
              </button>
            </div>
            
            <div className="nav-section">
              <div className="nav-section-title">Account</div>
              <button className="nav-item" onClick={() => navigate('/kyc')}>
                <span className="nav-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                </span>
                <span className="nav-label">KYC Status</span>
              </button>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="dashboard-main">
          <div className="page-header">
            <div>
              <h1>Live NSE Markets</h1>
              <p className="page-subtitle">Real-time data from Nairobi Securities Exchange</p>
            </div>
            <div className="header-actions">
              {nseData && (
                <span className="page-subtitle" style={{fontSize: '14px', color: '#666'}}>
                  Last updated: {new Date(nseData.lastUpdated).toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>

          {loading ? (
            <div style={{padding: '40px', textAlign: 'center'}}>
              <div style={{fontSize: '18px', color: '#666'}}>Loading market data...</div>
            </div>
          ) : (
            <>
              {/* Market Summary Cards */}
              <div className="stats-grid" style={{marginBottom: '24px'}}>
                <div className="stat-box-small">
                  <span className="stat-small-label">NASI Index</span>
                  <span className="stat-small-value">{nseData?.nasi?.value?.toFixed(2)}</span>
                  <span className={`stat-small-desc ${nseData?.nasi && nseData.nasi.change >= 0 ? 'positive' : 'negative'}`}>
                    {nseData?.nasi && (nseData.nasi.change >= 0 ? '+' : '')}{nseData?.nasi?.change?.toFixed(2)} ({nseData?.nasi?.changePercent}%)
                  </span>
                </div>

                <div className="stat-box-small">
                  <span className="stat-small-label">Market Cap</span>
                  <span className="stat-small-value" style={{fontSize: '18px'}}>{nseData?.marketCap}</span>
                  <span className="stat-small-desc">Total Value</span>
                </div>

                <div className="stat-box-small">
                  <span className="stat-small-label">Year-to-Date</span>
                  <span className="stat-small-value positive">+{nseData?.nasi?.ytdChangePercent}%</span>
                  <span className="stat-small-desc">+{nseData?.nasi?.ytdChange?.toFixed(2)} points</span>
                </div>

                <div className="stat-box-small">
                  <span className="stat-small-label">Listed Securities</span>
                  <span className="stat-small-value">{nseData?.stocks?.length || 0}</span>
                  <span className="stat-small-desc">Active Stocks</span>
                </div>
              </div>

              {/* Top Gainers & Losers */}
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px'}}>
                <div className="content-card">
                  <div className="card-header">
                    <h2 style={{fontSize: '16px', fontWeight: '600', color: '#16a34a'}}>📈 Top Gainers</h2>
                  </div>
                  <div className="market-table">
                    <div className="table-head">
                      <span>Ticker</span>
                      <span>Price</span>
                      <span>Change</span>
                    </div>
                    {nseData?.topGainers?.slice(0, 5).map((stock, index) => (
                      <div key={index} className="table-data-row">
                        <span className="data-symbol">
                          <strong>{stock.ticker}</strong>
                          <span style={{display: 'block', fontSize: '11px', color: '#666', marginTop: '2px'}}>
                            {stock.name.length > 25 ? stock.name.substring(0, 25) + '...' : stock.name}
                          </span>
                        </span>
                        <span className="data-price">KES {stock.price.toFixed(2)}</span>
                        <span className="data-change positive">+{stock.changePercent.toFixed(2)}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="content-card">
                  <div className="card-header">
                    <h2 style={{fontSize: '16px', fontWeight: '600', color: '#dc2626'}}>📉 Top Losers</h2>
                  </div>
                  <div className="market-table">
                    <div className="table-head">
                      <span>Ticker</span>
                      <span>Price</span>
                      <span>Change</span>
                    </div>
                    {nseData?.topLosers?.slice(0, 5).map((stock, index) => (
                      <div key={index} className="table-data-row">
                        <span className="data-symbol">
                          <strong>{stock.ticker}</strong>
                          <span style={{display: 'block', fontSize: '11px', color: '#666', marginTop: '2px'}}>
                            {stock.name.length > 25 ? stock.name.substring(0, 25) + '...' : stock.name}
                          </span>
                        </span>
                        <span className="data-price">KES {stock.price.toFixed(2)}</span>
                        <span className="data-change negative">{stock.changePercent.toFixed(2)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* All Stocks Table */}
              <div className="content-card">
                <div className="card-header">
                  <h2>All Listed Securities</h2>
                </div>
                
                {/* Search and Filter */}
                <div style={{padding: '16px', borderBottom: '1px solid #e5e7eb', display: 'flex', gap: '12px', alignItems: 'center'}}>
                  <input
                    type="text"
                    placeholder="Search by ticker or company name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="all">All Stocks</option>
                    <option value="gainers">Gainers Only</option>
                    <option value="losers">Losers Only</option>
                  </select>
                </div>

                <div className="market-table">
                  <div className="table-head" style={{gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr'}}>
                    <span>Ticker</span>
                    <span>Company Name</span>
                    <span>Volume</span>
                    <span>Price</span>
                    <span>Change</span>
                  </div>
                  <div style={{maxHeight: '500px', overflowY: 'auto'}}>
                    {filteredStocks.map((stock, index) => (
                      <div key={index} className="table-data-row" style={{gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr'}}>
                        <span className="data-symbol"><strong>{stock.ticker}</strong></span>
                        <span style={{fontSize: '13px'}}>{stock.name}</span>
                        <span style={{fontSize: '13px', color: '#666'}}>
                          {stock.volume > 0 ? stock.volume.toLocaleString() : '—'}
                        </span>
                        <span className="data-price">KES {stock.price.toFixed(2)}</span>
                        <span className={`data-change ${stock.changePercent > 0 ? 'positive' : stock.changePercent < 0 ? 'negative' : ''}`}>
                          {stock.changePercent > 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div style={{padding: '12px 16px', borderTop: '1px solid #e5e7eb', fontSize: '13px', color: '#666'}}>
                  Showing {filteredStocks.length} of {nseData?.stocks?.length || 0} securities
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </Layout>
  );
};

export default MarketPage;
