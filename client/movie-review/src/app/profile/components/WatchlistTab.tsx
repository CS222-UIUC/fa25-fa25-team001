"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  username: string;
}

interface WatchlistTabProps {
  user: User;
}

interface List {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  isPublic: boolean;
  createdAt: Date;
  _count?: {
    items: number;
  };
}

interface ListItem {
  id: string;
  position: number;
  notes: string | null;
  movie?: { id: string; title: string; releaseYear: number | null; poster?: string | null };
  tvShow?: { id: string; title: string; releaseYear: number | null; poster?: string | null };
  videoGame?: { id: string; title: string; releaseYear: number | null; cover?: string | null };
}

interface SearchResult {
  id: string;
  title: string;
  type: 'movie' | 'tvshow' | 'game';
  year?: string;
  poster?: string;
}

export default function WatchlistTab({ user }: WatchlistTabProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [lists, setLists] = useState<List[]>([]);
  const [selectedList, setSelectedList] = useState<List | null>(null);
  const [listItems, setListItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [newListIsPublic, setNewListIsPublic] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchType, setSearchType] = useState<'movie' | 'tvshow' | 'game'>('movie');
  const [isSearching, setIsSearching] = useState(false);

  const isOwnProfile = session?.user?.id === user.id;

  useEffect(() => {
    loadLists();
  }, [user.id]);

  const loadLists = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/lists?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setLists(data.lists || []);
        
        // Auto-select first list or "Watch Later"
        const watchLater = data.lists?.find((l: List) => l.title === 'Watch Later');
        if (watchLater) {
          selectList(watchLater);
        } else if (data.lists?.length > 0) {
          selectList(data.lists[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load lists:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectList = async (list: List) => {
    setSelectedList(list);
    try {
      const response = await fetch(`/api/lists?userId=${user.id}&listId=${list.id}`);
      if (response.ok) {
        const data = await response.json();
        setListItems(data.list?.items || []);
      }
    } catch (error) {
      console.error('Failed to load list items:', error);
    }
  };

  const handleCreateList = async () => {
    if (!newListTitle.trim()) {
      alert('Please enter a list title');
      return;
    }

    try {
      const response = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newListTitle,
          description: newListDescription,
          isPublic: newListIsPublic,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setLists([data.list, ...lists]);
        setNewListTitle('');
        setNewListDescription('');
        setNewListIsPublic(true);
        setShowCreateModal(false);
        selectList(data.list);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create list');
      }
    } catch (error) {
      console.error('Create list error:', error);
      alert('Failed to create list');
    }
  };

  const handleDeleteList = async (listId: string) => {
    if (!confirm('Are you sure you want to delete this list?')) return;

    try {
      const response = await fetch('/api/lists', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listId }),
      });

      if (response.ok) {
        setLists(lists.filter((l) => l.id !== listId));
        if (selectedList?.id === listId) {
          setSelectedList(null);
          setListItems([]);
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete list');
      }
    } catch (error) {
      console.error('Delete list error:', error);
      alert('Failed to delete list');
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      let apiUrl = '';
      if (searchType === 'movie') {
        apiUrl = `/api/movies/search?title=${encodeURIComponent(searchQuery)}`;
      } else if (searchType === 'tvshow') {
        apiUrl = `/api/tvshows/search?title=${encodeURIComponent(searchQuery)}`;
      } else if (searchType === 'game') {
        apiUrl = `/api/rawg/games?q=${encodeURIComponent(searchQuery)}`;
      }

      const response = await fetch(apiUrl);
      if (response.ok) {
        const data = await response.json();
        
        let results: SearchResult[] = [];
        if (searchType === 'movie' && data.results) {
          results = data.results.map((m: any) => ({
            id: m.id,
            title: m.title,
            type: 'movie' as const,
            year: m.year,
            poster: m.poster,
          }));
        } else if (searchType === 'tvshow' && data.results) {
          results = data.results.map((t: any) => ({
            id: t.id,
            title: t.title,
            type: 'tvshow' as const,
            year: t.year,
            poster: t.poster,
          }));
        } else if (searchType === 'game' && data.games) {
          results = data.games.map((g: any) => ({
            id: g.id?.toString(),
            title: g.name,
            type: 'game' as const,
            year: g.releaseDate ? new Date(g.releaseDate).getFullYear().toString() : undefined,
            poster: g.cover,
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

  const handleAddToList = async (item: SearchResult) => {
    if (!selectedList) {
      alert('Please select a list first');
      return;
    }

    try {
      const response = await fetch('/api/lists/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listId: selectedList.id,
          mediaId: item.id,
          mediaType: item.type,
          title: item.title,
          year: item.year,
          poster: item.poster,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setListItems([...listItems, data.listItem]);
        setShowAddItemModal(false);
        setSearchQuery('');
        setSearchResults([]);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add item to list');
      }
    } catch (error) {
      console.error('Add to list error:', error);
      alert('Failed to add item to list');
    }
  };

  const handleRemoveFromList = async (itemId: string) => {
    if (!confirm('Remove this item from the list?')) return;

    try {
      const response = await fetch('/api/lists/items', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
      });

      if (response.ok) {
        setListItems(listItems.filter((i) => i.id !== itemId));
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to remove item');
      }
    } catch (error) {
      console.error('Remove from list error:', error);
      alert('Failed to remove item');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Lists Sidebar */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">My Lists</h2>
            {isOwnProfile && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="text-indigo-600 hover:text-indigo-700 font-semibold text-sm"
              >
                + New
              </button>
            )}
          </div>
          
          <div className="space-y-2">
            {lists.map((list) => (
              <div
                key={list.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedList?.id === list.id
                    ? 'bg-indigo-50 border-2 border-indigo-500'
                    : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                }`}
                onClick={() => selectList(list)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-sm">{list.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {list._count?.items || 0} items
                    </p>
                  </div>
                  {isOwnProfile && list.title !== 'Watch Later' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteList(list.id);
                      }}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {lists.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-4">No lists yet</p>
          )}
        </div>
      </div>

      {/* List Items */}
      <div className="lg:col-span-3">
        <div className="bg-white rounded-lg shadow-sm p-6">
          {selectedList ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedList.title}</h2>
                  {selectedList.description && (
                    <p className="text-gray-600 mt-1">{selectedList.description}</p>
                  )}
                </div>
                {isOwnProfile && (
                  <button
                    onClick={() => setShowAddItemModal(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                  >
                    + Add Item
                  </button>
                )}
              </div>

              {listItems.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {listItems.map((item) => {
                    const media = item.movie || item.tvShow || item.videoGame;
                    const mediaType = item.movie ? 'movie' : item.tvShow ? 'tv' : 'game';
                    const posterUrl = item.movie?.poster || item.tvShow?.poster || item.videoGame?.cover;
                    
                    return (
                      <div key={item.id} className="group relative">
                        <div
                          className="aspect-[2/3] bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all overflow-hidden"
                          onClick={() => {
                            if (mediaType === 'movie') router.push(`/movie/${media?.id}`);
                            else if (mediaType === 'tv') router.push(`/tv/${media?.id}`);
                            else if (mediaType === 'game') router.push(`/game/${media?.id}`);
                          }}
                        >
                          {posterUrl ? (
                            <img 
                              src={posterUrl} 
                              alt={media?.title || 'Media poster'} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-gray-400 text-xs text-center px-2">{media?.title}</span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-gray-900 mt-2 truncate">{media?.title}</p>
                        {media?.releaseYear && (
                          <p className="text-xs text-gray-500">{media.releaseYear}</p>
                        )}
                        {isOwnProfile && (
                          <button
                            onClick={() => handleRemoveFromList(item.id)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">This list is empty</p>
                  {isOwnProfile && (
                    <button
                      onClick={() => setShowAddItemModal(true)}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                    >
                      Add Items
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">Select a list to view items</p>
              {isOwnProfile && lists.length === 0 && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                >
                  Create Your First List
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create List Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Create New List</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="My Watchlist"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newListDescription}
                  onChange={(e) => setNewListDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows={3}
                  placeholder="Optional description..."
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={newListIsPublic}
                  onChange={(e) => setNewListIsPublic(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="isPublic" className="ml-2 text-sm text-gray-700">
                  Make this list public
                </label>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateList}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
              >
                Create List
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Add to {selectedList?.title}</h3>
            
            <div className="space-y-4">
              <div className="flex gap-2">
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value as 'movie' | 'tvshow' | 'game')}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="movie">Movies</option>
                  <option value="tvshow">TV Shows</option>
                  <option value="game">Games</option>
                </select>
                
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder={`Search for ${searchType}s...`}
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
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4">
                  {searchResults.map((result, index) => (
                    <div
                      key={`${result.id}-${index}`}
                      className="cursor-pointer group"
                      onClick={() => handleAddToList(result)}
                    >
                      <div className="aspect-[2/3] bg-gray-200 rounded-lg overflow-hidden group-hover:ring-2 group-hover:ring-indigo-500 transition-all">
                        {result.poster && result.poster !== 'N/A' ? (
                          <img src={result.poster} alt={result.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs text-center p-2">
                            {result.title}
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-medium text-gray-900 mt-1 truncate">{result.title}</p>
                      {result.year && <p className="text-xs text-gray-500">{result.year}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddItemModal(false);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
