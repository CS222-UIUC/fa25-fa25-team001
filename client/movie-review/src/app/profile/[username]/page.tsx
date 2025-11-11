'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Header from '@/components/Header';

interface UserProfile {
  id: string;
  username: string;
  bio: string | null;
  profilePicture: string;
  createdAt: Date;
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const username = params.username as string;
  
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isFriend, setIsFriend] = useState(false);
  const [loading, setLoading] = useState(true);
  const [friendsCount, setFriendsCount] = useState(0);
  const [reviewsCount, setReviewsCount] = useState(0);

  useEffect(() => {
    if (username) {
      loadUserProfile();
    }
  }, [username]);

  const loadUserProfile = async () => {
    try {
      const response = await fetch(`/api/users/profile?username=${encodeURIComponent(username)}`);
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setIsFriend(data.isFriend || false);
        setFriendsCount(data.friendsCount || 0);
        setReviewsCount(data.reviewsCount || 0);
      } else if (response.status === 404) {
        // User not found
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = async () => {
    if (!user || !session?.user?.id) return;

    try {
      const response = await fetch('/api/friends/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId: user.id }),
      });

      if (response.ok) {
        setIsFriend(true);
        setFriendsCount(friendsCount + 1);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to add friend');
      }
    } catch (error) {
      console.error('Add friend error:', error);
      alert('Failed to add friend');
    }
  };

  const handleRemoveFriend = async () => {
    if (!user || !session?.user?.id) return;

    if (!confirm('Are you sure you want to remove this friend?')) {
      return;
    }

    try {
      const response = await fetch(`/api/friends/remove?friendId=${user.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setIsFriend(false);
        setFriendsCount(Math.max(0, friendsCount - 1));
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to remove friend');
      }
    } catch (error) {
      console.error('Remove friend error:', error);
      alert('Failed to remove friend');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600">Loading profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center py-20">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">User Not Found</h1>
            <p className="text-gray-600 mb-6">The user "{username}" doesn't exist.</p>
            <button
              onClick={() => router.push('/search')}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
            >
              Search for Users
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isOwnProfile = session?.user?.id === user.id;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6 border border-gray-100">
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              <div className="w-32 h-32 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center overflow-hidden shadow-lg">
                {user.profilePicture && user.profilePicture !== '/default.jpg' ? (
                  <img 
                    src={user.profilePicture} 
                    alt={user.username} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <span className="text-5xl text-white">👤</span>
                )}
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">{user.username}</h1>
                  {user.bio && (
                    <p className="text-gray-600 text-lg">{user.bio}</p>
                  )}
                </div>
                {!isOwnProfile && session?.user?.id && (
                  <div className="flex gap-3">
                    {isFriend ? (
                      <button
                        onClick={handleRemoveFriend}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                      >
                        Remove Friend
                      </button>
                    ) : (
                      <button
                        onClick={handleAddFriend}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                      >
                        Add Friend
                      </button>
                    )}
                  </div>
                )}
                {isOwnProfile && (
                  <button
                    onClick={() => router.push('/profile')}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              <div className="flex gap-8 text-gray-600">
                <div>
                  <span className="font-bold text-gray-900">{friendsCount}</span> Friends
                </div>
                <div>
                  <span className="font-bold text-gray-900">{reviewsCount}</span> Reviews
                </div>
                <div>
                  <span className="text-sm text-gray-500">
                    Joined {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-6 border border-gray-100">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => router.push(`/profile/${username}?tab=reviews`)}
                className="px-6 py-4 font-semibold text-lg border-b-2 border-indigo-600 text-indigo-600"
              >
                Reviews
              </button>
              <button
                onClick={() => router.push(`/profile/${username}?tab=friends`)}
                className="px-6 py-4 font-semibold text-lg border-b-2 border-transparent text-gray-500 hover:text-gray-700"
              >
                Friends
              </button>
            </nav>
          </div>
        </div>

        {/* Content will be loaded via tabs */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <p className="text-gray-600 text-center py-8">
            Profile content will be displayed here based on selected tab.
          </p>
        </div>
      </div>
    </div>
  );
}

