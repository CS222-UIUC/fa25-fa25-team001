'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';

interface Movie {
  Title: string;
  Year: string;
  imdbID: string;
  Type: string;
  Poster: string;
}

type SortOption = 'year-newest' | 'year-oldest' | 'alphabetical';

// Sort movies based on selected option
const sortMovies = (moviesToSort: Movie[], sortOption: SortOption): Movie[] => {
  const sorted = [...moviesToSort];
  
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

export default function MoviesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [sortedMovies, setSortedMovies] = useState<Movie[]>([]);
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
      const response = await fetch(`/api/movies/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();

      if (data.success) {
        const fetchedMovies = data.movies || [];
        setMovies(fetchedMovies);
        // Initial sort will be applied via useEffect
      } else {
        setError(data.error || 'Failed to search movies');
        setMovies([]);
        setSortedMovies([]);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('An error occurred while searching');
      setMovies([]);
      setSortedMovies([]);
    } finally {
      setLoading(false);
    }
  };

  const getDefaultPoster = () => 'https://via.placeholder.com/300x450?text=No+Poster';

  // Apply sorting when movies or sortBy changes
  useEffect(() => {
    if (movies.length > 0) {
      setSortedMovies(sortMovies(movies, sortBy));
    } else {
      setSortedMovies([]);
    }
  }, [movies, sortBy]);

  return (
    <div className="min-h-screen bg-gray-50bg-gray-900">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900text-white mb-2">Movies</h1>
          <p className="text-lg text-gray-600text-gray-400">Search and discover movies</p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for movies..."
              className="flex-1 px-4 py-3 border border-gray-300border-gray-700 rounded-lg bg-whitebg-gray-800 text-gray-900text-white placeholder-gray-500placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        {/* Error Message */}
        {error && (
          <div className="mb-8 bg-red-50bg-red-900/20 border border-red-200border-red-800 text-red-700text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Movie Results */}
        {searched && !loading && (
          <div>
            {movies.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-semibold text-gray-900text-white">
                    Results ({movies.length})
                  </h2>
                  <div className="flex items-center gap-2">
                    <label htmlFor="sort" className="text-sm font-medium text-gray-700text-gray-300">
                      Sort by:
                    </label>
                    <select
                      id="sort"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="px-3 py-2 border border-gray-300border-gray-700 rounded-lg bg-whitebg-gray-800 text-gray-900text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="year-newest">Release Date (Newest)</option>
                      <option value="year-oldest">Release Date (Oldest)</option>
                      <option value="alphabetical">Alphabetical (A-Z)</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {sortedMovies.map((movie, index) => (
                    <a
                      key={`${movie.imdbID}-${index}`}
                      href={`/movies/${movie.imdbID}`}
                      className="group bg-whitebg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
                    >
                      <div className="aspect-[2/3] bg-gray-200bg-gray-700 overflow-hidden">
                        <img
                          src={movie.Poster && movie.Poster !== 'N/A' ? movie.Poster : getDefaultPoster()}
                          alt={movie.Title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900text-white mb-1 line-clamp-2 group-hover:text-indigo-600group-hover:text-indigo-400 transition-colors">
                          {movie.Title}
                        </h3>
                        <p className="text-sm text-gray-600text-gray-400">{movie.Year}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12 bg-whitebg-gray-800 rounded-lg">
                <p className="text-gray-500text-gray-400 text-lg">No movies found. Try a different search.</p>
              </div>
            )}
          </div>
        )}

        {/* Featured Movies - Show when no search */}
        {!searched && !loading && (
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-gray-900text-white">Featured Movies</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {['The Matrix', 'Inception', 'Interstellar', 'The Dark Knight'].map((title) => (
                <div
                  key={title}
                  className="bg-whitebg-gray-800 rounded-lg shadow-md overflow-hidden animate-pulse"
                >
                  <div className="aspect-[2/3] bg-gray-300bg-gray-700" />
                  <div className="p-4">
                    <div className="h-4 bg-gray-300bg-gray-700 rounded mb-2" />
                    <div className="h-4 bg-gray-300bg-gray-700 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-center text-gray-500text-gray-400 mt-8">
              Search for your favorite movies above!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

