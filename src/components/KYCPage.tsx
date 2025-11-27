import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from './Layout';

interface RiskProfileData {
  // Personal Information
  fullName: string;
  nationalId: string;
  dateOfBirth: string;
  phoneNumber: string;
  address: string;
  
  // Risk Profiling Questions
  riskTolerance: number; // 1-5 slider (Conservative to Aggressive)
  investmentHorizon: string; // 1-3, 3-5, 5-10, 10+ years
  monthlyIncome: string;
  monthlyInvestment: string;
  nseExperience: string; // none, beginner, intermediate, advanced
  portfolioDropReaction: string; // sell_all, sell_some, hold, buy_more
  primaryGoal: string; // retirement, wealth_building, income, short_term
  emergencyFund: string; // none, partial, full
  ageBracket: string; // 18-25, 26-35, 36-45, 46-55, 56+
  maxAcceptableLoss: number; // 0-50% slider
}

const KYCPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [riskScore, setRiskScore] = useState(0);
  const [riskProfile, setRiskProfile] = useState('');

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login');
      return;
    }
    
    // Load existing KYC data if available
    const loadKycData = async () => {
      try {
        const token = localStorage.getItem('aiser_token');
        const response = await fetch('http://localhost:5000/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          // User can update their KYC info anytime
          console.log('KYC Status:', data.user.kycStatus);
        }
      } catch (error) {
        console.error('Failed to check KYC status:', error);
      }
    };
    
    loadKycData();
  }, [isAuthenticated, user, navigate]);

  const [formData, setFormData] = useState<RiskProfileData>({
    // Personal Information
    fullName: '',
    nationalId: '',
    dateOfBirth: '',
    phoneNumber: '',
    address: '',
    
    // Risk Profiling
    riskTolerance: 3,
    investmentHorizon: '3-5',
    monthlyIncome: '',
    monthlyInvestment: '5000',
    nseExperience: 'none',
    portfolioDropReaction: 'hold',
    primaryGoal: 'wealth_building',
    emergencyFund: 'partial',
    ageBracket: '26-35',
    maxAcceptableLoss: 10
  });

  // Risk Scoring Algorithm
  const calculateRiskScore = (data: RiskProfileData): { score: number; profile: string } => {
    let score = 0;
    
    // 1. Risk Tolerance Slider (20% weight)
    score += data.riskTolerance * 4; // 4-20 points
    
    // 2. Investment Horizon (15% weight)
    const horizonScores = { '1-3': 2, '3-5': 6, '5-10': 12, '10+': 15 };
    score += horizonScores[data.investmentHorizon as keyof typeof horizonScores] || 6;
    
    // 3. NSE Experience (15% weight)
    const expScores = { 'none': 0, 'beginner': 5, 'intermediate': 10, 'advanced': 15 };
    score += expScores[data.nseExperience as keyof typeof expScores] || 0;
    
    // 4. Portfolio Drop Reaction (20% weight)
    const reactionScores = { 'sell_all': 0, 'sell_some': 5, 'hold': 12, 'buy_more': 20 };
    score += reactionScores[data.portfolioDropReaction as keyof typeof reactionScores] || 12;
    
    // 5. Age Bracket (10% weight)
    const ageScores = { '18-25': 10, '26-35': 8, '36-45': 6, '46-55': 4, '56+': 2 };
    score += ageScores[data.ageBracket as keyof typeof ageScores] || 6;
    
    // 6. Emergency Fund (5% weight)
    const emergencyScores = { 'none': 0, 'partial': 2, 'full': 5 };
    score += emergencyScores[data.emergencyFund as keyof typeof emergencyScores] || 2;
    
    // 7. Max Acceptable Loss (10% weight)
    score += Math.floor(data.maxAcceptableLoss / 5); // 0-10 points
    
    // 8. Primary Goal (5% weight)
    const goalScores = { 'short_term': 1, 'income': 2, 'retirement': 3, 'wealth_building': 5 };
    score += goalScores[data.primaryGoal as keyof typeof goalScores] || 3;
    
    // Determine risk profile
    let profile = '';
    if (score <= 40) profile = 'Conservative';
    else if (score <= 70) profile = 'Moderate';
    else profile = 'Aggressive';
    
    return { score, profile };
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const newFormData = {
      ...formData,
      [name]: name === 'riskTolerance' || name === 'maxAcceptableLoss' ? Number(value) : value
    };
    setFormData(newFormData);
    
    // Recalculate risk score in real-time
    const { score, profile } = calculateRiskScore(newFormData);
    setRiskScore(score);
    setRiskProfile(profile);
    
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('aiser_token');
      const storedUser = localStorage.getItem('aiser_user');
      
      console.log('Submitting KYC - Token:', token ? 'exists' : 'missing', '| User:', storedUser ? 'exists' : 'missing');
      
      if (!token || !storedUser) {
        setError('Session expired. Please log in again.');
        setIsLoading(false);
        setTimeout(() => navigate('/login'), 1500);
        return;
      }
      
      const response = await fetch('http://localhost:5000/api/kyc/submit', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log('KYC Response:', { status: response.status, success: data.success, message: data.message });
      
      if (response.ok && data.success) {
        console.log('✅ KYC successful! Redirecting to dashboard...');
        // Update client-side user state so UI reflects new KYC status
        try {
          updateUser({ 
            kycStatus: 'verified',
            kycVerified: true 
          } as any);
          
          // Also update localStorage directly to ensure persistence
          const storedUserStr = localStorage.getItem('aiser_user');
          if (storedUserStr) {
            const storedUser = JSON.parse(storedUserStr);
            storedUser.kycStatus = 'verified';
            storedUser.kycVerified = true;
            localStorage.setItem('aiser_user', JSON.stringify(storedUser));
          }
        } catch (err) {
          console.warn('Could not update local user state:', err);
        }
        // Keep the button disabled and navigate
        navigate('/dashboard', { replace: true });
      } else {
        console.error('❌ KYC failed:', data.message);
        setError(data.message || 'KYC submission failed');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('❌ KYC submission error:', err);
      setError('Something went wrong. Please try again.');
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

                {/* Financial Information / Risk Profiling Section */}
                <div className="form-section">
                  <h3 className="section-title">Investment & Risk Profile</h3>

                  <div className="form-group">
                    <label>Monthly Income</label>
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
                    <label>Planned monthly investment (KES)</label>
                    <input
                      type="number"
                      name="monthlyInvestment"
                      value={formData.monthlyInvestment}
                      onChange={handleInputChange}
                      placeholder="e.g. 5000"
                      min={0}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>NSE / Stock market experience</label>
                    <select
                      name="nseExperience"
                      value={formData.nseExperience}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="none">None</option>
                      <option value="beginner">Beginner (0-1 years)</option>
                      <option value="intermediate">Intermediate (2-5 years)</option>
                      <option value="advanced">Advanced (5+ years)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>How would you react to a 30% portfolio drop?</label>
                    <select
                      name="portfolioDropReaction"
                      value={formData.portfolioDropReaction}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="sell_all">Sell everything</option>
                      <option value="sell_some">Sell some</option>
                      <option value="hold">Hold / do nothing</option>
                      <option value="buy_more">Buy more (buy the dip)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Primary investment goal</label>
                    <select
                      name="primaryGoal"
                      value={formData.primaryGoal}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="wealth_building">Wealth building (long-term)</option>
                      <option value="retirement">Retirement</option>
                      <option value="income">Regular income</option>
                      <option value="short_term">Short-term gains</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Emergency fund status</label>
                    <select
                      name="emergencyFund"
                      value={formData.emergencyFund}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="none">No emergency fund</option>
                      <option value="partial">Partial (covers some months)</option>
                      <option value="full">Full (3+ months)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Age bracket</label>
                    <select
                      name="ageBracket"
                      value={formData.ageBracket}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="18-25">18 - 25</option>
                      <option value="26-35">26 - 35</option>
                      <option value="36-45">36 - 45</option>
                      <option value="46-55">46 - 55</option>
                      <option value="56+">56+</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Risk tolerance (1 = Conservative, 5 = Aggressive): <strong>{formData.riskTolerance}</strong></label>
                    <input
                      type="range"
                      name="riskTolerance"
                      min={1}
                      max={5}
                      value={formData.riskTolerance}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>Maximum acceptable loss: <strong>{formData.maxAcceptableLoss}%</strong></label>
                    <input
                      type="range"
                      name="maxAcceptableLoss"
                      min={0}
                      max={50}
                      step={1}
                      value={formData.maxAcceptableLoss}
                      onChange={handleInputChange}
                    />
                  </div>

                  {/* Live score display */}
                  <div className="form-group">
                    <label>Calculated risk score: {riskScore} / 100</label>
                    <div className="risk-bar" aria-hidden style={{background:'#e5e7eb',height:12,borderRadius:6}}>
                      <div style={{width:`${Math.min(100,Math.max(0,riskScore))}%`,height:'100%',borderRadius:6,background: riskScore<=40? '#3b82f6' : riskScore<=70? '#f59e0b' : '#ef4444'}} />
                    </div>
                    <div style={{marginTop:6}}>Profile: <strong>{riskProfile || '—'}</strong></div>
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
