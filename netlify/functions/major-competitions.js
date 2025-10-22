const API_KEY = process.env.FOOTBALL_DATA_API_KEY;
const API_BASE = 'https://api.football-data.org/v4';

exports.handler = async (event, context) => {
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
    console.log('🏆 Fetching major competitions data...');
    
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
    
    // Major competitions to check
    const competitions = [
      { code: 'PL', name: 'Premier League' },
      { code: 'CL', name: 'Champions League' },
      { code: 'SA', name: 'Serie A' },
      { code: 'PD', name: 'La Liga' },
      { code: 'BL1', name: 'Bundesliga' }
    ];
    
    const results = [];
    let totalMatches = 0;
    
    for (const comp of competitions) {
      try {
        console.log(`📡 Fetching ${comp.name}...`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        const response = await fetch(`${API_BASE}/competitions/${comp.code}/matches?dateFrom=${yesterday}&dateTo=${tomorrow}`, {
          headers: { 
            'X-Auth-Token': API_KEY,
            'User-Agent': 'YallaFoot/1.0'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          const matchCount = data.matches?.length || 0;
          totalMatches += matchCount;
          
          results.push({
            competition: comp.name,
            code: comp.code,
            matches: matchCount,
            sampleMatch: data.matches?.[0] ? 
              `${data.matches[0].homeTeam.name} vs ${data.matches[0].awayTeam.name}` : 
              'No matches'
          });
          
          console.log(`✅ ${comp.name}: ${matchCount} matches`);
        } else {
          console.log(`⚠️ ${comp.name}: HTTP ${response.status}`);
          results.push({
            competition: comp.name,
            code: comp.code,
            matches: 0,
            error: `HTTP ${response.status}`
          });
        }
      } catch (error) {
        console.log(`❌ ${comp.name}: ${error.message}`);
        results.push({
          competition: comp.name,
          code: comp.code,
          matches: 0,
          error: error.message
        });
      }
    }
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Major competitions data fetched!',
        totalMatches,
        dateRange: `${yesterday} to ${tomorrow}`,
        competitions: results,
        lastUpdate: new Date().toISOString()
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