const API_KEY = process.env.FOOTBALL_DATA_API_KEY;
const API_BASE = 'https://api.football-data.org/v4';

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
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
    
    let url;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    switch (type) {
      case 'yesterday':
        url = `${API_BASE}/matches?dateFrom=${yesterday}&dateTo=${yesterday}`;
        break;
      case 'today':
        url = `${API_BASE}/matches?dateFrom=${today}&dateTo=${today}`;
        break;
      case 'tomorrow':
        url = `${API_BASE}/matches?dateFrom=${tomorrow}&dateTo=${tomorrow}`;
        break;
      case 'major':
        // Get matches from major competitions for the last 3 days
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        // Major competitions IDs
        const competitions = ['PL', 'CL', 'EL', 'SA', 'PD', 'BL1', 'FL1'];
        const allMatches = [];
        
        for (const comp of competitions) {
          try {
            const compUrl = `${API_BASE}/competitions/${comp}/matches?dateFrom=${threeDaysAgo}&dateTo=${tomorrow}`;
            const compResponse = await fetch(compUrl, {
              headers: { 'X-Auth-Token': API_KEY }
            });
            
            if (compResponse.ok) {
              const compData = await compResponse.json();
              if (compData.matches) {
                allMatches.push(...compData.matches);
              }
            }
          } catch (error) {
            console.log(`Failed to fetch ${comp}:`, error.message);
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
        url = `${API_BASE}/matches?dateFrom=${today}&dateTo=${today}`;
    }

    const response = await fetch(url, {
      headers: {
        'X-Auth-Token': API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        matches: data.matches || [],
        count: data.matches?.length || 0,
        type: type || 'today',
        date: type === 'yesterday' ? yesterday : type === 'tomorrow' ? tomorrow : today
      }),
    };

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