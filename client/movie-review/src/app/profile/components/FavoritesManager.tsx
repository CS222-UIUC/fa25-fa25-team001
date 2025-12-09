"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface FavoritesManagerProps {
  userId: string;
  onClose: () => void;
}

export default function FavoritesManager({ userId, onClose }: FavoritesManagerProps) {
  const { data: session } = useSession();
  const [activeType, setActiveType] = useState<'games' | 'movies' | 'tvshows'>('games');
  const [favorites, setFavorites] = useState({
    games: [] as any[],
    movies: [] as any[],
    tvshows: [] as any[],
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);

  const isOwnProfile = session?.user?.id === userId;

  useEffect(() => {
    loadFavorites();
  }, [userId]);

  const loadFavorites = async () => {
    try {
      const response = await fetch(`/api/users/favorites?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setFavorites({
          games: data.favoriteGames || [],
          movies: data.favoriteMovies || [],
          tvshows: data.favoriteTvShows || [],
        });
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      let apiUrl = '';
      if (activeType === 'movies') {
        apiUrl = `/api/movies/search?title=${encodeURIComponent(searchQuery)}`;
      } else if (activeType === 'tvshows') {
        apiUrl = `/api/tvshows/search?title=${encodeURIComponent(searchQuery)}`;
      } else if (activeType === 'games') {
        apiUrl = `/api/rawg/games?q=${encodeURIComponent(searchQuery)}`;
      }

      const response = await fetch(apiUrl);
      if (response.ok) {
        const data = await response.json();
        
        let results: any[] = [];
        if (activeType === 'movies' && data.results) {
          results = data.results.slice(0, 12).map((m: any) => ({
            id: m.id,
            title: m.title,
            year: m.year,
            poster: m.poster,
          }));
        } else if (activeType === 'tvshows' && data.results) {
          results = data.results.slice(0, 12).map((t: any) => ({
            id: t.id,
            title: t.title,
            year: t.year,
            poster: t.poster,
          }));
        } else if (activeType === 'games' && data.games) {
          results = data.games.slice(0, 12).map((g: any) => ({
            id: g.id?.toString(),
            name: g.name,
            released: g.releaseDate ? new Date(g.releaseDate).getFullYear().toString() : null,
            background_image: g.cover,
          }));
        }
        
        setSearchResults(results);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddFavorite = async (item: any) => {
    const currentList = favorites[activeType];
    
    // Check if already in favorites
    const exists = currentList.some((fav: any) => {
      if (activeType === 'games') return fav.id === item.id || fav.name === item.name;
      return fav.id === item.id || fav.title === item.title;
    });

    if (exists) {
      alert('Already in favorites');
      return;
    }

    // Limit to 10 favorites per type
    if (currentList.length >= 10) {
      alert('Maximum 10 favorites per category');
      return;
    }

    const newFavorites = {
      ...favorites,
      [activeType]: [...currentList, item],
    };

    try {
      const response = await fetch('/api/users/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activeType,
          items: newFavorites[activeType],
        }),
      });

      if (response.ok) {
        setFavorites(newFavorites);
        setSearchQuery('');
        setSearchResults([]);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add favorite');
      }
    } catch (error) {
      console.error('Add favorite error:', error);
      alert('Failed to add favorite');
    }
  };

  const handleRemoveFavorite = async (index: number) => {
    const currentList = favorites[activeType];
    const newList = currentList.filter((_, i) => i !== index);

    try {
      const response = await fetch('/api/users/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activeType,
          items: newList,
        }),
      });

      if (response.ok) {
        setFavorites({
          ...favorites,
          [activeType]: newList,
        });
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to remove favorite');
      }
    } catch (error) {
      console.error('Remove favorite error:', error);
      alert('Failed to remove favorite');
    }
  };

  const currentFavorites = favorites[activeType];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {isOwnProfile ? 'Manage Favorites' : 'Favorites'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ✕
            </button>
          </div>

          {/* Type Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveType('games')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeType === 'games'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🎮 Games ({favorites.games.length})
            </button>
            <button
              onClick={() => setActiveType('movies')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeType === 'movies'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🎬 Movies ({favorites.movies.length})
            </button>
            <button
              onClick={() => setActiveType('tvshows')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeType === 'tvshows'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📺 TV Shows ({favorites.tvshows.length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Search (only for own profile) */}
          {isOwnProfile && (
            <div className="mb-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder={`Search for ${activeType}...`}
                />
                <button
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50"
                >
                  {isSearching ? '...' : 'Search'}
                </button>
              </div>

              {searchResults.length > 0 && (
                <div className="mt-4 grid grid-cols-4 sm:grid-cols-6 gap-3">
                  {searchResults.map((result, index) => (
                    <div
                      key={`${result.id}-${index}`}
                      className="cursor-pointer group"
                      onClick={() => handleAddFavorite(result)}
                    >
                      <div className="aspect-[2/3] bg-gray-200 rounded-lg overflow-hidden group-hover:ring-2 group-hover:ring-indigo-500 transition-all">
                        {(result.poster || result.background_image) && 
                         result.poster !== 'N/A' ? (
                          <img 
                            src={result.poster || result.background_image} 
                            alt={result.title || result.name} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs text-center p-2">
                            {result.title || result.name}
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-medium text-gray-900 mt-1 truncate">
                        {result.title || result.name}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Current Favorites */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Current Favorites ({currentFavorites.length}/10)
            </h3>
            
            {currentFavorites.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
                {currentFavorites.map((item: any, index: number) => (
                  <div key={index} className="relative group">
                    <div className="aspect-[2/3] bg-gray-200 rounded-lg overflow-hidden">
                      {(item.poster || item.background_image) && 
                       item.poster !== 'N/A' ? (
                        <img 
                          src={item.poster || item.background_image} 
                          alt={item.title || item.name} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs text-center p-2">
                          {item.title || item.name}
                        </div>
                      )}
                    </div>
                    <p className="text-xs font-medium text-gray-900 mt-1 truncate">
                      {item.title || item.name}
                    </p>
                    {isOwnProfile && (
                      <button
                        onClick={() => handleRemoveFavorite(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500">
                  {isOwnProfile 
                    ? `No favorite ${activeType} yet. Search and add some!` 
                    : `No favorite ${activeType} yet`}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
