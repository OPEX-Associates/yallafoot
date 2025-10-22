import { Metadata } from "next";
import { notFound } from "next/navigation";
import MatchDetails from "@/components/MatchDetails";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

// Generate static params for static export
export async function generateStaticParams() {
  // Generate some common match IDs for static build
  // In production, you'd fetch this from your API
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
    { id: '4' },
    { id: '5' },
  ];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  
  return {
    title: `Match ${id} - Live Streams | YallaFoot`,
    description: `Watch live streams for match ${id} with real-time scores and multiple streaming options.`,
    keywords: "live match, football streams, live score, match streaming",
  };
}

export default async function MatchPage({ params }: Props) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  return <MatchDetails matchId={id} />;
}