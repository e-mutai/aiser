const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'simple-secret-key';

// Authentication middleware
function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// ============================================
// AUTH ROUTES
// ============================================

// Register endpoint - POST /api/auth/register
router.post('/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phoneNumber } = req.body;
    const pool = req.app.locals.pool;

    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (email, password, first_name, last_name, phone_number) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, first_name, last_name, phone_number, kyc_status, kyc_verified',
      [email, hashedPassword, firstName, lastName, phoneNumber]
    );

    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({
      success: true,
      needsKyc: !user.kyc_verified,
      message: 'User registered successfully',
      token,
      user: { 
        id: user.id, 
        email: user.email, 
        firstName: user.first_name,
        lastName: user.last_name,
        phoneNumber: user.phone_number,
        kycStatus: user.kyc_status,
        kycVerified: user.kyc_verified
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Login endpoint - POST /api/auth/login
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const pool = req.app.locals.pool;

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: { 
        id: user.id, 
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phoneNumber: user.phone_number,
        kycStatus: user.kyc_status,
        kycVerified: user.kyc_verified
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================
// USER ROUTES (Protected)
// ============================================

// Get user profile - GET /api/user/profile
router.get('/user/profile', authenticateToken, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query(
      'SELECT id, email, first_name, last_name, phone_number, kyc_status, kyc_verified FROM users WHERE id = $1',
      [req.user.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result.rows[0];
    res.json({ 
      user: { 
        id: user.id, 
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phoneNumber: user.phone_number,
        kycStatus: user.kyc_status,
        kyc_verified: user.kyc_verified
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================
// KYC ROUTES (Protected)
// ============================================

// KYC submission endpoint - POST /api/kyc/submit
router.post('/kyc/submit', authenticateToken, async (req, res) => {
  try {
    const {
      fullName, nationalId, dateOfBirth, phoneNumber, address,
      monthlyIncome, monthlyInvestment, investmentHorizon, nseExperience,
      portfolioDropReaction, primaryGoal, emergencyFund, ageBracket,
      riskTolerance, maxAcceptableLoss
    } = req.body;

    const userId = req.user.userId;
    const pool = req.app.locals.pool;

    // Ensure table has the newer columns (lightweight migration)
    await pool.query(`ALTER TABLE kyc_data
      ADD COLUMN IF NOT EXISTS monthly_investment VARCHAR(50),
      ADD COLUMN IF NOT EXISTS investment_horizon VARCHAR(50),
      ADD COLUMN IF NOT EXISTS nse_experience VARCHAR(50),
      ADD COLUMN IF NOT EXISTS portfolio_drop_reaction VARCHAR(50),
      ADD COLUMN IF NOT EXISTS emergency_fund VARCHAR(50),
      ADD COLUMN IF NOT EXISTS age_bracket VARCHAR(50),
      ADD COLUMN IF NOT EXISTS max_acceptable_loss INTEGER,
      ADD COLUMN IF NOT EXISTS risk_score INTEGER,
      ADD COLUMN IF NOT EXISTS risk_profile VARCHAR(50)
    `);

    // Check if KYC already exists
    const existingKyc = await pool.query('SELECT * FROM kyc_data WHERE user_id = $1', [userId]);
    
    // Server-side risk scoring (mirror frontend algorithm)
    const calculateRiskScore = (data) => {
      let score = 0;
      score += (Number(data.riskTolerance) || 3) * 4;
      const horizonScores = { '1-3': 2, '3-5': 6, '5-10': 12, '10+': 15 };
      score += horizonScores[data.investmentHorizon] || horizonScores['3-5'];
      const expScores = { 'none': 0, 'beginner': 5, 'intermediate': 10, 'advanced': 15 };
      score += expScores[data.nseExperience] || 0;
      const reactionScores = { 'sell_all': 0, 'sell_some': 5, 'hold': 12, 'buy_more': 20 };
      score += reactionScores[data.portfolioDropReaction] || 12;
      const ageScores = { '18-25': 10, '26-35': 8, '36-45': 6, '46-55': 4, '56+': 2 };
      score += ageScores[data.ageBracket] || 6;
      const emergencyScores = { 'none': 0, 'partial': 2, 'full': 5 };
      score += emergencyScores[data.emergencyFund] || 2;
      score += Math.floor((Number(data.maxAcceptableLoss) || 0) / 5);
      const goalScores = { 'short_term': 1, 'income': 2, 'retirement': 3, 'wealth_building': 5 };
      score += goalScores[data.primaryGoal] || 3;
      score = Math.max(0, Math.min(100, Math.round(score)));
      let profile = '';
      if (score <= 40) profile = 'Conservative';
      else if (score <= 70) profile = 'Moderate';
      else profile = 'Aggressive';
      return { score, profile };
    };

    const { score: risk_score, profile: risk_profile } = calculateRiskScore({
      riskTolerance, investmentHorizon, nseExperience, portfolioDropReaction,
      ageBracket, emergencyFund, maxAcceptableLoss, primaryGoal
    });

    // Insert or Update KYC data
    if (existingKyc.rows.length > 0) {
      await pool.query(`
        UPDATE kyc_data SET
          full_name = $2, national_id = $3, date_of_birth = $4, phone_number = $5, address = $6,
          monthly_income = $7, monthly_investment = $8, investment_horizon = $9, nse_experience = $10,
          portfolio_drop_reaction = $11, emergency_fund = $12, age_bracket = $13, max_acceptable_loss = $14,
          risk_tolerance = $15, risk_score = $16, risk_profile = $17, investment_goals = $18,
          updated_at = NOW()
        WHERE user_id = $1
      `, [
        userId, fullName, nationalId, dateOfBirth, phoneNumber, address,
        monthlyIncome, monthlyInvestment || null, investmentHorizon || null, nseExperience || null,
        portfolioDropReaction || null, emergencyFund || null, ageBracket || null, maxAcceptableLoss || null,
        riskTolerance || null, risk_score, risk_profile, primaryGoal || null
      ]);
    } else {
      await pool.query(`
        INSERT INTO kyc_data (
          user_id, full_name, national_id, date_of_birth, phone_number, address,
          monthly_income, monthly_investment, investment_horizon, nse_experience,
          portfolio_drop_reaction, emergency_fund, age_bracket, max_acceptable_loss,
          risk_tolerance, risk_score, risk_profile, investment_goals
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
      `, [
        userId, fullName, nationalId, dateOfBirth, phoneNumber, address,
        monthlyIncome, monthlyInvestment || null, investmentHorizon || null, nseExperience || null,
        portfolioDropReaction || null, emergencyFund || null, ageBracket || null, maxAcceptableLoss || null,
        riskTolerance || null, risk_score, risk_profile, primaryGoal || null
      ]);
    }

    // Update user KYC status to submitted
    await pool.query('UPDATE users SET kyc_status = $1 WHERE id = $2', ['submitted', userId]);

    // Auto-verify after 3 seconds (demo only)
    setTimeout(async () => {
      try {
        await pool.query('UPDATE users SET kyc_status = $1, kyc_verified = $2 WHERE id = $3', ['verified', true, userId]);
        await pool.query('UPDATE kyc_data SET status = $1, updated_at = NOW() WHERE user_id = $2', ['verified', userId]);
      } catch (err) {
        console.error('Auto-verification failed:', err);
      }
    }, 3000);

    res.json({
      success: true,
      message: existingKyc.rows.length > 0 ? 'KYC updated successfully. Verification in progress...' : 'KYC submitted successfully. Verification in progress...',
      status: 'submitted',
      riskScore: risk_score,
      riskProfile: risk_profile
    });

  } catch (error) {
    console.error('❌ KYC submission error:', error);
    res.status(500).json({
      success: false,
      message: 'KYC submission failed',
      error: error.message
    });
  }
});

// ============================================
// MARKET ROUTES
// ============================================

const { fetchNSEData, getTopByVolume } = require('./scraper');

// Get NSE market data - GET /api/market/nse
router.get('/market/nse', async (req, res) => {
  try {
    const data = await fetchNSEData();
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('❌ NSE scraper error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch market data',
      error: error.message
    });
  }
});

// Get top stocks by volume - GET /api/market/top-volume
router.get('/market/top-volume', async (req, res) => {
  try {
    const count = parseInt(req.query.count) || 5;
    const stocks = getTopByVolume(count);
    res.json({
      success: true,
      stocks
    });
  } catch (error) {
    console.error('❌ Top volume error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch top volume stocks'
    });
  }
});

module.exports = router;

