'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get('tab') || 'home';
  const [activeTab, setActiveTab] = useState(tabFromUrl);

  // Sync state with URL on mount and when URL changes
  useEffect(() => {
    setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

  // Update URL when tab changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    router.push(`/profile?tab=${tab}`, { scroll: false });
  };

  // Mock data - will be replaced with real data later
  const user = {
    username: 'basil',
    profilePicture: '/default.jpg',
    tweetsCount: 217,
    followersCount: 217,
    bio: 'Movie enthusiast and critic. Love exploring cinema from different cultures and eras.',
  };

  const recentActivity = [
    { id: 1, type: 'movie', title: 'Inception', image: '/placeholder-movie.jpg' },
    { id: 2, type: 'movie', title: 'The Matrix', image: '/placeholder-movie.jpg' },
  ];

  const recentReviews = [
    {
      id: 1,
      movieTitle: 'Gianmarco Soresi: Thief of Joy',
      movieYear: '2025',
      movieImage: '/placeholder-movie.jpg',
      rating: null,
      reviewText: 'gianmarco 4ever',
      watchedDate: '19 Oct 2025',
      likes: 43,
      isLiked: true,
    },
    {
      id: 2,
      movieTitle: 'Sentimental Value',
      movieYear: '2025',
      movieImage: '/placeholder-movie.jpg',
      rating: 3.5,
      reviewText: 'the way this film plays with artifice is so stunning. i love movies joachim 4ever',
      watchedDate: '30 Sep 2025',
      likes: 94,
      isLiked: false,
    },
    {
      id: 3,
      movieTitle: 'Twinless',
      movieYear: '2025',
      movieImage: '/placeholder-movie.jpg',
      rating: 3.5,
      reviewText: 'fun to watch with a crowd... the amount of groans during the foot scene delighted me',
      watchedDate: '06 Sep 2025',
      likes: 294,
      isLiked: false,
    },
    {
      id: 4,
      movieTitle: 'Caught Stealing',
      movieYear: '2025',
      movieImage: '/placeholder-movie.jpg',
      rating: 3.0,
      reviewText: 'they tried to clone noho hank but there was a gas leak in the lab',
      watchedDate: '30 Aug 2025',
      likes: 699,
      isLiked: false,
    },
    {
      id: 5,
      movieTitle: 'Lurker',
      movieYear: '2025',
      movieImage: '/placeholder-movie.jpg',
      rating: 4.0,
      reviewText: 'oliver should have a sleepover with us at his house in LA and i am literally in tears',
      watchedDate: '29 Aug 2025',
      likes: 156,
      isLiked: true,
    },
  ];

  const friends = [
    { id: 1, username: 'moviefan22', followers: 145, profilePicture: '/default.jpg' },
    { id: 2, username: 'cinephile', followers: 230, profilePicture: '/default.jpg' },
    { id: 3, username: 'filmcritic', followers: 512, profilePicture: '/default.jpg' },
    { id: 4, username: 'popculture', followers: 89, profilePicture: '/default.jpg' },
  ];

  const activities = [
    { 
      id: 1, 
      type: 'followed', 
      username: 'Gio52', 
      timestamp: '3d',
      action: 'followed'
    },
    { 
      id: 2, 
      type: 'followed', 
      username: 'luca', 
      timestamp: '3d',
      action: 'followed'
    },
    { 
      id: 3, 
      type: 'followed', 
      username: 'Nate', 
      timestamp: '3d',
      action: 'followed'
    },
    { 
      id: 4, 
      type: 'watchlist', 
      movieTitle: 'Girl Picture', 
      movieImage: '/placeholder-movie.jpg',
      timestamp: '4d',
      action: 'added to watchlist'
    },
    { 
      id: 5, 
      type: 'followed', 
      username: 'romy', 
      timestamp: '7d',
      action: 'followed'
    },
    { 
      id: 6, 
      type: 'watched', 
      movieTitle: 'Gianmarco Soresi: Thief of Joy',
      movieYear: '2025',
      movieImage: '/placeholder-movie.jpg',
      rating: 4.5,
      reviewText: 'gianmarco 4ever',
      likes: 43,
      timestamp: '14d',
      action: 'watched'
    },
    { 
      id: 7, 
      type: 'watchlist', 
      movieTitle: 'Coherence', 
      movieImage: '/placeholder-movie.jpg',
      timestamp: '17d',
      action: 'added to watchlist'
    },
    { 
      id: 8, 
      type: 'listed', 
      listName: 'movies',
      movieCount: 3,
      movies: [
        { id: 1, image: '/placeholder-movie.jpg', title: 'School of Rock' },
        { id: 2, image: '/placeholder-movie.jpg', title: 'Brokeback Mountain' },
        { id: 3, image: '/placeholder-movie.jpg', title: 'Hitch' }
      ],
      likes: 4,
      timestamp: '19d',
      action: 'listed'
    },
    { 
      id: 9, 
      type: 'followed', 
      username: 'emmalwooten', 
      timestamp: '1mo',
      action: 'followed'
    }
  ];

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <span key={`full-${i}`} className="text-yellow-500 text-2xl">
          ★
        </span>
      );
    }

    if (hasHalfStar) {
      stars.push(
        <span key="half" className="text-yellow-500 text-2xl">
          ★
        </span>
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <span key={`empty-${i}`} className="text-gray-300 text-2xl">
          ★
        </span>
      );
    }

    return stars;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start gap-6">
            {/* Profile Picture */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                <span className="text-6xl text-gray-400">☺</span>
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{user.username}</h1>
              <div className="flex gap-6 text-gray-600 mb-4">
                <span>
                  <strong className="text-gray-900">{user.tweetsCount}</strong> tweeters
                </span>
                <span>
                  <strong className="text-gray-900">{user.followersCount}</strong> followers
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => handleTabChange('home')}
                className={`px-6 py-4 font-semibold text-lg border-b-2 transition-colors ${
                  activeTab === 'home'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                home
              </button>
              <button
                onClick={() => handleTabChange('profile')}
                className={`px-6 py-4 font-semibold text-lg border-b-2 transition-colors ${
                  activeTab === 'profile'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                profile
              </button>
              <button
                onClick={() => handleTabChange('activity')}
                className={`px-6 py-4 font-semibold text-lg border-b-2 transition-colors ${
                  activeTab === 'activity'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                activity
              </button>
              <button
                onClick={() => handleTabChange('reviews')}
                className={`px-6 py-4 font-semibold text-lg border-b-2 transition-colors ${
                  activeTab === 'reviews'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                reviews
              </button>
              <button
                onClick={() => handleTabChange('friends')}
                className={`px-6 py-4 font-semibold text-lg border-b-2 transition-colors ${
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

        {/* Content Grid - Home Tab */}
        {activeTab === 'home' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Bio Section */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Bio</h2>
                <p className="text-gray-600 leading-relaxed">{user.bio}</p>
              </div>

              {/* Space for more features */}
              <div className="bg-gray-100 rounded-lg p-6 text-center">
                <p className="text-gray-500 font-medium">Space for more features</p>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Recent Activity Section */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Act</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {recentActivity.map((item) => (
                    <div
                      key={item.id}
                      className="aspect-[2/3] bg-gray-200 rounded-lg flex items-center justify-center hover:ring-2 hover:ring-indigo-500 transition-all cursor-pointer"
                    >
                      <span className="text-gray-400 text-sm">Movie Poster</span>
                    </div>
                  ))}
                  <div className="aspect-[2/3] bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-gray-400 text-4xl">...</span>
                  </div>
                </div>
              </div>

              {/* Recent Reviews Section */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Rev.</h2>
                <div className="space-y-6">
                  {recentReviews.slice(0, 2).map((review) => (
                    <div
                      key={review.id}
                      className="flex gap-4 p-4 border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors"
                    >
                      {/* Movie Poster Thumbnail */}
                      <div className="flex-shrink-0 w-24 h-36 bg-gray-200 rounded flex items-center justify-center">
                        <span className="text-gray-400 text-xs text-center px-2">Poster</span>
                      </div>

                      {/* Review Content */}
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {review.movieTitle}
                          {review.movieYear && (
                            <span className="text-gray-500 font-normal text-base ml-2">{review.movieYear}</span>
                          )}
                        </h3>
                        <div className="flex items-center gap-2 mb-3">
                          {review.rating && renderStars(review.rating)}
                          <span className="text-gray-500 text-sm ml-2">{review.watchedDate}</span>
                        </div>
                        <p className="text-gray-600 leading-relaxed">{review.reviewText}</p>
                      </div>

                      {/* More Options */}
                      <div className="flex-shrink-0">
                        <button className="text-gray-400 hover:text-gray-600 text-xl p-2">
                          ⋯
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Friends Section */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Friends</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {friends.map((friend) => (
                    <div
                      key={friend.id}
                      className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors cursor-pointer"
                    >
                      {/* Friend Profile Picture */}
                      <div className="flex-shrink-0 w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-2xl text-gray-400">☺</span>
                      </div>

                      {/* Friend Info */}
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900">{friend.username}</h3>
                        <p className="text-sm text-gray-500">{friend.followers} followers</p>
                      </div>

                      {/* View Profile Button */}
                      <button className="text-indigo-600 hover:text-indigo-700 font-semibold text-sm">
                        View
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Other Tabs - Placeholder Content */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Profile Tab</h2>
            <p className="text-gray-500 text-lg">Content coming soon...</p>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="bg-white rounded-lg shadow-sm">
            {/* Activity Header */}
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">Recent Activity</h2>
            </div>

            {/* Activity Feed */}
            <div className="divide-y divide-gray-200">
              {activities.map((activity) => (
                <div key={activity.id} className="px-6 py-5 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Followed Activity */}
                      {activity.type === 'followed' && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-900 font-semibold">{user.username}</span>
                          <span className="text-gray-600">followed</span>
                          <span className="text-gray-900 font-semibold">{activity.username}</span>
                        </div>
                      )}

                      {/* Watchlist Activity */}
                      {activity.type === 'watchlist' && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-gray-900 font-semibold">{user.username}</span>
                            <span className="text-gray-600">added</span>
                            <span className="text-gray-900 font-semibold">{activity.movieTitle}</span>
                            <span className="text-gray-600">to their watchlist</span>
                          </div>
                        </div>
                      )}

                      {/* Watched Activity */}
                      {activity.type === 'watched' && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-gray-900 font-semibold">{user.username}</span>
                            <span className="text-gray-600">watched</span>
                          </div>
                          
                          {/* Movie Card */}
                          <div className="flex gap-4 mt-3 bg-gray-50 rounded-lg p-4">
                            {/* Movie Poster */}
                            <div className="flex-shrink-0 w-20 h-28 bg-gray-300 rounded flex items-center justify-center">
                              <span className="text-gray-500 text-xs">Poster</span>
                            </div>
                            
                            {/* Movie Details */}
                            <div className="flex-1">
                              <h3 className="text-lg font-bold text-gray-900 mb-1">
                                {activity.movieTitle} 
                                {activity.movieYear && (
                                  <span className="text-gray-500 font-normal ml-2">{activity.movieYear}</span>
                                )}
                              </h3>
                              
                              {/* Rating */}
                              {activity.rating && (
                                <div className="flex items-center gap-1 mb-2">
                                  {renderStars(activity.rating)}
                                </div>
                              )}
                              
                              {/* Review Text */}
                              {activity.reviewText && (
                                <p className="text-gray-700 mb-2">{activity.reviewText}</p>
                              )}
                              
                              {/* Likes */}
                              {activity.likes !== undefined && (
                                <div className="flex items-center gap-2 text-gray-500">
                                  <span>❤️ {activity.likes} likes</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Listed Activity */}
                      {activity.type === 'listed' && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-gray-900 font-semibold">{user.username}</span>
                            <span className="text-gray-600">listed</span>
                            <span className="text-gray-900 font-semibold">{activity.listName}</span>
                            <span className="text-gray-600">({activity.movieCount} films)</span>
                            {activity.likes !== undefined && (
                              <span className="text-gray-500 ml-2">❤️ {activity.likes}</span>
                            )}
                          </div>
                          
                          {/* Movie Thumbnails */}
                          {activity.movies && (
                            <div className="flex gap-2 mt-3">
                              {activity.movies.map((movie: { id: number; image: string; title: string }) => (
                                <div 
                                  key={movie.id} 
                                  className="w-16 h-24 bg-gray-300 rounded flex items-center justify-center flex-shrink-0"
                                  title={movie.title}
                                >
                                  <span className="text-gray-500 text-xs text-center px-1">📽️</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Timestamp */}
                    <span className="text-gray-400 text-sm ml-4 flex-shrink-0">{activity.timestamp}</span>
                  </div>
                </div>
              ))}

              {/* End of Activity */}
              <div className="px-6 py-8 text-center">
                <p className="text-gray-400 text-sm">End of recent activity</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="bg-white rounded-lg shadow-sm">
            {/* Reviews Header */}
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">Reviews</h2>
              <div className="flex items-center gap-4">
                <button className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1">
                  RATING <span className="text-xs">▼</span>
                </button>
                <button className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1">
                  DIARY YEAR <span className="text-xs">▼</span>
                </button>
                <button className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1">
                  Sort by WHEN REVIEWED <span className="text-xs">▼</span>
                </button>
                <button className="text-sm text-gray-600 hover:text-gray-900">
                  👁️
                </button>
              </div>
            </div>

            {/* Reviews List */}
            <div className="divide-y divide-gray-200">
              {recentReviews.map((review) => (
                <div key={review.id} className="px-6 py-6 hover:bg-gray-50 transition-colors">
                  <div className="flex gap-6">
                    {/* Movie Poster */}
                    <div className="flex-shrink-0">
                      <div className="w-28 h-40 bg-gray-300 rounded-lg overflow-hidden flex items-center justify-center">
                        <span className="text-gray-500 text-sm">Poster</span>
                      </div>
                    </div>

                    {/* Review Content */}
                    <div className="flex-1">
                      {/* Movie Title and Year */}
                      <div className="mb-3">
                        <h3 className="text-2xl font-bold text-gray-900 inline">
                          {review.movieTitle}
                        </h3>
                        {review.movieYear && (
                          <span className="text-xl text-gray-500 ml-2">{review.movieYear}</span>
                        )}
                      </div>

                      {/* Watched Status and Rating */}
                      <div className="flex items-center gap-3 mb-3">
                        {review.isLiked && (
                          <span className="text-orange-500 text-xl">🧡</span>
                        )}
                        <span className="text-gray-600">
                          Watched <span className="text-gray-500">{review.watchedDate}</span>
                        </span>
                      </div>

                      {/* Star Rating */}
                      {review.rating && (
                        <div className="flex items-center gap-1 mb-4">
                          {renderStars(review.rating)}
                        </div>
                      )}

                      {/* Review Text */}
                      {review.reviewText && (
                        <p className="text-gray-700 text-base leading-relaxed mb-4">
                          {review.reviewText}
                        </p>
                      )}

                      {/* Likes Count */}
                      <div className="flex items-center gap-2 text-gray-500">
                        <span className="text-gray-400">❤️</span>
                        <span className="text-sm">{review.likes} likes</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* End of Reviews */}
            <div className="px-6 py-8 text-center border-t border-gray-200">
              <p className="text-gray-400 text-sm">End of reviews</p>
            </div>
          </div>
        )}

        {activeTab === 'friends' && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Friends Tab</h2>
            <p className="text-gray-500 text-lg">Content coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}

