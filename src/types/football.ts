// Types for football data
export interface Team {
  id: number;
  name: string;
  logo: string;
  country: string;
}

export interface League {
  id: number;
  name: string;
  country: string;
  logo: string;
  flag: string;
  season: number;
}

export interface Fixture {
  id: number;
  referee: string | null;
  timezone: string;
  date: string;
  timestamp: number;
  status: {
    long: string;
    short: string;
    elapsed: number | null;
  };
  venue: {
    id: number;
    name: string;
    city: string;
  };
}

export interface Goals {
  home: number | null;
  away: number | null;
}

export interface Score {
  halftime: Goals;
  fulltime: Goals;
  extratime: Goals;
  penalty: Goals;
}

export interface Match {
  fixture: Fixture;
  league: League;
  teams: {
    home: Team;
    away: Team;
  };
  goals: Goals;
  score: Score;
}

export interface Stream {
  id: string;
  name: string;
  url: string;
  quality: 'HD' | 'Full HD' | '4K' | 'SD';
  language: string;
  rating: number;
  viewers: number;
  isWorking: boolean;
  submittedBy: string;
  submittedAt: string;
}

export interface MatchWithStreams extends Match {
  streams: Stream[];
  streamCount: number;
  averageRating: number;
}