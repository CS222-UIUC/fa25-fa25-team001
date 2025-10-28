"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getUserProfile, updateUserProfile } from "@/actions/user";
import { uploadProfilePicture } from "@/actions/upload";

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

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to view your profile</h1>
          <Link href="/auth/signin" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
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
    <div className="text-black min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Profile</h1>
          <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">Profile Information</h2>
            <div className="space-x-2">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  Edit Profile
                </button>
              ) : (
                <>
                  <button
                    onClick={handleSave}
                    disabled={uploading}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                  >
                    {uploading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
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
                  className="w-24 h-24 rounded-full"
                />
                {isEditing && (
                  <div className="mt-4">
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.svg"
                      onChange={handleFileSelect}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">JPG, PNG, or SVG. Max 1MB.</p>
                    {selectedFile && (
                      <button
                        onClick={handleUpload}
                        disabled={uploading}
                        className="mt-2 bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded text-sm disabled:opacity-50"
                      >
                        {uploading ? 'Uploading...' : 'Upload'}
                      </button>
                    )}
                  </div>
                )}
              </div>
              {isEditing && (
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Or enter Profile Picture URL
                  </label>
                  <input
                    type="url"
                    value={profileData.image.startsWith('blob:') ? '' : profileData.image}
                    onChange={(e) => setProfileData({...profileData, image: e.target.value})}
                    className="border border-gray-300 rounded-md px-3 py-2 w-full max-w-md"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              )}
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                  className="border border-gray-300 rounded-md px-3 py-2 w-full max-w-md"
                />
              ) : (
                <p className="text-gray-900">{profileData.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              {isEditing ? (
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                  className="border border-gray-300 rounded-md px-3 py-2 w-full max-w-md"
                />
              ) : (
                <p className="text-gray-900">{profileData.email}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}