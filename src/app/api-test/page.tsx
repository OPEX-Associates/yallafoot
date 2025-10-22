import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import APITester from "@/components/APITester";

export const metadata: Metadata = {
  title: "API Status - YallaFoot",
  description: "Monitor live football data API status and test connections.",
  robots: {
    index: false,
    follow: false,
  }
};

export default function APITestPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            🔧 API Status & Testing
          </h1>
          <p className="text-xl text-gray-600">
            Monitor your live football data connections and API performance
          </p>
        </div>

        <APITester />
      </div>

      <Footer />
    </main>
  );
}