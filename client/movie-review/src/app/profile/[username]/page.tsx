'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Header from '@/components/Header';
import HomeTab from '../components/HomeTab';
import ReviewsTab from '../components/ReviewsTab';
import FriendsTab from '../components/FriendsTab';
import WatchlistTab from '../components/WatchlistTab';

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
  const [activeTab, setActiveTab] = useState('home');

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
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start gap-6">
            {/* Profile Picture */}
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

            {/* User Info */}
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-2">
                <h1 className="text-4xl font-bold text-gray-900">{user.username}</h1>
                {!isOwnProfile && session?.user?.id && (
                  isFriend ? (
                    <button
                      onClick={handleRemoveFriend}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                    >
                      Remove Friend
                    </button>
                  ) : (
                    <button
                      onClick={handleAddFriend}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                    >
                      Add Friend
                    </button>
                  )
                )}
                {isOwnProfile && (
                  <button
                    onClick={() => router.push('/profile')}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              <div className="flex gap-6 text-gray-600 mb-4">
                <span>
                  <strong className="text-gray-900">{friendsCount}</strong> Friends
                </span>
                <span>
                  <strong className="text-gray-900">{reviewsCount}</strong> Reviews
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex overflow-x-auto">
              <button
                onClick={() => setActiveTab('home')}
                className={`px-6 py-4 font-semibold text-lg border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'home'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                home
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`px-6 py-4 font-semibold text-lg border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'reviews'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                reviews
              </button>
              <button
                onClick={() => setActiveTab('watchlist')}
                className={`px-6 py-4 font-semibold text-lg border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'watchlist'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                watchlist
              </button>
              <button
                onClick={() => setActiveTab('friends')}
                className={`px-6 py-4 font-semibold text-lg border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'friends'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                friends
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'home' && (
          <HomeTab user={{
            id: user.id,
            username: user.username,
            bio: user.bio,
            profilePicture: user.profilePicture,
            followersCount: 0
          }} />
        )}

        {activeTab === 'reviews' && (
          <ReviewsTab user={{
            id: user.id,
            username: user.username,
            profilePicture: user.profilePicture
          }} />
        )}

        {activeTab === 'watchlist' && (
          <WatchlistTab user={{
            id: user.id,
            username: user.username
          }} />
        )}

        {activeTab === 'friends' && (
          <FriendsTab user={{
            id: user.id,
            username: user.username,
            profilePicture: user.profilePicture,
            followersCount: 0
          }} />
        )}
      </div>
    </div>
  );
}

