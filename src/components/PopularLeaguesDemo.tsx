"use client";

import React, { useState } from 'react';
import { usePopularMatches } from '@/hooks/usePopularMatches';
import { useCachedMatches } from '@/hooks/useCachedMatches';

export default function PopularLeaguesDemo() {
  const [mode, setMode] = useState<'all' | 'popular' | 'tier1'>('popular');
  
  // Hook for all matches (current behavior)
  const allMatches = useCachedMatches({
    type: 'today',
    autoRefresh: false // Disable to avoid conflicts
  });
  
  // Hook for popular leagues only
  const popularMatches = usePopularMatches({
    tier: null, // All popular leagues
    autoRefresh: false
  });
  
  // Hook for tier 1 leagues only (Premier League, La Liga, etc.)
  const tier1Matches = usePopularMatches({
    tier: 1,
    autoRefresh: false
  });
  
  const currentData = mode === 'all' ? allMatches : 
                      mode === 'popular' ? popularMatches : tier1Matches;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Popular Leagues Filtering Demo
        </h1>
        
        {/* Mode Selector */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Filter Mode</h2>
            <div className="flex gap-4">
              <button
                onClick={() => setMode('all')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  mode === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Leagues ({allMatches.matches.length})
              </button>
              <button
                onClick={() => setMode('popular')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  mode === 'popular' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Popular Leagues ({popularMatches.matches.length})
              </button>
              <button
                onClick={() => setMode('tier1')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  mode === 'tier1' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tier 1 Only ({tier1Matches.matches.length})
              </button>
            </div>
          </div>
        </div>

        {/* Stats Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">All Leagues</h3>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-blue-600">{allMatches.matches.length}</p>
              <p className="text-sm text-gray-600">Total matches</p>
              <p className="text-sm text-gray-600">
                Live: {allMatches.matches.filter(m => m.isLive).length}
              </p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Popular Leagues</h3>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-green-600">{popularMatches.matches.length}</p>
              <p className="text-sm text-gray-600">Popular matches</p>
              <p className="text-sm text-gray-600">
                Reduction: {Math.round((1 - popularMatches.matches.length / Math.max(allMatches.matches.length, 1)) * 100)}%
              </p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Tier 1 Only</h3>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-purple-600">{tier1Matches.matches.length}</p>
              <p className="text-sm text-gray-600">Top tier matches</p>
              <p className="text-sm text-gray-600">
                Focus ratio: {tier1Matches.matches.length > 0 ? Math.round(tier1Matches.matches.length / Math.max(allMatches.matches.length, 1) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>

        {/* League Distribution */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            League Distribution ({mode === 'all' ? 'All' : mode === 'popular' ? 'Popular' : 'Tier 1'})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(
              currentData.matches.reduce((acc: Record<string, number>, match) => {
                acc[match.league.name] = (acc[match.league.name] || 0) + 1;
                return acc;
              }, {})
            )
              .sort(([, a], [, b]) => b - a)
              .slice(0, 12) // Show top 12 leagues
              .map(([league, count]) => (
                <div key={league} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm font-medium text-gray-700 truncate">{league}</span>
                  <span className="text-sm font-bold text-gray-900 ml-2">{count}</span>
                </div>
              ))
            }
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Benefits of Popular League Filtering</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Performance Benefits</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Reduced API calls to external services</li>
                <li>• Faster page load times</li>
                <li>• Lower bandwidth usage</li>
                <li>• Better mobile experience</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">User Experience Benefits</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Focus on leagues users actually want</li>
                <li>• Cleaner, less cluttered interface</li>
                <li>• Easier to find important matches</li>
                <li>• Better match discovery</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">How to Use</h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p><strong>API Usage:</strong> Add <code>?popular=true</code> to your API calls</p>
            <p><strong>Tier 1 Only:</strong> Add <code>?popular=true&tier=1</code> for top leagues only</p>
            <p><strong>React Hook:</strong> Use <code>usePopularMatches()</code> instead of <code>useCachedMatches()</code></p>
          </div>
        </div>
      </div>
    </div>
  );
}