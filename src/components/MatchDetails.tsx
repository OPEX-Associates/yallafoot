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
    { id: "1", name: "ESPN+ HD", quality: "FHD", language: "English", rating: 4.9, verified: true, url: "https://espnplus.com" },
    { id: "2", name: "Sky Sports Main Event", quality: "4K", language: "English", rating: 4.8, verified: true, url: "https://skysports.com" },
    { id: "3", name: "DAZN Sports", quality: "HD", language: "English", rating: 4.7, verified: true, url: "https://dazn.com" },
    { id: "4", name: "beIN Sports", quality: "FHD", language: "Arabic", rating: 4.6, verified: true, url: "https://beinsports.com" },
    { id: "5", name: "Sport Stream Pro", quality: "HD", language: "English", rating: 4.3, verified: false, url: "#" },
    { id: "6", name: "Live Soccer TV", quality: "SD", language: "Multiple", rating: 4.1, verified: false, url: "#" }
  ];

  const mockBetting: BettingOdds[] = [
    { provider: "Bet365", homeWin: 1.85, draw: 3.40, awayWin: 4.20 },
    { provider: "William Hill", homeWin: 1.90, draw: 3.30, awayWin: 4.00 },
    { provider: "Betfair", homeWin: 1.88, draw: 3.35, awayWin: 4.10 },
    { provider: "888sport", homeWin: 1.82, draw: 3.45, awayWin: 4.25 },
    { provider: "Unibet", homeWin: 1.86, draw: 3.38, awayWin: 4.15 }
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
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl shadow-2xl p-8 text-white mb-8">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-3">
            <img src={match.league.logo} alt={match.league.name} className="w-10 h-10 rounded-full border-2 border-white/20" />
            <div>
              <div className="text-xl font-bold">{match.league.name}</div>
              <div className="text-sm opacity-80">{match.league.country}</div>
            </div>
          </div>
          <div className="text-sm opacity-80 flex items-center justify-center gap-2">
            <span>📍</span>
            <span>{match.venue}</span>
            <span>•</span>
            <span>{new Date(match.date).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-center">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-4 bg-white/10 rounded-full p-3 backdrop-blur-sm">
              <img src={match.homeTeam.logo} alt={match.homeTeam.name} className="w-full h-full object-contain" />
            </div>
            <h2 className="text-2xl font-bold mb-2">{match.homeTeam.name}</h2>
            <div className="text-sm opacity-80">Home</div>
          </div>

          <div className="text-center">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 mb-4">
              <div className="text-6xl font-bold mb-2">
                {match.homeTeam.score !== undefined ? match.homeTeam.score : '-'} 
                <span className="text-3xl mx-4">:</span>
                {match.awayTeam.score !== undefined ? match.awayTeam.score : '-'}
              </div>
              <div className="flex items-center justify-center gap-3 mb-2">
                {match.isLive && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-red-200 font-medium">LIVE</span>
                  </div>
                )}
                <span className="text-lg font-semibold">
                  {getStatusDisplay(match.status, match.elapsed)}
                </span>
              </div>
              <div className="text-sm opacity-80">{new Date(match.date).toLocaleTimeString()}</div>
            </div>
          </div>

          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-4 bg-white/10 rounded-full p-3 backdrop-blur-sm">
              <img src={match.awayTeam.logo} alt={match.awayTeam.name} className="w-full h-full object-contain" />
            </div>
            <h2 className="text-2xl font-bold mb-2">{match.awayTeam.name}</h2>
            <div className="text-sm opacity-80">Away</div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Streaming Links */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-blue-500 p-6 text-white">
              <h3 className="text-2xl font-bold flex items-center gap-3">
                <span className="bg-white/20 p-2 rounded-lg">📺</span>
                Watch Live Streams
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                  {mockStreams.length} Available
                </span>
              </h3>
              <p className="mt-2 opacity-90">Choose from verified streaming platforms</p>
            </div>
            
            <div className="p-6 space-y-4">
              {mockStreams.map((stream, index) => (
                <div key={stream.id} className={`group relative overflow-hidden rounded-xl border-2 transition-all duration-300 hover:border-blue-400 hover:shadow-lg ${
                  stream.verified ? 'border-green-200 bg-green-50/50' : 'border-gray-200 bg-gray-50/50'
                }`}>
                  <div className="flex items-center justify-between p-5">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white ${
                          stream.verified ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-gray-400 to-gray-500'
                        }`}>
                          {index + 1}
                        </div>
                        {stream.verified && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-bold text-lg text-gray-900">{stream.name}</h4>
                          {stream.verified && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">VERIFIED</span>}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm">
                          <span className={`px-3 py-1 rounded-lg font-bold text-white ${
                            stream.quality === '4K' ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
                            stream.quality === 'FHD' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                            stream.quality === 'HD' ? 'bg-gradient-to-r from-green-500 to-teal-500' : 
                            'bg-gradient-to-r from-gray-400 to-gray-500'
                          }`}>
                            {stream.quality}
                          </span>
                          
                          <span className="text-gray-600 flex items-center gap-1">
                            <span>🌐</span>
                            {stream.language}
                          </span>
                          
                          <div className="flex items-center gap-1">
                            <span className="text-yellow-500">⭐</span>
                            <span className="font-medium text-gray-700">{stream.rating}</span>
                            <span className="text-gray-500 text-xs">/5</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => window.open(stream.url, '_blank')}
                      className="group-hover:scale-105 transition-all duration-300 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl"
                    >
                      <span className="flex items-center gap-2">
                        <span>▶️</span>
                        Watch Now
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Premium Ad Space */}
            <div className="mx-6 mb-6 p-6 bg-gradient-to-r from-yellow-100 to-orange-100 border-2 border-dashed border-yellow-300 rounded-xl text-center">
              <div className="text-yellow-700 text-sm font-medium mb-2">🎯 Premium Advertisement</div>
              <div className="h-24 bg-gradient-to-r from-yellow-200 to-orange-200 rounded-lg flex items-center justify-center">
                <span className="text-yellow-800 font-bold">728x90 Leaderboard - Streaming Partners</span>
              </div>
            </div>
          </div>

          {/* Match Statistics */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
              <h3 className="text-2xl font-bold flex items-center gap-3">
                <span className="bg-white/20 p-2 rounded-lg">📊</span>
                Match Statistics
                {match.isLive && (
                  <span className="bg-red-500 px-3 py-1 rounded-full text-sm font-bold animate-pulse">
                    LIVE
                  </span>
                )}
              </h3>
              <p className="mt-2 opacity-90">Real-time match performance data</p>
            </div>
            
            {Object.keys(stats).length > 0 ? (
              <div className="p-6 space-y-6">
                {[
                  { label: 'Ball Possession', home: stats.possession?.home || 0, away: stats.possession?.away || 0, unit: '%', icon: '⚽', color: 'from-blue-500 to-cyan-500' },
                  { label: 'Total Shots', home: stats.shots?.home || 0, away: stats.shots?.away || 0, icon: '🎯', color: 'from-green-500 to-emerald-500' },
                  { label: 'Shots on Target', home: stats.shotsOnTarget?.home || 0, away: stats.shotsOnTarget?.away || 0, icon: '🏹', color: 'from-yellow-500 to-orange-500' },
                  { label: 'Corner Kicks', home: stats.corners?.home || 0, away: stats.corners?.away || 0, icon: '📐', color: 'from-purple-500 to-pink-500' },
                  { label: 'Fouls Committed', home: stats.fouls?.home || 0, away: stats.fouls?.away || 0, icon: '⚠️', color: 'from-red-500 to-rose-500' },
                  { label: 'Yellow Cards', home: stats.yellowCards?.home || 0, away: stats.yellowCards?.away || 0, icon: '🟨', color: 'from-yellow-400 to-yellow-600' },
                  { label: 'Red Cards', home: stats.redCards?.home || 0, away: stats.redCards?.away || 0, icon: '🟥', color: 'from-red-600 to-red-800' },
                ].filter(stat => stat.home > 0 || stat.away > 0).map((stat) => (
                  <div key={stat.label} className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-5 border border-gray-100">
                    <div className="flex items-center justify-center mb-4">
                      <div className="flex items-center gap-2 text-lg font-bold text-gray-800">
                        <span className="text-2xl">{stat.icon}</span>
                        {stat.label}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 items-center">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600 mb-1">
                          {stat.home}<span className="text-lg text-gray-500">{stat.unit}</span>
                        </div>
                        <div className="text-sm text-gray-600 font-medium">{match.homeTeam.name}</div>
                      </div>
                      
                      <div className="relative">
                        <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full bg-gradient-to-r ${stat.color} transition-all duration-1000 ease-out`}
                            style={{ 
                              width: `${stat.home + stat.away > 0 ? (stat.home / (stat.home + stat.away)) * 100 : 50}%` 
                            }}
                          ></div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-xs font-bold text-white drop-shadow-lg">
                            {stat.home + stat.away > 0 ? 
                              `${Math.round((stat.home / (stat.home + stat.away)) * 100)}% - ${Math.round((stat.away / (stat.home + stat.away)) * 100)}%` 
                              : '50% - 50%'
                            }
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-3xl font-bold text-red-600 mb-1">
                          {stat.away}<span className="text-lg text-gray-500">{stat.unit}</span>
                        </div>
                        <div className="text-sm text-gray-600 font-medium">{match.awayTeam.name}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="text-6xl mb-4">📈</div>
                <h4 className="text-xl font-bold text-gray-800 mb-2">Statistics Loading...</h4>
                <p className="text-gray-600">
                  {match?.isLive ? 'Live statistics will appear as the match progresses' : 'No statistics available for this match'}
                </p>
              </div>
            )}
          </div>

          {/* Footer Ad - High Value */}
          <div className="bg-gradient-to-r from-green-100 to-blue-100 rounded-xl shadow-lg border-2 border-dashed border-green-300 p-6">
            <div className="text-center">
              <div className="text-green-700 text-sm font-bold mb-3 flex items-center justify-center gap-2">
                <span>🚀</span>
                <span>Sports Analytics Partner</span>
                <span>🚀</span>
              </div>
              <div className="h-32 bg-gradient-to-r from-green-200 to-blue-200 rounded-xl flex items-center justify-center border-2 border-dashed border-green-400">
                <div className="text-center text-green-800">
                  <div className="text-xl font-bold mb-2">728x90 Leaderboard</div>
                  <div className="text-sm">Statistics & Analytics Platform Ad</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Betting Odds */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white">
              <h3 className="text-2xl font-bold flex items-center gap-3">
                <span className="bg-white/20 p-2 rounded-lg">🎯</span>
                Betting Odds
                <span className="bg-red-500 px-3 py-1 rounded-full text-sm font-bold animate-pulse">
                  LIVE
                </span>
              </h3>
              <p className="mt-2 opacity-90">Compare odds from top bookmakers</p>
            </div>
            
            <div className="p-6 space-y-4">
              {mockBetting.map((provider, index) => (
                <div key={provider.provider} className="group bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center font-bold text-white">
                        {provider.provider.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-lg text-gray-900">{provider.provider}</div>
                        <div className="text-sm text-gray-600">Licensed Bookmaker</div>
                      </div>
                    </div>
                    <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                      ⚡ Updated
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-4 bg-white rounded-xl border-2 border-blue-100 hover:border-blue-300 transition-colors cursor-pointer group-hover:scale-105 transform duration-200">
                      <div className="text-xs text-gray-600 mb-1 font-medium">HOME WIN</div>
                      <div className="text-2xl font-bold text-blue-600">{provider.homeWin}</div>
                      <div className="text-xs text-gray-500 mt-1">{match.homeTeam.name}</div>
                    </div>
                    
                    <div className="text-center p-4 bg-white rounded-xl border-2 border-yellow-100 hover:border-yellow-300 transition-colors cursor-pointer group-hover:scale-105 transform duration-200">
                      <div className="text-xs text-gray-600 mb-1 font-medium">DRAW</div>
                      <div className="text-2xl font-bold text-yellow-600">{provider.draw}</div>
                      <div className="text-xs text-gray-500 mt-1">Tie Game</div>
                    </div>
                    
                    <div className="text-center p-4 bg-white rounded-xl border-2 border-red-100 hover:border-red-300 transition-colors cursor-pointer group-hover:scale-105 transform duration-200">
                      <div className="text-xs text-gray-600 mb-1 font-medium">AWAY WIN</div>
                      <div className="text-2xl font-bold text-red-600">{provider.awayWin}</div>
                      <div className="text-xs text-gray-500 mt-1">{match.awayTeam.name}</div>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="mt-6 text-center">
                <button className="group bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  <span className="flex items-center justify-center gap-3">
                    <span className="text-2xl">💰</span>
                    <div>
                      <div>View All Betting Sites</div>
                      <div className="text-xs opacity-90">Compare 15+ Bookmakers</div>
                    </div>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Strategic Ad - High Value */}
          <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl shadow-lg border-2 border-dashed border-purple-300 p-6">
            <div className="text-center">
              <div className="text-purple-700 text-sm font-bold mb-3 flex items-center justify-center gap-2">
                <span>💎</span>
                <span>Premium Betting Partner</span>
                <span>💎</span>
              </div>
              <div className="h-64 bg-gradient-to-br from-purple-200 to-pink-200 rounded-xl flex items-center justify-center border-2 border-dashed border-purple-400">
                <div className="text-center text-purple-800">
                  <div className="text-xl font-bold mb-2">300x250 Medium Rectangle</div>
                  <div className="text-sm">High-Converting Betting Ad Space</div>
                  <div className="text-xs mt-2 opacity-70">Perfect for Sportsbook Promotions</div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Insights */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <span className="bg-white/20 p-2 rounded-lg">💡</span>
                Match Insights
              </h3>
              <p className="mt-2 opacity-90 text-sm">Key information about this fixture</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500 p-2 rounded-lg">
                    <span className="text-white text-lg">⚽</span>
                  </div>
                  <div>
                    <div className="font-bold text-blue-900">Match-up</div>
                    <div className="text-blue-700">{match.homeTeam.name} vs {match.awayTeam.name}</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-xl border border-yellow-200">
                <div className="flex items-center gap-3">
                  <div className="bg-yellow-500 p-2 rounded-lg">
                    <span className="text-white text-lg">🏆</span>
                  </div>
                  <div>
                    <div className="font-bold text-yellow-900">Competition</div>
                    <div className="text-yellow-700">{match.league.name}</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                <div className="flex items-center gap-3">
                  <div className="bg-green-500 p-2 rounded-lg">
                    <span className="text-white text-lg">📍</span>
                  </div>
                  <div>
                    <div className="font-bold text-green-900">Venue</div>
                    <div className="text-green-700">{match.venue}</div>
                  </div>
                </div>
              </div>
              
              {match.isLive && (
                <div className="bg-gradient-to-r from-red-50 to-pink-50 p-4 rounded-xl border border-red-200">
                  <div className="flex items-center gap-3">
                    <div className="bg-red-500 p-2 rounded-lg">
                      <span className="text-white text-lg">🔴</span>
                    </div>
                    <div>
                      <div className="font-bold text-red-900">Live Status</div>
                      <div className="text-red-700">Match is currently in progress</div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-xl border border-purple-200">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-500 p-2 rounded-lg">
                    <span className="text-white text-lg">�</span>
                  </div>
                  <div>
                    <div className="font-bold text-purple-900">Kick-off Time</div>
                    <div className="text-purple-700">{new Date(match.date).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Final CTA Ad */}
          <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl shadow-lg border-2 border-dashed border-indigo-300 p-6">
            <div className="text-center">
              <div className="text-indigo-700 text-sm font-bold mb-3 flex items-center justify-center gap-2">
                <span>⭐</span>
                <span>Premium Sports Content</span>
                <span>⭐</span>
              </div>
              <div className="h-48 bg-gradient-to-br from-indigo-200 to-purple-200 rounded-xl flex items-center justify-center border-2 border-dashed border-indigo-400">
                <div className="text-center text-indigo-800">
                  <div className="text-xl font-bold mb-2">320x250 Large Rectangle</div>
                  <div className="text-sm">Sports News & Content Platform</div>
                  <div className="text-xs mt-2 opacity-70">Perfect for Engagement</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}