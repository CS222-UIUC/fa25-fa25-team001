"use client";

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Header from '@/components/Header';
import { getUserProfile, updateUserProfile } from '@/actions/user';
import HomeTab from './components/HomeTab';
import ConnectionsTab from './components/ConnectionsTab';
import ReviewsTab from './components/ReviewsTab';
import FriendsTab from './components/FriendsTab';
import WatchlistTab from './components/WatchlistTab';
import FavoritesTab from './components/FavoritesTab';
import { Edit2, X, Upload, Link as LinkIcon, Image as ImageIcon, User as UserIcon, LayoutGrid, MessageSquare, Users, Gamepad2, Clock, Heart, Calendar, MapPin } from 'lucide-react';

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
    id: string;
    username: string;
    bio: string;
    profilePicture: string;
    followersCount: number;
    followingCount: number;
    createdAt?: string;
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
          // Fetch followers/following counts via public profile endpoint
          const countsResponse = await fetch(
            `/api/users/profile?username=${encodeURIComponent(result.user.username || '')}`
          );
          const countsData = countsResponse.ok ? await countsResponse.json() : null;
          
          setUser({
            id: session.user.id,
            username: result.user.username || '',
            bio: result.user.bio || '',
            profilePicture: result.user.profilePicture || '/default.jpg',
            followersCount: countsData?.followersCount ?? 0,
            followingCount: countsData?.followingCount ?? 0,
            createdAt: result.user.createdAt ? new Date(result.user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : undefined
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
    const stringValue = value || '';
    if (name === 'bio' && stringValue.length > 500) return;
    setEditFormData({ ...editFormData, [name]: stringValue });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a JPG, PNG, GIF, or WebP image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setUploadedFile(file);
    const previewUrl = URL.createObjectURL(file);
    setUploadPreview(previewUrl);
    setError(null);
  };

  const handleSaveProfile = async () => {
    setIsUploading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      let profilePictureUrl = editFormData.profilePicture;

      if (uploadMethod === 'file' && uploadedFile) {
        const formData = new FormData();
        formData.append('file', uploadedFile);
        
        const uploadRes = await fetch('/api/upload/profile', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          const errorData = await uploadRes.json();
          throw new Error(errorData.error || 'Failed to upload image');
        }

        const uploadData = await uploadRes.json();
        profilePictureUrl = uploadData.url;
      }

      const result = await updateUserProfile({
        username: editFormData.username,
        bio: editFormData.bio,
        profilePicture: profilePictureUrl,
      });

      if ('error' in result) {
        setError(result.error || 'Failed to update profile');
      } else {
        setUser(prev => prev ? {
          ...prev,
          username: result.user.username || '',
          bio: result.user.bio || '',
          profilePicture: result.user.profilePicture || '',
        } : null);
        
        await update({
          ...session,
          user: {
            ...session?.user,
            username: result.user.username,
            picture: result.user.profilePicture,
          }
        });
        
        setIsEditModalOpen(false);
        setSuccessMessage('Profile updated successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving');
    } finally {
      setIsUploading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!session || !user) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">Please sign in to view your profile.</p>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'home', label: 'Overview', icon: LayoutGrid },
    { id: 'reviews', label: 'Reviews', icon: MessageSquare },
    { id: 'watchlist', label: 'Watchlist', icon: Clock },
    { id: 'favorites', label: 'Favorites', icon: Heart },
    { id: 'friends', label: 'Followers', icon: Users },
    { id: 'connections', label: 'Connections', icon: Gamepad2 },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      {/* Hero Banner */}
      <div className="h-48 md:h-64 relative w-full overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-45"></div>
      </div>

      <div className="container mx-auto px-4">
        <div className="relative -mt-20 mb-6 flex flex-col md:flex-row items-end md:items-end gap-6">
          {/* Profile Picture */}
          <div className="relative group">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-background bg-secondary overflow-hidden shadow-xl">
              {user.profilePicture ? (
                <img 
                  src={user.profilePicture} 
                  alt={user.username} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-secondary text-muted-foreground">
                  <UserIcon className="h-16 w-16" />
                </div>
              )}
            </div>
            <button 
              onClick={handleEditProfile}
              className="absolute bottom-2 right-2 p-2 bg-primary text-primary-foreground rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/90"
              title="Edit Profile Picture"
            >
              <Edit2 className="h-4 w-4" />
            </button>
          </div>

          {/* User Info */}
          <div className="flex-1 pb-2 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold">{user.username}</h1>
                <p className="text-muted-foreground mt-1 max-w-2xl">{user.bio || "No bio yet..."}</p>
                
                <div className="flex items-center justify-center md:justify-start gap-4 mt-3 text-sm text-muted-foreground">
                  {user.createdAt && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Joined {user.createdAt}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{user.followersCount} Followers</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{user.followingCount} Following</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleEditProfile}
                className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto md:mx-0"
              >
                <Edit2 className="h-4 w-4" />
                Edit Profile
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="sticky top-[64px] z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border mb-6 -mx-4 px-4 md:mx-0 md:px-0">
          <div className="flex overflow-x-auto hide-scrollbar gap-1 py-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="min-h-[500px] pb-12">
          {successMessage && (
            <div className="mb-6 p-4 bg-green-500/10 text-green-500 rounded-lg border border-green-500/20 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              {successMessage}
            </div>
          )}

          {activeTab === 'home' && <HomeTab user={user} />}
          {activeTab === 'reviews' && <ReviewsTab user={user} />}
          {activeTab === 'watchlist' && <WatchlistTab user={user} />}
          {activeTab === 'favorites' && <FavoritesTab user={user} />}
          {activeTab === 'friends' && <FriendsTab user={user} />}
          {activeTab === 'connections' && <ConnectionsTab user={user} />}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-background rounded-xl border border-border shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-bold">Edit Profile</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 hover:bg-secondary rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {error && (
                <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm font-medium">
                  {error}
                </div>
              )}

              {/* Profile Picture Upload */}
              <div className="space-y-4">
                <label className="block text-sm font-medium">Profile Picture</label>
                
                <div className="flex gap-4 mb-4">
                  <button
                    onClick={() => setUploadMethod('file')}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg border ${
                      uploadMethod === 'file' 
                        ? 'bg-primary/10 border-primary text-primary' 
                        : 'bg-secondary border-transparent hover:bg-secondary/80'
                    }`}
                  >
                    Upload File
                  </button>
                  <button
                    onClick={() => setUploadMethod('url')}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg border ${
                      uploadMethod === 'url' 
                        ? 'bg-primary/10 border-primary text-primary' 
                        : 'bg-secondary border-transparent hover:bg-secondary/80'
                    }`}
                  >
                    Image URL
                  </button>
                </div>

                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-full bg-secondary overflow-hidden border-2 border-border flex-shrink-0">
                    {uploadPreview || editFormData.profilePicture ? (
                      <img 
                        src={uploadPreview || editFormData.profilePicture} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <UserIcon className="h-10 w-10" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    {uploadMethod === 'file' ? (
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-secondary/50 transition-colors"
                      >
                        <input 
                          type="file" 
                          ref={fileInputRef}
                          onChange={handleFileSelect}
                          className="hidden" 
                          accept="image/*"
                        />
                        <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Click to upload image</p>
                        <p className="text-xs text-muted-foreground mt-1">Max 5MB (JPG, PNG, GIF)</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="relative">
                          <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <input
                            type="text"
                            name="profilePicture"
                            value={editFormData.profilePicture}
                            onChange={handleEditFormChange}
                            placeholder="https://example.com/image.jpg"
                            className="w-full bg-secondary border border-input rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">Enter a direct link to an image</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Username */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">Username</label>
                <input
                  type="text"
                  name="username"
                  value={editFormData.username}
                  onChange={handleEditFormChange}
                  className="w-full bg-secondary border border-input rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Your username"
                />
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="block text-sm font-medium">Bio</label>
                  <span className="text-xs text-muted-foreground">{editFormData.bio.length}/500</span>
                </div>
                <textarea
                  name="bio"
                  value={editFormData.bio}
                  onChange={handleEditFormChange}
                  rows={4}
                  className="w-full bg-secondary border border-input rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  placeholder="Tell us about yourself..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-border flex justify-end gap-3 bg-secondary/30">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 text-sm font-medium hover:bg-secondary rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={isUploading}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
