'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Header from '@/components/Header';
import { getUserProfile, updateUserProfile } from '@/actions/user';
import HomeTab from './components/HomeTab';
import ConnectionsTab from './components/ConnectionsTab';
import ReviewsTab from './components/ReviewsTab';
import FriendsTab from './components/FriendsTab';
import WatchlistTab from './components/WatchlistTab';

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const [activeTab, setActiveTab] = useState('home');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    username: '',
    bio: '',
    profilePicture: '',
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<'url' | 'file'>('file');
  const [user, setUser] = useState<{
    username: string;
    bio: string;
    profilePicture: string;
    friendsCount: number;
    followersCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch user profile data
  useEffect(() => {
    async function fetchUserProfile() {
      if (status === 'loading' || !session?.user?.id) return;
      
      setLoading(true);
      try {
        const result = await getUserProfile();
        if ('error' in result) {
          setError(result.error || 'An error occurred');
        } else {
          // Fetch friend counts
          const friendsResponse = await fetch(`/api/friends/list?userId=${session.user.id}`);
          const friendsData = await friendsResponse.json();
          
          setUser({
            username: result.user.username || '',
            bio: result.user.bio || '',
            profilePicture: result.user.profilePicture || '/default.jpg',
            friendsCount: friendsData.count || 0,
            followersCount: 0,
          });
        }
      } catch (err) {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    }

    fetchUserProfile();
  }, [session, status]);

  // Initialize edit form when modal opens
  const handleEditProfile = () => {
    if (!user) return;
    setEditFormData({
      username: user.username || '',
      bio: user.bio || '',
      profilePicture: user.profilePicture || '',
    });
    setUploadedFile(null);
    setUploadPreview(null);
    setUploadMethod('file');
    setError(null); // Clear any previous errors
    setIsEditModalOpen(true);
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Ensure value is always a string
    const stringValue = value || '';
    
    // Enforce character limits
    if (name === 'bio' && stringValue.length > 500) {
      return; // Don't update if bio exceeds 500 characters
    }
    
    setEditFormData({
      ...editFormData,
      [name]: stringValue,
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a JPG, PNG, GIF, or WebP image file');
      return;
    }

    // Validate file size (500KB)
    if (file.size > 500 * 1024) {
      setError('File size must be less than 500KB');
      return;
    }

    setUploadedFile(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const clearFileUpload = () => {
    setUploadedFile(null);
    setUploadPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsUploading(true);
    try {
      let profilePictureUrl = editFormData.profilePicture;

      // If user uploaded a file, upload it first
      if (uploadedFile) {
        const formData = new FormData();
        formData.append('file', uploadedFile);
        
        const uploadResponse = await fetch('/api/upload/profile', {
          method: 'POST',
          body: formData,
        });
        
        const uploadResult = await uploadResponse.json();
        if (!uploadResponse.ok || uploadResult.error) {
          setError(uploadResult.error || 'Failed to upload image');
          setIsUploading(false);
          return;
        }
        profilePictureUrl = uploadResult.url;
      }

      // Only update profile picture if it's different from current one
      const updateData: {
        username: string;
        bio: string;
        profilePicture?: string;
      } = {
        username: editFormData.username,
        bio: editFormData.bio,
      };

      // Only include profilePicture if it has changed
      if (profilePictureUrl !== user.profilePicture) {
        updateData.profilePicture = profilePictureUrl;
      }

      const result = await updateUserProfile(updateData);
      
      if ('error' in result) {
        setError(result.error || 'Failed to update profile');
      } else {
        // Update local state with new data
        setUser({
          ...user,
          username: result.user.username,
          bio: result.user.bio || '',
          profilePicture: result.user.profilePicture,
        });
        
        // Trigger NextAuth session refresh from database
        await update();
        
        setIsEditModalOpen(false);
        setError(null);
        setSuccessMessage('Profile updated successfully!');
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      setError('Failed to update profile');
    } finally {
      setIsUploading(false);
    }
  };

  // Show loading state
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Don't render if no user data
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No user data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-600 font-medium">{successMessage}</p>
          </div>
        )}
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start gap-6">
            {/* Profile Picture */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                  <img 
                    src={user.profilePicture}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-2">
                <h1 className="text-4xl font-bold text-gray-900">{user.username}</h1>
                <button
                  onClick={handleEditProfile}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Profile
                </button>
              </div>
              <div className="flex gap-6 text-gray-600 mb-4">
                <span>
                  <strong className="text-gray-900">{user.friendsCount}</strong> Friends
                </span>
                <span>
                  <strong className="text-gray-900">{user.followersCount}</strong> Followers
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
              <button
                onClick={() => setActiveTab('connections')}
                className={`px-6 py-4 font-semibold text-lg border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'connections'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                connections
              </button>
            </nav>
          </div>
        </div>

        {/* Content Grid - Home Tab */}
        {activeTab === 'home' && (
          <HomeTab user={{
            id: session?.user?.id || '',
            username: user.username,
            bio: user.bio,
            profilePicture: user.profilePicture,
            followersCount: user.followersCount
          }} />
        )}

        {activeTab === 'reviews' && (
          <ReviewsTab user={{
            id: session?.user?.id || '',
            username: user.username,
            profilePicture: user.profilePicture
          }} />
        )}

        {activeTab === 'watchlist' && (
          <WatchlistTab user={{
            id: session?.user?.id || '',
            username: user.username
          }} />
        )}

        {activeTab === 'friends' && (
          <FriendsTab user={{
            id: session?.user?.id || '',
            username: user.username,
            profilePicture: user.profilePicture,
            followersCount: user.followersCount
          }} />
        )}

        {activeTab === 'connections' && (
          <ConnectionsTab />
        )}

        {/* Edit Profile Modal - Simple Design */}
        {isEditModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-md shadow-lg max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Edit Profile</h2>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Form Content */}
              <div className="p-4">
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                      {error}
                    </div>
                  )}

                  {/* Username Field */}
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={editFormData.username}
                      onChange={handleEditFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your username"
                      required
                    />
                  </div>

                  {/* Bio Field */}
                  <div>
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                      Bio
                    </label>
                    <textarea
                      id="bio"
                      name="bio"
                      value={editFormData.bio}
                      onChange={handleEditFormChange}
                      rows={3}
                      maxLength={500}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      placeholder="Tell us about yourself..."
                    />
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-gray-500">Share a bit about yourself</p>
                      <p className={`text-xs ${editFormData.bio.length > 450 ? 'text-red-500' : 'text-gray-400'}`}>
                        {editFormData.bio.length}/500
                      </p>
                    </div>
                  </div>

                  {/* Profile Picture Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Profile Picture
                    </label>
                    
                    {/* Upload Method Toggle */}
                    <div className="flex bg-gray-100 p-1 rounded mb-3">
                      <button
                        type="button"
                        onClick={() => {
                          setUploadMethod('file');
                          setError(null);
                        }}
                        className={`flex-1 py-1 px-2 text-sm rounded ${
                          uploadMethod === 'file'
                            ? 'bg-white text-blue-600'
                            : 'text-gray-600'
                        }`}
                      >
                        Upload File
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUploadMethod('url');
                          setUploadedFile(null);
                          setUploadPreview(null);
                          setError(null);
                        }}
                        className={`flex-1 py-1 px-2 text-sm rounded ${
                          uploadMethod === 'url'
                            ? 'bg-white text-blue-600'
                            : 'text-gray-600'
                        }`}
                      >
                        Use URL
                      </button>
                    </div>

                    {uploadMethod === 'file' ? (
                      <div>
                        {/* File Upload Area */}
                        <div className="relative">
                          <input
                            ref={fileInputRef}
                            type="file"
                            id="profilePictureFile"
                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                            onChange={handleFileSelect}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          />
                          <div className="border-2 border-dashed border-gray-300 rounded p-4 text-center hover:border-blue-400 cursor-pointer">
                            <p className="text-sm text-gray-700 mb-1">Click to upload</p>
                            <p className="text-xs text-gray-500">JPG, PNG, GIF, WebP (max 500KB)</p>
                          </div>
                        </div>

                        {/* Preview */}
                        {uploadPreview && (
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded mt-2">
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-10 bg-gray-200 rounded overflow-hidden">
                                <img src={uploadPreview} alt="Preview" className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <p className="text-sm text-gray-900">{uploadedFile?.name}</p>
                                <p className="text-xs text-gray-500">{((uploadedFile?.size || 0) / 1024).toFixed(1)}KB</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={clearFileUpload}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <input
                            type="url"
                            id="profilePicture"
                            name="profilePicture"
                            value={editFormData.profilePicture}
                            onChange={handleEditFormChange}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                            placeholder="https://example.com/your-image.jpg"
                          />
                        </div>
                        {editFormData.profilePicture && editFormData.profilePicture !== '/default.jpg' && (
                          <div className="w-14 h-14 bg-gray-200 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                            <img 
                              src={editFormData.profilePicture} 
                              alt="Preview"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setIsEditModalOpen(false)}
                      className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isUploading}
                      className="flex-1 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50"
                    >
                      {isUploading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

