import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "YallaFoot - Best Football Streaming Links",
  description: "Discover and review the best football streaming links for live matches. Your go-to platform for football streaming with user reviews and ratings.",
  keywords: "football streaming, live football, football links, soccer streaming, match streaming, sports streaming",
  authors: [{ name: "YallaFoot Team" }],
  openGraph: {
    title: "YallaFoot - Best Football Streaming Links",
    description: "Discover and review the best football streaming links for live matches",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "YallaFoot - Best Football Streaming Links",
    description: "Discover and review the best football streaming links for live matches",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}