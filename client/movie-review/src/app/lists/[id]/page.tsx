/**
 * ============================================================================
 * PAGE: List Detail Page
 * ============================================================================
 * Route: /lists/[id]
 * Purpose: View and edit a specific custom list
 * Features:
 *   - View all items in the list
 *   - Add items to the list
 *   - Remove items from the list
 *   - Reorder items
 *   - Edit list details
 * ============================================================================
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';

interface ListItem {
  id: string;
  position: number;
  notes?: string;
  itemType: 'game' | 'movie' | 'tv' | null;
  mediaId: string | null;
  title: string | null;
  year: number | null;
}

interface List {
  id: string;
  title: string;
  description?: string;
  isPublic: boolean;
  items: ListItem[];
  user: { id: string; username: string };
}


export default function ListDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const listId = params.id as string;

  const [list, setList] = useState<List | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showAddItems, setShowAddItems] = useState(false);
  const [items, setItems] = useState<ListItem[]>([]);
  const [itemDetails, setItemDetails] = useState<Record<string, { cover?: string; year?: number }>>({});
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    isPublic: true,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTab, setSearchTab] = useState<'games' | 'movies' | 'tv'>('games');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    games: Array<{ id: number; name: string; cover?: string; releaseDate?: string }>;
    movies: Array<{ id: string; title: string; year: number; poster?: string }>;
    tvShows: Array<{ id: string; title: string; year: number; poster?: string }>;
  }>({ games: [], movies: [], tvShows: [] });

  useEffect(() => {
    if (session && listId) {
      loadList();
    }
  }, [session, listId]);

  const loadList = async () => {
    try {
      const response = await fetch(`/api/lists/${listId}`);
      const data = await response.json();
      if (data.success && data.list) {
        setList(data.list);
        // Sort items by position and set them
        const sortedItems = [...data.list.items].sort((a, b) => a.position - b.position);
        setItems(sortedItems);
        setEditForm({
          title: data.list.title,
          description: data.list.description || '',
          isPublic: data.list.isPublic,
        });

        // Fetch poster/cover images for items
        if (sortedItems.length > 0) {
          const gameIds: string[] = [];
          const gameTitles: string[] = [];
          const movieTitles: string[] = [];
          const tvTitles: string[] = [];

          sortedItems.forEach(item => {
            if (item.itemType === 'game' && item.mediaId && !isNaN(Number(item.mediaId))) {
              gameIds.push(item.mediaId);
            } else if (item.itemType === 'game' && item.title) {
              gameTitles.push(item.title);
            } else if (item.itemType === 'movie' && item.title) {
              movieTitles.push(item.title);
            } else if (item.itemType === 'tv' && item.title) {
              tvTitles.push(item.title);
            }
          });

          const detailsMap: Record<string, { cover?: string; year?: number }> = {};

          // Fetch game details
          if (gameIds.length > 0 || gameTitles.length > 0) {
            try {
              const params = new URLSearchParams();
              if (gameIds.length > 0) params.append('ids', gameIds.join(','));
              if (gameTitles.length > 0) params.append('titles', gameTitles.join(','));
              const gamesRes = await fetch(`/api/games/details?${params.toString()}`);
              const gamesData = await gamesRes.json();
              if (gamesData.success && gamesData.games) {
                sortedItems.forEach(item => {
                  if (item.itemType === 'game') {
                    const byId = gamesData.games[item.mediaId || ''];
                    const byTitle = gamesData.games[item.title || ''];
                    const details = byId || byTitle;
                    if (details) {
                      detailsMap[item.id] = details;
                    }
                  }
                });
              }
            } catch (error) {
              console.error('Error fetching game details:', error);
            }
          }

          // Fetch movie details
          if (movieTitles.length > 0) {
            try {
              const moviesRes = await fetch(`/api/movies/details?titles=${encodeURIComponent(movieTitles.join(','))}`);
              const moviesData = await moviesRes.json();
              if (moviesData.success && moviesData.movies) {
                sortedItems.forEach(item => {
                  if (item.itemType === 'movie' && item.title && moviesData.movies[item.title]) {
                    detailsMap[item.id] = moviesData.movies[item.title];
                  }
                });
              }
            } catch (error) {
              console.error('Error fetching movie details:', error);
            }
          }

          // Fetch TV show details
          if (tvTitles.length > 0) {
            try {
              const tvRes = await fetch(`/api/tv/details?titles=${encodeURIComponent(tvTitles.join(','))}`);
              const tvData = await tvRes.json();
              if (tvData.success && tvData.shows) {
                sortedItems.forEach(item => {
                  if (item.itemType === 'tv' && item.title && tvData.shows[item.title]) {
                    detailsMap[item.id] = tvData.shows[item.title];
                  }
                });
              }
            } catch (error) {
              console.error('Error fetching TV show details:', error);
            }
          }

          setItemDetails(detailsMap);
        }
      }
    } catch (error) {
      console.error('Error loading list:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateList = async () => {
    try {
      const response = await fetch(`/api/lists/${listId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      const data = await response.json();
      if (data.success) {
        setList(data.list ? { ...list!, ...data.list } : list);
        setEditing(false);
        loadList(); // Reload to refresh
      } else {
        alert(data.error || 'Failed to update list');
      }
    } catch (error) {
      console.error('Error updating list:', error);
      alert('Failed to update list');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Remove this item from the list?')) return;

    try {
      const response = await fetch(`/api/lists/${listId}/items/${itemId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        // Remove from local state
        setItems(items.filter(item => item.id !== itemId));
        loadList(); // Reload to get updated positions
      } else {
        alert(data.error || 'Failed to remove item');
      }
    } catch (error) {
      console.error('Error removing item:', error);
      alert('Failed to remove item');
    }
  };

  const performSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setSearchResults({ games: [], movies: [], tvShows: [] });
      return;
    }

    setSearchLoading(true);
    try {
      // Search games
      let gamesResults: Array<{ id: number; name: string; cover?: string; releaseDate?: string }> = [];
      try {
        const gamesResponse = await fetch(`/api/games/search?q=${encodeURIComponent(searchTerm)}&limit=20`);
        if (gamesResponse.ok) {
          const contentType = gamesResponse.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const gamesData = await gamesResponse.json();
            if (gamesData.success && gamesData.games) {
              gamesResults = gamesData.games;
            }
          }
        }
      } catch (gameError: any) {
        console.warn('Game search unavailable:', gameError?.message);
      }
      
      // Search movies
      let moviesList: Array<{ id: string; title: string; year: number; poster?: string }> = [];
      try {
        const moviesResponse = await fetch(`/api/movies/search?q=${encodeURIComponent(searchTerm)}&limit=20`);
        if (moviesResponse.ok) {
          const contentType = moviesResponse.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const moviesData = await moviesResponse.json();
            if (moviesData.success && moviesData.movies) {
              moviesList = moviesData.movies.map((movie: any) => ({
                id: movie.imdbID || movie.id,
                title: movie.Title || movie.title,
                year: parseInt(movie.Year || movie.year) || 0,
                poster: (movie.Poster || movie.poster) && (movie.Poster || movie.poster) !== 'N/A' 
                  ? (movie.Poster || movie.poster) 
                  : undefined,
              }));
            }
          }
        }
      } catch (movieError: any) {
        console.warn('Movie search error:', movieError?.message || movieError);
      }
      
      // Search TV shows
      let tvList: Array<{ id: string; title: string; year: number; poster?: string }> = [];
      try {
        const tvResponse = await fetch(`/api/tv/search?q=${encodeURIComponent(searchTerm)}&limit=20`);
        if (tvResponse.ok) {
          const contentType = tvResponse.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const tvData = await tvResponse.json();
            if (tvData.success && tvData.shows) {
              tvList = tvData.shows.map((show: any) => ({
                id: show.imdbID || show.id,
                title: show.Title || show.title,
                year: parseInt(show.Year || show.year) || 0,
                poster: (show.Poster || show.poster) && (show.Poster || show.poster) !== 'N/A' 
                  ? (show.Poster || show.poster) 
                  : undefined,
              }));
            }
          }
        }
      } catch (tvError: any) {
        console.warn('TV show search error:', tvError?.message || tvError);
      }
      
      setSearchResults({
        games: gamesResults,
        movies: moviesList,
        tvShows: tvList,
      });
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddItem = async (
    itemType: 'game' | 'movie' | 'tv',
    externalId: string,
    itemName: string,
    itemCover?: string,
    itemYear?: number
  ) => {
    try {
      const response = await fetch(`/api/lists/${listId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemType,
          externalId,
          itemName,
          itemCover,
          itemYear,
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Reload the list to show the new item
        loadList();
        // Clear search
        setSearchQuery('');
        setSearchResults({ games: [], movies: [], tvShows: [] });
      } else {
        alert(data.error || 'Failed to add item');
      }
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Failed to add item');
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-300 via-cyan-200 to-teal-300">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-sky-700">Loading list...</p>
        </div>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-300 via-cyan-200 to-teal-300">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-sky-800 mb-4">List Not Found</h1>
          <Link href="/lists" className="text-cyan-600 hover:text-cyan-500">
            Return to My Lists
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = session?.user?.id === list.user.id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-300 via-cyan-200 to-teal-300">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* List Header */}
        <div className="mb-8 glass-strong rounded-2xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              {editing ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full px-4 py-2 glass-strong rounded-xl text-sky-900 text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                    placeholder="List Title"
                  />
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full px-4 py-2 glass-strong rounded-xl text-sky-900 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                    placeholder="Description"
                    rows={3}
                  />
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editForm.isPublic}
                        onChange={(e) => setEditForm({ ...editForm, isPublic: e.target.checked })}
                        className="w-4 h-4 text-cyan-600"
                      />
                      <span className="text-sm text-sky-700 font-medium">Public</span>
                    </label>
                    <button
                      onClick={handleUpdateList}
                      className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white font-semibold rounded-xl transition-all"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditing(false);
                        setShowAddItems(false);
                      }}
                      className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-4xl font-bold text-sky-800 mb-2">{list.title}</h1>
                  {list.description && (
                    <p className="text-base text-sky-700 mb-4">{list.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-sky-600">
                    <span>By {list.user.username}</span>
                    <span>•</span>
                    <span>{list.items.length} {list.items.length === 1 ? 'item' : 'items'}</span>
                    <span>•</span>
                    <span className={list.isPublic ? 'text-green-600' : 'text-gray-600'}>
                      {list.isPublic ? 'Public' : 'Private'}
                    </span>
                  </div>
                </>
              )}
            </div>
            {isOwner && !editing && (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditing(true);
                    setShowAddItems(true);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white font-semibold rounded-xl transition-all"
                >
                  Edit
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Add Items Interface */}
        {isOwner && editing && showAddItems && (
          <div className="mb-8 glass-strong rounded-2xl p-6">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-sky-800 mb-4">Add Items to List</h2>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value.trim()) {
                    performSearch(e.target.value);
                  } else {
                    setSearchResults({ games: [], movies: [], tvShows: [] });
                  }
                }}
                placeholder="Search for games, movies, or TV shows..."
                className="w-full px-4 py-3 glass-strong rounded-xl text-sky-900 placeholder-sky-600/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
              />
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setSearchTab('games')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  searchTab === 'games'
                    ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white'
                    : 'bg-white/20 text-sky-700 hover:bg-white/30'
                }`}
              >
                Games
              </button>
              <button
                type="button"
                onClick={() => setSearchTab('movies')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  searchTab === 'movies'
                    ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white'
                    : 'bg-white/20 text-sky-700 hover:bg-white/30'
                }`}
              >
                Movies
              </button>
              <button
                type="button"
                onClick={() => setSearchTab('tv')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  searchTab === 'tv'
                    ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white'
                    : 'bg-white/20 text-sky-700 hover:bg-white/30'
                }`}
              >
                TV Shows
              </button>
            </div>

            {/* Search Results */}
            {searchLoading ? (
              <div className="text-center py-8 text-sky-600">Searching...</div>
            ) : searchQuery.trim() ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-96 overflow-y-auto">
                {searchTab === 'games' && searchResults.games.map((game) => {
                  const year = game.releaseDate ? new Date(game.releaseDate).getFullYear() : undefined;
                  return (
                    <div
                      key={game.id}
                      className="glass-strong rounded-xl overflow-hidden hover:shadow-xl transition-all"
                    >
                      <div className="aspect-[2/3] bg-gradient-to-br from-cyan-100 to-teal-100 overflow-hidden relative">
                        {game.cover ? (
                          <img
                            src={game.cover}
                            alt={game.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-sky-600 text-xs">
                            No Cover
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h4 className="font-semibold text-sky-800 text-sm mb-1 line-clamp-2">{game.name}</h4>
                        {year && (
                          <p className="text-xs text-sky-600 mb-2">{year}</p>
                        )}
                        <button
                          type="button"
                          onClick={() => handleAddItem(
                            'game',
                            game.id.toString(),
                            game.name,
                            game.cover,
                            year
                          )}
                          className="w-full px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white text-xs font-semibold rounded-lg transition-all"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  );
                })}
                {searchTab === 'movies' && searchResults.movies.map((movie) => (
                  <div
                    key={movie.id}
                    className="glass-strong rounded-xl overflow-hidden hover:shadow-xl transition-all"
                  >
                    <div className="aspect-[2/3] bg-gradient-to-br from-cyan-100 to-teal-100 overflow-hidden relative">
                      {movie.poster ? (
                        <img
                          src={movie.poster}
                          alt={movie.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sky-600 text-xs">
                          No Poster
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h4 className="font-semibold text-sky-800 text-sm mb-1 line-clamp-2">{movie.title}</h4>
                      <p className="text-xs text-sky-600 mb-2">{movie.year}</p>
                      <button
                        type="button"
                        onClick={() => handleAddItem(
                          'movie',
                          movie.id,
                          movie.title,
                          movie.poster,
                          movie.year
                        )}
                        className="w-full px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white text-xs font-semibold rounded-lg transition-all"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                ))}
                {searchTab === 'tv' && searchResults.tvShows.map((show) => (
                  <div
                    key={show.id}
                    className="glass-strong rounded-xl overflow-hidden hover:shadow-xl transition-all"
                  >
                    <div className="aspect-[2/3] bg-gradient-to-br from-cyan-100 to-teal-100 overflow-hidden relative">
                      {show.poster ? (
                        <img
                          src={show.poster}
                          alt={show.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sky-600 text-xs">
                          No Poster
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h4 className="font-semibold text-sky-800 text-sm mb-1 line-clamp-2">{show.title}</h4>
                      <p className="text-xs text-sky-600 mb-2">{show.year}</p>
                      <button
                        type="button"
                        onClick={() => handleAddItem(
                          'tv',
                          show.id,
                          show.title,
                          show.poster,
                          show.year
                        )}
                        className="w-full px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white text-xs font-semibold rounded-lg transition-all"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                ))}
                {((searchTab === 'games' && searchResults.games.length === 0) ||
                  (searchTab === 'movies' && searchResults.movies.length === 0) ||
                  (searchTab === 'tv' && searchResults.tvShows.length === 0)) && (
                  <div className="col-span-full text-center py-8 text-sky-600">
                    No results found. Try a different search term.
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-sky-600">
                Enter a search term to find games, movies, or TV shows to add to your list.
              </div>
            )}
          </div>
        )}

        {/* List Items */}
        {items.length === 0 ? (
          <div className="text-center py-12 glass-strong rounded-2xl">
            <p className="text-sky-700 text-lg font-medium mb-4">This list is empty.</p>
            <p className="text-sky-600 mb-4">Add items when creating a list!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {items.map((item) => {
              const getItemLink = () => {
                if (item.itemType === 'game' && item.mediaId) {
                  return `/games/${item.mediaId}`;
                } else if (item.itemType === 'movie' && item.mediaId) {
                  return `/movies/${item.mediaId}`;
                } else if (item.itemType === 'tv' && item.mediaId) {
                  return `/tv/${item.mediaId}`;
                }
                return '#';
              };

              const getDefaultPoster = () => 'https://via.placeholder.com/300x450?text=No+Poster';
              const poster = itemDetails[item.id]?.cover || getDefaultPoster();
              const year = itemDetails[item.id]?.year || item.year;

              return (
                <div key={item.id} className="group glass-strong rounded-2xl overflow-hidden hover:shadow-2xl transition-all transform hover:scale-105 relative">
                  <Link href={getItemLink()}>
                    <div className="aspect-[2/3] bg-gradient-to-br from-cyan-100 to-teal-100 overflow-hidden rounded-t-2xl">
                      <img
                        src={poster}
                        alt={item.title || 'Item'}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-sky-800 mb-1 line-clamp-2 group-hover:text-cyan-600 transition-colors">
                        {item.title || 'Untitled'}
                      </h3>
                      <div className="flex items-center justify-between text-sm text-sky-600">
                        {year && <p>{year}</p>}
                        {item.itemType && (
                          <span className="text-xs bg-gradient-to-r from-cyan-500 to-teal-500 text-white px-2 py-1 rounded-full">
                            {item.itemType === 'game' ? 'Game' : item.itemType === 'movie' ? 'Movie' : 'TV Show'}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                  {isOwner && (
                    <div className="px-4 pb-4">
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="w-full px-3 py-1 bg-rose-500/20 text-rose-700 rounded-lg text-sm font-medium hover:bg-rose-500/30 transition-all"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8">
          <Link
            href="/lists"
            className="text-cyan-600 hover:text-cyan-500 font-medium"
          >
            ← Back to My Lists
          </Link>
        </div>
      </div>
    </div>
  );
}

