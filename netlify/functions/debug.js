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
    // Get all environment variables (for debugging)
    const envInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      timestamp: new Date().toISOString(),
      hasFootballDataKey: !!process.env.FOOTBALL_DATA_API_KEY,
      hasPublicFootballDataKey: !!process.env.NEXT_PUBLIC_FOOTBALL_DATA_API_KEY,
      footballDataKeyLength: process.env.FOOTBALL_DATA_API_KEY ? process.env.FOOTBALL_DATA_API_KEY.length : 0,
      footballDataKeyPreview: process.env.FOOTBALL_DATA_API_KEY ? 
        process.env.FOOTBALL_DATA_API_KEY.substring(0, 10) + '...' : 'NOT_SET',
      allEnvKeys: Object.keys(process.env).filter(key => 
        key.includes('FOOTBALL') || key.includes('API') || key.includes('KEY')
      )
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Debug endpoint working!',
        environment: envInfo,
        event: {
          httpMethod: event.httpMethod,
          queryStringParameters: event.queryStringParameters,
          headers: event.headers
        }
      }, null, 2)
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack
      }, null, 2)
    };
  }
};