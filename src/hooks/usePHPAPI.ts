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

interface APIResponse {
  success: boolean;
  data: Match[];
  meta: {
    total: number;
    live: number;
    type: string;
    cache_info: {
      last_update: string;
      age_minutes: number;
      requests_today: number;
    };
    api_usage: {
      requests_today: number;
      limit: number;
      remaining: number;
    };
    response_time_ms: number;
  };
}

interface UsePHPAPIOptions {
  type?: 'live' | 'today' | 'tomorrow';
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function usePHPAPI(options: UsePHPAPIOptions = {}) {
  const {
    type = 'today',
    autoRefresh = true,
    refreshInterval = 60 // Default 1 minute
  } = options;

  const [data, setData] = useState<APIResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(true);

  // Get API configuration from environment
  const API_BASE_URL = process.env.NEXT_PUBLIC_PHP_API_URL || 'https://yourdomain.com/api';
  const API_KEY = process.env.NEXT_PUBLIC_PHP_API_KEY || 'your_api_key_here';

  const fetchFromPHPAPI = useCallback(async () => {
    if (!isActiveRef.current) return;

    try {
      setError(null);
      
      const url = `${API_BASE_URL}/matches/${type}?api_key=${API_KEY}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        cache: 'no-store' // Always get fresh data
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'API request failed');
      }
      
      if (isActiveRef.current) {
        setData(result);
        setLastFetch(new Date());
        setLoading(false);
        
        // Log successful fetch
        console.log(`✅ PHP API: ${result.meta.total} matches, cache age: ${result.meta.cache_info.age_minutes}min`);
      }
    } catch (err) {
      if (isActiveRef.current) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
        console.error('❌ PHP API error:', err);
      }
    }
  }, [type, API_BASE_URL, API_KEY]);

  // Smart refresh interval based on data freshness and live matches
  const getSmartRefreshInterval = useCallback(() => {
    if (!data) return refreshInterval;
    
    const cacheAge = data.meta.cache_info.age_minutes;
    const hasLiveMatches = data.meta.live > 0;
    
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
    fetchFromPHPAPI();
  }, [fetchFromPHPAPI]);

  // Auto-refresh logic
  useEffect(() => {
    if (!autoRefresh || !isActiveRef.current) return;

    const interval = getSmartRefreshInterval();
    
    intervalRef.current = setInterval(() => {
      fetchFromPHPAPI();
    }, interval * 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, fetchFromPHPAPI, getSmartRefreshInterval]);

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
    fetchFromPHPAPI();
  }, [fetchFromPHPAPI]);

  const checkAPIStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/status`);
      const result = await response.json();
      return result;
    } catch (err) {
      console.error('API status check failed:', err);
      return null;
    }
  }, [API_BASE_URL]);

  return {
    // Data
    matches: data?.data || [],
    meta: data?.meta,
    
    // State
    loading,
    error,
    lastFetch,
    
    // Actions
    refresh,
    checkAPIStatus,
    
    // Info
    cacheAge: data?.meta.cache_info.age_minutes,
    requestsToday: data?.meta.api_usage.requests_today,
    requestsRemaining: data?.meta.api_usage.remaining,
    responseTime: data?.meta.response_time_ms,
    nextRefreshIn: getSmartRefreshInterval(),
    
    // Config info
    apiBaseUrl: API_BASE_URL,
    isConfigured: API_BASE_URL !== 'https://yourdomain.com/api' && API_KEY !== 'your_api_key_here'
  };
}