/**
 * ============================================================================
 * PAGE: My Lists Page
 * ============================================================================
 * Route: /lists
 * Purpose: View and manage all custom lists created by the user
 * Features:
 *   - View all lists
 *   - Create new lists
 *   - Edit/delete existing lists
 *   - View list item counts
 * ============================================================================
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Header from '@/components/Header';

interface List {
  id: string;
  title: string;
  description?: string;
  mediaType?: string;
  isPublic: boolean;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
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
        body: JSON.stringify(newList),
      });

      const data = await response.json();
      if (data.success && data.list) {
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

    try {
      const response = await fetch(`/api/lists/${listId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        setLists(lists.filter(l => l.id !== listId));
      } else {
        alert(data.error || 'Failed to delete list');
      }
    } catch (error) {
      console.error('Error deleting list:', error);
      alert('Failed to delete list');
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
            onClick={() => setShowCreateForm(!showCreateForm)}
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
                    {list.mediaType && (
                      <p className="text-sm text-cyan-600 font-medium mb-2">
                        {list.mediaType === 'game' ? 'Video Games' : list.mediaType === 'movie' ? 'Movies' : 'TV Shows'}
                      </p>
                    )}
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
                      onClick={() => handleDeleteList(list.id)}
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

