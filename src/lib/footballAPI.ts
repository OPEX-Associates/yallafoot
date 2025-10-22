import { Match, MatchWithStreams, Stream } from '@/types/football';

// Football-Data.org API (Free tier: 10 requests/minute, 12 competitions)
// Get your free API key from: https://www.football-data.org/client/register
const API_KEY = process.env.NEXT_PUBLIC_FOOTBALL_DATA_API_KEY || 'YOUR_API_KEY_HERE';
const API_BASE = 'https://api.football-data.org/v4';
const CORS_PROXY = process.env.NEXT_PUBLIC_CORS_PROXY || '';

const headers = {
  'X-Auth-Token': API_KEY
};

// Check if we're in production (Netlify) or development
const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
const NETLIFY_FUNCTION_URL = '/.netlify/functions/matches';

// Helper function to create API URL with CORS proxy for development
function createApiUrl(endpoint: string): string {
  if (isProduction) {
    return `${API_BASE}${endpoint}`;
  } else {
    // Use CORS proxy for development to bypass CORS restrictions
    return `${CORS_PROXY}${encodeURIComponent(`${API_BASE}${endpoint}`)}`;
  }
}

export class FootballAPI {
  static async getYesterdayMatches(): Promise<Match[]> {
    try {
      console.log('� Loading yesterday matches from daily data...');
      
      const response = await fetch('/.netlify/functions/matches?type=yesterday');
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Yesterday matches from API:', data.count);
        
        if (data.matches && data.matches.length > 0) {
          return this.transformFootballDataMatches(data.matches);
        }
      }
      
      console.log('📦 No matches found for yesterday');
      return [];
    } catch (error) {
      console.error('❌ Error loading yesterday matches:', error);
      return [];
    }
  }

  static async getTodayMatches(): Promise<Match[]> {
    try {
      console.log('� Loading today matches from daily data...');
      
      const response = await fetch('/.netlify/functions/matches?type=today');
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Today matches from API:', data.count);
        
        if (data.matches && data.matches.length > 0) {
          return this.transformFootballDataMatches(data.matches);
        }
      }
      
      console.log('📦 No matches found for today');
      return [];
    } catch (error) {
      console.error('❌ Error loading today matches:', error);
      return [];
    }
  }

  static async getTomorrowMatches(): Promise<Match[]> {
    try {
      console.log('� Loading tomorrow matches from daily data...');
      
      const response = await fetch('/.netlify/functions/matches?type=tomorrow');
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Tomorrow matches from API:', data.count);
        
        if (data.matches && data.matches.length > 0) {
          return this.transformFootballDataMatches(data.matches);
        }
      }
      
      console.log('📦 No matches found for tomorrow');
      return [];
    } catch (error) {
      console.error('❌ Error loading tomorrow matches:', error);
      return [];
    }
  }

  // Get matches from specific major competitions
  static async getMajorCompetitionMatches(days: number = 7): Promise<Match[]> {
    try {
      console.log('🏆 Loading major competition matches from daily data...');
      
      const response = await fetch('/.netlify/functions/matches?type=major');
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Major competition matches from API:', data.count);
        
        if (data.matches && data.matches.length > 0) {
          return this.transformFootballDataMatches(data.matches);
        }
      }
      
      console.log('📦 No major competition matches found');
      return [];
    } catch (error) {
      console.error('❌ Error loading major competition matches:', error);
      return [];
    }
  }

  static async getMatchById(matchId: string): Promise<MatchWithStreams | null> {
    try {
      const response = await fetch(
        `${API_BASE}/matches/${matchId}`,
        { headers }
      );
      
      if (!response.ok) {
        console.warn('API request failed');
        return null;
      }
      
      const data = await response.json();
      const match = this.transformFootballDataMatch(data);
      
      if (!match) return null;

      // Add mock streams data
      const streams = this.getMockStreams();
      
      return {
        ...match,
        streams,
        streamCount: streams.length,
        averageRating: streams.reduce((sum, stream) => sum + stream.rating, 0) / streams.length
      };
    } catch (error) {
      console.error('Error fetching match:', error);
      return null;
    }
  }

  static async getLiveScore(matchId: string): Promise<Match | null> {
    try {
      const response = await fetch(
        `${API_BASE}/matches/${matchId}`,
        { headers }
      );
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      return this.transformFootballDataMatch(data);
    } catch (error) {
      console.error('Error fetching live score:', error);
      return null;
    }
  }

  // Transform Football-Data.org API response to our format
  static transformFootballDataMatches(matches: any[]): Match[] {
    return matches.map(match => this.transformFootballDataMatch(match)).filter(Boolean);
  }

  static transformFootballDataMatch(match: any): Match {
    return {
      fixture: {
        id: match.id,
        referee: match.referees?.[0]?.name || null,
        timezone: "UTC",
        date: match.utcDate,
        timestamp: new Date(match.utcDate).getTime() / 1000,
        status: {
          long: this.getStatusLong(match.status),
          short: this.getStatusShort(match.status),
          elapsed: match.minute || null
        },
        venue: {
          id: match.id,
          name: match.venue || "TBD",
          city: match.area?.name || "TBD"
        }
      },
      league: {
        id: match.competition.id,
        name: match.competition.name,
        country: match.area?.name || match.competition.area?.name || "International",
        logo: match.competition.emblem || "",
        flag: match.area?.flag || "",
        season: match.season?.currentMatchday || new Date().getFullYear()
      },
      teams: {
        home: {
          id: match.homeTeam.id,
          name: match.homeTeam.name,
          logo: match.homeTeam.crest || "",
          country: match.area?.name || ""
        },
        away: {
          id: match.awayTeam.id,
          name: match.awayTeam.name,
          logo: match.awayTeam.crest || "",
          country: match.area?.name || ""
        }
      },
      goals: {
        home: match.score?.fullTime?.home ?? null,
        away: match.score?.fullTime?.away ?? null
      },
      score: {
        halftime: {
          home: match.score?.halfTime?.home ?? null,
          away: match.score?.halfTime?.away ?? null
        },
        fulltime: {
          home: match.score?.fullTime?.home ?? null,
          away: match.score?.fullTime?.away ?? null
        },
        extratime: {
          home: match.score?.extraTime?.home ?? null,
          away: match.score?.extraTime?.away ?? null
        },
        penalty: {
          home: match.score?.penalties?.home ?? null,
          away: match.score?.penalties?.away ?? null
        }
      }
    };
  }

  static getStatusLong(status: string): string {
    const statusMap: { [key: string]: string } = {
      'TIMED': 'Not Started',
      'SCHEDULED': 'Not Started',
      'IN_PLAY': 'In Play',
      'PAUSED': 'Half Time',
      'FINISHED': 'Match Finished',
      'SUSPENDED': 'Suspended',
      'POSTPONED': 'Postponed',
      'CANCELLED': 'Cancelled',
      'AWARDED': 'Awarded'
    };
    return statusMap[status] || status;
  }

  static getStatusShort(status: string): string {
    const statusMap: { [key: string]: string } = {
      'TIMED': 'NS',
      'SCHEDULED': 'NS',
      'IN_PLAY': '1H',
      'PAUSED': 'HT',
      'FINISHED': 'FT',
      'SUSPENDED': 'SUSP',
      'POSTPONED': 'PP',
      'CANCELLED': 'CANC',
      'AWARDED': 'AWD'
    };
    return statusMap[status] || 'NS';
  }

  // Mock data for development/fallback
  static getMockYesterdayMatches(): Match[] {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    return [
      {
        fixture: {
          id: 100,
          referee: "Stephanie Frappart",
          timezone: "UTC",
          date: yesterday.toISOString(),
          timestamp: yesterday.getTime() / 1000,
          status: { long: "Match Finished", short: "FT", elapsed: 90 },
          venue: { id: 100, name: "Santiago Bernabéu", city: "Madrid" }
        },
        league: {
          id: 140,
          name: "La Liga",
          country: "Spain",
          logo: "https://media.api-sports.io/football/leagues/140.png",
          flag: "https://media.api-sports.io/flags/es.svg",
          season: 2024
        },
        teams: {
          home: { id: 541, name: "Real Madrid", logo: "https://media.api-sports.io/football/teams/541.png", country: "Spain" },
          away: { id: 529, name: "Barcelona", logo: "https://media.api-sports.io/football/teams/529.png", country: "Spain" }
        },
        goals: { home: 3, away: 1 },
        score: {
          halftime: { home: 2, away: 0 },
          fulltime: { home: 3, away: 1 },
          extratime: { home: null, away: null },
          penalty: { home: null, away: null }
        }
      },
      {
        fixture: {
          id: 101,
          referee: "Björn Kuipers",
          timezone: "UTC",
          date: yesterday.toISOString(),
          timestamp: yesterday.getTime() / 1000,
          status: { long: "Match Finished", short: "FT", elapsed: 90 },
          venue: { id: 101, name: "Allianz Arena", city: "Munich" }
        },
        league: {
          id: 2,
          name: "Champions League",
          country: "Europe",
          logo: "https://media.api-sports.io/football/leagues/2.png",
          flag: "https://media.api-sports.io/flags/eu.svg",
          season: 2024
        },
        teams: {
          home: { id: 157, name: "Bayern Munich", logo: "https://media.api-sports.io/football/teams/157.png", country: "Germany" },
          away: { id: 85, name: "Paris Saint Germain", logo: "https://media.api-sports.io/football/teams/85.png", country: "France" }
        },
        goals: { home: 2, away: 2 },
        score: {
          halftime: { home: 1, away: 1 },
          fulltime: { home: 2, away: 2 },
          extratime: { home: null, away: null },
          penalty: { home: null, away: null }
        }
      }
    ];
  }

  static getMockTodayMatches(): Match[] {
    return [
      {
        fixture: {
          id: 1,
          referee: "Michael Oliver",
          timezone: "UTC",
          date: new Date().toISOString(),
          timestamp: Date.now() / 1000,
          status: { long: "Match Finished", short: "FT", elapsed: 90 },
          venue: { id: 1, name: "Etihad Stadium", city: "Manchester" }
        },
        league: {
          id: 39,
          name: "Premier League",
          country: "England",
          logo: "https://media.api-sports.io/football/leagues/39.png",
          flag: "https://media.api-sports.io/flags/gb.svg",
          season: 2024
        },
        teams: {
          home: { id: 50, name: "Manchester City", logo: "https://media.api-sports.io/football/teams/50.png", country: "England" },
          away: { id: 40, name: "Liverpool", logo: "https://media.api-sports.io/football/teams/40.png", country: "England" }
        },
        goals: { home: 2, away: 1 },
        score: {
          halftime: { home: 1, away: 0 },
          fulltime: { home: 2, away: 1 },
          extratime: { home: null, away: null },
          penalty: { home: null, away: null }
        }
      }
    ];
  }

  static getMockTomorrowMatches(): Match[] {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return [
      {
        fixture: {
          id: 2,
          referee: "Antonio Mateu",
          timezone: "UTC",
          date: tomorrow.toISOString(),
          timestamp: tomorrow.getTime() / 1000,
          status: { long: "Not Started", short: "NS", elapsed: null },
          venue: { id: 2, name: "Camp Nou", city: "Barcelona" }
        },
        league: {
          id: 140,
          name: "La Liga",
          country: "Spain",
          logo: "https://media.api-sports.io/football/leagues/140.png",
          flag: "https://media.api-sports.io/flags/es.svg",
          season: 2024
        },
        teams: {
          home: { id: 529, name: "Barcelona", logo: "https://media.api-sports.io/football/teams/529.png", country: "Spain" },
          away: { id: 541, name: "Real Madrid", logo: "https://media.api-sports.io/football/teams/541.png", country: "Spain" }
        },
        goals: { home: null, away: null },
        score: {
          halftime: { home: null, away: null },
          fulltime: { home: null, away: null },
          extratime: { home: null, away: null },
          penalty: { home: null, away: null }
        }
      }
    ];
  }

  static getMockStreams(): Stream[] {
    return [
      {
        id: "1",
        name: "HD Stream 1",
        url: "#",
        quality: "HD",
        language: "English",
        rating: 4.8,
        viewers: 15420,
        isWorking: true,
        submittedBy: "StreamMaster",
        submittedAt: new Date().toISOString()
      },
      {
        id: "2",
        name: "Full HD Stream",
        url: "#",
        quality: "Full HD",
        language: "English",
        rating: 4.9,
        viewers: 22180,
        isWorking: true,
        submittedBy: "FootballFan",
        submittedAt: new Date().toISOString()
      },
      {
        id: "3",
        name: "Spanish Commentary",
        url: "#",
        quality: "HD",
        language: "Spanish",
        rating: 4.3,
        viewers: 8930,
        isWorking: true,
        submittedBy: "LaLigaWatcher",
        submittedAt: new Date().toISOString()
      }
    ];
  }

  static getMockMatchWithStreams(matchId: string): MatchWithStreams {
    const streams = this.getMockStreams();
    const mockMatch = this.getMockTodayMatches()[0];
    
    return {
      ...mockMatch,
      fixture: { ...mockMatch.fixture, id: parseInt(matchId) },
      streams,
      streamCount: streams.length,
      averageRating: streams.reduce((sum, stream) => sum + stream.rating, 0) / streams.length
    };
  }
}