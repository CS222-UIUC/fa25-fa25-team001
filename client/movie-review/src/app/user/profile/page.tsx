"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getUserProfile, updateUserProfile } from "@/actions/user";
import { uploadProfilePicture } from "@/actions/upload";
import { getMediaCounts } from "@/actions/media";
import PlatformConnections from "@/components/PlatformConnections";
import FavoritesSection from "@/components/FavoritesSection";
import RecentGamesSection from "@/components/RecentGamesSection";

export default function Profile() {
  const { data: session } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    image: session?.user?.image || '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [mediaCounts, setMediaCounts] = useState({ movies: 0, tvShows: 0, games: 0 });

  // Load latest profile data from server on mount
  useEffect(() => {
    const loadProfile = async () => {
      const res = await getUserProfile();
      if ((res as any)?.success && (res as any).user) {
        const data = (res as any).user;
        setProfileData({
          name: data.username,
          email: data.email,
          image: data.profilePicture || '',
        });
      }
    };
    loadProfile();
  }, []);

  // Load media counts
  useEffect(() => {
    const loadMediaCounts = async () => {
      const res = await getMediaCounts();
      if (!(res as any)?.error && (res as any).movies !== undefined) {
        setMediaCounts({
          movies: (res as any).movies || 0,
          tvShows: (res as any).tvShows || 0,
          games: (res as any).games || 0,
        });
      }
    };

    if (session) {
      loadMediaCounts();
    }

    // Listen for media status updates to refresh counts
    const handleMediaStatusUpdate = () => {
      console.log('Media status updated event received, refreshing counts...');
      loadMediaCounts();
    };

    window.addEventListener('mediaStatusUpdated', handleMediaStatusUpdate);
    return () => {
      window.removeEventListener('mediaStatusUpdated', handleMediaStatusUpdate);
    };
  }, [session]);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-300 via-cyan-200 to-teal-300">
        <div className="text-center glass-strong rounded-3xl p-8 shadow-2xl">
          <h1 className="text-2xl font-bold mb-4 bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">Please sign in to view your profile</h1>
          <Link href="/auth/signin" className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white font-semibold py-2 px-4 rounded-xl transition-all shadow-lg hover:shadow-xl glow-soft inline-block">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please select a JPG, PNG, or SVG file.');
        return;
      }

      // Validate file size (1MB)
      if (file.size > 1 * 1024 * 1024) {
        alert('File size must be less than 1MB.');
        return;
      }

      setSelectedFile(file);
      // Create a preview URL
      const previewUrl = URL.createObjectURL(file);
      setProfileData({...profileData, image: previewUrl});
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const res = await uploadProfilePicture(selectedFile);
      if ((res as any)?.success && (res as any).url) {
        setProfileData({ ...profileData, image: (res as any).url });
        setSelectedFile(null);
      } else if ((res as any)?.error) {
        alert((res as any).error);
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setUploading(true);
    try {
      const result = await updateUserProfile({
        username: profileData.name,
        email: profileData.email,
        profilePicture: profileData.image,
      });

      if ((result as any)?.success) {
        setIsEditing(false);
        const u = (result as any).user;
        setProfileData({ name: u.username, email: u.email, image: u.profilePicture || '' });
        window.dispatchEvent(new CustomEvent('profileUpdated', { detail: { image: u.profilePicture } }));
      } else if ((result as any)?.error) {
        alert((result as any).error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      alert('Failed to update profile');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-300 via-cyan-200 to-teal-300">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent drop-shadow-md">Your Profile</h1>
          <p className="text-sky-700 mt-2 font-medium">Manage your account settings and preferences</p>
        </div>

        <div className="glass-strong rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-sky-800">Profile Information</h2>
            <div className="space-x-2">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white font-semibold py-2 px-4 rounded-xl transition-all shadow-lg hover:shadow-xl glow-soft"
                >
                  Edit Profile
                </button>
              ) : (
                <>
                  <button
                    onClick={handleSave}
                    disabled={uploading}
                    className="bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-white font-semibold py-2 px-4 rounded-xl transition-all shadow-lg hover:shadow-xl glow-soft disabled:opacity-50"
                  >
                    {uploading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="bg-gradient-to-r from-slate-400 to-gray-500 hover:from-slate-300 hover:to-gray-400 text-white font-semibold py-2 px-4 rounded-xl transition-all shadow-lg hover:shadow-xl"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {/* Profile Picture */}
            <div className="flex items-start space-x-6">
              <div className="relative">
                <img
                  src={profileData.image || '/default.jpg'}
                  alt="Profile"
                  className="w-24 h-24 rounded-full ring-4 ring-cyan-300/50 shadow-lg"
                />
                {isEditing && (
                  <div className="mt-4">
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.svg"
                      onChange={handleFileSelect}
                      className="block w-full text-sm text-sky-700 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-cyan-400 file:to-teal-400 file:text-white hover:file:from-cyan-300 hover:file:to-teal-300 transition-all"
                    />
                    <p className="text-xs text-sky-600 mt-1 font-medium">JPG, PNG, or SVG. Max 1MB.</p>
                    {selectedFile && (
                      <button
                        onClick={handleUpload}
                        disabled={uploading}
                        className="mt-2 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-white font-semibold py-1 px-3 rounded-xl text-sm disabled:opacity-50 transition-all shadow-lg hover:shadow-xl glow-soft"
                      >
                        {uploading ? 'Uploading...' : 'Upload'}
                      </button>
                    )}
                  </div>
                )}
              </div>
              {isEditing && (
                <div className="flex-1">
                  <label className="block text-sm font-medium text-sky-700 mb-2 font-semibold">
                    Or enter Profile Picture URL
                  </label>
                  <input
                    type="url"
                    value={profileData.image.startsWith('blob:') ? '' : profileData.image}
                    onChange={(e) => setProfileData({...profileData, image: e.target.value})}
                    className="glass-strong rounded-xl px-3 py-2 w-full max-w-md text-sky-900 placeholder-sky-600/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 transition-all"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              )}
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-sky-700 mb-2 font-semibold">
                Username
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                  className="glass-strong rounded-xl px-3 py-2 w-full max-w-md text-sky-900 placeholder-sky-600/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 transition-all"
                />
              ) : (
                <p className="text-sky-800 font-medium">{profileData.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-sky-700 mb-2 font-semibold">
                Email
              </label>
              {isEditing ? (
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                  className="glass-strong rounded-xl px-3 py-2 w-full max-w-md text-sky-900 placeholder-sky-600/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 transition-all"
                />
              ) : (
                <p className="text-sky-800 font-medium">{profileData.email}</p>
              )}
            </div>
          </div>
        </div>

        {/* Media Counts Section */}
        <div className="mt-8">
          <div className="glass-strong rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-sky-800">Your Media Stats</h2>
              <button
                onClick={async () => {
                  const res = await getMediaCounts();
                  if (!(res as any)?.error && (res as any).movies !== undefined) {
                    setMediaCounts({
                      movies: (res as any).movies || 0,
                      tvShows: (res as any).tvShows || 0,
                      games: (res as any).games || 0,
                    });
                  }
                }}
                className="text-sm bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white font-semibold py-2 px-4 rounded-xl transition-all shadow-lg hover:shadow-xl"
              >
                Refresh
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Movies Count */}
              <Link href="/user/profile/movies" className="bg-gradient-to-br from-red-100 to-red-200 rounded-xl p-6 text-center shadow-lg hover:shadow-xl transition-all transform hover:scale-105 cursor-pointer">
                <div className="text-4xl font-bold text-red-700 mb-2">{mediaCounts.movies}</div>
                <div className="text-lg font-semibold text-red-800">Movies Watched</div>
              </Link>
              
              {/* TV Shows Count */}
              <Link href="/user/profile/tv" className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl p-6 text-center shadow-lg hover:shadow-xl transition-all transform hover:scale-105 cursor-pointer">
                <div className="text-4xl font-bold text-purple-700 mb-2">{mediaCounts.tvShows}</div>
                <div className="text-lg font-semibold text-purple-800">TV Shows Watched</div>
              </Link>
              
              {/* Games Count */}
              <Link href="/user/profile/games" className="bg-gradient-to-br from-green-100 to-green-200 rounded-xl p-6 text-center shadow-lg hover:shadow-xl transition-all transform hover:scale-105 cursor-pointer">
                <div className="text-4xl font-bold text-green-700 mb-2">{mediaCounts.games}</div>
                <div className="text-lg font-semibold text-green-800">Games Played</div>
              </Link>
            </div>
          </div>
        </div>

        {/* Favorites Section */}
        <div className="mt-8">
          <FavoritesSection />
        </div>

        {/* Recent Games with Posters */}
        <div className="mt-8">
          <RecentGamesSection />
        </div>

        {/* Platform Connections */}
        <div className="mt-8">
          <PlatformConnections />
        </div>
      </div>
    </div>
  );
}