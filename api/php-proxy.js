// Netlify function to proxy requests to PHP API and handle CORS
export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type = 'today' } = req.query;
    
    // Validate type parameter
    if (!['live', 'today', 'tomorrow', 'yesterday'].includes(type)) {
      return res.status(400).json({ 
        error: 'Invalid type. Use: live, today, tomorrow, or yesterday' 
      });
    }

    // Make request to PHP API
    const PHP_API_BASE = process.env.NEXT_PUBLIC_PHP_API_BASE || 'https://football.opex.associates/api';
    const PHP_API_KEY = process.env.NEXT_PUBLIC_PHP_API_KEY || 'yf_prod_b5f603e5da167f0e69f3902b644f66171c3197f34426fe9b3217c11375f354ca';
    
    const params = new URLSearchParams();
    params.append('endpoint', 'matches');
    params.append('type', type);
    
    const response = await fetch(`${PHP_API_BASE}/index.php?${params.toString()}`, {
      headers: {
        'X-API-Key': PHP_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`PHP API error: ${response.status}`);
    }

    // Clean PHP response
    const responseText = await response.text();
    const cleanJsonText = responseText
      .replace(/<br\s*\/?>/gi, '')
      .replace(/<b>.*?<\/b>/gi, '')
      .replace(/Warning:.*?on line.*?\n/gi, '')
      .replace(/Notice:.*?on line.*?\n/gi, '')
      .trim();
    
    const jsonStart = cleanJsonText.indexOf('{');
    const actualJson = jsonStart >= 0 ? cleanJsonText.substring(jsonStart) : cleanJsonText;
    
    const result = JSON.parse(actualJson);

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Set caching headers
    const maxAge = type === 'live' ? 60 : 300; // 1min for live, 5min for others
    res.setHeader('Cache-Control', `public, s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 2}`);
    
    return res.status(200).json(result);

  } catch (error) {
    console.error('❌ Proxy API error:', error);
    
    // Set CORS headers even for errors
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    return res.status(500).json({
      error: 'Failed to fetch matches',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}