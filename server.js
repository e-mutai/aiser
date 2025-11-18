const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

// Import consolidated routes
const apiRoutes = require('./routes');

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
  console.log(`${req.method} ${req.path}`);
  next();
});

// Make pool available to routes
app.locals.pool = pool;

// API Routes - consolidated
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM users');
    const userCount = parseInt(result.rows[0].count);
    
    res.json({ 
      success: true, 
      message: 'AISER API Gateway is running',
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
  console.log(`🚀 AISER API Gateway running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`� Auth: /api/auth/register, /api/auth/login`);
  console.log(`👤 User: /api/user/profile`);
  console.log(`📋 KYC: /api/kyc/submit`);
});
