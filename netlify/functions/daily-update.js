const API_KEY = process.env.FOOTBALL_DATA_API_KEY;
const API_BASE = 'https://api.football-data.org/v4';

// Import fetch for Node.js environment
const fetch = require('node-fetch');

// Cache object to store data in memory
let dataCache = {
  lastUpdate: null,
  yesterday: { matches: [], count: 0 },
  today: { matches: [], count: 0 },
  tomorrow: { matches: [], count: 0 },
  major: { matches: [], count: 0 }
};

async function fetchMatchData(endpoint) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'X-Auth-Token': API_KEY }
  });
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  
  return response.json();
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
      headers: { 'X-Auth-Token': API_KEY }
    });
    
    if (!testResponse.ok) {
      throw new Error(`API test failed: ${testResponse.status} ${testResponse.statusText}`);
    }
    
    console.log('✅ API connectivity test passed');
    
    // Fetch all match data with individual error handling
    console.log('📡 Fetching yesterday matches...');
    const yesterdayData = await fetchMatchData(`/matches?dateFrom=${yesterday}&dateTo=${yesterday}`);
    console.log(`✅ Yesterday: ${yesterdayData.matches?.length || 0} matches`);
    
    console.log('📡 Fetching today matches...');
    const todayData = await fetchMatchData(`/matches?dateFrom=${today}&dateTo=${today}`);
    console.log(`✅ Today: ${todayData.matches?.length || 0} matches`);
    
    console.log('📡 Fetching tomorrow matches...');
    const tomorrowData = await fetchMatchData(`/matches?dateFrom=${tomorrow}&dateTo=${tomorrow}`);
    console.log(`✅ Tomorrow: ${tomorrowData.matches?.length || 0} matches`);
    
    // Major competitions data with individual handling
    console.log('🏆 Fetching major competitions...');
    const competitions = ['PL', 'CL', 'EL', 'SA', 'PD', 'BL1', 'FL1'];
    const majorMatches = [];
    
    for (const comp of competitions) {
      try {
        console.log(`📡 Fetching ${comp}...`);
        const compData = await fetchMatchData(`/competitions/${comp}/matches?dateFrom=${yesterday}&dateTo=${tomorrow}`);
        if (compData.matches) {
          majorMatches.push(...compData.matches);
          console.log(`✅ ${comp}: ${compData.matches.length} matches`);
        }
      } catch (error) {
        console.log(`⚠️ Failed to fetch ${comp}: ${error.message}`);
      }
    }
    
    console.log(`🏆 Total major matches: ${majorMatches.length}`);
    
    // Update cache
    dataCache = {
      lastUpdate: new Date().toISOString(),
      yesterday: {
        matches: yesterdayData.matches || [],
        count: yesterdayData.matches?.length || 0,
        date: yesterday
      },
      today: {
        matches: todayData.matches || [],
        count: todayData.matches?.length || 0,
        date: today
      },
      tomorrow: {
        matches: tomorrowData.matches || [],
        count: tomorrowData.matches?.length || 0,
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
    console.log(`  Yesterday: ${dataCache.yesterday.count} matches`);
    console.log(`  Today: ${dataCache.today.count} matches`);
    console.log(`  Tomorrow: ${dataCache.tomorrow.count} matches`);
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