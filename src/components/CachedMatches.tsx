"use client";

import { useCachedMatches } from '@/hooks/useCachedMatches';
import { useState, useMemo } from 'react';
import Link from 'next/link';

const MATCH_STATUS_COLORS: Record<string, string> = {
  'NS': 'text-gray-500',
  '1H': 'text-green-600',
  'HT': 'text-yellow-600',
  '2H': 'text-green-600',
  'ET': 'text-orange-600',
  'P': 'text-red-600',
  'FT': 'text-blue-600',
  'AET': 'text-blue-600',
  'PEN': 'text-blue-600',
  'CANC': 'text-red-500',
  'PST': 'text-orange-500',
  'SUSP': 'text-yellow-500',
};

const MATCH_STATUS_LABELS: Record<string, string> = {
  'NS': 'Not Started',
  '1H': 'First Half',
  'HT': 'Half Time',
  '2H': 'Second Half',
  'ET': 'Extra Time',
  'P': 'Penalties',
  'FT': 'Full Time',
  'AET': 'After Extra Time',
  'PEN': 'After Penalties',
  'CANC': 'Cancelled',
  'PST': 'Postponed',
  'SUSP': 'Suspended',
};

interface MatchType {
  id: string;
  date: string;
  status: string;
  statusText: string;
  elapsed?: number;
  isLive: boolean;
  score: { home: number | null; away: number | null };
  homeTeam: { name: string; logo: string };
  awayTeam: { name: string; logo: string };
  league: { name: string; logo: string; country: string };
  venue?: string;
}

