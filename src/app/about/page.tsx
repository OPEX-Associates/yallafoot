import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "About YallaFoot - Football Streaming Links Platform",
  description: "Learn about YallaFoot, the community-driven platform for discovering and reviewing football streaming links. Find the best streams with user reviews.",
  keywords: "about YallaFoot, football streaming platform, community reviews, streaming links",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            About YallaFoot
          </h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-xl text-gray-600 mb-8">
              YallaFoot is your ultimate destination for discovering the best football streaming links, 
              powered by a community of passionate football fans.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
            <p className="mb-6">
              We believe that every football fan should have access to high-quality streams of their favorite matches. 
              Our platform curates and reviews streaming links submitted by our community, helping you find reliable, 
              high-quality streams for live football matches from around the world.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
              <div className="text-center p-6 bg-primary-50 rounded-lg">
                <div className="text-primary-600 text-4xl mb-4">🔍</div>
                <h3 className="font-semibold mb-2">Discover</h3>
                <p className="text-sm text-gray-600">Browse curated streaming links for live football matches</p>
              </div>
              <div className="text-center p-6 bg-primary-50 rounded-lg">
                <div className="text-primary-600 text-4xl mb-4">⭐</div>
                <h3 className="font-semibold mb-2">Review</h3>
                <p className="text-sm text-gray-600">Read and write reviews to help the community</p>
              </div>
              <div className="text-center p-6 bg-primary-50 rounded-lg">
                <div className="text-primary-600 text-4xl mb-4">⚽</div>
                <h3 className="font-semibold mb-2">Watch</h3>
                <p className="text-sm text-gray-600">Enjoy high-quality streams of your favorite matches</p>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">What We Cover</h2>
            <ul className="list-disc pl-6 mb-6">
              <li>Premier League</li>
              <li>La Liga</li>
              <li>Serie A</li>
              <li>Bundesliga</li>
              <li>Ligue 1</li>
              <li>Champions League</li>
              <li>Europa League</li>
              <li>International competitions</li>
              <li>And many more leagues worldwide!</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Community-Driven</h2>
            <p className="mb-6">
              Our platform thrives on community participation. Users submit streaming links, write reviews, 
              and rate the quality of streams. This collaborative approach ensures that you always have 
              access to the most reliable and up-to-date streaming options.
            </p>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 my-8">
              <h3 className="font-semibold text-yellow-800 mb-2">Important Notice</h3>
              <p className="text-yellow-700">
                YallaFoot is a curation platform that aggregates streaming links from various sources. 
                We do not host any content ourselves and are not responsible for the availability, 
                legality, or quality of external streaming links. Users are encouraged to use official 
                broadcasters when available and to comply with local laws and regulations.
              </p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Join Our Community</h2>
            <p className="mb-6">
              Whether you&apos;re looking for streams of the biggest matches or hidden gems from lower leagues, 
              YallaFoot has something for every football fan. Join our community today and never miss 
              a match again!
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}