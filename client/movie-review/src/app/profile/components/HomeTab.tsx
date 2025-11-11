"use client";

interface User {
  username: string;
  bio: string | null;
  profilePicture: string;
  followersCount: number;
}

interface HomeTabProps {
  user: User;
}

export default function HomeTab({ user }: HomeTabProps) {
  const recentActivity = [
    { id: 1, type: 'movie', title: 'Inception', image: '/placeholder-movie.jpg' },
    { id: 2, type: 'movie', title: 'The Matrix', image: '/placeholder-movie.jpg' },
  ];

  const recentReviews = [
    {
      id: 1,
      movieTitle: 'Inception',
      movieImage: '/placeholder-movie.jpg',
      rating: 2.5,
      reviewText: 'An incredible mind-bending thriller that keeps you guessing until the very end. Christopher Nolan delivers another masterpiece.',
      createdAt: '2 days ago',
    },
    {
      id: 2,
      movieTitle: 'The Shawshank Redemption',
      movieImage: '/placeholder-movie.jpg',
      rating: 5.0,
      reviewText: 'A timeless classic about hope, friendship, and redemption. Morgan Freeman and Tim Robbins deliver unforgettable performances.',
      createdAt: '1 week ago',
    },
  ];

  const friends = [
    { id: 1, username: 'moviefan22', followers: 145, profilePicture: '/default.jpg' },
    { id: 2, username: 'cinephile', followers: 230, profilePicture: '/default.jpg' },
    { id: 3, username: 'filmcritic', followers: 512, profilePicture: '/default.jpg' },
    { id: 4, username: 'popculture', followers: 89, profilePicture: '/default.jpg' },
  ];

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
            {recentReviews.map((review) => (
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
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{review.movieTitle}</h3>
                  <div className="flex items-center gap-2 mb-3">
                    {renderStars(review.rating)}
                    <span className="text-gray-500 text-sm ml-2">{review.createdAt}</span>
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
  );
}