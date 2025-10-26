"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

interface Match {
  id: string;
  homeTeam: { name: string; logo: string };
  awayTeam: { name: string; logo: string };
  score: { home: number | null; away: number | null };
  status: string;
  statusText: string;
  date: string;
  venue?: string;
  league: { name: string; country: string; logo: string };
  elapsed?: number;
  isLive: boolean;
}

interface CacheInfo {
  lastUpdate: string;
  ageMinutes: number;
  requestsToday: number;
  freeApiMode: boolean;
}

interface CachedMatchesData {
  matches: Match[];
  meta: {
    total: number;
    live: number;
    lastUpdate: string;
    notice: string;
  } & CacheInfo;
}

interface UseCachedMatchesOptions {
  type?: 'live' | 'today' | 'tomorrow';
  autoRefresh?: boolean;
  refreshInterval?: number; // in seconds, will be overridden by smart logic
  popularOnly?: boolean; // Filter for popular leagues only
  tier?: 1 | 2; // League tier (1 = top leagues, 2 = all popular leagues)
}

export function useCachedMatches(options: UseCachedMatchesOptions = {}) {
  const {
    type = 'today',
    autoRefresh = true,
    refreshInterval = 60, // Default 1 minute for cached data
    popularOnly = false,
    tier
  } = options;

  const [data, setData] = useState<CachedMatchesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(true);

  const fetchCachedMatches = useCallback(async () => {
    if (!isActiveRef.current) return;

    try {
      setError(null);
      
      // Direct API call to PHP API with proper CORS handling
      const PHP_API_BASE = process.env.NEXT_PUBLIC_PHP_API_BASE || 'https://football.opex.associates/api';
      const PHP_API_KEY = process.env.NEXT_PUBLIC_PHP_API_KEY || 'yf_prod_b5f603e5da167f0e69f3902b644f66171c3197f34426fe9b3217c11375f354ca';
      
      const params = new URLSearchParams();
      params.append('endpoint', 'matches');
      params.append('type', type);
      
      // Add popular leagues filter if requested
      if (popularOnly) {
        params.append('popular', 'true');
        if (tier) {
          params.append('tier', tier.toString());
        }
      }
      
      const response = await fetch(`${PHP_API_BASE}/index.php?${params.toString()}`, {
        method: 'GET',
        headers: {
          'X-API-Key': PHP_API_KEY
          // Removed Content-Type and Cache-Control headers that were causing CORS issues
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Clean response to handle PHP errors/warnings
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
      
      if (isActiveRef.current && result.success) {
        // Transform PHP API response to match expected format
        const transformedData = {
          matches: result.data.map((match: any) => ({
            id: match.id.toString(),
            homeTeam: {
              name: match.homeTeam?.name || 'Home Team',
              logo: match.homeTeam?.logo || ''
            },
            awayTeam: {
              name: match.awayTeam?.name || 'Away Team', 
              logo: match.awayTeam?.logo || ''
            },
            score: {
              home: match.score?.home ?? null,
              away: match.score?.away ?? null
            },
            status: match.status || 'NS',
            statusText: match.statusText || 'Not Started',
            date: match.date || new Date().toISOString(),
            venue: match.venue || 'TBD',
            league: {
              name: match.league?.name || 'Unknown League',
              country: match.league?.country || 'Unknown',
              logo: match.league?.logo || ''
            },
            elapsed: match.elapsed || null,
            isLive: match.isLive || false
          })),
          meta: {
            total: result.meta?.total || 0,
            live: result.meta?.live || 0,
            lastUpdate: new Date().toISOString(),
            notice: 'Data from YallaFoot PHP API (direct)',
            ageMinutes: Math.floor((result.meta?.cache_info?.age_minutes || 0)),
            requestsToday: result.meta?.api_usage?.requests_today || 0,
            freeApiMode: true
          }
        };
        
        setData(transformedData);
        setLastFetch(new Date());
        setLoading(false);
        
        // Log for debugging
        console.log(`📦 PHP API (direct): ${transformedData.meta.total} matches, ${transformedData.meta.live} live`);
      }
    } catch (err) {
      if (isActiveRef.current) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    }
  }, [type]);

  // Smart refresh interval for cached data
  const getSmartRefreshInterval = useCallback(() => {
    if (!data) return refreshInterval;
    
    const cacheAge = data.meta.ageMinutes || 0;
    const hasLiveMatches = (data.meta.live || 0) > 0;
    
    if (hasLiveMatches && cacheAge < 5) {
      return 30; // 30 seconds if cache is fresh and has live matches
    } else if (type === 'live') {
      return 60; // 1 minute for live matches
    } else if (type === 'today') {
      return 120; // 2 minutes for today's matches
    } else {
      return 300; // 5 minutes for tomorrow's matches
    }
  }, [data, refreshInterval, type]);

  // Initial fetch
  useEffect(() => {
    isActiveRef.current = true;
    fetchCachedMatches();
  }, [fetchCachedMatches]);

  // Auto-refresh logic for cached data
  useEffect(() => {
    if (!autoRefresh || !isActiveRef.current) return;

    const interval = getSmartRefreshInterval();
    
    intervalRef.current = setInterval(() => {
      fetchCachedMatches();
    }, interval * 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, fetchCachedMatches, getSmartRefreshInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isActiveRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const refresh = useCallback(() => {
    setLoading(true);
    fetchCachedMatches();
  }, [fetchCachedMatches]);

  const forceUpdate = useCallback(async () => {
    setLoading(true);
    try {
      // Force refresh by calling the API directly
      fetchCachedMatches();
    } catch (err) {
      setError('Failed to force update');
    }
  }, [fetchCachedMatches]);

  return {
    // Data
    matches: data?.matches || [],
    meta: data?.meta,
    
    // State
    loading,
    error,
    lastFetch,
    
    // Actions
    refresh,
    forceUpdate, // Admin function to force server cache update
    
    // Cache info
    cacheAge: data?.meta.ageMinutes,
    requestsToday: data?.meta.requestsToday,
    isCacheMode: data?.meta.freeApiMode || false,
    nextRefreshIn: getSmartRefreshInterval()
  };
}