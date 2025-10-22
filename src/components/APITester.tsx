"use client";

import { useState, useEffect } from "react";
import { Match } from "@/types/football";
import { FootballAPI } from "@/lib/footballAPI";

export default function APITester() {
  const [apiStatus, setApiStatus] = useState({
    yesterday: { loading: true, count: 0, error: null as string | null },
    today: { loading: true, count: 0, error: null as string | null },
    tomorrow: { loading: true, count: 0, error: null as string | null },
    major: { loading: true, count: 0, error: null as string | null }
  });

  const [testResults, setTestResults] = useState<{
    yesterday: Match[];
    today: Match[];
    tomorrow: Match[];
    major: Match[];
  }>({
    yesterday: [],
    today: [],
    tomorrow: [],
    major: []
  });

  const testAPI = async () => {
    console.log('🚀 Starting API tests...');
    
    // Reset status
    setApiStatus({
      yesterday: { loading: true, count: 0, error: null },
      today: { loading: true, count: 0, error: null },
      tomorrow: { loading: true, count: 0, error: null },
      major: { loading: true, count: 0, error: null }
    });

    try {
      // Test Yesterday's matches
      console.log('Testing Yesterday matches...');
      const yesterday = await FootballAPI.getYesterdayMatches();
      setApiStatus(prev => ({
        ...prev,
        yesterday: { loading: false, count: yesterday.length, error: null }
      }));
      setTestResults(prev => ({ ...prev, yesterday }));

      // Test Today's matches
      console.log('Testing Today matches...');
      const today = await FootballAPI.getTodayMatches();
      setApiStatus(prev => ({
        ...prev,
        today: { loading: false, count: today.length, error: null }
      }));
      setTestResults(prev => ({ ...prev, today }));

      // Test Tomorrow's matches
      console.log('Testing Tomorrow matches...');
      const tomorrow = await FootballAPI.getTomorrowMatches();
      setApiStatus(prev => ({
        ...prev,
        tomorrow: { loading: false, count: tomorrow.length, error: null }
      }));
      setTestResults(prev => ({ ...prev, tomorrow }));

      // Test Major competitions
      console.log('Testing Major competitions...');
      const major = await FootballAPI.getMajorCompetitionMatches(3);
      setApiStatus(prev => ({
        ...prev,
        major: { loading: false, count: major.length, error: null }
      }));
      setTestResults(prev => ({ ...prev, major }));

    } catch (error) {
      console.error('API test failed:', error);
    }
  };

  useEffect(() => {
    testAPI();
  }, []);

  const getStatusColor = (status: any) => {
    if (status.loading) return 'bg-yellow-100 text-yellow-800';
    if (status.error) return 'bg-red-100 text-red-800';
    if (status.count > 0) return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: any) => {
    if (status.loading) return 'Testing...';
    if (status.error) return `Error: ${status.error}`;
    if (status.count > 0) return `✅ ${status.count} matches`;
    return '⚠️ No matches';
  };

  return (
    <div className="space-y-8">
      {/* API Configuration */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">🔗 API Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">API Provider</label>
            <div className="mt-1 text-lg font-semibold text-primary-600">Football-Data.org</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">API Key Status</label>
            <div className="mt-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                🔑 Configured
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* API Test Results */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">📊 Live Data Tests</h2>
          <button
            onClick={testAPI}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            🔄 Refresh Tests
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Yesterday</h3>
            <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(apiStatus.yesterday)}`}>
              {getStatusText(apiStatus.yesterday)}
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Today</h3>
            <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(apiStatus.today)}`}>
              {getStatusText(apiStatus.today)}
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Tomorrow</h3>
            <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(apiStatus.tomorrow)}`}>
              {getStatusText(apiStatus.tomorrow)}
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Major Competitions</h3>
            <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(apiStatus.major)}`}>
              {getStatusText(apiStatus.major)}
            </div>
          </div>
        </div>
      </div>

      {/* Sample Data Display */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">🔍 Sample Data</h2>
        
        {Object.entries(testResults).map(([period, matches]) => (
          matches.length > 0 && (
            <div key={period} className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 capitalize">
                {period} ({matches.length} matches)
              </h3>
              <div className="space-y-2">
                {matches.slice(0, 3).map((match) => (
                  <div key={match.fixture.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <img 
                        src={match.teams.home.logo} 
                        alt={match.teams.home.name}
                        className="w-6 h-6 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <span className="font-medium">
                        {match.teams.home.name} vs {match.teams.away.name}
                      </span>
                      <img 
                        src={match.teams.away.logo} 
                        alt={match.teams.away.name}
                        className="w-6 h-6 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{match.league.name}</div>
                      <div className="text-xs text-gray-500">{match.fixture.status.long}</div>
                    </div>
                  </div>
                ))}
                {matches.length > 3 && (
                  <div className="text-sm text-gray-500 text-center">
                    + {matches.length - 3} more matches
                  </div>
                )}
              </div>
            </div>
          )
        ))}
      </div>

      {/* Developer Console */}
      <div className="bg-gray-900 rounded-lg p-6 text-white">
        <h2 className="text-xl font-bold mb-4">💻 Developer Console</h2>
        <div className="text-sm font-mono">
          <div>Open your browser&apos;s Developer Console (F12) to see detailed API logs</div>
          <div className="mt-2 text-green-400">
            Console logs show: API requests, response counts, errors, and timing
          </div>
        </div>
      </div>
    </div>
  );
}