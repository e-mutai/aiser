const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'aiser_market_data';

let client = null;
let db = null;

async function connectMongoDB() {
  if (db) {
    return db;
  }

  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    console.log('✅ MongoDB connected successfully');
    return db;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

async function getMongoClient() {
  if (!client) {
    await connectMongoDB();
  }
  return client;
}

async function getDB() {
  if (!db) {
    await connectMongoDB();
  }
  return db;
}

async function closeMongoDB() {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('✅ MongoDB connection closed');
  }
}

// Collections
const COLLECTIONS = {
  MARKET_DATA: 'market_data',
  STOCK_PRICES: 'stock_prices',
  TRAINING_DATA: 'training_data',
  RECOMMENDATIONS: 'recommendations',
  TRANSACTIONS: 'transactions',
  PORTFOLIO: 'portfolio'
};

module.exports = {
  connectMongoDB,
  getMongoClient,
  getDB,
  closeMongoDB,
  COLLECTIONS
};
