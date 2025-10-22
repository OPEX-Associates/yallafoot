import Header from "@/components/Header";
import Hero from "@/components/Hero";
import FeaturedMatches from "@/components/FeaturedMatches";
import Footer from "@/components/Footer";
import Disclaimer from "@/components/Disclaimer";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Header />
      <Hero />
      <FeaturedMatches />
      <Disclaimer />
      <Footer />
    </main>
  );
}