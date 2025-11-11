"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { searchEverything } from '@/actions/search';
import Link from 'next/link';

interface SearchResults {
  games: Array<{id: number; name: string; cover?: string; rating?: number}>;
  movies: Array<{id: string; title: string; year?: number; poster?: string; source: string}>;
  tvShows: Array<{id: string; title: string; year?: string; poster?: string}>;
  users: Array<{id: string; username: string; profilePicture?: string}>;
}

function SearchContent() {
  const router = useRouter();
  const [results, setResults] = useState<SearchResults>({ games: [], movies: [], tvShows: [], users: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  useEffect(() => {
    if (query.trim().length >= 2) {
      handleSearch();
    } else {
      setResults({ games: [], movies: [], tvShows: [], users: [] });
    }
  }, [query]);

  const deduplicateMovies = (movies: SearchResults['movies']) => {
    const seen = new Map<string, SearchResults['movies'][0]>();
    
    movies.forEach((movie) => {
      const key = movie.title.toLowerCase().trim();
      const existing = seen.get(key);
      
      if (!existing) {
        seen.set(key, movie);
      } else {
        // Prefer local source, or prefer ones with posters
        if (movie.source === 'local' || (movie.poster && movie.poster !== 'N/A' && !existing.poster)) {
          seen.set(key, movie);
        }
      }
    });
    
    return Array.from(seen.values());
  };

  const handleSearch = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await searchEverything(query.trim()) as any;
      const dedupedMovies = deduplicateMovies(data.movies || []);
      setResults({
        games: data.games || [],
        movies: dedupedMovies,
        tvShows: data.tvShows || [],
        users: data.users || []
      });
      setExpandedSections({});
    } catch (err) {
      setError('Search failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpandSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const totalResults = results.games.length + results.movies.length + results.tvShows.length + results.users.length;

  const handleItemClick = (type: string, id: string, title: string) => {
    if (type === 'user') {
      router.push(`/profile/${title}`);
    } else if (type === 'movie') {
      router.push(`/movie/${id}`);
    } else if (type === 'game') {
      router.push(`/game/${id}`);
    } else if (type === 'tv') {
      router.push(`/tv/${id}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Search Results
          </h1>
          <p className="text-gray-600 text-lg">
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">🔍</span> Searching...
              </span>
            ) : query ? (
              `Found ${totalResults} result${totalResults !== 1 ? 's' : ''} for "${query}"`
            ) : (
              'Start typing to search...'
            )}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg shadow-sm">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600">Searching...</p>
            </div>
          </div>
        )}

        {!isLoading && query && (
          <>
            {/* Results Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Games Section */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-xl font-bold">
                    🎮
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Games</h2>
                    <p className="text-sm text-gray-500">{results.games.length} found</p>
                  </div>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {results.games.slice(0, expandedSections['games'] ? results.games.length : 5).map((game) => (
                    <div
                      key={game.id}
                      onClick={() => handleItemClick('game', game.id.toString(), game.name)}
                      className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-all cursor-pointer group"
                    >
                      <div className="w-20 h-28 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden shadow-md group-hover:shadow-lg transition-shadow">
                        {game.cover ? (
                          <img src={game.cover} alt={game.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-3xl">🎮</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                          {game.name}
                        </h3>
                        {game.rating && (
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center">
                              {Array.from({ length: 5 }, (_, i) => (
                                <span key={i} className={i < Math.round(game.rating! / 20) ? 'text-yellow-400' : 'text-gray-300'}>
                                  ★
                                </span>
                              ))}
                            </div>
                            <span className="text-sm text-gray-600">{Math.round(game.rating)}/100</span>
                          </div>
                        )}
                      </div>
                      <div className="text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        →
                      </div>
                    </div>
                  ))}
                  {results.games.length === 0 && (
                    <p className="text-gray-500 text-center py-8">No games found</p>
                  )}
                </div>
                {results.games.length > 5 && (
                  <button
                    onClick={() => toggleExpandSection('games')}
                    className="w-full mt-4 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-medium rounded-lg transition-colors"
                  >
                    {expandedSections['games'] ? 'Show Less' : `View More (${results.games.length - 5} more)`}
                  </button>
                )}
              </div>

              {/* Movies Section */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center text-white text-xl font-bold">
                    🎬
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Movies</h2>
                    <p className="text-sm text-gray-500">{results.movies.length} found</p>
                  </div>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {results.movies.slice(0, expandedSections['movies'] ? results.movies.length : 5).map((movie) => (
                    <div
                      key={`${movie.id}-${movie.source}`}
                      onClick={() => handleItemClick('movie', movie.id, movie.title)}
                      className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-all cursor-pointer group"
                    >
                      <div className="w-16 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden shadow-md group-hover:shadow-lg transition-shadow">
                        {movie.poster && movie.poster !== 'N/A' ? (
                          <img src={movie.poster} alt={movie.title} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl">🎬</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                          {movie.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          {movie.year && <p className="text-sm text-gray-600">{movie.year}</p>}
                          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full capitalize">
                            {movie.source}
                          </span>
                        </div>
                      </div>
                      <div className="text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        →
                      </div>
                    </div>
                  ))}
                  {results.movies.length === 0 && (
                    <p className="text-gray-500 text-center py-8">No movies found</p>
                  )}
                </div>
                {results.movies.length > 5 && (
                  <button
                    onClick={() => toggleExpandSection('movies')}
                    className="w-full mt-4 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-medium rounded-lg transition-colors"
                  >
                    {expandedSections['movies'] ? 'Show Less' : `View More (${results.movies.length - 5} more)`}
                  </button>
                )}
              </div>

              {/* TV Shows Section */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-xl font-bold">
                    📺
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">TV Shows</h2>
                    <p className="text-sm text-gray-500">{results.tvShows.length} found</p>
                  </div>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {results.tvShows.slice(0, expandedSections['tvShows'] ? results.tvShows.length : 5).map((show) => (
                    <div
                      key={show.id}
                      onClick={() => handleItemClick('tv', show.id, show.title)}
                      className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-all cursor-pointer group"
                    >
                      <div className="w-16 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden shadow-md group-hover:shadow-lg transition-shadow">
                        {show.poster && show.poster !== 'N/A' ? (
                          <img src={show.poster} alt={show.title} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl">📺</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                          {show.title}
                        </h3>
                        {show.year && <p className="text-sm text-gray-600 mt-1">{show.year}</p>}
                      </div>
                      <div className="text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        →
                      </div>
                    </div>
                  ))}
                  {results.tvShows.length === 0 && (
                    <p className="text-gray-500 text-center py-8">No TV shows found</p>
                  )}
                </div>
                {results.tvShows.length > 5 && (
                  <button
                    onClick={() => toggleExpandSection('tvShows')}
                    className="w-full mt-4 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-medium rounded-lg transition-colors"
                  >
                    {expandedSections['tvShows'] ? 'Show Less' : `View More (${results.tvShows.length - 5} more)`}
                  </button>
                )}
              </div>

              {/* Users Section */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center text-white text-xl font-bold">
                    👤
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Users</h2>
                    <p className="text-sm text-gray-500">{results.users.length} found</p>
                  </div>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {results.users.slice(0, expandedSections['users'] ? results.users.length : 5).map((user) => (
                    <div
                      key={user.id}
                      onClick={() => handleItemClick('user', user.id, user.username)}
                      className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-all cursor-pointer group"
                    >
                      <div className="w-14 h-14 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden shadow-md group-hover:shadow-lg transition-shadow">
                        {user.profilePicture && user.profilePicture !== '/default.jpg' ? (
                          <img src={user.profilePicture} alt={user.username} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl text-white">👤</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                          {user.username}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">View profile</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/profile/${user.username}`);
                          }}
                          className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  ))}
                  {results.users.length === 0 && (
                    <p className="text-gray-500 text-center py-8">No users found</p>
                  )}
                </div>
                {results.users.length > 5 && (
                  <button
                    onClick={() => toggleExpandSection('users')}
                    className="w-full mt-4 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-medium rounded-lg transition-colors"
                  >
                    {expandedSections['users'] ? 'Show Less' : `View More (${results.users.length - 5} more)`}
                  </button>
                )}
              </div>
            </div>

            {/* Empty State */}
            {!isLoading && totalResults === 0 && query && (
              <div className="text-center py-20 bg-white rounded-xl shadow-lg border border-gray-100">
                <div className="text-7xl mb-6">🔍</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">No results found</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  We couldn't find anything matching "{query}". Try searching with different keywords.
                </p>
                <button
                  onClick={() => router.push('/')}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                  Go Home
                </button>
              </div>
            )}
          </>
        )}

        {!query && (
          <div className="text-center py-20 bg-white rounded-xl shadow-lg border border-gray-100">
            <div className="text-7xl mb-6">🎬</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Start Your Search</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Search for movies, games, TV shows, or users to discover new content and connect with others.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function SearchFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Loading search...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchResultsPage() {
  return (
    <Suspense fallback={<SearchFallback />}>
      <SearchContent />
    </Suspense>
  );
}
