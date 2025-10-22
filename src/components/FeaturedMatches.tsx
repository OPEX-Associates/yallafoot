import Link from "next/link";

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  date: string;
  time: string;
  streamCount: number;
  rating: number;
}

const featuredMatches: Match[] = [
  {
    id: "1",
    homeTeam: "Manchester City",
    awayTeam: "Liverpool",
    league: "Premier League",
    date: "2024-10-21",
    time: "16:30",
    streamCount: 12,
    rating: 4.8
  },
  {
    id: "2",
    homeTeam: "Barcelona",
    awayTeam: "Real Madrid",
    league: "La Liga",
    date: "2024-10-21",
    time: "20:00",
    streamCount: 18,
    rating: 4.9
  },
  {
    id: "3",
    homeTeam: "Bayern Munich",
    awayTeam: "Borussia Dortmund",
    league: "Bundesliga",
    date: "2024-10-21",
    time: "18:30",
    streamCount: 8,
    rating: 4.6
  }
];

export default function FeaturedMatches() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Featured Matches Today
          </h2>
          <p className="text-xl text-gray-600">
            Watch the biggest football matches with our curated streaming links
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredMatches.map((match) => (
            <div key={match.id} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-center mb-4">
                <div className="text-sm text-primary-600 font-semibold mb-2">{match.league}</div>
                <div className="text-lg font-bold text-gray-900 mb-1">
                  {match.homeTeam} vs {match.awayTeam}
                </div>
                <div className="text-gray-600">
                  {match.date} • {match.time}
                </div>
              </div>

              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-sm font-medium">{match.rating}</span>
                </div>
                <div className="text-sm text-gray-600">
                  {match.streamCount} streams
                </div>
              </div>

              <Link
                href={`/match/${match.id}`}
                className="block w-full bg-primary-600 text-white text-center py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                View Streams
              </Link>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/matches"
            className="bg-gray-900 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
          >
            View All Matches
          </Link>
        </div>
      </div>
    </section>
  );
}