// Test API endpoint for API-Sports validation
export default async function handler(req, res) {
  try {
    console.log('🧪 Testing API-Sports connection...');
    
    // Test API status first
    const statusResponse = await fetch('https://v3.football.api-sports.io/status', {
      headers: {
        'x-apisports-key': process.env.API_SPORTS_KEY
      }
    });
    
    if (!statusResponse.ok) {
      throw new Error(`Status check failed: ${statusResponse.status}`);
    }
    
    const statusData = await statusResponse.json();
    console.log('✅ API-Sports status:', statusData);
    
    // Test today's fixtures
    const today = new Date().toISOString().split('T')[0];
    const fixturesResponse = await fetch(`https://v3.football.api-sports.io/fixtures?date=${today}`, {
      headers: {
        'x-apisports-key': process.env.API_SPORTS_KEY
      }
    });
    
    if (!fixturesResponse.ok) {
      throw new Error(`Fixtures check failed: ${fixturesResponse.status}`);
    }
    
    const fixturesData = await fixturesResponse.json();
    console.log(`✅ Found ${fixturesData.results} fixtures for today`);
    
    // Test live fixtures
    const liveResponse = await fetch('https://v3.football.api-sports.io/fixtures?live=all', {
      headers: {
        'x-apisports-key': process.env.API_SPORTS_KEY
      }
    });
    
    const liveData = await liveResponse.json();
    console.log(`✅ Found ${liveData.results} live matches`);
    
    return res.status(200).json({
      success: true,
      message: 'API-Sports connection successful!',
      tests: {
        status: {
          success: true,
          account: statusData.response?.account?.firstname || 'Unknown',
          requests: statusData.response?.requests || {}
        },
        todayFixtures: {
          success: true,
          count: fixturesData.results,
          sample: fixturesData.response?.slice(0, 2).map(f => ({
            id: f.fixture.id,
            homeTeam: f.teams.home.name,
            awayTeam: f.teams.away.name,
            status: f.fixture.status.short,
            league: f.league.name
          }))
        },
        liveMatches: {
          success: true,
          count: liveData.results,
          sample: liveData.response?.slice(0, 2).map(f => ({
            id: f.fixture.id,
            homeTeam: f.teams.home.name,
            awayTeam: f.teams.away.name,
            status: f.fixture.status.short,
            score: `${f.goals.home}-${f.goals.away}`
          }))
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ API-Sports test failed:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      details: 'Check your API_SPORTS_KEY in environment variables',
      timestamp: new Date().toISOString()
    });
  }
}