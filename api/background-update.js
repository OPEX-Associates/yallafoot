// Background Cache Updater - Runs automatically
import { updateCache } from '../../lib/cache-manager.js';

export default async function handler(req, res) {
  // Security: Only allow specific triggers
  const { method, headers, query } = req;
  
  // Allow GET for manual triggers and POST for cron jobs
  if (!['GET', 'POST'].includes(method)) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Simple auth for production (optional)
  const authKey = query.key || headers['x-api-key'];
  if (process.env.NODE_ENV === 'production' && authKey !== process.env.CACHE_UPDATE_KEY) {
    console.log('⚠️ Unauthorized cache update attempt');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('🔄 Starting background cache update...');
    
    const result = await updateCache('auto');
    
    if (result.success) {
      console.log(`✅ Cache update completed. Updates: ${result.updatesApplied.join(', ')}`);
      
      return res.status(200).json({
        success: true,
        message: 'Cache updated successfully',
        updates: result.updatesApplied,
        requestsToday: result.requestsToday,
        timestamp: new Date().toISOString()
      });
    } else {
      console.log(`❌ Cache update failed: ${result.error}`);
      
      return res.status(500).json({
        success: false,
        error: result.error,
        requestsToday: result.requestsToday,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('❌ Background update error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Background update failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// Export config for deployment platforms
export const config = {
  // Vercel cron job configuration
  cron: '*/3 14-22 * * *', // Every 3 minutes during 2pm-10pm UTC
};