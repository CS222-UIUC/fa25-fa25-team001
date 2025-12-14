"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Film, Tv, Gamepad2, Heart, Plus, Search, X, Trash2 } from 'lucide-react';

interface User {
  id: string;
  username: string;
}

interface FavoritesTabProps {
  user: User;
}

interface FavoriteItem {
  id: string;
  type: 'movie' | 'tv' | 'game';
  title: string;
  image?: string;
  mediaId: string;
  // Additional fields for API compatibility
  name?: string;
  background_image?: string;
  poster?: string;
  year?: string;
}

export default function FavoritesTab({ user }: FavoritesTabProps) {
  const { data: session } = useSession();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchType, setSearchType] = useState<'movie' | 'tv' | 'game'>('movie');

  const isOwnProfile = session?.user?.id === user.id;

  useEffect(() => {
    loadFavorites();
  }, [user.id]);

  const loadFavorites = async () => {
    try {
      const response = await fetch(`/api/users/favorites?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        const allFavorites: FavoriteItem[] = [];

        // Map Games
        if (Array.isArray(data.favoriteGames)) {
          data.favoriteGames.forEach((g: any) => {
            allFavorites.push({
              id: `game-${g.id}`,
              type: 'game',
              title: g.name,
              image: g.background_image || g.cover || g.poster, // Try multiple fields
              mediaId: g.id,
              name: g.name,
              background_image: g.background_image || g.cover || g.poster
            });
          });
        }

        // Map Movies
        if (Array.isArray(data.favoriteMovies)) {
          data.favoriteMovies.forEach((m: any) => {
            allFavorites.push({
              id: `movie-${m.id}`,
              type: 'movie',
              title: m.title,
              image: m.poster,
              mediaId: m.id,
              poster: m.poster,
              year: m.year
            });
          });
        }

        // Map TV Shows
        if (Array.isArray(data.favoriteTvShows)) {
          data.favoriteTvShows.forEach((t: any) => {
            allFavorites.push({
              id: `tv-${t.id}`,
              type: 'tv',
              title: t.title,
              image: t.poster,
              mediaId: t.id,
              poster: t.poster,
              year: t.year
            });
          });
        }

        setFavorites(allFavorites);
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      let apiUrl = '';
      if (searchType === 'movie') {
        apiUrl = `/api/movies/search?title=${encodeURIComponent(searchQuery)}`;
      } else if (searchType === 'tv') {
        apiUrl = `/api/tvshows/search?title=${encodeURIComponent(searchQuery)}`;
      } else if (searchType === 'game') {
        apiUrl = `/api/rawg/games?q=${encodeURIComponent(searchQuery)}`;
      }

      const response = await fetch(apiUrl);
      if (response.ok) {
        const data = await response.json();
        let results: any[] = [];
        
        if (searchType === 'movie' && data.results) {
          results = data.results.slice(0, 10).map((m: any) => ({
            id: m.imdbID || m.id,
            title: m.Title || m.title,
            year: m.Year || m.year,
            poster: m.Poster || m.poster,
            type: 'movie'
          }));
        } else if (searchType === 'tv' && data.results) {
          results = data.results.slice(0, 10).map((t: any) => ({
            id: t.imdbID || t.id,
            title: t.Title || t.title,
            year: t.Year || t.year,
            poster: t.Poster || t.poster,
            type: 'tv'
          }));
        } else if (searchType === 'game' && data.games) {
          results = data.games.slice(0, 10).map((g: any) => ({
            id: g.id,
            title: g.name,
            year: g.released ? new Date(g.released).getFullYear() : '',
            poster: g.cover || g.background_image,
            type: 'game'
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
    // Determine the type and prepare the item object for storage
    let typeKey = '';
    let newItem = {};

    if (searchType === 'movie') {
      typeKey = 'movies';
      newItem = {
        id: item.id,
        title: item.title,
        year: item.year,
        poster: item.poster
      };
    } else if (searchType === 'tv') {
      typeKey = 'tvshows';
      newItem = {
        id: item.id,
        title: item.title,
        year: item.year,
        poster: item.poster
      };
    } else if (searchType === 'game') {
      typeKey = 'games';
      newItem = {
        id: item.id,
        name: item.title,
        background_image: item.poster
      };
    }

    // Get current items of this type
    const currentItems = favorites
      .filter(f => f.type === searchType)
      .map(f => {
        if (f.type === 'game') {
          return { id: f.mediaId, name: f.title, background_image: f.image };
        } else {
          return { id: f.mediaId, title: f.title, poster: f.image, year: f.year };
        }
      });

    // Check if already exists
    if (currentItems.some((i: any) => i.id.toString() === item.id.toString())) {
      alert('Already in favorites!');
      return;
    }

    const updatedItems = [...currentItems, newItem];

    try {
      const response = await fetch('/api/users/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: typeKey,
          items: updatedItems
        }),
      });

      if (response.ok) {
        loadFavorites();
        // Don't close modal to allow adding more
        setSearchQuery('');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Failed to add favorite:', error);
    }
  };

  const handleRemoveFavorite = async (item: FavoriteItem) => {
    if (!confirm('Remove from favorites?')) return;

    let typeKey = '';
    if (item.type === 'movie') typeKey = 'movies';
    else if (item.type === 'tv') typeKey = 'tvshows';
    else if (item.type === 'game') typeKey = 'games';

    const currentItems = favorites
      .filter(f => f.type === item.type && f.id !== item.id)
      .map(f => {
        if (f.type === 'game') {
          return { id: f.mediaId, name: f.title, background_image: f.image };
        } else {
          return { id: f.mediaId, title: f.title, poster: f.image, year: f.year };
        }
      });

    try {
      const response = await fetch('/api/users/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: typeKey,
          items: currentItems
        }),
      });

      if (response.ok) {
        // Update local state immediately
        setFavorites(favorites.filter(f => f.id !== item.id));
      }
    } catch (error) {
      console.error('Failed to remove favorite:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const movies = favorites.filter(f => f.type === 'movie');
  const tvShows = favorites.filter(f => f.type === 'tv');
  const games = favorites.filter(f => f.type === 'game');

  const renderSection = (title: string, items: FavoriteItem[], icon: React.ReactNode) => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-lg font-semibold text-muted-foreground">
        {icon}
        <h3>{title}</h3>
        <span className="text-sm bg-secondary px-2 py-0.5 rounded-full">{items.length}</span>
      </div>
      
      {items.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {items.map((item) => (
            <div key={item.id} className="group relative bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-all hover:shadow-lg">
              <Link href={`/${item.type === 'game' ? 'game' : item.type === 'movie' ? 'movie' : 'tv'}/${item.mediaId}`}>
                <div className="aspect-[2/3] relative overflow-hidden bg-secondary">
                  {item.image ? (
                    <img 
                      src={item.image} 
                      alt={item.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      {item.type === 'movie' ? <Film className="h-10 w-10" /> : item.type === 'tv' ? <Tv className="h-10 w-10" /> : <Gamepad2 className="h-10 w-10" />}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                    <p className="text-white font-medium truncate">{item.title}</p>
                  </div>
                </div>
              </Link>
              
              {isOwnProfile && (
                <button
                  onClick={() => handleRemoveFavorite(item)}
                  className="absolute top-2 right-2 p-2 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-white"
                  title="Remove from favorites"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground italic pl-8">No favorites added yet.</div>
      )}
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Favorites</h2>
        {isOwnProfile && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Favorites
          </button>
        )}
      </div>

      {renderSection('Favorite Movies', movies, <Film className="h-5 w-5" />)}
      {renderSection('Favorite TV Shows', tvShows, <Tv className="h-5 w-5" />)}
      {renderSection('Favorite Games', games, <Gamepad2 className="h-5 w-5" />)}

      {/* Add Favorite Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-card border border-border w-full max-w-2xl rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Add Favorites</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex gap-2 mb-4">
              {(['movie', 'tv', 'game'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setSearchType(type);
                    setSearchResults([]);
                    setSearchQuery('');
                  }}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${
                    searchType === type
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-secondary border-transparent hover:bg-secondary/80'
                  }`}
                >
                  {type === 'movie' ? 'Movies' : type === 'tv' ? 'TV Shows' : 'Games'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSearch} className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-secondary border border-input rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={`Search ${searchType === 'movie' ? 'movies' : searchType === 'tv' ? 'TV shows' : 'games'}... (Press Enter)`}
                autoFocus
              />
            </form>

            <div className="flex-1 overflow-y-auto min-h-[300px]">
              {isSearching ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleAddFavorite(result)}
                      className="text-left group relative bg-secondary/50 border border-transparent hover:border-primary/50 rounded-lg overflow-hidden transition-all"
                    >
                      <div className="aspect-[2/3] relative bg-secondary">
                        {result.poster ? (
                          <img src={result.poster} alt={result.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            {searchType === 'movie' ? <Film /> : searchType === 'tv' ? <Tv /> : <Gamepad2 />}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Plus className="h-8 w-8 text-white" />
                        </div>
                      </div>
                      <div className="p-2">
                        <p className="font-medium text-sm truncate">{result.title}</p>
                        <p className="text-xs text-muted-foreground">{result.year}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : searchQuery && !isSearching ? (
                <div className="text-center py-12 text-muted-foreground">
                  No results found
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Type a title and press Enter to search
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
