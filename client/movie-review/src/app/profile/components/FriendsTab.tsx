"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  username: string;
  profilePicture: string;
  followersCount: number;
}

interface FriendsTabProps {
  user: User;
}

interface Friend {
  id: string;
  username: string;
  profilePicture: string;
  bio?: string;
  friendsSince: Date;
}

export default function FriendsTab({ user }: FriendsTabProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [suggested, setSuggested] = useState<any[]>([]);
  const [followers, setFollowers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadFriends();
    loadFollowers();
    loadSuggested();
  }, [user.id]);

  const loadFollowers = async () => {
    try {
      const response = await fetch(`/api/followers/list?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setFollowers(data.followers || []);
        // Update follower count in parent or state
      }
    } catch (error) {
      console.error('Failed to load followers:', error);
    }
  };

  const loadFriends = async () => {
    try {
      const response = await fetch(`/api/friends/list?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setFriends(data.friends || []);
      }
    } catch (error) {
      console.error('Failed to load friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSuggested = async () => {
    try {
      // Get users who are not friends
      const response = await fetch('/api/users/search?q=&limit=10');
      if (response.ok) {
        const data = await response.json();
        const friendIds = new Set(friends.map(f => f.id));
        const suggestedUsers = (data.users || [])
          .filter((u: any) => u.id !== user.id && !friendIds.has(u.id))
          .slice(0, 5);
        setSuggested(suggestedUsers);
      }
    } catch (error) {
      console.error('Failed to load suggested:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        const friendIds = new Set(friends.map(f => f.id));
        setSearchResults(
          (data.users || []).filter((u: any) => u.id !== user.id && !friendIds.has(u.id))
        );
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddFriend = async (friendId: string) => {
    try {
      const response = await fetch('/api/friends/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId }),
      });

      if (response.ok) {
        await loadFriends();
        await loadSuggested();
        setSearchResults(searchResults.filter(u => u.id !== friendId));
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to add friend');
      }
    } catch (error) {
      console.error('Add friend error:', error);
      alert('Failed to add friend');
    }
  };

  const handleFollowUser = async (userId: string) => {
    try {
      const response = await fetch('/api/followers/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        setFollowingUsers(new Set([...followingUsers, userId]));
        await loadFollowers();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to follow user');
      }
    } catch (error) {
      console.error('Follow error:', error);
      alert('Failed to follow user');
    }
  };

  const handleUnfollowUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/followers/unfollow?userId=${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setFollowingUsers(new Set([...followingUsers].filter(id => id !== userId)));
        await loadFollowers();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to unfollow user');
      }
    } catch (error) {
      console.error('Unfollow error:', error);
      alert('Failed to unfollow user');
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!confirm('Are you sure you want to remove this friend?')) {
      return;
    }

    try {
      const response = await fetch(`/api/friends/remove?friendId=${friendId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadFriends();
        await loadSuggested();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to remove friend');
      }
    } catch (error) {
      console.error('Remove friend error:', error);
      alert('Failed to remove friend');
    }
  };

  const handleViewProfile = (username: string) => {
    router.push(`/profile/${username}`);
  };

  const renderUserCard = (user: any, showAddButton = false, showRemoveButton = false, showFollowButton = false) => (
    <div
      key={user.id}
      className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors bg-white"
    >
      <div
        className="flex-shrink-0 w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden cursor-pointer"
        onClick={() => handleViewProfile(user.username)}
      >
        {user.profilePicture && user.profilePicture !== '/default.jpg' ? (
          <img src={user.profilePicture} alt={user.username} className="w-full h-full object-cover" />
        ) : (
          <span className="text-2xl text-gray-400">👤</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3
            className="text-lg font-bold text-gray-900 cursor-pointer hover:text-indigo-600"
            onClick={() => handleViewProfile(user.username)}
          >
            {user.username}
          </h3>
        </div>
        {user.bio && <p className="text-sm text-gray-600 mb-1 line-clamp-2">{user.bio}</p>}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => handleViewProfile(user.username)}
          className="text-indigo-600 hover:text-indigo-700 font-semibold text-sm px-3 py-1 border border-indigo-600 rounded hover:bg-indigo-50 transition-colors"
        >
          View
        </button>
        {showAddButton && (
          <button
            onClick={() => handleAddFriend(user.id)}
            className="bg-indigo-600 text-white font-semibold text-sm px-3 py-1 rounded hover:bg-indigo-700 transition-colors"
          >
            Add Friend
          </button>
        )}
        {showFollowButton && !followingUsers.has(user.id) && (
          <button
            onClick={() => handleFollowUser(user.id)}
            className="bg-blue-600 text-white font-semibold text-sm px-3 py-1 rounded hover:bg-blue-700 transition-colors"
          >
            Follow
          </button>
        )}
        {showFollowButton && followingUsers.has(user.id) && (
          <button
            onClick={() => handleUnfollowUser(user.id)}
            className="bg-gray-400 text-white font-semibold text-sm px-3 py-1 rounded hover:bg-gray-500 transition-colors"
          >
            Following
          </button>
        )}
        {showRemoveButton && (
          <button
            onClick={() => handleRemoveFriend(user.id)}
            className="bg-red-600 text-white font-semibold text-sm px-3 py-1 rounded hover:bg-red-700 transition-colors"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Stats Overview */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-2 gap-6 text-center">
          <div>
            <p className="text-3xl font-bold text-gray-900">{friends.length}</p>
            <p className="text-gray-600">Friends</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900">{user.followersCount || 0}</p>
            <p className="text-gray-600">Followers</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            placeholder="Search for users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>
        {searchResults.length > 0 && (
          <div className="space-y-4 mt-4">
            <h3 className="font-semibold text-gray-900">Search Results</h3>
            {searchResults.map((user) => renderUserCard(user, true))}
          </div>
        )}
      </div>

      {/* Suggested Friends */}
      {suggested.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Suggested Friends</h2>
          <div className="space-y-4">
            {suggested.map((user) => renderUserCard(user, true))}
          </div>
        </div>
      )}

      {/* Friends List */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Friends ({friends.length})</h2>
        {friends.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No friends yet. Start adding friends!</p>
        ) : (
          <div className="space-y-4">
            {friends.map((friend) => renderUserCard(friend, false, session?.user?.id === user.id))}
          </div>
        )}
      </div>

      {/* Followers List */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Followers ({followers.length})</h2>
        {followers.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No followers yet.</p>
        ) : (
          <div className="space-y-4">
            {followers.map((follower) => renderUserCard(follower, false, false, session?.user?.id === user.id ? false : true))}
          </div>
        )}
      </div>
    </div>
  );
}
