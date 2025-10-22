import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MatchesList from "@/components/MatchesList";

export const metadata: Metadata = {
  title: "Live Football Matches - YallaFoot",
  description: "Watch live football matches with curated streaming links. Find the best quality streams for Premier League, La Liga, Champions League and more.",
  keywords: "live football, streaming links, Premier League, La Liga, Champions League, football streams",
};

export default function MatchesPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Live Football Matches
          </h1>
          <p className="text-xl text-gray-600">
            Watch live football matches with our curated streaming links
          </p>
        </div>

        <MatchesList />
      </div>

      <Footer />
    </main>
  );
}