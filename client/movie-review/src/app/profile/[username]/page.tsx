"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Header from '@/components/Header';
import HomeTab from '../components/HomeTab';
import ReviewsTab from '../components/ReviewsTab';
import FriendsTab from '../components/FriendsTab';
import ConnectionsTab from '../components/ConnectionsTab';
import WatchlistTab from '../components/WatchlistTab';
import FavoritesTab from '../components/FavoritesTab';
import { User, UserPlus, UserMinus, MessageSquare, Users, LayoutGrid, Gamepad2, Calendar, MapPin, Link as LinkIcon, Check, Clock, Heart } from 'lucide-react';

interface UserProfile {
  id: string;
  username: string;
  bio: string | null;
  profilePicture: string;
  createdAt: string;
  location?: string;
  website?: string;
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const username = decodeURIComponent(params.username as string);
  
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [reviewsCount, setReviewsCount] = useState(0);
  const [activeTab, setActiveTab] = useState('home');
  const [friendActionLoading, setFriendActionLoading] = useState(false);

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
        setIsFollowing(data.isFollowing || data.isFriend || false);
        setFollowersCount(data.followersCount ?? data.friendsCount ?? 0);
        setFollowingCount(data.followingCount ?? 0);
        setReviewsCount(data.reviewsCount || 0);
      } else {
        // Handle 404 or error
        console.error("User not found");
      }
    } catch (error) {
      console.error("Failed to load profile", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFriendAction = async () => {
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    if (!user) return;

    setFriendActionLoading(true);
    try {
      const response = isFollowing
        ? await fetch(`/api/followers/unfollow?userId=${encodeURIComponent(user.id)}`, { method: 'DELETE' })
        : await fetch('/api/followers/follow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id }),
          });

      if (response.ok) {
        setIsFollowing(!isFollowing);
        setFollowersCount((prev) => (isFollowing ? Math.max(0, prev - 1) : prev + 1));
      }
    } catch (error) {
      console.error('Friend action failed:', error);
    } finally {
      setFriendActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <div className="flex justify-center items-center h-[calc(100vh-64px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-bold mb-4">User not found</h1>
          <p className="text-muted-foreground mb-8">The user you are looking for does not exist.</p>
          <button 
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const isOwnProfile = !!(session?.user?.id && user?.id && session.user.id === user.id);

  // Redirect to main profile page if viewing own profile
  if (isOwnProfile) {
    router.replace('/profile');
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
      <Header />
      
      <main className="pb-20">
        {/* Hero Banner */}
        <div className="h-64 md:h-80 relative w-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-background/50 to-background z-10"></div>
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1574267432553-4b4628081c31?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-40"></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-20 -mt-32">
          <div className="flex flex-col md:flex-row items-start gap-6 md:gap-10">
            {/* Profile Picture */}
            <div className="relative group">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-background shadow-2xl overflow-hidden bg-secondary">
                <img 
                  src={user.profilePicture || '/uploads/profiles/default.png'} 
                  alt={user.username}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 pt-2 md:pt-16">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{user.username}</h1>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                    </div>
                    {user.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" />
                        <span>{user.location}</span>
                      </div>
                    )}
                    {user.website && (
                      <a href={user.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-primary transition-colors">
                        <LinkIcon className="h-4 w-4" />
                        <span>Website</span>
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleFriendAction}
                    disabled={friendActionLoading}
                    className={`px-6 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
                      isFollowing 
                        ? 'bg-secondary hover:bg-secondary/80 text-foreground border border-border' 
                        : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20'
                    }`}
                  >
                    {friendActionLoading ? (
                      <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : isFollowing ? (
                      <>
                        <Check className="h-4 w-4" />
                        Following
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />
                        Follow
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-8 mt-6 border-t border-border/50 pt-6">
                <div className="text-center md:text-left">
                  <div className="text-2xl font-bold text-foreground">{reviewsCount}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Reviews</div>
                </div>
                <div className="text-center md:text-left">
                  <div className="text-2xl font-bold text-foreground">{followersCount}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Followers</div>
                </div>
                <div className="text-center md:text-left">
                  <div className="text-2xl font-bold text-foreground">{followingCount}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Following</div>
                </div>
              </div>

              {user.bio && (
                <p className="mt-6 text-muted-foreground max-w-2xl leading-relaxed">
                  {user.bio}
                </p>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-12 border-b border-border sticky top-[64px] bg-background/95 backdrop-blur-sm z-30">
            <nav className="flex gap-8 overflow-x-auto pb-px no-scrollbar">
              {[
                { id: 'home', label: 'Overview', icon: LayoutGrid },
                { id: 'reviews', label: 'Reviews', icon: MessageSquare },
                { id: 'watchlist', label: 'Watchlist', icon: Clock },
                { id: 'favorites', label: 'Favorites', icon: Heart },
                { id: 'friends', label: 'Followers', icon: Users },
                { id: 'connections', label: 'Connections', icon: Gamepad2 },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 pb-4 text-sm font-medium transition-all relative whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="mt-8 min-h-[400px]">
            {activeTab === 'home' && <HomeTab user={{ ...user, followersCount }} />}
            {activeTab === 'reviews' && <ReviewsTab user={user} />}
            {activeTab === 'watchlist' && <WatchlistTab user={user} />}
            {activeTab === 'favorites' && <FavoritesTab user={user} />}
            {activeTab === 'friends' && <FriendsTab user={user} />}
            {activeTab === 'connections' && <ConnectionsTab user={user} />}
          </div>
        </div>
      </main>
    </div>
  );
}
