import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from './Layout';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface Holding {
  ticker: string;
  companyName: string;
  shares: number;
  avgPrice: number;
  currentPrice: number;
  marketValue: number;
  totalCost: number;
  gainLoss: number;
  gainLossPercent: number;
}

const PortfolioPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [kycStatus, setKycStatus] = useState<'pending' | 'verified' | 'incomplete'>('pending');

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

  // Mock portfolio data - in production, this would come from your backend
  const holdings: Holding[] = [
    {
      ticker: 'SCOM',
      companyName: 'Safaricom Plc',
      shares: 500,
      avgPrice: 26.50,
      currentPrice: 29.00,
      marketValue: 14500,
      totalCost: 13250,
      gainLoss: 1250,
      gainLossPercent: 9.43
    },
    {
      ticker: 'EQTY',
      companyName: 'Equity Group Holdings',
      shares: 300,
      avgPrice: 60.00,
      currentPrice: 64.75,
      marketValue: 19425,
      totalCost: 18000,
      gainLoss: 1425,
      gainLossPercent: 7.92
    },
    {
      ticker: 'KCB',
      companyName: 'KCB Group',
      shares: 200,
      avgPrice: 63.00,
      currentPrice: 65.00,
      marketValue: 13000,
      totalCost: 12600,
      gainLoss: 400,
      gainLossPercent: 3.17
    },
    {
      ticker: 'EABL',
      companyName: 'East African Breweries',
      shares: 100,
      avgPrice: 240.00,
      currentPrice: 235.00,
      marketValue: 23500,
      totalCost: 24000,
      gainLoss: -500,
      gainLossPercent: -2.08
    },
    {
      ticker: 'BRIT',
      companyName: 'Britam Holdings',
      shares: 1000,
      avgPrice: 9.20,
      currentPrice: 8.70,
      marketValue: 8700,
      totalCost: 9200,
      gainLoss: -500,
      gainLossPercent: -5.43
    }
  ];

  const totalMarketValue = holdings.reduce((sum, h) => sum + h.marketValue, 0);
  const totalCost = holdings.reduce((sum, h) => sum + h.totalCost, 0);
  const totalGainLoss = totalMarketValue - totalCost;
  const totalGainLossPercent = ((totalGainLoss / totalCost) * 100).toFixed(2);

  // Asset allocation by sector (mock data)
  const assetAllocation = [
    { sector: 'Telecommunications', value: 14500, percent: 18.4, color: '#3b82f6' },
    { sector: 'Banking & Finance', value: 32425, percent: 57.7, color: '#10b981' },
    { sector: 'Manufacturing', value: 23500, percent: 29.9, color: '#f59e0b' },
    { sector: 'Insurance', value: 8700, percent: 11.1, color: '#8b5cf6' }
  ];

  // Mock historical portfolio performance data (last 30 days)
  const performanceData = {
    labels: ['Day 1', 'Day 5', 'Day 10', 'Day 15', 'Day 20', 'Day 25', 'Day 30'],
    datasets: [
      {
        label: 'Portfolio Value',
        data: [75000, 76200, 77500, 76800, 78200, 78900, totalMarketValue],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const performanceOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: function(context: any) {
            return `KES ${context.parsed.y.toLocaleString()}`;
          }
        }
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: function(value: any) {
            return 'KES ' + value.toLocaleString();
          }
        }
      }
    }
  };

  // Asset allocation pie chart data
  const allocationData = {
    labels: assetAllocation.map(a => a.sector),
    datasets: [
      {
        data: assetAllocation.map(a => a.value),
        backgroundColor: assetAllocation.map(a => a.color),
        borderWidth: 2,
        borderColor: '#fff',
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${context.label}: KES ${value.toLocaleString()} (${percentage}%)`;
          }
        }
      }
    }
  };

  const totalAllocation = assetAllocation.reduce((sum, a) => sum + a.value, 0);

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
              <button className="nav-item active">
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
              <h1>My Portfolio</h1>
              <p className="page-subtitle">Track your NSE investment holdings and performance</p>
            </div>
          </div>

          {/* Portfolio Summary Cards */}
          <div className="stats-grid" style={{marginBottom: '24px'}}>
            <div className="stat-box-small">
              <span className="stat-small-label">Total Value</span>
              <span className="stat-small-value">KES {totalMarketValue.toLocaleString()}</span>
              <span className="stat-small-desc">Market Value</span>
            </div>

            <div className="stat-box-small">
              <span className="stat-small-label">Total Cost</span>
              <span className="stat-small-value">KES {totalCost.toLocaleString()}</span>
              <span className="stat-small-desc">Investment Basis</span>
            </div>

            <div className="stat-box-small">
              <span className="stat-small-label">Total Gain/Loss</span>
              <span className={`stat-small-value ${totalGainLoss >= 0 ? 'positive' : 'negative'}`}>
                KES {totalGainLoss.toLocaleString()}
              </span>
              <span className={`stat-small-desc ${totalGainLoss >= 0 ? 'positive' : 'negative'}`}>
                {totalGainLoss >= 0 ? '+' : ''}{totalGainLossPercent}%
              </span>
            </div>

            <div className="stat-box-small">
              <span className="stat-small-label">Holdings</span>
              <span className="stat-small-value">{holdings.length}</span>
              <span className="stat-small-desc">NSE Stocks</span>
            </div>
          </div>

          {/* Performance Trend Chart */}
          <div className="content-card" style={{marginBottom: '24px'}}>
            <div className="card-header">
              <h2>Portfolio Performance (30 Days)</h2>
            </div>
            <div style={{padding: '20px', height: '300px'}}>
              <Line data={performanceData} options={performanceOptions} />
            </div>
          </div>

          {/* Charts Grid */}
          <div style={{display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px'}}>
            {/* Asset Allocation Progress Bars */}
            <div className="content-card">
              <div className="card-header">
                <h2>Asset Allocation</h2>
              </div>
              <div style={{padding: '20px'}}>
                <div style={{marginBottom: '20px'}}>
                  {assetAllocation.map((asset, index) => (
                    <div key={index} style={{marginBottom: '16px'}}>
                      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px'}}>
                        <span style={{fontWeight: '500'}}>{asset.sector}</span>
                        <span style={{color: '#666'}}>KES {asset.value.toLocaleString()} ({((asset.value / totalAllocation) * 100).toFixed(1)}%)</span>
                      </div>
                      <div style={{height: '8px', backgroundColor: '#f3f4f6', borderRadius: '4px', overflow: 'hidden'}}>
                        <div style={{
                          height: '100%',
                          width: `${(asset.value / totalAllocation) * 100}%`,
                          backgroundColor: asset.color,
                          transition: 'width 0.3s ease'
                        }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pie Chart */}
            <div className="content-card">
              <div className="card-header">
                <h2>Allocation Breakdown</h2>
              </div>
              <div style={{padding: '20px', height: '300px'}}>
                <Pie data={allocationData} options={pieOptions} />
              </div>
            </div>
          </div>

          {/* Asset Allocation */}
          <div className="content-card" style={{marginBottom: '24px', display: 'none'}}>
            <div className="card-header">
              <h2>Asset Allocation</h2>
            </div>
            <div style={{padding: '20px'}}>
              <div style={{marginBottom: '20px'}}>
                {assetAllocation.map((asset, index) => (
                  <div key={index} style={{marginBottom: '16px'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px'}}>
                      <span style={{fontWeight: '500'}}>{asset.sector}</span>
                      <span style={{color: '#666'}}>KES {asset.value.toLocaleString()} ({((asset.value / totalAllocation) * 100).toFixed(1)}%)</span>
                    </div>
                    <div style={{height: '8px', backgroundColor: '#f3f4f6', borderRadius: '4px', overflow: 'hidden'}}>
                      <div style={{
                        height: '100%',
                        width: `${(asset.value / totalAllocation) * 100}%`,
                        backgroundColor: asset.color,
                        transition: 'width 0.3s ease'
                      }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Holdings Table */}
          <div className="content-card">
            <div className="card-header">
              <h2>Current Holdings</h2>
            </div>
            
            <div className="market-table">
              <div className="table-head" style={{gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr 1fr 1fr'}}>
                <span>Ticker</span>
                <span>Company</span>
                <span>Shares</span>
                <span>Avg Price</span>
                <span>Current Price</span>
                <span>Market Value</span>
                <span>Gain/Loss</span>
              </div>
              <div>
                {holdings.map((holding, index) => (
                  <div key={index} className="table-data-row" style={{gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr 1fr 1fr'}}>
                    <span className="data-symbol"><strong>{holding.ticker}</strong></span>
                    <span style={{fontSize: '13px'}}>{holding.companyName}</span>
                    <span style={{fontSize: '13px', textAlign: 'center'}}>{holding.shares.toLocaleString()}</span>
                    <span className="data-price">KES {holding.avgPrice.toFixed(2)}</span>
                    <span className="data-price">KES {holding.currentPrice.toFixed(2)}</span>
                    <span style={{fontSize: '13px', fontWeight: '600'}}>KES {holding.marketValue.toLocaleString()}</span>
                    <span className={`data-change ${holding.gainLoss >= 0 ? 'positive' : 'negative'}`}>
                      {holding.gainLoss >= 0 ? '+' : ''}KES {Math.abs(holding.gainLoss).toLocaleString()}
                      <span style={{display: 'block', fontSize: '11px', marginTop: '2px'}}>
                        ({holding.gainLoss >= 0 ? '+' : ''}{holding.gainLossPercent.toFixed(2)}%)
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{padding: '16px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '600'}}>
              <span>Total Portfolio</span>
              <span>KES {totalMarketValue.toLocaleString()}</span>
            </div>
          </div>
        </main>
      </div>
    </Layout>
  );
};

export default PortfolioPage;
