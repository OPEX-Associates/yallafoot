// Real-time API-Sports implementation
const API_SPORTS_BASE = 'https://v3.football.api-sports.io';

export default async function handler(req, res) {
  const { method } = req;
  
  if (method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type = 'live' } = req.query;
    
    // Set cache headers based on match status
    const setCacheHeaders = (maxAge) => {
      res.setHeader('Cache-Control', `public, s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 2}`);
    };

    let endpoint;
    let cacheTime;

    switch (type) {
      case 'live':
        // Live matches - cache for 30 seconds
        endpoint = '/fixtures?live=all';
        cacheTime = 30;
        break;
      case 'today':
        // Today's matches - cache for 5 minutes
        const today = new Date().toISOString().split('T')[0];
        endpoint = `/fixtures?date=${today}`;
        cacheTime = 300;
        break;
      case 'tomorrow':
        // Tomorrow's matches - cache for 15 minutes
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        endpoint = `/fixtures?date=${tomorrowStr}`;
        cacheTime = 900;
        break;
      case 'finished':
        // Finished matches - cache for 1 hour
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        endpoint = `/fixtures?date=${yesterdayStr}&status=FT`;
        cacheTime = 3600;
        break;
      default:
        return res.status(400).json({ error: 'Invalid type parameter' });
    }

    setCacheHeaders(cacheTime);

    const response = await fetch(`${API_SPORTS_BASE}${endpoint}`, {
      method: 'GET',
      headers: {
        'x-apisports-key': process.env.API_SPORTS_KEY
      },
      timeout: 10000
    });

    if (!response.ok) {
      throw new Error(`API Sports error: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform API-Football data to our format
    const matches = data.response?.map(fixture => ({
      id: fixture.fixture.id,
      homeTeam: {
        name: fixture.teams.home.name,
        logo: fixture.teams.home.logo
      },
      awayTeam: {
        name: fixture.teams.away.name,
        logo: fixture.teams.away.logo
      },
      score: {
        home: fixture.goals.home,
        away: fixture.goals.away
      },
      status: fixture.fixture.status.short,
      statusText: fixture.fixture.status.long,
      date: fixture.fixture.date,
      venue: fixture.fixture.venue?.name,
      league: {
        name: fixture.league.name,
        country: fixture.league.country,
        logo: fixture.league.logo
      },
      elapsed: fixture.fixture.status.elapsed,
      // Real-time indicators
      isLive: ['1H', '2H', 'HT', 'ET', 'P'].includes(fixture.fixture.status.short),
      lastUpdate: new Date().toISOString()
    })) || [];

    // Add request count info for monitoring
    const requestInfo = {
      endpoint,
      timestamp: new Date().toISOString(),
      matchCount: matches.length,
      liveMatches: matches.filter(m => m.isLive).length
    };

    return res.status(200).json({
      matches,
      meta: {
        total: matches.length,
        live: matches.filter(m => m.isLive).length,
        cacheTime,
        ...requestInfo
      }
    });

  } catch (error) {
    console.error('API Football error:', error);
    
    return res.status(500).json({
      error: 'Failed to fetch matches',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}