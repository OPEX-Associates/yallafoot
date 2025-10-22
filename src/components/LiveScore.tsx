"use client";

import { useState, useEffect } from "react";
import { MatchWithStreams, Match } from "@/types/football";
import { FootballAPI } from "@/lib/footballAPI";

interface LiveScoreProps {
  match: MatchWithStreams;
}

export default function LiveScore({ match }: LiveScoreProps) {
  const [liveMatch, setLiveMatch] = useState<Match | null>(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    // Check if match is currently live
    const isMatchLive = match.fixture.status.short === "1H" || 
                       match.fixture.status.short === "2H" || 
                       match.fixture.status.short === "HT";
    
    setIsLive(isMatchLive);
    setLiveMatch(match);

    // Set up live updates if match is live
    let interval: NodeJS.Timeout;
    if (isMatchLive) {
      interval = setInterval(async () => {
        try {
          const updatedMatch = await FootballAPI.getLiveScore(match.fixture.id.toString());
          if (updatedMatch) {
            setLiveMatch(updatedMatch);
          }
        } catch (error) {
          console.error("Failed to update live score:", error);
        }
      }, 30000); // Update every 30 seconds
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [match]);

  const currentMatch = liveMatch || match;

  const getStatusDisplay = () => {
    const status = currentMatch.fixture.status;
    
    if (status.short === "1H" || status.short === "2H") {
      return {
        text: `${status.elapsed}'`,
        class: "bg-red-500 text-white animate-pulse",
        isLive: true
      };
    }
    
    if (status.short === "HT") {
      return {
        text: "Half Time",
        class: "bg-orange-500 text-white",
        isLive: true
      };
    }
    
    if (status.short === "FT") {
      return {
        text: "Full Time",
        class: "bg-gray-500 text-white",
        isLive: false
      };
    }
    
    if (status.short === "NS") {
      const kickoffTime = new Date(currentMatch.fixture.timestamp * 1000).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      return {
        text: `Kicks off at ${kickoffTime}`,
        class: "bg-blue-500 text-white",
        isLive: false
      };
    }

    return {
      text: status.long,
      class: "bg-gray-500 text-white",
      isLive: false
    };
  };

  const statusInfo = getStatusDisplay();

  return (
    <div className="text-center">
      {/* Live Status */}
      <div className="mb-6">
        <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${statusInfo.class}`}>
          {statusInfo.isLive && (
            <span className="inline-block w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
          )}
          {statusInfo.text}
        </span>
      </div>

      {/* Teams and Score */}
      <div className="flex items-center justify-center space-x-8 mb-6">
        {/* Home Team */}
        <div className="flex flex-col items-center space-y-3 flex-1 max-w-xs">
          <img 
            src={currentMatch.teams.home.logo} 
            alt={currentMatch.teams.home.name}
            className="w-16 h-16 md:w-20 md:h-20 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder-team.png';
            }}
          />
          <h3 className="text-lg md:text-xl font-bold text-gray-900 text-center">
            {currentMatch.teams.home.name}
          </h3>
        </div>

        {/* Score */}
        <div className="text-center">
          {currentMatch.goals.home !== null && currentMatch.goals.away !== null ? (
            <div className="text-4xl md:text-6xl font-bold text-gray-900 mb-2">
              {currentMatch.goals.home} - {currentMatch.goals.away}
            </div>
          ) : (
            <div className="text-2xl md:text-4xl font-bold text-gray-500 mb-2">
              - : -
            </div>
          )}
          
          {/* Half Time Score */}
          {currentMatch.score.halftime.home !== null && currentMatch.score.halftime.away !== null && (
            <div className="text-sm text-gray-500">
              HT: {currentMatch.score.halftime.home} - {currentMatch.score.halftime.away}
            </div>
          )}
        </div>

        {/* Away Team */}
        <div className="flex flex-col items-center space-y-3 flex-1 max-w-xs">
          <img 
            src={currentMatch.teams.away.logo} 
            alt={currentMatch.teams.away.name}
            className="w-16 h-16 md:w-20 md:h-20 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder-team.png';
            }}
          />
          <h3 className="text-lg md:text-xl font-bold text-gray-900 text-center">
            {currentMatch.teams.away.name}
          </h3>
        </div>
      </div>

      {/* Live Updates Indicator */}
      {isLive && (
        <div className="text-xs text-gray-500 mb-4">
          <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
          Live updates every 30 seconds
        </div>
      )}

      {/* Match Events (if available) */}
      {statusInfo.isLive && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Match Events</h4>
          <div className="text-sm text-gray-600">
            Live events will appear here...
          </div>
        </div>
      )}
    </div>
  );
}