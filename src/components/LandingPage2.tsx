import React from 'react';
import { Link } from 'react-router-dom';
import Header from './Header';

const LandingPage: React.FC = () => {
  return (
    <div className="landing-page">
      <Header />
      
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-text">
            <h1>
              <span className="highlight-text">AI-Powered Investment</span><br />
              <span className="main-text">Advisory</span> <span className="scale-text">for Kenya</span>
            </h1>
            <p className="hero-description">
              Real-time risk assessment, market data analytics, and intelligent 
              investment recommendations powered by NSE market data and advanced 
              AI models—tailored for the Kenyan investment landscape.
            </p>
            <Link to="/signup" className="request-demo-btn">Get Started</Link>
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
  );
};

export default LandingPage;
