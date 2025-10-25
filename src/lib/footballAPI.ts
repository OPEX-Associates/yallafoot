import { Match, MatchWithStreams, Stream } from '@/types/football';

// YallaFoot PHP API Configuration
const PHP_API_BASE = process.env.NEXT_PUBLIC_PHP_API_BASE || 'https://football.opex.associates/api';
const PHP_API_KEY = process.env.NEXT_PUBLIC_PHP_API_KEY || 'yf_prod_b5f603e5da167f0e69f3902b644f66171c3197f34426fe9b3217c11375f354ca';

const headers = {
  'X-API-Key': PHP_API_KEY,
  'Content-Type': 'application/json'
};

// Helper function to create PHP API URL
function createPhpApiUrl(endpoint: string, type?: string): string {
  const params = new URLSearchParams();
  params.append('endpoint', endpoint);
  if (type) {
    params.append('type', type);
  }
  return `${PHP_API_BASE}/index.php?${params.toString()}`;
}

export class FootballAPI {
  static async getYesterdayMatches(): Promise<Match[]> {
    try {
      console.log('📅 Loading yesterday matches from PHP API...');
      
      const response = await fetch(createPhpApiUrl('matches', 'yesterday'), {
        headers,
        method: 'GET'
      });
      
      if (response.ok) {
        // Clean response to handle PHP errors/warnings
        const responseText = await response.text();
        const cleanJsonText = responseText
          .replace(/<br\s*\/?>/gi, '')
          .replace(/<b>.*?<\/b>/gi, '')
          .replace(/Warning:.*?on line.*?\n/gi, '')
          .replace(/Notice:.*?on line.*?\n/gi, '')
          .trim();
        
        const jsonStart = cleanJsonText.indexOf('{');
        const actualJson = jsonStart >= 0 ? cleanJsonText.substring(jsonStart) : cleanJsonText;
        
        const data = JSON.parse(actualJson);
        console.log('✅ Yesterday matches from PHP API:', data.meta?.total || 0);
        
        if (data.success && data.data && data.data.length > 0) {
          return this.transformPhpApiMatches(data.data);
        }
      } else {
        console.warn('❌ PHP API request failed:', response.status, response.statusText);
      }
      
      console.log('📦 No matches found for yesterday, using mock data');
      return this.getMockYesterdayMatches();
    } catch (error) {
      console.error('❌ Error loading yesterday matches:', error);
      return this.getMockYesterdayMatches();
    }
  }

  static async getTodayMatches(): Promise<Match[]> {
    try {
      console.log('📅 Loading today matches from PHP API...');
      
      const response = await fetch(createPhpApiUrl('matches', 'today'), {
        headers,
        method: 'GET'
      });
      
      if (response.ok) {
        // Clean response to handle PHP errors/warnings
        const responseText = await response.text();
        const cleanJsonText = responseText
          .replace(/<br\s*\/?>/gi, '')
          .replace(/<b>.*?<\/b>/gi, '')
          .replace(/Warning:.*?on line.*?\n/gi, '')
          .replace(/Notice:.*?on line.*?\n/gi, '')
          .trim();
        
        const jsonStart = cleanJsonText.indexOf('{');
        const actualJson = jsonStart >= 0 ? cleanJsonText.substring(jsonStart) : cleanJsonText;
        
        const data = JSON.parse(actualJson);
        console.log('✅ Today matches from PHP API:', data.meta?.total || 0);
        
        if (data.success && data.data && data.data.length > 0) {
          return this.transformPhpApiMatches(data.data);
        }
      } else {
        console.warn('❌ PHP API request failed:', response.status, response.statusText);
      }
      
      console.log('📦 No matches found for today, using mock data');
      return this.getMockTodayMatches();
    } catch (error) {
      console.error('❌ Error loading today matches:', error);
      return this.getMockTodayMatches();
    }
  }

  static async getTomorrowMatches(): Promise<Match[]> {
    try {
      console.log('📅 Loading tomorrow matches from PHP API...');
      
      const response = await fetch(createPhpApiUrl('matches', 'tomorrow'), {
        headers,
        method: 'GET'
      });
      
      if (response.ok) {
        // Clean response to handle PHP errors/warnings
        const responseText = await response.text();
        const cleanJsonText = responseText
          .replace(/<br\s*\/?>/gi, '')
          .replace(/<b>.*?<\/b>/gi, '')
          .replace(/Warning:.*?on line.*?\n/gi, '')
          .replace(/Notice:.*?on line.*?\n/gi, '')
          .trim();
        
        const jsonStart = cleanJsonText.indexOf('{');
        const actualJson = jsonStart >= 0 ? cleanJsonText.substring(jsonStart) : cleanJsonText;
        
        const data = JSON.parse(actualJson);
        console.log('✅ Tomorrow matches from PHP API:', data.meta?.total || 0);
        
        if (data.success && data.data && data.data.length > 0) {
          return this.transformPhpApiMatches(data.data);
        }
      } else {
        console.warn('❌ PHP API request failed:', response.status, response.statusText);
      }
      
      console.log('📦 No matches found for tomorrow, using mock data');
      return this.getMockTomorrowMatches();
    } catch (error) {
      console.error('❌ Error loading tomorrow matches:', error);
      return this.getMockTomorrowMatches();
    }
  }

