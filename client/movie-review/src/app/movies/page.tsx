'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import MediaStatusHover from '@/components/MediaStatusHover';
import TrendingMediaScroll from '@/components/TrendingMediaScroll';
import Link from 'next/link';

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

const MOVIE_GENRES = [
  'Action', 'Adventure', 'Animation', 'Biography', 'Comedy', 'Crime', 'Documentary',
  'Drama', 'Family', 'Fantasy', 'Film-Noir', 'History', 'Horror', 'Music', 'Musical',
  'Mystery', 'Romance', 'Sci-Fi', 'Sport', 'Thriller', 'War', 'Western'
];

export default function MoviesPage() {
  const [searchMode, setSearchMode] = useState<'title' | 'genre'>('title');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [sortedMovies, setSortedMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('year-newest');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (searchMode === 'title' && !searchQuery.trim()) {
      setError('Please enter a search query');
      return;
    }

    if (searchMode === 'genre' && !selectedGenre) {
      setError('Please select a genre');
      return;
    }

    setLoading(true);
    setError('');
    setSearched(true);

    try {
      let response;
      if (searchMode === 'genre') {
        response = await fetch(`/api/movies/genre?genre=${encodeURIComponent(selectedGenre)}&limit=20`);
      } else {
        response = await fetch(`/api/movies/search?q=${encodeURIComponent(searchQuery)}`);
      }
      
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

  const handleGenreChange = (genre: string) => {
    setSelectedGenre(genre);
    if (genre) {
      // Auto-search when genre is selected
      setSearched(true);
      setLoading(true);
      setError('');
      
      fetch(`/api/movies/genre?genre=${encodeURIComponent(genre)}&limit=20`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setMovies(data.movies || []);
          } else {
            setError(data.error || 'Failed to search movies');
            setMovies([]);
            setSortedMovies([]);
          }
        })
        .catch(err => {
          console.error('Genre search error:', err);
          setError('An error occurred while searching');
          setMovies([]);
          setSortedMovies([]);
        })
        .finally(() => setLoading(false));
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
    <div className="min-h-screen bg-gradient-to-br from-sky-300 via-cyan-200 to-teal-300">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent mb-2 drop-shadow-md">Movies</h1>
          <p className="text-lg text-sky-700 font-medium">Search and discover movies</p>
        </div>

        {/* Search Mode Toggle */}
        <div className="mb-4 flex gap-4">
          <button
            onClick={() => {
              setSearchMode('title');
              setSearched(false);
              setMovies([]);
              setSearchQuery('');
            }}
            className={`px-4 py-2 rounded-xl font-semibold transition-all ${
              searchMode === 'title'
                ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-lg'
                : 'glass-strong text-sky-800 hover:bg-white/20'
            }`}
          >
            Search by Title
          </button>
          <button
            onClick={() => {
              setSearchMode('genre');
              setSearched(false);
              setMovies([]);
              setSelectedGenre('');
            }}
            className={`px-4 py-2 rounded-xl font-semibold transition-all ${
              searchMode === 'genre'
                ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-lg'
                : 'glass-strong text-sky-800 hover:bg-white/20'
            }`}
          >
            Search by Genre
          </button>
        </div>

        {/* Search Bar */}
        {searchMode === 'title' ? (
          <form onSubmit={handleSearch} className="mb-8">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for movies..."
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
        ) : (
          <div className="mb-8">
            <select
              value={selectedGenre}
              onChange={(e) => handleGenreChange(e.target.value)}
              className="w-full px-4 py-3 glass-strong rounded-2xl text-sky-900 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-300 text-lg transition-all"
            >
              <option value="">Select a genre...</option>
              {MOVIE_GENRES.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-8 bg-gradient-to-r from-pink-200/40 to-rose-200/40 backdrop-blur-md border border-pink-300/50 text-rose-800 px-4 py-3 rounded-2xl shadow-lg">
            {error}
          </div>
        )}

        {/* Movie Results */}
        {searched && !loading && (
          <div>
            {movies.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-semibold text-sky-800">
                    Results ({movies.length})
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
                  {sortedMovies.map((movie, index) => (
                    <MediaStatusHover
                      key={`${movie.imdbID}-${index}`}
                      mediaId={movie.imdbID}
                      mediaType="movie"
                      mediaTitle={movie.Title}
                      currentStatus={null}
                    >
                      <div className="group glass-strong rounded-2xl overflow-hidden hover:shadow-2xl transition-all transform hover:scale-105 relative">
                        <Link href={`/movies/${movie.imdbID}`}>
                          <div className="aspect-[2/3] bg-gradient-to-br from-cyan-100 to-teal-100 overflow-hidden rounded-t-2xl">
                            <img
                              src={movie.Poster && movie.Poster !== 'N/A' ? movie.Poster : getDefaultPoster()}
                              alt={movie.Title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          </div>
                          <div className="p-4">
                            <h3 className="font-semibold text-sky-800 mb-1 line-clamp-2 group-hover:text-cyan-600 transition-colors">
                              {movie.Title}
                            </h3>
                            <p className="text-sm text-sky-600">{movie.Year}</p>
                          </div>
                        </Link>
                      </div>
                    </MediaStatusHover>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12 glass-strong rounded-2xl">
                <p className="text-sky-700 text-lg font-medium">No movies found. Try a different search.</p>
              </div>
            )}
          </div>
        )}

        {/* Trending Movies - Show when no search */}
        {!searched && !loading && (
          <div>
            <TrendingMediaScroll
              mediaType="movie"
              apiEndpoint="/api/movies/popular?limit=20"
              getPosterUrl={(item) => item.Poster}
              getTitle={(item) => item.Title}
              getYear={(item) => item.Year}
              getMediaId={(item) => item.imdbID}
              getDetailUrl={(item) => `/movies/${item.imdbID}`}
              aspectRatio="aspect-[2/3]"
            />
            <p className="text-center text-sky-700 mt-8 font-medium">
              Search for your favorite movies above!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

