import React from 'react';
import { Link } from 'react-router-dom';
import Layout from './Layout';

const LandingPage: React.FC = () => {
  return (
    <Layout>
      <div className="landing-page">
      
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-text">
            <h1>
              <span className="highlight-text">AI-Powered Investment</span><br />
              <span className="main-text">Advisory</span>
            </h1>
            <p className="hero-description">
              Real-time risk assessment, market data analytics, and intelligent 
              investment recommendations powered by NSE market data and advanced 
              AI models—tailored for the Kenyan investment landscape.
            </p>
            <Link to="/login" className="request-demo-btn">Get Started</Link>
          </div>
          
          <div className="hero-logos">
            <div className="logos-grid">
              <div className="logo-item">
                <div className="logo-placeholder">NAIROBI SECURITIES EXCHANGE</div>
              </div>
              <div className="logo-item">
                <div className="logo-placeholder">EQUITY BANK</div>
              </div>
              <div className="logo-item">
                <div className="logo-placeholder">KCB GROUP</div>
              </div>
              <div className="logo-item">
                <div className="logo-placeholder">SAFARICOM</div>
              </div>
            </div>
          </div>
        </div>
      </section>
      </div>
    </Layout>
  );
};

export default LandingPage;
