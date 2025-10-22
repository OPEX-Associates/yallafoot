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
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    console.log(`📅 Fetching matches for: ${yesterday} to ${tomorrow}`);
    
    // Fetch matches for a 3-day window to get more data
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    const response = await fetch(`${API_BASE}/matches?dateFrom=${yesterday}&dateTo=${tomorrow}`, {
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
    const allMatches = data.matches || [];
    
    // Separate matches by day
    const todayMatches = allMatches.filter(match => match.utcDate.split('T')[0] === today);
    const yesterdayMatches = allMatches.filter(match => match.utcDate.split('T')[0] === yesterday);
    const tomorrowMatches = allMatches.filter(match => match.utcDate.split('T')[0] === tomorrow);
    
    console.log(`✅ Fetched ${allMatches.length} total matches`);
    console.log(`📊 Yesterday: ${yesterdayMatches.length}, Today: ${todayMatches.length}, Tomorrow: ${tomorrowMatches.length}`);
    
    // Get a sample match from any day
    const sampleMatch = allMatches[0];
    const sampleMatchInfo = sampleMatch ? 
      `${sampleMatch.homeTeam.name} vs ${sampleMatch.awayTeam.name}` : 
      'No matches found';
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Daily update completed successfully!',
        totalMatches: allMatches.length,
        todayMatches: todayMatches.length,
        yesterdayMatches: yesterdayMatches.length,
        tomorrowMatches: tomorrowMatches.length,
        sampleMatch: sampleMatchInfo,
        lastUpdate: new Date().toISOString(),
        dateRange: `${yesterday} to ${tomorrow}`,
        dates: { yesterday, today, tomorrow }
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