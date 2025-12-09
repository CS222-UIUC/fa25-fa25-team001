"use client";

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { searchGames, getCoverImageUrl } from '@/lib/api/igdb';
import { searchMovies } from '@/lib/api/omdb';
import Header from '@/components/Header';

interface Movie {
  id: string;
  title: string;
  year: number;
  rating?: number;
  poster?: string;
  type?: string;
}

interface Game {
  id: number;
  name: string;
  summary?: string;
  rating?: number;
  cover?: { image_id: string };
  first_release_date?: number;
}

interface User {
  id: string;
  username: string;
  profilePicture?: string;
}

function SearchPageInner() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  const [searchQuery, setSearchQuery] = useState(query);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [tvShows, setTvShows] = useState<Movie[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'games' | 'movies' | 'tv' | 'users'>('games');
  const MIN_YEAR = 0;
  const MAX_YEAR = new Date().getFullYear();
  const [minYear, setMinYear] = useState<string>('');
  const [maxYear, setMaxYear] = useState<string>('');
  const [minRating, setMinRating] = useState<string>('');
  const [maxRating, setMaxRating] = useState<string>('');
  const [filtersApplied, setFiltersApplied] = useState(false);

  // Normalize/filter values
  const parseYear = (val: string): number | undefined => {
    if (val.trim() === '') return undefined;
    const y = parseInt(val);
    if (isNaN(y)) return undefined;
    return Math.min(MAX_YEAR, y);
  };
  const minYearVal = parseYear(minYear);
  const maxYearVal = parseYear(maxYear);
  const minRatingVal = minRating !== '' ? Math.max(0, Math.min(10, parseFloat(minRating))) : undefined;
  const maxRatingVal = maxRating !== '' ? Math.max(0, Math.min(10, parseFloat(maxRating))) : undefined;

  const performSearch = useCallback(async (searchTerm: string) => {
    setLoading(true);
    try {
      // Search games using IGDB
      const gamesResults = await searchGames(searchTerm, 24);
      setGames(gamesResults);

      // Search movies/TV shows using OMDB
      try {
        const omdbResults = await searchMovies(searchTerm, 1);
        const allResults = omdbResults.Search || [];
        
        // Separate movies and TV shows
        const moviesList: Movie[] = [];
        const tvList: Movie[] = [];
        
        allResults.forEach((item) => {
          const entry: Movie = {
            id: item.imdbID,
            title: item.Title,
            year: parseInt(item.Year) || 0,
            poster: item.Poster !== 'N/A' ? item.Poster : undefined,
            type: item.Type,
          };
          
          if (item.Type === 'movie') {
            moviesList.push(entry);
          } else if (item.Type === 'series') {
            tvList.push(entry);
          }
        });
        
        setMovies(moviesList.slice(0, 24));
        setTvShows(tvList.slice(0, 24));
      } catch (omdbError) {
        console.error('OMDB search error:', omdbError);
        setMovies([]);
        setTvShows([]);
      }
      
      // Keep users empty for now (or implement user search separately)
      setUsers([]);
    } catch (error) {
      console.error('Search error:', error);
      setGames([]);
      setMovies([]);
      setTvShows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (query) {
      performSearch(query);
    }
  }, [query, performSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.history.pushState({}, '', `/search?q=${encodeURIComponent(searchQuery)}`);
      performSearch(searchQuery);
    }
  };

  const handleApplyFilters = () => {
    // Build URL with filters (and query if present)
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (minYearVal !== undefined) params.set('yearMin', String(minYearVal));
    if (maxYearVal !== undefined) params.set('yearMax', String(maxYearVal));
    if (minRating !== '') params.set('minRating', String(minRatingVal ?? ''));
    if (maxRating !== '') params.set('maxRating', String(maxRatingVal ?? ''));
    const qs = params.toString();
    window.history.pushState({}, '', `/search${qs ? `?${qs}` : ''}`);
    setFiltersApplied(true);
    // Only fetch from APIs if a query exists; filters are applied client-side
    if (searchQuery.trim()) {
      performSearch(searchQuery.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-300 via-cyan-200 to-teal-300">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent mb-4 drop-shadow-md">Search</h1>
          <form onSubmit={handleSearch} className="max-w-2xl">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-sky-600"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for games, movies, TV shows..."
                className="block w-full pl-10 pr-4 py-3 glass-strong rounded-2xl text-sky-900 placeholder-sky-600/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-300 transition-all"
              />
            </div>
          </form>

          {/* Filters */}
          <div className="mt-4 glass rounded-2xl p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-sky-700 mb-1">Release Date Range</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={MIN_YEAR}
                    max={MAX_YEAR}
                    value={minYear}
                    onChange={(e) => setMinYear(e.target.value)}
                    placeholder="min. year"
                    className="w-full glass-strong rounded-xl px-3 py-2 text-sky-900 placeholder-sky-600/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-300"
                  />
                  <span className="text-sky-700">-</span>
                  <input
                    type="number"
                    min={MIN_YEAR}
                    max={MAX_YEAR}
                    value={maxYear}
                    onChange={(e) => setMaxYear(e.target.value)}
                    placeholder="max. year"
                    className="w-full glass-strong rounded-xl px-3 py-2 text-sky-900 placeholder-sky-600/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-300"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-sky-700 mb-1">Rating Range</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    max={10}
                    value={minRating}
                    onChange={(e) => setMinRating(e.target.value)}
                    placeholder="0"
                    className="w-full glass-strong rounded-xl px-3 py-2 text-sky-900 placeholder-sky-600/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-300"
                  />
                  <span className="text-sky-700">-</span>
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    max={10}
                    value={maxRating}
                    onChange={(e) => setMaxRating(e.target.value)}
                    placeholder="10"
                    className="w-full glass-strong rounded-xl px-3 py-2 text-sky-900 placeholder-sky-600/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-300"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-sky-700 mb-1">&nbsp;</label>
                <div className="flex items-end gap-3">
                <button
                  type="button"
                  onClick={handleApplyFilters}
                  className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white font-semibold px-4 py-2 rounded-xl transition-all shadow-md hover:shadow-lg"
                >
                  Apply Filters
                </button>
                <button
                  type="button"
                  onClick={() => { setMinYear(''); setMaxYear(''); setMinRating(''); setMaxRating(''); setFiltersApplied(false); }}
                  className="w-full bg-white/70 hover:bg-white text-sky-800 font-semibold px-4 py-2 rounded-xl transition-all"
                >
                  Clear filters
                </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {(query || filtersApplied) && (
          <>
            {/* Tabs */}
            <div className="mb-6">
              <div className="border-b border-white/30">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab('games')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-all ${
                      activeTab === 'games'
                        ? 'border-cyan-500 text-cyan-600'
                        : 'border-transparent text-sky-700 hover:text-cyan-600 hover:border-cyan-300/50'
                    }`}
                  >
                    {(() => {
                      const filtered = games.filter(g => {
                        const year = g.first_release_date ? new Date(g.first_release_date * 1000).getFullYear() : undefined;
                        const rating10 = typeof g.rating === 'number' ? g.rating / 10 : undefined;
                        if (minYearVal && (year === undefined || year < minYearVal)) return false;
                        if (maxYearVal && (year === undefined || year > maxYearVal)) return false;
                        if (minRatingVal !== undefined && (rating10 === undefined || rating10 < minRatingVal)) return false;
                        if (maxRatingVal !== undefined && (rating10 === undefined || rating10 > maxRatingVal)) return false;
                        return true;
                      });
                      return `Games (${filtered.length})`;
                    })()}
                  </button>
                  <button
                    onClick={() => setActiveTab('movies')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-all ${
                      activeTab === 'movies'
                        ? 'border-cyan-500 text-cyan-600'
                        : 'border-transparent text-sky-700 hover:text-cyan-600 hover:border-cyan-300/50'
                    }`}
                  >
                    {(() => {
                      const filtered = movies.filter(m => {
                        const year = m.year || undefined;
                        const rating10 = typeof m.rating === 'number' ? m.rating : undefined;
                        if (minYearVal && (year === undefined || year < minYearVal)) return false;
                        if (maxYearVal && (year === undefined || year > maxYearVal)) return false;
                        if (minRatingVal !== undefined && (rating10 === undefined || rating10 < minRatingVal)) return false;
                        if (maxRatingVal !== undefined && (rating10 === undefined || rating10 > maxRatingVal)) return false;
                        return true;
                      });
                      return `Movies (${filtered.length})`;
                    })()}
                  </button>
                  <button
                    onClick={() => setActiveTab('tv')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-all ${
                      activeTab === 'tv'
                        ? 'border-cyan-500 text-cyan-600'
                        : 'border-transparent text-sky-700 hover:text-cyan-600 hover:border-cyan-300/50'
                    }`}
                  >
                    {(() => {
                      const filtered = tvShows.filter(t => {
                        const year = t.year || undefined;
                        const rating10 = typeof t.rating === 'number' ? t.rating : undefined;
                        if (minYearVal && (year === undefined || year < minYearVal)) return false;
                        if (maxYearVal && (year === undefined || year > maxYearVal)) return false;
                        if (minRatingVal !== undefined && (rating10 === undefined || rating10 < minRatingVal)) return false;
                        if (maxRatingVal !== undefined && (rating10 === undefined || rating10 > maxRatingVal)) return false;
                        return true;
                      });
                      return `TV Shows (${filtered.length})`;
                    })()}
                  </button>
                  <button
                    onClick={() => setActiveTab('users')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-all ${
                      activeTab === 'users'
                        ? 'border-cyan-500 text-cyan-600'
                        : 'border-transparent text-sky-700 hover:text-cyan-600 hover:border-cyan-300/50'
                    }`}
                  >
                    Users ({users.length})
                  </button>
                </nav>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="text-xl text-sky-700 font-medium">Searching...</div>
              </div>
            ) : (
              <>
                {/* Games Tab */}
                {activeTab === 'games' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {games
                      .filter(game => {
                        const year = game.first_release_date ? new Date(game.first_release_date * 1000).getFullYear() : undefined;
                        const rating10 = typeof game.rating === 'number' ? game.rating / 10 : undefined;
                        if (minYearVal && (year === undefined || year < minYearVal)) return false;
                        if (maxYearVal && (year === undefined || year > maxYearVal)) return false;
                        if (minRatingVal !== undefined && (rating10 === undefined || rating10 < minRatingVal)) return false;
                        if (maxRatingVal !== undefined && (rating10 === undefined || rating10 > maxRatingVal)) return false;
                        return true;
                      })
                      .map(game => (
                      <div key={game.id} className="glass-strong rounded-2xl overflow-hidden hover:shadow-2xl transition-all transform hover:scale-105">
                        <div className="aspect-[2/3] bg-gradient-to-br from-cyan-100 to-teal-100 flex items-center justify-center overflow-hidden rounded-t-2xl">
                          {game.cover?.image_id ? (
                            <img
                              src={getCoverImageUrl(game.cover.image_id, 'cover_big')}
                              alt={game.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-sky-600 font-medium">No Cover</span>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-lg mb-2 text-sky-800">{game.name}</h3>
                          {game.first_release_date && (
                            <p className="text-sky-600 mb-2 text-sm">
                              {new Date(game.first_release_date * 1000).getFullYear()}
                            </p>
                          )}
                          {game.rating && (
                            <div className="flex items-center">
                              <span className="text-amber-500">⭐</span>
                              <span className="ml-1 text-sm font-medium text-sky-800">{(game.rating / 10).toFixed(1)}/10</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Movies Tab */}
                {activeTab === 'movies' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {movies
                      .filter(movie => {
                        const year = movie.year || undefined;
                        const rating10 = typeof movie.rating === 'number' ? movie.rating : undefined;
                        if (minYearVal && (year === undefined || year < minYearVal)) return false;
                        if (maxYearVal && (year === undefined || year > maxYearVal)) return false;
                        if (minRatingVal !== undefined && (rating10 === undefined || rating10 < minRatingVal)) return false;
                        if (maxRatingVal !== undefined && (rating10 === undefined || rating10 > maxRatingVal)) return false;
                        return true;
                      })
                      .map(movie => (
                      <div key={movie.id} className="glass-strong rounded-2xl overflow-hidden hover:shadow-2xl transition-all transform hover:scale-105">
                        <div className="aspect-[2/3] bg-gradient-to-br from-cyan-100 to-teal-100 flex items-center justify-center overflow-hidden rounded-t-2xl">
                          {movie.poster ? (
                            <img
                              src={movie.poster}
                              alt={movie.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-sky-600 font-medium">No Poster</span>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-lg mb-2 text-sky-800">{movie.title}</h3>
                          <p className="text-sky-600 mb-2 text-sm">{movie.year}</p>
                          {movie.rating && (
                            <div className="flex items-center">
                              <span className="text-amber-500">⭐</span>
                              <span className="ml-1 text-sm font-medium text-sky-800">{movie.rating}/10</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* TV Shows Tab */}
                {activeTab === 'tv' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {tvShows
                      .filter(tv => {
                        const year = tv.year || undefined;
                        const rating10 = typeof tv.rating === 'number' ? tv.rating : undefined;
                        if (minYearVal && (year === undefined || year < minYearVal)) return false;
                        if (maxYearVal && (year === undefined || year > maxYearVal)) return false;
                        if (minRatingVal !== undefined && (rating10 === undefined || rating10 < minRatingVal)) return false;
                        if (maxRatingVal !== undefined && (rating10 === undefined || rating10 > maxRatingVal)) return false;
                        return true;
                      })
                      .map(tv => (
                      <div key={tv.id} className="glass-strong rounded-2xl overflow-hidden hover:shadow-2xl transition-all transform hover:scale-105">
                        <div className="aspect-[2/3] bg-gradient-to-br from-cyan-100 to-teal-100 flex items-center justify-center overflow-hidden rounded-t-2xl">
                          {tv.poster ? (
                            <img
                              src={tv.poster}
                              alt={tv.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-sky-600 font-medium">No Poster</span>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-lg mb-2 text-sky-800">{tv.title}</h3>
                          <p className="text-sky-600 mb-2 text-sm">{tv.year}</p>
                          {tv.rating && (
                            <div className="flex items-center">
                              <span className="text-amber-500">⭐</span>
                              <span className="ml-1 text-sm font-medium text-sky-800">{tv.rating}/10</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {users.map(user => (
                      <div key={user.id} className="glass-strong rounded-2xl p-6 hover:shadow-2xl transition-all transform hover:scale-105">
                        <div className="flex items-center space-x-4">
                          <img
                            src={user.profilePicture || '/default.jpg'}
                            alt={user.username}
                            className="w-12 h-12 rounded-full ring-2 ring-cyan-300/50"
                          />
                          <div>
                            <h3 className="font-semibold text-lg text-sky-800">{user.username}</h3>
                            <p className="text-sky-600 text-sm">Movie Enthusiast</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* No Results */}
                {!loading && activeTab === 'games' && games.filter(g => {
                  const year = g.first_release_date ? new Date(g.first_release_date * 1000).getFullYear() : undefined;
                  const rating10 = typeof g.rating === 'number' ? g.rating / 10 : undefined;
                  if (minYearVal && (year === undefined || year < minYearVal)) return false;
                  if (maxYearVal && (year === undefined || year > maxYearVal)) return false;
                  if (minRatingVal !== undefined && (rating10 === undefined || rating10 < minRatingVal)) return false;
                  if (maxRatingVal !== undefined && (rating10 === undefined || rating10 > maxRatingVal)) return false;
                  return true;
                }).length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-sky-700 text-lg font-medium">No games found for "{query}"</p>
                  </div>
                )}

                {!loading && activeTab === 'movies' && movies.filter(m => {
                  const year = m.year || undefined;
                  const rating10 = typeof m.rating === 'number' ? m.rating : undefined;
                  if (minYearVal && (year === undefined || year < minYearVal)) return false;
                  if (maxYearVal && (year === undefined || year > maxYearVal)) return false;
                  if (minRatingVal !== undefined && (rating10 === undefined || rating10 < minRatingVal)) return false;
                  if (maxRatingVal !== undefined && (rating10 === undefined || rating10 > maxRatingVal)) return false;
                  return true;
                }).length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-sky-700 text-lg font-medium">No movies found for "{query}"</p>
                  </div>
                )}

                {!loading && activeTab === 'tv' && tvShows.filter(t => {
                  const year = t.year || undefined;
                  const rating10 = typeof t.rating === 'number' ? t.rating : undefined;
                  if (minYearVal && (year === undefined || year < minYearVal)) return false;
                  if (maxYearVal && (year === undefined || year > maxYearVal)) return false;
                  if (minRatingVal !== undefined && (rating10 === undefined || rating10 < minRatingVal)) return false;
                  if (maxRatingVal !== undefined && (rating10 === undefined || rating10 > maxRatingVal)) return false;
                  return true;
                }).length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-sky-700 text-lg font-medium">No TV shows found for "{query}"</p>
                  </div>
                )}

                {!loading && activeTab === 'users' && users.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-sky-700 text-lg font-medium">No users found for "{query}"</p>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {!query && (
          <div className="text-center py-12">
            <p className="text-sky-700 text-lg font-medium">Enter a search term to find games, movies, and TV shows</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-500">Loading search…</div>}>
      <SearchPageInner />
    </Suspense>
  );
}