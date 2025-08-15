import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from './Layout';

const KYCPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login');
    }
  }, [isAuthenticated, user, navigate]);
  const [formData, setFormData] = useState({
    // Personal Information
    fullName: '',
    nationalId: '',
    dateOfBirth: '',
    phoneNumber: '',
    address: '',
    
    // Financial Information
    monthlyIncome: '',
    investmentExperience: 'beginner',
    riskTolerance: 'low',
    investmentGoals: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    console.log('🔍 KYC Form Data:', formData);
    
    try {
      const token = localStorage.getItem('aiser_token');
      console.log('� Token retrieved:', token ? 'Present' : 'Missing');
      
      const response = await fetch('http://localhost:5000/api/kyc/submit', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      console.log('🔍 Response status:', response.status);
      const data = await response.json();
      console.log('🔍 Response data:', data);
      
      if (response.ok && data.success) {
        console.log('✅ KYC submission successful, redirecting to dashboard');
        // KYC submitted successfully
        navigate('/dashboard');
      } else {
        console.error('❌ KYC submission failed:', data.message);
        setError(data.message || 'KYC submission failed');
      }
    } catch (err) {
      console.error('❌ KYC submission error:', err);
      setError('Something went wrong. Please try again.');
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
              <h1>Complete Your Profile</h1>
              <p className="auth-subtitle">
                To comply with financial regulations, please provide the following information
              </p>

              {error && <div className="error-message">{error}</div>}

              <form onSubmit={handleSubmit} className="kyc-form">
                {/* Personal Information Section */}
                <div className="form-section">
                  <h3 className="section-title">Personal Information</h3>
                  
                  <div className="form-group">
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="Full Name (as per ID)"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <input
                      type="text"
                      name="nationalId"
                      value={formData.nationalId}
                      onChange={handleInputChange}
                      placeholder="National ID Number"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      placeholder="Phone Number (07xxxxxxxx)"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Physical Address"
                      required
                    />
                  </div>
                </div>

                {/* Financial Information Section */}
                <div className="form-section">
                  <h3 className="section-title">Investment Profile</h3>
                  
                  <div className="form-group">
                    <select
                      name="monthlyIncome"
                      value={formData.monthlyIncome}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Monthly Income Range</option>
                      <option value="0-30000">KES 0 - 30,000</option>
                      <option value="30000-50000">KES 30,000 - 50,000</option>
                      <option value="50000-100000">KES 50,000 - 100,000</option>
                      <option value="100000-200000">KES 100,000 - 200,000</option>
                      <option value="200000+">KES 200,000+</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <select
                      name="investmentExperience"
                      value={formData.investmentExperience}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="beginner">Beginner (0-1 years)</option>
                      <option value="intermediate">Intermediate (2-5 years)</option>
                      <option value="advanced">Advanced (5+ years)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <select
                      name="riskTolerance"
                      value={formData.riskTolerance}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="low">Conservative (Low Risk)</option>
                      <option value="medium">Balanced (Medium Risk)</option>
                      <option value="high">Aggressive (High Risk)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <textarea
                      name="investmentGoals"
                      value={formData.investmentGoals}
                      onChange={handleInputChange}
                      placeholder="What are your investment goals? (e.g., retirement, wealth building, short-term gains)"
                      rows={3}
                      required
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="auth-btn"
                  disabled={isLoading}
                >
                  {isLoading ? 'Submitting...' : 'Complete KYC Verification'}
                </button>
              </form>
            </div>
          </div>

          <div className="auth-info-section">
            <div className="auth-info">
              <h2>Why KYC?</h2>
              <div className="feature-list">
                <div className="feature-item">
                  <div>
                    <h4>Security & Compliance</h4>
                    <p>KYC helps us comply with financial regulations and protect your investments</p>
                  </div>
                </div>
                <div className="feature-item">
                  <div>
                    <h4>Personalized Recommendations</h4>
                    <p>We use this information to provide AI-powered investment advice tailored to your profile</p>
                  </div>
                </div>
                <div className="feature-item">
                  <div>
                    <h4>Fast Processing</h4>
                    <p>Your information will be verified within 24-48 hours</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default KYCPage;
