import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CachedMatches from "@/components/CachedMatches";

export const metadata: Metadata = {
  title: "Live Football Matches - YallaFoot",
  description: "Watch live football matches with curated streaming links. Real-time scores updated every 3 minutes during matches.",
  keywords: "live football, streaming links, Premier League, La Liga, Champions League, football streams, real-time scores",
};

export default function MatchesPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CachedMatches />
      </div>

      <Footer />
    </main>
  );
}