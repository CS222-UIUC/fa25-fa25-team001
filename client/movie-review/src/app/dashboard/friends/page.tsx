"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { searchUsers, getFriends, addFriend, removeFriend } from '@/actions/friends';
import Link from 'next/link';

interface User {
  id: string;
  username: string;
  profilePicture: string;
  createdAt: Date;
  reviewsCount?: number;
  listsCount?: number;
  addedAt?: Date;
}

export default function FriendsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingFriends, setIsLoadingFriends] = useState(true);
  const [activeTab, setActiveTab] = useState<'search' | 'friends'>('search');

  useEffect(() => {
    if (status === 'authenticated') {
      loadFriends();
    }
  }, [status]);

  const loadFriends = async () => {
    try {
      setIsLoadingFriends(true);
      const result = await getFriends();
      if (!(result as any).error) {
        setFriends((result as any).friends || []);
      }
    } catch (error) {
      console.error('Error loading friends:', error);
    } finally {
      setIsLoadingFriends(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const result = await searchUsers(query);
      if (!(result as any).error) {
        setSearchResults((result as any).users || []);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        handleSearch(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleAddFriend = async (userId: string) => {
    try {
      const result = await addFriend(userId);
      if (!(result as any).error) {
        await loadFriends();
        // Remove from search results
        setSearchResults(searchResults.filter((u) => u.id !== userId));
        alert('Friend added successfully!');
      } else {
        alert((result as any).error || 'Failed to add friend');
      }
    } catch (error) {
      console.error('Error adding friend:', error);
      alert('Failed to add friend');
    }
  };

  const handleRemoveFriend = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this friend?')) {
      return;
    }

    try {
      const result = await removeFriend(userId);
      if (!(result as any).error) {
        await loadFriends();
        alert('Friend removed successfully!');
      } else {
        alert((result as any).error || 'Failed to remove friend');
      }
    } catch (error) {
      console.error('Error removing friend:', error);
      alert('Failed to remove friend');
    }
  };

  const isFriend = (userId: string) => {
    return friends.some((f) => f.id === userId);
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-300 via-cyan-200 to-teal-300">
        <div className="text-xl text-gray-900">Loading...</div>
      </div>
    );
  }

  if (!session) {
    router.push('/auth/signin');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-300 via-cyan-200 to-teal-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent drop-shadow-md mb-2">
            Friends
          </h1>
          <p className="text-gray-700 text-lg">Connect with other users and discover their media</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-4 border-b border-gray-300">
          <button
            onClick={() => setActiveTab('search')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'search'
                ? 'text-cyan-600 border-b-2 border-cyan-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Search Users
          </button>
          <button
            onClick={() => setActiveTab('friends')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'friends'
                ? 'text-cyan-600 border-b-2 border-cyan-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            My Friends ({friends.length})
          </button>
        </div>

        {/* Search Tab */}
        {activeTab === 'search' && (
          <div className="glass-strong rounded-2xl shadow-lg p-6">
            <div className="mb-6">
              <label htmlFor="user-search" className="block text-sm font-medium text-gray-700 mb-2">
                Search for users by username
              </label>
              <div className="relative">
                <input
                  id="user-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type a username..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                {isSearching && (
                  <div className="absolute right-3 top-3.5 text-gray-400">Searching...</div>
                )}
              </div>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Search Results</h3>
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <img
                        src={user.profilePicture || '/default.jpg'}
                        alt={user.username}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <Link
                          href={`/user/${user.username}`}
                          className="font-semibold text-gray-900 hover:text-cyan-600 transition-colors"
                        >
                          {user.username}
                        </Link>
                        <div className="text-sm text-gray-500">
                          {user.reviewsCount || 0} reviews • {user.listsCount || 0} lists
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/user/${user.username}`}
                        className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
                      >
                        View Profile
                      </Link>
                      {isFriend(user.id) ? (
                        <button
                          onClick={() => handleRemoveFriend(user.id)}
                          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                          disabled
                        >
                          Already Friends
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAddFriend(user.id)}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                        >
                          Add Friend
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {searchQuery && searchResults.length === 0 && !isSearching && (
              <div className="text-center py-8 text-gray-500">
                No users found matching "{searchQuery}"
              </div>
            )}

            {!searchQuery && (
              <div className="text-center py-8 text-gray-500">
                Start typing a username to search for users
              </div>
            )}
          </div>
        )}

        {/* Friends Tab */}
        {activeTab === 'friends' && (
          <div className="glass-strong rounded-2xl shadow-lg p-6">
            {isLoadingFriends ? (
              <div className="text-center py-8 text-gray-500">Loading friends...</div>
            ) : friends.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="mb-4">You don't have any friends yet.</p>
                <p className="text-sm">Search for users and add them as friends!</p>
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Your Friends</h3>
                {friends.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <img
                        src={friend.profilePicture || '/default.jpg'}
                        alt={friend.username}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <Link
                          href={`/user/${friend.username}`}
                          className="font-semibold text-gray-900 hover:text-cyan-600 transition-colors"
                        >
                          {friend.username}
                        </Link>
                        <div className="text-sm text-gray-500">
                          {friend.reviewsCount || 0} reviews • {friend.listsCount || 0} lists
                        </div>
                        {friend.addedAt && (
                          <div className="text-xs text-gray-400">
                            Added {new Date(friend.addedAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/user/${friend.username}`}
                        className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
                      >
                        View Profile
                      </Link>
                      <button
                        onClick={() => handleRemoveFriend(friend.id)}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

