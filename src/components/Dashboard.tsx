import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from './Layout';

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

const Dashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [selectedTimeframe, setSelectedTimeframe] = useState('1D');
  const [kycStatus, setKycStatus] = useState<'pending' | 'verified' | 'incomplete' | 'loading'>('loading');

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
          const response = await fetch('http://localhost:5000/api/profile', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            const profileData = await response.json();
            setKycStatus(profileData.user.kyc_verified ? 'verified' : 'pending');
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

  if (!user) {
    return <div>Loading...</div>;
  }
  
  // Mock data - in real app, this would come from NSE API
  const portfolioValue = 2547800;
  const portfolioChange = 12.5;
  const portfolioChangePercent = 0.49;
  
  const riskMetrics: RiskMetric[] = [
    { label: 'Portfolio Risk Score', value: 6.2, change: -0.3, status: 'medium' },
    { label: 'Volatility Index', value: 15.4, change: 2.1, status: 'medium' }
  ];
  
  const recommendations: Recommendation[] = [
    {
      id: '1',
      type: 'buy',
      stock: 'EQTY (Equity Bank)',
      reason: 'Strong Q3 earnings and expanding digital banking services',
      confidence: 87,
      potential: '+12-18%'
    },
    {
      id: '2',
      type: 'hold',
      stock: 'SCOM (Safaricom)',
      reason: 'Stable dividend yield, M-Pesa growth showing promise',
      confidence: 92,
      potential: '+5-8%'
    }
  ];
  
  const marketData: MarketData[] = [
    { symbol: 'NSE20', price: 1847.23, change: 15.67, changePercent: 0.86, volume: '2.1M' },
    { symbol: 'EQTY', price: 52.50, change: 1.25, changePercent: 2.44, volume: '892K' },
    { symbol: 'SCOM', price: 28.75, change: -0.50, changePercent: -1.71, volume: '1.5M' }
  ];

  const timeframes = ['1D', '1W', '1M', '3M', '1Y'];

  return (
    <Layout>
      <div className="dashboard-container">
        {/* Dashboard Header */}
        <div className="dashboard-header">
          <div className="dashboard-title">
            <h1>Investment Dashboard</h1>
            <p className="dashboard-subtitle">AI-powered insights for your Kenyan portfolio</p>
          </div>
          <div className="dashboard-actions">
            {kycStatus !== 'verified' && (
              <button 
                onClick={() => navigate('/kyc')}
                style={{
                  backgroundColor: kycStatus === 'incomplete' ? '#dc2626' : '#f59e0b',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  marginRight: '10px',
                  cursor: 'pointer'
                }}
              >
                {kycStatus === 'loading' ? 'Checking...' : 
                 kycStatus === 'pending' ? 'Complete KYC' : 'KYC Required'}
              </button>
            )}
          </div>
        </div>

        {/* Portfolio Overview */}
        <div className="portfolio-overview">
          <div className="portfolio-card main-portfolio">
            <div className="portfolio-header">
              <h2>Total Portfolio Value</h2>
              <div className="timeframe-selector">
                {timeframes.map(tf => (
                  <button
                    key={tf}
                    className={`timeframe-btn ${selectedTimeframe === tf ? 'active' : ''}`}
                    onClick={() => setSelectedTimeframe(tf)}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>
            <div className="portfolio-value">
              <span className="currency">KES</span>
              <span className="amount">{portfolioValue.toLocaleString()}</span>
            </div>
            <div className={`portfolio-change ${portfolioChange >= 0 ? 'positive' : 'negative'}`}>
              <span className="change-icon">{portfolioChange >= 0 ? '↗' : '↘'}</span>
              <span className="change-amount">KES {Math.abs(portfolioChange).toLocaleString()}</span>
              <span className="change-percent">({portfolioChangePercent >= 0 ? '+' : ''}{portfolioChangePercent}%)</span>
            </div>
          </div>
        </div>

        {/* Main Dashboard Grid */}
        <div className="dashboard-grid">
          {/* AI Risk Assessment */}
          <div className="dashboard-section risk-assessment">
            <div className="section-header">
              <h3>AI-Powered Risk Assessment</h3>
              <span className="ai-badge">AI</span>
            </div>
            <div className="risk-metrics">
              {riskMetrics.map((metric, index) => (
                <div key={index} className="risk-metric">
                  <div className="metric-info">
                    <span className="metric-label">{metric.label}</span>
                    <div className="metric-value">
                      <span className="value">{metric.value}</span>
                      <span className={`change ${metric.change >= 0 ? 'positive' : 'negative'}`}>
                        {metric.change >= 0 ? '+' : ''}{metric.change}
                      </span>
                    </div>
                  </div>
                  <div className={`risk-indicator ${metric.status}`}>
                    <div className="risk-bar">
                      <div 
                        className="risk-fill" 
                        style={{ width: `${(metric.value / 10) * 100}%` }}
                      ></div>
                    </div>
                    <span className="risk-status">{metric.status.toUpperCase()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Investment Recommendations */}
          <div className="dashboard-section recommendations">
            <div className="section-header">
              <h3>Intelligent Investment Recommendations</h3>
              <span className="ai-badge">AI</span>
            </div>
            <div className="recommendation-list">
              {recommendations.map((rec) => (
                <div key={rec.id} className="recommendation-card">
                  <div className="rec-header">
                    <span className={`rec-type ${rec.type}`}>{rec.type.toUpperCase()}</span>
                    <span className="confidence">Confidence: {rec.confidence}%</span>
                  </div>
                  <div className="rec-stock">{rec.stock}</div>
                  <div className="rec-reason">{rec.reason}</div>
                  <div className="rec-footer">
                    <span className="potential">{rec.potential} potential</span>
                    <button className="rec-action">View Details</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Market Analysis */}
          <div className="dashboard-section market-analysis">
            <div className="section-header">
              <h3>Smart Market Analysis</h3>
              <span className="ai-badge">AI</span>
            </div>
            
            {/* Market Overview */}
            <div className="market-overview">
              <div className="market-sentiment">
                <div className="sentiment-indicator positive">
                  <div className="sentiment-icon">📈</div>
                  <div className="sentiment-text">
                    <span className="sentiment-label">Market Sentiment</span>
                    <span className="sentiment-value">Bullish</span>
                  </div>
                </div>
                <div className="ai-insight">
                  <span className="insight-text">
                    AI predicts continued positive momentum in banking sector
                  </span>
                </div>
              </div>
            </div>

            {/* Market Data Table */}
            <div className="market-data-table">
              <div className="table-header">
                <span>Symbol</span>
                <span>Price (KES)</span>
                <span>Change</span>
                <span>Volume</span>
              </div>
              {marketData.map((stock, index) => (
                <div key={index} className="table-row">
                  <span className="symbol">{stock.symbol}</span>
                  <span className="price">{stock.price.toFixed(2)}</span>
                  <span className={`change ${stock.change >= 0 ? 'positive' : 'negative'}`}>
                    {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} 
                    ({stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%)
                  </span>
                  <span className="volume">{stock.volume}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Insights Panel */}
          <div className="dashboard-section ai-insights">
            <div className="section-header">
              <h3>AI Market Insights</h3>
              <span className="ai-badge">AI</span>
            </div>
            <div className="insights-container">
              <div className="insight-card">
                <div className="insight-icon">🎯</div>
                <div className="insight-content">
                  <h4>Market Alert</h4>
                  <p>AI detects increasing institutional interest in telecommunications stocks. Consider rebalancing.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
