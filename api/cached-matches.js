// Cache-First API Endpoint for Free Tier
import { getCachedMatches, updateCache } from '../../lib/cache-manager.js';

export default async function handler(req, res) {
  const { method, query } = req;
  
  if (method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type = 'today', force = false } = query;
    
    // Validate type parameter
    if (!['live', 'today', 'tomorrow'].includes(type)) {
      return res.status(400).json({ 
        error: 'Invalid type. Use: live, today, or tomorrow' 
      });
    }

    // Force update if requested (admin use only)
    if (force === 'true') {
      console.log(`🔄 Force updating ${type} cache...`);
      await updateCache(type);
    }

    // Get cached data
    const cachedData = await getCachedMatches(type);
    
    if (!cachedData) {
      return res.status(500).json({ 
        error: 'No cached data available and update failed' 
      });
    }

    // Set cache headers for client-side caching
    const maxAge = type === 'live' ? 60 : 300; // 1min for live, 5min for others
    res.setHeader('Cache-Control', `public, s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 2}`);
    
    // Add CORS headers for frontend
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    
    // Response with cache info for transparency
    return res.status(200).json({
      matches: cachedData.matches || [],
      meta: {
        ...cachedData.meta,
        ...cachedData.cacheInfo,
        endpoint: `/api/cached-matches?type=${type}`,
        freeApiMode: true,
        notice: 'Data refreshed every 3 minutes during match hours'
      }
    });

  } catch (error) {
    console.error('❌ Cached matches API error:', error);
    
    return res.status(500).json({
      error: 'Failed to get cached matches',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}