import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Header from './Header';

const LoginPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });

  // Set initial mode based on URL
  useEffect(() => {
    setIsSignUp(location.pathname === '/signup');
  }, [location.pathname]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Form submitted:', formData);
    
    // Simulate successful login/signup and redirect to dashboard
    navigate('/dashboard');
  };

  return (
    <div className="login-page">
      <Header />

      {/* Main Content */}
      <div className="auth-container">
        <div className="auth-content">
          <div className="auth-form-section">
            <div className="auth-form">
              <h1>{isSignUp ? 'Join Aiser' : 'Welcome Back'}</h1>
              <p className="auth-subtitle">
                {isSignUp 
                  ? 'Start your AI-powered investment journey in the Kenyan market' 
                  : 'Access your investment advisory dashboard'}
              </p>              <form onSubmit={handleSubmit} className="form">
                {isSignUp && (
                  <div className="form-group">
                    <label htmlFor="fullName">Full Name</label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    required
                  />
                </div>

                {isSignUp && (
                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm Password</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Confirm your password"
                      required
                    />
                  </div>
                )}

                {!isSignUp && (
                  <div className="form-options">
                    <div className="remember-me">
                      <input type="checkbox" id="remember" />
                      <label htmlFor="remember">Remember me</label>
                    </div>
                    <a href="#forgot" className="forgot-password">Forgot password?</a>
                  </div>
                )}

                <button type="submit" className="auth-btn">
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </button>

                <div className="auth-switch">
                  <p>
                    {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                    <Link 
                      to={isSignUp ? '/login' : '/signup'}
                      className="switch-btn"
                    >
                      {isSignUp ? 'Sign In' : 'Sign Up'}
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </div>

          <div className="auth-visual-section">
            <div className="visual-content">
              <h2>
                <span className="highlight-text">AI-Powered Investment</span><br />
                <span className="main-text">Advisory</span>
              </h2>
              <p>
                Real-time risk assessment, market data analytics, and intelligent 
                investment recommendations powered by NSE market data and advanced 
                AI models—tailored for the Kenyan investment landscape.
              </p>
              
              <div className="feature-highlights">
                <div className="feature-item">
                  <div className="feature-title">NSE Market Data Integration</div>
                  <div className="feature-desc">Real-time data from Nairobi Securities Exchange</div>
                </div>
                <div className="feature-item">
                  <div className="feature-title">AI-Driven Risk Assessment</div>
                  <div className="feature-desc">Advanced models trained on Kenyan market patterns</div>
                </div>
                <div className="feature-item">
                  <div className="feature-title">Local Market Insights</div>
                  <div className="feature-desc">Tailored recommendations for Kenyan investors</div>
                </div>
              </div>

              <div className="trusted-partners">
                <p className="partners-label">Trusted by leading Kenyan institutions</p>
                <div className="partners-logos">
                  <div className="partner-logo">NAIROBI SECURITIES EXCHANGE</div>
                  <div className="partner-logo">EQUITY BANK</div>
                  <div className="partner-logo">KCB GROUP</div>
                  <div className="partner-logo">SAFARICOM</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
