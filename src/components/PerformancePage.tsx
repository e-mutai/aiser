import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from './Layout';

interface PerformanceMetric {
  period: string;
  return: number;
  benchmark: number;
  difference: number;
}

interface Transaction {
  date: string;
  type: 'buy' | 'sell' | 'dividend';
  ticker: string;
  shares: number;
  price: number;
  amount: number;
}

const PerformancePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [kycStatus, setKycStatus] = useState<'pending' | 'verified' | 'incomplete'>('pending');
  const [selectedPeriod, setSelectedPeriod] = useState('1Y');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const checkKycStatus = async () => {
      if (user) {
        try {
          const token = localStorage.getItem('aiser_token');
          const response = await fetch('http://localhost:5000/api/user/profile', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            const profileData = await response.json();
            setKycStatus(profileData.user.kyc_verified ? 'verified' : 'pending');
          }
        } catch (error) {
          console.error('Error checking KYC status:', error);
        }
      }
    };

    checkKycStatus();
  }, [user]);

  if (!user) {
    return <div>Loading...</div>;
  }

  // Mock performance data
  const performanceMetrics: PerformanceMetric[] = [
    { period: '1 Week', return: 1.2, benchmark: 0.8, difference: 0.4 },
    { period: '1 Month', return: 3.5, benchmark: 2.1, difference: 1.4 },
    { period: '3 Months', return: 8.7, benchmark: 6.5, difference: 2.2 },
    { period: '6 Months', return: 12.4, benchmark: 10.2, difference: 2.2 },
    { period: '1 Year', return: 24.8, benchmark: 18.5, difference: 6.3 },
    { period: 'YTD', return: 18.2, benchmark: 15.1, difference: 3.1 }
  ];

  // Mock monthly returns data
  const monthlyReturns = [
    { month: 'Jan', portfolio: 2.5, benchmark: 1.8 },
    { month: 'Feb', portfolio: 1.8, benchmark: 2.2 },
    { month: 'Mar', portfolio: 3.2, benchmark: 2.5 },
    { month: 'Apr', portfolio: -0.5, benchmark: 0.3 },
    { month: 'May', portfolio: 2.8, benchmark: 1.9 },
    { month: 'Jun', portfolio: 1.5, benchmark: 1.2 },
    { month: 'Jul', portfolio: 2.1, benchmark: 1.7 },
    { month: 'Aug', portfolio: 1.9, benchmark: 1.5 },
    { month: 'Sep', portfolio: 2.3, benchmark: 2.0 },
    { month: 'Oct', portfolio: 1.7, benchmark: 1.4 },
    { month: 'Nov', portfolio: 1.8, benchmark: 1.6 }
  ];

  // Mock recent transactions
  const recentTransactions: Transaction[] = [
    { date: '2025-11-15', type: 'buy', ticker: 'SCOM', shares: 100, price: 29.00, amount: 2900 },
    { date: '2025-11-10', type: 'dividend', ticker: 'EQTY', shares: 300, price: 0.50, amount: 150 },
    { date: '2025-11-05', type: 'buy', ticker: 'KCB', shares: 50, price: 65.00, amount: 3250 },
    { date: '2025-10-28', type: 'sell', ticker: 'BRIT', shares: 200, price: 9.00, amount: 1800 },
    { date: '2025-10-20', type: 'buy', ticker: 'EABL', shares: 25, price: 235.00, amount: 5875 },
    { date: '2025-10-15', type: 'dividend', ticker: 'SCOM', shares: 400, price: 1.25, amount: 500 }
  ];

  // Top performing stocks
  const topPerformers = [
    { ticker: 'SCOM', name: 'Safaricom Plc', return: 9.43, period: '3M' },
    { ticker: 'EQTY', name: 'Equity Group', return: 7.92, period: '3M' },
    { ticker: 'KCB', name: 'KCB Group', return: 3.17, period: '3M' }
  ];

  const bottomPerformers = [
    { ticker: 'BRIT', name: 'Britam Holdings', return: -5.43, period: '3M' },
    { ticker: 'EABL', name: 'East African Breweries', return: -2.08, period: '3M' }
  ];

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
              <button className="nav-item active">
                <span className="nav-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                  </svg>
                </span>
                <span className="nav-label">Performance</span>
              </button>
              <button className="nav-item" onClick={() => navigate('/recommendations')}>
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
              <button className="nav-item" onClick={() => navigate('/market')}>
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
                {kycStatus !== 'verified' && (
                  <span className="nav-badge">!</span>
                )}
              </button>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="dashboard-main">
          <div className="page-header">
            <div>
              <h1>Performance Analysis</h1>
              <p className="page-subtitle">Track your investment returns and compare with NSE benchmarks</p>
            </div>
          </div>

          {/* Performance Summary Cards */}
          <div className="stats-grid" style={{marginBottom: '24px'}}>
            <div className="stat-box-small">
              <span className="stat-small-label">Total Return</span>
              <span className="stat-small-value positive">+24.8%</span>
              <span className="stat-small-desc">Last 12 months</span>
            </div>

            <div className="stat-box-small">
              <span className="stat-small-label">vs NASI Benchmark</span>
              <span className="stat-small-value positive">+6.3%</span>
              <span className="stat-small-desc">Outperformance</span>
            </div>

            <div className="stat-box-small">
              <span className="stat-small-label">Best Month</span>
              <span className="stat-small-value positive">+3.2%</span>
              <span className="stat-small-desc">March 2025</span>
            </div>

            <div className="stat-box-small">
              <span className="stat-small-label">Sharpe Ratio</span>
              <span className="stat-small-value">1.85</span>
              <span className="stat-small-desc">Risk-adjusted</span>
            </div>
          </div>

          {/* Performance Comparison Table */}
          <div className="content-card" style={{marginBottom: '24px'}}>
            <div className="card-header">
              <h2>Returns vs Benchmark</h2>
            </div>
            
            <div className="market-table">
              <div className="table-head" style={{gridTemplateColumns: '1fr 1fr 1fr 1fr'}}>
                <span>Period</span>
                <span>Your Return</span>
                <span>NASI Benchmark</span>
                <span>Difference</span>
              </div>
              <div>
                {performanceMetrics.map((metric, index) => (
                  <div key={index} className="table-data-row" style={{gridTemplateColumns: '1fr 1fr 1fr 1fr'}}>
                    <span style={{fontWeight: '600'}}>{metric.period}</span>
                    <span className={`data-change ${metric.return >= 0 ? 'positive' : 'negative'}`}>
                      {metric.return >= 0 ? '+' : ''}{metric.return.toFixed(1)}%
                    </span>
                    <span style={{fontSize: '13px', color: '#666'}}>
                      {metric.benchmark >= 0 ? '+' : ''}{metric.benchmark.toFixed(1)}%
                    </span>
                    <span className={`data-change ${metric.difference >= 0 ? 'positive' : 'negative'}`}>
                      {metric.difference >= 0 ? '+' : ''}{metric.difference.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Monthly Returns Chart */}
          <div className="content-card" style={{marginBottom: '24px'}}>
            <div className="card-header">
              <h2>Monthly Returns (2025)</h2>
            </div>
            <div style={{padding: '20px'}}>
              <div style={{display: 'flex', gap: '8px', marginBottom: '20px'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                  <div style={{width: '12px', height: '12px', backgroundColor: '#3b82f6', borderRadius: '2px'}}></div>
                  <span style={{fontSize: '13px', color: '#666'}}>Your Portfolio</span>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                  <div style={{width: '12px', height: '12px', backgroundColor: '#94a3b8', borderRadius: '2px'}}></div>
                  <span style={{fontSize: '13px', color: '#666'}}>NASI Benchmark</span>
                </div>
              </div>
              <div style={{display: 'flex', gap: '12px', height: '200px', alignItems: 'flex-end'}}>
                {monthlyReturns.map((data, index) => (
                  <div key={index} style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px'}}>
                    <div style={{display: 'flex', gap: '2px', width: '100%', height: '160px', alignItems: 'flex-end'}}>
                      <div style={{
                        flex: 1,
                        height: `${Math.abs(data.portfolio) * 40}px`,
                        backgroundColor: data.portfolio >= 0 ? '#3b82f6' : '#ef4444',
                        borderRadius: '2px 2px 0 0',
                        minHeight: '2px'
                      }}></div>
                      <div style={{
                        flex: 1,
                        height: `${Math.abs(data.benchmark) * 40}px`,
                        backgroundColor: '#94a3b8',
                        borderRadius: '2px 2px 0 0',
                        minHeight: '2px'
                      }}></div>
                    </div>
                    <span style={{fontSize: '11px', color: '#666', fontWeight: '500'}}>{data.month}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px'}}>
            {/* Top Performers */}
            <div className="content-card">
              <div className="card-header">
                <h2 style={{fontSize: '16px', fontWeight: '600', color: '#16a34a'}}>🏆 Top Performers</h2>
              </div>
              <div style={{padding: '16px'}}>
                {topPerformers.map((stock, index) => (
                  <div key={index} style={{
                    padding: '12px',
                    borderBottom: index < topPerformers.length - 1 ? '1px solid #f3f4f6' : 'none'
                  }}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                      <div>
                        <div style={{fontWeight: '600', fontSize: '14px'}}>{stock.ticker}</div>
                        <div style={{fontSize: '12px', color: '#666', marginTop: '2px'}}>{stock.name}</div>
                      </div>
                      <div style={{textAlign: 'right'}}>
                        <div className="data-change positive" style={{fontSize: '14px'}}>
                          +{stock.return.toFixed(2)}%
                        </div>
                        <div style={{fontSize: '11px', color: '#666', marginTop: '2px'}}>{stock.period}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Performers */}
            <div className="content-card">
              <div className="card-header">
                <h2 style={{fontSize: '16px', fontWeight: '600', color: '#dc2626'}}>📉 Bottom Performers</h2>
              </div>
              <div style={{padding: '16px'}}>
                {bottomPerformers.map((stock, index) => (
                  <div key={index} style={{
                    padding: '12px',
                    borderBottom: index < bottomPerformers.length - 1 ? '1px solid #f3f4f6' : 'none'
                  }}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                      <div>
                        <div style={{fontWeight: '600', fontSize: '14px'}}>{stock.ticker}</div>
                        <div style={{fontSize: '12px', color: '#666', marginTop: '2px'}}>{stock.name}</div>
                      </div>
                      <div style={{textAlign: 'right'}}>
                        <div className="data-change negative" style={{fontSize: '14px'}}>
                          {stock.return.toFixed(2)}%
                        </div>
                        <div style={{fontSize: '11px', color: '#666', marginTop: '2px'}}>{stock.period}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="content-card">
            <div className="card-header">
              <h2>Recent Transactions</h2>
            </div>
            
            <div className="market-table">
              <div className="table-head" style={{gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr'}}>
                <span>Date</span>
                <span>Type</span>
                <span>Ticker</span>
                <span>Shares</span>
                <span>Price</span>
                <span>Amount</span>
              </div>
              <div>
                {recentTransactions.map((txn, index) => (
                  <div key={index} className="table-data-row" style={{gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr'}}>
                    <span style={{fontSize: '13px'}}>{txn.date}</span>
                    <span>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600',
                        backgroundColor: txn.type === 'buy' ? '#dbeafe' : txn.type === 'sell' ? '#fee2e2' : '#fef3c7',
                        color: txn.type === 'buy' ? '#1e40af' : txn.type === 'sell' ? '#991b1b' : '#92400e'
                      }}>
                        {txn.type.toUpperCase()}
                      </span>
                    </span>
                    <span className="data-symbol"><strong>{txn.ticker}</strong></span>
                    <span style={{fontSize: '13px', textAlign: 'center'}}>{txn.shares}</span>
                    <span style={{fontSize: '13px'}}>KES {txn.price.toFixed(2)}</span>
                    <span style={{fontSize: '13px', fontWeight: '600'}}>
                      {txn.type === 'sell' || txn.type === 'dividend' ? '+' : '-'}KES {txn.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </Layout>
  );
};

export default PerformancePage;
