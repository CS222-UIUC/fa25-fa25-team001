'use client';

import { useState } from 'react';
import Header from '@/components/Header';

interface Movie {
  Title: string;
  Year: string;
  imdbID: string;
  Type: string;
  Poster: string;
}

export default function MoviesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

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
        setMovies(data.movies || []);
      } else {
        setError(data.error || 'Failed to search movies');
        setMovies([]);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('An error occurred while searching');
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };

  const getDefaultPoster = () => 'https://via.placeholder.com/300x450?text=No+Poster';

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Movies</h1>
          <p className="text-lg text-gray-600">Search and discover movies</p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for movies..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
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
          <div className="mb-8 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Movie Results */}
        {searched && !loading && (
          <div>
            {movies.length > 0 ? (
              <>
                <h2 className="text-2xl font-semibold mb-4">
                  Results ({movies.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {movies.map((movie, index) => (
                    <a
                      key={`${movie.imdbID}-${index}`}
                      href={`/movies/${movie.imdbID}`}
                      className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
                    >
                      <div className="aspect-[2/3] bg-gray-200 overflow-hidden">
                        <img
                          src={movie.Poster && movie.Poster !== 'N/A' ? movie.Poster : getDefaultPoster()}
                          alt={movie.Title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                          {movie.Title}
                        </h3>
                        <p className="text-sm text-gray-600">{movie.Year}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg">
                <p className="text-gray-500 text-lg">No movies found. Try a different search.</p>
              </div>
            )}
          </div>
        )}

        {/* Featured Movies - Show when no search */}
        {!searched && !loading && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Featured Movies</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {['The Matrix', 'Inception', 'Interstellar', 'The Dark Knight'].map((title) => (
                <div
                  key={title}
                  className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse"
                >
                  <div className="aspect-[2/3] bg-gray-300" />
                  <div className="p-4">
                    <div className="h-4 bg-gray-300 rounded mb-2" />
                    <div className="h-4 bg-gray-300 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-center text-gray-500 mt-8">
              Search for your favorite movies above!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

