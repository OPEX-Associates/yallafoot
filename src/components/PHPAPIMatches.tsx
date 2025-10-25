"use client";

import { usePHPAPI } from '@/hooks/usePHPAPI';
import { useState } from 'react';

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

export default function PHPAPIMatches() {
  const [selectedType, setSelectedType] = useState<'live' | 'today' | 'tomorrow'>('today');
  
  const {
    matches,
    meta,
    loading,
    error,
    lastFetch,
    refresh,
    checkAPIStatus,
    cacheAge,
    requestsToday,
    requestsRemaining,
    responseTime,
    nextRefreshIn,
    apiBaseUrl,
    isConfigured
  } = usePHPAPI({
    type: selectedType,
    autoRefresh: true
  });

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

  // Configuration warning
  if (!isConfigured) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-yellow-600 text-2xl">⚠️</span>
            <h2 className="text-xl font-bold text-yellow-800">PHP API Configuration Required</h2>
          </div>
          
          <div className="space-y-3 text-yellow-700">
            <p>Please configure your PHP API connection:</p>
            
            <div className="bg-white p-4 rounded border">
              <h3 className="font-semibold mb-2">Add to your .env.local:</h3>
              <pre className="text-sm bg-gray-100 p-2 rounded">
{`NEXT_PUBLIC_PHP_API_URL=https://yourdomain.com/api
NEXT_PUBLIC_PHP_API_KEY=your_secure_api_key`}
              </pre>
            </div>
            
            <p>Current API URL: <code className="bg-white px-2 py-1 rounded">{apiBaseUrl}</code></p>
            
            <div className="mt-4">
              <button
                onClick={checkAPIStatus}
                className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
              >
                Test API Connection
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Header with PHP API Info */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              ⚽ Football Scores (PHP API)
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
                  {lastFetch && (
                    <span>🕒 Fetched {formatLastFetch(lastFetch)}</span>
                  )}
                  {responseTime && (
                    <span>⚡ {responseTime}ms</span>
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
            
            <button
              onClick={checkAPIStatus}
              className="px-3 py-1 bg-gray-600 text-white rounded text-sm font-medium hover:bg-gray-700"
            >
              📡 Status
            </button>
          </div>
        </div>

        {/* PHP API Cache Info */}
        {meta && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-green-600 font-medium">🐘 PHP API Mode</span>
                <span className="text-green-700 text-sm">
                  Cache: {cacheAge}min old • API calls: {requestsToday}/{meta.api_usage.limit} ({requestsRemaining} remaining)
                </span>
              </div>
              <div className="text-green-600 text-sm">
                MySQL cached • Updates every 3min
              </div>
            </div>
          </div>
        )}

        {/* Type Selection */}
        <div className="flex gap-2 mt-4">
          {[
            { key: 'live', label: '🔴 Live', count: meta?.live },
            { key: 'today', label: '📅 Today' },
            { key: 'tomorrow', label: '➡️ Tomorrow' }
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

        {/* Performance info */}
        {meta && (
          <div className="mt-3 text-xs text-gray-500">
            Next refresh in ~{nextRefreshIn}s • Served from MySQL cache via PHP API
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
          <p className="text-gray-600">Loading matches from PHP API...</p>
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
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
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
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
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
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
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
          <p className="text-gray-500 text-sm mt-2">
            Data automatically updates via PHP API cron jobs
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