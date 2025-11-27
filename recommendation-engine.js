const { spawn } = require('child_process');
const path = require('path');

// In-memory cache for recommendations
const cache = new Map();
const CACHE_TTL = 3600000; // 1 hour in milliseconds

/**
 * Generate recommendations by calling Python ML model
 * @param {number} riskScore - User's risk score (0-100)
 * @param {string} horizon - Investment horizon: 'short', 'medium', 'long'
 * @param {number} topCount - Number of recommendations to return
 * @returns {Promise<Array>} Array of recommendation objects
 */
function generateRecommendations(riskScore = 50, horizon = 'medium', topCount = 5) {
  return new Promise((resolve, reject) => {
    const cacheKey = `${riskScore}-${horizon}-${topCount}`;
    const cached = cache.get(cacheKey);

    // Return cached result if still valid
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('✅ Returning cached recommendations');
      return resolve(cached.data);
    }

    // Call Python model
    const pythonPath = path.join(__dirname, 'ml', 'venv', 'bin', 'python');
    const scriptPath = path.join(__dirname, 'ml', 'recommender', 'predict.py');
    const modelPath = path.join(__dirname, 'ml', 'ml_model.joblib');
    const csv2023 = '/home/ekm/Desktop/GitHub/NSE_data_all_stocks_2023.csv';
    const csv2024 = '/home/ekm/Desktop/GitHub/NSE_data_all_stocks_2024.csv';

    const pythonEnv = Object.assign({}, process.env, {
      PYTHONPATH: path.join(__dirname, 'ml')
    });

    const pythonProcess = spawn(pythonPath, [
      scriptPath,
      '--model', modelPath,
      '--csv', csv2023, csv2024,
      '--risk', riskScore.toString(),
      '--horizon', horizon,
      '--top', topCount.toString()
    ], { env: pythonEnv });

    let pythonOutput = '';
    let pythonError = '';

    pythonProcess.stdout.on('data', (data) => {
      pythonOutput += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      pythonError += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('❌ Python process error:', pythonError);
        return reject(new Error(`Python process failed: ${pythonError}`));
      }

      try {
        const recommendations = JSON.parse(pythonOutput);
        
        // Cache the result
        cache.set(cacheKey, {
          data: recommendations,
          timestamp: Date.now()
        });

        console.log(`✅ Generated ${recommendations.length} recommendations`);
        resolve(recommendations);
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        console.error('Python output:', pythonOutput);
        reject(new Error(`Failed to parse recommendations: ${parseError.message}`));
      }
    });

    pythonProcess.on('error', (err) => {
      console.error('❌ Failed to spawn Python process:', err);
      reject(new Error(`Failed to spawn Python process: ${err.message}`));
    });
  });
}

/**
 * Clear recommendation cache (useful for manual refresh or after model retraining)
 */
function clearCache() {
  cache.clear();
  console.log('✅ Recommendation cache cleared');
}

/**
 * Get cache statistics
 */
function getCacheStats() {
  const entries = Array.from(cache.entries()).map(([key, value]) => ({
    key,
    age: Date.now() - value.timestamp,
    expired: Date.now() - value.timestamp >= CACHE_TTL
  }));

  return {
    size: cache.size,
    entries,
    ttl: CACHE_TTL
  };
}

module.exports = {
  generateRecommendations,
  clearCache,
  getCacheStats
};
