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
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface RiskMetric {
  label: string;
  value: number;
  change: number;
  status: 'low' | 'medium' | 'high';
}

interface Recommendation {
  id: string;
  type: 'buy' | 'sell' | 'hold';
  stock: string;
  reason: string;
  confidence: number;
  potential: string;
}

interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: string;
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
  topGainers: Array<{ticker: string; price: number; changePercent: number}>;
  topLosers: Array<{ticker: string; price: number; changePercent: number}>;
  stocks: Array<{ticker: string; name: string; volume: number; price: number; change: number; changePercent: number}>;
  lastUpdated: string;
}

const Dashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [kycStatus, setKycStatus] = useState<'pending' | 'verified' | 'incomplete' | 'loading'>('loading');
  const [activeSection, setActiveSection] = useState('overview');
  const [nseData, setNseData] = useState<NSEData | null>(null);
  const [marketLoading, setMarketLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [riskMetrics, setRiskMetrics] = useState<RiskMetric[]>([]);
  const [loading, setLoading] = useState(true);
  
  const timeframes = ['1D', '1W', '1M', '1Y'];
  const [selectedTimeframe, setSelectedTimeframe] = useState('1D');
  const [nasiHistoricalData, setNasiHistoricalData] = useState<{
    labels: string[];
    data: number[];
  }>({
    labels: ['Loading...'],
    data: [0]
  });
  const [historicalLoading, setHistoricalLoading] = useState(true);

  const currentData = nasiHistoricalData;

  const chartData = {
    labels: currentData.labels,
    datasets: [
      {
        label: 'NASI Index',
        data: currentData.data,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: function(value: any) {
            return value.toFixed(1);
          }
        }
      }
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    // Check KYC status when component mounts
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
            setKycStatus(profileData.user.kycVerified ? 'verified' : 'pending');
          } else {
            setKycStatus('incomplete');
          }
        } catch (error) {
          console.error('Error checking KYC status:', error);
          setKycStatus('incomplete');
        }
      }
    };

    checkKycStatus();
  }, [user]);

  useEffect(() => {
    // Fetch NSE market data
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
        setMarketLoading(false);
      }
    };

    fetchMarketData();
    // Refresh market data every 5 minutes
    const interval = setInterval(fetchMarketData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Fetch historical NASI data when timeframe changes
    const fetchHistoricalData = async () => {
      try {
        setHistoricalLoading(true);
        const response = await fetch(`http://localhost:5000/api/market/nasi-history?timeframe=${selectedTimeframe}`);
        if (response.ok) {
          const result = await response.json();
          setNasiHistoricalData({
            labels: result.labels,
            data: result.data
          });
        }
      } catch (error) {
        console.error('Error fetching historical NASI data:', error);
        // Fallback to dummy data on error
        setNasiHistoricalData({
          labels: ['No data'],
          data: [0]
        });
      } finally {
        setHistoricalLoading(false);
      }
    };

    fetchHistoricalData();
  }, [selectedTimeframe]);

  useEffect(() => {
    // Fetch real recommendations and calculate risk metrics
    const fetchDashboardData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const token = localStorage.getItem('aiser_token');
        
        // Fetch recommendations
        const recResponse = await fetch('http://localhost:5000/api/recommendations?count=2', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (recResponse.ok) {
          const recData = await recResponse.json();
          const formattedRecs = recData.recommendations.map((rec: any, index: number) => ({
            id: String(index + 1),
            type: rec.action.toLowerCase() as 'buy' | 'hold' | 'sell',
            stock: `${rec.ticker} (${rec.company})`,
            reason: rec.reason,
            confidence: rec.confidence,
            potential: rec.predicted_return
          }));
          setRecommendations(formattedRecs);
        }
        
        // Fetch user profile to get risk score
        const profileResponse = await fetch('http://localhost:5000/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          const userRiskScore = profileData.user.riskScore || 50;
          
          // Calculate risk metrics from user data and market data
          const portfolioRisk = (userRiskScore / 10).toFixed(1);
          const volatilityIndex = 15.4; // Use default or calculate from market data
          
          setRiskMetrics([
            { 
              label: 'Portfolio Risk Score', 
              value: parseFloat(portfolioRisk), 
              change: -0.3, 
              status: userRiskScore <= 40 ? 'low' : userRiskScore <= 70 ? 'medium' : 'high'
            },
            { 
              label: 'Volatility Index', 
              value: volatilityIndex, 
              change: 2.1, 
              status: volatilityIndex <= 12 ? 'low' : volatilityIndex <= 18 ? 'medium' : 'high'
            },
          ]);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, nseData]);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <Layout>
      <div className="dashboard-wrapper">
        {/* Sidebar Navigation */}
        <aside className="dashboard-sidebar">
          <nav className="sidebar-nav">
            <div className="nav-section">
              <button className="nav-item active">
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

        {/* Main Dashboard Content */}
        <main className="dashboard-main">
          {/* KYC Alert Banner */}
          {kycStatus !== 'verified' && (
            <div className="kyc-alert-banner">
              <div className="alert-content">
                <div className="alert-text">
                  <strong>Action Required:</strong> Complete your KYC verification to unlock full platform features
                </div>
                <button 
                  onClick={() => navigate('/kyc')}
                  className="alert-btn"
                >
                  {kycStatus === 'loading' ? 'Checking...' : 
                   kycStatus === 'pending' ? 'Complete KYC' : 'Verify Now'}
                </button>
              </div>
            </div>
          )}
          
          {/* Page Header */}
          <div className="page-header">
            <div>
              <h1>Investment Overview</h1>
              <p className="page-subtitle">Track your portfolio performance and market insights</p>
            </div>
            <div className="header-actions">
              <select className="time-selector">
                <option>Today</option>
                <option>This Week</option>
                <option>This Month</option>
                <option>This Year</option>
              </select>
            </div>
          </div>
          
          {/* Stats Overview Cards */}
          <div className="stats-grid">
            <div className="stat-box">
              <div className="stat-box-header">
                <span className="stat-box-label">NASI Index</span>
                <div className="timeframe-tabs">
                  {timeframes.map(tf => (
                    <button
                      key={tf}
                      className={`tab-btn ${selectedTimeframe === tf ? 'active' : ''}`}
                      onClick={() => setSelectedTimeframe(tf)}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>
              <div className="stat-box-value">
                <span className="value-large">
                  {marketLoading ? 'Loading...' : nseData?.nasi?.value?.toFixed(2) || 'N/A'}
                </span>
                {nseData?.nasi && (
                  <span className={`value-change-inline ${nseData.nasi.change >= 0 ? 'positive' : 'negative'}`}>
                    {nseData.nasi.change >= 0 ? '+' : ''}{nseData.nasi.changePercent}% 
                    ({nseData.nasi.change >= 0 ? '+' : ''}{nseData.nasi.change?.toFixed(2)})
                  </span>
                )}
              </div>
            </div>

            <div className="stat-box-small">
              <span className="stat-small-label">NSE Market Cap</span>
              <span className="stat-small-value">
                {marketLoading ? '...' : nseData?.marketCap || 'N/A'}
              </span>
              <span className="stat-small-desc">Total Value</span>
            </div>

            <div className="stat-box-small">
              <span className="stat-small-label">Year-to-Date</span>
              <span className={`stat-small-value ${nseData?.nasi?.ytdChangePercent && nseData.nasi.ytdChangePercent > 0 ? 'positive' : ''}`}>
                {marketLoading ? '...' : nseData?.nasi?.ytdChangePercent ? `+${nseData.nasi.ytdChangePercent}%` : 'N/A'}
              </span>
              <span className="stat-small-desc">NASI Growth</span>
            </div>

            <div className="stat-box-small">
              <span className="stat-small-label">Listed Securities</span>
              <span className="stat-small-value">
                {marketLoading ? '...' : nseData?.stocks?.length || '67'}
              </span>
              <span className="stat-small-desc">NSE Stocks</span>
            </div>
          </div>

          {/* NASI Historical Chart */}
          <div className="content-card" style={{marginBottom: '24px'}}>
            <div className="card-header">
              <h2>NASI Index Historical Trend</h2>
            </div>
            <div style={{padding: '20px', height: '300px'}}>
              {historicalLoading ? (
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%'}}>
                  <span>Loading historical data...</span>
                </div>
              ) : (
                <Line data={chartData} options={chartOptions} />
              )}
            </div>
          </div>

          {/* Main Dashboard Content */}
          <div className="dashboard-content-grid">
            {/* Recommendations Section */}
            <div className="content-card">
              <div className="card-header">
                <div className="card-title">
                  <h2>Investment Recommendations</h2>
                  <span className="ai-label">AI-Powered</span>
                </div>
              </div>
              <div className="recommendations-grid">
                {recommendations.map((rec) => (
                  <div key={rec.id} className="recommendation-row">
                    <div className="rec-main">
                      <div className="rec-top">
                        <span className={`action-badge ${rec.type}`}>{rec.type.toUpperCase()}</span>
                        <span className="rec-stock-title">{rec.stock}</span>
                      </div>
                      <p className="rec-reason-text">{rec.reason}</p>
                    </div>
                    <div className="rec-side">
                      <div className="rec-metrics">
                        <span className="confidence-text">{rec.confidence}%</span>
                        <span className="potential-text">{rec.potential}</span>
                      </div>
                      <button className="view-btn">View</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Market Data Section */}
            <div className="content-card">
              <div className="card-header">
                <div className="card-title">
                  <h2>Live Market Overview</h2>
                  <span className="status-badge bullish">NSE Live</span>
                </div>
              </div>
              
              {marketLoading ? (
                <div style={{padding: '20px', textAlign: 'center'}}>Loading market data...</div>
              ) : (
                <>
                  {/* Top Gainers */}
                  <div style={{marginBottom: '20px'}}>
                    <h3 style={{fontSize: '14px', fontWeight: '600', marginBottom: '10px', color: '#16a34a'}}>
                      📈 Top Gainers
                    </h3>
                    <div className="market-table">
                      <div className="table-head">
                        <span>Ticker</span>
                        <span>Price</span>
                        <span>Change</span>
                      </div>
                      {nseData?.topGainers?.slice(0, 3).map((stock, index) => (
                        <div key={index} className="table-data-row">
                          <span className="data-symbol">{stock.ticker}</span>
                          <span className="data-price">KES {stock.price.toFixed(2)}</span>
                          <span className="data-change positive">
                            +{stock.changePercent.toFixed(2)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top Losers */}
                  <div>
                    <h3 style={{fontSize: '14px', fontWeight: '600', marginBottom: '10px', color: '#dc2626'}}>
                      📉 Top Losers
                    </h3>
                    <div className="market-table">
                      <div className="table-head">
                        <span>Ticker</span>
                        <span>Price</span>
                        <span>Change</span>
                      </div>
                      {nseData?.topLosers?.slice(0, 3).map((stock, index) => (
                        <div key={index} className="table-data-row">
                          <span className="data-symbol">{stock.ticker}</span>
                          <span className="data-price">KES {stock.price.toFixed(2)}</span>
                          <span className="data-change negative">
                            {stock.changePercent.toFixed(2)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Risk Analysis Section */}
            <div className="content-card">
              <div className="card-header">
                <div className="card-title">
                  <h2>Risk Analysis</h2>
                  <span className="ai-label">AI</span>
                </div>
              </div>
              <div className="risk-items">
                {riskMetrics.map((metric, index) => (
                  <div key={index} className="risk-row">
                    <div className="risk-info">
                      <span className="risk-name">{metric.label}</span>
                      <div className="risk-value-row">
                        <span className="risk-number">{metric.value}</span>
                        <span className={`risk-trend ${metric.change >= 0 ? 'positive' : 'negative'}`}>
                          {metric.change >= 0 ? '+' : ''}{metric.change}
                        </span>
                      </div>
                    </div>
                    <div className="risk-visual">
                      <span className={`status-pill ${metric.status}`}>{metric.status}</span>
                      <div className="progress-mini">
                        <div 
                          className={`progress-fill-mini ${metric.status}`}
                          style={{ width: `${(metric.value / 10) * 100}%` }}
                        ></div>
                      </div>
                    </div>
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

export default Dashboard;
