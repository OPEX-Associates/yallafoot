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
}

export function useCachedMatches(options: UseCachedMatchesOptions = {}) {
  const {
    type = 'today',
    autoRefresh = true,
    refreshInterval = 60 // Default 1 minute for cached data
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
      
      const response = await fetch(`/api/cached-matches?type=${type}`, {
        // Client-side caching - let browser cache for a bit
        cache: 'default',
        headers: {
          'Cache-Control': 'max-age=60' // Cache for 1 minute on client
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (isActiveRef.current) {
        setData(result);
        setLastFetch(new Date());
        setLoading(false);
        
        // Log cache info for transparency
        if (result.meta.freeApiMode) {
          console.log(`📦 Served from cache (${result.meta.ageMinutes}min old, ${result.meta.requestsToday} API calls today)`);
        }
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
      // Force server-side cache update
      await fetch(`/api/cached-matches?type=${type}&force=true`);
      // Then fetch the updated data
      fetchCachedMatches();
    } catch (err) {
      setError('Failed to force update');
    }
  }, [type, fetchCachedMatches]);

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