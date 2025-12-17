"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { getPublicProfile, addFriend, removeFriend } from '@/actions/friends';
import { getMediaCounts } from '@/actions/media';
import Link from 'next/link';

export default function PublicProfilePage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const username = params?.username as string;

  const [profile, setProfile] = useState<any>(null);
  const [mediaCounts, setMediaCounts] = useState({ movies: 0, tvShows: 0, games: 0 });
  const [loading, setLoading] = useState(true);
  const [isFriend, setIsFriend] = useState(false);
  const [isCurrentUser, setIsCurrentUser] = useState(false);

  useEffect(() => {
    if (username && status === 'authenticated') {
      loadProfile();
    }
  }, [username, status]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const profileResult = await getPublicProfile(username);
      if (!(profileResult as any).error) {
        const userData = (profileResult as any).user;
        setProfile(userData);
        setIsFriend(userData.isFriend);
        setIsCurrentUser(userData.isCurrentUser);

        // Load media counts for this user
        // Note: We'll need to create a server action that accepts userId
        // For now, we'll just show the profile info
      } else {
        alert('User not found');
        router.push('/dashboard/friends');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      alert('Failed to load profile');
      router.push('/dashboard/friends');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFriend = async () => {
    if (!profile) return;

    try {
      if (isFriend) {
        const result = await removeFriend(profile.id);
        if (!(result as any).error) {
          setIsFriend(false);
          alert('Friend removed');
        } else {
          alert((result as any).error || 'Failed to remove friend');
        }
      } else {
        const result = await addFriend(profile.id);
        if (!(result as any).error) {
          setIsFriend(true);
          alert('Friend added');
        } else {
          alert((result as any).error || 'Failed to add friend');
        }
      }
    } catch (error) {
      console.error('Error toggling friend:', error);
      alert('Failed to update friend status');
    }
  };

  if (status === 'loading' || loading) {
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

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-300 via-cyan-200 to-teal-300">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-gray-900">User not found</h1>
          <Link
            href="/dashboard/friends"
            className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded"
          >
            Back to Friends
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-300 via-cyan-200 to-teal-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/dashboard/friends"
            className="text-cyan-600 hover:text-cyan-700 font-semibold mb-4 inline-block"
          >
            ← Back to Friends
          </Link>
        </div>

        <div className="glass-strong rounded-2xl shadow-lg p-8">
          {/* Profile Header */}
          <div className="flex items-start gap-6 mb-8">
            <img
              src={profile.profilePicture || '/default.jpg'}
              alt={profile.username}
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
            />
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{profile.username}</h1>
              <p className="text-gray-600 mb-4">
                Member since {new Date(profile.createdAt).toLocaleDateString()}
              </p>
              <div className="flex items-center gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyan-600">
                    {profile._count?.reviews || 0}
                  </div>
                  <div className="text-sm text-gray-600">Reviews</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyan-600">
                    {profile._count?.lists || 0}
                  </div>
                  <div className="text-sm text-gray-600">Lists</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyan-600">
                    {profile._count?.friends || 0}
                  </div>
                  <div className="text-sm text-gray-600">Friends</div>
                </div>
              </div>
              {!isCurrentUser && (
                <button
                  onClick={handleToggleFriend}
                  className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                    isFriend
                      ? 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  {isFriend ? 'Remove Friend' : 'Add Friend'}
                </button>
              )}
              {isCurrentUser && (
                <Link
                  href="/user/profile"
                  className="px-6 py-2 bg-cyan-500 text-white rounded-lg font-semibold hover:bg-cyan-600 transition-colors inline-block"
                >
                  Edit My Profile
                </Link>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Link
              href={`/user/${username}/reviews`}
              className="glass-strong rounded-xl p-4 hover:shadow-lg transition-shadow text-center"
            >
              <div className="text-2xl font-bold text-cyan-600 mb-1">
                {profile._count?.reviews || 0}
              </div>
              <div className="text-sm text-gray-600">Reviews</div>
            </Link>
            <Link
              href={`/user/${username}/lists`}
              className="glass-strong rounded-xl p-4 hover:shadow-lg transition-shadow text-center"
            >
              <div className="text-2xl font-bold text-cyan-600 mb-1">
                {profile._count?.lists || 0}
              </div>
              <div className="text-sm text-gray-600">Lists</div>
            </Link>
            <Link
              href={`/user/${username}/activity`}
              className="glass-strong rounded-xl p-4 hover:shadow-lg transition-shadow text-center"
            >
              <div className="text-2xl font-bold text-cyan-600 mb-1">Activity</div>
              <div className="text-sm text-gray-600">Recent Activity</div>
            </Link>
          </div>

          {/* Placeholder for future content */}
          <div className="mt-8 p-6 bg-white/50 rounded-xl">
            <p className="text-gray-600 text-center">
              More profile features coming soon! View their reviews, lists, and activity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

