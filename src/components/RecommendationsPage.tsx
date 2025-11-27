import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';
import { useAuth } from '../contexts/AuthContext';

interface Recommendation {
  ticker: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  confidence_explanation?: string;
  reason: string;
  potential_return: string;
  risk_level: 'Low' | 'Medium' | 'High';
  time_horizon: string;
  price?: number;
}

const RecommendationsPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [executing, setExecuting] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) navigate('/login');
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const fetchRecs = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('aiser_token');
        const resp = await fetch('http://localhost:5000/api/recommendations?count=5', {
          headers: {
            Authorization: token ? `Bearer ${token}` : ''
          }
        });
        if (!resp.ok) {
          const txt = await resp.text();
          throw new Error(txt || 'Failed to fetch recommendations');
        }
        const data = await resp.json();
        if (!data.success) throw new Error(data.message || 'No recommendations');
        setRecs(data.recommendations || []);
      } catch (err: any) {
        setError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchRecs();
  }, []);

  const handleActionClick = (r: Recommendation, action: 'BUY' | 'SELL' | 'HOLD') => {
    const key = `${r.ticker}-${action}`;
    setExecuting(key);
    setTimeout(() => {
      setExecuting(null);
      alert(`${action} action requested for ${r.ticker} (confidence: ${r.confidence}%)`);
    }, 1000);
  };

  return (
    <Layout>
      <div className="dashboard-wrapper">
        <aside className="dashboard-sidebar">
          <nav className="sidebar-nav">
            <div className="nav-section">
              <button className="nav-item" onClick={() => navigate('/dashboard')}>
                <span className="nav-label">Overview</span>
              </button>
              <button className="nav-item" onClick={() => navigate('/portfolio')}>
                <span className="nav-label">Portfolio</span>
              </button>
              <button className="nav-item" onClick={() => navigate('/performance')}>
                <span className="nav-label">Performance</span>
              </button>
              <button className="nav-item active">
                <span className="nav-label">Recommendations</span>
              </button>
            </div>

            <div className="nav-section">
              <div className="nav-section-title">Markets</div>
              <button className="nav-item" onClick={() => navigate('/market')}>
                <span className="nav-label">Live Markets</span>
              </button>
            </div>

            <div className="nav-section">
              <div className="nav-section-title">Account</div>
              <button className="nav-item" onClick={() => navigate('/kyc')}>
                <span className="nav-label">KYC Status</span>
              </button>
            </div>
          </nav>
        </aside>

        <main className="dashboard-main">
          <div className="page-header">
            <h1>Personalized AI Recommendations</h1>
            <p className="page-subtitle">3-5 tailored stock recommendations based on your KYC risk profile and market data</p>
          </div>

          <div className="content-card" style={{ marginBottom: 20 }}>
            <div style={{ padding: 16 }}>
              <strong>How these recommendations are generated:</strong>
              <p style={{ marginTop: 8 }}>
                The ML engine uses historical 2023–2024 price data plus current market data to predict short-term returns and match
                stocks to your risk profile and investment horizon. Each recommendation shows action, confidence, potential return, and a short rationale.
              </p>
            </div>
          </div>

          {loading && (
            <div className="content-card">Loading recommendations…</div>
          )}

          {error && (
            <div className="content-card" style={{ color: '#b91c1c' }}>{error}</div>
          )}

          {!loading && !error && (
            <div>
              {recs.length === 0 && (
                <div className="content-card">No recommendations available right now.</div>
              )}

              <div style={{ display: 'grid', gap: 12 }}>
                {recs.map((r, i) => (
                  <div key={i} className="content-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 700 }}>{r.ticker}</div>
                        <div style={{ fontSize: 13, color: '#6b7280' }}>{r.time_horizon} • {r.risk_level} risk</div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, fontSize: 18, color: r.action === 'BUY' ? '#065f46' : r.action === 'SELL' ? '#991b1b' : '#374151' }}>{r.action}</div>
                        <div style={{ fontSize: 13, color: '#6b7280' }}>Confidence: {r.confidence}%</div>
                        <div style={{ marginTop: 6 }}>
                          <div style={{ height: 8, background: '#e6e6e6', borderRadius: 4, overflow: 'hidden', width: 140 }}>
                            <div style={{ height: '100%', width: `${r.confidence}%`, background: r.confidence >= 70 ? '#059669' : r.confidence >= 40 ? '#f59e0b' : '#ef4444' }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 14 }}>{r.reason}</div>
                      <div style={{ marginTop: 8, fontSize: 13 }}><strong>Potential:</strong> {r.potential_return}</div>
                      {r.price !== undefined && (
                        <div style={{ marginTop: 6, fontSize: 13 }}><strong>Current Price:</strong> KES {Number(r.price).toFixed(2)}</div>
                      )}
                      
                      {r.confidence_explanation && (
                        <div style={{ marginTop: 10, padding: '10px', background: '#f3f4f6', borderRadius: 6, fontSize: 12 }}>
                          <strong style={{ color: '#374151' }}>Confidence Breakdown ({r.confidence}%):</strong>
                          <div style={{ marginTop: 4, color: '#6b7280', lineHeight: '1.5' }}>
                            {r.confidence_explanation.split(' | ').map((factor, idx) => (
                              <div key={idx}>• {factor}</div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                        <button
                          className="btn"
                          style={{ padding: '8px 12px', background: '#065f46', color: '#fff', border: 'none', borderRadius: 6 }}
                          onClick={() => handleActionClick(r, 'BUY')}
                          disabled={!!executing}
                        >
                          {executing === `${r.ticker}-BUY` ? 'Executing…' : 'Buy'}
                        </button>

                        <button
                          className="btn"
                          style={{ padding: '8px 12px', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 6 }}
                          onClick={() => handleActionClick(r, 'HOLD')}
                          disabled={!!executing}
                        >
                          {executing === `${r.ticker}-HOLD` ? 'Processing…' : 'Hold'}
                        </button>

                        <button
                          className="btn"
                          style={{ padding: '8px 12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6 }}
                          onClick={() => handleActionClick(r, 'SELL')}
                          disabled={!!executing}
                        >
                          {executing === `${r.ticker}-SELL` ? 'Executing…' : 'Sell'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </Layout>
  );
};

export default RecommendationsPage;
