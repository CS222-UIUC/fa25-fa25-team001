"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import FavoritesManager from './FavoritesManager';

interface User {
  id?: string;
  username: string;
  bio: string | null;
  profilePicture: string;
  followersCount: number;
}

interface HomeTabProps {
  user: User;
}

interface Activity {
  id: string;
  type: string;
  platform?: string;
  title: string;
  image?: string;
  playedAt?: Date;
  watchedAt?: Date;
  hours?: number;
  rating?: number;
  year?: number;
}

interface Review {
  id: string;
  title?: string;
  content: string;
  rating: number;
  createdAt: string;
  movie?: { id: string; title: string; poster?: string };
  videoGame?: { id: string; title: string; cover?: string };
  tvShow?: { id: string; title: string; poster?: string };
}

interface Friend {
  id: string;
  username: string;
  profilePicture: string;
  bio?: string;
}

interface Favorites {
  favoriteGames: any[];
  favoriteMovies: any[];
  favoriteTvShows: any[];
}

export default function HomeTab({ user }: HomeTabProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [recentReviews, setRecentReviews] = useState<Review[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [favorites, setFavorites] = useState<Favorites>({
    favoriteGames: [],
    favoriteMovies: [],
    favoriteTvShows: [],
  });
  const [loading, setLoading] = useState(true);
  const [showFavoritesModal, setShowFavoritesModal] = useState(false);

  const isOwnProfile = session?.user?.id === user.id;

  useEffect(() => {
    if (user.id) {
      loadData();
    }
  }, [user.id]);

  const loadData = async () => {
    try {
      // Load recent activity
      const activityRes = await fetch(`/api/users/activity?userId=${user.id}&limit=8`);
      if (activityRes.ok) {
        const activityData = await activityRes.json();
        setRecentActivity(activityData.activities || []);
      }

      // Load recent reviews
      const reviewsRes = await fetch(`/api/reviews/list?userId=${user.id}&limit=3`);
      if (reviewsRes.ok) {
        const reviewsData = await reviewsRes.json();
        setRecentReviews(reviewsData.reviews || []);
      }

      // Load friends
      const friendsRes = await fetch(`/api/friends/list?userId=${user.id}`);
      if (friendsRes.ok) {
        const friendsData = await friendsRes.json();
        setFriends((friendsData.friends || []).slice(0, 4));
      }

      // Load favorites
      const favoritesRes = await fetch(`/api/users/favorites?userId=${user.id}`);
      if (favoritesRes.ok) {
        const favoritesData = await favoritesRes.json();
        setFavorites(favoritesData);
      }
    } catch (error) {
      console.error('Failed to load home tab data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <span key={`full-${i}`} className="text-yellow-500 text-2xl">★</span>
      );
    }

    if (hasHalfStar) {
      stars.push(
        <span key="half" className="text-yellow-500 text-2xl">★</span>
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <span key={`empty-${i}`} className="text-gray-300 text-2xl">★</span>
      );
    }

    return stars;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Left Sidebar */}
      <div className="lg:col-span-1 space-y-6">
        {/* Bio Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Bio</h2>
          <p className="text-gray-600 leading-relaxed break-words whitespace-pre-line max-w-full">
            {user.bio || 'No bio added yet.'}
          </p>
        </div>

        {/* Favorites Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Favorites</h2>
            <button
              onClick={() => setShowFavoritesModal(true)}
              className="text-indigo-600 hover:text-indigo-700 font-semibold text-sm"
            >
              {isOwnProfile ? 'Edit' : 'View All'}
            </button>
          </div>
          
          {favorites.favoriteGames.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">🎮 Games</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                {favorites.favoriteGames.slice(0, 3).map((game: any, idx: number) => (
                  <li key={idx} className="truncate">{game.title || game.name}</li>
                ))}
              </ul>
            </div>
          )}
          
          {favorites.favoriteMovies.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">🎬 Movies</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                {favorites.favoriteMovies.slice(0, 3).map((movie: any, idx: number) => (
                  <li key={idx} className="truncate">{movie.title}</li>
                ))}
              </ul>
            </div>
          )}
          
          {favorites.favoriteTvShows.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">📺 TV Shows</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                {favorites.favoriteTvShows.slice(0, 3).map((show: any, idx: number) => (
                  <li key={idx} className="truncate">{show.title}</li>
                ))}
              </ul>
            </div>
          )}
          
          {favorites.favoriteGames.length === 0 && 
           favorites.favoriteMovies.length === 0 && 
           favorites.favoriteTvShows.length === 0 && (
            <p className="text-gray-500 text-sm">
              {isOwnProfile ? 'Add your favorites to showcase them!' : 'No favorites added yet'}
            </p>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:col-span-3 space-y-6">
        {/* Recent Activity Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Activity</h2>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
            </div>
          ) : recentActivity.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {recentActivity.map((item) => (
                <div
                  key={item.id}
                  className="group cursor-pointer"
                  onClick={() => {
                    if (item.type === 'movie' && item.id.startsWith('movie_')) {
                      router.push(`/movie/${item.id.replace('movie_', '')}`);
                    } else if (item.type === 'tvshow' && item.id.startsWith('tvshow_')) {
                      router.push(`/tv/${item.id.replace('tvshow_', '')}`);
                    } else if (item.type === 'game') {
                      // Could link to game page if you have one
                    }
                  }}
                >
                  <div className="aspect-[2/3] bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex items-center justify-center hover:ring-2 hover:ring-indigo-500 transition-all overflow-hidden">
                    {item.image ? (
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-400 text-sm text-center px-2">{item.title}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-700 mt-2 truncate font-medium">{item.title}</p>
                  {item.platform && (
                    <p className="text-xs text-gray-500">{item.platform}</p>
                  )}
                  {item.hours && (
                    <p className="text-xs text-gray-500">{item.hours}h</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No recent activity</p>
          )}
        </div>

        {/* Recent Reviews Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Reviews</h2>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
            </div>
          ) : recentReviews.length > 0 ? (
            <div className="space-y-6">
              {recentReviews.map((review) => {
                const mediaTitle = review.movie?.title || review.videoGame?.title || review.tvShow?.title || 'Unknown';
                const mediaId = review.movie?.id || review.videoGame?.id || review.tvShow?.id;
                const mediaType = review.movie ? 'movie' : review.videoGame ? 'game' : 'tv';
                const posterUrl = review.movie?.poster || review.tvShow?.poster || review.videoGame?.cover;
                
                return (
                  <div
                    key={review.id}
                    className="flex gap-4 p-4 border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors cursor-pointer"
                    onClick={() => {
                      if (mediaType === 'movie') router.push(`/movie/${mediaId}`);
                      else if (mediaType === 'tv') router.push(`/tv/${mediaId}`);
                      else if (mediaType === 'game') router.push(`/game/${mediaId}`);
                    }}
                  >
                    {/* Media Poster Thumbnail */}
                    <div className="flex-shrink-0 w-24 h-36 bg-gray-200 rounded overflow-hidden flex items-center justify-center">
                      {posterUrl ? (
                        <img src={posterUrl} alt={mediaTitle} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-gray-400 text-xs text-center px-2">{mediaType}</span>
                      )}
                    </div>

                    {/* Review Content */}
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{mediaTitle}</h3>
                      <div className="flex items-center gap-2 mb-3">
                        {renderStars(review.rating)}
                        <span className="text-gray-500 text-sm ml-2">{formatDate(review.createdAt)}</span>
                      </div>
                      {review.title && (
                        <h4 className="font-semibold text-gray-800 mb-1">{review.title}</h4>
                      )}
                      <p className="text-gray-600 leading-relaxed line-clamp-3">{review.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No reviews yet</p>
          )}
        </div>

        {/* Friends Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Friends</h2>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
            </div>
          ) : friends.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors cursor-pointer"
                  onClick={() => router.push(`/profile/${friend.username}`)}
                >
                  {/* Friend Profile Picture */}
                  <div className="flex-shrink-0 w-16 h-16 rounded-full overflow-hidden bg-gray-200">
                    {friend.profilePicture && friend.profilePicture !== '/default.jpg' ? (
                      <img src={friend.profilePicture} alt={friend.username} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl text-gray-400">☺</div>
                    )}
                  </div>

                  {/* Friend Info */}
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">{friend.username}</h3>
                    {friend.bio && (
                      <p className="text-sm text-gray-500 truncate">{friend.bio}</p>
                    )}
                  </div>

                  {/* View Profile Button */}
                  <button 
                    className="text-indigo-600 hover:text-indigo-700 font-semibold text-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/profile/${friend.username}`);
                    }}
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No friends yet</p>
          )}
        </div>
      </div>

      {/* Favorites Manager Modal */}
      {showFavoritesModal && user.id && (
        <FavoritesManager 
          userId={user.id} 
          onClose={() => {
            setShowFavoritesModal(false);
            loadData(); // Reload data when modal closes
          }} 
        />
      )}
    </div>
  );
}