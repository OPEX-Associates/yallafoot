const API_KEY = process.env.FOOTBALL_DATA_API_KEY;
const API_BASE = 'https://api.football-data.org/v4';

exports.handler = async (event, context) => {
  // Set a shorter timeout for the function
  context.callbackWaitsForEmptyEventLoop = false;
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    console.log('🚀 Starting simple daily update...');
    
    if (!API_KEY) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'API key not configured'
        })
      };
    }

    const today = new Date().toISOString().split('T')[0];
    console.log(`📅 Fetching matches for: ${today}`);
    
    // Single API call with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    const response = await fetch(`${API_BASE}/matches?dateFrom=${today}&dateTo=${today}`, {
      headers: { 
        'X-Auth-Token': API_KEY,
        'User-Agent': 'YallaFoot/1.0'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: false,
          error: `API request failed: ${response.status}`,
          details: errorText
        })
      };
    }
    
    const data = await response.json();
    console.log(`✅ Fetched ${data.matches?.length || 0} matches for today`);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Daily update completed successfully!',
        todayMatches: data.matches?.length || 0,
        sampleMatch: data.matches?.[0]?.homeTeam?.name || 'No matches',
        lastUpdate: new Date().toISOString(),
        date: today
      })
    };
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        type: error.name
      })
    };
  }
};