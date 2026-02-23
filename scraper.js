const https = require('https');
const { getDB, COLLECTIONS } = require('./mongodb');

// Cache for scraped data (refresh every 5 minutes)
let cachedData = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch and parse NSE data from afx.kwayisi.org
 */
async function fetchNSEData() {
  // Return cached data if still fresh
  const now = Date.now();
  if (cachedData && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedData;
  }

  return new Promise((resolve, reject) => {
    https.get('https://afx.kwayisi.org/nse/', (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = parseNSEData(data);
          cachedData = parsed;
          lastFetchTime = now;
          
          // Save to MongoDB asynchronously (don't block response)
          saveToMongoDB(parsed).catch(err => {
            console.error('❌ Error saving to MongoDB:', err);
          });
          
          resolve(parsed);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Parse HTML to extract NSE market data
 */
function parseNSEData(html) {
  const data = {
    nasi: {},
    marketCap: null,
    topGainers: [],
    topLosers: [],
    stocks: [],
    lastUpdated: new Date().toISOString()
  };

  // Extract NASI, YTD, and Market Cap from the stats table
  const statsMatch = html.match(/<td>(\d+\.\d+)\s*<span[^>]*>\(\+?(-?\d+\.\d+)\)<\/span><td[^>]*>\+(\d+\.\d+)\s*\((\d+\.\d+)%\)<td>KES\s+([\d.]+)Tr/);
  if (statsMatch) {
    data.nasi.value = parseFloat(statsMatch[1]);
    data.nasi.change = parseFloat(statsMatch[2]);
    data.nasi.changePercent = ((data.nasi.change / (data.nasi.value - data.nasi.change)) * 100).toFixed(2);
    data.nasi.ytdChange = parseFloat(statsMatch[3]);
    data.nasi.ytdChangePercent = parseFloat(statsMatch[4]);
    data.marketCap = `KES ${statsMatch[5]} Trillion`;
    data.marketCapValue = parseFloat(statsMatch[5]);
  }

  // Extract Top Gainers from the specific table
  const gainersSection = html.match(/<thead><tr><th colspan=3>Top Gainers[^]*?<\/table>/);
  if (gainersSection) {
    const gainersHTML = gainersSection[0];
    const gainersPattern = /<td><a[^>]*title="([^"]+)">([A-Z0-9]+)<\/a><td[^>]*>([^<]+)<td[^>]*>\+([^%]+)%/g;
    let match;
    
    while ((match = gainersPattern.exec(gainersHTML)) !== null && data.topGainers.length < 6) {
      data.topGainers.push({
        ticker: match[2],
        name: match[1],
        price: parseFloat(match[3].replace(/,/g, '')),
        changePercent: parseFloat(match[4])
      });
    }
  }

  // Extract Top Losers
  const losersSection = html.match(/<thead><tr><th colspan=3>Bottom Losers[^]*?<\/table>/);
  if (losersSection) {
    const losersHTML = losersSection[0];
    const losersPattern = /<td><a[^>]*title="([^"]+)">([A-Z0-9]+)<\/a><td[^>]*>([^<]+)<td[^>]*>-([^%]+)%/g;
    let match;
    
    while ((match = losersPattern.exec(losersHTML)) !== null && data.topLosers.length < 6) {
      data.topLosers.push({
        ticker: match[2],
        name: match[1],
        price: parseFloat(match[3].replace(/,/g, '')),
        changePercent: -parseFloat(match[4])
      });
    }
  }

  // Extract all stocks from the main listing table
  const listingSection = html.match(/<div class=h2><h2 class=n>Listed companies\/securities<\/h2><\/div>[^]*?<\/table>/);
  if (listingSection) {
    const listingHTML = listingSection[0];
    const stockPattern = /<tr[^>]*><td><a[^>]*title="([^"]+)">([A-Z0-9-]+)<\/a><td><a[^>]*>([^<]+)<\/a><td>([^<]*)<td>([^<]+)<td[^>]*>([^<]+)/g;
    let match;
    
    while ((match = stockPattern.exec(listingHTML)) !== null) {
      const name = match[1];
      const ticker = match[2];
      const volumeStr = match[4].trim();
      const priceStr = match[5].trim();
      const changeStr = match[6].trim();
      
      // Parse volume
      let volume = 0;
      if (volumeStr && volumeStr !== '') {
        volume = parseInt(volumeStr.replace(/,/g, ''));
      }
      
      // Parse price
      const price = parseFloat(priceStr.replace(/,/g, ''));
      
      // Parse change
      let change = 0;
      let changePercent = 0;
      if (changeStr && changeStr !== '' && !changeStr.includes('</')) {
        change = parseFloat(changeStr);
        if (price > 0 && change !== 0) {
          changePercent = ((change / price) * 100).toFixed(2);
        }
      }

      data.stocks.push({
        ticker,
        name,
        volume: isNaN(volume) ? 0 : volume,
        price,
        change,
        changePercent: parseFloat(changePercent)
      });
    }
  }

  // Sort stocks by volume (most active)
  data.stocks.sort((a, b) => b.volume - a.volume);

  return data;
}

/**
 * Get top movers by volume
 */
function getTopByVolume(count = 5) {
  if (!cachedData || !cachedData.stocks) return [];
  return cachedData.stocks.slice(0, count);
}

/**
 * Save market data to MongoDB
 */
async function saveToMongoDB(data) {
  try {
    const db = await getDB();
    const marketDataCollection = db.collection(COLLECTIONS.MARKET_DATA);
    
    // Save complete market snapshot
    const snapshot = {
      timestamp: new Date(),
      nasi: data.nasi,
      marketCap: data.marketCap,
      topGainers: data.topGainers,
      topLosers: data.topLosers,
      stockCount: data.stocks.length,
      lastUpdated: data.lastUpdated
    };
    
    await marketDataCollection.insertOne(snapshot);
    
    // Save individual stock prices for historical tracking
    const stockPricesCollection = db.collection(COLLECTIONS.STOCK_PRICES);
    const stockDocuments = data.stocks.map(stock => ({
      ...stock,
      timestamp: new Date(),
      date: new Date().toISOString().split('T')[0]
    }));
    
    if (stockDocuments.length > 0) {
      await stockPricesCollection.insertMany(stockDocuments);
    }
    
    // Save to training data collection (for ML model retraining)
    const trainingDataCollection = db.collection(COLLECTIONS.TRAINING_DATA);
    const today = new Date().toISOString().split('T')[0];
    
    const trainingDocuments = data.stocks.map(stock => ({
      Date: today,
      Ticker: stock.ticker,
      Name: stock.name,
      'Day Price': stock.price,
      'Previous': stock.price - stock.change,
      'Change': stock.change,
      'Change%': stock.changePercent,
      'Volume': stock.volume,
      timestamp: new Date(),
      source: 'scraper'
    }));
    
    if (trainingDocuments.length > 0) {
      // Use upsert to avoid duplicates for the same date/ticker
      const bulkOps = trainingDocuments.map(doc => ({
        updateOne: {
          filter: { Date: doc.Date, Ticker: doc.Ticker },
          update: { $set: doc },
          upsert: true
        }
      }));
      
      await trainingDataCollection.bulkWrite(bulkOps);
    }
    
    console.log('✅ Market data saved to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB save error:', error);
    throw error;
  }
}

module.exports = {
  fetchNSEData,
  getTopByVolume,
  saveToMongoDB
};
