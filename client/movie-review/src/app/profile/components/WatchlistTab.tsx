"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Film, Tv, Gamepad2, Clock, Trash2, Plus, ArrowLeft, MoreVertical, Search, X } from 'lucide-react';

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
  isPublic: boolean;
  _count: {
    items: number;
  };
}

interface ListItem {
  id: string;
  type: 'movie' | 'tv' | 'game';
  title: string;
  poster?: string;
  addedAt: string;
  mediaId: string;
  releaseYear?: number;
}

export default function WatchlistTab({ user }: WatchlistTabProps) {
  const { data: session } = useSession();
  const [view, setView] = useState<'lists' | 'details'>('lists');
  const [lists, setLists] = useState<List[]>([]);
  const [activeList, setActiveList] = useState<List | null>(null);
  const [listItems, setListItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create List State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDesc, setNewListDesc] = useState('');

  // Add Item State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchType, setSearchType] = useState<'movie' | 'tv' | 'game'>('movie');

  const isOwnProfile = session?.user?.id === user.id;

  useEffect(() => {
    loadLists();
  }, [user.id]);

  const loadLists = async () => {
    try {
      const response = await fetch(`/api/lists?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setLists(data.lists || []);
      }
    } catch (error) {
      console.error('Failed to load lists:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadListDetails = async (list: List) => {
    setLoading(true);
    setActiveList(list);
    try {
      const response = await fetch(`/api/lists?userId=${user.id}&listId=${list.id}`);
      if (response.ok) {
        const data = await response.json();
        // Transform items
        const items = data.list.items.map((item: any) => {
          let type = 'unknown';
          let title = 'Unknown';
          let poster = undefined;
          let mediaId = '';
          let releaseYear = undefined;

          if (item.movie) {
            type = 'movie';
            title = item.movie.title;
            poster = item.movie.poster;
            mediaId = item.movie.id;
            releaseYear = item.movie.releaseYear;
          } else if (item.tvShow) {
            type = 'tv';
            title = item.tvShow.title;
            poster = item.tvShow.poster;
            mediaId = item.tvShow.id;
            releaseYear = item.tvShow.releaseYear;
          } else if (item.videoGame) {
            type = 'game';
            title = item.videoGame.title;
            poster = item.videoGame.cover || item.videoGame.poster; // Try both cover and poster
            mediaId = item.videoGame.id;
            releaseYear = item.videoGame.releaseYear;
          }

          return {
            id: item.id,
            type,
            title,
            poster,
            addedAt: item.createdAt,
            mediaId,
            releaseYear
          };
        });
        setListItems(items);
        setView('details');
      }
    } catch (error) {
      console.error('Failed to load list details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) return;

    try {
      const response = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newListName,
          description: newListDesc,
          isPublic: true
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setLists([data.list, ...lists]);
        setIsCreateModalOpen(false);
        setNewListName('');
        setNewListDesc('');
      }
    } catch (error) {
      console.error('Failed to create list:', error);
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

  const handleAddItem = async (item: any) => {
    if (!activeList) return;

    try {
      const response = await fetch('/api/lists/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listId: activeList.id,
          mediaId: item.id.toString(),
          mediaType: searchType === 'tv' ? 'tvshow' : searchType,
          title: item.title,
          year: item.year,
          poster: item.poster
        }),
      });

      if (response.ok) {
        // Refresh list items
        loadListDetails(activeList);
        setIsAddModalOpen(false);
        setSearchQuery('');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Failed to add item:', error);
    }
  };

  const handleDeleteList = async (e: React.MouseEvent, listId: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this list?')) return;

    try {
      const response = await fetch('/api/lists', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listId }),
      });
      if (response.ok) {
        setLists(lists.filter(l => l.id !== listId));
        if (activeList?.id === listId) {
          setActiveList(null);
          setListItems([]);
          setView('lists');
        }
      }
    } catch (error) {
      console.error('Failed to delete list:', error);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!confirm('Remove item from list?')) return;

    try {
      const response = await fetch(`/api/lists/items/${itemId}`, { method: 'DELETE' });
      if (response.ok) {
        setListItems(listItems.filter(i => i.id !== itemId));
        // Also update the list count in the main view
        setLists(lists.map(l => 
          l.id === activeList?.id 
            ? { ...l, _count: { items: l._count.items - 1 } }
            : l
        ));
      }
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  };

  if (loading && view === 'lists' && lists.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {view === 'lists' ? (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Lists</h2>
            {isOwnProfile && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Create List
              </button>
            )}
          </div>

          {lists.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {lists.map((list) => (
                <div
                  key={list.id}
                  onClick={() => loadListDetails(list)}
                  className="group bg-card border border-border rounded-xl p-6 cursor-pointer hover:border-primary/50 transition-all hover:shadow-lg relative"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-secondary rounded-lg group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <Clock className="h-6 w-6" />
                    </div>
                    {isOwnProfile && list.title !== 'Watchlist' && (
                      <button
                        onClick={(e) => handleDeleteList(e, list.id)}
                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">{list.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4 h-10">
                    {list.description || 'No description'}
                  </p>
                  <div className="flex items-center text-xs text-muted-foreground font-medium">
                    <span>{list._count.items} items</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-card border border-border rounded-xl">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No lists yet</h3>
              <p className="text-muted-foreground">Create a list to start tracking what you want to watch or play.</p>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setView('lists')}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h2 className="text-2xl font-bold">{activeList?.title}</h2>
                <p className="text-sm text-muted-foreground">{activeList?.description}</p>
              </div>
            </div>
            {isOwnProfile && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Item
              </button>
            )}
          </div>

          {listItems.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {listItems.map((item) => (
                <div key={item.id} className="group relative bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-all hover:shadow-lg">
                  <Link href={`/${item.type === 'game' ? 'game' : item.type === 'movie' ? 'movie' : 'tv'}/${item.mediaId}`}>
                    <div className="aspect-[2/3] relative overflow-hidden bg-secondary">
                      {item.poster ? (
                        <img 
                          src={item.poster} 
                          alt={item.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          {item.type === 'movie' ? (
                            <Film className="h-10 w-10" />
                          ) : item.type === 'tv' ? (
                            <Tv className="h-10 w-10" />
                          ) : (
                            <Gamepad2 className="h-10 w-10" />
                          )}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                        <p className="text-white font-medium truncate">{item.title}</p>
                        <div className="flex items-center gap-1 mt-1 text-xs text-white/80">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(item.addedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                  
                  {isOwnProfile && (
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="absolute top-2 right-2 p-2 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-white"
                      title="Remove from list"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-card border border-border rounded-xl">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">List is empty</h3>
              <p className="text-muted-foreground">Add movies, TV shows, or games to this list.</p>
            </div>
          )}
        </>
      )}

      {/* Create List Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Create New List</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">List Name</label>
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  className="w-full bg-secondary border border-input rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g., Weekend Watchlist"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                <textarea
                  value={newListDesc}
                  onChange={(e) => setNewListDesc(e.target.value)}
                  className="w-full bg-secondary border border-input rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  rows={3}
                  placeholder="What's this list about?"
                />
              </div>
              <button
                onClick={handleCreateList}
                disabled={!newListName.trim()}
                className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                Create List
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-card border border-border w-full max-w-2xl rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Add to {activeList?.title}</h3>
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
                      onClick={() => handleAddItem(result)}
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
