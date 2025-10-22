const API_KEY = process.env.FOOTBALL_DATA_API_KEY;
const API_BASE = 'https://api.football-data.org/v4';

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
    console.log('� MANUAL TRIGGER: Force updating cache...');
  } else {
    console.log('�🚀 Fetching fresh match data...');
  }
  
  if (!API_KEY) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Missing API key',
        fallback: true
      })
    };
  }
  
  try {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    console.log(`📅 Fetching matches for: ${yesterday} | ${today} | ${tomorrow}`);
    
    // Fetch all match data
    const [yesterdayData, todayData, tomorrowData] = await Promise.all([
      fetchMatchData(`/matches?dateFrom=${yesterday}&dateTo=${yesterday}`),
      fetchMatchData(`/matches?dateFrom=${today}&dateTo=${today}`),
      fetchMatchData(`/matches?dateFrom=${tomorrow}&dateTo=${tomorrow}`)
    ]);
    
    // Major competitions data
    const competitions = ['PL', 'CL', 'EL', 'SA', 'PD', 'BL1', 'FL1'];
    const majorMatches = [];
    
    for (const comp of competitions) {
      try {
        const compData = await fetchMatchData(`/competitions/${comp}/matches?dateFrom=${yesterday}&dateTo=${tomorrow}`);
        if (compData.matches) {
          majorMatches.push(...compData.matches);
        }
      } catch (error) {
        console.log(`⚠️ Failed to fetch ${comp}:`, error.message);
      }
    }
    
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