export default function CachedMatches() {
  const [selectedType, setSelectedType] = useState<'live' | 'today' | 'tomorrow'>('today');
  
  const {
    matches,
    meta,
    loading,
    error,
    lastFetch,
    refresh,
    forceUpdate,
    cacheAge,
    requestsToday,
    isCacheMode,
    nextRefreshIn
  } = useCachedMatches({
    type: selectedType,
    autoRefresh: true
  });

  // Enhanced sorting and grouping logic
  const sortedMatches = useMemo(() => {
    if (!matches) return [];
    
    const now = new Date();
    const sortedMatches = [...matches].sort((a, b) => {
      // 1. Live matches first
      if (a.isLive && !b.isLive) return -1;
      if (!a.isLive && b.isLive) return 1;
      
      // 2. For live matches, sort by status priority
      if (a.isLive && b.isLive) {
        const statusPriority = { '1H': 1, '2H': 2, 'HT': 3, 'ET': 4, 'P': 5 };
        const aPriority = statusPriority[a.status as keyof typeof statusPriority] || 6;
        const bPriority = statusPriority[b.status as keyof typeof statusPriority] || 6;
        if (aPriority !== bPriority) return aPriority - bPriority;
      }
      
      // 3. Finished matches to bottom
      const finishedStatuses = ['FT', 'AET', 'PEN'];
      const aFinished = finishedStatuses.includes(a.status);
      const bFinished = finishedStatuses.includes(b.status);
      
      if (aFinished && !bFinished) return 1;
      if (!aFinished && bFinished) return -1;
      
      // 4. Sort by start time
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
    
    return sortedMatches;
  }, [matches]);

  // Group matches by status for better organization
  const matchGroups = useMemo(() => {
    const groups = {
      live: [] as MatchType[],
      upcoming: [] as MatchType[],
      finished: [] as MatchType[]
    };
    
    sortedMatches.forEach(match => {
      if (match.isLive) {
        groups.live.push(match);
      } else if (['FT', 'AET', 'PEN'].includes(match.status)) {
        groups.finished.push(match);
      } else {
        groups.upcoming.push(match);
      }
    });
    
    return groups;
  }, [sortedMatches]);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatLastFetch = (date: Date | null) => {
    if (!date) return '';
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    return `${Math.floor(diffInSeconds / 3600)}h ago`;
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Header with Cache Info */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              ⚽ Football Matches - YallaFoot
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              {meta && (
                <>
                  <span>📊 {meta.total} matches</span>
                  {(meta.live || 0) > 0 && (
                    <span className="text-green-600 font-semibold">
                      🔴 {meta.live} LIVE
                    </span>
                  )}
                  {lastFetch && (
                    <span>🕒 Updated {formatLastFetch(lastFetch)}</span>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refresh}
              disabled={loading}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '⏳' : '🔄'} Refresh
            </button>
          </div>
        </div>

        {/* Free Tier Cache Info */}
        {isCacheMode && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-blue-600 font-medium">🆓 Free Tier Mode</span>
                <span className="text-blue-700 text-sm">
                  Cache: {cacheAge}min old • API calls today: {requestsToday}/100
                </span>
              </div>
              <div className="text-blue-600 text-sm">
                Updates every 3min during matches
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Type Selection - Merge Live & Today */}
        <div className="flex gap-2 mt-4">
          {[
            { 
              key: 'today', 
              label: selectedType === 'today' ? '🔴 Live & Today' : '📅 Today', 
              count: selectedType === 'today' ? meta?.live : undefined,
              description: 'Live matches + Today\'s fixtures'
            },
            { 
              key: 'tomorrow', 
              label: '➡️ Tomorrow',
              description: 'Tomorrow\'s fixtures'
            }
          ].map(({ key, label, count, description }) => (
            <button
              key={key}
              onClick={() => setSelectedType(key as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedType === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={description}
            >
              {label}
              {count !== undefined && count > 0 && (
                <span className="ml-1 bg-white bg-opacity-20 px-1 rounded">
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Cache freshness indicator */}
        {meta && (
          <div className="mt-3 text-xs text-gray-500">
            {meta.notice} • Next refresh in ~{nextRefreshIn}s
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-red-600">⚠️</span>
            <span className="text-red-700">Error: {error}</span>
            <button
              onClick={refresh}
              className="ml-auto px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && sortedMatches.length === 0 && (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading matches...</p>
        </div>
      )}

      {/* Enhanced Matches List with Grouping */}
      {sortedMatches.length > 0 && (
        <div className="space-y-6">
          {/* Live Matches Section */}
          {matchGroups.live.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <h2 className="text-xl font-bold text-gray-900">
                    🔴 Live Now ({matchGroups.live.length})
                  </h2>
                </div>
              </div>
              <div className="grid gap-4">
                {matchGroups.live.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Matches Section */}
          {matchGroups.upcoming.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  📅 Upcoming ({matchGroups.upcoming.length})
                </h2>
              </div>
              <div className="grid gap-3">
                {matchGroups.upcoming.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            </div>
          )}

          {/* Finished Matches Section */}
          {matchGroups.finished.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  ✅ Finished ({matchGroups.finished.length})
                </h2>
              </div>
              <div className="grid gap-3">
                {matchGroups.finished.map((match) => (
                  <MatchCard key={match.id} match={match} isFinished />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!loading && sortedMatches.length === 0 && !error && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">⚽</div>
          <p className="text-gray-600 text-lg">No matches found for {selectedType}</p>
          <p className="text-gray-500 text-sm mt-2">
            Cache updates automatically during match hours
          </p>
          <button
            onClick={refresh}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Check for Updates
          </button>
        </div>
      )}
    </div>
  );
}

// Enhanced Match Card Component
interface MatchCardProps {
  match: MatchType;
  isFinished?: boolean;
}

function MatchCard({ match, isFinished = false }: MatchCardProps) {
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Link href={`/match?id=${match.id}`} className="block group">
      <div
        className={`bg-white rounded-lg shadow-lg p-6 transition-all hover:shadow-xl hover:scale-[1.02] ${
          match.isLive 
            ? 'ring-2 ring-green-500 bg-gradient-to-r from-green-50 to-white' 
            : isFinished 
            ? 'opacity-75 hover:opacity-100' 
            : 'hover:ring-2 hover:ring-blue-200'
        }`}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <img
              src={match.league.logo}
              alt={match.league.name}
              className="w-6 h-6"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <span className="text-sm text-gray-600">
              {match.league.name} • {match.league.country}
            </span>
          </div>
          
          <div className="text-right">
            <div className={`text-sm font-semibold flex items-center gap-2 ${
              MATCH_STATUS_COLORS[match.status] || 'text-gray-500'
            }`}>
              {match.isLive && (
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              )}
              {MATCH_STATUS_LABELS[match.status] || match.statusText}
              {match.elapsed && ` (${match.elapsed}')`}
              {isFinished && <span className="text-xs">✅</span>}
            </div>
            <div className="text-xs text-gray-500">
              {formatTime(match.date)}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          {/* Home Team */}
          <div className="flex items-center gap-3 flex-1">
            <img
              src={match.homeTeam.logo}
              alt={match.homeTeam.name}
              className="w-8 h-8"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <span className={`font-medium ${isFinished ? 'text-gray-700' : 'text-gray-900'}`}>
              {match.homeTeam.name}
            </span>
          </div>

          {/* Score */}
          <div className="px-6">
            <div className="text-2xl font-bold text-center">
              {match.score.home !== null && match.score.away !== null ? (
                <span className={
                  match.isLive ? 'text-green-600' : 
                  isFinished ? 'text-blue-600' : 
                  'text-gray-900'
                }>
                  {match.score.home} - {match.score.away}
                </span>
              ) : (
                <span className="text-gray-400 text-lg">vs</span>
              )}
            </div>
          </div>

          {/* Away Team */}
          <div className="flex items-center gap-3 flex-1 justify-end">
            <span className={`font-medium ${isFinished ? 'text-gray-700' : 'text-gray-900'}`}>
              {match.awayTeam.name}
            </span>
            <img
              src={match.awayTeam.logo}
              alt={match.awayTeam.name}
              className="w-8 h-8"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        </div>

        {/* Match Info Footer */}
        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
          {match.venue && (
            <span>📍 {match.venue}</span>
          )}
          <div className="flex items-center gap-2">
            <span className="group-hover:text-blue-600 transition-colors">
              📺 View Streams & Stats
            </span>
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}