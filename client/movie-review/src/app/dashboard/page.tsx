'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import PlatformConnections from '@/components/PlatformConnections';
import FavoritesSection from '@/components/FavoritesSection';
import RecentGamesSection from '@/components/RecentGamesSection';

export default function Dashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get('tab') || 'profile';
  const [activeTab, setActiveTab] = useState(tabFromUrl);

  // Sync state with URL on mount and when URL changes
  useEffect(() => {
    setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

  // Update URL when tab changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    router.push(`/dashboard?tab=${tab}`, { scroll: false });
  };

  const user = {
    username: session?.user?.name || 'User',
    profilePicture: session?.user?.image || '/default.jpg',
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
    { id: 1, username: 'moviefan22', followers: 145, profilePicture: '/default.jpg', bio: 'Love action movies and thrillers' },
    { id: 2, username: 'cinephile', followers: 230, profilePicture: '/default.jpg', bio: 'Independent film enthusiast' },
    { id: 3, username: 'filmcritic', followers: 512, profilePicture: '/default.jpg', bio: 'Professional movie reviewer' },
    { id: 4, username: 'popculture', followers: 89, profilePicture: '/default.jpg', bio: 'Pop culture and blockbusters' },
    { id: 5, username: 'classiccinema', followers: 312, profilePicture: '/default.jpg', bio: 'Classic Hollywood films' },
    { id: 6, username: 'indiefilms', followers: 178, profilePicture: '/default.jpg', bio: 'Independent and foreign films' },
  ];

  const lists = [
    {
      id: 1,
      title: 'Top 10 Movies with Best Soundtracks',
      description: 'Films where the music elevates the entire experience',
      movieCount: 10,
      movies: [
        { id: 1, title: 'School of Rock', year: '2003', poster: '/placeholder-movie.jpg' },
        { id: 2, title: 'Brokeback Mountain', year: '2005', poster: '/placeholder-movie.jpg' },
        { id: 3, title: 'Hitch', year: '2005', poster: '/placeholder-movie.jpg' },
        { id: 4, title: 'Guardians of the Galaxy', year: '2014', poster: '/placeholder-movie.jpg' },
        { id: 5, title: 'Baby Driver', year: '2017', poster: '/placeholder-movie.jpg' },
      ],
      likes: 42,
      createdAt: '2 weeks ago',
    },
    {
      id: 2,
      title: 'Mind-Bending Thrillers',
      description: 'Movies that make you question reality',
      movieCount: 8,
      movies: [
        { id: 1, title: 'Inception', year: '2010', poster: '/placeholder-movie.jpg' },
        { id: 2, title: 'The Matrix', year: '1999', poster: '/placeholder-movie.jpg' },
        { id: 3, title: 'Shutter Island', year: '2010', poster: '/placeholder-movie.jpg' },
        { id: 4, title: 'Memento', year: '2000', poster: '/placeholder-movie.jpg' },
      ],
      likes: 28,
      createdAt: '1 month ago',
    },
    {
      id: 3,
      title: 'Comfort Movies',
      description: 'Perfect for a rainy day',
      movieCount: 12,
      movies: [
        { id: 1, title: 'The Princess Bride', year: '1987', poster: '/placeholder-movie.jpg' },
        { id: 2, title: 'Amélie', year: '2001', poster: '/placeholder-movie.jpg' },
        { id: 3, title: 'Little Miss Sunshine', year: '2006', poster: '/placeholder-movie.jpg' },
        { id: 4, title: 'The Grand Budapest Hotel', year: '2014', poster: '/placeholder-movie.jpg' },
      ],
      likes: 67,
      createdAt: '3 weeks ago',
    },
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

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-300 via-cyan-200 to-teal-300">
        <div className="text-center glass-strong rounded-3xl p-8 shadow-2xl">
          <h1 className="text-2xl font-bold mb-4 bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">Please sign in to view your profile</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-300 via-cyan-200 to-teal-300">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="glass-strong rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-start gap-6">
            {/* Profile Picture */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 bg-gradient-to-br from-cyan-400 to-teal-400 rounded-full flex items-center justify-center overflow-hidden ring-4 ring-cyan-300/50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={user.profilePicture} 
                  alt={user.username}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/default.jpg';
                  }}
                />
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-sky-800 to-cyan-700 bg-clip-text text-transparent mb-2">{user.username}</h1>
              <div className="flex gap-6 text-sky-700 mb-4">
                <span>
                  <strong className="text-sky-800">{user.tweetsCount}</strong> tweeters
                </span>
                <span>
                  <strong className="text-sky-800">{user.followersCount}</strong> followers
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="glass-strong rounded-2xl shadow-xl mb-6">
          <div className="border-b border-cyan-300/30">
            <nav className="flex">
              <button
                onClick={() => handleTabChange('profile')}
                className={`px-6 py-4 font-semibold text-lg border-b-2 transition-colors ${
                  activeTab === 'profile'
                    ? 'border-cyan-500 text-cyan-600'
                    : 'border-transparent text-sky-700 hover:text-sky-800'
                }`}
              >
                profile
              </button>
              <button
                onClick={() => handleTabChange('activity')}
                className={`px-6 py-4 font-semibold text-lg border-b-2 transition-colors ${
                  activeTab === 'activity'
                    ? 'border-cyan-500 text-cyan-600'
                    : 'border-transparent text-sky-700 hover:text-sky-800'
                }`}
              >
                activity
              </button>
              <button
                onClick={() => handleTabChange('reviews')}
                className={`px-6 py-4 font-semibold text-lg border-b-2 transition-colors ${
                  activeTab === 'reviews'
                    ? 'border-cyan-500 text-cyan-600'
                    : 'border-transparent text-sky-700 hover:text-sky-800'
                }`}
              >
                reviews
              </button>
              <button
                onClick={() => handleTabChange('lists')}
                className={`px-6 py-4 font-semibold text-lg border-b-2 transition-colors ${
                  activeTab === 'lists'
                    ? 'border-cyan-500 text-cyan-600'
                    : 'border-transparent text-sky-700 hover:text-sky-800'
                }`}
              >
                lists
              </button>
              <button
                onClick={() => handleTabChange('friends')}
                className={`px-6 py-4 font-semibold text-lg border-b-2 transition-colors ${
                  activeTab === 'friends'
                    ? 'border-cyan-500 text-cyan-600'
                    : 'border-transparent text-sky-700 hover:text-sky-800'
                }`}
              >
                friends
              </button>
            </nav>
          </div>
        </div>

        {/* Content Grid - Profile Tab */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Bio Section */}
              <div className="glass-strong rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-bold text-sky-800 mb-4">Bio</h2>
                <p className="text-sky-700 leading-relaxed">{user.bio}</p>
              </div>

              {/* Space for more features */}
              <div className="glass rounded-2xl p-6 text-center">
                <p className="text-sky-600 font-medium">Space for more features</p>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Recent Activity Section */}
              <div className="glass-strong rounded-2xl shadow-xl p-6">
                <h2 className="text-2xl font-bold text-sky-800 mb-4">Recent Act</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {recentActivity.map((item) => (
                    <div
                      key={item.id}
                      className="aspect-[2/3] glass rounded-xl flex items-center justify-center hover:ring-2 hover:ring-cyan-400 transition-all cursor-pointer"
                    >
                      <span className="text-sky-600 text-sm">Movie Poster</span>
                    </div>
                  ))}
                  <div className="aspect-[2/3] glass rounded-xl flex items-center justify-center">
                    <span className="text-sky-500 text-4xl">...</span>
                  </div>
                </div>
              </div>

              {/* Recent Reviews Section */}
              <div className="glass-strong rounded-2xl shadow-xl p-6">
                <h2 className="text-2xl font-bold text-sky-800 mb-4">Recent Rev.</h2>
                <div className="space-y-6">
                  {recentReviews.slice(0, 2).map((review) => (
                    <div
                      key={review.id}
                      className="flex gap-4 p-4 glass rounded-xl hover:ring-2 hover:ring-cyan-400/50 transition-colors"
                    >
                      {/* Movie Poster Thumbnail */}
                      <div className="flex-shrink-0 w-24 h-36 glass rounded-lg flex items-center justify-center">
                        <span className="text-sky-600 text-xs text-center px-2">Poster</span>
                      </div>

                      {/* Review Content */}
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-sky-800 mb-2">
                          {review.movieTitle}
                          {review.movieYear && (
                            <span className="text-sky-600 font-normal text-base ml-2">{review.movieYear}</span>
                          )}
                        </h3>
                        <div className="flex items-center gap-2 mb-3">
                          {review.rating && renderStars(review.rating)}
                          <span className="text-sky-600 text-sm ml-2">{review.watchedDate}</span>
                        </div>
                        <p className="text-sky-700 leading-relaxed">{review.reviewText}</p>
                      </div>

                      {/* More Options */}
                      <div className="flex-shrink-0">
                        <button className="text-sky-600 hover:text-sky-800 text-xl p-2">
                          ⋯
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Friends Section */}
              <div className="glass-strong rounded-2xl shadow-xl p-6">
                <h2 className="text-2xl font-bold text-sky-800 mb-4">Friends</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {friends.map((friend) => (
                    <div
                      key={friend.id}
                      className="flex items-center gap-4 p-4 glass rounded-xl hover:ring-2 hover:ring-cyan-400/50 transition-colors cursor-pointer"
                    >
                      {/* Friend Profile Picture */}
                      <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-cyan-400 to-teal-400 rounded-full flex items-center justify-center ring-2 ring-cyan-300/50">
                        <span className="text-2xl text-white">☺</span>
          </div>

                      {/* Friend Info */}
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-sky-800">{friend.username}</h3>
                        <p className="text-sm text-sky-600">{friend.followers} followers</p>
                      </div>

                      {/* View Profile Button */}
                      <button className="text-cyan-600 hover:text-cyan-700 font-semibold text-sm">
                        View
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Favorites Section */}
              <div className="mt-6">
                <FavoritesSection />
              </div>

              {/* Recent Games Section */}
              <div className="mt-6">
                <RecentGamesSection />
              </div>

              {/* Platform Connections */}
              <div className="mt-6">
                <PlatformConnections />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="glass-strong rounded-2xl shadow-xl">
            {/* Activity Header */}
            <div className="border-b border-cyan-300/30 px-6 py-4">
              <h2 className="text-2xl font-bold text-sky-800 uppercase tracking-wide">Recent Activity</h2>
            </div>

            {/* Activity Feed */}
            <div className="divide-y divide-cyan-300/20">
              {activities.map((activity) => (
                <div key={activity.id} className="px-6 py-5 hover:bg-cyan-50/30 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Followed Activity */}
                      {activity.type === 'followed' && (
                        <div className="flex items-center gap-2">
                          <span className="text-sky-800 font-semibold">{user.username}</span>
                          <span className="text-sky-600">followed</span>
                          <span className="text-sky-800 font-semibold">{activity.username}</span>
                        </div>
                      )}

                      {/* Watchlist Activity */}
                      {activity.type === 'watchlist' && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-sky-800 font-semibold">{user.username}</span>
                            <span className="text-sky-600">added</span>
                            <span className="text-sky-800 font-semibold">{activity.movieTitle}</span>
                            <span className="text-sky-600">to their watchlist</span>
                          </div>
                        </div>
                      )}

                      {/* Watched Activity */}
                      {activity.type === 'watched' && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-sky-800 font-semibold">{user.username}</span>
                            <span className="text-sky-600">watched</span>
                          </div>
                          
                          {/* Movie Card */}
                          <div className="flex gap-4 mt-3 glass rounded-xl p-4">
                            {/* Movie Poster */}
                            <div className="flex-shrink-0 w-20 h-28 glass rounded-lg flex items-center justify-center">
                              <span className="text-sky-600 text-xs">Poster</span>
                            </div>
                            
                            {/* Movie Details */}
                            <div className="flex-1">
                              <h3 className="text-lg font-bold text-sky-800 mb-1">
                                {activity.movieTitle} 
                                {activity.movieYear && (
                                  <span className="text-sky-600 font-normal ml-2">{activity.movieYear}</span>
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
                                <p className="text-sky-700 mb-2">{activity.reviewText}</p>
                              )}
                              
                              {/* Likes */}
                              {activity.likes !== undefined && (
                                <div className="flex items-center gap-2 text-sky-600">
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
                            <span className="text-sky-800 font-semibold">{user.username}</span>
                            <span className="text-sky-600">listed</span>
                            <span className="text-sky-800 font-semibold">{activity.listName}</span>
                            <span className="text-sky-600">({activity.movieCount} films)</span>
                            {activity.likes !== undefined && (
                              <span className="text-sky-600 ml-2">❤️ {activity.likes}</span>
                            )}
          </div>

                          {/* Movie Thumbnails */}
                          {activity.movies && (
                            <div className="flex gap-2 mt-3">
                              {activity.movies.map((movie: { id: number; image: string; title: string }) => (
                                <div 
                                  key={movie.id} 
                                  className="w-16 h-24 glass rounded-lg flex items-center justify-center flex-shrink-0"
                                  title={movie.title}
                                >
                                  <span className="text-sky-600 text-xs text-center px-1">📽️</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Timestamp */}
                    <span className="text-sky-500 text-sm ml-4 flex-shrink-0">{activity.timestamp}</span>
                  </div>
                </div>
              ))}

              {/* End of Activity */}
              <div className="px-6 py-8 text-center">
                <p className="text-sky-500 text-sm">End of recent activity</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="glass-strong rounded-2xl shadow-xl">
            {/* Reviews Header */}
            <div className="border-b border-cyan-300/30 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-sky-800 uppercase tracking-wide">Reviews</h2>
              <div className="flex items-center gap-4">
                <button className="text-sm text-sky-600 hover:text-sky-800 flex items-center gap-1">
                  RATING <span className="text-xs">▼</span>
                </button>
                <button className="text-sm text-sky-600 hover:text-sky-800 flex items-center gap-1">
                  DIARY YEAR <span className="text-xs">▼</span>
                </button>
                <button className="text-sm text-sky-600 hover:text-sky-800 flex items-center gap-1">
                  Sort by WHEN REVIEWED <span className="text-xs">▼</span>
                </button>
                <button className="text-sm text-sky-600 hover:text-sky-800">
                  👁️
                </button>
              </div>
            </div>

            {/* Reviews List */}
            <div className="divide-y divide-cyan-300/20">
              {recentReviews.map((review) => (
                <div key={review.id} className="px-6 py-6 hover:bg-cyan-50/30 transition-colors">
                  <div className="flex gap-6">
                    {/* Movie Poster */}
                    <div className="flex-shrink-0">
                      <div className="w-28 h-40 glass rounded-xl overflow-hidden flex items-center justify-center">
                        <span className="text-sky-600 text-sm">Poster</span>
                      </div>
                    </div>

                    {/* Review Content */}
                    <div className="flex-1">
                      {/* Movie Title and Year */}
                      <div className="mb-3">
                        <h3 className="text-2xl font-bold text-sky-800 inline">
                          {review.movieTitle}
                        </h3>
                        {review.movieYear && (
                          <span className="text-xl text-sky-600 ml-2">{review.movieYear}</span>
                        )}
                      </div>

                      {/* Watched Status and Rating */}
                      <div className="flex items-center gap-3 mb-3">
                        {review.isLiked && (
                          <span className="text-orange-500 text-xl">🧡</span>
                        )}
                        <span className="text-sky-600">
                          Watched <span className="text-sky-500">{review.watchedDate}</span>
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
                        <p className="text-sky-700 text-base leading-relaxed mb-4">
                          {review.reviewText}
                        </p>
                      )}

                      {/* Likes Count */}
                      <div className="flex items-center gap-2 text-sky-600">
                        <span className="text-sky-500">❤️</span>
                        <span className="text-sm">{review.likes} likes</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* End of Reviews */}
            <div className="px-6 py-8 text-center border-t border-cyan-300/30">
              <p className="text-sky-500 text-sm">End of reviews</p>
            </div>
          </div>
        )}

        {activeTab === 'lists' && (
          <div className="glass-strong rounded-2xl shadow-xl">
            {/* Lists Header */}
            <div className="border-b border-cyan-300/30 px-6 py-4">
              <h2 className="text-2xl font-bold text-sky-800 uppercase tracking-wide">Lists</h2>
            </div>

            {/* Lists Grid */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {lists.map((list) => (
                  <div
                    key={list.id}
                    className="glass rounded-xl p-6 hover:ring-2 hover:ring-cyan-400/50 transition-all cursor-pointer"
                  >
                    {/* List Header */}
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-sky-800 mb-2">{list.title}</h3>
                      <p className="text-sm text-sky-600 mb-3">{list.description}</p>
                      <div className="flex items-center justify-between text-xs text-sky-500">
                        <span>{list.movieCount} films</span>
                        <span>{list.createdAt}</span>
                      </div>
                    </div>

                    {/* Movie Thumbnails */}
                    <div className="flex gap-2 mb-4">
                      {list.movies.slice(0, 4).map((movie) => (
                        <div
                          key={movie.id}
                          className="w-16 h-24 glass rounded-lg flex items-center justify-center flex-shrink-0"
                          title={`${movie.title} (${movie.year})`}
                        >
                          <span className="text-sky-600 text-xs text-center px-1">📽️</span>
                        </div>
                      ))}
                      {list.movies.length > 4 && (
                        <div className="w-16 h-24 glass rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-sky-500 text-xs">+{list.movies.length - 4}</span>
                        </div>
                      )}
                    </div>

                    {/* Likes */}
                    <div className="flex items-center gap-2 text-sky-600">
                      <span className="text-sky-500">❤️</span>
                      <span className="text-sm">{list.likes} likes</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'friends' && (
          <div className="glass-strong rounded-2xl shadow-xl">
            {/* Friends Header */}
            <div className="border-b border-cyan-300/30 px-6 py-4">
              <h2 className="text-2xl font-bold text-sky-800 uppercase tracking-wide">Friends</h2>
            </div>

            {/* Friends Grid */}
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {friends.map((friend) => (
                  <div
                    key={friend.id}
                    className="glass rounded-xl p-4 hover:ring-2 hover:ring-cyan-400/50 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      {/* Friend Profile Picture */}
                      <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-cyan-400 to-teal-400 rounded-full flex items-center justify-center ring-2 ring-cyan-300/50">
                        <span className="text-2xl text-white">☺</span>
                      </div>

                      {/* Friend Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-sky-800 truncate">{friend.username}</h3>
                        <p className="text-sm text-sky-600 mb-1">{friend.followers} followers</p>
                        <p className="text-xs text-sky-500 truncate">{friend.bio}</p>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="mt-4 flex gap-2">
                      <button className="flex-1 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-all shadow-lg hover:shadow-xl glow-soft">
                        View Profile
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
