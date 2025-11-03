"use client";

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { searchGames, getCoverImageUrl } from '@/lib/api/igdb';
import { searchMovies } from '@/lib/api/omdb';

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

  return (
    <div className="min-h-screen bg-gray-50bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900text-white mb-4">Search</h1>
          <form onSubmit={handleSearch} className="max-w-2xl">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
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
                className="block w-full pl-10 pr-4 py-3 border border-gray-300border-gray-700 rounded-lg bg-whitebg-gray-800 text-gray-900text-white placeholder-gray-500placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </form>
        </div>

        {query && (
          <>
            {/* Tabs */}
            <div className="mb-6">
              <div className="border-b border-gray-200border-gray-700">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab('games')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'games'
                        ? 'border-blue-500border-blue-400 text-blue-600text-blue-400'
                        : 'border-transparent text-gray-500text-gray-400 hover:text-gray-700hover:text-gray-300 hover:border-gray-300hover:border-gray-600'
                    }`}
                  >
                    Games ({games.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('movies')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'movies'
                        ? 'border-blue-500border-blue-400 text-blue-600text-blue-400'
                        : 'border-transparent text-gray-500text-gray-400 hover:text-gray-700hover:text-gray-300 hover:border-gray-300hover:border-gray-600'
                    }`}
                  >
                    Movies ({movies.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('tv')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'tv'
                        ? 'border-blue-500border-blue-400 text-blue-600text-blue-400'
                        : 'border-transparent text-gray-500text-gray-400 hover:text-gray-700hover:text-gray-300 hover:border-gray-300hover:border-gray-600'
                    }`}
                  >
                    TV Shows ({tvShows.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('users')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'users'
                        ? 'border-blue-500border-blue-400 text-blue-600text-blue-400'
                        : 'border-transparent text-gray-500text-gray-400 hover:text-gray-700hover:text-gray-300 hover:border-gray-300hover:border-gray-600'
                    }`}
                  >
                    Users ({users.length})
                  </button>
                </nav>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="text-xl text-gray-600text-gray-400">Searching...</div>
              </div>
            ) : (
              <>
                {/* Games Tab */}
                {activeTab === 'games' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {games.map(game => (
                      <div key={game.id} className="bg-whitebg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="aspect-[2/3] bg-gray-200bg-gray-700 flex items-center justify-center overflow-hidden">
                          {game.cover?.image_id ? (
                            <img
                              src={getCoverImageUrl(game.cover.image_id, 'cover_big')}
                              alt={game.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-gray-500text-gray-400">No Cover</span>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-lg mb-2 text-gray-900text-white">{game.name}</h3>
                          {game.first_release_date && (
                            <p className="text-gray-600text-gray-400 mb-2 text-sm">
                              {new Date(game.first_release_date * 1000).getFullYear()}
                            </p>
                          )}
                          {game.rating && (
                            <div className="flex items-center">
                              <span className="text-yellow-500">⭐</span>
                              <span className="ml-1 text-sm font-medium text-gray-900text-white">{(game.rating / 10).toFixed(1)}/10</span>
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
                    {movies.map(movie => (
                      <div key={movie.id} className="bg-whitebg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="aspect-[2/3] bg-gray-200bg-gray-700 flex items-center justify-center overflow-hidden">
                          {movie.poster ? (
                            <img
                              src={movie.poster}
                              alt={movie.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-gray-500text-gray-400">No Poster</span>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-lg mb-2 text-gray-900text-white">{movie.title}</h3>
                          <p className="text-gray-600text-gray-400 mb-2 text-sm">{movie.year}</p>
                          {movie.rating && (
                            <div className="flex items-center">
                              <span className="text-yellow-500">⭐</span>
                              <span className="ml-1 text-sm font-medium text-gray-900text-white">{movie.rating}/10</span>
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
                    {tvShows.map(tv => (
                      <div key={tv.id} className="bg-whitebg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="aspect-[2/3] bg-gray-200bg-gray-700 flex items-center justify-center overflow-hidden">
                          {tv.poster ? (
                            <img
                              src={tv.poster}
                              alt={tv.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-gray-500text-gray-400">No Poster</span>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-lg mb-2 text-gray-900text-white">{tv.title}</h3>
                          <p className="text-gray-600text-gray-400 mb-2 text-sm">{tv.year}</p>
                          {tv.rating && (
                            <div className="flex items-center">
                              <span className="text-yellow-500">⭐</span>
                              <span className="ml-1 text-sm font-medium text-gray-900text-white">{tv.rating}/10</span>
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
                      <div key={user.id} className="bg-whitebg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-center space-x-4">
                          <img
                            src={user.profilePicture || '/default.jpg'}
                            alt={user.username}
                            className="w-12 h-12 rounded-full"
                          />
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900text-white">{user.username}</h3>
                            <p className="text-gray-600text-gray-400 text-sm">Movie Enthusiast</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* No Results */}
                {!loading && activeTab === 'games' && games.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500text-gray-400 text-lg">No games found for "{query}"</p>
                  </div>
                )}

                {!loading && activeTab === 'movies' && movies.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500text-gray-400 text-lg">No movies found for "{query}"</p>
                  </div>
                )}

                {!loading && activeTab === 'tv' && tvShows.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500text-gray-400 text-lg">No TV shows found for "{query}"</p>
                  </div>
                )}

                {!loading && activeTab === 'users' && users.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500text-gray-400 text-lg">No users found for "{query}"</p>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {!query && (
          <div className="text-center py-12">
            <p className="text-gray-500text-gray-400 text-lg">Enter a search term to find games, movies, and TV shows</p>
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