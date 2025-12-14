/**
 * ============================================================================
 * PAGE: My Lists Page
 * ============================================================================
 * Route: /lists
 * Purpose: View and manage all custom lists created by the user
 * Features:
 *   - View all lists
 *   - Create new lists with items
 *   - Edit/delete existing lists
 *   - View list item counts
 * ============================================================================
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Header from '@/components/Header';

interface List {
  id: string;
  title: string;
  description?: string;
  isPublic: boolean;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

interface DraftListItem {
  id: string;
  itemType: 'game' | 'movie' | 'tv';
  externalId: string;
  itemName: string;
  itemCover?: string;
  itemYear?: number;
}

export default function ListsPage() {
  const { data: session, status } = useSession();
  const [lists, setLists] = useState<List[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newList, setNewList] = useState({
    title: '',
    description: '',
    mediaType: '',
    isPublic: true,
  });
  const [draftItems, setDraftItems] = useState<DraftListItem[]>([]);
  const [showAddItems, setShowAddItems] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    games: Array<{ id: number; name: string; cover?: string; releaseDate?: string }>;
    movies: Array<{ id: string; title: string; year: number; poster?: string }>;
    tvShows: Array<{ id: string; title: string; year: number; poster?: string }>;
  }>({ games: [], movies: [], tvShows: [] });
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTab, setSearchTab] = useState<'games' | 'movies' | 'tv'>('games');

  useEffect(() => {
    if (session) {
      loadLists();
    }
  }, [session]);

  const loadLists = async () => {
    try {
      const response = await fetch('/api/lists');
      const data = await response.json();
      if (data.success) {
        setLists(data.lists || []);
      }
    } catch (error) {
      console.error('Error loading lists:', error);
    } finally {
      setLoading(false);
    }
  };

  const performSearch = useCallback(async (searchTerm: string) => {
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
        if (!gamesResponse.ok) {
          throw new Error(`Games API error: ${gamesResponse.status}`);
        }
        const contentType = gamesResponse.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Invalid response type from games API');
        }
        let gamesData;
        try {
          gamesData = await gamesResponse.json();
        } catch (jsonError) {
          throw new Error('Failed to parse games API response');
        }
        if (gamesData.success && gamesData.games) {
          gamesResults = gamesData.games;
        }
      } catch (gameError: any) {
        // Silently handle game search errors
        if (gameError?.message) {
          console.warn('Game search unavailable:', gameError.message);
        }
      }
      
      // Search movies/TV shows via API routes
      let moviesList: Array<{ id: string; title: string; year: number; poster?: string }> = [];
      let tvList: Array<{ id: string; title: string; year: number; poster?: string }> = [];
      
      // Search movies
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
        movies: moviesList.slice(0, 20),
        tvShows: tvList.slice(0, 20),
      });
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults({ games: [], movies: [], tvShows: [] });
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const handleAddDraftItem = (
    itemType: 'game' | 'movie' | 'tv',
    externalId: string,
    itemName: string,
    itemCover?: string,
    itemYear?: number
  ) => {
    // Check if already added
    if (draftItems.some(item => item.externalId === externalId && item.itemType === itemType)) {
      alert('This item is already in your list');
      return;
    }

    const newItem: DraftListItem = {
      id: `${itemType}-${externalId}-${Date.now()}`,
      itemType,
      externalId,
      itemName,
      itemCover,
      itemYear,
    };
    setDraftItems([...draftItems, newItem]);
    setSearchQuery('');
    setSearchResults({ games: [], movies: [], tvShows: [] });
  };

  const handleRemoveDraftItem = (itemId: string) => {
    setDraftItems(draftItems.filter(item => item.id !== itemId));
  };

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newList.title.trim()) {
      alert('Please enter a list title');
      return;
    }

    try {
      const response = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newList,
          items: draftItems,
        }),
      });

      const data = await response.json();
      if (data.success && data.list) {
        // Reset form
        setNewList({ title: '', description: '', mediaType: '', isPublic: true });
        setDraftItems([]);
        setShowCreateForm(false);
        setShowAddItems(false);
        // Redirect to the new list detail page
        window.location.href = `/lists/${data.list.id}`;
      } else {
        const errorMsg = data.error || 'Failed to create list';
        console.error('Create list error:', errorMsg, data);
        alert(`Error: ${errorMsg}`);
      }
    } catch (error) {
      console.error('Error creating list:', error);
      alert(`Failed to create list: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDeleteList = async (listId: string) => {
    if (!confirm('Are you sure you want to delete this list?')) return;

    console.log('Attempting to delete list:', listId);
    
    try {
      const response = await fetch(`/api/lists/${listId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      console.log('Delete response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Delete list error response:', response.status, errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || `HTTP ${response.status}` };
        }
        alert(errorData.error || 'Failed to delete list');
        return;
      }

      const data = await response.json();
      console.log('Delete response data:', data);
      
      if (data.success) {
        setLists(lists.filter(l => l.id !== listId));
        console.log('List deleted successfully');
      } else {
        console.error('Delete list failed:', data);
        alert(data.error || 'Failed to delete list');
      }
    } catch (error) {
      console.error('Error deleting list:', error);
      alert(`Failed to delete list: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-300 via-cyan-200 to-teal-300">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-sky-700">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-300 via-cyan-200 to-teal-300">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-sky-800 mb-4">Please sign in to view your lists</h1>
          <Link href="/auth/signin" className="text-cyan-600 hover:text-cyan-500">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-300 via-cyan-200 to-teal-300">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent mb-2 drop-shadow-md">
              My Lists
            </h1>
            <p className="text-lg text-sky-700 font-medium">Create and manage your custom lists</p>
          </div>
          <button
            onClick={() => {
              setShowCreateForm(!showCreateForm);
              if (showCreateForm) {
                setDraftItems([]);
                setShowAddItems(false);
              }
            }}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white font-semibold rounded-2xl transition-all shadow-lg hover:shadow-xl glow-soft"
          >
            {showCreateForm ? 'Cancel' : '+ Create New List'}
          </button>
        </div>

        {/* Create List Form */}
        {showCreateForm && (
          <div className="mb-8 glass-strong rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-sky-800 mb-4">Create New List</h2>
            <form onSubmit={handleCreateList} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-sky-700 mb-2">
                  List Title *
                </label>
                <input
                  type="text"
                  value={newList.title}
                  onChange={(e) => setNewList({ ...newList, title: e.target.value })}
                  placeholder="e.g., Top 5 Games with Best Battle Systems"
                  className="w-full px-4 py-2 glass-strong rounded-xl text-sky-900 placeholder-sky-600/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-sky-700 mb-2">
                  Media Type
                </label>
                <select
                  value={newList.mediaType}
                  onChange={(e) => setNewList({ ...newList, mediaType: e.target.value })}
                  className="w-full px-4 py-2 glass-strong rounded-xl text-sky-900 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                >
                  <option value="">All Media Types</option>
                  <option value="game">Video Games</option>
                  <option value="movie">Movies</option>
                  <option value="tv">TV Shows</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-sky-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newList.description}
                  onChange={(e) => setNewList({ ...newList, description: e.target.value })}
                  placeholder="Optional description of your list..."
                  rows={3}
                  className="w-full px-4 py-2 glass-strong rounded-xl text-sky-900 placeholder-sky-600/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={newList.isPublic}
                  onChange={(e) => setNewList({ ...newList, isPublic: e.target.checked })}
                  className="w-4 h-4 text-cyan-600 focus:ring-cyan-500"
                />
                <label htmlFor="isPublic" className="text-sm text-sky-700 font-medium">
                  Make this list public
                </label>
              </div>

              {/* Add Items Section */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-sky-800">Items ({draftItems.length})</h3>
                  <button
                    type="button"
                    onClick={() => setShowAddItems(!showAddItems)}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-semibold rounded-xl transition-all"
                  >
                    {showAddItems ? 'Hide Search' : '+ Add Items'}
                  </button>
                </div>

                {/* Draft Items Preview */}
                {draftItems.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-4">
                    {draftItems.map((item) => (
                      <div key={item.id} className="glass-strong rounded-xl overflow-hidden relative group">
                        <div className="aspect-[2/3] bg-gradient-to-br from-cyan-100 to-teal-100 overflow-hidden">
                          {item.itemCover ? (
                            <img
                              src={item.itemCover}
                              alt={item.itemName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-sky-600 text-xs">
                              No Cover
                            </div>
                          )}
                        </div>
                        <div className="p-2">
                          <h4 className="font-semibold text-sky-800 text-xs mb-1 line-clamp-2">{item.itemName}</h4>
                          {item.itemYear && (
                            <p className="text-xs text-sky-600 mb-2">{item.itemYear}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveDraftItem(item.id)}
                          className="absolute top-2 right-2 bg-rose-500/80 hover:bg-rose-500 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Search Interface */}
                {showAddItems && (
                  <div className="glass-strong rounded-xl p-4">
                    <div className="mb-4">
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
                                  onClick={() => handleAddDraftItem(
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
                                onClick={() => handleAddDraftItem(
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
                                onClick={() => handleAddDraftItem(
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
              </div>

              <button
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
              >
                Create List
              </button>
            </form>
          </div>
        )}

        {/* Lists Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-sky-700">Loading your lists...</p>
          </div>
        ) : lists.length === 0 ? (
          <div className="text-center py-12 glass-strong rounded-2xl">
            <p className="text-sky-700 text-lg font-medium mb-4">You haven't created any lists yet.</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white font-semibold rounded-2xl transition-all shadow-lg hover:shadow-xl"
            >
              Create Your First List
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lists.map((list) => (
              <div
                key={list.id}
                className="glass-strong rounded-2xl p-6 hover:shadow-2xl transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <Link href={`/lists/${list.id}`}>
                      <h3 className="text-xl font-bold text-sky-800 mb-1 hover:text-cyan-600 transition-colors">
                        {list.title}
                      </h3>
                    </Link>
                    {list.description && (
                      <p className="text-sm text-sky-600 line-clamp-2">{list.description}</p>
                    )}
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    list.isPublic
                      ? 'bg-green-500/20 text-green-700'
                      : 'bg-gray-500/20 text-gray-700'
                  }`}>
                    {list.isPublic ? 'Public' : 'Private'}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/20">
                  <p className="text-sm text-sky-600">
                    {list.itemCount} {list.itemCount === 1 ? 'item' : 'items'}
                  </p>
                  <div className="flex gap-2">
                    <Link
                      href={`/lists/${list.id}`}
                      className="px-3 py-1 bg-cyan-500/20 text-cyan-700 rounded-lg text-sm font-medium hover:bg-cyan-500/30 transition-all"
                    >
                      View
                    </Link>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDeleteList(list.id);
                      }}
                      className="px-3 py-1 bg-rose-500/20 text-rose-700 rounded-lg text-sm font-medium hover:bg-rose-500/30 transition-all"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
