"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import ReviewForm from '@/components/ReviewForm';
import ReviewCard from '@/components/ReviewCard';

interface Review {
  id: string;
  title?: string;
  content: string;
  rating: number;
  createdAt: string | Date;
  user: {
    id: string;
    username: string;
    profilePicture: string;
  };
  mediaType: 'movie' | 'game' | 'tv' | null;
  media: {
    id: string;
    title: string;
    year?: number | null;
    posterUrl?: string | null;
  } | null;
  likesCount: number;
  isLiked: boolean;
  comments: Array<{
    id: string;
    content: string;
    createdAt: string | Date;
    user: {
      id: string;
      username: string;
      profilePicture: string;
    };
  }>;
}

export default function ReviewsPage() {
  const { data: session, status } = useSession();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchPosterUrls = async (reviews: Review[]) => {
    // Group reviews by media type
    const games: { id: string; title: string }[] = [];
    const movies: { id: string; title: string }[] = [];
    const tvShows: { id: string; title: string }[] = [];

    reviews.forEach((review) => {
      if (review.media) {
        if (review.mediaType === 'game') {
          games.push({ id: review.media.id, title: review.media.title });
        } else if (review.mediaType === 'movie') {
          movies.push({ id: review.media.id, title: review.media.title });
        } else if (review.mediaType === 'tv') {
          tvShows.push({ id: review.media.id, title: review.media.title });
        }
      }
    });

    // Fetch poster URLs in parallel
    const [gameDetails, movieDetails, tvDetails] = await Promise.all([
      games.length > 0
        ? fetch(`/api/games/details?ids=${games.map(g => g.id).join(',')}&titles=${encodeURIComponent(games.map(g => g.title).join(','))}`)
            .then((res) => res.json())
            .then((data) => data.games || {})
            .catch(() => ({}))
        : Promise.resolve({}),
      movies.length > 0
        ? fetch(`/api/movies/details?titles=${encodeURIComponent(movies.map(m => m.title).join(','))}`)
            .then((res) => res.json())
            .then((data) => data.movies || {})
            .catch(() => ({}))
        : Promise.resolve({}),
      tvShows.length > 0
        ? fetch(`/api/tv/details?titles=${encodeURIComponent(tvShows.map(t => t.title).join(','))}`)
            .then((res) => res.json())
            .then((data) => data.shows || {})
            .catch(() => ({}))
        : Promise.resolve({}),
    ]);

    // Update reviews with poster URLs
    return reviews.map((review) => {
      if (!review.media) return review;

      let posterUrl: string | null = null;
      if (review.mediaType === 'game') {
        const details = gameDetails[review.media.id] || gameDetails[review.media.title];
        posterUrl = details?.cover || null;
      } else if (review.mediaType === 'movie') {
        const details = movieDetails[review.media.id] || movieDetails[review.media.title];
        posterUrl = details?.poster || null;
      } else if (review.mediaType === 'tv') {
        const details = tvDetails[review.media.id] || tvDetails[review.media.title];
        posterUrl = details?.poster || null;
      }

      return {
        ...review,
        media: {
          ...review.media,
          posterUrl,
        },
      };
    });
  };

  const fetchReviews = async () => {
    try {
      const response = await fetch('/api/reviews');
      if (response.ok) {
        const data = await response.json();
        const reviewsWithPosters = await fetchPosterUrls(data.reviews || []);
        setReviews(reviewsWithPosters);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchReviews();
    }
  }, [status]);

  const handleSubmitReview = async (reviewData: {
    mediaType: 'movie' | 'game' | 'tv';
    mediaId: string;
    mediaTitle: string;
    rating: number;
    title?: string;
    content: string;
  }) => {
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData),
      });

      if (response.ok) {
        const data = await response.json();
        // Ensure the review has all required fields with defaults
        const newReview: Review = {
          ...data.review,
          comments: data.review.comments || [],
          likesCount: data.review.likesCount || 0,
          isLiked: data.review.isLiked || false,
        };
        // Add the new review to the list
        setReviews([newReview, ...reviews]);
        setShowForm(false);
      } else {
        let errorData;
        try {
          const text = await response.text();
          errorData = text ? JSON.parse(text) : { error: `HTTP ${response.status}: ${response.statusText}` };
        } catch {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        console.error('API error response:', errorData);
        throw new Error(errorData.error || 'Failed to create review');
      }
    } catch (error) {
      console.error('Error creating review:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to create review: ${errorMessage}`);
      throw error;
    }
  };

  const handleLike = async (reviewId: string) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}/like`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        // Update the review in the list
        setReviews(
          reviews.map((r) =>
            r.id === reviewId
              ? {
                  ...r,
                  isLiked: data.liked,
                  likesCount: data.likesCount,
                }
              : r
          )
        );
      } else {
        throw new Error('Failed to like review');
      }
    } catch (error) {
      console.error('Error liking review:', error);
      throw error;
    }
  };

  const handleComment = async (reviewId: string, content: string) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update the review with the new comment
        setReviews(
          reviews.map((r) =>
            r.id === reviewId
              ? {
                  ...r,
                  comments: [...r.comments, data.comment],
                }
              : r
          )
        );
      } else {
        throw new Error('Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-300 via-cyan-200 to-teal-300">
        <div className="text-xl text-gray-900">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-300 via-cyan-200 to-teal-300">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-gray-900">
            Please sign in to view reviews
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-300 via-cyan-200 to-teal-300">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent drop-shadow-md mb-4">
            Reviews
          </h1>
          <p className="text-gray-700 text-lg">
            Share your thoughts on movies, TV shows, and games
          </p>
        </div>

        {/* Toggle Form Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-bold py-3 px-6 rounded-lg hover:from-cyan-600 hover:to-teal-600 transition-all shadow-lg"
          >
            {showForm ? 'Cancel' : 'Write a Review'}
          </button>
        </div>

        {/* Review Form */}
        {showForm && (
          <ReviewForm onSubmit={handleSubmitReview} />
        )}

        {/* Reviews List */}
        <div>
          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-600">Loading reviews...</div>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12 glass-strong rounded-3xl shadow-xl p-8">
              <div className="text-gray-600 text-lg mb-4">No reviews yet</div>
              <p className="text-gray-500">
                Be the first to share your thoughts!
              </p>
            </div>
          ) : (
            reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                onLike={handleLike}
                onComment={handleComment}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

