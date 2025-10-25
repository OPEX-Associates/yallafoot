"use client";

import { useRealTimeMatches } from '@/hooks/useRealTimeMatches';
import { useState } from 'react';

const MATCH_STATUS_COLORS: Record<string, string> = {
  'NS': 'text-gray-500', // Not Started
  '1H': 'text-green-600', // First Half
  'HT': 'text-yellow-600', // Half Time
  '2H': 'text-green-600', // Second Half
  'ET': 'text-orange-600', // Extra Time
  'P': 'text-red-600', // Penalty
  'FT': 'text-blue-600', // Full Time
  'AET': 'text-blue-600', // After Extra Time
  'PEN': 'text-blue-600', // After Penalties
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
};

export default function RealTimeMatches() {
  const [selectedType, setSelectedType] = useState<'live' | 'today' | 'tomorrow' | 'finished'>('live');
  
  const {
    matches,
    meta,
    loading,
    error,
    lastUpdate,
    refresh,
    pauseAutoRefresh,
    resumeAutoRefresh,
    isAutoRefreshing,
    nextRefreshIn
  } = useRealTimeMatches({
    type: selectedType,
    autoRefresh: true
  });

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatLastUpdate = (date: Date | null) => {
    if (!date) return '';
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    return `${Math.floor(diffInSeconds / 3600)}h ago`;
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Header Controls */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              ⚽ Real-Time Football Scores
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              {meta && (
                <>
                  <span>📊 {meta.total} matches</span>
                  {meta.live > 0 && (
                    <span className="text-green-600 font-semibold">
                      🔴 {meta.live} LIVE
                    </span>
                  )}
                  {lastUpdate && (
                    <span>🕒 Updated {formatLastUpdate(lastUpdate)}</span>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Auto-refresh controls */}
            <button
              onClick={isAutoRefreshing ? pauseAutoRefresh : resumeAutoRefresh}
              className={`px-3 py-1 rounded text-sm font-medium ${
                isAutoRefreshing 
                  ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isAutoRefreshing ? '⏸️ Pause' : '▶️ Resume'}
            </button>
            
            <button
              onClick={refresh}
              disabled={loading}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '⏳' : '🔄'} Refresh
            </button>
          </div>
        </div>

        {/* Type Selection */}
        <div className="flex gap-2 mt-4">
          {[
            { key: 'live', label: '🔴 Live', count: meta?.live },
            { key: 'today', label: '📅 Today' },
            { key: 'tomorrow', label: '➡️ Tomorrow' },
            { key: 'finished', label: '✅ Finished' }
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setSelectedType(key as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedType === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
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

        {/* Real-time indicator */}
        {isAutoRefreshing && (meta?.live ?? 0) > 0 && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-700 text-sm font-medium">
                Live updates every {nextRefreshIn} seconds
              </span>
            </div>
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
      {loading && matches.length === 0 && (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading matches...</p>
        </div>
      )}

      {/* Matches List */}
      {matches.length > 0 && (
        <div className="grid gap-4">
          {matches.map((match) => (
            <div
              key={match.id}
              className={`bg-white rounded-lg shadow-lg p-6 transition-all ${
                match.isLive ? 'ring-2 ring-green-500 bg-green-50' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <img
                    src={match.league.logo}
                    alt={match.league.name}
                    className="w-6 h-6"
                  />
                  <span className="text-sm text-gray-600">
                    {match.league.name} • {match.league.country}
                  </span>
                </div>
                
                <div className="text-right">
                  <div className={`text-sm font-semibold ${MATCH_STATUS_COLORS[match.status] || 'text-gray-500'}`}>
                    {MATCH_STATUS_LABELS[match.status] || match.statusText}
                    {match.elapsed && ` (${match.elapsed}')`}
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
                  />
                  <span className="font-medium text-gray-900">
                    {match.homeTeam.name}
                  </span>
                </div>

                {/* Score */}
                <div className="px-6">
                  <div className="text-2xl font-bold text-center">
                    {match.score.home !== null && match.score.away !== null ? (
                      <span className={match.isLive ? 'text-green-600' : 'text-gray-900'}>
                        {match.score.home} - {match.score.away}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-lg">vs</span>
                    )}
                  </div>
                </div>

                {/* Away Team */}
                <div className="flex items-center gap-3 flex-1 justify-end">
                  <span className="font-medium text-gray-900">
                    {match.awayTeam.name}
                  </span>
                  <img
                    src={match.awayTeam.logo}
                    alt={match.awayTeam.name}
                    className="w-8 h-8"
                  />
                </div>
              </div>

              {match.venue && (
                <div className="mt-4 text-sm text-gray-500 text-center">
                  📍 {match.venue}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && matches.length === 0 && !error && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">⚽</div>
          <p className="text-gray-600 text-lg">No matches found for {selectedType}</p>
          <button
            onClick={refresh}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Refresh Data
          </button>
        </div>
      )}
    </div>
  );
}