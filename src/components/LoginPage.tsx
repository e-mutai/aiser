import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from './Layout';

const LoginPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phoneNumber: ''
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
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      if (isSignUp) {
        // Registration
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setIsLoading(false);
          return;
        }

        const response = await fetch('http://localhost:5000/api/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone_number: formData.phoneNumber
          }),
        });

        const data = await response.json();

        if (response.ok) {
          setMessage('Registration successful! Please log in.');
          setIsSignUp(false);
          setFormData({
            email: formData.email,
            password: '',
            confirmPassword: '',
            firstName: '',
            lastName: '',
            phoneNumber: ''
          });
        } else {
          setError(data.error || 'Registration failed. Please try again.');
        }
      } else {
        // Login
        const success = await login(formData.email, formData.password);
        if (success) {
          navigate('/dashboard');
        } else {
          setError('Invalid email or password');
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="auth-container">
        <div className="auth-content">
          <div className="auth-form-section">
            <div className="auth-form">
              <h1>{isSignUp ? 'Join Aiser' : 'Welcome Back'}</h1>
              <p className="auth-subtitle">
                {isSignUp 
                  ? 'Start your AI-powered investment journey in the Kenyan market' 
                  : 'Access your investment advisory dashboard'}
              </p>
              
              <form onSubmit={handleSubmit} className="form">
                {error && (
                  <div className="error-message" style={{
                    padding: '10px',
                    backgroundColor: '#fee',
                    color: '#c33',
                    borderRadius: '4px',
                    marginBottom: '15px',
                    border: '1px solid #fcc'
                  }}>
                    {error}
                  </div>
                )}

                {message && (
                  <div className="success-message" style={{
                    padding: '10px',
                    backgroundColor: '#efe',
                    color: '#363',
                    borderRadius: '4px',
                    marginBottom: '15px',
                    border: '1px solid #cfc'
                  }}>
                    {message}
                  </div>
                )}

                {isSignUp && (
                  <>
                    <div className="form-group">
                      <label htmlFor="firstName">First Name</label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        placeholder="Enter your first name"
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="lastName">Last Name</label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        placeholder="Enter your last name"
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="phoneNumber">Phone Number</label>
                      <input
                        type="tel"
                        id="phoneNumber"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        placeholder="Enter your phone number"
                        required
                      />
                    </div>
                  </>
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

                <button type="submit" className="auth-btn" disabled={isLoading}>
                  {isLoading 
                    ? (isSignUp ? 'Creating Account...' : 'Signing In...')
                    : (isSignUp ? 'Create Account' : 'Sign In')
                  }
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
                  <div className="feature-desc">Tailored recommendations for investors</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LoginPage;
