"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Match } from "@/types/football";
import { FootballAPI } from "@/lib/footballAPI";

export default function MatchesList() {
  const [yesterdayMatches, setYesterdayMatches] = useState<Match[]>([]);
  const [todayMatches, setTodayMatches] = useState<Match[]>([]);
  const [tomorrowMatches, setTomorrowMatches] = useState<Match[]>([]);
  const [majorMatches, setMajorMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMatches() {
      try {
        setLoading(true);
        
        // Log API status
        console.log('🔄 Fetching live football data...');
        
        const [yesterday, today, tomorrow, major] = await Promise.all([
          FootballAPI.getYesterdayMatches(),
          FootballAPI.getTodayMatches(),
          FootballAPI.getTomorrowMatches(),
          FootballAPI.getMajorCompetitionMatches(3) // Last 3 days of major competitions
        ]);
        
        console.log('📊 Data Summary:');
        console.log('Yesterday:', yesterday.length, 'matches');
        console.log('Today:', today.length, 'matches');
        console.log('Tomorrow:', tomorrow.length, 'matches');
        console.log('Major competitions:', major.length, 'matches');
        
        setYesterdayMatches(yesterday);
        setTodayMatches(today);
        setTomorrowMatches(tomorrow);
        setMajorMatches(major);
      } catch (err) {
        setError("Failed to load matches. Please try again later.");
        console.error("Error fetching matches:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchMatches();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <span className="ml-3 text-gray-600">Loading matches...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const liveMatches = todayMatches.filter(match => 
    match.fixture.status.short === "1H" || 
    match.fixture.status.short === "2H" || 
    match.fixture.status.short === "HT"
  );

  const upcomingTodayMatches = todayMatches.filter(match => 
    match.fixture.status.short === "NS"
  );

  const finishedYesterdayMatches = yesterdayMatches.filter(match =>
    match.fixture.status.short === "FT"
  );

  // Get unique major competitions from recent matches
  const recentMajorMatches = majorMatches
    .filter(match => match.fixture.status.short === "FT")
    .slice(0, 12); // Show latest 12 major matches

  return (
    <div className="space-y-12">
      {/* API Status Indicator */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
          <span className="text-green-800 font-medium">
            Live Data Connected - Football-Data.org API
          </span>
          <span className="ml-auto text-sm text-green-600">
            {(yesterdayMatches.length + todayMatches.length + tomorrowMatches.length)} matches loaded
          </span>
        </div>
      </div>

      {/* Live Matches */}
      {liveMatches.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="w-3 h-3 bg-red-500 rounded-full mr-3 animate-pulse"></span>
            Live Now ({liveMatches.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {liveMatches.map((match) => (
              <MatchCard key={match.fixture.id} match={match} isLive={true} />
            ))}
          </div>
        </section>
      )}

      {/* Today's Upcoming Matches */}
      {upcomingTodayMatches.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Today&apos;s Matches ({upcomingTodayMatches.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingTodayMatches.map((match) => (
              <MatchCard key={match.fixture.id} match={match} isLive={false} />
            ))}
          </div>
        </section>
      )}

      {/* Tomorrow's Matches */}
      {tomorrowMatches.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Tomorrow&apos;s Matches ({tomorrowMatches.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tomorrowMatches.map((match) => (
              <MatchCard key={match.fixture.id} match={match} isLive={false} />
            ))}
          </div>
        </section>
      )}

      {/* Yesterday's Results */}
      {finishedYesterdayMatches.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Yesterday&apos;s Results ({finishedYesterdayMatches.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {finishedYesterdayMatches.map((match) => (
              <MatchCard key={match.fixture.id} match={match} isLive={false} />
            ))}
          </div>
        </section>
      )}

      {/* Recent Major Competitions */}
      {recentMajorMatches.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            🏆 Recent Major Competitions ({recentMajorMatches.length})
          </h2>
          <div className="text-sm text-gray-600 mb-4">
            Champions League • Europa League • Premier League • La Liga • Serie A • Bundesliga
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentMajorMatches.map((match) => (
              <MatchCard key={match.fixture.id} match={match} isLive={false} />
            ))}
          </div>
        </section>
      )}

      {/* No Matches Found */}
      {yesterdayMatches.length === 0 && todayMatches.length === 0 && tomorrowMatches.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-600 mb-4">No matches found for the selected dates.</div>
          <p className="text-sm text-gray-500">Check back later for updated fixtures.</p>
        </div>
      )}
    </div>
  );
}

interface MatchCardProps {
  match: Match;
  isLive: boolean;
}

function MatchCard({ match, isLive }: MatchCardProps) {
  const getStatusDisplay = () => {
    if (isLive) {
      return {
        text: `${match.fixture.status.elapsed}'`,
        class: "bg-red-500 text-white animate-pulse"
      };
    }
    
    if (match.fixture.status.short === "FT") {
      return {
        text: "FINISHED",
        class: "bg-gray-500 text-white"
      };
    }
    
    return {
      text: "UPCOMING",
      class: "bg-blue-500 text-white"
    };
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const status = getStatusDisplay();

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border">
      <div className="flex justify-between items-start mb-4">
        <div className="text-sm text-primary-600 font-semibold">{match.league.name}</div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.class}`}>
          {status.text}
        </span>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <img 
            src={match.teams.home.logo} 
            alt={match.teams.home.name}
            className="w-8 h-8 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder-team.png';
            }}
          />
          <span className="font-medium text-sm">{match.teams.home.name}</span>
        </div>
        
        <div className="text-center px-4">
          {match.goals.home !== null && match.goals.away !== null ? (
            <div className="text-xl font-bold text-gray-900">
              {match.goals.home} - {match.goals.away}
            </div>
          ) : (
            <div className="text-sm text-gray-600">
              {formatTime(match.fixture.timestamp)}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <span className="font-medium text-sm">{match.teams.away.name}</span>
          <img 
            src={match.teams.away.logo} 
            alt={match.teams.away.name}
            className="w-8 h-8 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder-team.png';
            }}
          />
        </div>
      </div>

      <div className="text-center mb-4">
        <div className="text-xs text-gray-500">{match.fixture.venue.name}</div>
      </div>

      <Link
        href={`/match/${match.fixture.id}`}
        className="block w-full bg-primary-600 text-white text-center py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
      >
        {isLive ? "Watch Live" : "View Streams"}
      </Link>
    </div>
  );
}