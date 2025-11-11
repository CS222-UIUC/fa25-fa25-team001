"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  username: string;
  profilePicture: string;
}

interface ReviewsTabProps {
  user: User;
}

interface Review {
  id: string;
  title?: string;
  content: string;
  rating: number;
  createdAt: string;
  user: {
    id: string;
    username: string;
    profilePicture: string;
  };
  movie?: { id: string; title: string };
  videoGame?: { id: string; title: string };
  tvShow?: { id: string; title: string };
}

export default function ReviewsTab({ user }: ReviewsTabProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('recent');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);

  useEffect(() => {
    loadReviews();
  }, [user.id, sortBy]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/reviews/list?userId=${user.id}&limit=50`);
      if (response.ok) {
        const data = await response.json();
        let sortedReviews = data.reviews || [];
        
        // Sort reviews
        if (sortBy === 'highest') {
          sortedReviews.sort((a: Review, b: Review) => b.rating - a.rating);
        } else if (sortBy === 'lowest') {
          sortedReviews.sort((a: Review, b: Review) => a.rating - b.rating);
        }
        // 'recent' is default (already sorted by createdAt desc)
        
        setReviews(sortedReviews);
      }
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) {
      return;
    }

    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setReviews(reviews.filter(r => r.id !== reviewId));
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete review');
      }
    } catch (error) {
      console.error('Delete review error:', error);
      alert('Failed to delete review');
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={`text-xl ${i < rating ? 'text-yellow-500' : 'text-gray-300'}`}
      >
        ★
      </span>
    ));
  };

  const getMediaTitle = (review: Review) => {
    return review.movie?.title || review.videoGame?.title || review.tvShow?.title || 'Unknown';
  };

  const getMediaType = (review: Review) => {
    if (review.movie) return 'movie';
    if (review.videoGame) return 'game';
    if (review.tvShow) return 'tv';
    return 'unknown';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isOwnProfile = session?.user?.id === user.id;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {isOwnProfile ? 'My' : `${user.username}'s`} Reviews ({reviews.length})
          </h2>
          {isOwnProfile && (
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="recent">Most Recent</option>
                <option value="highest">Highest Rated</option>
                <option value="lowest">Lowest Rated</option>
              </select>
              <button
                onClick={() => router.push('/search?q=')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Write Review
              </button>
            </div>
          )}
        </div>

        {reviews.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              {isOwnProfile ? "You haven't written any reviews yet." : `${user.username} hasn't written any reviews yet.`}
            </p>
            {isOwnProfile && (
              <button
                onClick={() => router.push('/search?q=')}
                className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium"
              >
                Write Your First Review
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="border border-gray-200 rounded-lg p-6 hover:border-indigo-300 transition-colors bg-white"
              >
                <div className="flex gap-6">
                  {/* Media Info */}
                  <div className="flex-shrink-0">
                    <div className="w-24 h-36 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm text-center px-2">
                      {getMediaTitle(review)}
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center capitalize">
                      {getMediaType(review)}
                    </p>
                  </div>

                  {/* Review Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {review.title || getMediaTitle(review)}
                        </h3>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex items-center">
                            {renderStars(review.rating)}
                          </div>
                          <span className="text-gray-500 text-sm">{formatDate(review.createdAt)}</span>
                        </div>
                      </div>
                      {isOwnProfile && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDeleteReview(review.id)}
                            className="text-red-600 hover:text-red-700 text-sm"
                            title="Delete review"
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </div>

                    <p className="text-gray-700 leading-relaxed mb-4 whitespace-pre-wrap">
                      {review.content}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="capitalize">{getMediaType(review)}</span>
                      <span>•</span>
                      <span>{review.rating}/5 stars</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
