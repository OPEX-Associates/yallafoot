"use client";

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MatchDetails from "@/components/MatchDetails";

function MatchContent() {
  const searchParams = useSearchParams();
  const matchId = searchParams.get('id') || '1';

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <MatchDetails matchId={matchId} />
      </div>

      <Footer />
    </main>
  );
}

export default function MatchPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading match...</p>
        </div>
      </main>
    }>
      <MatchContent />
    </Suspense>
  );
}