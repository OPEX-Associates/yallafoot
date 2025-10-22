const fetch = require('node-fetch');

const API_KEY = process.env.FOOTBALL_DATA_API_KEY;
const API_BASE = 'https://api.football-data.org/v4';

// GitHub API to update files in the repository
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO; // format: "username/repo-name"
const GITHUB_API = 'https://api.github.com';

async function fetchMatchData(endpoint) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'X-Auth-Token': API_KEY }
  });
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  
  return response.json();
}

async function updateGitHubFile(path, content, message) {
  // Get current file (to get SHA for update)
  const getUrl = `${GITHUB_API}/repos/${GITHUB_REPO}/contents/${path}`;
  
  try {
    const existingResponse = await fetch(getUrl, {
      headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
    });
    
    const existingData = existingResponse.ok ? await existingResponse.json() : null;
    
    // Update or create file
    const updateUrl = `${GITHUB_API}/repos/${GITHUB_REPO}/contents/${path}`;
    const updateData = {
      message,
      content: Buffer.from(JSON.stringify(content, null, 2)).toString('base64'),
      ...(existingData?.sha && { sha: existingData.sha })
    };
    
    const updateResponse = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });
    
    return updateResponse.ok;
  } catch (error) {
    console.error(`Failed to update ${path}:`, error);
    return false;
  }
}

exports.handler = async (event, context) => {
  console.log('🚀 Starting daily match data update...');
  
  if (!API_KEY || !GITHUB_TOKEN || !GITHUB_REPO) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Missing required environment variables',
        required: ['FOOTBALL_DATA_API_KEY', 'GITHUB_TOKEN', 'GITHUB_REPO']
      })
    };
  }
  
  try {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    console.log(`📅 Fetching matches for: ${yesterday} | ${today} | ${tomorrow}`);
    
    // Fetch all match data
    const [yesterdayData, todayData, tomorrowData] = await Promise.all([
      fetchMatchData(`/matches?dateFrom=${yesterday}&dateTo=${yesterday}`),
      fetchMatchData(`/matches?dateFrom=${today}&dateTo=${today}`),
      fetchMatchData(`/matches?dateFrom=${tomorrow}&dateTo=${tomorrow}`)
    ]);
    
    // Major competitions data
    const competitions = ['PL', 'CL', 'EL', 'SA', 'PD', 'BL1', 'FL1'];
    const majorMatches = [];
    
    for (const comp of competitions) {
      try {
        const compData = await fetchMatchData(`/competitions/${comp}/matches?dateFrom=${yesterday}&dateTo=${tomorrow}`);
        if (compData.matches) {
          majorMatches.push(...compData.matches);
        }
      } catch (error) {
        console.log(`⚠️ Failed to fetch ${comp}:`, error.message);
      }
    }
    
    // Prepare data files
    const dataFiles = {
      'data/matches-yesterday.json': {
        matches: yesterdayData.matches || [],
        count: yesterdayData.matches?.length || 0,
        date: yesterday,
        lastUpdated: new Date().toISOString()
      },
      'data/matches-today.json': {
        matches: todayData.matches || [],
        count: todayData.matches?.length || 0,
        date: today,
        lastUpdated: new Date().toISOString()
      },
      'data/matches-tomorrow.json': {
        matches: tomorrowData.matches || [],
        count: tomorrowData.matches?.length || 0,
        date: tomorrow,
        lastUpdated: new Date().toISOString()
      },
      'data/matches-major.json': {
        matches: majorMatches,
        count: majorMatches.length,
        dateRange: `${yesterday} to ${tomorrow}`,
        lastUpdated: new Date().toISOString()
      }
    };
    
    // Update all data files
    const results = await Promise.all(
      Object.entries(dataFiles).map(([path, content]) =>
        updateGitHubFile(path, content, `Auto-update match data: ${today}`)
      )
    );
    
    const successful = results.filter(Boolean).length;
    
    console.log(`✅ Updated ${successful}/${results.length} data files`);
    console.log(`📊 Data summary:`);
    console.log(`  Yesterday: ${yesterdayData.matches?.length || 0} matches`);
    console.log(`  Today: ${todayData.matches?.length || 0} matches`);
    console.log(`  Tomorrow: ${tomorrowData.matches?.length || 0} matches`);
    console.log(`  Major competitions: ${majorMatches.length} matches`);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        updated: successful,
        total: results.length,
        summary: {
          yesterday: yesterdayData.matches?.length || 0,
          today: todayData.matches?.length || 0,
          tomorrow: tomorrowData.matches?.length || 0,
          major: majorMatches.length
        }
      })
    };
    
  } catch (error) {
    console.error('❌ Error in daily update:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Daily update failed',
        details: error.message
      })
    };
  }
};