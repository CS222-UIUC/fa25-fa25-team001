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

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Image from 'next/image';
import { getCoverImageUrl } from '@/lib/api/igdb';
import { searchMovies } from '@/lib/api/omdb';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ListItem {
  id: string;
  position: number;
  notes?: string;
  itemName?: string;
  itemCover?: string;
  itemYear?: number;
  itemType?: string;
  externalGameId?: string;
  externalMovieId?: string;
  externalTvShowId?: string;
}

interface List {
  id: string;
  title: string;
  description?: string;
  mediaType?: string;
  isPublic: boolean;
  items: ListItem[];
  user: { id: string; username: string };
}

// Sortable Item Component
function SortableItem({ item, isOwner, onDelete, getItemLink, getRankingLabel }: {
  item: ListItem;
  isOwner: boolean;
  onDelete: (id: string) => void;
  getItemLink: (item: ListItem) => string;
  getRankingLabel: (position: number) => string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="glass-strong rounded-2xl overflow-hidden hover:shadow-2xl transition-all">
      <Link href={getItemLink(item)}>
        <div className="aspect-[2/3] bg-gradient-to-br from-cyan-100 to-teal-100 overflow-hidden rounded-t-2xl relative">
          {item.itemCover ? (
            <img
              src={item.itemCover}
              alt={item.itemName || 'Item'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sky-600 font-medium">
              No Cover
            </div>
          )}
          <div className="absolute top-2 left-2 bg-gradient-to-r from-cyan-600 to-teal-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-lg">
            {getRankingLabel(item.position)}
          </div>
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg cursor-grab active:cursor-grabbing transition-all"
            style={{ touchAction: 'none' }}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8h16M4 16h16"
              />
            </svg>
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-sky-800 mb-1 line-clamp-2">
            {item.itemName || 'Untitled'}
          </h3>
          {item.itemYear && (
            <p className="text-sm text-sky-600">{item.itemYear}</p>
          )}
          {item.notes && (
            <p className="text-xs text-sky-500 mt-2 line-clamp-2">{item.notes}</p>
          )}
        </div>
      </Link>
      {isOwner && (
        <div className="px-4 pb-4">
          <button
            onClick={() => onDelete(item.id)}
            className="w-full px-3 py-1 bg-rose-500/20 text-rose-700 rounded-lg text-sm font-medium hover:bg-rose-500/30 transition-all"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}

export default function ListDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const listId = params.id as string;

  const [list, setList] = useState<List | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showAddItems, setShowAddItems] = useState(false);
  const [items, setItems] = useState<ListItem[]>([]);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    mediaType: '',
    isPublic: true,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    games: Array<{ id: number; name: string; cover?: { image_id: string }; first_release_date?: number }>;
    movies: Array<{ id: string; title: string; year: number; poster?: string }>;
    tvShows: Array<{ id: string; title: string; year: number; poster?: string }>;
  }>({ games: [], movies: [], tvShows: [] });
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTab, setSearchTab] = useState<'games' | 'movies' | 'tv'>('games');

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
          mediaType: data.list.mediaType || '',
          isPublic: data.list.isPublic,
        });
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

  const performSearch = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setSearchResults({ games: [], movies: [], tvShows: [] });
      return;
    }

    setSearchLoading(true);
    try {
      // Search games via API route (server-side)
      let gamesResults: Array<{ id: number; name: string; cover?: { image_id: string }; first_release_date?: number }> = [];
      try {
        const gamesResponse = await fetch(`/api/games/search?q=${encodeURIComponent(searchTerm)}&limit=20`);
        const gamesData = await gamesResponse.json();
        if (gamesData.success && gamesData.games) {
          gamesResults = gamesData.games;
        }
      } catch (gameError) {
        console.warn('Game search unavailable:', gameError instanceof Error ? gameError.message : 'Unknown error');
        // Continue with movies/TV shows even if games fail
      }
      
      // Search movies/TV shows
      let moviesList: Array<{ id: string; title: string; year: number; poster?: string }> = [];
      let tvList: Array<{ id: string; title: string; year: number; poster?: string }> = [];
      
      try {
        const omdbResults = await searchMovies(searchTerm, 1);
        const allResults = omdbResults.Search || [];
        
        allResults.forEach((item) => {
          const entry = {
            id: item.imdbID,
            title: item.Title,
            year: parseInt(item.Year) || 0,
            poster: item.Poster !== 'N/A' ? item.Poster : undefined,
          };
          
          if (item.Type === 'movie') {
            moviesList.push(entry);
          } else if (item.Type === 'series') {
            tvList.push(entry);
          }
        });
      } catch (omdbError) {
        console.error('OMDB search error:', omdbError);
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

  const handleAddSearchItem = async (
    itemType: 'game' | 'movie' | 'tv',
    itemId: string,
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
          externalId: itemId,
          itemName,
          itemCover,
          itemYear,
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Show notification
        const notification = document.createElement('div');
        notification.textContent = `✓ Added "${itemName}" to list!`;
        notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #10b981; color: white; padding: 12px 20px; border-radius: 8px; z-index: 9999; box-shadow: 0 4px 6px rgba(0,0,0,0.1); font-weight: 500;';
        document.body.appendChild(notification);
        setTimeout(() => {
          notification.style.transition = 'opacity 0.3s';
          notification.style.opacity = '0';
          setTimeout(() => notification.remove(), 300);
        }, 2000);
        
        loadList(); // Reload list to show new item
        setSearchQuery(''); // Clear search
      } else {
        alert(data.error || 'Failed to add item');
      }
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Failed to add item');
    }
  };

  const getItemLink = (item: ListItem) => {
    if (item.itemType === 'game' && item.externalGameId) {
      return `/games/${item.externalGameId}`;
    } else if (item.itemType === 'movie' && item.externalMovieId) {
      return `/movies/${item.externalMovieId}`;
    } else if (item.itemType === 'tv' && item.externalTvShowId) {
      return `/tv/${item.externalTvShowId}`;
    }
    return '#';
  };

  const getRankingLabel = (position: number): string => {
    const lastDigit = position % 10;
    const lastTwoDigits = position % 100;

    if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
      return `${position}th`;
    }

    switch (lastDigit) {
      case 1: return `${position}st`;
      case 2: return `${position}nd`;
      case 3: return `${position}rd`;
      default: return `${position}th`;
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Update local state optimistically
    const newItems = arrayMove(items, oldIndex, newIndex);
    
    // Update positions in the new order
    const updatedItems = newItems.map((item, index) => ({
      ...item,
      position: index + 1,
    }));
    setItems(updatedItems);

    // Send to server
    try {
      const itemIds = updatedItems.map((item) => item.id);
      const response = await fetch(`/api/lists/${listId}/reorder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemIds }),
      });

      if (!response.ok) {
        // Revert on error
        setItems(items);
        throw new Error('Failed to reorder items');
      }
    } catch (error) {
      console.error('Error reordering items:', error);
      // Revert on error
      setItems(items);
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
                  <select
                    value={editForm.mediaType}
                    onChange={(e) => setEditForm({ ...editForm, mediaType: e.target.value })}
                    className="w-full px-4 py-2 glass-strong rounded-xl text-sky-900 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  >
                    <option value="">All Media Types</option>
                    <option value="game">Video Games</option>
                    <option value="movie">Movies</option>
                    <option value="tv">TV Shows</option>
                  </select>
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
                      onClick={() => setEditing(false)}
                      className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-4xl font-bold text-sky-800 mb-2">{list.title}</h1>
                  {list.mediaType && (
                    <p className="text-lg text-cyan-600 font-medium mb-2">
                      {list.mediaType === 'game' ? 'Video Games' : list.mediaType === 'movie' ? 'Movies' : 'TV Shows'}
                    </p>
                  )}
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
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white font-semibold rounded-xl transition-all"
              >
                Edit
              </button>
            )}
          </div>
        </div>

        {/* Add Items Search Interface - shown when editing */}
        {isOwner && editing && (
          <div className="mb-8 glass-strong rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-sky-800 mb-4">Add Items to List</h2>
            
            {/* Search Bar */}
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
                {searchTab === 'games' && searchResults.games.map((game) => (
                  <div
                    key={game.id}
                    className="glass-strong rounded-xl overflow-hidden hover:shadow-xl transition-all"
                  >
                    <div className="aspect-[2/3] bg-gradient-to-br from-cyan-100 to-teal-100 overflow-hidden relative">
                      {game.cover?.image_id ? (
                        <img
                          src={getCoverImageUrl(game.cover.image_id, 'cover_big')}
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
                      {game.first_release_date && (
                        <p className="text-xs text-sky-600 mb-2">
                          {new Date(game.first_release_date * 1000).getFullYear()}
                        </p>
                      )}
                      <button
                        onClick={() => handleAddSearchItem(
                          'game',
                          game.id.toString(),
                          game.name,
                          game.cover?.image_id ? getCoverImageUrl(game.cover.image_id, 'cover_big') : undefined,
                          game.first_release_date ? new Date(game.first_release_date * 1000).getFullYear() : undefined
                        )}
                        className="w-full px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white text-xs font-semibold rounded-lg transition-all"
                      >
                        Add to List
                      </button>
                    </div>
                  </div>
                ))}
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
                        onClick={() => handleAddSearchItem(
                          'movie',
                          movie.id,
                          movie.title,
                          movie.poster,
                          movie.year
                        )}
                        className="w-full px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white text-xs font-semibold rounded-lg transition-all"
                      >
                        Add to List
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
                        onClick={() => handleAddSearchItem(
                          'tv',
                          show.id,
                          show.title,
                          show.poster,
                          show.year
                        )}
                        className="w-full px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white text-xs font-semibold rounded-lg transition-all"
                      >
                        Add to List
                      </button>
                    </div>
                  </div>
                ))}
                {((searchTab === 'games' && searchResults.games.length === 0) ||
                  (searchTab === 'movies' && searchResults.movies.length === 0) ||
                  (searchTab === 'tv' && searchResults.tvShows.length === 0)) && (
                  <div className="col-span-full text-center py-8 text-sky-600">
                    <p className="mb-2">No results found. Try a different search term.</p>
                    {searchTab === 'games' && (
                      <p className="text-sm text-sky-500">Note: Make sure TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET are set in your .env file to search for games.</p>
                    )}
                    {(searchTab === 'movies' || searchTab === 'tv') && (
                      <p className="text-sm text-sky-500">Note: Make sure OMDB_API_KEY is set in your .env file to search for movies and TV shows.</p>
                    )}
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
            <p className="text-sky-600 mb-4">Add items to this list from game, movie, or TV show pages!</p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/games"
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white font-semibold rounded-xl transition-all"
              >
                Browse Games
              </Link>
              <Link
                href="/movies"
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white font-semibold rounded-xl transition-all"
              >
                Browse Movies
              </Link>
              <Link
                href="/tv"
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white font-semibold rounded-xl transition-all"
              >
                Browse TV Shows
              </Link>
            </div>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map(item => item.id)}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {items.map((item, index) => (
                  <SortableItem
                    key={item.id}
                    item={{ ...item, position: index + 1 }}
                    isOwner={isOwner}
                    onDelete={handleDeleteItem}
                    getItemLink={getItemLink}
                    getRankingLabel={getRankingLabel}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
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

