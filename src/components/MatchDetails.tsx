"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface MatchDetailsProps {
  matchId: string;
}

interface MatchData {
  id: string;
  homeTeam: { name: string; logo: string; score?: number };
  awayTeam: { name: string; logo: string; score?: number };
  league: { name: string; logo: string; country: string };
  status: string;
  elapsed?: number;
  date: string;
  venue: string;
  isLive: boolean;
}

interface StreamingLink {
  id: string;
  name: string;
  quality: string;
  language: string;
  rating: number;
  verified: boolean;
  url: string;
}

interface BettingOdds {
  provider: string;
  homeWin: number;
  draw: number;
  awayWin: number;
}

interface MatchStats {
  possession?: { home: number; away: number };
  shots?: { home: number; away: number };
  shotsOnTarget?: { home: number; away: number };
  corners?: { home: number; away: number };
  fouls?: { home: number; away: number };
  yellowCards?: { home: number; away: number };
  redCards?: { home: number; away: number };
}

export default function MatchDetails({ matchId }: MatchDetailsProps) {
  const [loading, setLoading] = useState(true);
  const [match, setMatch] = useState<MatchData | null>(null);
  const [stats, setStats] = useState<MatchStats>({});
  const [error, setError] = useState<string | null>(null);

  // Helper function to display match status
  const getStatusDisplay = (status: string, elapsed?: number) => {
    switch (status) {
      case '1H': return `First Half ${elapsed ? `(${elapsed}')` : ''}`;
      case '2H': return `Second Half ${elapsed ? `(${elapsed}')` : ''}`;
      case 'HT': return 'Half Time';
      case 'ET': return `Extra Time ${elapsed ? `(${elapsed}')` : ''}`;
      case 'P': return 'Penalty Shootout';
      case 'FT': return 'Full Time';
      case 'AET': return 'After Extra Time';
      case 'PEN': return 'Penalty Shootout';
      case 'SUSP': return 'Suspended';
      case 'INT': return 'Interrupted';
      case 'CANC': return 'Cancelled';
      case 'ABD': return 'Abandoned';
      case 'AWD': return 'Technical Loss';
      case 'WO': return 'WalkOver';
      case 'NS': return 'Not Started';
      case 'PST': return 'Postponed';
      case 'TBD': return 'To Be Defined';
      default: return status;
    }
  };

  // Mock streaming links and betting data (these would come from your own databases)
  const mockStreams: StreamingLink[] = [
    { id: "1", name: "ESPN HD", quality: "HD", language: "English", rating: 4.8, verified: true, url: "#" },
    { id: "2", name: "Sky Sports", quality: "FHD", language: "English", rating: 4.9, verified: true, url: "#" },
    { id: "3", name: "Stream Sport", quality: "HD", language: "Arabic", rating: 4.2, verified: false, url: "#" }
  ];

  const mockBetting: BettingOdds[] = [
    { provider: "Bet365", homeWin: 1.85, draw: 3.40, awayWin: 4.20 },
    { provider: "William Hill", homeWin: 1.90, draw: 3.30, awayWin: 4.00 }
  ];

  useEffect(() => {
    const fetchMatchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch match details
        const matchResponse = await fetch(`http://localhost:8080/match-details.php?id=${matchId}`);
        if (!matchResponse.ok) {
          throw new Error('Failed to fetch match details');
        }
        
        const matchData = await matchResponse.json();
        
        if (matchData.response && matchData.response.length > 0) {
          const fixture = matchData.response[0];
          
          const matchInfo: MatchData = {
            id: matchId,
            homeTeam: {
              name: fixture.teams?.home?.name || 'Home Team',
              logo: fixture.teams?.home?.logo || '',
              score: fixture.goals?.home
            },
            awayTeam: {
              name: fixture.teams?.away?.name || 'Away Team',
              logo: fixture.teams?.away?.logo || '',
              score: fixture.goals?.away
            },
            league: {
              name: fixture.league?.name || 'Unknown League',
              logo: fixture.league?.logo || '',
              country: fixture.league?.country || ''
            },
            status: fixture.fixture?.status?.short || 'NS',
            elapsed: fixture.fixture?.status?.elapsed,
            date: fixture.fixture?.date || '',
            venue: fixture.fixture?.venue?.name || 'Unknown Venue',
            isLive: ['1H', '2H', 'HT', 'ET', 'P'].includes(fixture.fixture?.status?.short)
          };
          
          setMatch(matchInfo);

          // Fetch match statistics if the match is live or finished
          if (['1H', '2H', 'HT', 'FT', 'AET', 'PEN'].includes(matchInfo.status)) {
            try {
              const statsResponse = await fetch(`http://localhost:8080/match-statistics.php?id=${matchId}`);
              if (statsResponse.ok) {
                const statsData = await statsResponse.json();
                if (statsData.response && statsData.response.length > 0) {
                  const statistics = statsData.response[0].statistics;
                  
                  // Parse statistics from API response
                  const parsedStats: MatchStats = {};
                  
                  statistics?.forEach((teamStats: any, index: number) => {
                    teamStats.statistics?.forEach((stat: any) => {
                      const statType = stat.type?.toLowerCase();
                      const value = stat.value ? parseInt(stat.value.toString().replace('%', '')) : 0;
                      
                      if (statType?.includes('ball possession')) {
                        if (!parsedStats.possession) parsedStats.possession = { home: 0, away: 0 };
                        if (index === 0) parsedStats.possession.home = value;
                        else parsedStats.possession.away = value;
                      } else if (statType?.includes('total shots')) {
                        if (!parsedStats.shots) parsedStats.shots = { home: 0, away: 0 };
                        if (index === 0) parsedStats.shots.home = value;
                        else parsedStats.shots.away = value;
                      } else if (statType?.includes('shots on target')) {
                        if (!parsedStats.shotsOnTarget) parsedStats.shotsOnTarget = { home: 0, away: 0 };
                        if (index === 0) parsedStats.shotsOnTarget.home = value;
                        else parsedStats.shotsOnTarget.away = value;
                      } else if (statType?.includes('corner kicks')) {
                        if (!parsedStats.corners) parsedStats.corners = { home: 0, away: 0 };
                        if (index === 0) parsedStats.corners.home = value;
                        else parsedStats.corners.away = value;
                      } else if (statType?.includes('fouls')) {
                        if (!parsedStats.fouls) parsedStats.fouls = { home: 0, away: 0 };
                        if (index === 0) parsedStats.fouls.home = value;
                        else parsedStats.fouls.away = value;
                      } else if (statType?.includes('yellow cards')) {
                        if (!parsedStats.yellowCards) parsedStats.yellowCards = { home: 0, away: 0 };
                        if (index === 0) parsedStats.yellowCards.home = value;
                        else parsedStats.yellowCards.away = value;
                      } else if (statType?.includes('red cards')) {
                        if (!parsedStats.redCards) parsedStats.redCards = { home: 0, away: 0 };
                        if (index === 0) parsedStats.redCards.home = value;
                        else parsedStats.redCards.away = value;
                      }
                    });
                  });
                  
                  setStats(parsedStats);
                }
              }
            } catch (statsError) {
              console.log('Failed to fetch match statistics:', statsError);
            }
          }
        } else {
          setError('Match not found');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load match data');
        console.error('Error fetching match data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (matchId) {
      fetchMatchData();
    }
  }, [matchId]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Loading match details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-xl mb-4">⚠️ Error Loading Match</div>
        <p className="text-gray-600 mb-4">{error}</p>
        <Link href="/matches" className="text-blue-600 hover:text-blue-800">
          ← Back to Matches
        </Link>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-xl mb-4">Match not found</div>
        <Link href="/matches" className="text-blue-600 hover:text-blue-800">
          ← Back to Matches
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Back Button */}
      <Link href="/matches" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        Back to Matches
      </Link>

      {/* Match Header */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <img src={match.league.logo} alt={match.league.name} className="w-8 h-8" />
            <span className="text-lg font-semibold text-gray-700">{match.league.name} • {match.league.country}</span>
          </div>
          <div className="text-sm text-gray-500">📍 {match.venue}</div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-center">
          <div className="text-center">
            <img src={match.homeTeam.logo} alt={match.homeTeam.name} className="w-20 h-20 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">{match.homeTeam.name}</h2>
          </div>

          <div className="text-center">
            <div className="text-5xl font-bold text-gray-900 mb-2">
              {match.homeTeam.score !== undefined ? match.homeTeam.score : '-'} - {match.awayTeam.score !== undefined ? match.awayTeam.score : '-'}
            </div>
            <div className="flex items-center justify-center gap-2 mb-2">
              {match.isLive && <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>}
              <span className="text-lg font-semibold text-green-600">
                {getStatusDisplay(match.status, match.elapsed)}
              </span>
            </div>
            <div className="text-sm text-gray-500">{new Date(match.date).toLocaleString()}</div>
          </div>

          <div className="text-center">
            <img src={match.awayTeam.logo} alt={match.awayTeam.name} className="w-20 h-20 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">{match.awayTeam.name}</h2>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Streaming Links */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              📺 Streaming Links <span className="text-sm font-normal text-gray-500">({mockStreams.length} available)</span>
            </h3>
            
            <div className="space-y-3">
              {mockStreams.map((stream) => (
                <div key={stream.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {stream.verified && <div className="w-2 h-2 bg-green-500 rounded-full"></div>}
                      <span className="font-medium">{stream.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        stream.quality === 'FHD' ? 'bg-green-100 text-green-800' :
                        stream.quality === 'HD' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>{stream.quality}</span>
                      <span>{stream.language}</span>
                      <div className="flex items-center gap-1"><span>⭐</span><span>{stream.rating}</span></div>
                    </div>
                  </div>
                  <button onClick={() => window.open(stream.url, '_blank')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Watch Now
                  </button>
                </div>
              ))}
            </div>

            {/* Ad Space */}
            <div className="mt-6 p-4 bg-gray-100 border border-gray-200 rounded-lg text-center">
              <div className="text-gray-500 text-sm mb-2">Advertisement</div>
              <div className="h-20 bg-gray-200 rounded flex items-center justify-center">
                <span className="text-gray-400">720x90 Banner Ad Space</span>
              </div>
            </div>
          </div>

          {/* Match Statistics */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">📊 Match Statistics</h3>
            {Object.keys(stats).length > 0 ? (
              <div className="space-y-4">
                {[
                  { label: 'Possession', home: stats.possession?.home || 0, away: stats.possession?.away || 0, unit: '%' },
                  { label: 'Shots', home: stats.shots?.home || 0, away: stats.shots?.away || 0 },
                  { label: 'Shots on Target', home: stats.shotsOnTarget?.home || 0, away: stats.shotsOnTarget?.away || 0 },
                  { label: 'Corners', home: stats.corners?.home || 0, away: stats.corners?.away || 0 },
                  { label: 'Fouls', home: stats.fouls?.home || 0, away: stats.fouls?.away || 0 },
                  { label: 'Yellow Cards', home: stats.yellowCards?.home || 0, away: stats.yellowCards?.away || 0 },
                  { label: 'Red Cards', home: stats.redCards?.home || 0, away: stats.redCards?.away || 0 },
                ].filter(stat => stat.home > 0 || stat.away > 0).map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between">
                    <div className="w-20 text-right font-medium">{stat.home}{stat.unit}</div>
                    <div className="flex-1 mx-4">
                      <div className="text-center text-sm text-gray-600 mb-1">{stat.label}</div>
                      <div className="flex items-center h-2 bg-gray-200 rounded">
                        <div className="h-full bg-blue-500 rounded-l" style={{ width: `${stat.home + stat.away > 0 ? (stat.home / (stat.home + stat.away)) * 100 : 0}%` }}></div>
                        <div className="h-full bg-red-500 rounded-r" style={{ width: `${stat.home + stat.away > 0 ? (stat.away / (stat.home + stat.away)) * 100 : 0}%` }}></div>
                      </div>
                    </div>
                    <div className="w-20 text-left font-medium">{stat.away}{stat.unit}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  {match?.isLive ? 'Statistics will be available soon...' : 'No statistics available for this match'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Betting Odds */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              🎯 Betting Odds <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Live</span>
            </h3>
            <div className="space-y-4">
              {mockBetting.map((provider) => (
                <div key={provider.provider} className="border border-gray-200 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-900 mb-2">{provider.provider}</div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="text-center p-2 bg-blue-50 rounded">
                      <div className="text-xs text-gray-600">Home</div>
                      <div className="font-bold">{provider.homeWin}</div>
                    </div>
                    <div className="text-center p-2 bg-yellow-50 rounded">
                      <div className="text-xs text-gray-600">Draw</div>
                      <div className="font-bold">{provider.draw}</div>
                    </div>
                    <div className="text-center p-2 bg-red-50 rounded">
                      <div className="text-xs text-gray-600">Away</div>
                      <div className="font-bold">{provider.awayWin}</div>
                    </div>
                  </div>
                </div>
              ))}
              <button className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                View All Betting Sites
              </button>
            </div>
          </div>

          {/* Side Ad */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-gray-500 text-sm mb-2 text-center">Advertisement</div>
            <div className="h-64 bg-gray-200 rounded flex items-center justify-center">
              <span className="text-gray-400">300x250 Medium Rectangle</span>
            </div>
          </div>

          {/* Quick Insights */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">💡 Quick Insights</h3>
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-blue-50 rounded-lg">
                <span className="font-medium">⚽ Match:</span> {match.homeTeam.name} vs {match.awayTeam.name}
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <span className="font-medium">🏆 Competition:</span> {match.league.name}
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <span className="font-medium">📍 Venue:</span> {match.venue}
              </div>
              {match.isLive && (
                <div className="p-3 bg-red-50 rounded-lg">
                  <span className="font-medium">🔴 Live:</span> Match is currently in progress
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}