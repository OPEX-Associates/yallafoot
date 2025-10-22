"use client";

import { useState } from "react";
import { Stream } from "@/types/football";

interface StreamsListProps {
  streams: Stream[];
}

export default function StreamsList({ streams }: StreamsListProps) {
  const [sortBy, setSortBy] = useState<'rating' | 'viewers' | 'quality'>('rating');
  const [filterBy, setFilterBy] = useState<'all' | 'HD' | 'Full HD' | '4K'>('all');

  // Sort streams based on selected criteria
  const sortedStreams = [...streams].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return b.rating - a.rating;
      case 'viewers':
        return b.viewers - a.viewers;
      case 'quality':
        const qualityOrder = { '4K': 4, 'Full HD': 3, 'HD': 2, 'SD': 1 };
        return qualityOrder[b.quality] - qualityOrder[a.quality];
      default:
        return 0;
    }
  });

  // Filter streams based on quality
  const filteredStreams = sortedStreams.filter(stream => 
    filterBy === 'all' || stream.quality === filterBy
  );

  const handleStreamClick = (stream: Stream) => {
    // In a real application, this would handle stream access
    // For now, we'll show a placeholder
    alert(`Stream "${stream.name}" would open here. This is a demo - no actual streams are provided.`);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">
          Available Streams ({filteredStreams.length})
        </h2>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          {/* Quality Filter */}
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Qualities</option>
            <option value="4K">4K</option>
            <option value="Full HD">Full HD</option>
            <option value="HD">HD</option>
          </select>

          {/* Sort Options */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="rating">Sort by Rating</option>
            <option value="viewers">Sort by Viewers</option>
            <option value="quality">Sort by Quality</option>
          </select>
        </div>
      </div>

      {filteredStreams.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-500 mb-2">No streams available for the selected filter.</div>
          <button 
            onClick={() => setFilterBy('all')}
            className="text-primary-600 hover:text-primary-700 text-sm"
          >
            Show all streams
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredStreams.map((stream) => (
            <StreamCard 
              key={stream.id} 
              stream={stream} 
              onStreamClick={handleStreamClick}
            />
          ))}
        </div>
      )}

      {/* Submit Stream */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-blue-900">Know a working stream?</h3>
            <p className="text-sm text-blue-700">Help the community by submitting a new stream link.</p>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors">
            Submit Stream
          </button>
        </div>
      </div>
    </div>
  );
}

interface StreamCardProps {
  stream: Stream;
  onStreamClick: (stream: Stream) => void;
}

function StreamCard({ stream, onStreamClick }: StreamCardProps) {
  const getQualityColor = (quality: string) => {
    switch (quality) {
      case '4K':
        return 'bg-purple-100 text-purple-800';
      case 'Full HD':
        return 'bg-green-100 text-green-800';
      case 'HD':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (isWorking: boolean) => {
    return isWorking 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  const formatViewers = (viewers: number) => {
    if (viewers >= 1000000) {
      return `${(viewers / 1000000).toFixed(1)}M`;
    } else if (viewers >= 1000) {
      return `${(viewers / 1000).toFixed(1)}K`;
    }
    return viewers.toString();
  };

  const timeSince = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <h3 className="font-semibold text-gray-900">{stream.name}</h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getQualityColor(stream.quality)}`}>
            {stream.quality}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(stream.isWorking)}`}>
            {stream.isWorking ? '● Live' : '● Offline'}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                className={`w-4 h-4 ${
                  i < Math.floor(stream.rating) ? 'text-yellow-400' : 'text-gray-300'
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
            <span className="ml-1 text-sm text-gray-600">{stream.rating}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
        <div className="flex items-center space-x-4">
          <span>👥 {formatViewers(stream.viewers)} viewers</span>
          <span>🌐 {stream.language}</span>
          <span>📅 {timeSince(stream.submittedAt)}</span>
        </div>
        <span className="text-xs">by {stream.submittedBy}</span>
      </div>

      <button
        onClick={() => onStreamClick(stream)}
        disabled={!stream.isWorking}
        className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
          stream.isWorking
            ? 'bg-primary-600 text-white hover:bg-primary-700'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {stream.isWorking ? '▶️ Watch Stream' : '❌ Stream Offline'}
      </button>
    </div>
  );
}