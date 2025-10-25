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
  lastUpdate: string;
}

interface UseRealTimeMatchesOptions {
  type?: 'live' | 'today' | 'tomorrow' | 'finished';
  autoRefresh?: boolean;
  refreshInterval?: number; // in seconds
}

interface MatchesData {
  matches: Match[];
  meta: {
    total: number;
    live: number;
    cacheTime: number;
    timestamp: string;
  };
}

export function useRealTimeMatches(options: UseRealTimeMatchesOptions = {}) {
  const {
    type = 'live',
    autoRefresh = true,
    refreshInterval = 30 // 30 seconds for live matches
  } = options;

  const [data, setData] = useState<MatchesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(true);

  const fetchMatches = useCallback(async () => {
    if (!isActiveRef.current) return;

    try {
      setError(null);
      
      // Direct API call to PHP API with proper CORS handling
      const PHP_API_BASE = process.env.NEXT_PUBLIC_PHP_API_BASE || 'https://football.opex.associates/api';
      const PHP_API_KEY = process.env.NEXT_PUBLIC_PHP_API_KEY || 'yf_prod_b5f603e5da167f0e69f3902b644f66171c3197f34426fe9b3217c11375f354ca';
      
      const params = new URLSearchParams();
      params.append('endpoint', 'matches');
      params.append('type', type);
      
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

      // Get response text first to clean it
      const responseText = await response.text();
      
      // Remove any PHP error/warning HTML output that might corrupt JSON
      const cleanJsonText = responseText
        .replace(/<br\s*\/?>/gi, '') // Remove <br> tags
        .replace(/<b>.*?<\/b>/gi, '') // Remove <b> tags and content
        .replace(/Warning:.*?on line.*?\n/gi, '') // Remove PHP warnings
        .replace(/Notice:.*?on line.*?\n/gi, '') // Remove PHP notices
        .trim();
      
      // Find the start of actual JSON (look for opening brace)
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
            isLive: match.isLive || false,
            lastUpdate: new Date().toISOString()
          })),
          meta: {
            total: result.meta?.total || 0,
            live: result.meta?.live || 0,
            cacheTime: Date.now(),
            timestamp: new Date().toISOString()
          }
        };
        
        setData(transformedData);
        setLastUpdate(new Date());
        setLoading(false);
        
        // Log live updates for debugging
        if (transformedData.meta.live > 0) {
          console.log(`🔴 LIVE: ${transformedData.meta.live} matches updating...`);
        }
      }
    } catch (err) {
      if (isActiveRef.current) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    }
  }, [type]);

  // Smart refresh interval based on match status
  const getOptimalRefreshInterval = useCallback(() => {
    if (!data) return refreshInterval;
    
    const liveMatches = data.meta.live;
    
    if (liveMatches > 0) {
      return 30; // 30 seconds during live matches
    } else if (type === 'today') {
      return 300; // 5 minutes for today's upcoming matches
    } else if (type === 'tomorrow') {
      return 900; // 15 minutes for tomorrow's matches
    } else {
      return 3600; // 1 hour for finished matches
    }
  }, [data, refreshInterval, type]);

  // Initial fetch
  useEffect(() => {
    isActiveRef.current = true;
    fetchMatches();
  }, [fetchMatches]);

  // Auto-refresh logic
  useEffect(() => {
    if (!autoRefresh || !isActiveRef.current) return;

    const interval = getOptimalRefreshInterval();
    
    intervalRef.current = setInterval(() => {
      fetchMatches();
    }, interval * 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, fetchMatches, getOptimalRefreshInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isActiveRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Manual refresh function
  const refresh = useCallback(() => {
    setLoading(true);
    fetchMatches();
  }, [fetchMatches]);

  // Pause/resume auto-refresh
  const pauseAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const resumeAutoRefresh = useCallback(() => {
    if (!intervalRef.current && autoRefresh) {
      const interval = getOptimalRefreshInterval();
      intervalRef.current = setInterval(fetchMatches, interval * 1000);
    }
  }, [autoRefresh, fetchMatches, getOptimalRefreshInterval]);

  return {
    // Data
    matches: data?.matches || [],
    meta: data?.meta,
    
    // State
    loading,
    error,
    lastUpdate,
    
    // Actions
    refresh,
    pauseAutoRefresh,
    resumeAutoRefresh,
    
    // Info
    isAutoRefreshing: !!intervalRef.current,
    nextRefreshIn: getOptimalRefreshInterval()
  };
}