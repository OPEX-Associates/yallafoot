const API_KEY = process.env.FOOTBALL_DATA_API_KEY;
const API_BASE = 'https://api.football-data.org/v4';

exports.handler = async (event, context) => {
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
    console.log('🧪 Starting API test...');
    console.log('- API Key present:', !!API_KEY);
    console.log('- API Key length:', API_KEY ? API_KEY.length : 0);
    
    if (!API_KEY) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'API key not found',
          details: 'FOOTBALL_DATA_API_KEY environment variable not set'
        })
      };
    }

    // Test basic API call
    console.log('📡 Testing basic API call...');
    const response = await fetch(`${API_BASE}/competitions`, {
      headers: { 
        'X-Auth-Token': API_KEY,
        'User-Agent': 'YallaFoot/1.0'
      }
    });
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: false,
          error: `API request failed: ${response.status}`,
          details: errorText,
          apiKey: API_KEY ? `${API_KEY.substring(0, 10)}...` : 'MISSING'
        })
      };
    }
    
    const data = await response.json();
    console.log('✅ API call successful, competitions count:', data.competitions?.length || 0);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'API test successful!',
        competitionsCount: data.competitions?.length || 0,
        sampleCompetition: data.competitions?.[0]?.name || 'None',
        apiKey: `${API_KEY.substring(0, 10)}...`,
        timestamp: new Date().toISOString()
      })
    };
    
  } catch (error) {
    console.error('💥 Caught error:', error);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack,
        apiKey: API_KEY ? `${API_KEY.substring(0, 10)}...` : 'MISSING'
      })
    };
  }
};