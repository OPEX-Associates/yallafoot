// Free Tier Server-Side Cache Manager
import fs from 'fs/promises';
import path from 'path';

const CACHE_DIR = path.join(process.cwd(), 'cache');
const API_BASE = 'https://v3.football.api-sports.io';

// Ensure cache directory exists
async function ensureCacheDir() {
  try {
    await fs.access(CACHE_DIR);
  } catch {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  }
}

// Cache file paths
const CACHE_FILES = {
  live: path.join(CACHE_DIR, 'live-matches.json'),
  today: path.join(CACHE_DIR, 'today-matches.json'),
  tomorrow: path.join(CACHE_DIR, 'tomorrow-matches.json'),
  metadata: path.join(CACHE_DIR, 'cache-metadata.json')
};

// Read cached data
async function readCache(cacheKey) {
  try {
    const filePath = CACHE_FILES[cacheKey];
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

// Write cached data
async function writeCache(cacheKey, data) {
  await ensureCacheDir();
  const filePath = CACHE_FILES[cacheKey];
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

// Get cache metadata (when was it last updated)
async function getCacheMetadata() {
  const metadata = await readCache('metadata');
  return metadata || {
    lastUpdate: {
      live: null,
      today: null,
      tomorrow: null
    },
    requestCount: {
      today: 0,
      total: 0
    }
  };
}

// Update cache metadata
async function updateCacheMetadata(cacheKey) {
  const metadata = await getCacheMetadata();
  metadata.lastUpdate[cacheKey] = new Date().toISOString();
  metadata.requestCount.today += 1;
  metadata.requestCount.total += 1;
  await writeCache('metadata', metadata);
}

// Check if cache is fresh
function isCacheFresh(lastUpdate, maxAgeMinutes) {
  if (!lastUpdate) return false;
  const now = new Date();
  const updated = new Date(lastUpdate);
  const ageMinutes = (now - updated) / (1000 * 60);
  return ageMinutes < maxAgeMinutes;
}

// Fetch from API-Sports
async function fetchFromAPI(endpoint) {
  console.log(`🔥 Making API call to: ${endpoint}`);
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'x-apisports-key': process.env.API_SPORTS_KEY
    },
    timeout: 15000
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  await updateCacheMetadata('api_call');
  
  return data;
}

// Transform API data to our format
function transformMatchData(apiData) {
  return apiData.response?.map(fixture => ({
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
    isLive: ['1H', '2H', 'HT', 'ET', 'P', 'LIVE'].includes(fixture.fixture.status.short)
  })) || [];
}

// Main cache update function
export async function updateCache(type = 'auto') {
  const metadata = await getCacheMetadata();
  const now = new Date();
  
  try {
    let updatesNeeded = [];
    
    // Determine what needs updating based on cache age
    if (type === 'auto' || type === 'live') {
      // Live matches: update every 3 minutes during match hours
      const isMatchTime = now.getHours() >= 14 && now.getHours() <= 22;
      if (isMatchTime && !isCacheFresh(metadata.lastUpdate.live, 3)) {
        updatesNeeded.push('live');
      }
    }
    
    if (type === 'auto' || type === 'today') {
      // Today's matches: update every 30 minutes
      if (!isCacheFresh(metadata.lastUpdate.today, 30)) {
        updatesNeeded.push('today');
      }
    }
    
    if (type === 'auto' || type === 'tomorrow') {
      // Tomorrow's matches: update every 2 hours
      if (!isCacheFresh(metadata.lastUpdate.tomorrow, 120)) {
        updatesNeeded.push('tomorrow');
      }
    }

    // Make API calls only for needed updates
    for (const updateType of updatesNeeded) {
      let endpoint, cacheKey;
      
      switch (updateType) {
        case 'live':
          endpoint = '/fixtures?live=all';
          cacheKey = 'live';
          break;
        case 'today':
          const today = now.toISOString().split('T')[0];
          endpoint = `/fixtures?date=${today}`;
          cacheKey = 'today';
          break;
        case 'tomorrow':
          const tomorrow = new Date(now);
          tomorrow.setDate(tomorrow.getDate() + 1);
          const tomorrowStr = tomorrow.toISOString().split('T')[0];
          endpoint = `/fixtures?date=${tomorrowStr}`;
          cacheKey = 'tomorrow';
          break;
      }

      // Fetch and cache data
      const apiData = await fetchFromAPI(endpoint);
      const transformedData = transformMatchData(apiData);
      
      const cacheData = {
        matches: transformedData,
        meta: {
          total: transformedData.length,
          live: transformedData.filter(m => m.isLive).length,
          lastUpdate: new Date().toISOString(),
          source: 'api-sports-free',
          cacheType: updateType
        }
      };

      await writeCache(cacheKey, cacheData);
      await updateCacheMetadata(cacheKey);
      
      console.log(`✅ Updated ${updateType} cache: ${transformedData.length} matches`);
    }

    return {
      success: true,
      updatesApplied: updatesNeeded,
      requestsToday: metadata.requestCount.today
    };

  } catch (error) {
    console.error('❌ Cache update failed:', error);
    return {
      success: false,
      error: error.message,
      requestsToday: metadata.requestCount.today
    };
  }
}

// Get cached data for frontend
export async function getCachedMatches(type) {
  const cachedData = await readCache(type);
  
  if (!cachedData) {
    // No cache exists, trigger immediate update
    await updateCache(type);
    return await readCache(type);
  }

  // Return cached data with freshness info
  const metadata = await getCacheMetadata();
  const lastUpdate = metadata.lastUpdate[type];
  const ageMinutes = lastUpdate ? 
    (new Date() - new Date(lastUpdate)) / (1000 * 60) : null;

  return {
    ...cachedData,
    cacheInfo: {
      lastUpdate,
      ageMinutes: Math.round(ageMinutes),
      requestsToday: metadata.requestCount.today
    }
  };
}