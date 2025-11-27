# AISER - AI-Powered Investment Advisory Platform

An intelligent investment advisory platform for the Nairobi Securities Exchange (NSE) that leverages machine learning to provide personalized stock recommendations based on user risk profiles.

## 🚀 Features

- **AI-Powered Recommendations**: Machine learning model trained on NSE historical data provides personalized stock recommendations
- **Risk Profile Analysis**: KYC-based risk assessment (Conservative, Moderate, Aggressive)
- **Real-Time Market Data**: Live NSE market data including NASI index, top gainers/losers, and stock prices
- **Dynamic Confidence Scores**: ML-generated confidence levels with detailed breakdowns
- **User Authentication**: Secure JWT-based authentication with session management
- **Portfolio Dashboard**: Comprehensive view of investments, performance, and risk metrics
- **Market Insights**: Historical performance data and market trends

## 🛠️ Tech Stack

### Frontend
- **React 19** with TypeScript
- **React Router** for navigation
- Context API for state management
- Custom CSS for styling

### Backend
- **Node.js** with Express.js
- **PostgreSQL** for user data and authentication
- **MongoDB** for market data and stock information
- **JWT** for secure authentication
- Real-time NSE data scraping

### Machine Learning
- **Python 3** with scikit-learn
- **RandomForest Regressor** for stock predictions
- Joblib for model serialization
- Custom recommendation engine with risk-adjusted scoring

## 📋 Prerequisites

- Node.js (v16+)
- PostgreSQL (v12+)
- MongoDB (v4.4+)
- Python 3.8+ with pip
- NSE historical data CSV files (2023, 2024)

## ⚙️ Installation

### 1. Clone the Repository
```bash
git clone https://github.com/e-mutai/aiser.git
cd aiser
```

### 2. Install Dependencies
```bash
# Install Node.js dependencies
npm install

# Setup Python virtual environment
cd ml
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

### 3. Database Setup

**PostgreSQL:**
```bash
# Create database
createdb -U postgres aiser

# Database will auto-initialize on first run
# Default table: users (id, email, password, first_name, last_name, phone_number, risk_score, kyc_verified, kyc_status, last_token)
```

**MongoDB:**
```bash
# Start MongoDB service
sudo systemctl start mongod

# Database and collections are auto-created on first run
```

### 4. Train ML Model
```bash
cd ml/recommender
python train_model.py
# This generates ml/ml_model.joblib (~352MB, not tracked in git)
```

### 5. Environment Variables (Optional)
Create a `.env` file in the root directory:
```env
PORT=5000
JWT_SECRET=your-secret-key
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-password
POSTGRES_DB=aiser
MONGODB_URI=mongodb://localhost:27017/aiser
```

## 🚀 Running the Application

### Start Backend Server
```bash
node server.js
# Backend runs on http://localhost:5000
```

### Start Frontend (New Terminal)
```bash
npm start
# Frontend runs on http://localhost:3000
```

### Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/user/profile` - Get user profile (requires auth)

### KYC & Risk Assessment
- `POST /api/kyc/submit` - Submit KYC information
- `GET /api/kyc/status` - Check KYC verification status

### Market Data
- `GET /api/market/nse` - Get NSE market overview
- `GET /api/market/stock/:ticker` - Get specific stock data

### Recommendations
- `GET /api/recommendations?count=5` - Get AI recommendations
- Query params: `count` (number of recommendations)

## 🤖 ML Model Details

### Training Data
- NSE historical stock data (2023-2024)
- Features: Price, Volume, Moving Averages, Volatility, RSI, MACD
- Target: 30-day predicted returns

### Model Architecture
- **Algorithm**: RandomForest Regressor
- **Features**: 20+ technical indicators
- **Risk Adjustment**: Conservative (-50%/-25%), Aggressive (+15%)
- **Confidence Calculation**: Based on predicted return and volatility

### Recommendation Engine
```python
confidence = (predicted_return × 500) - (volatility × 1000)
# Adjusted by user risk profile
# Returns: BUY, HOLD, or SELL with confidence percentage
```

## 📁 Project Structure

```
aiser/
├── src/                    # React frontend
│   ├── components/         # React components
│   ├── contexts/          # Context providers
│   └── styles.css         # Global styles
├── ml/                    # Machine learning
│   ├── recommender/       # ML model code
│   │   ├── model.py       # Model logic
│   │   ├── predict.py     # Prediction script
│   │   └── train_model.py # Training script
│   ├── requirements.txt   # Python dependencies
│   └── README.md         # ML setup guide
├── public/               # Static assets
├── server.js            # Express server
├── routes.js            # API routes
├── mongodb.js           # MongoDB connection
├── scraper.js           # NSE data scraper
├── recommendation-engine.js  # ML integration
└── package.json         # Node dependencies
```

## 🔐 Security Features

- Bcrypt password hashing
- JWT token-based authentication
- Session management with token refresh
- Protected API routes
- KYC verification system

## 📊 User Risk Profiles

| Profile | Risk Score | Investment Strategy |
|---------|-----------|-------------------|
| Conservative | 0-40 | Low-risk stocks, bonds, stable returns |
| Moderate | 41-70 | Balanced portfolio, moderate growth |
| Aggressive | 71-100 | High-growth stocks, higher volatility |

## 🧪 Testing

```bash
# Frontend tests
npm test

# Backend API test
curl http://localhost:5000/api/health
```

## 📝 Notes

- The ML model file (`ml/ml_model.joblib`) is not tracked in git due to size (352MB)
- Each developer must train the model locally after cloning
- NSE data CSV files are required for model training
- Market data refreshes every 5 minutes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

- Enock Mutai (@e-mutai)

## 🙏 Acknowledgments

- NSE for market data
- scikit-learn for ML framework
- Me🗿 for the amazing frontend library
