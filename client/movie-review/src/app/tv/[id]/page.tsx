"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Header from '@/components/Header';
import Link from 'next/link';

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
}

export default function TVShowDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const tvId = params.id as string;
  const [show, setShow] = useState<any>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ title: '', content: '', rating: 5 });

  useEffect(() => {
    if (tvId) {
      loadShowDetails();
      loadReviews();
    }
  }, [tvId]);

  const loadShowDetails = async () => {
    try {
      // Extract ID (remove tv- prefix if present)
      const actualId = tvId.startsWith('tv-') ? tvId.replace('tv-', '') : tvId;

      const response = await fetch(`/api/tvshows/omdb/${actualId}`);

      if (response.ok) {
        const data = await response.json();
        if (data.show) {
          setShow(data.show);
        }
      }
    } catch (error) {
      console.error('Failed to load TV show:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    try {
      const actualId = tvId.startsWith('tv-') ? tvId.replace('tv-', '') : tvId;
      const response = await fetch(`/api/reviews/list?tvShowId=${actualId}`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
      }
    } catch (error) {
      console.error('Failed to load reviews:', error);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) {
      router.push('/auth/signin');
      return;
    }

    try {
      // For OMDB TV shows, create local entry if needed
      let finalTvShowId: string | null = null;
      const actualId = tvId.startsWith('tv-') ? tvId.replace('tv-', '') : tvId;

      const createResponse = await fetch('/api/tvshows/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: show?.title,
          releaseYear: show?.year ? parseInt(show.year) : null,
          genre: show?.genre,
          creator: show?.creator,
          omdbId: actualId,
        }),
      });
      if (createResponse.ok) {
        const createData = await createResponse.json();
        finalTvShowId = createData.tvShow.id;
      } else {
        const findResponse = await fetch(`/api/tvshows/find?title=${encodeURIComponent(show?.title || '')}`);
        if (findResponse.ok) {
          const findData = await findResponse.json();
          if (findData.tvShow) {
            finalTvShowId = findData.tvShow.id;
          }
        }
      }

      if (!finalTvShowId) {
        alert('Could not create review. Please try again.');
        return;
      }

      const response = await fetch('/api/reviews/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...reviewForm,
          tvShowId: finalTvShowId,
        }),
      });

      if (response.ok) {
        setShowReviewForm(false);
        setReviewForm({ title: '', content: '', rating: 5 });
        await loadReviews();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to create review');
      }
    } catch (error) {
      console.error('Create review error:', error);
      alert('Failed to create review');
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`text-xl ${i < rating ? 'text-yellow-500' : 'text-gray-300'}`}>
        ★
      </span>
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!show) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center py-20">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">TV Show Not Found</h1>
            <button
              onClick={() => router.push('/search')}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
            >
              Search TV Shows
            </button>
          </div>
        </div>
      </div>
    );
  }

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* TV Show Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6 border border-gray-100">
          <div className="flex gap-8">
            <div className="flex-shrink-0">
              <div className="w-64 h-96 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg overflow-hidden shadow-xl">
                {show.poster && show.poster !== 'N/A' ? (
                  <img src={show.poster} alt={show.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-6xl">📺</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{show.title}</h1>
              <div className="flex items-center gap-4 mb-4">
                {show.year && <span className="text-lg text-gray-600">{show.year}</span>}
                {show.genre && <span className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full">{show.genre}</span>}
                {show.creator && <span className="text-sm text-gray-600">Creator: {show.creator}</span>}
              </div>
              {averageRating > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2">
                    {renderStars(Math.round(averageRating))}
                    <span className="text-lg font-semibold text-gray-900">
                      {averageRating.toFixed(1)} ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
                    </span>
                  </div>
                </div>
              )}
              {show.plot && (
                <p className="text-gray-700 mb-4 leading-relaxed">{show.plot}</p>
              )}
              {session?.user?.id && (
                <button
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                  {showReviewForm ? 'Cancel' : 'Write Review'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Review Form */}
        {showReviewForm && session?.user?.id && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Write a Review</h2>
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title (optional)</label>
                <input
                  type="text"
                  value={reviewForm.title}
                  onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Review title..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                <select
                  value={reviewForm.rating}
                  onChange={(e) => setReviewForm({ ...reviewForm, rating: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  {[5, 4, 3, 2, 1].map(r => (
                    <option key={r} value={r}>{r} stars</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Review</label>
                <textarea
                  value={reviewForm.content}
                  onChange={(e) => setReviewForm({ ...reviewForm, content: e.target.value })}
                  rows={6}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Share your thoughts..."
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                Submit Review
              </button>
            </form>
          </div>
        )}

        {/* Reviews Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Reviews ({reviews.length})
          </h2>
          {reviews.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No reviews yet. Be the first to review!</p>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-200 pb-6 last:border-0 last:pb-0">
                  <div className="flex items-start gap-4 mb-3">
                    <Link href={`/profile/${review.user.username}`}>
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center overflow-hidden cursor-pointer">
                        {review.user.profilePicture && review.user.profilePicture !== '/default.jpg' ? (
                          <img src={review.user.profilePicture} alt={review.user.username} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xl text-white">👤</span>
                        )}
                      </div>
                    </Link>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Link href={`/profile/${review.user.username}`}>
                          <span className="font-bold text-gray-900 hover:text-indigo-600 cursor-pointer">
                            {review.user.username}
                          </span>
                        </Link>
                        <div className="flex items-center">
                          {renderStars(review.rating)}
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {review.title && (
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{review.title}</h3>
                      )}
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{review.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

