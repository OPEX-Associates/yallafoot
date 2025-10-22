"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LiveScore from "@/components/LiveScore";
import StreamsList from "@/components/StreamsList";
import { MatchWithStreams } from "@/types/football";
import { FootballAPI } from "@/lib/footballAPI";

interface MatchDetailsProps {
  matchId: string;
}

export default function MatchDetails({ matchId }: MatchDetailsProps) {
  const [match, setMatch] = useState<MatchWithStreams | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchMatch() {
      try {
        setLoading(true);
        const matchData = await FootballAPI.getMatchById(matchId);
        
        if (!matchData) {
          setError("Match not found");
          return;
        }
        
        setMatch(matchData);
      } catch (err) {
        setError("Failed to load match details");
        console.error("Error fetching match:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchMatch();
  }, [matchId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex justify-center items-center py-24">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
          <span className="ml-4 text-lg text-gray-600">Loading match details...</span>
        </div>
        <Footer />
      </main>
    );
  }

  if (error || !match) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="text-center py-24">
          <div className="text-red-600 text-xl mb-6">{error || "Match not found"}</div>
          <button 
            onClick={() => router.back()}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Go Back
          </button>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Match Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="text-center mb-6">
            <div className="text-sm text-primary-600 font-semibold mb-2">
              {match.league.name} • {match.fixture.venue.name}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {match.teams.home.name} vs {match.teams.away.name}
            </h1>
          </div>

          <LiveScore match={match} />
        </div>

        {/* Streams Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <StreamsList streams={match.streams} />
          </div>
          
          <div className="lg:col-span-1">
            <MatchInfo match={match} />
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Important:</strong> YallaFoot does not host any streams. All links are provided by third-party users. 
                Please ensure you comply with local laws and consider using official broadcasters when available.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}

function MatchInfo({ match }: { match: MatchWithStreams }) {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Match Information</h3>
      
      <div className="space-y-4">
        <div>
          <dt className="text-sm font-medium text-gray-500">Date & Time</dt>
          <dd className="mt-1 text-sm text-gray-900">
            {formatDate(match.fixture.timestamp)}<br />
            {formatTime(match.fixture.timestamp)}
          </dd>
        </div>

        <div>
          <dt className="text-sm font-medium text-gray-500">Venue</dt>
          <dd className="mt-1 text-sm text-gray-900">
            {match.fixture.venue.name}<br />
            <span className="text-gray-600">{match.fixture.venue.city}</span>
          </dd>
        </div>

        {match.fixture.referee && (
          <div>
            <dt className="text-sm font-medium text-gray-500">Referee</dt>
            <dd className="mt-1 text-sm text-gray-900">{match.fixture.referee}</dd>
          </div>
        )}

        <div>
          <dt className="text-sm font-medium text-gray-500">League</dt>
          <dd className="mt-1 text-sm text-gray-900 flex items-center">
            <img 
              src={match.league.logo} 
              alt={match.league.name}
              className="w-5 h-5 mr-2"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            {match.league.name}
          </dd>
        </div>

        <div>
          <dt className="text-sm font-medium text-gray-500">Status</dt>
          <dd className="mt-1 text-sm text-gray-900">{match.fixture.status.long}</dd>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-500">Available Streams</span>
            <span className="text-lg font-bold text-primary-600">{match.streamCount}</span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm font-medium text-gray-500">Average Rating</span>
            <span className="text-lg font-bold text-yellow-500">⭐ {match.averageRating.toFixed(1)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}