  // Get matches from specific major competitions
  static async getMajorCompetitionMatches(days: number = 7): Promise<Match[]> {
    try {
      console.log('🏆 Loading major competition matches from PHP API...');
      
      const response = await fetch(createPhpApiUrl('matches', 'live'), {
        headers,
        method: 'GET'
      });
      
      if (response.ok) {
        // Clean response to handle PHP errors/warnings
        const responseText = await response.text();
        const cleanJsonText = responseText
          .replace(/<br\s*\/?>/gi, '')
          .replace(/<b>.*?<\/b>/gi, '')
          .replace(/Warning:.*?on line.*?\n/gi, '')
          .replace(/Notice:.*?on line.*?\n/gi, '')
          .trim();
        
        const jsonStart = cleanJsonText.indexOf('{');
        const actualJson = jsonStart >= 0 ? cleanJsonText.substring(jsonStart) : cleanJsonText;
        
        const data = JSON.parse(actualJson);
        console.log('✅ Major competition matches from PHP API:', data.meta?.total || 0);
        
        if (data.success && data.data && data.data.length > 0) {
          // Filter for major competitions only
          const majorMatches = data.data.filter((match: any) => 
            this.isMajorCompetition(match.league?.name || '')
          );
          return this.transformPhpApiMatches(majorMatches);
        }
      } else {
        console.warn('❌ PHP API request failed:', response.status, response.statusText);
      }
      
      console.log('📦 No major competition matches found, using mock data');
      return [];
    } catch (error) {
      console.error('❌ Error loading major competition matches:', error);
      return [];
    }
  }

  static async getMatchById(matchId: string): Promise<MatchWithStreams | null> {
    try {
      // For individual matches, we'll use the mock data for now
      // In the future, you could add a specific endpoint for single matches
      console.log('🔍 Loading individual match (using mock data for now)');
      
      const streams = this.getMockStreams();
      const mockMatch = this.getMockTodayMatches()[0];
      
      return {
        ...mockMatch,
        fixture: { ...mockMatch.fixture, id: parseInt(matchId) },
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
      // For live scores, we'll use the mock data for now
      console.log('📡 Loading live score (using mock data for now)');
      const mockMatch = this.getMockTodayMatches()[0];
      return {
        ...mockMatch,
        fixture: { ...mockMatch.fixture, id: parseInt(matchId) }
      };
    } catch (error) {
      console.error('Error fetching live score:', error);
      return null;
    }
  }

  // Transform PHP API response to our frontend format
  static transformPhpApiMatches(matches: any[]): Match[] {
    return matches.map(match => this.transformPhpApiMatch(match)).filter(Boolean);
  }

  static transformPhpApiMatch(match: any): Match {
    return {
      fixture: {
        id: match.id || 0,
        referee: match.referee || null,
        timezone: "UTC",
        date: match.date || new Date().toISOString(),
        timestamp: new Date(match.date || Date.now()).getTime() / 1000,
        status: {
          long: match.statusText || "Unknown",
          short: match.status || "NS",
          elapsed: match.elapsed || null
        },
        venue: {
          id: match.id || 0,
          name: match.venue || "TBD",
          city: match.venue || "TBD"
        }
      },
      league: {
        id: match.league?.id || 0,
        name: match.league?.name || "Unknown League",
        country: match.league?.country || "Unknown",
        logo: match.league?.logo || "",
        flag: match.league?.flag || "",
        season: new Date().getFullYear()
      },
      teams: {
        home: {
          id: match.homeTeam?.id || 0,
          name: match.homeTeam?.name || "Home Team",
          logo: match.homeTeam?.logo || "",
          country: match.league?.country || ""
        },
        away: {
          id: match.awayTeam?.id || 0,
          name: match.awayTeam?.name || "Away Team",
          logo: match.awayTeam?.logo || "",
          country: match.league?.country || ""
        }
      },
      goals: {
        home: match.score?.home ?? null,
        away: match.score?.away ?? null
      },
      score: {
        halftime: {
          home: match.score?.home ?? null,
          away: match.score?.away ?? null
        },
        fulltime: {
          home: match.score?.home ?? null,
          away: match.score?.away ?? null
        },
        extratime: {
          home: null,
          away: null
        },
        penalty: {
          home: null,
          away: null
        }
      }
    };
  }

  // Helper to identify major competitions
  static isMajorCompetition(leagueName: string): boolean {
    const majorLeagues = [
      'Premier League',
      'La Liga', 
      'Serie A',
      'Bundesliga',
      'Ligue 1',
      'Champions League',
      'Europa League',
      'World Cup',
      'Euro Championship'
    ];
    
    return majorLeagues.some(league => 
      leagueName.toLowerCase().includes(league.toLowerCase())
    );
  }

  // Legacy transformation methods for backwards compatibility
  static transformFootballDataMatches(matches: any[]): Match[] {
    // This method is kept for compatibility but now redirects to PHP API transformation
    return this.transformPhpApiMatches(matches);
  }

  static transformFootballDataMatch(match: any): Match {
    // This method is kept for compatibility but now redirects to PHP API transformation
    return this.transformPhpApiMatch(match);
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