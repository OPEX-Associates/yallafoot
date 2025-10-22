import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Stream Reviews - YallaFoot",
  description: "Read and write reviews for football streaming links. Find the most reliable streams based on real user experiences and ratings.",
  keywords: "football stream reviews, streaming quality, user ratings, football streaming feedback",
};

interface Review {
  id: string;
  matchName: string;
  streamSource: string;
  rating: number;
  quality: string;
  buffering: string;
  comment: string;
  author: string;
  date: string;
}

const sampleReviews: Review[] = [
  {
    id: "1",
    matchName: "Manchester City vs Liverpool",
    streamSource: "StreamSite1",
    rating: 4.8,
    quality: "HD",
    buffering: "Minimal",
    comment: "Excellent quality stream with no interruptions. Audio was crystal clear and video was smooth throughout the match.",
    author: "FootballFan123",
    date: "2024-10-20"
  },
  {
    id: "2",
    matchName: "Barcelona vs Real Madrid",
    streamSource: "StreamSite2",
    rating: 4.2,
    quality: "Full HD",
    buffering: "Occasional",
    comment: "Great picture quality but had some buffering during peak moments. Overall good experience.",
    author: "LaLigaWatcher",
    date: "2024-10-19"
  },
  {
    id: "3",
    matchName: "Bayern Munich vs Borussia Dortmund",
    streamSource: "StreamSite3",
    rating: 3.9,
    quality: "HD",
    buffering: "Frequent",
    comment: "Video quality was good but too much buffering made it frustrating to watch. Audio sync issues in second half.",
    author: "BundesligaFan",
    date: "2024-10-18"
  }
];

export default function ReviewsPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Stream Reviews
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Real user reviews to help you find the best football streaming experiences
          </p>
          
          <button className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors">
            Write a Review
          </button>
        </div>

        <div className="space-y-6">
          {sampleReviews.map((review) => (
            <div key={review.id} className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{review.matchName}</h3>
                  <p className="text-sm text-gray-600">Stream: {review.streamSource}</p>
                </div>
                <div className="flex items-center">
                  <div className="flex items-center mr-2">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.floor(review.rating) ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-sm font-medium">{review.rating}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Quality:</span>
                  <span className="ml-2 text-gray-600">{review.quality}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Buffering:</span>
                  <span className="ml-2 text-gray-600">{review.buffering}</span>
                </div>
              </div>

              <p className="text-gray-700 mb-4">{review.comment}</p>

              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>By {review.author}</span>
                <span>{review.date}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            Help the community by sharing your streaming experiences
          </p>
          <button className="bg-gray-900 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors">
            Submit Your Review
          </button>
        </div>
      </div>

      <Footer />
    </main>
  );
}