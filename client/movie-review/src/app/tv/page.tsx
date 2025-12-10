/**
 * ============================================================================
 * PAGE: TV Shows Search & Browse Page
 * ============================================================================
 * Route: /tv
 * Purpose: Search and browse TV shows using OMDB API
 * Features:
 *   - Search for TV shows by title
 *   - Sort results by year or alphabetical
 *   - Display TV show posters, titles, and release years
 *   - Link to individual TV show detail pages (future)
 * ============================================================================
 */

'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';

interface TvShow {
  Title: string;
  Year: string;
  imdbID: string;
  Type: string;
  Poster: string;
}

type SortOption = 'year-newest' | 'year-oldest' | 'alphabetical';

// Sort TV shows based on selected option
const sortShows = (showsToSort: TvShow[], sortOption: SortOption): TvShow[] => {
  const sorted = [...showsToSort];
  
  switch (sortOption) {
    case 'alphabetical':
      return sorted.sort((a, b) => a.Title.localeCompare(b.Title));
    
    case 'year-newest':
      return sorted.sort((a, b) => {
        const yearA = parseInt(a.Year) || 0;
        const yearB = parseInt(b.Year) || 0;
        return yearB - yearA; // Newest first
      });
    
    case 'year-oldest':
      return sorted.sort((a, b) => {
        const yearA = parseInt(a.Year) || 0;
        const yearB = parseInt(b.Year) || 0;
        return yearA - yearB; // Oldest first
      });
    
    default:
      return sorted;
  }
};

export default function TvShowsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [shows, setShows] = useState<TvShow[]>([]);
  const [sortedShows, setSortedShows] = useState<TvShow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('year-newest');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      setError('Please enter a search query');
      return;
    }

    setLoading(true);
    setError('');
    setSearched(true);

    try {
      const response = await fetch(`/api/tv/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();

      if (data.success) {
        const fetchedShows = data.shows || [];
        setShows(fetchedShows);
        // Initial sort will be applied via useEffect
      } else {
        setError(data.error || 'Failed to search TV shows');
        setShows([]);
        setSortedShows([]);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('An error occurred while searching');
      setShows([]);
      setSortedShows([]);
    } finally {
      setLoading(false);
    }
  };

  const getDefaultPoster = () => 'https://via.placeholder.com/300x450?text=No+Poster';

  // Apply sorting when shows or sortBy changes
  useEffect(() => {
    if (shows.length > 0) {
      setSortedShows(sortShows(shows, sortBy));
    } else {
      setSortedShows([]);
    }
  }, [shows, sortBy]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-300 via-cyan-200 to-teal-300">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent mb-2 drop-shadow-md">TV Shows</h1>
          <p className="text-lg text-sky-700 font-medium">Search and discover TV shows</p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for TV shows..."
              className="flex-1 px-4 py-3 glass-strong rounded-2xl text-sky-900 placeholder-sky-600/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-300 text-lg transition-all"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white font-semibold rounded-2xl transition-all shadow-lg hover:shadow-xl glow-soft disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        {/* Error Message */}
        {error && (
          <div className="mb-8 bg-gradient-to-r from-pink-200/40 to-rose-200/40 backdrop-blur-md border border-pink-300/50 text-rose-800 px-4 py-3 rounded-2xl shadow-lg">
            {error}
          </div>
        )}

        {/* TV Show Results */}
        {searched && !loading && (
          <div>
            {shows.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-semibold text-sky-800">
                    Results ({shows.length})
                  </h2>
                  <div className="flex items-center gap-2">
                    <label htmlFor="sort" className="text-sm font-medium text-sky-700">
                      Sort by:
                    </label>
                    <select
                      id="sort"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="px-3 py-2 glass-strong rounded-xl text-sky-900 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50 transition-all"
                    >
                      <option value="year-newest">Release Date (Newest)</option>
                      <option value="year-oldest">Release Date (Oldest)</option>
                      <option value="alphabetical">Alphabetical (A-Z)</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {sortedShows.map((show, index) => (
                    <div
                      key={`${show.imdbID}-${index}`}
                      className="group glass-strong rounded-2xl overflow-hidden hover:shadow-2xl transition-all transform hover:scale-105"
                    >
                      <a href={`/tv/${show.imdbID}`}>
                        <div className="aspect-[2/3] bg-gradient-to-br from-cyan-100 to-teal-100 overflow-hidden rounded-t-2xl">
                          <img
                            src={show.Poster && show.Poster !== 'N/A' ? show.Poster : getDefaultPoster()}
                            alt={show.Title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-sky-800 mb-1 line-clamp-2 group-hover:text-cyan-600 transition-colors">
                            {show.Title}
                          </h3>
                          <p className="text-sm text-sky-600 mb-2">{show.Year}</p>
                        </div>
                      </a>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12 glass-strong rounded-2xl">
                <p className="text-sky-700 text-lg font-medium">No TV shows found. Try a different search.</p>
              </div>
            )}
          </div>
        )}

        {/* Featured TV Shows - Show when no search */}
        {!searched && !loading && (
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-sky-800">Featured TV Shows</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {['Breaking Bad', 'Game of Thrones', 'The Office', 'Stranger Things'].map((title) => (
                <div
                  key={title}
                  className="glass-strong rounded-2xl overflow-hidden animate-pulse"
                >
                  <div className="aspect-[2/3] bg-gradient-to-br from-cyan-200 to-teal-200" />
                  <div className="p-4">
                    <div className="h-4 bg-sky-300/50 rounded mb-2" />
                    <div className="h-4 bg-sky-300/50 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-center text-sky-700 mt-8 font-medium">
              Search for your favorite TV shows above!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

