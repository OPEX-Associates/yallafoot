const API_KEY = process.env.FOOTBALL_DATA_API_KEY;
const API_BASE = 'https://api.football-data.org/v4';

// Import fetch for Node.js environment
// Using built-in fetch API (Node.js 18+)

// Cache object to store data in memory
let dataCache = {
  lastUpdate: null,
  yesterday: { matches: [], count: 0 },
  today: { matches: [], count: 0 },
  tomorrow: { matches: [], count: 0 },
  major: { matches: [], count: 0 }
};

async function fetchMatchData(endpoint, timeout = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: { 
        'X-Auth-Token': API_KEY,
        'User-Agent': 'YallaFoot/1.0'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }
    
    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

function shouldUpdateCache() {
  if (!dataCache.lastUpdate) return true;
  
  const now = new Date();
  const lastUpdate = new Date(dataCache.lastUpdate);
  const hoursSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60);
  
  // Update if more than 6 hours old
  return hoursSinceUpdate > 6;
}

function shouldForceUpdate(event) {
  // Check for manual trigger parameters
  const queryParams = event.queryStringParameters || {};
  return queryParams.force === 'true' || queryParams.refresh === 'true' || queryParams.admin === 'true';
}

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=21600' // Cache for 6 hours
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Check if we need to update cache
  const forceUpdate = shouldForceUpdate(event);
  
  if (!shouldUpdateCache() && !forceUpdate) {
    console.log('📦 Serving cached data');
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        cached: true,
        lastUpdate: dataCache.lastUpdate,
        data: dataCache
      })
    };
  }

  if (forceUpdate) {
    console.log('🔧 MANUAL TRIGGER: Force updating cache...');
  } else {
    console.log(' Fetching fresh match data...');
  }

  // Debug: Log environment and request info
  console.log('🔍 Debug Info:');
  console.log('- API Key present:', !!API_KEY);
  console.log('- API Key length:', API_KEY ? API_KEY.length : 0);
  console.log('- API Key preview:', API_KEY ? API_KEY.substring(0, 10) + '...' : 'MISSING');
  console.log('- Event method:', event.httpMethod);
  console.log('- Query params:', event.queryStringParameters);
  
  if (!API_KEY) {
    console.error('❌ CRITICAL: API_KEY environment variable not set');
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'API key not configured',
        debug: {
          envVarName: 'FOOTBALL_DATA_API_KEY',
          present: false,
          message: 'Set this environment variable in Netlify dashboard: Site Settings > Environment Variables'
        },
        fallback: true
      })
    };
  }
  
  
  try {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    console.log(`📅 Fetching matches for: ${yesterday} | ${today} | ${tomorrow}`);
    
    // Test a simple API call first
    console.log('🧪 Testing basic API connectivity...');
    const testResponse = await fetch(`${API_BASE}/competitions`, {
      headers: { 
        'X-Auth-Token': API_KEY,
        'User-Agent': 'YallaFoot/1.0'
      }
    });
    
    if (!testResponse.ok) {
      const errorText = await testResponse.text();
      throw new Error(`API test failed: ${testResponse.status} - ${errorText}`);
    }
    
    console.log('✅ API connectivity test passed');
    
    // Fetch today's matches only (simplified approach)
    console.log('📡 Fetching today matches...');
    const todayData = await fetchMatchData(`/matches?dateFrom=${today}&dateTo=${today}`);
    console.log(`✅ Today: ${todayData.matches?.length || 0} matches`);
    
    // Fetch major competitions data (limit to 3 most important)
    console.log('🏆 Fetching major competitions...');
    const competitions = ['PL', 'CL', 'SA']; // Limited to prevent timeout
    const majorMatches = [];
    
    for (const comp of competitions) {
      try {
        console.log(`📡 Fetching ${comp}...`);
        const compData = await fetchMatchData(`/competitions/${comp}/matches?dateFrom=${yesterday}&dateTo=${tomorrow}`, 8000);
        if (compData.matches) {
          majorMatches.push(...compData.matches);
          console.log(`✅ ${comp}: ${compData.matches.length} matches`);
        }
      } catch (error) {
        console.log(`⚠️ Failed to fetch ${comp}: ${error.message}`);
      }
    }
    
    console.log(`🏆 Total major matches: ${majorMatches.length}`);
    
    // Update cache with simplified data
    dataCache = {
      lastUpdate: new Date().toISOString(),
      yesterday: {
        matches: [],
        count: 0,
        date: yesterday
      },
      today: {
        matches: todayData.matches || [],
        count: todayData.matches?.length || 0,
        date: today
      },
      tomorrow: {
        matches: [],
        count: 0,
        date: tomorrow
      },
      major: {
        matches: majorMatches,
        count: majorMatches.length,
        dateRange: `${yesterday} to ${tomorrow}`
      }
    };
    
    console.log(`✅ Cache updated successfully`);
    console.log(`📊 Data summary:`);
    console.log(`  Today: ${dataCache.today.count} matches`);
    console.log(`  Major competitions: ${dataCache.major.count} matches`);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        cached: false,
        lastUpdate: dataCache.lastUpdate,
        data: dataCache
      })
    };
    
  } catch (error) {
    console.error('❌ Error fetching data:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to fetch match data',
        details: error.message,
        fallback: true
      })
    };
  }
};