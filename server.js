const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 5000;

// PostgreSQL connection
const pool = new Pool({
  user: 'ekm',
  host: '/var/run/postgresql',
  database: 'aiser',
  port: 5432,
});

// Create users table if it doesn't exist
const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        phone_number VARCHAR(20),
        kyc_status VARCHAR(20) DEFAULT 'pending',
        kyc_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add missing columns to existing users table (migration)
    try {
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(255)');
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(255)');
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20)');
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_verified BOOLEAN DEFAULT FALSE');
      console.log('✅ Users table migration completed');
    } catch (migrationError) {
      console.log('📝 Migration note:', migrationError.message);
    }

    // Create KYC table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS kyc_data (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        full_name VARCHAR(255),
        national_id VARCHAR(50),
        date_of_birth DATE,
        phone_number VARCHAR(20),
        address TEXT,
        monthly_income VARCHAR(50),
        investment_experience VARCHAR(20),
        risk_tolerance VARCHAR(20),
        investment_goals TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('📊 PostgreSQL database initialized');
  } catch (err) {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  }
};

initDB();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📥 ${new Date().toISOString()} - ${req.method} ${req.path}`);
  if (req.method === 'POST') {
    console.log('📝 Request body:', req.body);
    console.log('🔑 Authorization header:', req.headers.authorization ? 'Present' : 'Missing');
  }
  next();
});

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'simple-secret-key';

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM users');
    const userCount = parseInt(result.rows[0].count);
    
    res.json({ 
      success: true, 
      message: 'Simple AISER API is running',
      database: 'PostgreSQL connected',
      users: userCount
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Database connection error' 
    });
  }
});

// Register endpoint
// Register
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phoneNumber } = req.body;

    // Check if user exists
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.query(
      'INSERT INTO users (email, password, first_name, last_name, phone_number) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, first_name, last_name, phone_number, kyc_status, kyc_verified',
      [email, hashedPassword, firstName, lastName, phoneNumber]
    );

    const user = result.rows[0];

    // Generate token
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET);

    // Check if user needs KYC (always true for new users)
    const needsKyc = !user.kyc_verified;

    res.status(201).json({
      success: true,
      needsKyc: needsKyc,
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

// Login endpoint
// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET);

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

// Simple middleware to verify token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// Protected route - get user profile
// Protected route
app.get('/api/profile', async (req, res) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Access denied' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const result = await pool.query('SELECT id, email, first_name, last_name, phone_number, kyc_status, kyc_verified FROM users WHERE id = $1', [decoded.userId]);
    
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
    res.status(401).json({ message: 'Invalid token' });
  }
});

// JWT Authentication middleware
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Access denied' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// KYC submission endpoint
app.post('/api/kyc/submit', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 KYC Submission received:', {
      userId: req.user.userId,
      body: req.body,
      headers: req.headers.authorization ? 'Token present' : 'No token'
    });
    
    const { 
      fullName, nationalId, dateOfBirth, phoneNumber, address,
      monthlyIncome, investmentExperience, riskTolerance, investmentGoals
    } = req.body;
    
    console.log('📝 Extracted KYC fields:', {
      fullName, nationalId, dateOfBirth, phoneNumber, address,
      monthlyIncome, investmentExperience, riskTolerance, investmentGoals
    });
    
    const userId = req.user.userId;
    
    // Check if KYC already exists
    const existingKyc = await pool.query('SELECT * FROM kyc_data WHERE user_id = $1', [userId]);
    
    if (existingKyc.rows.length > 0) {
      console.log('⚠️ KYC already exists for user:', userId);
      return res.status(400).json({ message: 'KYC already submitted' });
    }
    
    console.log('💾 Inserting KYC data for user:', userId);
    
    // Insert KYC data
    await pool.query(`
      INSERT INTO kyc_data (
        user_id, full_name, national_id, date_of_birth, phone_number, address,
        monthly_income, investment_experience, risk_tolerance, investment_goals
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
      userId, fullName, nationalId, dateOfBirth, phoneNumber, address,
      monthlyIncome, investmentExperience, riskTolerance, investmentGoals
    ]);
    
    console.log('✅ KYC data inserted successfully');
    
    // Update user KYC status to submitted
    await pool.query('UPDATE users SET kyc_status = $1 WHERE id = $2', ['submitted', userId]);
    
    console.log('📊 User KYC status updated to submitted');
    
    // For demo: automatically verify after 3 seconds
    setTimeout(async () => {
      try {
        await pool.query('UPDATE users SET kyc_status = $1, kyc_verified = $2 WHERE id = $3', ['verified', true, userId]);
        await pool.query('UPDATE kyc_data SET status = $1, updated_at = NOW() WHERE user_id = $2', ['verified', userId]);
        console.log(`✅ Auto-verified KYC for user ${userId}`);
      } catch (err) {
        console.error('Auto-verification failed:', err);
      }
    }, 3000);
    
    console.log('🚀 Sending success response');
    
    res.json({ 
      success: true,
      message: 'KYC submitted successfully. Verification in progress...',
      status: 'submitted'
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

// Simple KYC status update (for testing)
app.post('/api/kyc/update', verifyToken, (req, res) => {
  const { status } = req.body; // pending, approved, rejected
  
  const userIndex = users.findIndex(u => u.id === req.user.userId);
  if (userIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  users[userIndex].kycStatus = status || 'pending';

  res.json({
    success: true,
    message: 'KYC status updated',
    kycStatus: users[userIndex].kycStatus
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    success: false,
    message: 'Server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Simple AISER API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📝 Database: PostgreSQL only`);
});
