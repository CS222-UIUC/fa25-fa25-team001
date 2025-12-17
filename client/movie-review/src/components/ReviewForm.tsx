"use client";

import { useState, useCallback } from 'react';
import StarRating from './StarRating';

interface MediaItem {
  id: string;
  title: string;
  year?: number;
  poster?: string;
}

interface ReviewFormProps {
  onSubmit: (data: {
    mediaType: 'movie' | 'game' | 'tv';
    mediaId: string;
    mediaTitle: string;
    rating: number;
    title?: string;
    content: string;
  }) => Promise<void>;
}

export default function ReviewForm({ onSubmit }: ReviewFormProps) {
  const [mediaType, setMediaType] = useState<'movie' | 'game' | 'tv'>('movie');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      let results: MediaItem[] = [];

      if (mediaType === 'game') {
        const response = await fetch(`/api/games/search?q=${encodeURIComponent(query)}&limit=10`);
        if (response.ok) {
          const data = await response.json();
          results = (data.games || []).map((game: any) => ({
            id: String(game.id),
            title: game.name,
            year: game.releaseDate
              ? new Date(game.releaseDate).getFullYear()
              : undefined,
            poster: game.cover || undefined,
          }));
        }
      } else if (mediaType === 'movie') {
        const response = await fetch(`/api/movies/search?q=${encodeURIComponent(query)}`);
        if (response.ok) {
          const data = await response.json();
          results = (data.movies || []).map((movie: any) => ({
            id: movie.imdbID || movie.id,
            title: movie.Title || movie.title,
            year: movie.Year ? parseInt(movie.Year) : movie.year,
            poster: (movie.Poster && movie.Poster !== 'N/A') ? movie.Poster : (movie.poster && movie.poster !== 'N/A' ? movie.poster : undefined),
          }));
        }
      } else if (mediaType === 'tv') {
        const response = await fetch(`/api/tv/search?q=${encodeURIComponent(query)}`);
        if (response.ok) {
          const data = await response.json();
          results = (data.shows || []).map((show: any) => ({
            id: show.imdbID || show.id,
            title: show.Title || show.title,
            year: show.Year ? parseInt(show.Year) : show.year,
            poster: (show.Poster && show.Poster !== 'N/A') ? show.Poster : (show.poster && show.poster !== 'N/A' ? show.poster : undefined),
          }));
        }
      }

      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [mediaType]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    performSearch(query);
  };

  const handleSelectMedia = (media: MediaItem) => {
    setSelectedMedia(media);
    setSearchQuery(media.title);
    setSearchResults([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedMedia) {
      alert('Please select a media item');
      return;
    }

    if (!rating || rating < 0.5 || rating > 5.0) {
      alert('Please provide a valid rating between 0.5 and 5.0');
      return;
    }

    if (!content.trim()) {
      alert('Please write a review');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        mediaType,
        mediaId: selectedMedia.id,
        mediaTitle: selectedMedia.title,
        rating: Number(rating),
        title: title.trim() || undefined,
        content: content.trim(),
      });

      // Reset form
      setSelectedMedia(null);
      setSearchQuery('');
      setRating(0);
      setTitle('');
      setContent('');
    } catch (error) {
      console.error('Submit error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit review';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-strong rounded-3xl shadow-xl p-8 mb-8">
      <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
        Write a Review
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Media Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Media Type
          </label>
          <div className="flex gap-4">
            {(['movie', 'game', 'tv'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setMediaType(type);
                  setSelectedMedia(null);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  mediaType === type
                    ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-lg'
                    : 'bg-white/50 text-gray-700 hover:bg-white/70'
                }`}
              >
                {type === 'movie' ? 'Movie' : type === 'game' ? 'Game' : 'TV Show'}
              </button>
            ))}
          </div>
        </div>

        {/* Media Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search {mediaType === 'movie' ? 'Movie' : mediaType === 'game' ? 'Game' : 'TV Show'}
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder={`Search for a ${mediaType === 'movie' ? 'movie' : mediaType === 'game' ? 'game' : 'TV show'}...`}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            {isSearching && (
              <div className="absolute right-3 top-2.5 text-gray-400">Searching...</div>
            )}
            {searchResults.length > 0 && !selectedMedia && (
              <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
                {searchResults.map((item, index) => (
                  <button
                    key={`${item.id}-${index}-${item.title}`}
                    type="button"
                    onClick={() => handleSelectMedia(item)}
                    className="w-full px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-left"
                  >
                    {item.poster ? (
                      <img
                        src={item.poster}
                        alt={item.title}
                        className="w-12 h-16 object-cover rounded"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-12 h-16 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                        No Image
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{item.title}</div>
                      {item.year && <div className="text-sm text-gray-500">{item.year}</div>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          {selectedMedia && (
            <div className="mt-2 flex items-center gap-3 p-3 bg-cyan-50 rounded-lg">
              {selectedMedia.poster && (
                <img
                  src={selectedMedia.poster}
                  alt={selectedMedia.title}
                  className="w-12 h-16 object-cover rounded"
                />
              )}
              <div>
                <div className="font-medium text-gray-900">{selectedMedia.title}</div>
                {selectedMedia.year && <div className="text-sm text-gray-500">{selectedMedia.year}</div>}
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedMedia(null);
                  setSearchQuery('');
                }}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rating (0.5 - 5.0 stars)
          </label>
          <div className="flex items-center gap-4">
            <StarRating 
              rating={rating} 
              onRatingChange={setRating} 
              variant="inline"
              showValue={true}
              size="md"
            />
            <input
              type="number"
              min="0.5"
              max="5"
              step="0.5"
              value={rating || ''}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                if (!isNaN(value) && value >= 0.5 && value <= 5) {
                  setRating(value);
                }
              }}
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="0.0"
            />
          </div>
        </div>

        {/* Review Title (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Review Title (Optional)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give your review a title..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        {/* Review Content */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Review
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            placeholder="Write your review..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            required
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !selectedMedia || !rating || !content.trim()}
          className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-bold py-3 px-6 rounded-lg hover:from-cyan-600 hover:to-teal-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>
    </div>
  );
}

