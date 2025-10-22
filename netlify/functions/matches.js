const API_KEY = process.env.FOOTBALL_DATA_API_KEY;
const API_BASE = 'https://api.football-data.org/v4';

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

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (!API_KEY) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'API key not configured',
        fallback: true 
      }),
    };
  }

  try {
    const { type } = event.queryStringParameters || {};
    
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    console.log(`🔄 Fetching ${type || 'today'} matches...`);
    console.log(`📅 Dates: Yesterday(${yesterday}) Today(${today}) Tomorrow(${tomorrow})`);

    switch (type) {
      case 'yesterday':
        console.log(`📡 Fetching yesterday's matches: ${yesterday}`);
        const yesterdayData = await fetchMatchData(`/matches?dateFrom=${yesterday}&dateTo=${yesterday}`);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            matches: yesterdayData.matches || [],
            count: yesterdayData.matches?.length || 0,
            type: 'yesterday',
            date: yesterday
          }),
        };
        
      case 'today':
        console.log(`📡 Fetching today's matches: ${today}`);
        const todayData = await fetchMatchData(`/matches?dateFrom=${today}&dateTo=${today}`);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            matches: todayData.matches || [],
            count: todayData.matches?.length || 0,
            type: 'today',
            date: today
          }),
        };
        
      case 'tomorrow':
        console.log(`📡 Fetching tomorrow's matches: ${tomorrow}`);
        const tomorrowData = await fetchMatchData(`/matches?dateFrom=${tomorrow}&dateTo=${tomorrow}`);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            matches: tomorrowData.matches || [],
            count: tomorrowData.matches?.length || 0,
            type: 'tomorrow',
            date: tomorrow
          }),
        };
        
      case 'major':
        // Get matches from major competitions for the last 3 days
        console.log('🏆 Fetching major competitions...');
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        // Major competitions IDs
        const competitions = ['PL', 'CL', 'SA']; // Reduced to avoid timeouts
        const allMatches = [];
        
        for (const comp of competitions) {
          try {
            console.log(`📡 Fetching ${comp}...`);
            const compData = await fetchMatchData(`/competitions/${comp}/matches?dateFrom=${threeDaysAgo}&dateTo=${tomorrow}`, 8000);
            if (compData.matches) {
              allMatches.push(...compData.matches);
              console.log(`✅ ${comp}: ${compData.matches.length} matches`);
            }
          } catch (error) {
            console.log(`⚠️ Failed to fetch ${comp}: ${error.message}`);
          }
        }
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            matches: allMatches,
            count: allMatches.length,
            type: 'major'
          }),
        };
        
      default:
        // Default to today's matches
        console.log(`📡 Fetching default (today's) matches: ${today}`);
        const defaultData = await fetchMatchData(`/matches?dateFrom=${today}&dateTo=${today}`);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            matches: defaultData.matches || [],
            count: defaultData.matches?.length || 0,
            type: 'today',
            date: today
          }),
        };
    }

  } catch (error) {
    console.error('Function error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to fetch matches',
        details: error.message,
        fallback: true
      }),
    };
  }
};