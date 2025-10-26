"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useCachedMatches } from './useCachedMatches';

interface PopularMatchesOptions {
  tier?: 1 | 2 | null; // 1 = top leagues only, 2 = all popular leagues, null = all popular
  autoRefresh?: boolean;
  refreshInterval?: number;
}

/**
 * Hook for fetching matches from popular leagues only
 * This reduces the number of matches and focuses on the most viewed leagues
 */
export function usePopularMatches(options: PopularMatchesOptions = {}) {
  const {
    tier = null,
    autoRefresh = true,
    refreshInterval = 30000 // 30 seconds
  } = options;

  // Use the base hook but with popular=true parameter
  const {
    matches,
    loading,
    error,
    meta,
    refresh,
    cacheAge,
    requestsToday,
    isCacheMode
  } = useCachedMatches({
    popularOnly: true,
    tier: tier || undefined, // Convert null to undefined
    autoRefresh,
    refreshInterval: Math.floor(refreshInterval / 1000) // Convert to seconds
  });

  const refetch = useCallback(() => {
    return refresh();
  }, [refresh]);

  // Filter stats for popular leagues
  const stats = {
    total: matches.length,
    live: matches.filter(match => match.isLive).length,
    topLeagues: matches.filter(match => 
      isTopLeague(match.league.name)
    ).length,
    byLeague: getMatchesByLeague(matches)
  };

  return {
    matches,
    loading,
    error,
    meta,
    stats,
    refetch,
    isPopularMode: true,
    tier,
    cacheAge,
    requestsToday,
    isCacheMode
  };
}

/**
 * Check if a league is considered top-tier based on name
 */
function isTopLeague(leagueName: string): boolean {
  const topLeagues = [
    'Premier League',
    'La Liga', 
    'Bundesliga',
    'Serie A',
    'Ligue 1',
    'UEFA Champions League',
    'UEFA Europa League',
    'Brasileirão Serie A',
    'Liga Argentina',
    'Major League Soccer'
  ];
  
  return topLeagues.some(league => 
    leagueName.toLowerCase().includes(league.toLowerCase())
  );
}

/**
 * Group matches by league for display
 */
function getMatchesByLeague(matches: any[]) {
  const grouped: { [key: string]: any[] } = {};
  
  matches.forEach(match => {
    const leagueName = match.league.name;
    if (!grouped[leagueName]) {
      grouped[leagueName] = [];
    }
    grouped[leagueName].push(match);
  });

  // Sort leagues by number of matches (descending)
  return Object.entries(grouped)
    .sort(([, a], [, b]) => b.length - a.length)
    .reduce((acc, [league, matches]) => {
      acc[league] = matches;
      return acc;
    }, {} as { [key: string]: any[] });
}

export default usePopularMatches;