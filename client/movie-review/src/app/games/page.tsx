'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';

interface Game {
  id: number;
  name: string;
  slug: string;
  summary?: string;
  rating?: string;
  cover?: string;
  genres: string[];
  platforms: string[];
  releaseDate?: string;
}

type SortOption = 'rating-high' | 'rating-low' | 'alphabetical' | 'release-newest' | 'release-oldest';

// Sort games based on selected option
const sortGames = (gamesToSort: Game[], sortOption: SortOption): Game[] => {
  const sorted = [...gamesToSort];
  
  switch (sortOption) {
    case 'rating-high':
      return sorted.sort((a, b) => {
        const ratingA = a.rating ? parseFloat(a.rating) : 0;
        const ratingB = b.rating ? parseFloat(b.rating) : 0;
        return ratingB - ratingA;
      });
    
    case 'rating-low':
      return sorted.sort((a, b) => {
        const ratingA = a.rating ? parseFloat(a.rating) : 0;
        const ratingB = b.rating ? parseFloat(b.rating) : 0;
        return ratingA - ratingB;
      });
    
    case 'alphabetical':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    
    case 'release-newest':
      return sorted.sort((a, b) => {
        const dateA = a.releaseDate ? new Date(a.releaseDate).getTime() : 0;
        const dateB = b.releaseDate ? new Date(b.releaseDate).getTime() : 0;
        return dateB - dateA; // Newest first
      });
    
    case 'release-oldest':
      return sorted.sort((a, b) => {
        const dateA = a.releaseDate ? new Date(a.releaseDate).getTime() : 0;
        const dateB = b.releaseDate ? new Date(b.releaseDate).getTime() : 0;
        return dateA - dateB; // Oldest first
      });
    
    default:
      return sorted;
  }
};

export default function GamesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [games, setGames] = useState<Game[]>([]);
  const [sortedGames, setSortedGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('rating-high');

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
      const response = await fetch(`/api/games/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();

      if (data.success) {
        const fetchedGames = data.games || [];
        setGames(fetchedGames);
        // Initial sort will be applied via useEffect
      } else {
        setError(data.error || 'Failed to search games');
        setGames([]);
        setSortedGames([]);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('An error occurred while searching');
      setGames([]);
      setSortedGames([]);
    } finally {
      setLoading(false);
    }
  };

  const getDefaultCover = () => 'https://via.placeholder.com/300x400?text=No+Cover';

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Unknown';
    return new Date(dateStr).getFullYear();
  };

  // Apply sorting when games or sortBy changes
  useEffect(() => {
    if (games.length > 0) {
      setSortedGames(sortGames(games, sortBy));
    } else {
      setSortedGames([]);
    }
  }, [games, sortBy]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-300 via-cyan-200 to-teal-300">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent mb-2 drop-shadow-md">Video Games</h1>
          <p className="text-lg text-sky-700 font-medium">Search and discover games</p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for games..."
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

        {/* Game Results */}
        {searched && !loading && (
          <div>
            {games.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-semibold text-sky-800">
                    Results ({games.length})
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
                      <option value="rating-high">Highest Rating</option>
                      <option value="rating-low">Lowest Rating</option>
                      <option value="alphabetical">Alphabetical (A-Z)</option>
                      <option value="release-newest">Release Date (Newest)</option>
                      <option value="release-oldest">Release Date (Oldest)</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {sortedGames.map((game, index) => (
                    <a
                      key={`${game.id}-${index}`}
                      href={`#`}
                      className="group glass-strong rounded-2xl overflow-hidden hover:shadow-2xl transition-all transform hover:scale-105"
                    >
                      <div className="aspect-[3/4] bg-gradient-to-br from-cyan-100 to-teal-100 overflow-hidden rounded-t-2xl">
                        <img
                          src={game.cover || getDefaultCover()}
                          alt={game.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-sky-800 mb-1 line-clamp-2 group-hover:text-cyan-600 transition-colors">
                          {game.name}
                        </h3>
                        <div className="flex items-center justify-between text-sm text-sky-600">
                          <p>{formatDate(game.releaseDate)}</p>
                          {game.rating && (
                            <span className="flex items-center text-amber-500">
                              ⭐ {game.rating}
                            </span>
                          )}
                        </div>
                        {game.platforms.length > 0 && (
                          <p className="text-xs text-sky-500 mt-2 line-clamp-1">
                            {game.platforms.slice(0, 3).join(', ')}
                            {game.platforms.length > 3 && '...'}
                          </p>
                        )}
                      </div>
                    </a>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12 glass-strong rounded-2xl">
                <p className="text-sky-700 text-lg font-medium">No games found. Try a different search.</p>
              </div>
            )}
          </div>
        )}

        {/* Featured Games - Show when no search */}
        {!searched && !loading && (
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-sky-800">Featured Games</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {['The Witcher 3', 'Elden Ring', 'God of War', 'Cyberpunk 2077'].map((title) => (
                <div
                  key={title}
                  className="glass-strong rounded-2xl overflow-hidden animate-pulse"
                >
                  <div className="aspect-[3/4] bg-gradient-to-br from-cyan-200 to-teal-200" />
                  <div className="p-4">
                    <div className="h-4 bg-sky-300/50 rounded mb-2" />
                    <div className="h-4 bg-sky-300/50 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-center text-sky-700 mt-8 font-medium">
              Search for your favorite games above!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

